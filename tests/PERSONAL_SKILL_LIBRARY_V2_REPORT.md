# Personal Skill Library v2.0 Validation Report

Date: 2026-09-25
Release: 2.0.0
Merged commit: `7dec214d8df65e3dd88f0606cb3c9395957cde9e`
Status: PASS

## Goal

Make the GitHub-backed personal skill library a first-class capability for **normal ChatGPT chats** as well as Codex, while retaining GitHub as the canonical source of truth.

## Verified

- Plugin version: 2.0.0
- Canonical skills: 11
- Plugin-packaged skills: 11
- Canonical `agents/openai.yaml` files: 11
- Plugin `agents/openai.yaml` files: 11
- Required products on every skill: `CHAT`, `CODEX`
- Implicit invocation: enabled
- Canonical files: 183
- Mirrored plugin files: 183
- Missing mirrored files: 0
- Content drift: 0
- Runtime GitHub fetch required merely to load a skill: false
- OpenAI install-surface metadata: present
- Personal Skill Library CI: PASS
- Hermes Architecture CI on merge: PASS

## Normal Chat distribution

Desktop/private path:
1. Add the GitHub marketplace.
2. Install `Personal Skill Library` from the ChatGPT desktop Plugin Directory.
3. Start a new normal ChatGPT chat.
4. Test automatic routing with the v2 activation cases.

See `docs/NORMAL_CHAT_SETUP.md`.

## Cross-device/mobile boundary

A local marketplace install should not be assumed to sync to mobile/web.

For personal cross-device distribution, the universal public plugin directory is the documented path available across ChatGPT/Codex surfaces, but submission/publication is intentionally **not performed** because this is a personal library and publishing is a separate privacy decision requiring explicit owner approval.

See `docs/CROSS_DEVICE_DISTRIBUTION.md`.

## Result

v2 is release-ready for normal ChatGPT desktop installation and Codex. Cross-device/mobile publication remains an explicit optional phase.
