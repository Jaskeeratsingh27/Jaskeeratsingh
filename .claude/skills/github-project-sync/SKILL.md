---
name: github-project-sync
description: Make GitHub the verified canonical record for each new user project, agent, app, website, dashboard, workflow, or reusable skill. Use proactively when the user clearly starts, builds, or approves a durable project, or requests GitHub preservation or sync. Classify the request, verify GitHub capability and permissions, create or reuse the correct repository, save controlled project records and artifacts, verify each milestone, and record defects for improvement. At meaningful project closeout or release, route durable work through project-knowledge-handoff so future chats can reconstruct the project. Do not use for questions, casual brainstorming, or one-off answers without a durable deliverable.
---

# GitHub Project Sync

Treat GitHub as canonical. Chat, local workspaces, and project workspaces are temporary working areas; they are not evidence that a project is synchronized.

Use the gates below. Never announce a repository, commit, sync, or installation as complete until the stated verification passes. Read [project records](references/project-records.md) before creating baseline files. Run `scripts/verify_project_sync.py <project-root>` before each closeout.

## G0 — qualify and route

- Trigger only when the user clearly asks to start, create, build, or approve a durable project. Continue normal discovery without creating a repository for exploration alone.
- Assign a stable project slug: use the user's given name; otherwise derive a short hyphenated name. Search for a matching repository before creating one. Reuse an unmistakable match; never create a duplicate after a rename or resumed chat.
- Record requirements in `PROJECT.md` as `REQ-###`. Include the owner, repository, branch, status, and latest verified commit once known.

## G1 — prove GitHub readiness

1. Verify the authenticated account, repository visibility, and actual content-write permission. Verify repository-creation capability separately; it is not implied by read or write access.
2. If access is missing, provide the approved management link: https://github.com/settings/installations/163378918. If necessary, use https://github.com/apps/chatgpt-codex-connector/installations/new. Never request a password, personal access token, SSH key, or recovery code.
3. If this surface cannot create a repository or write to it, state that exact failed capability, preserve the unsynced artifact locally for the active task, and do not claim synchronization. Resume only after capability is available; do not silently substitute a different owner or public repository.

## G2 — establish the canonical baseline

- Create a **private** repository unless the user explicitly requests public visibility.
- Create `PROJECT.md`, `README.md` when useful, `.gitignore`, `docs/decisions.md`, `docs/artifact-manifest.md`, and `docs/run-ledger.md` using the supplied schemas.
- Keep all material artifacts in the repository: specifications, prompts, agent definitions, code, tests, research summaries, decisions, configuration, and run records.
- Add only references or redacted examples for credentials. Never commit secrets, private keys, tokens, `.env` files, exports containing personal data, or configuration with live credentials.
- Make and verify the baseline change before starting dependent implementation.

## G3 — control execution and verification

- Work in bounded milestones. Map each material artifact and test to one or more `REQ-###` entries in the manifest.
- Before every milestone save, run the bundled verifier. Resolve `FAIL` findings; record accepted exceptions in `docs/decisions.md` with a reason and owner.
- Save after each logical milestone using a concise, truthful description. Record the verified commit reference and outcome in `docs/run-ledger.md`.
- When resuming, read `PROJECT.md`, the manifest, ledger, relevant decisions, and recent history before relying on conversation memory.

## G4 — close, hand off, and learn

- Confirm all in-scope requirements have a traceable artifact and verification result. Confirm no secrets were detected, the manifest is current, and the remote state is visible.
- For a meaningful completion, stable milestone, release, migration, or ownership handoff of a durable project, invoke `project-knowledge-handoff` before final closeout. Create/update the stable master guide and create a historical snapshot when its snapshot policy applies.
- If the project is too small/transient for a master guide, explicitly mark the handoff step not applicable rather than generating boilerplate.
- Report: repository, branch, latest verified commit, completed requirements, open risks, project knowledge-guide status, and next action. Do not call the project synchronized if any of these are unknown.
- Log each failed permission check, duplicate-prevention event, secret finding, verification failure, or continuity/handoff gap in the ledger. Promote recurring causes into the relevant skill improvement backlog.

## Recovery rules

- On a failed write or save, retain the generated files and state the exact unsaved scope. Re-check before retrying; do not overwrite remote work, reset history, force-push, or delete artifacts.
- If the delivery mechanism removes a pending skill change, recreate it from the validated source only after checking the active remote state. Keep the recovery record with the change until remote verification succeeds.
- If project name, owner, or target repository is genuinely ambiguous, ask one focused question; otherwise continue autonomously.
