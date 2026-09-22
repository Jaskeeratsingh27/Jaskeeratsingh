# Hermes Architecture Knowledge System — Production Readiness

Version: 1.6.0  
Baseline Hermes release: v0.21.3 / v2026.9.14  
Readiness phase: final planned hardening

## Control layers

1. primary-source knowledge base
2. compatibility manifest and primitive routing
3. deterministic architecture regressions
4. release-impact classification and blast radius
5. upgrade matrix
6. freshness and knowledge-health monitoring
7. active consumer impact mapping
8. consumer dependency drift detection
9. promotion and recovery decision gate
10. GitHub branch/PR history and deterministic CI

## Required CI gates

1. structural / compatibility / history validation
2. architecture regressions
3. release-impact regressions
4. health / drift regressions
5. consumer-impact regressions
6. consumer dependency drift regressions
7. end-to-end hardening simulations

## Promotion invariants

- no semantic promotion with failed deterministic tests;
- no silent stable-release transition;
- no silent ambiguous claim promotion;
- no automatic registration/removal of consumers from text matches;
- no ecosystem compatibility clearance while high/critical affected consumers remain blocked;
- no claim of freshness without real primary-source reverification;
- no broad rewrite when a smaller impact radius is sufficient;
- no force-push overwrite of concurrent canonical work.

## Readiness interpretation

Passing all seven CI gates means the repository's deterministic control system is internally consistent for the modeled scenarios. It does **not** prove that every future Hermes behavior is known or that external services will always be available.

The weekly audit remains responsible for fresh external verification. Unknown Hermes features intentionally fail closed into review rather than being guessed.

## Post-v1.6 policy

After v1.6, stop adding architecture layers by default.

Create a later semantic version only when one of these occurs:

- official Hermes behavior materially changes;
- a real weekly audit exposes a control defect;
- a registered consumer needs a new dependency/migration capability;
- a security or observability requirement changes;
- a deterministic scenario fails to model an observed real-world incident.

Routine weekly audit, health, and drift snapshots remain operational history and do not require semantic version increments.
