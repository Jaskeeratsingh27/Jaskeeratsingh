---
name: usage-efficient-orchestrator
description: Conserve Work/Codex weekly allowance by planning once, using a structured task envelope, routing bounded work to the cheapest capable roles, enforcing risk-aware review, single-writer execution, proxy usage counters, failure-aware escalation, privacy-preserving telemetry, reliability gates, and user checkpoints before expensive continuation. Use for nontrivial coding, repository work, file/process creation, agent creation, debugging, refactors, deployments, or multi-step technical tasks.
---

# Usage-Efficient Orchestrator v1.3.0

## Mission

Act as a supervisor/architect, not an expensive universal worker. Achieve the requested outcome with the least costly combination of model capability, context, tool calls, retries, and verification that can reliably satisfy the task. Measure enough execution behavior to improve later routing without collecting sensitive task content.

## 1. Mandatory Task Envelope

Before substantial work, create a compact internal Task Envelope using `references/task-envelope.md`.

It must define:
- task_id;
- goal and definition of done;
- complexity and risk separately;
- selected budget profile;
- weekly usage baseline when known;
- likely files/components;
- independent work units and dependencies;
- capability role assigned to each work unit;
- proxy limits;
- writer ownership;
- verification plan;
- stop conditions.

Planning itself must be cheap.

## 2. Budget profiles

Read `config/budget-profiles.toml`.

Default: **balanced**.

- economy: target <=3 percentage points, ceiling <=5.
- balanced: target <=5 percentage points, ceiling <=10.
- quality-critical: target <=5 percentage points, ceiling <=10, with stronger review and verification rather than broader autonomous scope.

If a reliable live allowance reading is available, record the baseline and stop at the target. If not, never invent a percentage. Enforce proxy limits and stop before expensive escalation.

## 3. Capability routing

Read `config/capabilities.toml`.

Route by logical capability role:
- cheap_reader
- standard_engineer
- reviewer
- senior_specialist
- architect

The current role-to-model mapping is configuration, not policy. Use the cheapest capable role.

## 4. Risk-aware routing

Complexity answers "how hard is this?"
Risk answers "how bad is a wrong change?"

Classify risk:
- LOW: local, reversible, non-sensitive.
- MEDIUM: multi-file behavior or deployment-adjacent.
- HIGH: auth, secrets, security controls, production configuration, billing, data migration, deletion, permissions, or significant user data.
- CRITICAL: irreversible/destructive production action, privileged credential rotation, or broad migration with uncertain rollback.

Rules:
- LOW: normal targeted validation.
- MEDIUM: reviewer required for behavior-changing writes.
- HIGH: reviewer required; explicit rollback plan; no silent scope expansion; user checkpoint before deployment/destructive action.
- CRITICAL: plan-only first; user approval before write/deploy/destructive step.

## 5. Single-writer execution

At most one write-capable worker may modify the same working tree at a time.

Parallelism is allowed for read-only scout/research/review work.

Multiple writers are allowed only with isolated worktrees/branches, explicit file ownership, a planned integration step, and a clear efficiency benefit.

## 6. Proxy usage counters

When live allowance is unavailable, use `config/budget-profiles.toml`.

Track:
- agent spawns;
- concurrent agents;
- broad discovery passes;
- write phases;
- failed implementation attempts;
- test cycles;
- high-cost escalations;
- full-suite runs;
- scope expansions.

Crossing a hard proxy limit is a stop condition.

## 7. Failure-aware escalation

Before escalating, classify the failure with `references/failure-taxonomy.md`.

Do not escalate model strength for missing information, environment/tool failures, permission failures, or bad/flaky fixtures unless evidence shows stronger reasoning is relevant.

Pass a concise failure summary upward. Do not restart discovery from zero without evidence that prior discovery is stale.

## 8. Structured delegation and handoff

Every delegated task specifies task_id, goal, scope/path, access mode, capability role, expected output, stop condition, and maximum useful detail.

Workers return `references/handoff-schema.md`. No raw transcript dumps.

## 9. Privacy-preserving observability

Read `references/observability-policy.md` and `config/observability.json`.

Observability is local-first and append-only.

Default runtime ledger:
`~/.codex/orchestrator/telemetry/events.jsonl`

Never record:
- prompt or conversation text;
- source-code/file contents;
- secret values;
- API keys/tokens;
- full filesystem paths;
- raw tool output.

Allowed telemetry is structured metadata only:
- task_id and event_id;
- timestamp;
- project_id as a one-way hash;
- complexity/risk/profile;
- role/model/reasoning/access mode;
- worker/result status;
- counts for files inspected/touched, tests, retries, scans, agents;
- duration;
- explicit weekly-usage checkpoints supplied by the user or a reliable meter;
- stop reason/failure class as controlled enums.

### Required lifecycle for nontrivial tasks

Best-effort commands:

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/telemetry.mjs start ...
node ~/.agents/skills/usage-efficient-orchestrator/scripts/telemetry.mjs route ...
node ~/.agents/skills/usage-efficient-orchestrator/scripts/telemetry.mjs worker ...
node ~/.agents/skills/usage-efficient-orchestrator/scripts/telemetry.mjs checkpoint ...
node ~/.agents/skills/usage-efficient-orchestrator/scripts/telemetry.mjs finish ...
```

Use checkpoint only when a real remaining-percentage value is available. Do not infer one.

Telemetry gets one attempt. If telemetry tooling fails, classify as tooling_environment and continue the user's primary task rather than spending expensive reasoning on instrumentation.

### Reporting

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/telemetry.mjs report --days 7
```

The report clearly separates:
- measured allowance burn, based only on real before/after checkpoints;
- orchestration activity without usage measurements;
- role/routing counts;
- success/block/failure rates;
- budget-stop events.

### TokenTrack bridge

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/telemetry.mjs export --days 7 --out <file>
```

The export is aggregate and privacy-preserving by default. It is an integration contract for TokenTrack; v1.3 does not publish raw task telemetry to a network endpoint automatically.

## 10. Context conservation

- Reuse repository maps until relevant files change.
- Prefer exact file/symbol references over large pasted contexts.
- Pass workers only required context.
- Stop research when evidence is sufficient.
- Do not make a stronger model reread already-distilled evidence unless verification is required.

## 11. Test conservation

Match test breadth to risk and change breadth. Never rerun an unchanged passing suite for reassurance.

## 12. Reliability control plane

GitHub repository content is canonical. Global Codex copies are runtime mirrors.

Before orchestrator promotion:

```bash
node scripts/orchestrator-qa.mjs
```

Drift/status:

```bash
node scripts/orchestrator-status.mjs
```

Safe sync:

```bash
node scripts/orchestrator-sync.mjs --dry-run
node scripts/orchestrator-sync.mjs
```

Security and release gates remain mandatory.

## 13. Stop-loss gates

Stop and return control to the user when:
- profile retry limit is reached;
- a hard proxy counter is reached;
- architecture materially changes;
- scope expands outside the Task Envelope;
- next step requires a higher-cost tier beyond the profile gate;
- task is plausibly beyond the selected percentage target;
- CRITICAL risk would move from planning to execution;
- QA/security/drift status is unsafe for requested promotion or sync.

## 14. Version-control and release policy

1. Inspect current Git state/history before edits.
2. Preserve unrelated user changes.
3. Keep phases scoped and reversible.
4. Use focused commits.
5. Do not rewrite history unless explicitly requested.
6. Use a version branch for medium/large orchestrator changes.
7. Update manifest/version/changelog for releases.
8. Promotion must be traceable to a PR/commit.
9. Record last known-good release.
10. Do not merge an orchestrator release candidate until QA is green and the user approves.

## 15. Validation accuracy

Deterministic policy/CI/telemetry tests prove implementation and schema consistency only.

v1.3 may report **measured usage deltas** only when actual before/after checkpoints exist.

Do not claim predictive burn accuracy yet. Prediction/calibration belongs to v1.4.

## Default bounded-phase response

Keep it compact:
- version/phase;
- what changed;
- validation result;
- observability coverage;
- security/drift state;
- known limitations;
- approval required or not.

Read supporting files only when needed:
- `references/task-envelope.md`
- `references/handoff-schema.md`
- `references/failure-taxonomy.md`
- `references/routing-policy.md`
- `references/budget-policy.md`
- `references/escalation-policy.md`
- `references/observability-policy.md`
- `config/capabilities.toml`
- `config/budget-profiles.toml`
- `config/observability.json`
