# Budget Policy

## Objective

Prevent one Codex turn from silently becoming an unbounded multi-agent job.

## Default budget

- Target: <=5 percentage points of weekly Work/Codex allowance per user turn.
- Absolute planning ceiling: never intentionally exceed 10 percentage points in one turn.
- Exact enforcement requires a live allowance reading. Without one, use proxy guards and do not report fabricated percentages.

## Proxy guards when live usage is unavailable

A normal turn should stay within:
- one compact planning pass;
- <=3 concurrent subagents;
- <=1 broad-ish discovery pass, preferably targeted;
- <=1 implementation pass per independent work unit;
- <=1 targeted validation pass after each changed work unit;
- <=2 failed implementation attempts total before stop;
- no Astra high/extra-high escalation without returning to the user first;
- no second full repository scan;
- no second full test-suite run unless code changed in a way that requires it.

## Budget classes

MICRO
- one obvious local change
- no subagent unless needed
- Luna/Terra low
- one targeted check

SMALL
- 1-3 files or one bounded concern
- max 1-2 workers
- Terra implementation
- supervisor integrates

MEDIUM
- several components or an integration change
- Luna scout + Terra implementer/reviewer
- split into phases if uncertainty is high

LARGE
- migration, broad refactor, multiple systems, unclear architecture
- do not execute end-to-end in one turn
- phase 1: discovery/architecture
- return to user
- later phases: implementation/review/deploy

## User-provided usage checkpoint

If the user says, for example, "I have 62% remaining":
- record 62% as baseline;
- default stop target is 57% remaining;
- never intentionally plan below 52% in that same turn;
- if no live re-check is possible, use proxy guards and ask the user to confirm usage before the next expensive phase.
