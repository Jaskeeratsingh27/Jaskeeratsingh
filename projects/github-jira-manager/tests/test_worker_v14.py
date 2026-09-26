import json
import pathlib
import sys
import threading
import time
import unittest
from datetime import datetime, timedelta, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer
from tempfile import TemporaryDirectory

import jwt
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from control_plane import (  # noqa: E402
    ReconciliationDecision,
    ReconciliationEvidence,
    ReconciliationEventType,
)
from durable_runtime import DurableRuntime  # noqa: E402
from outbox_worker import OutboxWorker  # noqa: E402
from provider_auth import (  # noqa: E402
    EncryptedFileSecretStore,
    GitHubAppTokenProvider,
    JiraOAuthTokenProvider,
    MemorySecretStore,
)
from provider_clients import GitHubClient, JiraClient  # noqa: E402
from runtime_store import RuntimeStore  # noqa: E402
from webhooks import NormalizedWebhookEvent  # noqa: E402


class FakeProviderState:
    def __init__(self):
        self.github_public_key = None
        self.github_install_token = "ghs_test_installation_token"
        self.jira_refresh_token = "jira-refresh-1"
        self.jira_access_token = "jira-access-1"
        self.jira_refresh_counter = 1
        self.issue_status = {"SCRUM-99": "To Do"}
        self.labels = {"SCRUM-99": set()}
        self.transition_posts = 0
        self.label_puts = 0
        self.fail_next_label = False
        self.repo_reads = 0


class FakeProviderHandler(BaseHTTPRequestHandler):
    state: FakeProviderState = None

    def log_message(self, format, *args):
        return

    def _json(self):
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b"{}"
        return json.loads(raw.decode("utf-8"))

    def _send(self, status, payload=None):
        raw = json.dumps(payload or {}).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _jira_authorized(self):
        return self.headers.get("Authorization") == f"Bearer {self.state.jira_access_token}"

    def do_POST(self):
        if self.path == "/app/installations/42/access_tokens":
            auth = self.headers.get("Authorization", "")
            if not auth.startswith("Bearer "):
                self._send(401, {"error": "missing app jwt"})
                return
            app_jwt = auth.removeprefix("Bearer ")
            claims = jwt.decode(
                app_jwt,
                self.state.github_public_key,
                algorithms=["RS256"],
                options={"verify_aud": False},
            )
            if str(claims.get("iss")) != "1234":
                self._send(401, {"error": "wrong issuer"})
                return
            expires = datetime.now(timezone.utc) + timedelta(hours=1)
            self._send(
                201,
                {
                    "token": self.state.github_install_token,
                    "expires_at": expires.isoformat().replace("+00:00", "Z"),
                },
            )
            return

        if self.path == "/oauth/token":
            body = self._json()
            if body.get("grant_type") != "refresh_token":
                self._send(400, {"error": "wrong grant"})
                return
            if body.get("refresh_token") != self.state.jira_refresh_token:
                self._send(403, {"error": "invalid_grant"})
                return
            self.state.jira_refresh_counter += 1
            self.state.jira_access_token = f"jira-access-{self.state.jira_refresh_counter}"
            self.state.jira_refresh_token = f"jira-refresh-{self.state.jira_refresh_counter}"
            self._send(
                200,
                {
                    "access_token": self.state.jira_access_token,
                    "refresh_token": self.state.jira_refresh_token,
                    "expires_in": 3600,
                    "scope": "read:jira-work write:jira-work",
                },
            )
            return

        if self.path.endswith("/issue/SCRUM-99/transitions"):
            if not self._jira_authorized():
                self._send(401, {"error": "unauthorized"})
                return
            body = self._json()
            transition_id = str((body.get("transition") or {}).get("id") or "")
            if transition_id != "21":
                self._send(400, {"error": "bad transition"})
                return
            self.state.issue_status["SCRUM-99"] = "In Progress"
            self.state.transition_posts += 1
            self._send(204, {})
            return

        self._send(404, {"error": self.path})

    def do_GET(self):
        if self.path == "/repos/me/repo":
            if self.headers.get("Authorization") != f"Bearer {self.state.github_install_token}":
                self._send(401, {"error": "unauthorized"})
                return
            self.state.repo_reads += 1
            self._send(200, {"full_name": "me/repo"})
            return

        if self.path.startswith("/ex/jira/cloud/rest/api/3/issue/SCRUM-99?fields=status"):
            if not self._jira_authorized():
                self._send(401, {"error": "unauthorized"})
                return
            self._send(
                200,
                {"fields": {"status": {"name": self.state.issue_status["SCRUM-99"]}}},
            )
            return

        if self.path == "/ex/jira/cloud/rest/api/3/issue/SCRUM-99/transitions":
            if not self._jira_authorized():
                self._send(401, {"error": "unauthorized"})
                return
            self._send(
                200,
                {"transitions": [{"id": "21", "name": "In Progress"}]},
            )
            return

        self._send(404, {"error": self.path})

    def do_PUT(self):
        if self.path == "/ex/jira/cloud/rest/api/3/issue/SCRUM-99":
            if not self._jira_authorized():
                self._send(401, {"error": "unauthorized"})
                return
            if self.state.fail_next_label:
                self.state.fail_next_label = False
                self._send(503, {"error": "temporary outage"})
                return
            body = self._json()
            for change in (body.get("update") or {}).get("labels", []):
                if "add" in change:
                    self.state.labels["SCRUM-99"].add(change["add"])
                if "remove" in change:
                    self.state.labels["SCRUM-99"].discard(change["remove"])
            self.state.label_puts += 1
            self._send(204, {})
            return

        self._send(404, {"error": self.path})


class ProviderServer:
    def __init__(self):
        self.state = FakeProviderState()
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        self.private_pem = private_key.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        ).decode("utf-8")
        self.state.github_public_key = private_key.public_key().public_bytes(
            serialization.Encoding.PEM,
            serialization.PublicFormat.SubjectPublicKeyInfo,
        )
        handler = type("BoundHandler", (FakeProviderHandler,), {})
        handler.state = self.state
        self.server = HTTPServer(("127.0.0.1", 0), handler)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)

    @property
    def base(self):
        host, port = self.server.server_address
        return f"http://{host}:{port}"

    def __enter__(self):
        self.thread.start()
        return self

    def __exit__(self, exc_type, exc, tb):
        self.server.shutdown()
        self.thread.join(timeout=5)
        self.server.server_close()


class SecretStoreTests(unittest.TestCase):
    def test_rotating_secret_is_encrypted_and_survives_restart(self):
        with TemporaryDirectory() as tmp:
            path = str(pathlib.Path(tmp) / "rotating.enc")
            key = Fernet.generate_key().decode("utf-8")
            store = EncryptedFileSecretStore(
                path,
                key,
                bootstrap={"JIRA_OAUTH_REFRESH_TOKEN": "refresh-one"},
            )
            self.assertNotIn(b"refresh-one", pathlib.Path(path).read_bytes())
            store.set("JIRA_OAUTH_REFRESH_TOKEN", "refresh-two")
            self.assertNotIn(b"refresh-two", pathlib.Path(path).read_bytes())

            reopened = EncryptedFileSecretStore(path, key)
            self.assertEqual(
                reopened.get("JIRA_OAUTH_REFRESH_TOKEN"),
                "refresh-two",
            )


class AuthIntegrationTests(unittest.TestCase):
    def test_github_app_installation_token_and_repo_call(self):
        with ProviderServer() as provider:
            secrets = MemorySecretStore(
                {"GITHUB_APP_PRIVATE_KEY": provider.private_pem}
            )
            tokens = GitHubAppTokenProvider(
                app_id="1234",
                installation_id="42",
                secrets=secrets,
                api_base=provider.base,
            )
            client = GitHubClient(tokens, api_base=provider.base)
            repo = client.get_repository("me", "repo")
            self.assertEqual(repo["full_name"], "me/repo")
            self.assertEqual(provider.state.repo_reads, 1)

    def test_jira_refresh_token_rotation_is_persisted(self):
        with ProviderServer() as provider:
            secrets = MemorySecretStore(
                {"JIRA_OAUTH_REFRESH_TOKEN": "jira-refresh-1"}
            )
            tokens = JiraOAuthTokenProvider(
                client_id="client",
                client_secret="secret",
                secrets=secrets,
                token_url=f"{provider.base}/oauth/token",
            )
            first = tokens.get_token()
            self.assertEqual(first, "jira-access-2")
            self.assertEqual(
                secrets.get("JIRA_OAUTH_REFRESH_TOKEN"),
                "jira-refresh-2",
            )
            tokens.invalidate()
            second = tokens.get_token()
            self.assertEqual(second, "jira-access-3")
            self.assertEqual(
                secrets.get("JIRA_OAUTH_REFRESH_TOKEN"),
                "jira-refresh-3",
            )


class WorkerIntegrationTests(unittest.TestCase):
    @staticmethod
    def _ci_failed_event():
        return NormalizedWebhookEvent(
            event_id="github:worker-e2e",
            source="github",
            event_type="workflow_run",
            work_item_id="SCRUM-99",
            reconciliation_event_type=ReconciliationEventType.CI_FAILED,
            payload=b'{"action":"completed","conclusion":"failure"}',
        )

    def _jira_client(self, provider, secrets):
        tokens = JiraOAuthTokenProvider(
            client_id="client",
            client_secret="secret",
            secrets=secrets,
            token_url=f"{provider.base}/oauth/token",
        )
        return JiraClient(
            cloud_id="cloud",
            token_provider=tokens,
            api_base=provider.base,
        )

    def test_end_to_end_outbox_drains_into_fake_jira_once(self):
        with ProviderServer() as provider, TemporaryDirectory() as tmp:
            secrets = MemorySecretStore(
                {"JIRA_OAUTH_REFRESH_TOKEN": "jira-refresh-1"}
            )
            db = str(pathlib.Path(tmp) / "runtime.db")
            store = RuntimeStore(db)
            DurableRuntime(store).ingest(
                self._ci_failed_event(),
                ReconciliationEvidence(ci_pass=False),
            )
            self.assertEqual(store.counts()["pending_outbox"], 2)

            worker = OutboxWorker(
                store,
                self._jira_client(provider, secrets),
                time_fn=lambda: 100.0,
            )
            summary = worker.drain_once()
            self.assertEqual(summary.completed, 2)
            self.assertEqual(provider.state.issue_status["SCRUM-99"], "In Progress")
            self.assertIn("ci-blocked", provider.state.labels["SCRUM-99"])
            self.assertEqual(store.counts()["pending_outbox"], 0)
            store.close()

            reopened = RuntimeStore(db)
            worker2 = OutboxWorker(
                reopened,
                self._jira_client(provider, secrets),
                time_fn=lambda: 200.0,
            )
            second = worker2.drain_once()
            self.assertEqual(second.completed, 0)
            self.assertEqual(provider.state.transition_posts, 1)
            self.assertEqual(provider.state.label_puts, 1)
            reopened.close()

    def test_transient_provider_failure_retries_after_backoff(self):
        with ProviderServer() as provider:
            secrets = MemorySecretStore(
                {"JIRA_OAUTH_REFRESH_TOKEN": "jira-refresh-1"}
            )
            store = RuntimeStore(":memory:")
            DurableRuntime(store).ingest(
                self._ci_failed_event(),
                ReconciliationEvidence(ci_pass=False),
            )
            provider.state.fail_next_label = True

            now = [100.0]
            worker = OutboxWorker(
                store,
                self._jira_client(provider, secrets),
                base_backoff_seconds=30,
                time_fn=lambda: now[0],
            )
            first = worker.drain_once()
            self.assertEqual(first.completed, 1)
            self.assertEqual(first.retried, 1)
            self.assertEqual(store.counts()["pending_outbox"], 1)

            immediate = worker.drain_once()
            self.assertEqual(immediate.completed, 0)

            now[0] = 131.0
            recovered = worker.drain_once()
            self.assertEqual(recovered.completed, 1)
            self.assertIn("ci-blocked", provider.state.labels["SCRUM-99"])
            self.assertEqual(store.counts()["pending_outbox"], 0)
            store.close()

    def test_permanent_unknown_operation_dead_letters(self):
        store = RuntimeStore(":memory:")
        store.record_event("github:bad-op", "github", "test", b"{}", "SCRUM-99")
        store.persist_decision_and_outbox(
            "github:bad-op",
            ReconciliationDecision(None, "test"),
            [("github:bad-op:unknown", "unknown.operation", {"work_item_id": "SCRUM-99"})],
        )

        class NeverCalledJira:
            pass

        summary = OutboxWorker(store, NeverCalledJira(), max_attempts=2).drain_once()
        self.assertEqual(summary.dead_lettered, 1)
        record = store.outbox_record("github:bad-op:unknown")
        self.assertEqual(record["status"], "DEAD_LETTER")
        self.assertEqual(store.counts()["dead_letter_outbox"], 1)
        store.close()


if __name__ == "__main__":
    unittest.main()
