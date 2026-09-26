# Personal Skill Library Plugin

Version: 2.1.0

This plugin packages the complete reusable skill library for **normal ChatGPT chats and Codex**.

## Source of truth

Canonical skills live under:

`.agents/skills/<skill-name>/`

The plugin mirrors those directories under:

`plugins/personal-skill-library/skills/<skill-name>/`

GitHub remains canonical. The plugin mirror is the installable/distributable snapshot.

## ChatGPT support

Every packaged skill includes `agents/openai.yaml` with:

```yaml
policy:
  products:
    - CHAT
    - CODEX
  allow_implicit_invocation: true
```

This makes regular ChatGPT an explicit supported product for the skill when the plugin is installed on a supported surface.

## Runtime model

ChatGPT first sees skill metadata. When the user's request matches, it can load the dedicated skill instructions. The `skill-library-router` is reserved for library discovery, routing diagnostics, and library maintenance.

No runtime GitHub fetch is required just to load a packaged skill.

## Packaged skills

- skill-library-router
- github-access-helper
- github-project-sync
- project-knowledge-handoff
- kaizen-orchestrator
- hermes-agent-creator
- hermes-agent-architecture
- secondbrain-curator
- anveshak-research-cycle
- youtube-insights-extractor
- usage-efficient-orchestrator

## Install for normal ChatGPT on desktop

See `docs/NORMAL_CHAT_SETUP.md`.

## Cross-device / mobile

A local marketplace install is local-client distribution. It should not be treated as automatic mobile/cloud sync.

For cross-device normal ChatGPT availability on a personal account, use the universal plugin directory if/when you choose to publish this plugin, or another supported cloud-managed distribution route. See `docs/CROSS_DEVICE_DISTRIBUTION.md`.

## Validation

Run `python scripts/validate-skill-library.py`.

The validator checks marketplace registration, plugin metadata, Chat + Codex product targeting, implicit invocation, skill metadata, and canonical/plugin parity.


## One-command personal install

Windows PowerShell:

```powershell
./scripts/install-personal-skill-library.ps1
```

macOS/Linux:

```bash
bash scripts/install-personal-skill-library.sh
```

Both installers register or refresh the GitHub marketplace, verify it is visible to Codex, and print the final ChatGPT desktop restart/install steps.

## Activation test

After installation, use `docs/V2_1_ACTIVATION_TEST.md` in a new regular ChatGPT conversation.
