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
