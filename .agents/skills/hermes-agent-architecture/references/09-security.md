# Security and Isolation

Hermes documents a defense-in-depth model covering user authorization, dangerous-command approvals, file write safety, sandbox/container isolation, MCP credential filtering, context-file scanning, session isolation, and input sanitization.

## Profiles are not security boundaries

A profile isolates Hermes state, not OS access. A local-terminal agent can still access files available to the OS user unless separate controls exist.

## Production execution

Hermes recommends isolated terminal backends such as Docker, Modal, Daytona, or Vercel Sandbox for production gateway deployments. Choose the backend based on persistence, network, filesystem, and operational requirements.

## Least privilege

Enforce capabilities technically:

- remove unneeded toolsets
- filter MCP tools
- restrict filesystem/workspace
- isolate execution
- keep secrets out of prompts/artifacts
- use approvals for destructive commands where the sandbox is not the boundary
- control environment-variable passthrough explicitly

## Credential handling

Both code-execution and terminal paths apply environment filtering; explicit passthrough increases exposure. Never forward Hermes/provider infrastructure secrets merely for convenience.

## Context/skill trust

Hermes scans project context and skills for dangerous prompt-injection/exfiltration patterns. Project-local skills require trust decisions and can be quarantined based on scan results. Treat third-party skill content as code-adjacent supply-chain material.

## Security review questions

- What can this profile read/write?
- What tools can it call?
- What credentials can it access?
- What network destinations can it reach?
- What actions require human approval?
- What side effects are idempotent/reversible?
- What data enters logs/telemetry?
- How are untrusted files/web content separated from instructions?
