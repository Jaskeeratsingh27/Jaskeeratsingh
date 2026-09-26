# Railway live deployment

This service is deployed from branch `SCRUM-18-railway-live-adapter` for the SCRUM-18 canary.

Railway configuration:
- root directory: `projects/github-jira-manager`
- native Python/Railpack build via `requirements.txt`
- start: `python /app/src/worker_main.py`
- healthcheck: `/health`
- persistent state: `/data`
- Jira outbound worker remains credential-gated until OAuth credentials are injected.
