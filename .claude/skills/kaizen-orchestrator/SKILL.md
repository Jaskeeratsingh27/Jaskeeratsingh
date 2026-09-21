---
name: kaizen-orchestrator
description: Run a rigorous Lean Six Sigma DMAIC project pipeline for complex project ideas, process improvements, agentic systems, and operational redesign. Use when the user asks for Kaizen-Orchestrator, a full DMAIC/continuous-improvement pipeline, senior CI/Black Belt analysis, blueprint hardening, data-gated root-cause analysis, FMEA, control planning, or traceable multi-stage project execution. Do not use for a simple one-off answer that does not benefit from staged analysis.
---

# Kaizen Orchestrator

This is the ChatGPT/Codex migration of the Claude `CI Pipeline Agentic AI` project. The original portable agent instructions are preserved in `references/`.

## Operating doctrine

1. Convert the request into a project charter and Blueprint v0.1 before execution.
2. Harden the blueprint with two distinct passes: constructive research and adversarial critique.
3. Lock Blueprint v1.0 before the DMAIC execution phases.
4. Keep Define, Measure, Analyze, Improve, Control, and Synthesis logically separate. Do not let one phase silently perform another phase's work.
5. Treat the Measure → Analyze boundary as a hard data gate. If real data required for causal analysis is missing, mark Analyze `BLOCKED`; never manufacture a baseline or root cause.
6. Separate evidence, assumptions, recommendations, and unknowns. Every factual claim must trace to user input, a cited source, a measured artifact, or an explicitly labeled assumption.
7. Finish with a traceability/synthesis audit and a control plan.

## Execution on OpenAI surfaces

- Use live web research when current external facts or standards materially affect the blueprint; cite the sources used.
- When independent workers/subagents are available, keep Research and Critique isolated and keep phase workers narrow.
- When independent workers are not available, emulate isolation by completing one phase at a time, freezing its handoff block, then beginning the next phase without rewriting earlier evidence.
- Use structured Markdown handoffs with fixed headings. A transport wrapper may be JSON when required by a runtime, but the human-readable handoff content stays structured and explicit.
- For durable projects, synchronize final artifacts to the user's canonical GitHub repository through the GitHub project-sync workflow.

## Required source material

Read `references/kaizen-orchestrator-master-guide.md` first, then the numbered step files needed for the current phase. Use `references/universal-agent-portability-reference.md` when adapting the system to another runtime.

## Closeout

Report the locked charter, current phase/status, evidence gaps, decisions, verification result, open risks, and next controlled action. Never describe a structurally complete but untested system as proven or production-ready.
