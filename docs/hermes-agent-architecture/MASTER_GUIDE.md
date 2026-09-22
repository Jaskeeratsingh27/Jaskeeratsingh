# Hermes Agent Architecture Master Guide

**Canonical skill:** `hermes-agent-architecture`  
**Current semantic version:** `1.6.0`  
**Canonical repository:** `Jaskeeratsingh27/Jaskeeratsingh`  
**Canonical path:** `.agents/skills/hermes-agent-architecture/`  
**Hermes research baseline recorded by the skill:** Hermes Agent `v0.21.3`, tag `v2026.9.14`, verified 2026-09-21  
**v1.6 merge anchor:** `0627a9e3966bd6d317057d0917b338b2168cb2db`  
**Repository `main` observed while this guide was assembled:** `94663750c5d087d36a176526632955a61414698b`  
**Document purpose:** complete reference, NotebookLM source, and new-chat handoff package  

---

## 0. How to Use This Document

This file is intentionally self-contained. It is designed for three uses:

1. **NotebookLM / Gemini Notebook reference source** - upload the Markdown file and ask questions about the Hermes architecture system, its history, maintenance workflow, CI, consumers, or future changes.
2. **Fresh ChatGPT / AI chat bootstrap** - upload this file to a new chat so the new chat can understand the architecture without reading the original development conversation.
3. **Human engineering reference** - use it as the end-to-end operating manual for how the skill is structured, maintained, tested, promoted, and extended.

### Source-of-truth rule

This guide is a **handoff/reference document**, not the ultimate canonical runtime source. The source-of-truth hierarchy for this project is:

```text
1. Canonical GitHub files in Jaskeeratsingh27/Jaskeeratsingh
2. Pinned Hermes source/tag/release being targeted
3. Official Hermes release notes and documentation
4. This master guide
5. Chat history / recollection
```

If this guide and the current GitHub skill disagree, inspect the current GitHub skill first. If the GitHub skill makes a version-sensitive Hermes claim, verify that claim against the pinned Hermes release and official primary sources before changing production architecture.

### Important repository note

The repository's `main` branch contains other projects and can advance for reasons unrelated to Hermes. Therefore:

- do **not** infer the Hermes skill version from the repository HEAD SHA;
- read `.agents/skills/hermes-agent-architecture/VERSION`;
- read `compatibility/hermes-compatibility.json` for the Hermes baseline and verification state;
- use Git history/PRs to understand semantic releases.

---

# Part I - New-Chat Bootstrap

## 1. Instructions for a Fresh Chat or Agent

If this document is uploaded to a new AI chat, the AI should adopt the following operating understanding before modifying anything:

### 1.1 Project identity

You are working with a versioned knowledge/control skill named:

`hermes-agent-architecture`

Its purpose is to design and maintain production-grade Hermes Agent architectures: persistent Profiles/Bots, delegated subagents, Kanban workflows, skills/context/SOUL, memory, tools/MCP, `execute_code`, model/provider routing, Cron, security, observability, I/O contracts, release compatibility, knowledge freshness, downstream consumer impact, dependency drift, and final promotion/recovery decisions.

### 1.2 Canonical location

Repository:

`Jaskeeratsingh27/Jaskeeratsingh`

Canonical skill:

`.agents/skills/hermes-agent-architecture/`

Important related files outside the skill:

- `.github/workflows/hermes-architecture-ci.yml`
- `.agents/skills/hermes-agent-creator/SKILL.md`
- `.agents/skills/kaizen-orchestrator/...`
- `SKILLS.md`
- `.claude/skills/hermes-agent-architecture/SKILL.md` when a Claude mirror exists/is maintained

### 1.3 Read these first

For any architecture or maintenance task, begin with the smallest relevant set:

1. `SKILL.md`
2. `VERSION`
3. `compatibility/hermes-compatibility.json`
4. `references/00-architecture-map.md`
5. the topic-specific reference file(s)

For maintenance/change work also read:

6. `maintenance/source-manifest.json`
7. `maintenance/weekly-refresh-prompt.md`
8. `maintenance/weekly-refresh-spec.md`
9. `compatibility/impact-map.json`
10. `compatibility/upgrade-matrix.json`
11. `compatibility/freshness-policy.json`
12. `consumers/registry.json`
13. `research/PRODUCTION_READINESS.md`

### 1.4 Core design rule

Do not collapse all Hermes concerns into one prompt or one agent. Keep these boundaries distinct:

```text
WHO performs work              -> Profile / Bot
HOW work is performed          -> Skill
PROJECT RULES / WHERE          -> AGENTS.md / .hermes.md
CURRENT OBJECTIVE              -> Task envelope / Kanban task
MACHINE RESULT                 -> Structured result + artifacts
WORKFLOW LIFECYCLE             -> Kanban / external control plane
SMALL PERSISTENT FACTS         -> Memory
OBJECTIVE ENGINEERING TRUTH    -> Git / files / databases
EXTERNAL CAPABILITIES          -> Tools / MCP
MULTI-TOOL DETERMINISM         -> execute_code
RECURRING SCHEDULE             -> Cron
IDENTITY / OPERATING PHILOSOPHY-> SOUL.md
ISOLATION / SECURITY BOUNDARY  -> Sandbox + least privilege
POLICY / TELEMETRY             -> Hooks / plugins / observability
```

### 1.5 Modification rules

When changing the skill:

- GitHub is the canonical source of truth.
- Make the smallest justified change.
- Preserve release-vs-current-doc distinctions.
- Never silently convert an ambiguous Hermes behavior into a verified fact.
- Never auto-register or auto-remove downstream consumers from keyword matching alone.
- Never declare ecosystem compatibility merely because the knowledge patch is valid.
- Do not force-push over concurrent repository work.
- Rebase/merge onto the latest `main` when unrelated work lands concurrently.
- Run all deterministic gates required by the current version.
- Use branch/PR review for stable-release transitions, ambiguity, security changes, breaking architecture changes, unknown coverage, or consumer blockers.

### 1.6 Current maturity policy

Version `1.6.0` is the **final planned architecture-hardening release**. Do not create a speculative `1.7` merely to add more layers. A future semantic version should be justified by real evidence, such as:

- an official Hermes behavior/release change;
- a weekly audit exposing a defect;
- a real consumer needing migration support;
- a security/observability requirement change;
- a real incident not represented by the deterministic scenarios.

---

# Part II - Executive Overview

## 2. What We Built

The project began as a knowledge skill for answering "how should I design this Hermes agent/system?" and evolved into a maintained knowledge-control system with deterministic quality gates.

The final architecture does five jobs simultaneously:

1. **Knowledge system** - captures researched Hermes architecture behavior in progressive-disclosure references.
2. **Design system** - chooses the correct Hermes primitive and provides templates/contracts for production agents.
3. **Maintenance system** - audits official Hermes sources weekly and updates only verified material changes.
4. **Change-control system** - computes blast radius, compatibility, freshness, consumer impact, and promotion status.
5. **Quality system** - protects architecture decisions with seven deterministic CI layers and end-to-end failure simulations.

### 2.1 Final evolution

```text
v1.0  Primary-source Hermes knowledge base
  |
v1.1  Compatibility state + CI + architecture regressions
  |
v1.2  Release-impact engine + upgrade management
  |
v1.3  Freshness + historical audits + knowledge health/drift
  |
v1.4  Downstream consumer-impact intelligence
  |
v1.5  Consumer dependency drift detection
  |
v1.6  Final promotion/recovery gate + end-to-end hardening
```

### 2.2 What the skill can now do

The skill can:

- design a single Hermes specialist profile;
- design multi-profile agent systems;
- decide Profiles vs subagents vs Kanban vs Skills vs Cron vs MCP vs `execute_code`;
- design Bot Mode collaborators;
- define Profile role boundaries, tools, models, credentials, memory, and SOUL;
- write/review project-context strategy using `.hermes.md` / `AGENTS.md`;
- create explicit subagent input/output contracts;
- design structured JSON Schema outputs for delegated work;
- design durable Kanban task graphs and handoff rules;
- design memory boundaries and separate memory from engineering truth;
- design least-privilege tool/MCP capability manifests;
- design model/provider routing and fallback policy;
- design recurring Cron execution without confusing it with workflow state;
- design sandbox/security boundaries;
- design observability/correlation IDs and hook policy;
- review architectures against production-readiness criteria;
- pin/version Hermes behavior and distinguish release behavior from live docs;
- detect official Hermes changes and classify their severity;
- compute which capability, files, routing decisions, and tests are affected;
- maintain an upgrade matrix;
- track per-capability verification freshness;
- score knowledge health and surface drift;
- map platform changes to real downstream skills/agents;
- detect when the consumer dependency registry itself becomes stale;
- determine whether a knowledge change may be promoted;
- independently determine whether the downstream ecosystem is compatibility-cleared;
- recover safely from failed CI, ambiguity, stale knowledge, consumer drift, and other blockers.

---

# Part III - Core Hermes Architecture Model

## 3. Primitive Selection

The canonical primitive-routing table is stored in:

`compatibility/primitive-routing.json`

### 3.1 Persistent specialist -> Profile / Bot

Use a Profile/Bot when a worker needs persistent independent:

- identity;
- state/home;
- memory/history;
- model/provider;
- skills;
- credentials;
- tools/permissions;
- Cron/gateway behavior.

A Profile is a **Hermes state boundary**, not an OS security boundary.

### 3.2 Short isolated worker -> `delegate_task`

Use `delegate_task` for short fork/join work when:

- the child can receive explicit context;
- its result returns to a parent;
- independent durable workflow state is not required;
- parallelism is useful;
- the work can tolerate non-resumable child execution.

Treat the child as having **zero parent conversation context** unless facts are explicitly passed or project-context inheritance supplies them.

### 3.3 Durable workflow -> Kanban

Use Kanban when the work must:

- survive restarts;
- cross Profile boundaries;
- wait for humans or review;
- model dependencies;
- be reassigned;
- retain durable comments/history;
- remain auditable.

### 3.4 Reusable procedure -> Skill

Use a Skill for reusable SOPs, decision rules, templates, scripts, domain knowledge, and large progressive-disclosure reference corpora.

### 3.5 Repository/project rules -> Context files

Use `.hermes.md` / `AGENTS.md` style context for repository-scoped architecture, commands, conventions, tests, and directory rules.

### 3.6 Identity -> `SOUL.md`

Use `SOUL.md` for the persistent Profile's mission, role philosophy, identity, and long-lived behavioral boundary. Do not turn SOUL into a giant project manual.

### 3.7 External capability -> Tools / MCP

Use built-in tools or MCP servers for external systems. Enforce least privilege technically by limiting toolsets and server/tool exposure.

### 3.8 Deterministic multi-tool processing -> `execute_code`

Use `execute_code` when a task has several tool calls plus loops, branching, filtering, transformation, or aggregation and intermediate outputs do not need to occupy model context.

### 3.9 Recurring execution -> Cron

Use Cron for recurring/one-shot scheduled execution. Do not use Cron as the authoritative cross-agent workflow database.

### 3.10 Isolation -> Sandbox

Use actual container/sandbox/backend controls for process/filesystem isolation. A Profile alone is not sufficient.

---

## 4. Recommended Production Topology

The default topology used by this knowledge system is:

```text
USER / API / MESSAGING
          |
          v
   ORCHESTRATOR PROFILE
          |
          v
 HERMES KANBAN CONTROL PLANE
          |
   +------+------+----------------+
   |             |                |
   v             v                v
RESEARCH      ENGINEERING       QA/REVIEW
PROFILE       PROFILE           PROFILE
   |             |                |
   +-> delegated ephemeral workers|
   |             +-> delegated workers
   |                              |
   +--------------+---------------+
                  v
            DURABLE ARTIFACTS
             Git / files / DB
                  |
                  v
            VERIFIED COMPLETION
```

The topology is a default, not a universal mandate. Simpler tasks can use fewer layers. The essential rule is that persistent identity, ephemeral compute, durable workflow state, and engineering truth must have clear owners.

---

# Part IV - Capability Deep Dive

## 5. Profiles and Bot Mode

Profiles are persistent Hermes homes. A Profile can own configuration, environment, SOUL, memory, sessions, skills, Cron, state, and gateway behavior.

Design rules:

- use one Profile per durable specialist boundary;
- give each Profile a precise role description;
- separate Profiles when model, permissions, credentials, skills, history, or identity should differ;
- do not create Profiles merely to parallelize a one-off task;
- do not point independent writers at one Profile home;
- Bot Mode is a presentation/collaboration form of a Profile, not a separate underlying primitive;
- Bot-to-Bot messages are collaboration, not authoritative workflow state.

## 6. Delegation / Subagents

`delegate_task` is treated like ephemeral function-like agent compute.

Key contract rules:

- pass required context explicitly;
- do not assume the child knows the parent conversation;
- use structured output for machine-consumed results;
- keep output schemas forgiving;
- bound concurrency, child count, and nested depth;
- do not use nested delegation as a substitute for a durable control plane;
- expect restart ambiguity around unfinished children/side effects.

Good uses:

- parallel research slices;
- code inspection;
- independent review;
- bounded data extraction;
- structured short worker tasks.

Poor uses:

- multi-hour/day workflows;
- human-blocked workflows;
- authoritative queues;
- restart-resumable state machines;
- deep unbounded delegation trees.

## 7. Structured Output

Structured delegated output is a contract between agents and downstream automation.

Recommended principles:

- require only fields downstream code truly consumes;
- use enums only where the state machine needs them;
- preserve useful partial work even if validation fails;
- keep human-readable summary plus machine fields;
- include verification/evidence when downstream trust matters.

The canonical result-envelope template lives in:

`templates/delegation-result.schema.json`

## 8. Kanban

Kanban is the durable control plane for multi-agent execution.

Typical lifecycle:

`triage -> todo -> ready -> running -> review/blocked/done -> archived`

Use it for:

- dependencies;
- persistent workflow truth;
- blocking/unblocking;
- human review;
- restart survival;
- assignment/reassignment;
- task comments/handoffs;
- durable audit history.

For code-writing systems, per-task worktrees are preferred when parallel changes could conflict.

## 9. Skills, Project Context, and SOUL

Keep these separate:

| Layer | Purpose |
|---|---|
| `SOUL.md` | persistent identity and role philosophy |
| `AGENTS.md` / `.hermes.md` | project rules and architecture |
| `SKILL.md` + references | reusable knowledge/procedure |
| task envelope | current objective, constraints, acceptance criteria |
| memory | small durable learned facts |
| Git/files | objective engineering truth |

This separation reduces prompt conflict and allows independent maintenance.

## 10. Memory and Session Context

Use Hermes memory for bounded persistent facts/preferences. Do not use it as a huge architecture KB.

Use:

- memory for curated long-lived facts;
- session search for historical conversations/evidence;
- Git/files/datastores for durable engineering truth;
- optional external memory providers for richer multi-agent/shared personalization.

## 11. Tools, Toolsets, MCP, and `execute_code`

For every persistent agent define a capability manifest:

- required built-in toolsets;
- optional toolsets;
- prohibited toolsets;
- MCP servers;
- allowed MCP tools;
- sandbox/backend;
- credential sources and passthrough rules.

`execute_code` is preferred for deterministic multi-call tool pipelines when it lowers token/context overhead. Terminal remains the tool for shell/build/process work.

## 12. Model and Provider Routing

Model selection is role-based rather than "one strongest model everywhere."

Typical pattern:

- orchestrator/architect: strong reasoning;
- researcher: strong retrieval/synthesis;
- implementation: coding-appropriate model;
- QA/reviewer: independent model where useful;
- formatting/release helper: inexpensive fast model.

Always record:

- primary model/provider;
- reasoning effort;
- fallback chain;
- auxiliary overrides;
- context/turn/cost budget;
- escalation conditions.

Fallback is resilience, not arbitrary silent rerouting. It can also reduce prompt-cache reuse and increase cost.

## 13. Cron and Automation

Use Cron for scheduled execution. A scheduled job can start or reconcile work, but Kanban or another workflow system owns cross-agent lifecycle truth.

Continuity can be useful for recurring monitors, but recurring jobs should not recursively self-schedule unless deliberately privileged.

## 14. Security

Core security principles:

- Profile != sandbox;
- enforce least privilege technically;
- remove unneeded toolsets;
- filter MCP tools;
- restrict filesystem/workspace;
- isolate execution in appropriate sandbox/container backends;
- minimize secret/environment passthrough;
- keep secrets out of prompts, artifacts, and telemetry;
- add approvals for destructive operations when needed;
- treat third-party skills/context as supply-chain material;
- separate untrusted web/file content from trusted instructions.

## 15. Observability

Recommended correlation hierarchy:

```text
workflow / Kanban task
  -> Profile / session
     -> turn
        -> provider API request(s)
        -> tool call(s)
        -> child session(s) / subagents
```

Capture when available:

- `session_id`;
- `task_id`;
- `turn_id`;
- `api_request_id`;
- API call count;
- `tool_call_id`;
- parent/child session IDs;
- parent/child subagent IDs;
- parent turn ID;
- model/provider;
- latency;
- tokens/cost;
- retry state;
- schema validity;
- tool status;
- verification result.

Observer callbacks should not accidentally become required business logic. Behavior-changing hooks are enforcement code and need tests.

---

# Part V - Contracts and Templates

## 16. Task Envelope

The canonical task-envelope schema is:

`templates/task-envelope.schema.json`

The design intent is to pass enough information that a receiving agent can work correctly without relying on hidden conversational context.

Recommended fields include:

- contract version;
- task ID;
- parent task ID;
- objective;
- context references;
- inputs;
- constraints;
- acceptance criteria;
- expected artifacts;
- verification requirements;
- priority;
- iteration/child/token/cost budgets where appropriate.

## 17. Delegation Result Envelope

Canonical schema:

`templates/delegation-result.schema.json`

Conceptual shape:

```json
{
  "status": "completed|partial|blocked|failed",
  "summary": "...",
  "artifacts": [],
  "evidence": [],
  "assumptions": [],
  "verification": [],
  "residual_risks": [],
  "blocked_reason": null,
  "follow_up_tasks": []
}
```

## 18. Profile Design Template

`templates/agent-profile-design.md` is used to define:

- profile purpose;
- role boundaries;
- responsibilities and exclusions;
- model/provider;
- toolsets/MCP;
- credentials;
- memory;
- skills;
- SOUL;
- inputs/outputs;
- failure/retry/escalation;
- observability;
- deployment/update strategy.

## 19. AGENTS and SOUL Templates

- `templates/AGENTS.template.md` - repository/project-level operating rules.
- `templates/SOUL.template.md` - persistent role identity and philosophy.

A future chat should reuse these templates instead of inventing incompatible structures when authoring Hermes agents.

---

# Part VI - Version History and What Each Run Achieved

## 20. Version Timeline

### v1.0.0 - Foundational knowledge system

**Anchor commit:** `b6c0f68d2efe5de6847f6823b56be4366f1b1d4a`

Built:

- primary-source Hermes research baseline;
- stable release pinning discipline;
- architecture mental model;
- topic references for Profiles/Bots, delegation, Kanban, skills/context/SOUL, memory, tools/MCP, models, Cron, security, observability;
- task/result schemas;
- Profile/AGENTS/SOUL templates;
- source manifest;
- weekly refresh design;
- structural validator;
- split research dossier for progressive disclosure;
- dependency from `hermes-agent-creator` to the architecture skill.

Core insight:

```text
Profiles   = WHO
Skills     = HOW
Contracts  = WHAT ENTERS/LEAVES
Kanban     = WHEN/WHERE WORK FLOWS
Git/files  = WHAT IS TRUE
Subagents  = TEMPORARY COMPUTE
Hooks      = POLICY/OBSERVABILITY
Models     = INTELLIGENCE/COST ROUTING
```

### v1.1.0 - Compatibility and regression control

**PR:** #4  
**Merge commit:** `3336ae60b54cb1cbaa19d227c5eb641c9a971bbc`

Added:

- machine-readable compatibility manifest;
- machine-readable primitive routing;
- deterministic architecture scenarios;
- stronger structural validation;
- dedicated GitHub Actions CI;
- weekly-maintenance integration with compatibility state.

Result: the skill stopped being only documentation and gained a deterministic quality-control layer.

### v1.2.0 - Release-impact intelligence

**PR:** #5  
**Merge commit:** `d75e5d16db0efb3f38ec409174ccdea0c9890436`

Added:

- change-event schema;
- release-impact engine;
- severity classification;
- capability/file/routing/test blast-radius map;
- upgrade matrix;
- targeted regression selection;
- release-impact regressions;
- stricter review rules for stable releases, ambiguity, security, unknown sources, and breaking changes.

Defect caught during development:

The global Hermes Releases source originally risked being treated as an unknown capability-owned source. The engine was corrected so global primary sources can participate in a change event without creating a false unknown-source escalation.

### v1.3.0 - Freshness, audits, health, and drift

**PR:** #7  
**Merge commit:** `200e49fadba46a2d545a11a49eb6ccc6a112c335`

Added:

- `last_verified_on` per capability;
- source-priority freshness thresholds;
- weekly audit snapshot schema/history;
- knowledge-health engine;
- health-history reports;
- deterministic drift signals;
- health/drift regressions;
- fourth CI gate;
- rule that routine audit/health telemetry does not bump the semantic skill version.

Key improvement: the knowledge base can now become stale even when Hermes does not release a new version.

### v1.4.0 - Downstream consumer impact

**PR:** #9  
**Merge commit:** `7fd83d1696532a706ed90feeb5add247e559fe43`

Added:

- active canonical consumer registry;
- consumer registry schema;
- consumer-impact engine;
- consumer criticality and dependency modes;
- downstream actions (`advisory`, `targeted_review`, `compatibility_review`, `migration_review`);
- compatibility blockers;
- fifth CI gate;
- weekly downstream-impact reporting.

Initial active consumers:

- `hermes-agent-creator`;
- Hermes adaptation of `kaizen-orchestrator`.

Design decision: historical migrations and `.claude` mirrors are excluded from active-impact alerts unless explicitly registered.

Defect/test insight:

A Cron patch scenario demonstrated that a patch-level change can still justify a targeted review for a high-criticality direct consumer. The safer behavior was preserved and the test expectation was corrected rather than weakening the policy.

### v1.5.0 - Consumer dependency drift detection

**PR:** #11  
**Merge commit:** `b0070a748a18bef558af19b128e69b35ac83b3c2`

Added:

- evidence assertions for registered consumers;
- conservative candidate markers and capability detection rules;
- dependency-drift engine;
- historical drift snapshots;
- sixth CI gate;
- no-auto-register/no-auto-remove policy.

Drift classes:

- `candidate_unregistered_consumer`;
- `unregistered_capability_dependency`;
- `registered_evidence_missing`;
- `registered_capability_without_evidence`.

Real defect found by v1.5:

`kaizen-orchestrator` explicitly used Hermes memory as an optional handoff mechanism, but `memory` was missing from its v1.4 registry dependency list. v1.5 found and corrected this.

### v1.6.0 - Final hardening and promotion/recovery control

**PR:** #12  
**Merge commit:** `0627a9e3966bd6d317057d0917b338b2168cb2db`

Added:

- final promotion-decision engine;
- separate knowledge-promotion and ecosystem-compatibility decisions;
- `allow`, `review_required`, and `blocked` semantics;
- nine end-to-end hardening scenarios;
- seventh CI gate;
- production-readiness report;
- recovery sequence;
- post-v1.6 evidence-driven evolution policy.

Documentation drift found by v1.6:

The maintenance spec still referred to a "v1.3 control flow" and "4 deterministic CI gates" even after the system had grown to six gates. v1.6 corrected the stale control documentation and made the seven-gate state canonical.

---

## 21. Version Summary Table

| Version | Main capability added | CI maturity |
|---|---|---|
| 1.0 | researched knowledge + templates + source manifest | structural validator |
| 1.1 | compatibility + primitive routing | architecture regression CI |
| 1.2 | release-impact + upgrade matrix | release-impact gate |
| 1.3 | freshness + health + historical audits | health/drift gate |
| 1.4 | downstream consumer impact | consumer-impact gate |
| 1.5 | registry/dependency drift | consumer-drift gate |
| 1.6 | promotion/recovery + E2E hardening | seven-gate production control |

---

# Part VII - Compatibility and Change-Control System

## 22. Compatibility Manifest

File:

`compatibility/hermes-compatibility.json`

Current state recorded by v1.6:

- skill version: `1.6.0`;
- Hermes baseline: `v0.21.3`;
- tag: `v2026.9.14`;
- baseline verification date: `2026-09-21`;
- current capability status: verified for all registered capabilities;
- `needs_revalidation`: empty at the baseline snapshot.

Tracked capability IDs:

1. `profiles`
2. `bot_mode`
3. `delegation`
4. `structured_output`
5. `kanban`
6. `skills_context_soul`
7. `memory`
8. `tools_mcp`
9. `execute_code`
10. `model_routing`
11. `cron`
12. `security`
13. `observability`

### Version-sensitive rule

The skill intentionally distinguishes:

- **pinned stable release behavior**;
- **current Hermes documentation/main behavior**.

Do not assume they are identical.

---

## 23. Release Impact Engine

Files:

- `maintenance/change-event.schema.json`
- `maintenance/impact_engine.py`
- `compatibility/impact-map.json`
- `references/14-release-impact-engine.md`

### Severity levels

```text
info
patch
minor
major
critical
```

Current policy:

- documentation-only verified correction -> `patch`;
- stable release change -> at least `minor` and requires review;
- behavior/deprecation -> at least `minor`;
- breaking/architectural change -> `major`;
- security change -> `critical`;
- ambiguous evidence -> floor `major`;
- unknown source/capability -> floor `major`.

### Blast radius output

A change classification returns:

- severity;
- review requirement;
- affected capability IDs;
- affected knowledge files;
- affected primitive-routing rules;
- recommended regression cases;
- revalidation requirements;
- unknown source/capability warnings.

### Smallest-change principle

The impact map exists specifically to prevent broad rewrites. A weekly audit should modify only the affected canonical files unless the evidence proves a wider conceptual change.

---

## 24. Upgrade Matrix

File:

`compatibility/upgrade-matrix.json`

Purpose:

- record current verified Hermes baseline;
- stage a candidate next stable release;
- record affected capabilities;
- record severity/review status;
- record consumer impact;
- append verified upgrade history after promotion.

The matrix is an audit ledger, not a prediction engine.

---

# Part VIII - Knowledge Freshness and Health

## 25. Freshness Policy

File:

`compatibility/freshness-policy.json`

Current control thresholds:

| Source priority | Max verification age |
|---|---:|
| critical | 14 days |
| high | 28 days |
| medium | 56 days |
| low | 90 days |

A capability becomes `due_soon` at 75% of its maximum age.

### Freshness scores

- fresh = 100
- due soon = 80
- stale = 40
- unknown = 20

### Capability-status scores

- verified = 100
- partial = 65
- needs revalidation = 25
- unsupported = 100 (not treated as a stale verified claim)

### Audit cadence

- expected weekly: 7 days;
- audit becomes overdue/stale after 10 days;
- due-soon threshold starts at day 7.

## 26. Health States

The health engine reports:

- `healthy`: >= 90
- `watch`: 75-89.9
- `degraded`: 50-74.9
- `critical`: < 50

This is a **maintenance-control indicator**, not a probability that facts are correct.

## 27. Drift Signals

Current deterministic signals include:

- `needs_revalidation`;
- `pending_upgrade`;
- `release_baseline_mismatch`;
- `audit_stale`;
- `critical_capability_stale`.

Serious drift can cap the score so a good average cannot hide a critical control failure.

## 28. Historical Records

Audit history:

`research/audits/YYYY-MM-DD.json`

Health history:

`research/health/YYYY-MM-DD.json`

Indexes:

- `research/audits/index.json`
- `research/health/index.json`

Rule: do not refresh `last_verified_on` merely because an audit ran. Refresh a capability only if its required primary sources were actually checked sufficiently to reverify it.

---

# Part IX - Consumer Impact and Dependency Drift

## 29. Active Consumer Registry

File:

`consumers/registry.json`

The registry contains **active canonical consumers only**.

Ignored areas include:

- `.claude/` mirrors;
- `migrations/` historical data;
- the architecture skill itself.

### 29.1 `hermes-agent-creator`

Type: skill  
Status: active  
Criticality: high  
Dependency mode: canonical knowledge dependency

It broadly depends on all registered Hermes architecture capabilities because it uses `hermes-agent-architecture` as the current runtime/platform knowledge source when creating/reviewing Hermes agents.

### 29.2 `kaizen-orchestrator`

Type: skill  
Status: active  
Criticality: medium  
Dependency mode: Hermes adaptation

Registered capabilities:

- Profiles;
- delegation;
- tools/MCP;
- Cron;
- memory.

The memory dependency was discovered/corrected by the v1.5 drift detector.

---

## 30. Consumer Impact Actions

The consumer-impact engine can recommend:

- `none` - no consumer action;
- `advisory` - awareness only;
- `targeted_review` - inspect the affected adaptation/instructions;
- `compatibility_review` - verify a direct/current Hermes dependency;
- `migration_review` - breaking/major/security change may require redesign/migration.

A major/critical change affecting a high/critical consumer blocks ecosystem compatibility clearance until reviewed.

Important: the weekly knowledge audit does **not** silently rewrite downstream consumers. It identifies review/migration work; consumer modifications are separate controlled changes.

---

## 31. Consumer Dependency Drift

Files:

- `consumers/detection-rules.json`
- `maintenance/consumer_drift.py`
- `research/consumer-drift/`
- `references/17-consumer-dependency-drift.md`

### Evidence assertions

Registered consumers carry explicit evidence assertions tying dependencies to canonical files and high-confidence text patterns.

### Drift classes

#### `candidate_unregistered_consumer`

An active canonical skill appears to use Hermes and one or more recognizable capabilities but is not in the registry.

#### `unregistered_capability_dependency`

A registered consumer appears to use a Hermes capability not declared in its registry entry.

#### `registered_evidence_missing`

A dependency assertion no longer matches the file/path/pattern that supported it.

#### `registered_capability_without_evidence`

A declared dependency no longer has surviving evidence support.

### Safety rule

Text matching creates a **review finding**, not an automatic registry mutation.

```text
evidence detected
    -> drift/candidate finding
    -> verification
    -> explicit registry update if justified
```

---

# Part X - Promotion and Recovery

## 32. Final Promotion Gate

File:

`maintenance/promotion_gate.py`

v1.6 deliberately separates two decisions.

### 32.1 Knowledge promotion

Question:

> Can the canonical Hermes knowledge/control change be promoted?

States:

- `allow`
- `review_required`
- `blocked`

### 32.2 Ecosystem compatibility

Question:

> Can registered downstream consumers be declared compatible with the resulting knowledge state?

States:

- `cleared`
- `review_required`
- `blocked`

### 32.3 Overall state

The overall result takes the stricter outcome:

- `allow`
- `review_required`
- `blocked`

### 32.4 Typical blockers

Knowledge can be blocked by:

- failed deterministic gates;
- unknown source/capability coverage;
- unresolved revalidation;
- consumer-registry drift;
- critical knowledge health.

Ecosystem clearance can be blocked by:

- failed gates;
- consumer-registry drift;
- critical health;
- high/critical consumer migration blockers;
- consumer-impact coverage gaps.

### 32.5 Review conditions

Examples:

- stable Hermes release transition;
- verified material change;
- pending upgrade;
- watch/degraded health;
- direct consumer compatibility review;
- release baseline mismatch pending resolution.

---

## 33. Recovery Sequence

When the promotion gate blocks:

1. preserve the failing evidence;
2. identify the exact blocker;
3. patch only the responsible knowledge/control/consumer data;
4. run the narrow failing test first;
5. rerun all deterministic gates;
6. recompute health;
7. recompute dependency drift;
8. recompute promotion status;
9. promote only when policy allows it.

Never weaken a test just to make the release green. Fix the model, evidence, implementation, or expectation depending on which is actually wrong.

---

# Part XI - Deterministic CI and Test Architecture

## 34. GitHub CI Workflow

Workflow:

`.github/workflows/hermes-architecture-ci.yml`

As of v1.6 there are **seven deterministic gates**.

### Gate 1 - Structural / compatibility / history validation

`tests/validate_skill.py`

Checks include:

- SKILL frontmatter;
- semver/version alignment;
- JSON parseability;
- source manifest uniqueness/HTTPS/priority;
- compatibility/source integrity;
- capability IDs;
- routing references;
- impact-map completeness;
- upgrade-baseline consistency;
- freshness-policy consistency;
- consumer registry paths/capabilities/evidence;
- audit history;
- health history;
- consumer-drift history;
- required-file presence;
- scenario fixture structure.

### Gate 2 - Architecture regressions

`tests/test_architecture_regressions.py`

Protects primitive decisions such as:

- persistent specialist -> Profile;
- parallel short researchers -> `delegate_task`;
- restart + human approval -> Kanban;
- reusable coding procedure -> Skill;
- repo rules -> project context;
- persistent role identity -> SOUL;
- weekly scheduled run -> Cron;
- external GitHub capability -> MCP/tools;
- bulk deterministic processing -> `execute_code`;
- untrusted code -> sandbox.

### Gate 3 - Release-impact regressions

`tests/test_release_impact.py`

Scenarios include:

- Profile documentation clarification;
- delegation behavior change in new stable release;
- breaking Kanban change;
- security change;
- ambiguous provider routing;
- unknown future subsystem.

### Gate 4 - Health/drift regressions

`tests/test_health_drift.py`

Scenarios include:

- healthy baseline;
- weekly audit due;
- missed audit degradation;
- stale critical capability;
- unresolved revalidation;
- pending upgrade;
- release-baseline mismatch.

### Gate 5 - Consumer-impact regressions

`tests/test_consumer_impact.py`

Scenarios include:

- delegation minor change;
- Kanban major change;
- Cron patch;
- security critical change;
- unknown subsystem.

### Gate 6 - Consumer dependency drift regressions

`tests/test_consumer_drift.py`

Validates:

- current canonical repository has no unresolved dependency drift;
- candidate new consumer detection;
- missing evidence detection;
- undeclared capability detection.

### Gate 7 - End-to-end hardening

`tests/test_end_to_end_hardening.py`

The final nine simulations are:

1. clean no-change cycle;
2. stable delegation upgrade;
3. critical security + consumer blocker;
4. ambiguous model routing + revalidation;
5. unknown future subsystem;
6. missed audits / critical knowledge health;
7. consumer-registry drift;
8. CI-gate failure;
9. recovered-after-review happy path.

The end-to-end test composes the real engines rather than independently mocking their output.

---

# Part XII - Weekly Maintenance Automation

## 35. Live Scheduled Task

Current scheduled task title:

`Weekly Hermes Skill Audit`

Status:

- enabled;
- exact schedule;
- timezone: `America/Winnipeg`;
- Tuesday at 2:00 AM local time;
- recurrence: weekly;
- regular ChatGPT/web/GitHub workflow;
- explicitly instructed not to use Work mode or Codex for the task;
- notifications/email were disabled when this guide was generated;
- no completed run was recorded yet at the time the schedule was inspected.

Schedule representation:

```text
DTSTART: 2026-09-22 02:00 America/Winnipeg
RRULE: FREQ=WEEKLY; BYDAY=TU; BYHOUR=2; BYMINUTE=0; BYSECOND=0
```

The scheduled task points to the canonical maintenance contract rather than embedding the full evolving v1.6 logic permanently. The critical canonical file is:

`maintenance/weekly-refresh-prompt.md`

That allows maintenance behavior to improve without recreating the scheduled task.

---

## 36. Weekly Audit Flow

The current intended control flow is:

```text
CURRENT HEALTH / FRESHNESS
        |
        v
CONSUMER DEPENDENCY DRIFT SCAN
        |
        v
OFFICIAL HERMES RELEASE + SOURCE AUDIT
        |
        v
STRUCTURED CHANGE EVENTS (if needed)
        |
        v
RELEASE IMPACT ENGINE
        |
        v
CONSUMER IMPACT ENGINE
        |
        v
SMALLEST JUSTIFIED KNOWLEDGE PATCH
        |
        v
CAPABILITY REVALIDATION DATES/STATUS
        |
        v
HISTORICAL AUDIT SNAPSHOT
        |
        v
KNOWLEDGE HEALTH REPORT
        |
        v
ALL 7 DETERMINISTIC GATES
        |
        v
FINAL PROMOTION BUNDLE / PROMOTION GATE
        |
        +--> knowledge_promotion
        |
        +--> ecosystem_compatibility
        |
        v
BRANCH/PR OR LOW-RISK COMMIT ACCORDING TO POLICY
        |
        v
TL;DR AUDIT REPORT
```

### 36.1 Before web research

- read the canonical skill and control state;
- run consumer dependency drift;
- inspect health/freshness;
- prioritize stale/due-soon capabilities.

### 36.2 Official-source research

- check GitHub Releases first;
- determine current stable release/tag;
- inspect every critical source;
- inspect relevant high/medium sources according to change/freshness;
- distinguish stable tag behavior from docs/current-main behavior.

### 36.3 When changes are found

For each distinct material/ambiguous change:

- create a JSON change event;
- run impact engine;
- save impact result;
- run consumer-impact engine;
- update only smallest affected canonical files;
- record confidence and unresolved questions.

### 36.4 When no material changes are found

Do not rewrite the knowledge base simply to create activity. Still append operational evidence:

- dependency-drift snapshot;
- audit snapshot;
- health report;
- historical indexes;
- weekly report.

Routine telemetry/history does not require semantic version bumping.

---

# Part XIII - Source Strategy

## 37. Primary Source Hierarchy

For implementation questions, prefer:

1. code/tag being deployed;
2. release notes for that tag;
3. official Hermes documentation;
4. upstream issues/PRs for unresolved edge cases;
5. third-party commentary only as supplementary context.

## 38. Official Source Inventory

The canonical machine-readable list is:

`maintenance/source-manifest.json`

The human-readable list is:

`references/13-source-index.md`

Primary sources currently include:

- GitHub Releases;
- feature overview;
- Profiles;
- Profile distributions;
- Bot Mode;
- Skills;
- context files;
- persistent memory;
- memory providers;
- Honcho;
- delegation;
- Kanban;
- Kanban worker lanes;
- tools/toolsets;
- built-in tool reference;
- code execution;
- MCP;
- Cron;
- security;
- checkpoints/rollback;
- model configuration;
- fallback providers;
- provider routing;
- observer hooks;
- plugins.

Official base locations:

- `https://github.com/NousResearch/hermes-agent/releases`
- `https://hermes-agent.nousresearch.com/docs/...`

---

# Part XIV - Production Readiness

## 39. Final Control Layers

The canonical production-readiness report lists ten control layers:

1. primary-source knowledge base;
2. compatibility manifest and primitive routing;
3. deterministic architecture regressions;
4. release-impact classification and blast radius;
5. upgrade matrix;
6. freshness and knowledge-health monitoring;
7. active consumer impact mapping;
8. consumer dependency drift detection;
9. promotion/recovery decision gate;
10. GitHub branch/PR history and deterministic CI.

## 40. Promotion Invariants

The final system is designed around these invariants:

- no semantic promotion with failed deterministic tests;
- no silent stable-release transition;
- no silent promotion of ambiguous behavior;
- no automatic consumer add/remove based only on text matching;
- no ecosystem compatibility clearance while high/critical affected consumers remain blocked;
- no claim of freshness without real primary-source reverification;
- no broad rewrite when a smaller blast radius is sufficient;
- no force-push overwrite of concurrent canonical work.

## 41. What "Production Ready" Means Here

Passing all seven gates proves that the **modeled deterministic control system is internally consistent** for the tested scenarios.

It does not prove:

- every future Hermes feature is already known;
- all external services will be available;
- official docs cannot change unexpectedly;
- every third-party provider behaves identically forever;
- every possible consumer architecture is represented.

Unknowns deliberately fail closed into review instead of being guessed.

---

# Part XV - Operational Playbooks

## 42. Playbook: Design a New Hermes Agent

1. Identify whether the worker is persistent or ephemeral.
2. If persistent, design a Profile; if temporary, consider delegation.
3. Identify whether workflow must survive restarts/humans; use Kanban if yes.
4. Define role boundary and exclusions.
5. Choose model/provider and fallback policy.
6. Define least-privilege tools/MCP.
7. Choose sandbox/backend.
8. Define SOUL and project context boundaries.
9. Attach reusable skills.
10. Define task/result contracts.
11. Define verification/acceptance criteria.
12. Define retries/timeouts/block/escalation.
13. Define artifacts/source of truth.
14. Define observability IDs and metrics.
15. Pin Hermes version/commit.
16. Review against production checklist.

## 43. Playbook: Design a Multi-Agent System

1. Identify persistent roles.
2. Give each persistent role its own Profile when isolation/state differs.
3. Put durable orchestration in Kanban.
4. Use subagents inside roles for bounded parallel work.
5. Define one owner for workflow state.
6. Define durable shared artifacts.
7. Define explicit handoff contracts.
8. Add independent QA/review where risk warrants it.
9. Bound model/cost/delegation budgets.
10. Test restart, human block, provider failure, duplicate side effects, and permission denial.

## 44. Playbook: Hermes Releases a New Stable Version

1. Do not immediately update production claims.
2. Create candidate in upgrade matrix.
3. Compare release notes and deployed tag/code.
4. Create structured change events.
5. Run release-impact classification.
6. Run consumer impact.
7. Patch smallest affected knowledge files.
8. Revalidate affected capabilities.
9. Run targeted regressions.
10. Run all seven gates.
11. Compute promotion decision.
12. Use branch/PR review.
13. After approval, move candidate to current baseline and append history.

## 45. Playbook: Documentation Changes but Stable Version Does Not

1. Determine whether the docs describe current main or the pinned release.
2. If wording-only and verified, classify patch.
3. If behavior appears different but release support is unclear, classify ambiguous/major.
4. Mark affected capability `needs_revalidation` rather than guessing.
5. Do not clear revalidation until primary sources resolve the behavior.

## 46. Playbook: New Skill Starts Using Hermes

1. Run consumer drift.
2. If `candidate_unregistered_consumer` appears, inspect the evidence.
3. Confirm whether dependency is active/canonical.
4. Add registry entry explicitly if real.
5. Map only capabilities actually used.
6. Add evidence assertions.
7. Add/update consumer-impact regression coverage if material.
8. Rerun all relevant gates.

## 47. Playbook: Registered Consumer Changes

If consumer drift reports undeclared capability or missing evidence:

1. inspect the canonical file;
2. determine whether dependency moved, disappeared, or expanded;
3. update registry only after verification;
4. do not automatically remove a dependency from one missing keyword;
5. rerun consumer impact and drift tests.

## 48. Playbook: CI Fails

1. preserve logs/evidence;
2. identify exact failing gate;
3. determine whether code, policy, fixture, or expectation is wrong;
4. fix the actual defect;
5. rerun the narrow gate;
6. rerun all seven gates;
7. recompute promotion state;
8. merge only after clean result.

Examples from the build history show why this matters: v1.4 kept safer Cron consumer-review behavior and corrected the test fixture rather than weakening the engine.

---

# Part XVI - Known Limitations and Important Caveats

## 49. Hermes Is Fast-Moving

Higher-risk compatibility surfaces include:

- delegation nesting/configuration;
- Kanban lifecycle/review semantics;
- Profile/gateway behavior;
- state persistence;
- model/provider routing;
- MCP auth/SDK behavior;
- plugins/hooks payloads;
- Bot Mode/Desktop integration.

Always pin and verify production targets.

## 50. Kanban Scope

The researched model treats Hermes Kanban as a single-host control plane. Do not assume one local SQLite board is a safe distributed multi-host coordinator. Multi-host execution needs a different distributed coordination design or bridged boards/queues.

## 51. Profiles Are Not Security Boundaries

Profile isolation is not process/filesystem isolation. Use real sandbox/container controls.

## 52. Delegation Is Not Durable Workflow

Subagents are bounded ephemeral compute, not a restart-resumable state machine.

## 53. Memory Is Not the Architecture KB

Keep large knowledge in skills/reference files and engineering truth in Git/files.

## 54. Health Score Is Not Accuracy Probability

A score of 100 means maintenance-control conditions are healthy according to the defined policy; it does not mathematically prove every statement true.

## 55. Consumer Detection Is Evidence-Assisted, Not Omniscient

Keyword/signature detection is intentionally conservative. Findings require verification. This prevents automated dependency hallucination.

## 56. CI Models Known Scenarios

Seven passing gates show internal consistency for modeled cases. Future real incidents may justify new scenarios.

## 57. Scheduled Automation Usage Accounting

The scheduled workflow is explicitly configured to avoid Work/Codex invocation, but product subscription usage accounting should not be assumed to map perfectly to internal execution modes unless verified by current product telemetry.

---

# Part XVII - Future Iterations After v1.6

## 58. Policy: No Speculative v1.7

The default future state is maintenance, not architecture expansion.

```text
USE SYSTEM
   -> WEEKLY AUDITS
   -> OBSERVE REAL DEFECTS / HERMES CHANGES
   -> ROOT CAUSE
   -> UPDATE ONLY WHEN EVIDENCE JUSTIFIES IT
```

## 59. Evidence-Triggered Candidate Enhancements

These are **possible future directions**, not commitments. They should only become versions when a real need appears.

### 59.1 Incident replay library

Trigger: a real production/weekly-audit incident is not represented by current tests.

Potential change:

- store anonymized incident fixture;
- add deterministic replay;
- add regression to prevent recurrence.

### 59.2 Schema migration framework

Trigger: Hermes materially changes Profile/Kanban/delegation schemas.

Potential change:

- compatibility adapters;
- old->new schema migration plan;
- migration validation fixtures.

### 59.3 Multi-host orchestration guidance

Trigger: user begins deploying Hermes workers across multiple hosts.

Potential change:

- external queue/control plane matrix;
- idempotency/lease model;
- distributed trace correlation;
- board-bridging strategy.

### 59.4 Consumer migration automation

Trigger: multiple downstream consumers repeatedly need the same verified migration.

Potential change:

- explicit migration recipes;
- dry-run patch generator;
- separate consumer PR generation;
- migration-specific regression suite.

Important: migration generation should remain review-gated.

### 59.5 Automated primary-source diffing

Trigger: weekly audits become expensive or manual source comparison causes misses.

Potential change:

- cached source hashes/snapshots;
- semantic diff summaries;
- source-change prioritization;
- automatic event candidate generation.

### 59.6 Security threat-model regressions

Trigger: a real security requirement, sandbox/provider change, or vulnerability appears.

Potential change:

- threat-model fixtures;
- credential exposure tests;
- sandbox escape assumption checks;
- MCP permission-drift audits.

### 59.7 Performance/cost telemetry integration

Trigger: production Hermes systems need measured routing/cost optimization.

Potential change:

- real token/cost/latency ingestion;
- role budget baselines;
- model-routing efficiency regressions;
- fallback-cache impact reports.

### 59.8 Trace replay and observability conformance

Trigger: debugging complex production incidents becomes difficult.

Potential change:

- required trace-field schema;
- replayable workflow traces;
- missing-correlation detection;
- latency/error attribution dashboards.

### 59.9 Package/distribution validation

Trigger: the skill is distributed across many Hermes Profiles/repos.

Potential change:

- distribution manifest verification;
- installation/upgrade tests;
- signed/versioned package artifacts;
- mirror consistency checks.

### 59.10 Broader consumer graph

Trigger: more active agents/projects depend on Hermes.

Potential change:

- project/application consumer types;
- transitive dependency relationships;
- graph-based migration order;
- business criticality/SLA fields.

---

# Part XVIII - Repository Structure

## 60. Canonical Skill Tree

```text
.agents/skills/hermes-agent-architecture/
├── SKILL.md
├── README.md
├── VERSION
├── CHANGELOG.md
├── compatibility/
│   ├── hermes-compatibility.json
│   ├── primitive-routing.json
│   ├── impact-map.json
│   ├── freshness-policy.json
│   └── upgrade-matrix.json
├── consumers/
│   ├── registry.json
│   └── detection-rules.json
├── maintenance/
│   ├── source-manifest.json
│   ├── weekly-refresh-prompt.md
│   ├── weekly-refresh-spec.md
│   ├── change-event.schema.json
│   ├── audit-snapshot.schema.json
│   ├── consumer-registry.schema.json
│   ├── consumer-drift-snapshot.schema.json
│   ├── impact_engine.py
│   ├── health_engine.py
│   ├── consumer_impact.py
│   ├── consumer_drift.py
│   └── promotion_gate.py
├── references/
│   ├── 00-architecture-map.md
│   ├── 01-profiles-bots.md
│   ├── 02-delegation.md
│   ├── 03-kanban.md
│   ├── 04-skills-context-soul.md
│   ├── 05-memory-sessions.md
│   ├── 06-tools-code-mcp.md
│   ├── 07-model-routing.md
│   ├── 08-cron-automation.md
│   ├── 09-security.md
│   ├── 10-observability-hooks.md
│   ├── 11-production-checklist.md
│   ├── 12-versioning-known-caveats.md
│   ├── 13-source-index.md
│   ├── 14-release-impact-engine.md
│   ├── 15-knowledge-health-drift.md
│   ├── 16-consumer-impact.md
│   ├── 17-consumer-dependency-drift.md
│   └── 18-promotion-recovery.md
├── research/
│   ├── HERMES_AGENT_RESEARCH_DOSSIER.md
│   ├── PRIMARY_SOURCES.md
│   ├── PRODUCTION_READINESS.md
│   ├── dossier-01-foundations.md
│   ├── dossier-02-collaboration-orchestration.md
│   ├── dossier-03-context-capabilities-models.md
│   ├── dossier-04-maintenance-security-observability.md
│   ├── dossier-05-production-design.md
│   ├── dossier-06-structure-sources.md
│   ├── audits/
│   │   ├── 2026-09-21.json
│   │   └── index.json
│   ├── health/
│   │   ├── 2026-09-21.json
│   │   └── index.json
│   └── consumer-drift/
│       ├── 2026-09-21.json
│       └── index.json
├── templates/
│   ├── AGENTS.template.md
│   ├── SOUL.template.md
│   ├── agent-profile-design.md
│   ├── task-envelope.schema.json
│   └── delegation-result.schema.json
└── tests/
    ├── validate_skill.py
    ├── architecture-cases.json
    ├── test_architecture_regressions.py
    ├── release-impact-cases.json
    ├── test_release_impact.py
    ├── health-drift-cases.json
    ├── test_health_drift.py
    ├── consumer-impact-cases.json
    ├── test_consumer_impact.py
    ├── test_consumer_drift.py
    ├── hardening-scenarios.json
    └── test_end_to_end_hardening.py
```

External CI file:

`.github/workflows/hermes-architecture-ci.yml`

---

## 61. File Responsibilities

### Root files

- `SKILL.md` - executable operating instructions and reference routing.
- `README.md` - human-facing overview and version layers.
- `VERSION` - semantic version authority.
- `CHANGELOG.md` - semantic evolution history.

### Compatibility

- `hermes-compatibility.json` - baseline release, capability status, verification dates, refresh-policy paths.
- `primitive-routing.json` - deterministic Hermes primitive choices.
- `impact-map.json` - source/capability -> files/routing/tests blast radius.
- `freshness-policy.json` - age thresholds, weights, health thresholds.
- `upgrade-matrix.json` - stable baseline and candidate/history ledger.

### Consumers

- `registry.json` - active canonical downstream Hermes consumers.
- `detection-rules.json` - conservative signatures used to detect dependency drift.

### Maintenance engines

- `impact_engine.py` - severity and knowledge blast radius.
- `health_engine.py` - freshness/health/drift.
- `consumer_impact.py` - downstream consumer impact/actions.
- `consumer_drift.py` - registry/evidence drift.
- `promotion_gate.py` - final knowledge/ecosystem promotion decision.

### Maintenance contracts/schemas

- `source-manifest.json` - primary-source inventory and priorities.
- `weekly-refresh-prompt.md` - actual evolving scheduled-run instructions.
- `weekly-refresh-spec.md` - conceptual maintenance contract.
- schemas - machine-readable contracts for events, audits, registry, and drift snapshots.

### References

`00` through `13` cover Hermes architecture facts and production design. `14` through `18` document the internal maintenance/control layers added during versions 1.2-1.6.

### Research

The research dossier is split into six progressive-disclosure sections so agents do not need to load a monolithic corpus for every task.

### Tests

Tests are deliberately layered from structural integrity through architecture semantics, change impact, health, consumer impact, dependency drift, and full end-to-end hardening.

---

# Part XIX - Design Principles Learned During the Build

## 62. Separate Facts from Control Logic

Hermes facts live in references and compatibility data. Maintenance decisions live in engines/policies. This keeps research updates from silently changing promotion semantics.

## 63. Prefer Deterministic Checks Around Probabilistic Research

An LLM/web audit is inherently semantic. Once it produces structured change evidence, deterministic Python should validate mappings, state consistency, and promotion rules whenever possible.

## 64. Fail Closed on Unknown Architecture

Unknown new Hermes subsystems, ambiguous docs, or missing consumer coverage should trigger review rather than optimistic assumptions.

## 65. Treat Downstream Consumers as a Separate Compatibility Problem

Correct knowledge does not guarantee compatible agents. This is why v1.4-v1.6 introduced consumer mapping, drift, and separate ecosystem clearance.

## 66. Keep Historical Operational Evidence Without Polluting Semantic Versions

Audit snapshots, health reports, and drift snapshots are useful history. They should not create meaningless semantic versions every week.

## 67. Version Control Is Part of the Architecture

Concurrent work occurred several times while v1.1-v1.6 were being developed. The safe pattern was:

- re-fetch `main`;
- preserve unrelated changes;
- rebase/reconstruct the Hermes tree on the newest base;
- rerun CI;
- fast-forward/merge without force overwrite.

Git history and PR review are not administrative details; they are part of the reliability system.

---

# Part XX - Questions This Guide Can Answer in NotebookLM

## 68. Suggested Questions

After uploading this guide, useful questions include:

- What is the difference between a Hermes Profile and a delegated subagent?
- When should I use Kanban instead of `delegate_task`?
- What belongs in SOUL vs AGENTS vs a Skill?
- What are the seven CI gates and what failure does each catch?
- How does the release-impact engine decide severity?
- What happens when Hermes releases a new stable version?
- What is the difference between knowledge promotion and ecosystem compatibility?
- How does the system detect stale knowledge even without a new Hermes release?
- What are the current freshness thresholds?
- Which active skills currently depend on Hermes architecture knowledge?
- Why was `memory` added to the Kaizen consumer registry?
- How does the consumer dependency drift detector avoid false automatic changes?
- What changes require PR review?
- What should a future v1.7 be based on?
- What are the exact steps to build a new production Hermes agent?
- What happens if the scheduled Tuesday audit finds ambiguous provider-routing behavior?
- What happens if a high-criticality consumer is affected by a security change?
- What files do I need to read before changing the architecture?
- What should a new chat do if this guide disagrees with GitHub?

---

# Part XXI - Future Development Handoff Protocol

## 69. If You Want to Improve This System Later

Give a new chat this guide and instruct it to:

1. Connect to/read the canonical GitHub repository.
2. Read `VERSION` and current `SKILL.md` first.
3. Compare current repo state with this guide.
4. Check current Hermes official sources before proposing version-sensitive changes.
5. Identify a real problem/trigger, not merely "what else can we add?"
6. Write an explicit improvement hypothesis.
7. Determine affected control layers.
8. Create/update deterministic regression scenarios before or with the fix.
9. Implement in the smallest canonical files.
10. Run every current CI gate.
11. Rebase onto newest `main` if concurrent work exists.
12. Use PR review when required.
13. Update version/changelog only if semantic knowledge/control behavior changed.
14. Update this master guide when a semantic release materially changes the system.

### Example future request

> Use the attached Hermes Agent Architecture Master Guide as bootstrap context. Treat `Jaskeeratsingh27/Jaskeeratsingh/.agents/skills/hermes-agent-architecture/` as canonical. First inspect the current GitHub version and official Hermes sources. A real issue has occurred: [describe issue]. Determine whether it justifies a semantic version, add a failing regression reproducing the issue, implement the smallest fix, run all current deterministic gates, preserve concurrent repository work, and update the changelog/master guide if appropriate.

---

# Part XXII - Final TL;DR

## 70. One-Page Mental Model

```text
HERMES PLATFORM KNOWLEDGE
    Profiles / Bots
    Delegation / structured output
    Kanban
    Skills / context / SOUL
    Memory
    Tools / MCP / execute_code
    Models / providers
    Cron
    Security
    Observability
             |
             v
CANONICAL KNOWLEDGE SKILL (GitHub)
             |
             +--> primitive routing
             +--> templates/contracts
             +--> production checklist
             |
             v
WEEKLY SOURCE AUDIT
             |
             +--> source change events
             +--> impact classification
             +--> targeted regressions
             |
             v
KNOWLEDGE HEALTH
             |
             +--> freshness
             +--> historical audits
             +--> drift signals
             |
             v
DOWNSTREAM CONSUMERS
             |
             +--> consumer impact
             +--> dependency registry
             +--> dependency drift
             |
             v
PROMOTION / RECOVERY GATE
             |
      +------+------+
      |             |
      v             v
knowledge        ecosystem
promotion        compatibility
      |             |
      +------+------+
             v
        7 CI GATES
             |
             v
     REVIEWED GITHUB MAIN
```

### Final status at v1.6

- Knowledge system: mature.
- Compatibility model: explicit.
- Maintenance: scheduled weekly.
- Freshness: measured.
- Impact analysis: deterministic after structured research evidence.
- Downstream dependency model: explicit.
- Drift detection: active.
- Promotion/recovery: explicit.
- CI: seven deterministic layers.
- Future architecture expansion: paused unless real evidence justifies it.

---

# Appendix A - Canonical Commands

From the skill directory:

```bash
python tests/validate_skill.py
python tests/test_architecture_regressions.py
python tests/test_release_impact.py
python tests/test_health_drift.py
python tests/test_consumer_impact.py
python tests/test_consumer_drift.py
python tests/test_end_to_end_hardening.py
```

Maintenance tools:

```bash
python maintenance/impact_engine.py <change-event.json> --pretty
python maintenance/consumer_impact.py <impact-result.json> --pretty
python maintenance/consumer_drift.py --pretty
python maintenance/health_engine.py --as-of YYYY-MM-DD
python maintenance/promotion_gate.py <maintenance-bundle.json> --pretty
```

---

# Appendix B - Semantic Release Anchors

| Version | PR / anchor | Merge/commit |
|---|---|---|
| 1.0.0 | initial canonical commit | `b6c0f68d2efe5de6847f6823b56be4366f1b1d4a` |
| 1.1.0 | PR #4 | `3336ae60b54cb1cbaa19d227c5eb641c9a971bbc` |
| 1.2.0 | PR #5 | `d75e5d16db0efb3f38ec409174ccdea0c9890436` |
| 1.3.0 | PR #7 | `200e49fadba46a2d545a11a49eb6ccc6a112c335` |
| 1.4.0 | PR #9 | `7fd83d1696532a706ed90feeb5add247e559fe43` |
| 1.5.0 | PR #11 | `b0070a748a18bef558af19b128e69b35ac83b3c2` |
| 1.6.0 | PR #12 | `0627a9e3966bd6d317057d0917b338b2168cb2db` |

---

# Appendix C - Official Hermes Source URLs Recorded by the Skill

- https://github.com/NousResearch/hermes-agent/releases
- https://hermes-agent.nousresearch.com/docs/user-guide/features/overview
- https://hermes-agent.nousresearch.com/docs/user-guide/profiles
- https://hermes-agent.nousresearch.com/docs/user-guide/profile-distributions
- https://hermes-agent.nousresearch.com/docs/user-guide/bot-mode
- https://hermes-agent.nousresearch.com/docs/user-guide/features/skills
- https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files
- https://hermes-agent.nousresearch.com/docs/user-guide/features/memory
- https://hermes-agent.nousresearch.com/docs/user-guide/features/memory-providers
- https://hermes-agent.nousresearch.com/docs/user-guide/features/honcho
- https://hermes-agent.nousresearch.com/docs/user-guide/features/delegation
- https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban
- https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban-worker-lanes
- https://hermes-agent.nousresearch.com/docs/user-guide/features/tools
- https://hermes-agent.nousresearch.com/docs/reference/tools-reference
- https://hermes-agent.nousresearch.com/docs/user-guide/features/code-execution
- https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp
- https://hermes-agent.nousresearch.com/docs/user-guide/features/cron
- https://hermes-agent.nousresearch.com/docs/user-guide/security
- https://hermes-agent.nousresearch.com/docs/user-guide/checkpoints-and-rollback
- https://hermes-agent.nousresearch.com/docs/user-guide/configuring-models
- https://hermes-agent.nousresearch.com/docs/user-guide/features/fallback-providers/
- https://hermes-agent.nousresearch.com/docs/user-guide/features/provider-routing
- https://hermes-agent.nousresearch.com/docs/developer-guide/observer-hooks
- https://hermes-agent.nousresearch.com/docs/developer-guide/plugins

---

# Appendix D - Final Production Checklist

Before implementing or promoting a production Hermes architecture, verify:

### Architecture

- persistent vs ephemeral classification exists for every worker;
- workflow state has one authoritative owner;
- Kanban is used where restart/human/audit durability matters;
- subagent context is explicit;
- contracts exist for machine handoffs;
- artifacts/source of truth are durable.

### Security

- tools are least privilege;
- MCP surface is filtered;
- sandbox/backend is explicit;
- filesystem/workspace boundary is explicit;
- secrets are minimized and not copied into prompts/artifacts;
- destructive operations have controls/approvals.

### Cost/performance

- models are role-specific;
- fallback strategy is explicit;
- subagent depth/concurrency is bounded;
- cost/token/iteration budgets exist;
- deterministic multi-tool work uses `execute_code` where appropriate.

### Observability

- workflow/task/session/turn/API/tool/subagent IDs are correlated;
- token/latency/cost and retry data are attributable;
- sensitive telemetry is redacted.

### Validation

- happy path passes;
- provider failure tested;
- restart tested;
- invalid schema tested;
- human block/unblock tested;
- duplicate/retry side effects tested;
- permission denial tested;
- compatibility test passes against the pinned Hermes target;
- all current skill CI gates pass when changing the knowledge/control system.

---

# Appendix E - Preservation Rules for Any Future AI

Do not lose these rules when continuing the project:

1. GitHub is canonical.
2. Pin Hermes versions for production claims.
3. Official primary sources outrank this guide.
4. Separate persistent Profiles from ephemeral delegated workers.
5. Kanban owns durable workflow truth.
6. Memory is not the architecture KB.
7. Profiles are not sandboxes.
8. Context must be explicit across delegated agents.
9. Machine-consumed outputs should have forgiving contracts.
10. Least privilege should be technical, not only prose.
11. Smallest justified change beats broad rewrite.
12. Ambiguity/unknown architecture fails into review.
13. Stable release transitions are reviewed.
14. Freshness must reflect real reverification.
15. Consumer compatibility is separate from knowledge correctness.
16. Consumer detection does not auto-mutate dependencies.
17. Do not weaken tests to get green CI.
18. Preserve concurrent GitHub work and avoid force overwrites.
19. Routine audits do not need semantic version bumps.
20. After v1.6, future versions should be evidence-driven.

---

**End of Hermes Agent Architecture Master Guide v1.6.0**