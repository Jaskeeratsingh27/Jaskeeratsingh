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
    "tests/test_supabase_v15.py",
    "requirements-v14.txt",
    "Dockerfile.worker",
    ".env.example",
    "supabase/config.toml",
    "supabase/schema/control-plane.sql",
    "supabase/functions/health/index.ts",
    "supabase/functions/dashboard/index.ts",
    "supabase/functions/github-webhook/index.ts",
    "supabase/functions/reconcile-worker/index.ts",
    "supabase/docs/dashboard.md",
]

for rel in REQUIRED:
    path = ROOT / rel
    if not path.exists():
        raise SystemExit(f"missing required V1.5 file: {rel}")

version = (ROOT / "VERSION").read_text(encoding="utf-8").strip()
if version != "1.5.0-rc1":
    raise SystemExit(f"unexpected V1.5 version: {version}")

for path, required_tokens in {
    "src/provider_auth.py": [
        "class GitHubAppTokenProvider",
        "class JiraOAuthTokenProvider",
        "class EncryptedFileSecretStore",
        "JIRA_OAUTH_REFRESH_TOKEN",
        "RS256",
    ],
    "src/provider_clients.py": [
        "class JiraClient",
        "class GitHubClient",
        "retryable",
    ],
    "src/outbox_worker.py": [
        "class OutboxWorker",
        "mark_outbox_dead_letter",
        "mark_outbox_retry",
    ],
    "src/runtime_store.py": [
        "next_attempt_at",
        "DEAD_LETTER",
        "mark_outbox_retry",
    ],
    "config/worker.yaml": [
        "github_app_installation",
        "oauth_2_3lo_refresh_token",
        "external_secret_store",
        "exponential",
    ],
    "supabase/functions/github-webhook/index.ts": [
        "https://token.actions.githubusercontent.com",
        'EXPECTED_AUDIENCE = "gjm-supabase"',
        "crypto.subtle.verify",
        "gjm_outbox",
    ],
    "supabase/functions/reconcile-worker/index.ts": [
        "JIRA_API_TOKEN",
        "gjm_claim_outbox",
        "DEAD_LETTER",
    ],
    "supabase/functions/dashboard/index.ts": [
        "Project Knowledge Dashboard",
        "gjm_projects",
        "gjm_project_activity",
    ],
}.items():
    content = (ROOT / path).read_text(encoding="utf-8")
    for token in required_tokens:
        if token not in content:
            raise SystemExit(f"missing V1.5 safeguard in {path}: {token}")

policy = (ROOT / "config/approval-policy.yaml").read_text(encoding="utf-8")
for required in [
    "github.merge_pull_request: L2",
    "production.deploy: L3",
    "direct_write_to_main",
]:
    if required not in policy:
        raise SystemExit(f"missing policy guard: {required}")

print("V1.5 structural validation: PASS")
