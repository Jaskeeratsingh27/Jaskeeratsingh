# Task Envelope

Create this internally before substantial execution. Keep it compact.

```yaml
task_id: <short-id>
goal: <single outcome>
definition_of_done:
  - <observable result>

complexity: MICRO | SMALL | MEDIUM | LARGE
risk: LOW | MEDIUM | HIGH | CRITICAL
risk_reason: <why>

budget:
  profile: economy | balanced | quality-critical
  baseline_remaining_pct: <number|null>
  target_delta_points: <from profile>
  ceiling_delta_points: <from profile>

scope:
  known_paths: []
  unknowns: []
  repo_scan_required: false

work_units:
  - id: W1
    depends_on: []
    role: cheap_reader | standard_engineer | reviewer | senior_specialist | architect
    access: read-only | write
    goal: <bounded goal>
    stop_condition: <explicit>

limits:
  max_concurrent_agents: <profile>
  max_agent_spawns: <profile>
  max_broad_discovery_passes: <profile>
  max_write_phases: <profile>
  max_failed_attempts: <profile>
  max_test_cycles: <profile>
  max_senior_escalations: <profile>

writer:
  shared_tree_owner: <work-unit-id|null>
  isolated_worktrees: false

verification:
  targeted_checks: []
  independent_review_required: <bool>
  full_suite_justified: <bool>

stop_conditions:
  - budget gate
  - retry gate
  - scope expansion
  - architecture change
  - risk escalation
```

Rules:
- Complexity and risk are independent.
- Exactly one shared-tree writer may be active at a time.
- Unknown scope should trigger cheap discovery, not immediate senior escalation.
- LARGE or CRITICAL work starts plan-only unless the user explicitly approves execution.
