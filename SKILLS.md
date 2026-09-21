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

Use when starting, building, or approving a durable project, agent, application, dashboard, workflow, or reusable skill that needs verified GitHub-backed records and milestones.

- Codex: `$github-project-sync`
- Claude Code: `/github-project-sync`
- Canonical source: `.agents/skills/github-project-sync/SKILL.md`
- Claude project mirror: `.claude/skills/github-project-sync/SKILL.md`

### kaizen-orchestrator

Use for full Lean Six Sigma DMAIC / continuous-improvement pipelines, blueprint hardening, data-gated root-cause analysis, FMEA, traceability, and control planning.

- Codex: `$kaizen-orchestrator`
- Claude Code: `/kaizen-orchestrator`
- Canonical source: `.agents/skills/kaizen-orchestrator/SKILL.md`
- Claude mirror: `.claude/skills/kaizen-orchestrator/SKILL.md`

### hermes-agent-creator

Use to design, review, and improve autonomous agents for Hermes/OmniRoute/local-model/OpenAI workflows with explicit contracts, tool allowlists, validation, failure paths, evaluation, FMEA, and control plans.

- Codex: `$hermes-agent-creator`
- Claude Code: `/hermes-agent-creator`
- Canonical source: `.agents/skills/hermes-agent-creator/SKILL.md`
- Claude mirror: `.claude/skills/hermes-agent-creator/SKILL.md`

### secondbrain-curator

Use to convert rough material into atomic, linked, PARA-routed Obsidian notes while reusing real vault tags/links and avoiding fabricated note relationships.

- Codex: `$secondbrain-curator`
- Claude Code: `/secondbrain-curator`
- Canonical source: `.agents/skills/secondbrain-curator/SKILL.md`
- Claude mirror: `.claude/skills/secondbrain-curator/SKILL.md`

### youtube-insights-extractor

Use to extract YouTube transcripts and transform them into summaries, insights, action items, or Obsidian-ready atomic notes with source traceability.

- Codex: `$youtube-insights-extractor`
- Claude Code: `/youtube-insights-extractor`
- Canonical source: `.agents/skills/youtube-insights-extractor/SKILL.md`
- Claude mirror: `.claude/skills/youtube-insights-extractor/SKILL.md`

## Architecture

Each skill is a directory containing a required `SKILL.md` file:

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
      SKILL.md
```

The `name` and especially the `description` in YAML frontmatter are important. The description should state both what the skill does and when it should trigger so the agent can choose the skill without an explicit invocation.

## Global installation

Run:

```bash
bash scripts/install-skills.sh
```

This links the canonical skills into both:

- `~/.codex/skills/`
- `~/.claude/skills/`

After that, the skills are available across projects, not only when this repository is the current working directory.

## Adding a skill

1. Create `.agents/skills/<skill-name>/SKILL.md`.
2. Give it YAML frontmatter with `name` and a precise `description`.
3. Mirror the same skill under `.claude/skills/<skill-name>/SKILL.md` for project-level Claude discovery.
4. Run `bash scripts/install-skills.sh` on machines where you want global access.
5. Add the skill to this registry.

## ChatGPT note

This repository gives native discovery/invocation to Codex and Claude Code. A normal ChatGPT conversation does not automatically scan arbitrary GitHub repositories as a personal skill directory. In normal ChatGPT, the GitHub-connected workflow can still fetch a named skill from this repository when explicitly requested, but that is not the same as a natively installed ChatGPT Skill.
