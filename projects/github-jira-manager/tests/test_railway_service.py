import hashlib
import hmac
import json
import os
import pathlib
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from runtime_store import RuntimeStore  # noqa: E402
from webhooks import WebhookReceiver  # noqa: E402
from worker_main import (  # noqa: E402
    ServiceContext,
    evidence_for,
    handler_factory,
    jira_credentials_ready,
)


class RailwayServiceTests(unittest.TestCase):
    def test_credentials_missing_keeps_http_runtime_available(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertFalse(jira_credentials_ready())

    def test_health_and_status_work_without_jira_credentials(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = RuntimeStore(str(pathlib.Path(tmp) / "runtime.db"))
            context = ServiceContext(
                store,
                WebhookReceiver("gh-secret", "jira-secret"),
                None,
            )
            server = ThreadingHTTPServer(("127.0.0.1", 0), handler_factory(context))
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            base = f"http://127.0.0.1:{server.server_address[1]}"
            try:
                with urllib.request.urlopen(f"{base}/health") as response:
                    body = json.loads(response.read())
                self.assertEqual(body["status"], "ok")
                self.assertEqual(body["runtime"], "railway")

                with urllib.request.urlopen(f"{base}/status") as response:
                    status = json.loads(response.read())
                self.assertFalse(status["jira_worker_ready"])
                self.assertEqual(status["store"]["events"], 0)
            finally:
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()
                store.close()

    def test_signed_github_webhook_is_persisted(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = RuntimeStore(str(pathlib.Path(tmp) / "runtime.db"))
            context = ServiceContext(
                store,
                WebhookReceiver("gh-secret", "jira-secret"),
                None,
            )
            server = ThreadingHTTPServer(("127.0.0.1", 0), handler_factory(context))
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            base = f"http://127.0.0.1:{server.server_address[1]}"

            payload = json.dumps(
                {
                    "action": "opened",
                    "pull_request": {
                        "title": "SCRUM-18 live adapter",
                        "body": "",
                        "head": {"ref": "SCRUM-18-railway-live-adapter"},
                        "merged": False,
                    },
                }
            ).encode()
            signature = "sha256=" + hmac.new(
                b"gh-secret", payload, hashlib.sha256
            ).hexdigest()

            request = urllib.request.Request(
                f"{base}/webhooks/github",
                data=payload,
                method="POST",
                headers={
                    "Content-Type": "application/json",
                    "X-GitHub-Delivery": "railway-test-1",
                    "X-GitHub-Event": "pull_request",
                    "X-Hub-Signature-256": signature,
                },
            )
            try:
                with urllib.request.urlopen(request) as response:
                    body = json.loads(response.read())
                self.assertEqual(response.status, 202)
                self.assertEqual(body["event_id"], "github:railway-test-1")
                self.assertEqual(store.counts()["events"], 1)
                self.assertEqual(store.counts()["outbox"], 1)
            finally:
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()
                store.close()

    def test_bad_signature_is_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = RuntimeStore(str(pathlib.Path(tmp) / "runtime.db"))
            context = ServiceContext(
                store,
                WebhookReceiver("gh-secret", "jira-secret"),
                None,
            )
            server = ThreadingHTTPServer(("127.0.0.1", 0), handler_factory(context))
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            base = f"http://127.0.0.1:{server.server_address[1]}"
            request = urllib.request.Request(
                f"{base}/webhooks/github",
                data=b"{}",
                method="POST",
                headers={
                    "X-GitHub-Delivery": "railway-test-2",
                    "X-GitHub-Event": "pull_request",
                    "X-Hub-Signature-256": "sha256=bad",
                },
            )
            try:
                with self.assertRaises(urllib.error.HTTPError) as raised:
                    urllib.request.urlopen(request)
                self.assertEqual(raised.exception.code, 401)
                self.assertEqual(store.counts()["events"], 0)
            finally:
                server.shutdown()
                thread.join(timeout=5)
                server.server_close()
                store.close()


if __name__ == "__main__":
    unittest.main()
