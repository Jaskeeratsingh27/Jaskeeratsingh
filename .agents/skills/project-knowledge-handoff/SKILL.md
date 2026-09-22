---
name: project-knowledge-handoff
description: Create, update, validate, version, and preserve an end-to-end master reference guide for any durable project, skill, agent, app, workflow, architecture, or knowledge system. Use automatically at meaningful project completion, release, handoff, migration, or major milestone; use explicitly when the user asks for a knowledge base, master guide, reference pack, NotebookLM source, future-chat handoff, onboarding guide, version-history document, or self-contained project documentation. Keep GitHub canonical, preserve a stable latest guide plus versioned snapshots, and make future chats able to reconstruct the project without relying on conversation memory.
version: 1.0.0
---

# Project Knowledge Handoff

## Mission

Create and maintain a portable, version-controlled project knowledge package that lets a future AI chat, NotebookLM/Gemini notebook, human engineer, or new agent understand a durable project without reading the original development conversation.

The output is not a generic README. It is the project's **continuity layer**.

## Trigger Policy

### Invoke automatically

Use this skill after the primary work is validated when any of these occur:

- the user says the project is complete, final, approved, ready, shipped, deployed, released, or ready for handoff;
- a durable project/skill/agent reaches its first stable milestone;
- a semantic release is created;
- architecture changes materially enough that an existing master guide would become stale;
- a migration or ownership handoff is being completed;
- a durable project is being closed out under `github-project-sync`.

### Suggest rather than force

Suggest this skill when:

- a long-running project has accumulated substantial architecture/history but has not reached a stable milestone;
- a project is likely to continue in future chats;
- the user repeatedly has to re-explain context;
- a project has multiple versions, agents, workflows, deployments, or maintenance automations and no single reference source.

Do not invoke for casual questions, throwaway experiments, short one-off outputs, or tiny edits that do not materially change the project knowledge state.

## Explicit Invocation

- Codex: `$project-knowledge-handoff`
- Claude Code: `/project-knowledge-handoff`
- Normal ChatGPT: ask to **use project-knowledge-handoff**. Normal ChatGPT does not globally auto-scan arbitrary GitHub skills, so fetch this canonical skill from GitHub when explicitly invoked or when repository closeout rules direct its use.

## Source-of-Truth Rules

1. GitHub is canonical for durable project facts and generated guides.
2. Repository files, changelogs, tests, releases, CI, manifests, and commit history outrank chat recollection.
3. Do not invent missing history, versions, capabilities, or decisions.
4. Distinguish current implementation from historical state.
5. Distinguish project version from guide revision.
6. Preserve secrets/privacy boundaries; never copy credentials, tokens, private exports, or sensitive user data into a guide.
7. If repository evidence and chat recollection conflict, verify repository state before documenting.
8. If public/platform facts are version-sensitive, verify them against the appropriate primary sources before presenting them as current.

## Default Knowledge Package Layout

For a durable project, prefer:

```text
docs/
  knowledge/
    MASTER_GUIDE.md
    manifest.json
    history/
      MASTER_GUIDE_v<project-version>.md
    exports/
      MASTER_GUIDE_v<project-version>.docx   # optional
      MASTER_GUIDE_v<project-version>.pdf    # optional
```

If the repository already has an established documentation convention, adapt paths rather than creating a competing hierarchy.

### Stable vs historical files

- `MASTER_GUIDE.md` is the stable canonical latest guide.
- `history/MASTER_GUIDE_vX.Y.Z.md` is an immutable release/milestone snapshot.
- Optional Word/PDF files are derived mirrors, not the authoritative editable source.
- `manifest.json` records what the current guide represents.

## Versioning Model

Project version and guide revision are separate:

- **project_version**: the project's semantic/version identifier, derived from canonical project files/tags.
- **guide_revision**: monotonically increasing integer for knowledge-guide updates.
- **schema_version**: version of the manifest/template contract.

Routine clarification or newly verified context may increment `guide_revision` without changing the project version.

Create a new historical snapshot when:

- the project semantic version changes;
- a release/milestone is declared;
- architecture changes materially enough that preserving a historical guide state is useful;
- the user explicitly asks for a snapshot.

Do not create a new snapshot for every tiny edit.

Read `references/versioning-policy.md` when deciding whether to update only the stable guide or also create a snapshot.

## Operating Procedure

### G0 — qualify and locate

1. Confirm the work is a durable project/skill/agent/app/workflow.
2. Resolve the canonical repository and project root.
3. Find the current project version from authoritative files/tags; if no project version exists, label it clearly as `unversioned` rather than inventing one.
4. Locate any existing master guide, manifest, changelog, release notes, architecture docs, tests, CI workflows, deployment docs, and prior snapshots.
5. Reuse the existing knowledge hierarchy when it is unambiguous.

### G1 — collect evidence

Read only the project evidence needed to reconstruct the system accurately:

- project/skill instructions;
- README/PROJECT files;
- VERSION/package metadata;
- changelog/release notes;
- architecture/reference docs;
- configuration/control files;
- tests and CI;
- deployment/hosting docs when relevant;
- scheduled maintenance definitions;
- active dependency/consumer registries;
- security/observability rules;
- recent meaningful Git history.

Do not use chat history as the sole source for durable claims.

### G2 — build or update the guide

Use `templates/MASTER_GUIDE.template.md` as the default structure.

Every complete guide must contain, when applicable:

1. document identity and current snapshot;
2. how to use the guide;
3. fresh-chat / new-agent bootstrap instructions;
4. source-of-truth hierarchy;
5. executive overview;
6. project purpose and problem statement;
7. architecture / system mental model;
8. capabilities and feature inventory;
9. important workflows and control flows;
10. contracts, schemas, interfaces, or templates;
11. repository/file map;
12. version history and what changed in each meaningful version;
13. current configuration/state;
14. validation, tests, CI, QA, and quality gates;
15. deployment/runtime/hosting behavior where relevant;
16. maintenance and scheduled automation;
17. security/privacy/permissions boundaries;
18. dependencies, consumers, integrations, and external systems;
19. known limitations, caveats, and non-goals;
20. operating playbooks for common future tasks;
21. future iteration rules and evidence-driven roadmap;
22. glossary/quick reference;
23. continuation protocol for a future AI;
24. canonical links/commit anchors where useful.

Omit genuinely irrelevant sections rather than filling them with boilerplate.

### G3 — write for future AI reconstruction

The guide must let a new AI answer:

- What is this project?
- Why does it exist?
- What is canonical?
- What version/state is current?
- What are the major components?
- What can it do?
- How do the components interact?
- What changed over time and why?
- How is it tested?
- How is it deployed/operated?
- What maintenance runs automatically?
- What must never be assumed?
- What known limitations remain?
- What should happen before the next modification?
- What qualifies for another version?
- Which files should a new agent read first?
- Which commands/tests must run before promotion?

Put explicit bootstrap instructions near the beginning rather than forcing a new chat to infer them from later sections.

### G4 — update, don't merely append

When a guide already exists:

1. compare the current repository state with the guide;
2. update stale sections in place;
3. preserve still-valid design rationale;
4. add new version history entries;
5. remove claims that are no longer true or label them historical;
6. update file paths, test counts, automation behavior, and current-state summaries;
7. record material guide changes in the project knowledge manifest;
8. avoid duplicating the same facts across many sections when a canonical cross-reference is clearer.

### G5 — validate continuity quality

Run `scripts/validate_master_guide.py <guide-path> [manifest-path]`.

Validation is necessary but not sufficient. Also manually verify:

- the version/current-state section matches repository evidence;
- named canonical paths exist;
- current CI/test counts are accurate;
- future-chat bootstrap points to the correct files;
- no secrets or sensitive values appear;
- historical facts are not presented as current;
- generated exports match the Markdown source when created.

Use `references/quality-checklist.md` for the final review.

### G6 — preserve in GitHub

After the guide is valid:

1. update/create the stable canonical Markdown guide;
2. update `manifest.json`;
3. create a historical snapshot when snapshot policy requires it;
4. optionally regenerate Word/PDF mirrors;
5. commit the knowledge package with the related release/closeout work when practical;
6. verify the files by reading them back from GitHub;
7. report canonical paths and commit/PR.

Do not claim the knowledge package is preserved until the remote files are verified.

## Closeout Integration

When `github-project-sync` reaches G4 for a durable project, run or recommend this skill before final closeout.

When a project changes after a previous guide was created:

- small non-material change -> no guide update required;
- meaningful behavior/architecture/operations change -> update `MASTER_GUIDE.md`;
- semantic release/major milestone -> update stable guide + create version snapshot;
- derived export requested -> regenerate from the current Markdown guide.

## Guide Manifest

Use `templates/knowledge-manifest.schema.json`.

At minimum it should track:

- project name/slug;
- canonical repository/project root;
- project version;
- guide revision;
- current guide path;
- latest historical snapshot;
- source commit;
- last updated date;
- snapshot policy;
- optional export paths;
- status and known gaps.

The manifest is control data, not a substitute for the guide.

## Output Expectations

At completion report:

- project/version documented;
- canonical guide path;
- manifest path;
- historical snapshot created or not, and why;
- derived exports created;
- validation status;
- source commit/PR;
- known documentation gaps;
- next condition that should trigger an update.

## Recovery Rules

- If the project cannot be fully reconstructed, write only verified sections and list unresolved gaps.
- If an old guide conflicts with current repository state, prefer current verified repository evidence and preserve the old claim only as historical context when useful.
- If a version cannot be resolved, use `unversioned`; never manufacture a semantic version.
- If GitHub write capability is unavailable, produce the guide locally and state exactly what is not yet canonical.
- Never overwrite unrelated documentation or delete historical snapshots to simplify the tree.
- Never regenerate a binary mirror from stale Markdown.

## Preservation Principles

1. GitHub is canonical.
2. Stable latest guide + immutable meaningful snapshots.
3. Evidence before narrative.
4. New-chat bootstrap near the top.
5. Project version != guide revision.
6. Current vs historical facts must be explicit.
7. Generated mirrors are derived artifacts.
8. No secrets or sensitive exports.
9. Update stale facts instead of endlessly appending.
10. Future versions should be justified by real project changes, not documentation churn.
