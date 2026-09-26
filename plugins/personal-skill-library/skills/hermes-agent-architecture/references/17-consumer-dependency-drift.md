# Consumer Dependency Drift Detection

Version 1.5 verifies that the downstream consumer registry remains aligned with the active canonical repository.

## Why an explicit registry can still drift

The v1.4 consumer registry prevents broad keyword inference from becoming architecture truth, but the registry itself can become stale when:

- a new skill starts depending on Hermes and is never registered;
- a registered consumer begins using a new Hermes capability;
- a registered dependency disappears after refactoring;
- the evidence supporting a declared dependency is deleted or rewritten.

v1.5 detects these conditions without automatically changing the registry.

## Evidence assertions

Every active registered consumer contains `evidence_assertions`. An assertion names:

- a canonical file path;
- one or more high-confidence text patterns;
- the Hermes capability IDs that the evidence supports;
- a match mode.

The evidence is a control signal, not a full semantic proof. If it disappears, the system asks for review rather than automatically deleting the dependency.

## Detection rules

`consumers/detection-rules.json` contains:

- canonical scan roots;
- file extensions;
- high-confidence Hermes candidate markers;
- capability-specific evidence patterns;
- the no-auto-register/no-auto-remove policy.

Candidate detection is intentionally conservative. A match creates a review item, not a registry mutation.

## Drift classes

### candidate_unregistered_consumer

A canonical skill outside the registry contains both a high-confidence Hermes marker and at least one recognizable capability signal.

Action: inspect and either register it or document why it is not an active Hermes consumer.

### unregistered_capability_dependency

A registered consumer contains a high-confidence capability signal that is not declared in its `capability_ids`.

Action: verify the dependency, then update the registry if real.

### registered_evidence_missing

An explicit evidence assertion no longer matches its canonical file.

Action: determine whether the consumer changed, the evidence moved, or the dependency disappeared.

### registered_capability_without_evidence

A declared capability has no surviving evidence assertion.

Action: treat the registry entry as stale until reviewed.

## Running the detector

```bash
python maintenance/consumer_drift.py --pretty
```

For CI:

```bash
python maintenance/consumer_drift.py --fail-on-drift
```

## Historical snapshots

Weekly runs persist:

`research/consumer-drift/YYYY-MM-DD.json`

and update:

`research/consumer-drift/index.json`

A routine clean snapshot does not require a semantic skill-version bump.

## Safety rule

Dependency drift detection is **review-driven**:

```text
detected evidence
      ↓
candidate/drift finding
      ↓
human/agent verification
      ↓
registry update if justified
```

Never automatically add/remove a production dependency merely because a string appeared or disappeared.
