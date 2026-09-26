# Migrations

Canonical schema migrations will live here.

Workflow:
1. Iterate against the connected development/project database.
2. Verify queries and runtime behavior.
3. Run Supabase security/performance advisors.
4. Generate a migration with the Supabase CLI using a descriptive name.
5. Commit the generated migration to GitHub.
6. CI validates it before merge.

Do not hand-create timestamped migration filenames.
