---
name: skill-library-router
description: Inspect, explain, list, troubleshoot, or manage the user's personal reusable skill library. Use when the user asks which personal skills exist, which skill should handle a task, why a skill did or did not activate, or to add/update/remove/version a skill. Do not activate for ordinary GitHub, Hermes, DMAIC, YouTube, Obsidian, project-handoff, or usage-management requests when a dedicated skill already matches.
version: 2.0.0
---

# Skill Library Router

Use this skill for library discovery and routing administration, not as a universal front door for every task.

## Architecture

Canonical source:

`Jaskeeratsingh27/Jaskeeratsingh/.agents/skills/`

ChatGPT/Codex distributable mirror:

`plugins/personal-skill-library/skills/`

Each packaged skill includes `agents/openai.yaml` declaring both `CHAT` and `CODEX`, with implicit invocation enabled. Normal ChatGPT chats can therefore consider dedicated skills directly after the plugin is installed on a supported surface.

## When to use this router

Use it when the user asks to:

- list available personal skills;
- identify which personal skill is best for a task;
- explicitly invoke `skill-library-router`;
- diagnose skill activation or routing;
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
4. Add a second skill only when the task genuinely spans two workflows.
5. If no personal skill clearly applies, continue normally.
6. Do not load the whole library's full instructions into context.
7. Do not claim a skill exists unless it appears in the packaged library or canonical registry.

## Distribution model

GitHub remains the source of truth. The plugin package mirrors the canonical library and is the distribution layer for normal ChatGPT and Codex.

For personal desktop use, add this GitHub marketplace to the ChatGPT desktop/Codex plugin browser and install `Personal Skill Library`.

Cross-device/mobile use on a personal account requires availability through OpenAI's universal plugin directory or another supported cloud-managed distribution route. Do not claim that local desktop installation automatically syncs to mobile.
