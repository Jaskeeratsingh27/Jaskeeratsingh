# Hermes Research Dossier — Weekly refresh, security, checkpoints/worktrees, hooks/observability

## 16. Weekly Hermes Knowledge Refresh Design

A weekly refresh process for this skill should be built as a controlled maintenance workflow rather than a blind web-scrape overwrite.

### Suggested process

1. Read the currently recorded stable Hermes version.
2. Check the official GitHub releases page for newer stable tags.
3. Review release notes for architecture-impacting changes.
4. Re-read primary docs for affected areas.
5. Compare current claims to new behavior.
6. Produce a change report first.
7. Mark ambiguous behavior as `NEEDS_VERIFICATION` instead of rewriting guidance automatically.
8. Update only verified claims.
9. Run skill/schema/link tests.
10. Commit/version the update in Git, ideally through a branch/PR review gate.

### Why not auto-overwrite immediately

Hermes develops quickly and documentation may move ahead of a stable tag. A blind scheduled rewrite could make the knowledge base internally inconsistent with the deployed Hermes version.

A safer design is:

```text
weekly research -> change report -> verification -> patch -> tests -> versioned promotion
```

The skill package includes `maintenance/weekly-refresh-spec.md` for this future automation.

---

## 17. Security Architecture

Hermes documentation describes defense-in-depth across user authorization, dangerous-command approval, file-write safety, sandbox/container isolation, MCP credential filtering, context scanning, cross-session isolation, and input sanitization. [S18]

### Production sandboxing

The docs recommend isolated terminal backends such as Docker, Modal, Daytona, or Vercel Sandbox for production gateway deployments. [S18]

### Profile isolation is not execution isolation

This distinction is critical:

- Profile -> Hermes state boundary
- Workspace -> starting/project directory
- Sandbox/backend -> execution/security boundary

Do not use `SOUL.md`, Profile separation, or working-directory conventions as substitutes for OS/container controls. [S03][S18]

### Environment variables and secrets

Hermes applies environment filtering to terminal/code-execution paths, with explicit passthrough mechanisms for skills/backends. Anything explicitly forwarded should be treated as readable by code in that execution context. [S14][S18]

### Third-party skills and project context

Project-local skills are scanned and require trust; dangerous content can be quarantined. Context files are also scanned for prompt-injection patterns before injection. [S05][S06][S18]

### Production least-privilege checklist

For each profile answer:

1. What can it read?
2. What can it write?
3. What commands can it run?
4. What credentials can it access?
5. What MCP actions can it invoke?
6. What network destinations can it reach?
7. What requires human approval?
8. What side effects are reversible/idempotent?
9. What sensitive data can appear in logs/traces?

---

## 18. Checkpoints and Worktrees

Hermes supports checkpoints that can snapshot project state before file/destructive operations and restore through rollback. The current documentation describes checkpoints as opt-in and implemented using a shadow Git store rather than modifying the project's real `.git`. [S23]

Hermes also supports Git worktrees for isolated coding sessions/tasks. Multiple agents can work on separate branches/worktrees in parallel. [S19]

### Recommended software-engineering pattern

```text
Kanban task
   -> dedicated worktree
   -> engineering agent edits/tests
   -> review agent validates same task/artifacts
   -> merge/publish gate
```

This reduces file conflicts and creates a clear change boundary per agent task.

---

## 19. Hooks, Plugins, and Observability

Hermes exposes observer hooks for reconstructing agent execution without changing behavior. Current documentation describes lifecycle events around sessions, turns, provider API requests, tools, approvals, and subagents. [S24]

### Key correlation fields

The observer contract includes identifiers such as: [S24]

- `session_id`
- `task_id`
- `turn_id`
- `api_request_id`
- `api_call_count`
- `tool_call_id`
- parent/child session IDs
- parent/child subagent IDs
- parent turn ID

These enable end-to-end traces.

### Recommended trace model

```text
workflow / Kanban task
  -> profile/session
     -> turn
        -> provider API request(s)
        -> tool call(s)
        -> child/subagent execution(s)
```

Metrics should include:

- input/output tokens
- model/provider
- reasoning configuration
- latency
- retry count
- tool duration/status
- subagent duration/status
- schema validation outcome
- Kanban lifecycle events
- cost estimate
- verification result

### Observer hooks vs enforcement hooks

The official documentation distinguishes observer behavior from behavior-affecting hooks. Some older/behavioral hooks can inject context, block/modify tool calls, or transform tool/model results. [S24][S25]

Use read-only hooks for telemetry. Use behavior-changing hooks deliberately as policy code and test them like application logic.

---
