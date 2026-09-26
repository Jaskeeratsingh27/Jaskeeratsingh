import hashlib
import hmac
import json
import pathlib
import sys
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from control_plane import (  # noqa: E402
    Job,
    ReconciliationEvidence,
    ReconciliationEventType,
    WorkflowState,
)
from durable_runtime import DurableRuntime  # noqa: E402
from runtime_store import RuntimeStore, RuntimeStoreViolation  # noqa: E402
from webhooks import (  # noqa: E402
    NormalizedWebhookEvent,
    WebhookAuthError,
    WebhookPayloadError,
    WebhookReceiver,
    normalize_github,
    normalize_jira,
    verify_github_signature,
    verify_jira_signature,
)


class SignatureTests(unittest.TestCase):
    def test_github_official_signature_vector(self):
        payload = b"Hello, World!"
        verify_github_signature(
            payload,
            "It's a Secret to Everybody",
            "sha256=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17",
        )

    def test_github_rejects_tampered_payload(self):
        with self.assertRaises(WebhookAuthError):
            verify_github_signature(
                b"tampered",
                "It's a Secret to Everybody",
                "sha256=757107ea0eb2509fc211221cce984b8a37570b6d7586c22c46f4379c8b043e17",
            )

    def test_jira_official_sha256_signature_vector(self):
        verify_jira_signature(
            b"Hello World!",
            "It's a Secret to Everybody",
            "sha256=a4771c39fbe90f317c7824e83ddef3caae9cb3d976c214ace1f2937e133263c9",
        )

    def test_jira_rejects_weak_or_unknown_method(self):
        with self.assertRaises(WebhookAuthError):
            verify_jira_signature(b"{}", "secret", "sha1=deadbeef")


class NormalizationTests(unittest.TestCase):
    def test_pull_request_opened_extracts_jira_key(self):
        payload = json.dumps(
            {
                "action": "opened",
                "pull_request": {
                    "title": "SCRUM-50: test",
                    "body": "body",
                    "head": {"ref": "SCRUM-50-feature"},
                    "merged": False,
                },
            }
        ).encode()
        event = normalize_github(
            {
                "X-GitHub-Delivery": "abc-1",
                "X-GitHub-Event": "pull_request",
            },
            payload,
        )
        self.assertEqual(event.event_id, "github:abc-1")
        self.assertEqual(event.work_item_id, "SCRUM-50")
        self.assertEqual(
            event.reconciliation_event_type,
            ReconciliationEventType.PR_OPENED,
        )

    def test_workflow_run_success_maps_to_ci_passed(self):
        payload = json.dumps(
            {
                "action": "completed",
                "workflow_run": {
                    "head_branch": "SCRUM-51-feature",
                    "name": "CI",
                    "conclusion": "success",
                },
            }
        ).encode()
        event = normalize_github(
            {
                "X-GitHub-Delivery": "abc-2",
                "X-GitHub-Event": "workflow_run",
            },
            payload,
        )
        self.assertEqual(event.work_item_id, "SCRUM-51")
        self.assertEqual(
            event.reconciliation_event_type,
            ReconciliationEventType.CI_PASSED,
        )

    def test_jira_identifier_is_namespaced_and_stable(self):
        payload = json.dumps(
            {
                "webhookEvent": "jira:issue_updated",
                "issue": {"key": "SCRUM-52"},
            }
        ).encode()
        event = normalize_jira(
            {"X-Atlassian-Webhook-Identifier": "12345"},
            payload,
        )
        self.assertEqual(event.event_id, "jira:12345")
        self.assertEqual(event.work_item_id, "SCRUM-52")
        self.assertIsNone(event.reconciliation_event_type)

    def test_missing_delivery_identifier_is_rejected(self):
        with self.assertRaises(WebhookPayloadError):
            normalize_github(
                {"X-GitHub-Event": "pull_request"},
                b"{}",
            )


class RuntimeStoreTests(unittest.TestCase):
    def test_job_survives_process_restart(self):
        with tempfile.TemporaryDirectory() as tmp:
            db = str(pathlib.Path(tmp) / "runtime.db")
            store = RuntimeStore(db)
            job = Job(
                "RUN-13",
                "SCRUM-53",
                "persist",
                state=WorkflowState.IN_PROGRESS,
                qa_pass=True,
            )
            job.events.append("persisted")
            store.save_job(job)
            store.close()

            reopened = RuntimeStore(db)
            restored = reopened.load_job("SCRUM-53")
            self.assertIsNotNone(restored)
            self.assertEqual(restored.state, WorkflowState.IN_PROGRESS)
            self.assertTrue(restored.qa_pass)
            self.assertEqual(restored.events, ["persisted"])
            reopened.close()

    def test_duplicate_delivery_same_content_is_noop(self):
        store = RuntimeStore(":memory:")
        self.assertTrue(
            store.record_event("e1", "github", "pull_request", b"{}", "SCRUM-1")
        )
        self.assertFalse(
            store.record_event("e1", "github", "pull_request", b"{}", "SCRUM-1")
        )
        self.assertEqual(store.counts()["events"], 1)
        store.close()

    def test_duplicate_delivery_conflict_is_rejected(self):
        store = RuntimeStore(":memory:")
        store.record_event("e2", "github", "pull_request", b"{}", "SCRUM-1")
        with self.assertRaises(RuntimeStoreViolation):
            store.record_event(
                "e2", "github", "pull_request", b'{"changed":true}', "SCRUM-1"
            )
        store.close()


class DurableRuntimeTests(unittest.TestCase):
    @staticmethod
    def ci_failed_event(event_id="github:ci-1"):
        return NormalizedWebhookEvent(
            event_id=event_id,
            source="github",
            event_type="workflow_run",
            work_item_id="SCRUM-60",
            reconciliation_event_type=ReconciliationEventType.CI_FAILED,
            payload=b'{"action":"completed","conclusion":"failure"}',
        )

    def test_ci_failure_creates_status_and_block_label_outbox(self):
        store = RuntimeStore(":memory:")
        runtime = DurableRuntime(store)
        result = runtime.ingest(
            self.ci_failed_event(),
            ReconciliationEvidence(ci_pass=False),
        )
        self.assertFalse(result.duplicate)
        pending = store.pending_outbox()
        self.assertEqual(len(pending), 2)
        self.assertEqual(
            {item["operation"] for item in pending},
            {"jira.set_status", "jira.add_label"},
        )
        store.close()

    def test_redelivery_after_complete_decision_does_not_duplicate_outbox(self):
        store = RuntimeStore(":memory:")
        runtime = DurableRuntime(store)
        event = self.ci_failed_event("github:ci-2")
        runtime.ingest(event, ReconciliationEvidence())
        second = runtime.ingest(event, ReconciliationEvidence())
        self.assertTrue(second.duplicate)
        self.assertFalse(second.resumed)
        self.assertEqual(store.counts()["outbox"], 2)
        store.close()

    def test_crash_after_event_persist_resumes_on_redelivery(self):
        with tempfile.TemporaryDirectory() as tmp:
            db = str(pathlib.Path(tmp) / "runtime.db")
            event = self.ci_failed_event("github:ci-crash")

            first = RuntimeStore(db)
            first.record_event(
                event.event_id,
                event.source,
                event.event_type,
                event.payload,
                event.work_item_id,
            )
            self.assertEqual(first.event_status(event.event_id), "RECEIVED")
            first.close()

            reopened = RuntimeStore(db)
            result = DurableRuntime(reopened).ingest(
                event,
                ReconciliationEvidence(ci_pass=False),
            )
            self.assertTrue(result.duplicate)
            self.assertTrue(result.resumed)
            self.assertEqual(reopened.event_status(event.event_id), "DECIDED")
            self.assertEqual(reopened.counts()["pending_outbox"], 2)
            reopened.close()

    def test_pending_outbox_survives_restart(self):
        with tempfile.TemporaryDirectory() as tmp:
            db = str(pathlib.Path(tmp) / "runtime.db")
            event = self.ci_failed_event("github:ci-restart")
            store = RuntimeStore(db)
            DurableRuntime(store).ingest(event, ReconciliationEvidence())
            first_ids = [x["operation_id"] for x in store.pending_outbox()]
            store.close()

            reopened = RuntimeStore(db)
            second_ids = [x["operation_id"] for x in reopened.pending_outbox()]
            self.assertEqual(first_ids, second_ids)
            reopened.close()

    def test_failed_outbox_operation_is_replayable(self):
        store = RuntimeStore(":memory:")
        event = self.ci_failed_event("github:ci-retry")
        DurableRuntime(store).ingest(event, ReconciliationEvidence())
        operation_id = store.pending_outbox()[0]["operation_id"]
        store.mark_outbox_failed(operation_id, "temporary API outage")
        pending = {
            item["operation_id"]: item for item in store.pending_outbox()
        }
        self.assertEqual(pending[operation_id]["attempts"], 1)
        self.assertEqual(
            pending[operation_id]["last_error"],
            "temporary API outage",
        )
        store.mark_outbox_complete(operation_id)
        remaining = {
            item["operation_id"] for item in store.pending_outbox()
        }
        self.assertNotIn(operation_id, remaining)
        store.close()

    def test_authenticated_jira_event_is_audited_without_feedback_action(self):
        store = RuntimeStore(":memory:")
        runtime = DurableRuntime(store)
        event = NormalizedWebhookEvent(
            event_id="jira:100",
            source="jira",
            event_type="jira:issue_updated",
            work_item_id="SCRUM-61",
            reconciliation_event_type=None,
            payload=b'{"webhookEvent":"jira:issue_updated"}',
        )
        result = runtime.ingest(event, ReconciliationEvidence())
        self.assertTrue(result.ignored)
        self.assertEqual(store.counts()["outbox"], 0)
        self.assertEqual(store.event_status(event.event_id), "IGNORED")
        store.close()


class ReceiverIntegrationTests(unittest.TestCase):
    def test_receiver_verifies_before_normalizing_github(self):
        secret = "github-secret"
        payload = json.dumps(
            {
                "action": "opened",
                "pull_request": {
                    "title": "SCRUM-70 test",
                    "head": {"ref": "SCRUM-70-feature"},
                    "merged": False,
                },
            }
        ).encode()
        signature = "sha256=" + hmac.new(
            secret.encode(), payload, hashlib.sha256
        ).hexdigest()
        receiver = WebhookReceiver(secret, "jira-secret")
        event = receiver.receive_github(
            {
                "X-Hub-Signature-256": signature,
                "X-GitHub-Delivery": "delivery-70",
                "X-GitHub-Event": "pull_request",
            },
            payload,
        )
        self.assertEqual(event.work_item_id, "SCRUM-70")


if __name__ == "__main__":
    unittest.main()
