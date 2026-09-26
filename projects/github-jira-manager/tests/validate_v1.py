from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = [
    "README.md",
    "VERSION",
    "CHANGELOG.md",
    "architecture/V1.md",
    "architecture/V1.2.md",
    "architecture/V1.3.md",
    "agents/AGENTS.md",
    "config/approval-policy.yaml",
    "config/workflow.yaml",
    "config/reconciliation.yaml",
    "config/runtime.yaml",
    "docs/V1.3-SOURCES.md",
    "src/control_plane.py",
    "src/runtime_store.py",
    "src/webhooks.py",
    "src/durable_runtime.py",
    "tests/test_control_plane.py",
    "tests/test_runtime_v13.py",
]

for rel in REQUIRED:
    path = ROOT / rel
    if not path.exists():
        raise SystemExit(f"missing required V1.3 file: {rel}")

version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
if version != "1.3.0":
    raise SystemExit(f"unexpected V1.3 version: {version}")

agents = (ROOT / "agents/AGENTS.md").read_text(encoding="utf-8")
for role in ["Orchestrator", "Project Manager", "Software Engineer", "QA Validator"]:
    if role not in agents:
        raise SystemExit(f"missing agent contract: {role}")

policy = (ROOT / "config/approval-policy.yaml").read_text(encoding="utf-8")
for required in [
    "github.merge_pull_request: L2",
    "production.deploy: L3",
    "direct_write_to_main",
]:
    if required not in policy:
        raise SystemExit(f"missing policy guard: {required}")

reconciliation = (ROOT / "config/reconciliation.yaml").read_text(encoding="utf-8")
for required in [
    "blocked_label: ci-blocked",
    "pr_ready: In Review",
    "pr_merged: Done",
    "human_merge_approved",
]:
    if required not in reconciliation:
        raise SystemExit(f"missing reconciliation rule: {required}")

runtime = (ROOT / "config/runtime.yaml").read_text(encoding="utf-8")
for required in [
    "persist_before_reconcile: true",
    "idempotent_delivery_ids: true",
    "durable_outbox: true",
    "requires_service_credentials",
]:
    if required not in runtime:
        raise SystemExit(f"missing V1.3 runtime rule: {required}")

for path, required_tokens in {
    "src/runtime_store.py": [
        "CREATE TABLE IF NOT EXISTS inbound_events",
        "CREATE TABLE IF NOT EXISTS outbox",
        "persist_decision_and_outbox",
    ],
    "src/webhooks.py": [
        "X-Hub-Signature-256",
        "X-Atlassian-Webhook-Identifier",
        "hmac.compare_digest",
    ],
    "src/durable_runtime.py": [
        "prior_status == \"RECEIVED\"",
        "persist_decision_and_outbox",
    ],
}.items():
    content = (ROOT / path).read_text(encoding="utf-8")
    for token in required_tokens:
        if token not in content:
            raise SystemExit(f"missing V1.3 safeguard in {path}: {token}")

print("V1.3 structural validation: PASS")
