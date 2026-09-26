-- Schema blueprint for GitHub Jira Manager.
-- This file is intentionally not a migration yet.

create table if not exists public.gjm_events (
  event_id text primary key,
  source text not null check (source in ('github', 'jira')),
  event_type text not null,
  payload_sha256 text not null,
  work_item_id text,
  status text not null default 'RECEIVED'
    check (status in ('RECEIVED', 'DECIDED', 'IGNORED', 'FAILED')),
  decision jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gjm_outbox (
  operation_id text primary key,
  event_id text not null references public.gjm_events(event_id),
  operation text not null,
  payload jsonb not null,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'PROCESSING', 'FAILED', 'COMPLETE', 'DEAD_LETTER')),
  attempts integer not null default 0 check (attempts >= 0),
  last_error text,
  next_attempt_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gjm_outbox_due_idx
  on public.gjm_outbox(status, next_attempt_at);

create table if not exists public.gjm_evidence (
  work_item_id text primary key,
  ci_pass boolean not null default false,
  qa_pass boolean not null default false,
  human_merge_approved boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.gjm_audit_log (
  audit_id bigint generated always as identity primary key,
  work_item_id text,
  event_id text,
  operation_id text,
  actor text not null,
  action text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.gjm_events enable row level security;
alter table public.gjm_outbox enable row level security;
alter table public.gjm_evidence enable row level security;
alter table public.gjm_audit_log enable row level security;

revoke all on public.gjm_events from anon, authenticated;
revoke all on public.gjm_outbox from anon, authenticated;
revoke all on public.gjm_evidence from anon, authenticated;
revoke all on public.gjm_audit_log from anon, authenticated;
