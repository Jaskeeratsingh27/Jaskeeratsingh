CREATE TABLE IF NOT EXISTS inbound_events (
  event_id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_sha256 TEXT NOT NULL,
  work_item_id TEXT,
  status TEXT NOT NULL DEFAULT 'RECEIVED',
  decision_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS outbox (
  operation_id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  next_attempt_at INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(event_id) REFERENCES inbound_events(event_id)
);

CREATE INDEX IF NOT EXISTS outbox_pending_idx
ON outbox(status, next_attempt_at);

CREATE TABLE IF NOT EXISTS rotating_secrets (
  secret_name TEXT PRIMARY KEY,
  ciphertext_b64 TEXT NOT NULL,
  iv_b64 TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS work_item_evidence (
  work_item_id TEXT PRIMARY KEY,
  ci_pass INTEGER NOT NULL DEFAULT 0,
  qa_pass INTEGER NOT NULL DEFAULT 0,
  human_merge_approved INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
