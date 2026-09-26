from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = [
    "README.md",
    "VERSION",
    "CHANGELOG.md",
    "architecture/V1.md",
    "architecture/V1.2.md",
    "agents/AGENTS.md",
    "config/approval-policy.yaml",
    "config/workflow.yaml",
    "config/reconciliation.yaml",
    "src/control_plane.py",
    "tests/test_control_plane.py",
]

for rel in REQUIRED:
    path = ROOT / rel
    if not path.exists():
        raise SystemExit(f"missing required V1.2 file: {rel}")

version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
if version != "1.2.0":
    raise SystemExit(f"unexpected V1.2 version: {version}")

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

workflow = (ROOT / "config/workflow.yaml").read_text(encoding="utf-8")
for required in ["human_approval", "resume_to: previous_state"]:
    if required not in workflow:
        raise SystemExit(f"missing workflow safeguard: {required}")

reconciliation = (ROOT / "config/reconciliation.yaml").read_text(encoding="utf-8")
for required in [
    "ci_failed: In Progress",
    "blocked_label: ci-blocked",
    "ci_passed: In Progress",
    "pr_ready: In Review",
    "pr_merged: Done",
    "human_merge_approved",
]:
    if required not in reconciliation:
        raise SystemExit(f"missing reconciliation rule: {required}")

implementation = (ROOT / "src/control_plane.py").read_text(encoding="utf-8")
for required in [
    "AGENT_CONTRACTS",
    "class ReconciliationEngine",
    "class ReconciliationLedger",
    "blocked: bool",
    "ci-blocked",
    "human_merge_approved",
    "operation_id reuse with different request is denied",
]:
    if required not in implementation:
        raise SystemExit(f"missing V1.2 implementation safeguard: {required}")

print("V1.2 structural validation: PASS")
