import argparse
import os
import signal
import sys
import time

from outbox_worker import OutboxWorker
from provider_auth import (
    CompositeSecretStore,
    EncryptedFileSecretStore,
    JiraOAuthTokenProvider,
)
from provider_clients import JiraClient
from runtime_store import RuntimeStore


def require_env(name: str) -> str:
    value = os.environ.get(name, "")
    if not value:
        raise RuntimeError(f"required environment variable is missing: {name}")
    return value


def build_worker() -> tuple[RuntimeStore, OutboxWorker]:
    db_path = os.environ.get("CONTROL_PLANE_DB_PATH", "/data/control-plane.db")
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
    secrets = CompositeSecretStore(
        static={},
        rotating=rotating,
    )
    jira_tokens = JiraOAuthTokenProvider(
        client_id=require_env("JIRA_OAUTH_CLIENT_ID"),
        client_secret=require_env("JIRA_OAUTH_CLIENT_SECRET"),
        secrets=secrets,
    )
    jira = JiraClient(
        cloud_id=require_env("JIRA_CLOUD_ID"),
        token_provider=jira_tokens,
    )
    store = RuntimeStore(db_path)
    worker = OutboxWorker(
        store,
        jira,
        max_attempts=int(os.environ.get("WORKER_MAX_ATTEMPTS", "5")),
        base_backoff_seconds=int(os.environ.get("WORKER_BASE_BACKOFF_SECONDS", "30")),
        max_backoff_seconds=int(os.environ.get("WORKER_MAX_BACKOFF_SECONDS", "900")),
    )
    return store, worker


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--once", action="store_true")
    parser.add_argument(
        "--interval",
        type=float,
        default=float(os.environ.get("WORKER_POLL_SECONDS", "5")),
    )
    args = parser.parse_args()

    store, worker = build_worker()
    stopping = False

    def stop(*_):
        nonlocal stopping
        stopping = True

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)

    try:
        if args.once:
            summary = worker.drain_once()
            print(
                f"completed={summary.completed} retried={summary.retried} "
                f"dead_lettered={summary.dead_lettered}"
            )
            return 0

        while not stopping:
            summary = worker.drain_once()
            if summary.completed or summary.retried or summary.dead_lettered:
                print(
                    f"completed={summary.completed} retried={summary.retried} "
                    f"dead_lettered={summary.dead_lettered}",
                    flush=True,
                )
            time.sleep(args.interval)
        return 0
    finally:
        store.close()


if __name__ == "__main__":
    sys.exit(main())
