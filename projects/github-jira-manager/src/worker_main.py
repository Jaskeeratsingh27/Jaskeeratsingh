import argparse
import json
import os
import signal
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Optional

from control_plane import ReconciliationEvidence, ReconciliationEventType
from durable_runtime import DurableRuntime
from outbox_worker import OutboxWorker
from provider_auth import (
    CompositeSecretStore,
    EncryptedFileSecretStore,
    JiraOAuthTokenProvider,
)
from provider_clients import JiraClient
from runtime_store import RuntimeStore
from webhooks import (
    WebhookAuthError,
    WebhookPayloadError,
    WebhookReceiver,
)


MAX_WEBHOOK_BYTES = 2 * 1024 * 1024


def require_env(name: str) -> str:
    value = os.environ.get(name, "")
    if not value:
        raise RuntimeError(f"required environment variable is missing: {name}")
    return value


def build_store() -> RuntimeStore:
    db_path = os.environ.get("CONTROL_PLANE_DB_PATH", "/data/control-plane.db")
    return RuntimeStore(db_path)


def build_receiver() -> WebhookReceiver:
    return WebhookReceiver(
        github_secret=require_env("GITHUB_WEBHOOK_SECRET"),
        jira_secret=require_env("JIRA_WEBHOOK_SECRET"),
    )


def jira_credentials_ready() -> bool:
    required = [
        "CONTROL_PLANE_SECRET_KEY",
        "JIRA_OAUTH_CLIENT_ID",
        "JIRA_OAUTH_CLIENT_SECRET",
        "JIRA_CLOUD_ID",
    ]
    refresh_path = os.environ.get(
        "CONTROL_PLANE_ROTATING_SECRETS_PATH",
        "/data/rotating-secrets.enc",
    )
    refresh_ready = bool(os.environ.get("JIRA_OAUTH_REFRESH_TOKEN")) or os.path.exists(
        refresh_path
    )
    return all(bool(os.environ.get(name)) for name in required) and refresh_ready


def build_worker(store: RuntimeStore) -> Optional[OutboxWorker]:
    if not jira_credentials_ready():
        return None

    secret_path = os.environ.get(
        "CONTROL_PLANE_ROTATING_SECRETS_PATH",
        "/data/rotating-secrets.enc",
    )
    encryption_key = require_env("CONTROL_PLANE_SECRET_KEY")
    bootstrap_refresh = os.environ.get("JIRA_OAUTH_REFRESH_TOKEN")

    rotating = EncryptedFileSecretStore(
        secret_path,
        encryption_key,
        bootstrap=(
            {"JIRA_OAUTH_REFRESH_TOKEN": bootstrap_refresh}
            if bootstrap_refresh
            else None
        ),
    )
    secrets = CompositeSecretStore(static={}, rotating=rotating)
    jira_tokens = JiraOAuthTokenProvider(
        client_id=require_env("JIRA_OAUTH_CLIENT_ID"),
        client_secret=require_env("JIRA_OAUTH_CLIENT_SECRET"),
        secrets=secrets,
    )
    jira = JiraClient(
        cloud_id=require_env("JIRA_CLOUD_ID"),
        token_provider=jira_tokens,
    )
    return OutboxWorker(
        store,
        jira,
        max_attempts=int(os.environ.get("WORKER_MAX_ATTEMPTS", "5")),
        base_backoff_seconds=int(os.environ.get("WORKER_BASE_BACKOFF_SECONDS", "30")),
        max_backoff_seconds=int(os.environ.get("WORKER_MAX_BACKOFF_SECONDS", "900")),
    )


def evidence_for(inbound) -> ReconciliationEvidence:
    event_type = inbound.reconciliation_event_type
    if event_type == ReconciliationEventType.CI_PASSED:
        return ReconciliationEvidence(ci_pass=True)
    if event_type == ReconciliationEventType.CI_FAILED:
        return ReconciliationEvidence(ci_pass=False)
    # Review/merge events remain conservative until independent QA/human approval
    # evidence is explicitly persisted by a later control-plane action.
    return ReconciliationEvidence()


class ServiceContext:
    def __init__(
        self,
        store: RuntimeStore,
        receiver: WebhookReceiver,
        worker: Optional[OutboxWorker],
    ) -> None:
        self.store = store
        self.runtime = DurableRuntime(store)
        self.receiver = receiver
        self.worker = worker


def handler_factory(context: ServiceContext):
    class Handler(BaseHTTPRequestHandler):
        server_version = "GitHubJiraManager/1.4.1"

        def log_message(self, fmt, *args):
            print(f"http {self.address_string()} {fmt % args}", flush=True)

        def _json(self, status: int, payload: dict) -> None:
            raw = json.dumps(payload, sort_keys=True).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(raw)))
            self.end_headers()
            self.wfile.write(raw)

        def _body(self) -> bytes:
            length_raw = self.headers.get("Content-Length", "0")
            try:
                length = int(length_raw)
            except ValueError as exc:
                raise WebhookPayloadError("invalid Content-Length") from exc
            if length < 0 or length > MAX_WEBHOOK_BYTES:
                raise WebhookPayloadError("webhook body exceeds size limit")
            return self.rfile.read(length)

        def do_GET(self):
            if self.path == "/health":
                self._json(
                    200,
                    {
                        "status": "ok",
                        "version": "1.4.1",
                        "runtime": "railway",
                    },
                )
                return

            if self.path == "/status":
                self._json(
                    200,
                    {
                        "status": "ok",
                        "jira_worker_ready": context.worker is not None,
                        "store": context.store.counts(),
                    },
                )
                return

            self._json(404, {"error": "not found"})

        def do_POST(self):
            try:
                payload = self._body()
                headers = {key: value for key, value in self.headers.items()}

                if self.path == "/webhooks/github":
                    inbound = context.receiver.receive_github(headers, payload)
                elif self.path == "/webhooks/jira":
                    inbound = context.receiver.receive_jira(headers, payload)
                else:
                    self._json(404, {"error": "not found"})
                    return

                result = context.runtime.ingest(
                    inbound,
                    evidence_for(inbound),
                )
                self._json(
                    202,
                    {
                        "event_id": result.event_id,
                        "duplicate": result.duplicate,
                        "resumed": result.resumed,
                        "ignored": result.ignored,
                        "decision": result.decision,
                    },
                )
            except WebhookAuthError as exc:
                self._json(401, {"error": str(exc)})
            except WebhookPayloadError as exc:
                self._json(400, {"error": str(exc)})
            except Exception as exc:
                print(f"webhook_error={type(exc).__name__}: {exc}", flush=True)
                self._json(500, {"error": "internal error"})

    return Handler


def worker_loop(
    worker: Optional[OutboxWorker],
    stopping: threading.Event,
    interval: float,
) -> None:
    if worker is None:
        print(
            "jira_worker_ready=false credential_gate=JIRA_OAUTH",
            flush=True,
        )
        while not stopping.wait(interval):
            pass
        return

    print("jira_worker_ready=true", flush=True)
    while not stopping.is_set():
        try:
            summary = worker.drain_once()
            if summary.completed or summary.retried or summary.dead_lettered:
                print(
                    f"completed={summary.completed} retried={summary.retried} "
                    f"dead_lettered={summary.dead_lettered}",
                    flush=True,
                )
        except Exception as exc:
            print(f"worker_error={type(exc).__name__}: {exc}", flush=True)
        stopping.wait(interval)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true")
    parser.add_argument(
        "--interval",
        type=float,
        default=float(os.environ.get("WORKER_POLL_SECONDS", "5")),
    )
    args = parser.parse_args()

    store = build_store()
    receiver = build_receiver()
    worker = build_worker(store)

    if args.once:
        if worker is None:
            print("jira_worker_ready=false")
            store.close()
            return 2
        summary = worker.drain_once()
        print(
            f"completed={summary.completed} retried={summary.retried} "
            f"dead_lettered={summary.dead_lettered}"
        )
        store.close()
        return 0

    context = ServiceContext(store, receiver, worker)
    stopping = threading.Event()
    port = int(os.environ.get("PORT", "3000"))
    server = ThreadingHTTPServer(("0.0.0.0", port), handler_factory(context))

    def stop(*_):
        stopping.set()
        server.shutdown()

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)

    thread = threading.Thread(
        target=worker_loop,
        args=(worker, stopping, args.interval),
        daemon=True,
    )
    thread.start()

    print(
        f"http_ready=true port={port} jira_worker_ready={str(worker is not None).lower()}",
        flush=True,
    )

    try:
        server.serve_forever(poll_interval=0.5)
        return 0
    finally:
        stopping.set()
        thread.join(timeout=5)
        server.server_close()
        store.close()


if __name__ == "__main__":
    sys.exit(main())
