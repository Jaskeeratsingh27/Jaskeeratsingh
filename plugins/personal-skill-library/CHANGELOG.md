# Changelog

## 2.0.0

- Made regular ChatGPT a first-class target for every packaged skill.
- Added `agents/openai.yaml` to all 11 canonical and plugin-mirrored skills.
- Declared `products: [CHAT, CODEX]` for every skill.
- Enabled implicit invocation for every skill.
- Added OpenAI install-surface metadata to the plugin manifest.
- Added normal ChatGPT desktop installation instructions.
- Added cross-device/mobile distribution guidance without assuming local installs sync to mobile.
- Hardened validation to fail when Chat support or implicit invocation is missing.

## 1.1.0

- Mirrored the complete canonical skill library into the plugin package.
- Packaged 11 skills and all supporting references/scripts/assets.
- Removed the runtime GitHub-fetch requirement for skill loading.
- Narrowed `skill-library-router` so dedicated skills can activate directly.
- Added deterministic canonical-to-plugin mirror validation.
- Added routing evaluation cases for post-install testing.

## 1.0.0

- Added the personal skill-library plugin.
- Added `skill-library-router` with progressive-disclosure routing.
- Indexed the initial canonical skills.
- Preserved `.agents/skills/` as the canonical source of truth.
