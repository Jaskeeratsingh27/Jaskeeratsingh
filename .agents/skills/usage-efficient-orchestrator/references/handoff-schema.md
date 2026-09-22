# Worker Handoff Schema

Every worker returns a concise structured handoff.

```yaml
task_id: <id>
work_unit: <id>
role: <capability role>
status: complete | blocked | failed
outcome: <1-3 sentences>
evidence:
  files: []
  symbols: []
  commands_or_checks: []
changes:
  files_changed: []
  summary: <none if read-only>
validation:
  status: passed | failed | not-run
  checks: []
failure:
  class: none | information | tooling_environment | test_fixture | implementation | architecture | permission_security
  detail: <short>
risk:
  new_risk: none | LOW | MEDIUM | HIGH | CRITICAL
  detail: <short>
escalation:
  required: false
  recommended_role: <role|null>
  reason: <short>
```

Constraints:
- No raw transcript dump.
- No repeated repository summary unless requested.
- Evidence should be references, not pasted files.
- If blocked, explain the cheapest next action.
