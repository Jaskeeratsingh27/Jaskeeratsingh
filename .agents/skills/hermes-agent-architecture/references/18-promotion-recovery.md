# Promotion and Recovery Control

Version 1.6 adds the final decision layer that combines all maintenance signals before a knowledge update or ecosystem compatibility claim is promoted.

## Two decisions, not one

A knowledge-base update can be correct while a downstream consumer still needs migration. Therefore the promotion gate reports:

1. **knowledge_promotion** — can the canonical Hermes knowledge/control change be promoted?
2. **ecosystem_compatibility** — can registered consumers be declared compatible with that knowledge state?

The combined `overall_state` is the stricter of the two.

## States

### allow

All deterministic gates passed; there are no unresolved knowledge blockers, dependency drift, consumer blockers, or review conditions.

### review_required

The system is internally consistent but policy requires review, such as:

- stable Hermes release transition;
- verified material change;
- pending upgrade;
- consumer compatibility review;
- degraded/watch knowledge health.

### blocked

Do not promote/clear until resolved. Examples:

- failed deterministic validation;
- unknown source/capability coverage gap;
- unresolved capability revalidation;
- unresolved consumer dependency drift;
- critical knowledge health;
- high/critical consumer compatibility blocker.

## Command

Provide a JSON bundle containing release impact, consumer impact, health, consumer drift, and validation states:

```bash
python maintenance/promotion_gate.py maintenance-bundle.json --pretty
```

## Recovery sequence

When blocked:

1. preserve the failing evidence;
2. identify the specific blocker from the promotion result;
3. patch only the responsible control/knowledge/consumer data;
4. rerun the narrow failing test first;
5. rerun every deterministic gate;
6. recompute health and dependency drift;
7. recompute the promotion decision;
8. promote only when the required state is reached.

Do not bypass or weaken a deterministic gate merely to obtain a green build.

## End-to-end hardening

`tests/test_end_to_end_hardening.py` composes the existing engines rather than mocking their decisions independently. It simulates:

- clean no-change operation;
- stable release + delegation change;
- critical security change;
- ambiguous provider-routing change;
- unknown future subsystem;
- missed audits / stale critical knowledge;
- consumer-registry drift;
- CI gate failure;
- successful recovery.

This suite is the final planned architecture-hardening gate. Future improvements should be driven by observed production defects, Hermes platform changes, or new consumer requirements rather than adding layers speculatively.
