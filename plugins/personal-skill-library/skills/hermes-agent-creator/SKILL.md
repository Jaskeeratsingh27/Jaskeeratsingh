---
name: hermes-agent-creator
description: Design, review, and improve autonomous AI agents for the user's Hermes, local-model, knowledge-base, GitHub, and OpenAI-compatible stack. Use when the user asks to build an agent, agent factory, sub-agent, orchestration workflow, agent contract, tool policy, model-routing design, evaluation plan, FMEA, golden-set test, or continuous-improvement control plan. Enforce narrow scope, explicit contracts, validation, failure paths, approval gates, evidence-based readiness, and the two-agent WIP limit.
---

# Hermes Agent Creator

This is the migrated form of the Claude `Hermes Agents Creator` project, strengthened with Batch 3 persistent-memory recovery. Legacy project knowledge remains under `references/legacy/`.

## Current Hermes knowledge dependency

Before making current Hermes-runtime claims, selecting Hermes primitives, or writing Hermes-specific Profile/Bot/subagent/Kanban/context/tool files, consult `.agents/skills/hermes-agent-architecture/SKILL.md` and the relevant references there.

- `hermes-agent-architecture` owns current Hermes platform facts, architecture primitives, version caveats, primary sources, and production compatibility guidance.
- `hermes-agent-creator` owns the agent build/review methodology, quality gates, FMEA, evaluation, and continuous-improvement process.
- Do not duplicate current Hermes platform facts here. If the two skills appear to conflict on Hermes runtime behavior, verify against the pinned Hermes version and primary sources in `hermes-agent-architecture`.

## Read first

- `.agents/skills/hermes-agent-architecture/SKILL.md` for current Hermes platform architecture
- `references/runtime-map.md`
- `references/recovered-hermes-runtime.md`
- `references/recovered-agent-factory.md`
- relevant files under `references/legacy/`

## Definition of an agent

Do not call a prompt an agent. A build is not complete unless it defines:

- bounded instructions and responsibility;
- explicit tool allowlist;
- intentional model/model-tier selection;
- typed or otherwise testable input/output contracts;
- state ownership and handoff format;
- failure/timeout/escalation behavior;
- evaluation evidence.

Deterministic computations and validations belong in scripts/tools the agent calls.

## Build sequence

1. Resolve the target runtime. In particular, distinguish the historical Hermes pipeline from the real Hermes desktop runtime.
2. Check whether an existing agent/skill should be extended instead of creating another component.
3. Enforce WIP limit 2 unless the user explicitly changes that operating policy.
4. Start from the recovered lifecycle: discovery -> research -> design -> implementation -> documentation -> QA -> deployment.
5. Define inputs, outputs, state, tools, model tier, budget/turn limits, failure states, and human stop-gates.
6. For irreversible actions, perform an FMEA before unattended execution.
7. Define measurable quality: first-pass yield, rework turns, escape rate, golden set, failure-path tests, and control plan.
8. Build the thinnest end-to-end slice first.
9. Use deterministic validation for schemas/contracts and run the legacy validator only on compatible legacy definitions.
10. Save durable artifacts to GitHub and record test evidence; conversation state alone is not proof of completion.

## Runtime adaptation

Treat model/API providers as adapters. Do not invent tool names, APIs, quotas, or model parameters; verify current external capabilities when implementation depends on them. For the recovered production direction, Hermes is the control plane and ChatGPT/Claude is primarily an authoring/review environment unless the user intentionally changes that architecture.

## Output discipline

State environment assumptions, architectural choice + rationale, reversibility, contract, state ownership, failure behavior, test evidence, and unresolved risks. Do not label an untested design production-ready.
