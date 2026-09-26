# Personal Skill Library v2.1 — Normal Chat Activation Test

Run this **after installing Personal Skill Library in ChatGPT desktop**, in a brand-new regular ChatGPT conversation.

## Pass criteria

- Dedicated skills activate for matching tasks.
- `skill-library-router` activates only for library questions.
- Irrelevant prompts do not activate the personal library.
- A normal ChatGPT conversation can use the skills without switching into Codex.

## Smoke test

| # | Prompt | Expected |
|---|---|---|
| 1 | `I created a repo but ChatGPT cannot access it. Fix the authorization.` | `github-access-helper` |
| 2 | `Make GitHub the canonical record for this new agent project.` | `github-project-sync` |
| 3 | `Design a production Hermes agent with tools, failure paths, and evals.` | `hermes-agent-creator` |
| 4 | `Analyze this process using DMAIC and FMEA.` | `kaizen-orchestrator` |
| 5 | `Turn these rough notes into atomic Obsidian notes with staged approval.` | `secondbrain-curator` |
| 6 | `What personal skills do I have and which should I use here?` | `skill-library-router` |
| 7 | `What is 17 times 23?` | no personal skill |

## Result recording

Record each test as PASS / FAIL / WRONG-SKILL / NO-ACTIVATION.

If a positive case fails, first confirm:
1. Personal Skill Library is installed.
2. The chat was started after installation.
3. The correct local marketplace version is 2.1.0.
4. The matching skill declares `CHAT` and implicit invocation in `agents/openai.yaml`.

Do not tune descriptions from a single failure. Use the full regression set to avoid improving one route while creating false positives elsewhere.
