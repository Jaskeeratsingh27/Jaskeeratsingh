# Vishwakarma (Vish) — recovered agent-forge specification

Evidence level: verbatim Claude memory summary; the delivered scaffold ZIP and interactive reference artifact are not present in the export.

## Purpose

A meta-agent pipeline that takes a plain-English agent idea, researches it, creates a blueprint, routes work across multiple model backends, forges the implementation, critiques it, and packages the result for Git/GitHub use.

## Historical architecture

Memory describes a shipped **Vishwakarma / Vish v1** built around Antigravity 2:

- orchestrator;
- four parallel research/scout workers;
- synthesist;
- architect;
- forge/build stage;
- critic;
- Git packaging/output stage.

A key portability mechanism was an `llm-router` MCP server exposing OmniRoute/OpenRouter-backed models as tools because the host environment's subagents had a narrower native model selector. The historical cost ladder was `local -> cheap -> ag-flash -> ag-pro -> deep`.

## Migration treatment

Do not claim the original scaffold, prompts, router server, or published artifact have been recovered. Preserve the architecture as a recovery target. A rebuild should use the current `hermes-agent-creator` quality gates, explicit model-routing contracts, deterministic validation, and GitHub-backed artifacts rather than reproducing historical provider names blindly.
