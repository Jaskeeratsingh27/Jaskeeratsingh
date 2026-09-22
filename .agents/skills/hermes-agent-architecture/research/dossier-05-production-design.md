# Hermes Research Dossier — Profile distributions, I/O contracts, roles, failure engineering, cost, production rules

## 20. Profile Distributions: Shipping Complete Agents

Hermes supports Profile Distributions as Git repositories that package a complete agent: `SOUL.md`, configuration, skills, cron jobs, MCP configuration, and distribution metadata. The user's memories, sessions, and credentials remain local. [S26]

This is a strong production deployment mechanism because it makes agent definitions versionable and updateable through Git.

A typical distribution contains:

```text
agent-distribution/
  distribution.yaml
  SOUL.md
  config.yaml
  mcp.json
  skills/
  cron/
  README.md
```

### Recommended use

Use Profile Distributions when a persistent specialist is a maintained product or team artifact that should be deployed consistently across machines/environments.

Use a shared version-controlled skills repository for reusable cross-profile procedures/knowledge, and separate Profile distributions for role-specific identity/configuration.

---

## 21. Recommended Agent-to-Agent I/O Contracts

A production multi-agent system should formalize both task input and result output.

### Task envelope

```json
{
  "contract_version": "1.0",
  "task_id": "...",
  "parent_task_id": null,
  "objective": "...",
  "context_refs": [],
  "inputs": {},
  "constraints": [],
  "acceptance_criteria": [],
  "expected_artifacts": [],
  "verification_requirements": [],
  "priority": "normal",
  "budget": {
    "max_iterations": null,
    "max_children": null,
    "cost_limit": null
  }
}
```

### Result envelope

```json
{
  "status": "completed",
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

### Contract rule

Do not require every possible field in delegated `output_schema`. Hermes' own documentation recommends forgiving schemas. Require only what the downstream consumer absolutely needs, while allowing extra fields and partial evidence where safe. [S07]

---

## 22. Recommended Persistent Agent Roles

A strong baseline fleet for engineering work is:

### 1. Orchestrator Profile
Owns:

- intake
- decomposition
- Kanban task graph
- routing
- escalation
- high-level acceptance

Does not own:

- broad code edits
- deep specialist implementation
- self-review of every artifact

### 2. Research Profile
Owns:

- primary-source investigation
- evidence collection
- comparisons
- uncertainty tracking

Can use ephemeral delegated workers for parallel source slices.

### 3. Architect Profile
Owns:

- system boundaries
- contracts
- ADRs
- dependency decisions
- implementation plan

### 4. Engineer Profile
Owns:

- code/config changes
- tests
- artifacts
- implementation evidence

Prefer per-task worktrees.

### 5. Reviewer / QA Profile
Owns:

- independent verification
- regression testing
- acceptance contract
- request changes / approval evidence

### 6. Release Profile
Owns:

- deployment tooling
- rollout
- release notes
- post-deploy checks

Give this role deployment credentials/tools that earlier profiles do not need.

---

## 23. Failure Engineering

A production Hermes system should explicitly model:

### Provider failures

Use configured fallback chains and credential pools, but track the cost/cache implications. [S21]

### Agent crash/restart

Use Kanban for durable tasks; do not depend on in-flight `delegate_task` workers resuming. [S07][S08]

### Invalid structured output

Use Hermes schema validation metadata. Downstream logic should distinguish valid structured data from raw unvalidated fallback text. [S07]

### Human intervention

Represent blocked tasks explicitly in Kanban rather than allowing an agent to guess through missing authority/information. [S08][S20]

### Duplicate/retry side effects

Use idempotency keys where available and design external writes/deployments to be idempotent or detectable.

### Long operations

Use explicit timeouts/heartbeats where appropriate. Do not assume a conversational session is a reliable long-running job supervisor.

### Verification failure

The implementer should not simply declare success. Use required evidence and independent review when the risk warrants it.

---

## 24. Cost and Token Optimization

Hermes architecture gives several levers:

1. Use cheaper models for specialized/routine Profiles.
2. Use auxiliary model overrides for compression/title/search routing.
3. Use `execute_code` to prevent large intermediate tool outputs from repeatedly entering model context. [S14][S16]
4. Use progressive skill disclosure instead of injecting full knowledge corpora. [S05]
5. Bound delegation concurrency/depth. [S07]
6. Use structured results to reduce verbose handoff prose.
7. Keep task context minimal and explicit.
8. Avoid cross-provider fallback churn in very long sessions when not needed, because prompt-cache reuse can be lost. [S21]
9. Split durable work into Kanban tasks so each specialist receives only relevant context.

A frontier model should be spent where reasoning errors are expensive—often orchestration/architecture—not indiscriminately on every worker.

---

## 25. Production-Ready Design Rules

The following rules summarize the research into a durable operating standard:

1. **Pin Hermes.** Never design production behavior against an unspecified moving `main`.
2. **One persistent specialist = one Profile.**
3. **One short isolated task = delegation.**
4. **Durable multi-agent work = Kanban.**
5. **Reusable procedure/knowledge = Skill.**
6. **Identity = SOUL; project policy = AGENTS/.hermes.**
7. **Memory is small context, not a document database.**
8. **Git/files/datastores hold objective engineering truth.**
9. **Use structured I/O contracts at agent boundaries.**
10. **Keep delegated JSON schemas forgiving.**
11. **Capability restrictions should be technical, not merely prompt instructions.**
12. **Profiles do not provide OS isolation.**
13. **Use sandboxed execution for production side effects.**
14. **Use worktrees for parallel code-writing agents.**
15. **Design retries, blocking, escalation, partial results, and idempotency before launch.**
16. **Use hooks/correlation IDs for end-to-end traces.**
17. **Schedule knowledge refreshes as reviewed/versioned maintenance, not blind overwrites.**
18. **Test architecture after every Hermes upgrade.**

---
