import hashlib
import hmac
import json
import re
from dataclasses import dataclass
from typing import Mapping, Optional

from control_plane import ReconciliationEventType


class WebhookAuthError(RuntimeError):
    pass


class WebhookPayloadError(RuntimeError):
    pass


@dataclass(frozen=True)
class NormalizedWebhookEvent:
    event_id: str
    source: str
    event_type: str
    work_item_id: Optional[str]
    reconciliation_event_type: Optional[ReconciliationEventType]
    payload: bytes


def _header(headers: Mapping[str, str], name: str) -> Optional[str]:
    wanted = name.lower()
    for key, value in headers.items():
        if key.lower() == wanted:
            return value
    return None


def verify_github_signature(payload: bytes, secret: str, signature_header: str) -> None:
    if not secret:
        raise WebhookAuthError("GitHub webhook secret is required")
    if not signature_header or not signature_header.startswith("sha256="):
        raise WebhookAuthError("missing or invalid X-Hub-Signature-256")
    expected = "sha256=" + hmac.new(
        secret.encode("utf-8"), payload, hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(expected, signature_header):
        raise WebhookAuthError("GitHub webhook signature mismatch")


def verify_jira_signature(payload: bytes, secret: str, signature_header: str) -> None:
    if not secret:
        raise WebhookAuthError("Jira webhook secret is required")
    if not signature_header or "=" not in signature_header:
        raise WebhookAuthError("missing or invalid X-Hub-Signature")
    method, supplied = signature_header.split("=", 1)
    method = method.lower()
    safe_algorithms = {
        "sha256": hashlib.sha256,
        "sha384": hashlib.sha384,
        "sha512": hashlib.sha512,
    }
    if method not in safe_algorithms:
        raise WebhookAuthError(f"unsupported Jira webhook HMAC method: {method}")
    expected = hmac.new(
        secret.encode("utf-8"), payload, safe_algorithms[method]
    ).hexdigest()
    if not hmac.compare_digest(expected, supplied):
        raise WebhookAuthError("Jira webhook signature mismatch")


_WORK_ITEM = re.compile(r"\b[A-Z][A-Z0-9]+-\d+\b")


def _find_work_item(*values: object) -> Optional[str]:
    for value in values:
        if not isinstance(value, str):
            continue
        match = _WORK_ITEM.search(value)
        if match:
            return match.group(0)
    return None


def normalize_github(headers: Mapping[str, str], payload: bytes) -> NormalizedWebhookEvent:
    delivery_id = _header(headers, "X-GitHub-Delivery")
    event_name = _header(headers, "X-GitHub-Event")
    if not delivery_id or not event_name:
        raise WebhookPayloadError("GitHub delivery/event headers are required")
    try:
        body = json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise WebhookPayloadError("GitHub webhook body must be valid UTF-8 JSON") from exc

    reconciliation_type: Optional[ReconciliationEventType] = None
    work_item_id: Optional[str] = None

    if event_name == "pull_request":
        action = body.get("action")
        pr = body.get("pull_request") or {}
        head = (pr.get("head") or {}).get("ref")
        work_item_id = _find_work_item(head, pr.get("title"), pr.get("body"))
        if action in {"opened", "reopened"}:
            reconciliation_type = ReconciliationEventType.PR_OPENED
        elif action == "ready_for_review":
            reconciliation_type = ReconciliationEventType.PR_READY
        elif action == "closed" and bool(pr.get("merged")):
            reconciliation_type = ReconciliationEventType.PR_MERGED

    elif event_name == "workflow_run":
        action = body.get("action")
        run = body.get("workflow_run") or {}
        work_item_id = _find_work_item(run.get("head_branch"), run.get("name"))
        if action == "completed":
            if run.get("conclusion") == "success":
                reconciliation_type = ReconciliationEventType.CI_PASSED
            else:
                reconciliation_type = ReconciliationEventType.CI_FAILED

    return NormalizedWebhookEvent(
        event_id=f"github:{delivery_id}",
        source="github",
        event_type=event_name,
        work_item_id=work_item_id,
        reconciliation_event_type=reconciliation_type,
        payload=payload,
    )


def normalize_jira(headers: Mapping[str, str], payload: bytes) -> NormalizedWebhookEvent:
    identifier = _header(headers, "X-Atlassian-Webhook-Identifier")
    if not identifier:
        raise WebhookPayloadError("X-Atlassian-Webhook-Identifier is required")
    try:
        body = json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise WebhookPayloadError("Jira webhook body must be valid UTF-8 JSON") from exc

    issue = body.get("issue") or {}
    return NormalizedWebhookEvent(
        event_id=f"jira:{identifier}",
        source="jira",
        event_type=str(body.get("webhookEvent") or "unknown"),
        work_item_id=issue.get("key"),
        reconciliation_event_type=None,
        payload=payload,
    )


class WebhookReceiver:
    """Signature verification + normalization.

    This class is HTTP-framework agnostic so the same security contract can be used
    by a Cloudflare/Vercel/container adapter without changing core behavior.
    """

    def __init__(self, github_secret: str, jira_secret: str) -> None:
        self.github_secret = github_secret
        self.jira_secret = jira_secret

    def receive_github(
        self, headers: Mapping[str, str], payload: bytes
    ) -> NormalizedWebhookEvent:
        signature = _header(headers, "X-Hub-Signature-256") or ""
        verify_github_signature(payload, self.github_secret, signature)
        return normalize_github(headers, payload)

    def receive_jira(
        self, headers: Mapping[str, str], payload: bytes
    ) -> NormalizedWebhookEvent:
        signature = _header(headers, "X-Hub-Signature") or ""
        verify_jira_signature(payload, self.jira_secret, signature)
        return normalize_jira(headers, payload)
