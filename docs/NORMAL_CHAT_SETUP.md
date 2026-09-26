# Normal ChatGPT Setup — Personal Skill Library v2

This setup is for using the Personal Skill Library in **regular ChatGPT chats on the ChatGPT desktop app**, not only in Codex.

## Prerequisites

- ChatGPT desktop app on macOS or Windows.
- Codex CLI available for adding the GitHub marketplace source.
- Access to `Jaskeeratsingh27/Jaskeeratsingh`.
- Plugin support available on the account/surface.

## Add the GitHub marketplace

```bash
codex plugin marketplace add Jaskeeratsingh27/Jaskeeratsingh --ref main
```

Verify:

```bash
codex plugin marketplace list
```

Refresh later with:

```bash
codex plugin marketplace upgrade
```

## Install the plugin

1. Restart the ChatGPT desktop app.
2. Open **Plugins** / the **Plugin Directory**.
3. Select the **Jaskeeratsingh Tools** marketplace/source.
4. Open **Personal Skill Library**.
5. Select **Install plugin**.
6. Start a **new regular ChatGPT chat** so the new skill metadata is loaded.

## Test regular Chat

- `Check why ChatGPT cannot access my new GitHub repository.`
  - expected: `github-access-helper`
- `Design a Hermes agent with failure paths and an eval plan.`
  - expected: `hermes-agent-creator`
- `Analyze this process using DMAIC and FMEA.`
  - expected: `kaizen-orchestrator`
- `What personal skills do I have for this task?`
  - expected: `skill-library-router`
- `What is 17 × 23?`
  - expected: no personal skill

## Explicit use

When the surface supports plugin invocation, select the plugin from the composer/More menu or use the available @ invocation UI.

## Important scope

This GitHub/local-marketplace path is intended for supported local ChatGPT desktop clients. Do not assume the installation automatically appears on Android, iOS, or web.

For cross-device distribution, see `CROSS_DEVICE_DISTRIBUTION.md`.
