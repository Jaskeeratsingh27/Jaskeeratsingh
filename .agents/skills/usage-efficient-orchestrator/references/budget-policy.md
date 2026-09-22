# Budget Policy

## Objective

Prevent a Codex turn from silently becoming an unbounded multi-agent job.

The default profile is **balanced**.

## Percentage policy

- economy: target <=3 percentage points; ceiling <=5.
- balanced: target <=5 percentage points; ceiling <=10.
- quality-critical: target <=5 percentage points; ceiling <=10.

Exact enforcement requires a live allowance reading. Without one, do not fabricate a percentage; use the hard proxy counters from `../config/budget-profiles.toml`.

## Proxy counters

Track counters per Task Envelope:
- concurrent agents;
- total agent spawns;
- broad discovery passes;
- write phases;
- failed implementation attempts;
- test cycles;
- full-suite runs;
- senior escalations;
- scope expansions.

When a hard profile limit is reached, stop before starting another unit that would exceed it.

## Complexity classes

MICRO
- one obvious local change
- usually direct or one standard_engineer
- targeted check

SMALL
- 1-3 files or one bounded concern
- max 1-2 workers normally
- one writer

MEDIUM
- several components or integration change
- read-only discovery + writer + reviewer
- use branch and explicit verification

LARGE
- migration, broad refactor, multiple systems, unclear architecture
- plan-only first
- phase execution with user checkpoints

## User-provided usage checkpoint

If the user says "62% remaining" under balanced:
- baseline = 62%;
- target stop = 57%;
- absolute ceiling = 52%;
- re-check before senior escalation when possible;
- if no live re-check is possible, enforce proxies and ask before another expensive phase.
