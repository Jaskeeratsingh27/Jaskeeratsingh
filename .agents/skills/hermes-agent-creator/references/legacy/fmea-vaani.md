# fmea-vaani.md — failure mode analysis, publishing agent

> Project artifact, not a durable convention. Vaani publishes autonomously under my
> own name — the one irreversible, public, reputational action in the portfolio.
> This is the gate before the blueprint goes further.

Scale 1-10. **RPN = Sev × Occ × Det.** Anything over 100 needs a control before
unattended operation. Detection scores assume *automated* detection — if the only
check is me noticing, detection is 9 or 10 regardless of intent.

## Analysis

| # | Failure mode | Effect | Sev | Occ | Det | RPN | Control |
|---|---|---|---|---|---|---|---|
| 1 | Publishes a draft/test video to the live channel | Public embarrassment, unretractable | 9 | 5 | 9 | **405** | Hard human gate, no auto-publish in v1. Separate test channel with a different credential. |
| 2 | Factually wrong claim in script published as fact | Reputational, possible platform strike | 9 | 6 | 8 | **432** | Grounding constraint + claim extraction step. Any factual claim without a source blocks the render. |
| 3 | Copyrighted audio or footage in generated asset | Strike, demonetization, takedown | 8 | 5 | 7 | **280** | Source allowlist only. No open-ended "find music/footage" step. Asset manifest logged per video. |
| 4 | Duplicate video published (retry after partial failure) | Channel spam, algorithm penalty | 6 | 6 | 5 | **180** | Idempotency key per idea. Publish adapter checks before upload. |
| 5 | Wrong metadata — title/description mismatched to video | Confusing, low performance | 4 | 6 | 6 | 144 | Contract validation ties metadata to the same idea ID as the render. |
| 6 | Render succeeds but output is corrupt/black/silent | Wasted slot, looks broken | 6 | 5 | 4 | 120 | Automated probe: duration, audio track present, non-black first frame. |
| 7 | API quota exhausted mid-run | Pipeline stalls | 3 | 6 | 3 | 54 | Pre-flight quota check; queue rather than fail. |
| 8 | Local model outage silently falls back to paid API | Allowance burn | 4 | 5 | 6 | 120 | Log the serving provider per call. Alert on unexpected paid calls. |
| 9 | Agent writes outside its directory | Corrupts other agents' state | 7 | 3 | 5 | 105 | Scope lock in frontmatter + `validate_agent.py` in CI. |
| 10 | Publishes at a cadence that trips platform automation rules | Account action | 9 | 3 | 7 | 189 | Verify platform ToS on automated posting `[unverified]`. Rate cap below the documented limit. |
| 11 | Overnight run fails silently, no video, no signal | Missed slot, discovered late | 3 | 7 | 8 | 168 | Heartbeat on every scheduled run. Absence of report is itself an alert. |

## Over threshold — controls required before unattended operation

Seven modes: **#1, #2, #3, #4, #10, #11, #9**.

The two highest (#1 script-to-live and #2 wrong facts) share one countermeasure that
collapses both: **v1 does not auto-publish.** The pipeline produces a staged, reviewable
output and stops. That single decision takes RPN 405 and 432 to roughly 45 and 48,
because detection moves from 9 to 1 — I see it before the world does.

This is why the publish-autonomy decision was flagged as the first fork in the
blueprint. The FMEA says the answer is approve-then-publish, not because autonomy is
bad but because detection is the weakest term in every high-RPN row, and a human gate
is the only detection control available until the automated checks exist.

## Sequencing

1. **v1** — stage and stop. Human approves each publish. Build modes #4, #6, #9, #11
   controls during this phase.
2. **v2** — auto-publish only after 20 consecutive human approvals with zero
   corrections. That's the evidence threshold, not a feeling.
3. **Never auto** — #2 and #3 controls stay mandatory regardless of version. Factual
   claims and asset licensing don't become safe with volume.

## Review trigger

Re-run this FMEA when: the publish adapter changes, a new platform is added, the
autonomy level changes, or after any escape. Not on a calendar.
