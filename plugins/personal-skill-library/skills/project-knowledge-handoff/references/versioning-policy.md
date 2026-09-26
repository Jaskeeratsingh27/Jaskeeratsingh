# Knowledge Guide Versioning Policy

## Three separate versions

### Project version

The product/skill/agent/application version. Derive it from canonical project metadata, tags, VERSION files, package manifests, or release records.

### Guide revision

A monotonically increasing integer stored in the knowledge manifest. Increment whenever the canonical guide changes materially, including corrections that do not change the project version.

### Schema version

The version of the knowledge-manifest/template contract used by this meta-skill.

## Stable guide

`docs/knowledge/MASTER_GUIDE.md` always represents the latest verified project knowledge state.

Update it when:

- behavior changes materially;
- architecture changes;
- operational/deployment behavior changes;
- tests/CI/maintenance controls change;
- dependencies/consumers change materially;
- a meaningful limitation or decision changes;
- a release occurs.

Do not update it for trivial formatting-only project changes unless the guide itself needs correction.

## Historical snapshot

Create `docs/knowledge/history/MASTER_GUIDE_v<project-version>.md` when:

- a semantic project release occurs;
- the user declares a meaningful milestone;
- a major architecture transition should remain historically reconstructable;
- ownership/migration handoff needs a frozen reference.

If the project is unversioned, use a milestone identifier such as `MASTER_GUIDE_milestone-2026-09-22.md` rather than inventing a semantic version.

## Binary exports

Word/PDF exports mirror a specific stable/snapshot Markdown guide.

They are derived artifacts and must not become the only editable source.

Regenerate them after the Markdown source changes if they are intended to remain current.

## Changelog behavior

The master guide should summarize the project changelog; it should not replace the canonical project CHANGELOG.

For long histories:

- include every meaningful semantic release;
- summarize noisy patch details;
- link to canonical changelog/release records where available.

## Snapshot immutability

Historical snapshots should not be silently rewritten after publication. If a snapshot contains a factual error:

- preserve the original when auditability matters;
- record the correction in the stable guide/current manifest;
- create a corrected later snapshot or explicitly version the correction if necessary.
