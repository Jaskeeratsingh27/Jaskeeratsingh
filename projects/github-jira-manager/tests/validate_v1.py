from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = [
    "README.md",
    "VERSION",
    "CHANGELOG.md",
    "architecture/V1.md",
    "agents/AGENTS.md",
    "config/approval-policy.yaml",
    "config/workflow.yaml",
    "src/control_plane.py",
    "tests/test_control_plane.py",
]

for rel in REQUIRED:
    path = ROOT / rel
    if not path.exists():
        raise SystemExit(f"missing required V1 file: {rel}")

version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
if version != "1.0.1":
    raise SystemExit(f"unexpected V1 version: {version}")

agents = (ROOT / "agents/AGENTS.md").read_text(encoding="utf-8")
for role in ["Orchestrator", "Project Manager", "Software Engineer", "QA / Validation"]:
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
for required in [
    "human_approval",
    "resume_to: previous_state",
]:
    if required not in workflow:
        raise SystemExit(f"missing workflow safeguard: {required}")

implementation = (ROOT / "src/control_plane.py").read_text(encoding="utf-8")
for required in [
    "human_merge_approved",
    "class MockToolAdapter",
    "operation_id reuse with different request is denied",
]:
    if required not in implementation:
        raise SystemExit(f"missing implementation safeguard: {required}")

print("V1 structural validation: PASS")
