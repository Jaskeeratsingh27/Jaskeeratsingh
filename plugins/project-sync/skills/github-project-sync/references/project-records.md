# Canonical project records

Create these files at G2. Keep headings even when their value is `TBD`.

## `PROJECT.md`

```markdown
# <Project name>

## Identity
- Repository: `<owner>/<repo>`
- Visibility: private|public
- Branch: `main`
- Status: discovery|active|blocked|closed
- Latest verified commit: `TBD`

## Purpose
<One paragraph>

## Requirements
| ID | Requirement | Acceptance evidence | Status |
|---|---|---|---|
| REQ-001 | | | planned |

## Scope and decisions
<Links to decisions or short summary>

## Open risks and next action
- Risk:
- Next:
```

## `docs/artifact-manifest.md`

```markdown
# Artifact manifest

| Path | Purpose | Requirement IDs | Verification | Status |
|---|---|---|---|---|
```

## `docs/decisions.md`

```markdown
# Decision log

| ID | Date | Decision | Reason | Owner | Impact |
|---|---|---|---|---|---|
```

## `docs/run-ledger.md`

```markdown
# Run ledger

| Date | Gate | Outcome | Verified commit | Defect / exception | Next action |
|---|---|---|---|---|---|
```
