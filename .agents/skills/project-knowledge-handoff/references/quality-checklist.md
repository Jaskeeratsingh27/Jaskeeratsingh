# Master Guide Quality Checklist

A complete project handoff should pass these checks.

## Identity

- [ ] Project name and purpose are clear.
- [ ] Canonical repository/project root is explicit.
- [ ] Current project version/state is evidence-backed.
- [ ] Guide revision/current snapshot is stated.
- [ ] Source-of-truth hierarchy is explicit.

## New-chat continuity

- [ ] A fresh AI is told what the project is.
- [ ] A fresh AI is told which files to read first.
- [ ] A fresh AI is told what not to assume.
- [ ] Required tests/validation before modification are listed.
- [ ] Git/GitHub promotion rules are described.
- [ ] Future-version trigger criteria are described.

## Architecture and behavior

- [ ] Major components are documented.
- [ ] Data/control flow is understandable.
- [ ] Capabilities/features are inventoried.
- [ ] Important interfaces/contracts are documented.
- [ ] Current dependencies/integrations/consumers are documented.
- [ ] Security/permissions boundaries are documented when applicable.
- [ ] Runtime/deployment/hosting behavior is documented when applicable.

## History

- [ ] Meaningful versions/milestones are summarized.
- [ ] Major design decisions and defects discovered are captured.
- [ ] Historical claims are not presented as current.
- [ ] Current state is distinguishable from the evolution narrative.

## Quality and operations

- [ ] Tests/CI/QA gates are accurate.
- [ ] Maintenance/scheduled jobs are documented.
- [ ] Failure/recovery procedures are documented.
- [ ] Known limitations/non-goals remain visible.
- [ ] Future roadmap is evidence-driven rather than speculative.

## Repository integrity

- [ ] Named canonical paths exist.
- [ ] Guide path follows repository convention.
- [ ] Manifest points to the real stable guide/snapshot.
- [ ] Source commit exists.
- [ ] No secrets, tokens, credentials, or sensitive exports are embedded.
- [ ] Binary mirrors, if any, correspond to the current Markdown source.

## Readability

- [ ] Guide begins with a concise executive overview.
- [ ] Detailed material is organized progressively.
- [ ] Tables/code blocks improve comprehension rather than add decoration.
- [ ] Acronyms and project-specific terms are explained.
- [ ] There is a compact quick-reference section.
