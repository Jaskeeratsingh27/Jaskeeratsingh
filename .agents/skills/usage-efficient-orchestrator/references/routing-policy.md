# Routing Policy

## Principle

Use the cheapest capable intelligence, not the cheapest model indiscriminately and not the strongest model by default.

## Route by task

Luna / low
- filename/symbol search
- repository maps
- log parsing
- exact documentation lookup
- repetitive edits with unambiguous instructions
- extraction/summarization

Terra / low-medium
- routine code implementation
- CSS/HTML/config changes
- targeted bug fixes
- unit tests
- deterministic scripts
- bounded refactors

Terra / medium-high
- focused code review
- security/correctness checks
- harder bounded debugging

Sol / medium
- cross-component integration
- ambiguous implementation after discovery
- failures that Terra could not resolve
- difficult migration logic

Primary Astra/Sol
- architecture
- decomposition
- constraint reconciliation
- integration decisions
- final go/no-go on escalation/release

## Anti-patterns

Do not:
- make Astra read dozens of files that Luna can map;
- spawn agents for trivial single-file edits;
- ask two workers to independently repeat the same research by default;
- let an implementer broaden scope because it noticed adjacent cleanup;
- escalate because a cheaper worker was merely slower;
- send full conversation/repo context to every subagent.

## Handoff format

Workers should return:
1. Outcome.
2. Evidence/files/symbols.
3. Changes, if allowed.
4. Validation.
5. Unresolved risk.
6. Whether escalation is actually required.
