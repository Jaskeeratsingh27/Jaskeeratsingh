# Failure Taxonomy

Classify before escalating.

## information
Missing file, symbol, requirement, dependency, or documentation.
Default response: cheap_reader discovery. Do not escalate reasoning.

## tooling_environment
Build tool, network, package manager, runtime, CI, or external service failure.
Default response: inspect concrete error; fix environment/tooling if in scope. Stronger reasoning alone is not justification.

## test_fixture
Flaky test, stale fixture, nondeterministic dependency, or bad test setup.
Default response: validate fixture/test assumptions before changing production code.

## implementation
The planned implementation is wrong or incomplete while architecture remains sound.
Default response: allow another bounded standard_engineer attempt if profile permits; then senior_specialist only with a concise failure summary.

## architecture
The current design cannot satisfy requirements safely or cleanly.
Default response: stop write expansion; architect reassesses. User checkpoint if scope or budget materially changes.

## permission_security
Missing permission, required user approval, secret access, policy restriction, destructive authorization, or credential issue.
Default response: stop and request the minimum user action. Do not escalate models.

Escalation is justified only when the failure class makes stronger reasoning/cross-system integration likely to help.
