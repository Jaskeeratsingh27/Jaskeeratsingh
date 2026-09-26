# shared-infrastructure.md — the two SPOFs

> Five agents depend on two pieces of infrastructure that live inside individual
> agents, have no contract, and have no test. This file specifies what they should
> become. **Extract these before adding any new dependent.**

## Why this is the top priority

| | Vault write path | Approval gate |
|---|---|---|
| Owner today | Smriti | Hermes |
| Dependents | Anveshak, Vartaa, Hermes, (Vaani planned) | Hermes, Anveshak, (Vaani planned) |
| Contract | none | none |
| Test | none | none |
| Failure signal | a note silently doesn't appear | run blocks forever, or worse, proceeds |
| Blast radius | 4 agents | 3 agents, one of them publishing |

Both are shared dependencies with no interface. That is the definition of a single
point of failure, and neither is an agent — which is why no amount of agent-level
quality work touches them.

---

## 1. `vault_write` — extract from Smriti

A module, not an agent. Stdlib-only Python, matching existing tooling convention.

### Interface

```python
def write_note(
    content: str,
    title: str,
    folder: str,          # PARA folder, validated against allowlist
    tags: list[str],
    links: list[str] = None,
    dry_run: bool = False,
) -> WriteResult
```

```python
class WriteResult:
    ok: bool
    path: str | None      # absolute path written, None on failure
    problems: list[str]   # empty when ok
    created: bool         # False if it updated an existing note
```

### Guarantees it must make

- **Never overwrites silently.** Existing title → append or version, never replace.
- **Validates folder against a PARA allowlist.** Unknown folder is a failure, not a
  new folder.
- **Atomic.** Write to temp, then move. A crash mid-write leaves no partial note.
- **Idempotent on retry.** Same content + title twice produces one note.
- **`dry_run=True` returns the exact path and content it would write**, touching nothing.
  Every caller tests against this.
- **Returns failures. Never raises into an agent loop.**

### Tests required before extraction counts as done

1. Write to each allowed PARA folder
2. Write to a disallowed folder → `ok=False`, no file created
3. Duplicate title → no overwrite
4. Same call twice → one note
5. Simulated crash mid-write → no partial file
6. `dry_run` → correct path returned, nothing on disk

---

## 2. `approval_gate` — extract from Hermes

### Interface

```python
def request_approval(
    subject: str,           # what's being approved, one line
    detail_path: str,       # file the human reads before deciding
    channels: list[str],    # ["obsidian", "telegram"]
    timeout_hours: int,
) -> ApprovalResult
```

```python
class ApprovalResult:
    decision: str           # "approved" | "denied" | "timeout"
    channel: str | None     # which channel answered
    decided_at: str
    actor: str | None
```

### Guarantees it must make

- **Timeout defaults to DENY.** Never approve by absence. This is the single most
  important line in this file.
- **Both channels stay in sync.** Answering in Obsidian closes the Telegram request
  and vice versa. No double-decision.
- **Every request and decision is logged**, with timestamp and channel, permanently.
- **Idempotent.** Asking twice for the same subject returns the existing decision
  rather than creating a second request.
- **Emits a heartbeat while waiting** so a hung gate is distinguishable from a
  slow human.

### Tests required

1. Approve via Obsidian → Telegram request closes
2. Approve via Telegram → Obsidian checkbox reflects it
3. Timeout → `decision="timeout"`, caller treats as denied
4. Same subject twice → one request, existing decision returned
5. Both channels answered simultaneously → first wins, second is a no-op, both logged

---

## Migration order

1. Build `vault_write` with tests, against the current Smriti behaviour
2. Point Smriti at it. Confirm no behaviour change.
3. Point Anveshak, Vartaa, Hermes at it one at a time
4. Repeat for `approval_gate`
5. Only then let Vaani depend on either

Do not build the module and the new dependent in the same week. Extraction is proven
by existing callers behaving identically, not by a new caller working.

## Rule going forward

Any capability with two or more dependents gets extracted, contracted and tested
before the third dependent is added. No exceptions for "it's working fine."
