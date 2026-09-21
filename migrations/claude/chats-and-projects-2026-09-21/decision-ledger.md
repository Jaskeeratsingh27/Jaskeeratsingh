# Durable architecture decisions recovered from the chat history

Only decisions that remain useful for future agent/project work are promoted here. Dated pricing, model quotas, subscription comparisons, and unrelated personal topics are intentionally excluded.

1. **GitHub is canonical for reusable agent/project artifacts.** Conversation state and model memory are supplementary, not evidence of synchronization.
2. **Portable core instructions describe behavior, not vendor tool-call syntax.** Runtime adapters bind those behaviors to actual tools.
3. **Narrow workers + hard gates beat monolithic complexity.** Do not merge independent research/critique or stage-specific responsibilities merely to reduce agent count.
4. **Handoffs must preserve goal, evidence, unknowns, and confidence.** Human-readable structured Markdown is acceptable; typed wrappers are preferred when automation consumes the handoff.
5. **Measure before Analyze.** Causal analysis is blocked when required evidence is not available.
6. **Deterministic work belongs in code/tools.** Model output is validated rather than trusted.
7. **Irreversible actions require explicit human approval and risk analysis.** Publishing, sending, deleting, spending, and comparable actions do not run unattended without the defined gate.
8. **WIP limit: two in-flight agent builds.** Finish, park, or kill one before starting a third unless this policy is explicitly changed.
9. **Definition of Done is evidence-based.** Historical quality doctrine calls for golden-set runs, failure-path testing, and a control plan; structural completeness alone is not production proof.
10. **Prefer extension over duplication.** Check the agent/skill inventory before creating a new component.
11. **Local/low-cost inference is appropriate for volume; high-capability models are reserved for stages that need them.** Exact provider/model routing is runtime-specific and must be verified at implementation time.
12. **Obsidian may remain the content/state source for local knowledge workflows even though the agent definitions and project artifacts are canonical in GitHub.**
