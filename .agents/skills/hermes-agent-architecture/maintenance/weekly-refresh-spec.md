# Weekly Hermes Knowledge Refresh Specification

Status: ACTIVE MAINTENANCE CONTRACT. The canonical skill has an external ChatGPT scheduled audit every Tuesday at 02:00 America/Winnipeg; this repository file defines how that audit must behave.

## Objective

Keep the Hermes Agent architecture knowledge base synchronized with official releases and documentation without silently introducing unverified behavior, unnecessary rewrites, or unbounded regression work.

## Cadence

Weekly. The active external scheduler runs Tuesday at 02:00 America/Winnipeg using regular ChatGPT chat with web/GitHub access rather than Work/Codex unless the user explicitly changes that policy.

## Primary sources

Use `maintenance/source-manifest.json` as the machine-readable watch list and `references/13-source-index.md` as the human-readable index. Prefer official Hermes docs, official GitHub releases/tags, and deployed-tag source code.

## v1.2 control flow

```text
official sources
   -> structured change event(s)
   -> release-impact engine
   -> severity + blast radius
   -> targeted analysis/regressions
   -> smallest canonical patch
   -> compatibility/upgrade update
   -> full deterministic CI
   -> reviewed promotion when required
```

## Workflow

1. Read the current compatibility baseline and upgrade matrix.
2. Check GitHub releases for a stable tag newer than the recorded baseline.
3. Review primary sources according to source-manifest priority.
4. Convert each distinct change into a JSON event conforming to `maintenance/change-event.schema.json`.
5. Run `maintenance/impact_engine.py` before editing.
6. Use `compatibility/impact-map.json` to derive affected knowledge files, routing rules, and targeted architecture regression cases.
7. Produce `research/weekly-change-report-YYYY-MM-DD.md` with the aggregated impact assessment.
8. If evidence is ambiguous, mark affected capabilities `needs_revalidation`; do not rewrite them as verified facts.
9. If no material/ambiguous change exists, leave canonical knowledge and version untouched.
10. If a stable release changed, populate `upgrade-matrix.json.next_upgrade` and require a branch/PR.
11. Patch only the smallest affected files; any broader edit needs written justification in the change report.
12. Update `SKILL.md` only when operating procedure or canonical architectural guidance changes.
13. Update the research dossier only when conceptual understanding changes.
14. Update `primitive-routing.json` only when primitive selection actually changes.
15. Run all deterministic gates:
    - structural/compatibility validation
    - architecture regression validation
    - release-impact regression validation
16. Promote only after required review and passing CI.
17. After a verified stable-release promotion, append the transition to the upgrade history and update the current baseline.

## Severity / promotion policy

- `info`: observation only; no canonical rewrite.
- `patch`: verified documentation-only correction; may be low-risk.
- `minor`: verified behavior/deprecation or stable transition without known breaking architecture.
- `major`: breaking/architectural change, ambiguous evidence, or unknown source/capability.
- `critical`: security-impacting change.

Branch/PR review is mandatory for every stable-release transition and every major/critical/ambiguous/unknown impact.

## Scheduled-run behavior

- use `hermes-agent-architecture` as the governing maintenance contract
- operate against the GitHub canonical repository
- preserve release-vs-main distinctions
- do not self-schedule recursively
- do not automatically publish high-risk semantic changes
- do not use Work/Codex unless explicitly requested
- report the highest severity plus per-event impact details

## Acceptance criteria

A refresh is complete only if:

- every changed claim is tied to official primary-source evidence;
- every material/ambiguous change has a structured event;
- every event has been classified by the impact engine;
- compatibility and upgrade state reflect verified knowledge;
- the patch is limited to the justified blast radius;
- all three deterministic validation suites pass;
- required GitHub review/promotion rules were followed.
