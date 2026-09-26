# Supabase runtime tests

Required before production canary:
- valid GitHub HMAC accepted,
- tampered GitHub HMAC rejected,
- Jira HMAC accepted/rejected,
- duplicate delivery ID + same payload is idempotent,
- duplicate delivery ID + different payload is rejected,
- CI failure creates In Progress + ci-blocked intent,
- CI pass clears ci-blocked without bypassing QA,
- PR ready cannot move to In Review without CI + QA,
- PR merged cannot move to Done without CI + QA + human approval,
- retryable provider failure schedules retry,
- permanent failure dead-letters,
- completed operation is not selected again,
- scheduled recovery finds stranded work,
- anon/authenticated roles cannot read control-plane tables.
