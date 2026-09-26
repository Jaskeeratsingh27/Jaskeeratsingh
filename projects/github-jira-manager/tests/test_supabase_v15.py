import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]

class SupabaseV15ContractTests(unittest.TestCase):
    def read(self, relative):
        return (ROOT / relative).read_text(encoding="utf-8")

    def test_runtime_sources_exist(self):
        for path in [
            "supabase/functions/dashboard/index.ts",
            "supabase/functions/github-webhook/index.ts",
            "supabase/functions/reconcile-worker/index.ts",
            "supabase/schema/control-plane.sql",
        ]:
            self.assertTrue((ROOT / path).is_file(), path)

    def test_github_ingress_uses_oidc_trust_conditions(self):
        src = self.read("supabase/functions/github-webhook/index.ts")
        self.assertIn("https://token.actions.githubusercontent.com", src)
        self.assertIn('EXPECTED_AUDIENCE = "gjm-supabase"', src)
        self.assertIn('EXPECTED_REPOSITORY = "Jaskeeratsingh27/Jaskeeratsingh"', src)
        self.assertIn("crypto.subtle.verify", src)

    def test_worker_is_credential_gated_and_retry_bounded(self):
        src = self.read("supabase/functions/reconcile-worker/index.ts")
        for name in ("JIRA_BASE_URL", "JIRA_EMAIL", "JIRA_API_TOKEN"):
            self.assertIn(name, src)
        self.assertIn('"DEAD_LETTER"', src)
        self.assertIn("attempts>=5", src.replace(" ", ""))

    def test_dashboard_is_plain_language_surface(self):
        src = self.read("supabase/functions/dashboard/index.ts")
        self.assertIn("Project Knowledge Dashboard", src)
        self.assertIn("current_focus", src)
        self.assertIn("next_step", src)
        self.assertNotIn("SUPABASE_SECRET_KEYS</", src)

    def test_schema_is_deny_by_default(self):
        schema = self.read("supabase/schema/control-plane.sql")
        self.assertIn("enable row level security", schema.lower())
        self.assertIn("revoke all on public.gjm_events from anon, authenticated", schema)
        self.assertIn("security invoker", schema.lower())

if __name__ == "__main__":
    unittest.main()
