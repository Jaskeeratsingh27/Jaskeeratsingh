# Skills, Context Files, and SOUL

## Skills

Hermes skills are on-demand knowledge/procedure documents compatible with the Agent Skills standard. `SKILL.md` is the entry point; large knowledge bases should put detailed material under `references/` so content is loaded only when relevant.

Typical skill structure:

```text
skill-name/
  SKILL.md
  references/
  templates/
  scripts/
  examples/
  assets/
```

Use skills for SOPs, decision rules, domain knowledge, output templates, and reusable procedures.

## Auto-loaded skills

Stable v0.21.4 supports profile-scoped `skills.auto_load`. Named skills in that setting are pinned into every new session's prompt, including CLI, TUI, gateway, Cron, and API sessions. Use auto-load only for procedures that truly belong in every session for that profile; keep large or situational knowledge on demand so progressive disclosure still controls context size.

## Project context

Hermes automatically discovers project instructions. Current documented priority is approximately:

`.hermes.md/HERMES.md` -> `AGENTS.override.md` -> `AGENTS.md` -> `CLAUDE.md` -> `.cursorrules`

Only the winning project context type is loaded per session, while hierarchical `AGENTS.md` files can merge from repo root toward deeper working directories. Progressive discovery can inject more-specific subdirectory context as the agent works.

Use `AGENTS.md` for repo architecture, coding conventions, directory-specific rules, build/test commands, and project-level constraints.

## SOUL.md

`SOUL.md` is profile-global identity/personality context loaded from `HERMES_HOME`. It should answer who the persistent agent is and how it approaches its role. Do not overload SOUL with project-specific technical instructions that belong in `AGENTS.md` or skills.

## Separation rule

- SOUL: identity/role philosophy
- AGENTS/.hermes: project rules
- Skill: reusable procedure/knowledge
- Task envelope: current objective/constraints
- Memory: small durable learned facts

Keeping these distinct reduces prompt conflict and makes updates safer.
