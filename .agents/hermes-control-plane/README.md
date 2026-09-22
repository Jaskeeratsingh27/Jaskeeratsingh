# Hermes Control Plane

GitHub-mediated control plane for using ChatGPT as the high-level orchestrator and a local Hermes Agent gateway as the execution runtime.

Version: 0.1.0

## Architecture

ChatGPT writes a structured job into a private GitHub runtime repository. A local controller polls the queue, validates and claims the job, checks the Hermes API server, submits a Hermes run, polls the run to completion, and writes the result back to the private runtime repository. ChatGPT can then read and review the result.

The source code lives here in the canonical repository. Runtime jobs/results must live in a separate private repository because prompts and Hermes output can contain sensitive project data.

## Hermes integration

v0.1 uses the authenticated Hermes Runs API:
- POST /v1/runs
- GET /v1/runs/{run_id}
- POST /v1/runs/{run_id}/stop
- GET /v1/capabilities
- GET /health/detailed

Every submission uses Idempotency-Key: hcp-<job_id> so a controller restart does not create duplicate Hermes runs.

## Safety

v0.1 fails closed on tool approvals. If Hermes reports waiting_for_approval, the controller stops the run and records blocked_approval. A later version will add an explicit approval round-trip.

Do not put runtime/queue or runtime/results in this public repository.

## Required environment

GITHUB_TOKEN
HCP_RUNTIME_REPO
HERMES_API_KEY

Optional:
HCP_BRANCH=main
HCP_POLL_SECONDS=15
HERMES_API_URL=http://127.0.0.1:8642
HCP_CONTROLLER_ID=<hostname>

HCP_RUNTIME_REPO must point to a private GitHub repository.

## Start Hermes

Enable the API server in ~/.hermes/.env:

API_SERVER_ENABLED=true
API_SERVER_KEY=<local-secret>

Then run:

hermes gateway

## Run controller

One pass:

python controller/hermes_control_plane.py --once

Continuous:

python controller/hermes_control_plane.py

Health check:

python controller/hermes_control_plane.py --health

## v0.1 implemented

- GitHub-backed queue
- claim files to prevent duplicate processing
- Hermes capability/readiness preflight
- Hermes Runs API execution
- durable idempotency
- timeout and stop handling
- fail-closed approval handling
- result, usage, runtime and error capture
- archival and dead-letter handling
- deterministic contract tests

## Next versions

Planned:
- private runtime repository bootstrap
- ChatGPT-side job submission contract/helper
- bidirectional approval queue
- retries/backoff
- SSE progress mirroring
- agent/profile registry
- toolset/policy routing
- scheduled work
- dashboard/observability
- artifact transport
- job signing
- multi-controller lease recovery
