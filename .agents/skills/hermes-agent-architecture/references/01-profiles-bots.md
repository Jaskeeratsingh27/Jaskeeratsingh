# Profiles and Bot Mode

## Profiles are persistent agent homes

A Hermes profile has its own `config.yaml`, `.env`, `SOUL.md`, memory, sessions, skills, cron jobs, state database, and gateway state. Use a separate profile for each durable specialist role.

Do not run independent writers against the same profile home. Hermes documentation warns that automatic memory writes can cross-contaminate state when two processes share the same profile.

## Bot Mode

A Bot Mode bot is a profile presented in the desktop roster. It is not a different runtime primitive. A Bot therefore inherits the profile's isolated config, memory, skills, credentials, model, and history.

Use Bots for persistent named collaborators; use subagents for temporary workers.

## Profiles are not sandboxes

A profile scopes Hermes state through `HERMES_HOME`, but on a local terminal backend the process still has the OS user's normal filesystem access. Use terminal backends (Docker/Modal/Daytona/Vercel Sandbox, etc.), `terminal.cwd`, filesystem controls, and tool exposure for actual isolation.

## Role descriptions

Hermes profile descriptions are useful to Kanban routing/decomposition. Give every worker profile a precise description of its responsibilities, inputs, outputs, and exclusions.

## Production recommendation

Create one persistent profile per role boundary that needs independent:

- model/provider
- tools/permissions
- SOUL/personality
- skills
- memory/history
- credentials
- cron/gateway behavior

Avoid creating profiles merely to parallelize one short task; use delegation instead.
