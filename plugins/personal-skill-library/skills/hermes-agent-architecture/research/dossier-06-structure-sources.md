# Hermes Research Dossier — Skill structure, primary sources, confidence notes

## 26. Proposed Hermes Knowledge Skill Structure

The companion skill package created from this research uses:

```text
hermes-agent-architecture/
  SKILL.md
  README.md
  VERSION
  CHANGELOG.md
  references/
    00-architecture-map.md
    01-profiles-bots.md
    02-delegation.md
    03-kanban.md
    04-skills-context-soul.md
    05-memory-sessions.md
    06-tools-code-mcp.md
    07-model-routing.md
    08-cron-automation.md
    09-security.md
    10-observability-hooks.md
    11-production-checklist.md
    12-versioning-known-caveats.md
    13-source-index.md
  templates/
    task-envelope.schema.json
    delegation-result.schema.json
    agent-profile-design.md
    AGENTS.template.md
    SOUL.template.md
  maintenance/
    weekly-refresh-spec.md
  research/
    HERMES_AGENT_RESEARCH_DOSSIER.md
```

This follows Hermes' own knowledge-base skill pattern: a lean entry-point plus topic references loaded on demand. [S05]

---

# Primary Sources

**[S01] Hermes Agent Releases — GitHub**  
https://github.com/NousResearch/hermes-agent/releases

**[S02] Hermes Agent Pull Requests — GitHub**  
https://github.com/NousResearch/hermes-agent/pulls

**[S03] Profiles: Running Multiple Agents**  
https://hermes-agent.nousresearch.com/docs/user-guide/profiles

**[S04] Bot Mode**  
https://hermes-agent.nousresearch.com/docs/user-guide/bot-mode

**[S05] Skills System**  
https://hermes-agent.nousresearch.com/docs/user-guide/features/skills

**[S06] Context Files**  
https://hermes-agent.nousresearch.com/docs/user-guide/features/context-files

**[S07] Subagent Delegation**  
https://hermes-agent.nousresearch.com/docs/user-guide/features/delegation

**[S08] Kanban — Multi-Agent Board**  
https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban

**[S09] Persistent Memory**  
https://hermes-agent.nousresearch.com/docs/user-guide/features/memory

**[S10] Memory Providers**  
https://hermes-agent.nousresearch.com/docs/user-guide/features/memory-providers

**[S11] Honcho Memory**  
https://hermes-agent.nousresearch.com/docs/user-guide/features/honcho

**[S12] Features Overview**  
https://hermes-agent.nousresearch.com/docs/user-guide/features/overview

**[S13] Tools & Toolsets**  
https://hermes-agent.nousresearch.com/docs/user-guide/features/tools

**[S14] Code Execution**  
https://hermes-agent.nousresearch.com/docs/user-guide/features/code-execution

**[S15] MCP (Model Context Protocol)**  
https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp

**[S16] Configuring Models**  
https://hermes-agent.nousresearch.com/docs/user-guide/configuring-models

**[S17] Scheduled Tasks (Cron)**  
https://hermes-agent.nousresearch.com/docs/user-guide/features/cron

**[S18] Security**  
https://hermes-agent.nousresearch.com/docs/user-guide/security

**[S19] Git Worktrees**  
https://hermes-agent.nousresearch.com/docs/user-guide/git-worktrees

**[S20] Kanban Worker Lanes**  
https://hermes-agent.nousresearch.com/docs/user-guide/features/kanban-worker-lanes

**[S21] Fallback Providers**  
https://hermes-agent.nousresearch.com/docs/user-guide/features/fallback-providers/

**[S22] Provider Routing**  
https://hermes-agent.nousresearch.com/docs/user-guide/features/provider-routing

**[S23] Checkpoints and Rollback**  
https://hermes-agent.nousresearch.com/docs/user-guide/checkpoints-and-rollback

**[S24] Observer Hooks**  
https://hermes-agent.nousresearch.com/docs/developer-guide/observer-hooks

**[S25] Build a Hermes Plugin**  
https://hermes-agent.nousresearch.com/docs/developer-guide/plugins

**[S26] Profile Distributions: Share a Whole Agent**  
https://hermes-agent.nousresearch.com/docs/user-guide/profile-distributions

---

## Research Notes / Confidence

- High confidence: Profiles, skill loading, context-file hierarchy, built-in memory boundaries, delegation context isolation, structured subagent output, Kanban vs delegation guidance, code execution, cron, security, observability, model/fallback concepts. These are directly documented by official Hermes sources accessed on 2026-09-21.
- Version-sensitive: exact delegation nesting syntax/defaults, Kanban implementation details, provider/model catalogs, desktop/Bot features, MCP auth internals, hook payload fields, and scheduler implementation. Validate against the pinned release/commit before production use.
- Architectural recommendations in this dossier (e.g. Kanban as authoritative workflow control plane, profile-role decomposition, result envelopes) are engineering synthesis built on Hermes' documented primitives rather than claims that Hermes mandates one exact topology.
