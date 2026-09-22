# Personal Skills Registry

This repository is the source of truth for reusable AI skills.

## Invocation

| Runtime | Repository path | Invoke explicitly | Automatic use |
|---|---|---|---|
| OpenAI Codex | `.agents/skills/<skill-name>/SKILL.md` | `$skill-name` | Yes, when the skill description matches the task |
| Claude Code | `.claude/skills/<skill-name>/SKILL.md` | `/skill-name` | Yes, when the skill description matches the task |

## Available skills

### github-access-helper

Use for GitHub connection, repository authorization, access verification, connector troubleshooting, and GitHub read/write setup.

- Codex: `$github-access-helper`
- Claude Code: `/github-access-helper`
- Canonical source: `.agents/skills/github-access-helper/SKILL.md`
- Claude project mirror: `.claude/skills/github-access-helper/SKILL.md`

### github-project-sync

Use when starting, building, or approving a durable project, agent, application, dashboard, workflow, or reusable skill that needs verified GitHub-backed records and milestones. At meaningful closeout/release, it routes into `project-knowledge-handoff`.

- Codex: `$github-project-sync`
- Claude Code: `/github-project-sync`
- Canonical source: `.agents/skills/github-project-sync/SKILL.md`
- Claude project mirror: `.claude/skills/github-project-sync/SKILL.md`

### project-knowledge-handoff

Use to create and maintain a self-contained, version-controlled master reference guide for any durable project, skill, agent, application, workflow, or architecture. Trigger at meaningful completion, release, handoff, migration, or major milestone, and whenever the user asks for a knowledge base, NotebookLM source, future-chat handoff, onboarding guide, version history, or comprehensive project reference.

- Codex: `$project-knowledge-handoff`
- Claude Code: `/project-knowledge-handoff`
- Normal ChatGPT: ask to `use project-knowledge-handoff`
- Canonical source: `.agents/skills/project-knowledge-handoff/SKILL.md`
- Claude project mirror: `.claude/skills/project-knowledge-handoff/SKILL.md`

### kaizen-orchestrator

Use for full Lean Six Sigma DMAIC / continuous-improvement pipelines, blueprint hardening, data-gated root-cause analysis, FMEA, traceability, and control planning.

- Codex: `$kaizen-orchestrator`
- Claude Code: `/kaizen-orchestrator`
- Canonical source: `.agents/skills/kaizen-orchestrator/SKILL.md`
- Claude mirror: `.claude/skills/kaizen-orchestrator/SKILL.md`

### hermes-agent-creator

Use to design, review, and improve autonomous agents for Hermes and the broader agent stack with explicit contracts, tool/state boundaries, validation, failure paths, evaluation, FMEA, and control plans. It consults `hermes-agent-architecture` for current Hermes runtime/platform facts.

- Codex: `$hermes-agent-creator`
- Claude Code: `/hermes-agent-creator`
- Canonical source: `.agents/skills/hermes-agent-creator/SKILL.md`
- Claude mirror: `.claude/skills/hermes-agent-creator/SKILL.md`

### hermes-agent-architecture

Use for current Hermes Agent platform knowledge and architecture: Profiles/Bots, delegated subagents, Kanban, skills/context/SOUL, memory, tools/MCP, model routing, Cron, security, observability, structured I/O contracts, production hardening, and Hermes-version compatibility.

- Codex: `$hermes-agent-architecture`
- Claude Code: `/hermes-agent-architecture`
- Canonical source: `.agents/skills/hermes-agent-architecture/SKILL.md`
- Claude mirror: `.claude/skills/hermes-agent-architecture/SKILL.md`

### secondbrain-curator

Use to convert rough material into atomic, linked, PARA-routed Obsidian notes while reusing real vault tags/links, staging writes, preserving reversibility, and avoiding fabricated note relationships.

- Codex: `$secondbrain-curator`
- Claude Code: `/secondbrain-curator`
- Canonical source: `.agents/skills/secondbrain-curator/SKILL.md`
- Claude mirror: `.claude/skills/secondbrain-curator/SKILL.md`

### anveshak-research-cycle

Use for the gated research-to-vault cycle: context lookup, recent AI/agent research, small-batch staging, REVIEW.md approval, local integration, validation, and rollback.

- Codex: `$anveshak-research-cycle`
- Claude Code: `/anveshak-research-cycle`
- Canonical source: `.agents/skills/anveshak-research-cycle/SKILL.md`
- Claude mirror: `.claude/skills/anveshak-research-cycle/SKILL.md`

### youtube-insights-extractor

Use to extract YouTube transcripts and transform them into traceable summaries, coverage-audited walkthroughs, Netra-style watch-it-for-me outputs, action items, or Obsidian-ready atomic notes.

- Codex: `$youtube-insights-extractor`
- Claude Code: `/youtube-insights-extractor`
- Canonical source: `.agents/skills/youtube-insights-extractor/SKILL.md`
- Claude mirror: `.claude/skills/youtube-insights-extractor/SKILL.md`

## Architecture

Each canonical skill is a directory containing a required `SKILL.md` file plus optional scripts/references/assets:

```
.agents/
  skills/
    <skill-name>/
      SKILL.md
      scripts/        # optional
      references/     # optional
      assets/         # optional

.claude/
  skills/
    <skill-name>/
      SKILL.md        # discovery mirror; canonical implementation remains under .agents/
```

The `name` and especially the `description` in YAML frontmatter are important. The description should state both what the skill does and when it should trigger.

## Global installation

Run:

```bash
bash scripts/install-skills.sh
```

This links the canonical `.agents/skills/` directories into both `~/.codex/skills/` and `~/.claude/skills/`, so global installs use the same reference/script tree.

## Adding a skill

1. Create `.agents/skills/<skill-name>/SKILL.md` and any references/scripts it needs.
2. Give it YAML frontmatter with `name` and a precise trigger-oriented `description`.
3. Add/update the thin `.claude/skills/<skill-name>/SKILL.md` discovery mirror; point it to the canonical `.agents` implementation rather than duplicating references.
4. Run `bash scripts/install-skills.sh` on machines where global access is desired.
5. Add the skill to this registry.

## ChatGPT note

This repository gives native discovery/invocation to Codex and Claude Code when installed/configured accordingly. A normal ChatGPT conversation does not automatically scan arbitrary GitHub repositories as a personal skill directory. In normal ChatGPT, the GitHub-connected workflow can fetch a named skill from this repository when requested, but that is not the same as a natively installed ChatGPT Skill.

For project closeout in normal ChatGPT, the stable explicit phrase is: **use project-knowledge-handoff**. When a GitHub-backed project is being closed through `github-project-sync`, the closeout workflow should also suggest or invoke the handoff skill when a durable reference package would be useful.
