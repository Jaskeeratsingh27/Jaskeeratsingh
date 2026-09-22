# {{PROJECT_NAME}} Master Guide

**Project:** `{{PROJECT_SLUG}}`  
**Project version/state:** `{{PROJECT_VERSION}}`  
**Guide revision:** `{{GUIDE_REVISION}}`  
**Canonical repository:** `{{REPOSITORY}}`  
**Canonical project root:** `{{PROJECT_ROOT}}`  
**Source commit:** `{{SOURCE_COMMIT}}`  
**Last verified:** {{LAST_VERIFIED_DATE}}  
**Purpose:** end-to-end reference, future-chat bootstrap, onboarding, and version-maintenance guide

---

## 0. How to Use This Guide

Explain who should use this guide, what it contains, and the source-of-truth hierarchy.

## 1. Fresh-Chat / New-Agent Bootstrap

State explicitly:

- what the project is;
- its purpose;
- canonical repo/root;
- files to read first;
- current version/state;
- rules for modifying it;
- required tests/validation;
- what must not be assumed;
- what conditions justify another semantic version.

## 2. Executive Overview

Summarize the problem, solution, maturity, and major capabilities.

## 3. Problem Statement and Goals

Describe why the project exists, intended users, constraints, success criteria, and non-goals.

## 4. Architecture / Mental Model

Describe the major components and their boundaries. Include a text diagram when useful.

## 5. Capabilities and Feature Inventory

Document current features, grouped by subsystem.

## 6. Core Workflows

Explain important end-to-end flows, state transitions, handoffs, and control paths.

## 7. Contracts, Schemas, Interfaces, and Templates

Document machine/human interfaces and where their canonical definitions live.

## 8. Repository / File Map

Explain important directories/files and their responsibilities.

## 9. Version and Milestone History

For each meaningful version/milestone:
- what changed;
- why;
- defects or lessons discovered;
- validation/promotion notes.

## 10. Current Configuration and State

Capture current versions, modes, policies, dependencies, feature flags, active consumers, and other live state.

## 11. Validation, Tests, CI, and Quality Gates

Document commands, CI workflows, acceptance criteria, failure behavior, and promotion gates.

## 12. Deployment / Runtime / Hosting

If applicable, explain runtime topology, hosting, environments, deploy flow, persistence, rollback, and availability.

## 13. Maintenance and Automation

Document scheduled audits/jobs, update cadence, triggers, outputs, and what happens when nothing changes.

## 14. Security, Privacy, and Permissions

Document trust boundaries, credentials policy, destructive actions, least privilege, data handling, and secrets rules.

## 15. Dependencies, Consumers, Integrations, and External Systems

Document upstream/downstream dependencies, APIs/connectors, consumers, compatibility expectations, and ownership.

## 16. Known Limitations, Caveats, and Non-Goals

Be explicit about what the project cannot guarantee and what remains outside scope.

## 17. Operating Playbooks

Provide concise procedures for common future tasks:
- normal change;
- release;
- incident/failed validation;
- migration;
- dependency change;
- guide refresh.

## 18. Future Iteration Policy and Roadmap

Separate:
- committed/necessary next work;
- evidence-triggered future possibilities;
- intentionally deferred ideas.

Do not turn speculative possibilities into commitments.

## 19. New-Chat Continuation Protocol

Give a future AI a deterministic startup procedure:
1. read this guide;
2. read canonical current project files;
3. verify repository state/current version;
4. inspect recent history relevant to the request;
5. preserve unrelated work;
6. make the smallest justified change;
7. run required validation;
8. update this guide if the project knowledge state materially changed.

## 20. Glossary and Quick Reference

Define project terms, important commands, invocation names, and high-value paths.

## 21. Canonical Links and Anchors

List repository, important docs, releases/PRs/commits, dashboards, or external primary sources where useful.

---

**End of {{PROJECT_NAME}} Master Guide**
