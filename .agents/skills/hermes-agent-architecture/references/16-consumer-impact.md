# Consumer Impact Intelligence

Version 1.4 connects Hermes platform changes to the real active artifacts in the canonical repository that depend on Hermes behavior.

## Why this layer exists

A knowledge-base update can be correct while a downstream agent or workflow remains written for an older Hermes behavior. v1.4 therefore separates two questions:

1. Which Hermes knowledge/capabilities changed?
2. Which active repository consumers depend on those capabilities?

## Consumer registry

`consumers/registry.json` is the authoritative dependency registry.

Only active canonical consumers belong in it. Mirrors, migrations, archived exports, and historical evidence are deliberately excluded unless they are promoted back into active use.

Each consumer declares:

- stable consumer ID
- type
- active/paused/retired status
- criticality
- dependency mode
- canonical paths
- Hermes capability IDs it depends on
- evidence/rationale

Do not infer a production dependency merely because the word "Hermes" appears in an archived file.

## Current active consumers

### hermes-agent-creator

This skill explicitly relies on `hermes-agent-architecture` for current runtime facts and primitive selection, so it is a broad high-criticality consumer.

### kaizen-orchestrator

Its Hermes adaptation explicitly uses separate agent instances, `delegate_task`, Hermes tool access, and Cron sequencing. It is registered only for the Hermes capabilities actually used by that adaptation.

## Consumer impact engine

After the release-impact engine produces JSON:

```bash
python maintenance/consumer_impact.py <impact-result.json> --pretty
```

The output identifies:

- affected consumers
- matched Hermes capabilities
- canonical consumer paths
- recommended action
- consumer compatibility blockers
- coverage gaps

## Action semantics

- `none`: no consumer action needed
- `advisory`: low-risk awareness only
- `targeted_review`: inspect only the affected adaptation/instructions
- `compatibility_review`: verify a direct/current Hermes dependency
- `migration_review`: breaking/major/security change; migration or redesign may be needed

A major/critical change affecting a high/critical consumer blocks declaring that consumer compatibility-cleared until its review is complete.

This does **not** automatically edit downstream consumers. The maintenance job reports the impact and creates review/migration work; unrelated artifacts should not be silently rewritten.

## Registry maintenance

When a new active agent/skill/project starts depending on Hermes:

1. add it to `consumers/registry.json`;
2. list only canonical paths;
3. map only capabilities actually relied upon;
4. add/update consumer-impact regression coverage when the dependency is important;
5. keep mirrors and historical exports excluded.

This explicit registration makes downstream blast radius auditable and avoids fragile keyword-based dependency inference.
