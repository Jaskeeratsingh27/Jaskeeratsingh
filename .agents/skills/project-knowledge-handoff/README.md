# Project Knowledge Handoff

A reusable meta-skill for turning durable projects, agents, skills, applications, workflows, and architectures into self-contained, version-controlled knowledge packages.

## Primary outcomes

- Stable latest guide: `docs/knowledge/MASTER_GUIDE.md`
- Knowledge manifest: `docs/knowledge/manifest.json`
- Meaningful historical snapshots: `docs/knowledge/history/MASTER_GUIDE_vX.Y.Z.md`
- Optional Word/PDF mirrors under `docs/knowledge/exports/`

## Why it exists

Long-running AI-assisted projects often lose context across chats. This skill makes project continuity a first-class artifact rather than relying on conversation memory.

The guide is designed to work as:

- NotebookLM/Gemini source material;
- fresh ChatGPT context;
- Codex/Claude onboarding context;
- human engineering documentation;
- future version-maintenance reference.

## Invocation

- Codex: `$project-knowledge-handoff`
- Claude Code: `/project-knowledge-handoff`
- ChatGPT: ask to `use project-knowledge-handoff`

The repository's closeout policy also calls for this skill at meaningful durable-project completion/release points.

## Versioning

The skill distinguishes:

- project version;
- guide revision;
- manifest schema version.

A guide can be updated without inventing a new project version. Historical snapshots are created at meaningful releases/milestones rather than every edit.

## Validation

```bash
python .agents/skills/project-knowledge-handoff/tests/validate_skill.py
python .agents/skills/project-knowledge-handoff/scripts/validate_master_guide.py <guide.md> [manifest.json]
```
