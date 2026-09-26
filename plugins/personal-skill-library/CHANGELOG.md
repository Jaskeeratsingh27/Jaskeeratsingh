# Changelog

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
- Packaged `github-access-helper` natively.
- Preserved `.agents/skills/` as the canonical source of truth.
