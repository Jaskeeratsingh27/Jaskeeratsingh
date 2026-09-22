# Tools, Toolsets, Code Execution, and MCP

## Toolsets

Hermes groups capabilities into toolsets. Common categories include web/search, terminal, file, browser, memory, session search, cron, code execution, delegation, clarification, messaging, and dynamic MCP toolsets.

Production rule: expose only capabilities a role needs. Tool availability is a stronger control than telling an agent in prose not to use a tool.

## `execute_code`

`execute_code` runs Python that can call selected Hermes tools over an RPC bridge. Only the script's printed output returns to the model context, so intermediate tool results can be filtered/aggregated without repeatedly consuming context.

Use it for 3+ tool calls with loops, branching, transformation, or bulk filtering. Use terminal for shell commands, builds, test suites, background/interactive processes.

Documented safeguards include timeout, stdout/stderr limits, tool-call caps, credential scrubbing, and a restricted tool whitelist.

## MCP

MCP connects Hermes to external tool servers such as GitHub, databases, internal APIs, and SaaS systems. Hermes supports local stdio and remote HTTP MCP servers, discovery, OAuth, and per-server filtering.

Treat MCP as a capability boundary. Prefer exposing only the tools a role needs rather than attaching an entire broad server surface to every profile.

## Agent design pattern

For each profile, explicitly list:

- required built-in toolsets
- optional toolsets
- prohibited toolsets
- MCP servers
- allowed MCP tools
- sandbox/backend
- credential source

This becomes the capability manifest for the agent.
