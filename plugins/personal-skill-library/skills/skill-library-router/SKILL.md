---
name: skill-library-router
description: Inspect, explain, list, troubleshoot, or manage the user's personal reusable skill library. Use when the user explicitly asks which skills exist, which skill should handle a task, to use the skill-library router, to diagnose skill routing, or to add/update/remove a skill. Do not activate for ordinary GitHub, Hermes, DMAIC, YouTube, Obsidian, project-handoff, or usage-management requests when a dedicated skill already matches.
version: 1.1.0
---

# Skill Library Router

Use this skill for library discovery and routing administration, not as a universal front door for every task.

## Architecture

The canonical source is:

`Jaskeeratsingh27/Jaskeeratsingh/.agents/skills/`

The ChatGPT/Codex plugin package mirrors the canonical skill folders under:

`plugins/personal-skill-library/skills/`

The plugin host sees each packaged skill's `name` and `description` and can activate the dedicated skill directly. Normal task routing should therefore prefer the dedicated skill rather than this router.

## When to use this router

Use it when the user asks to:

- list available personal skills;
- identify which personal skill is best for a task;
- explicitly invoke `skill-library-router`;
- diagnose why a skill did or did not activate;
- add, update, remove, rename, or version a personal skill;
- validate the canonical-to-plugin mirror;
- inspect the skill registry.

## Registry

Read `references/skills-index.json` for compact inventory metadata.

For execution of a specific workflow, load that packaged skill's own `SKILL.md`. Do not substitute this router's instructions for the dedicated skill.

## Selection rules

1. Exact skill name wins when the user names one.
2. Otherwise match the user's goal against skill descriptions.
3. Prefer one dedicated skill.
4. Use a second skill only when the task genuinely spans two workflows.
5. If no personal skill clearly applies, continue normally.
6. Do not load the whole library's full instructions into context.
7. Do not claim a skill exists unless it appears in the packaged library or canonical registry.

## Sync model

GitHub is the source of truth. The plugin package is a mirrored snapshot distributed through the GitHub marketplace. When canonical skills change, regenerate/refresh the mirror and sync the marketplace rather than fetching skill bodies from GitHub at runtime.
