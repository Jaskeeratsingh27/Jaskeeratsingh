from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = [
    "README.md",
    "VERSION",
    "CHANGELOG.md",
    "architecture/V1.md",
    "architecture/V1.2.md",
    "architecture/V1.3.md",
    "architecture/V1.4.md",
    "agents/AGENTS.md",
    "config/approval-policy.yaml",
    "config/workflow.yaml",
    "config/reconciliation.yaml",
    "config/runtime.yaml",
    "config/worker.yaml",
    "docs/V1.3-SOURCES.md",
    "docs/V1.4-SOURCES.md",
    "docs/V1.4-DEPLOYMENT.md",
    "src/control_plane.py",
    "src/runtime_store.py",
    "src/webhooks.py",
    "src/durable_runtime.py",
    "src/provider_auth.py",
    "src/provider_clients.py",
    "src/outbox_worker.py",
    "src/worker_main.py",
    "tests/test_control_plane.py",
    "tests/test_runtime_v13.py",
    "tests/test_worker_v14.py",
    "tests/test_railway_service.py",
    "requirements-v14.txt",
    "Dockerfile.worker",
    ".env.example",
]

for rel in REQUIRED:
    path = ROOT / rel
    if not path.exists():
        raise SystemExit(f"missing required V1.4.1 file: {rel}")

version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
if version != "1.4.1":
    raise SystemExit(f"unexpected V1.4.1 version: {version}")

for path, required_tokens in {
    "src/provider_auth.py": [
        "class GitHubAppTokenProvider",
        "class JiraOAuthTokenProvider",
        "class EncryptedFileSecretStore",
        "JIRA_OAUTH_REFRESH_TOKEN",
        "RS256",
    ],
    "src/outbox_worker.py": [
        "class OutboxWorker",
        "mark_outbox_dead_letter",
        "mark_outbox_retry",
    ],
    "src/worker_main.py": [
        "ThreadingHTTPServer",
        "/health",
        "/status",
        "/webhooks/github",
        "jira_worker_ready",
    ],
}.items():
    content = (ROOT / path).read_text(encoding="utf-8")
    for token in required_tokens:
        if token not in content:
            raise SystemExit(f"missing V1.4.1 safeguard in {path}: {token}")

policy = (ROOT / "config/approval-policy.yaml").read_text(encoding="utf-8")
for required in [
    "github.merge_pull_request: L2",
    "production.deploy: L3",
    "direct_write_to_main",
]:
    if required not in policy:
        raise SystemExit(f"missing policy guard: {required}")

print("V1.4.1 structural validation: PASS")
