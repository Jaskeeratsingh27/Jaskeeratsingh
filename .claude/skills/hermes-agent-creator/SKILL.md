---
name: hermes-agent-creator
description: Design, review, and improve autonomous AI agents for the user's Hermes, OmniRoute, local-model, Obsidian, GitHub, and OpenAI stack. Use when the user asks to build an agent, agent factory, sub-agent, orchestration workflow, agent contract, tool policy, model-routing design, evaluation plan, FMEA, golden-set test, or continuous-improvement control plan. Enforce narrow scope, explicit contracts, validation, failure paths, approval gates, and the two-agent WIP limit.
---

# Hermes Agent Creator

This is the migrated form of the Claude `Hermes Agents Creator` project. The legacy knowledge base is preserved under `references/legacy/`; read `references/runtime-map.md` before applying any Claude-specific implementation detail.

## Definition of an agent

Do not call a prompt an agent. A build is not complete unless it defines:

- bounded instructions and responsibility;
- explicit tool allowlist;
- intentional model or model-tier selection;
- typed input and output contracts;
- a failure/timeout/escalation path.

Deterministic computations and validations belong in scripts or tools the agent calls.

## Build sequence

1. Read `references/legacy/glossary.md`, `stack.md`, `risks.md`, `agent-inventory.md`, and `shared-infrastructure.md`.
2. Check whether an existing agent/skill should be extended instead of creating another component.
3. Enforce WIP limit 2. If a third build is started, require finish/park/kill of an existing in-flight item.
4. Start from `references/legacy/agent-template.md` and `agent-conventions.md`.
5. Define inputs, outputs, tools, model tier, `maxTurns`/budget equivalent, failure states, and human stop-gates.
6. For irreversible actions, perform an FMEA before unattended execution.
7. Define measurable quality: first-pass yield, rework turns, escape rate, golden set, failure-path tests, and a control plan.
8. Build the thinnest end-to-end slice first.
9. Run `scripts/validate_agent.py` on legacy-style agent definition files when their frontmatter matches that validator's schema. Do not run it against this `SKILL.md` format.
10. Save durable artifacts to GitHub and record test evidence; conversation state alone is not proof of completion.

## OpenAI adaptation

Use `references/runtime-map.md` to translate legacy Claude-specific runtime statements. Do not invent tool names, APIs, quotas, or model parameters. Verify current external capabilities before designing around them.

## Output discipline

State environment assumptions, architectural choice + one-line rationale, reversibility, contract, failure behavior, test evidence, and unresolved risks. Do not label an untested design production-ready.
