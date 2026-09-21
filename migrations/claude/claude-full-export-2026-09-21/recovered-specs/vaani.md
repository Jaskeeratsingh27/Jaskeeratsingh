# Vaani — recovered blueprint

Evidence level: memory blueprint plus an FMEA already preserved in the Hermes legacy references; no executable package.

Purpose: autonomous video/short-form publishing pipeline. Historical design: idea -> script -> shotlist/state machine -> rendering adapter -> QA -> publish -> experiment/learn. The user approval gate was at script approval; downstream rendering/publishing was intended to run unattended.

Migration treatment: keep as blueprint, not executable. Publishing is irreversible/reputational, so current implementation must re-run FMEA, account/security checks, and explicit authorization policy before enabling unattended publication.
