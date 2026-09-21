# Idea-to-Deploy Loop — recovered blueprint

Evidence level: verbatim Claude project memory; the original `idea-to-deploy-loop-blueprint.md` file is not present.

## Purpose

Connect ideation, human selection, project execution, QA, continuous-improvement review, and closeout into one controlled agentic loop.

## Historical six-stage flow

1. Ideation
2. Telegram control/selection
3. Project-management pipeline
4. QA gate
5. CI/continuous-improvement pipeline
6. Closeout

Suggested historical role names included **Setu** (Telegram control), **Nirmaan** (PM pipeline), **Parakh** (QA), and **Prayaan** (closeout). These were suggestions, not authoritative runtime identifiers.

## Control design recovered

- Seven human gates, all defaulting to **hold** rather than auto-progress.
- Three stop conditions: a hard iteration cap; a diminishing-returns exit when CI finds no Critical/Major issues; and a regression stop when repeated changes cannot be explained safely.
- Build order started with the Telegram control plane so the system could be useful before every downstream stage was complete.
- Historical analysis found roughly 80% overlap between the ideation stage and the existing Hermes nightly idea pipeline; the recommendation was to extend Hermes with a Telegram lane rather than duplicate vault-mining logic.

## Open design questions preserved

The memory record says the blueprint had not yet resolved: extend Hermes vs split/new component; the exact artifact QA snapshots/diffs; whether CI improves the PM artifact or the PM process; canonical loop-state storage; and whether the PM stage writes code or produces a spec for another executor.

## Migration treatment

Preserve as a blueprint/recovery target only. Before implementation, resolve the open questions against the current Hermes control-plane design and current project-state source of truth.
