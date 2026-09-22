# Final Hardening & Evaluation Policy

## Scope

This consolidated v1.6-v1.9 run hardens the orchestrator before v2.0. It does not silently enable active adaptive routing.

The objective is to prove control-plane invariants under malformed data, historical-version mixtures, route ambiguity, risk pressure, and policy edge cases.

## Required properties

The release candidate must preserve all of the following:

- balanced target/ceiling remains 5/10 percentage points;
- economy remains 3/5;
- proxy counters remain authoritative when live usage is unavailable;
- one shared-tree writer maximum;
- HIGH risk retains reviewer coverage;
- CRITICAL and LARGE remain plan-only;
- senior-specialist routes remain escalation-only;
- adaptive mode remains shadow;
- canonical adaptive approval registry remains empty;
- unknown/legacy task kinds cannot authorize active adaptation;
- observational route history is never described as causal proof.

## Fault tolerance

A malformed telemetry line must not corrupt the entire ledger.

Foreign telemetry schema versions are ignored rather than coerced.

Usage reset/cycle mismatches stay unmeasured and never generate negative burn.

Incomplete tasks, unknown routes, and missing task-kind metadata must fail closed for adaptive decisions.

## Property and adversarial testing

Evaluate all task-kind × complexity × risk × profile combinations against baseline routing invariants.

Repeat deterministic decisions over identical evidence.

Inject malformed and incompatible telemetry.

Exercise downgrade/legacy fixtures.

Verify lower-burn candidates cannot cross quality or risk floors.

## Canary boundary

The canary policy is configuration for future controlled evidence collection.

It remains disabled in this release.

A future canary may only run after explicit approval, canonical route approval, acceptable calibration, no drift, LOW risk, bounded exposure, and immediate rollback triggers.

## Readiness interpretation

There are two distinct readiness states:

1. **software/control-plane ready** — deterministic code, policies, compatibility, rollback, CI, privacy, and safety gates pass.
2. **active-adaptation evidence ready** — sufficient real measured outcomes exist to justify controlled active routing.

v2.0 may ship as a closed-loop system in shadow/recommendation mode when software-ready.

It must not claim active adaptation is evidence-ready until real operational thresholds are met.
