# Routing Policy

## Principle

Use the cheapest capable role, not the cheapest model indiscriminately and not the strongest model by default.

Role-to-model mapping lives in `../config/capabilities.toml`.

## Roles

cheap_reader
- filename/symbol search
- repository maps
- log parsing
- exact documentation lookup
- extraction/summarization

standard_engineer
- routine code implementation
- CSS/HTML/config changes
- targeted bug fixes
- unit tests
- deterministic scripts
- bounded refactors

reviewer
- focused code review
- security/correctness checks
- regression and test-gap review

senior_specialist
- cross-component integration
- ambiguous implementation after discovery
- demonstrated standard_engineer failure
- difficult migration logic

architect
- architecture
- decomposition
- constraint reconciliation
- routing
- integration decisions
- budget/risk supervision

## Risk override

Cheap complexity does not imply cheap review.

HIGH/CRITICAL changes require the review/approval rules in SKILL.md even if the edit itself is small.

## Writer policy

Shared working tree:
- parallel cheap_reader/reviewer work is allowed;
- exactly one write-capable work unit may be active;
- senior_specialist replaces the current writer during escalation rather than writing concurrently.

## Anti-patterns

Do not:
- make the architect read dozens of files that cheap_reader can map;
- spawn agents for trivial single-file edits;
- ask multiple workers to repeat the same research by default;
- let an implementer broaden scope into adjacent cleanup;
- escalate model strength for permission/tooling failures;
- send full conversation/repository context to each worker.
