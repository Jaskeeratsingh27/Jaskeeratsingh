# Usage-Efficient Codex Orchestrator

Version: 2.0.0

GitHub is the canonical source for the orchestration policy.

## v2.0 architecture

The orchestrator is now one closed control loop:

```text
User request
   ↓
Primary supervisor / architect
   ↓
Task classification + Task Envelope
   ↓
Usage prediction
   ↓
Canonical baseline route
   ↓
Shadow adaptive comparison
   ↓
Delegation plan
   ↓
Bounded execution
   ↓
Live checkpoint or proxy governor
   ↓
Validation
   ↓
Final measurement
   ↓
Outcome evaluation
   ↓
Validated telemetry
   └──────────────→ informs the next task
```

The primary model remains the supervisor. Cheap and mid-tier workers receive bounded work according to configured capabilities.

## Preflight

For every nontrivial task:

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/closed-loop.mjs preflight \
  --task-kind implementation \
  --complexity MEDIUM \
  --risk MEDIUM \
  --profile balanced \
  --json
```

If an authoritative current remaining-percentage reading is available:

```bash
--baseline 63 --cycle <usage-cycle-id>
```

The result contains:
- task ID;
- control action;
- execution route;
- ordered delegation plan;
- usage prediction;
- adaptive shadow recommendation;
- proxy budget limits.

## Execution routing

v2.0 is a **shadow/baseline closed loop**.

The canonical baseline route is executed.

A historically cheaper adaptive candidate may be surfaced but cannot silently replace the baseline.

Active route switching remains gated by real operational evidence, controlled canary evidence, canonical approval, and explicit user approval.

## Usage limits

Profiles remain:

- economy: target 3 points, ceiling 5;
- balanced: target 5 points, ceiling 10;
- quality-critical: target 5 points, ceiling 10 with stronger assurance.

A true percentage stop is possible only when an authoritative live remaining-percent reading is available.

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/closed-loop.mjs checkpoint \
  --task-id <id> --remaining <percent> --cycle <id> --json
```

When measured burn reaches the target, the controller returns `stop_target`.

When it reaches the ceiling, it returns `stop_ceiling`.

Without a live meter, the system never fabricates a percentage.

## Proxy governor

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/closed-loop.mjs status \
  --task-id <id> --json
```

The governor tracks conservative structured counters such as:
- agent spawns;
- discovery passes;
- write phases;
- failed implementation attempts;
- test cycles;
- senior escalations.

It reports saturated dimensions before further expensive work.

## Finalization and learning

```bash
node ~/.agents/skills/usage-efficient-orchestrator/scripts/closed-loop.mjs finalize \
  --task-id <id> --status complete --json
```

With a final authoritative remaining percentage, finalization calculates measured burn.

The post-task evaluation records:
- budget outcome;
- quality outcome;
- actual burn when measurable;
- prediction error when a prediction existed;
- learning eligibility.

"Learning" means future deterministic estimators and shadow routing consume the new validated telemetry.

It does not mean opaque self-modification or autonomous policy rewriting.

## Capability routing

The configured roles remain:

- `cheap_reader` -> low-cost read-heavy discovery;
- `standard_engineer` -> routine implementation;
- `reviewer` -> independent correctness/security/regression review;
- `senior_specialist` -> escalation-only difficult work;
- `architect` -> primary-model supervision and architecture.

The route template determines ordered roles; the capability registry determines configured model, reasoning effort, and read/write access.

## Safety floors

Efficiency cannot override:

- HIGH-risk reviewer coverage;
- CRITICAL/LARGE plan-only behavior;
- single-writer shared-tree execution;
- security/permission boundaries;
- quality validation floors;
- user approval checkpoints;
- profile budget stops.

## Observability and privacy

The local ledger remains:

`~/.codex/orchestrator/telemetry/events.jsonl`

v2 adds:
- `preflight_decision`;
- `post_task_evaluation`.

Structured metadata may include route IDs, controlled gates, percentages, numeric prediction/error values, quality outcome, and learning eligibility.

It never stores prompts, chain-of-thought, source code, file contents, secrets, raw worker output, or full local paths.

## Compatibility and rollback

Supported telemetry generations remain non-destructively readable from v1.3 onward.

Current last-known-good rollback target:

- v1.9.0
- `1685d9395bb91b751d3b7dcc887a73418e744fd5`

Automatic destructive repository rollback remains disabled.

## Readiness distinction

v2.0 has two separate concepts:

1. **closed-loop software readiness** — deterministic lifecycle, safety, compatibility, observability, recovery, and QA work correctly.
2. **active-adaptation evidence readiness** — enough real measured data and controlled canary evidence exist to authorize route replacement.

The first can be established by release validation.

The second cannot be created by synthetic tests and remains separately gated.

## Reliability commands

```bash
node scripts/orchestrator-qa.mjs
node scripts/orchestrator-status.mjs
node scripts/orchestrator-sync.mjs --dry-run
node scripts/orchestrator-sync.mjs
```

## Version history

- v1.0 foundation
- v1.1 control plane
- v1.2 reliability
- v1.3 observability
- v1.4 usage intelligence
- v1.5 adaptive routing
- v1.9 consolidated final hardening
- **v2.0 closed-loop orchestrator**
