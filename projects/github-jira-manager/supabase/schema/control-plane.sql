-- V1.5 schema blueprint for GitHub Jira Manager.
-- Runtime schema is deployed to Supabase; this file is the canonical GitHub definition.

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
create index if not exists gjm_outbox_event_id_idx
  on public.gjm_outbox(event_id);

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

create table if not exists public.gjm_projects (
  project_key text primary key,
  name text not null,
  summary text not null,
  status text not null,
  version text,
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  current_focus text,
  next_step text,
  blocker text,
  github_url text,
  jira_url text,
  runtime_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.gjm_project_activity (
  activity_id bigint generated always as identity primary key,
  project_key text not null references public.gjm_projects(project_key) on delete cascade,
  source text not null,
  summary text not null,
  detail text,
  dedupe_key text unique,
  created_at timestamptz not null default now()
);

create index if not exists gjm_project_activity_project_created_idx
  on public.gjm_project_activity(project_key, created_at desc);

create table if not exists public.gjm_runtime_config (
  config_key text primary key,
  config_value text not null,
  updated_at timestamptz not null default now()
);

alter table public.gjm_events enable row level security;
alter table public.gjm_outbox enable row level security;
alter table public.gjm_evidence enable row level security;
alter table public.gjm_audit_log enable row level security;
alter table public.gjm_projects enable row level security;
alter table public.gjm_project_activity enable row level security;
alter table public.gjm_runtime_config enable row level security;

revoke all on public.gjm_events from anon, authenticated;
revoke all on public.gjm_outbox from anon, authenticated;
revoke all on public.gjm_evidence from anon, authenticated;
revoke all on public.gjm_audit_log from anon, authenticated;
revoke all on public.gjm_projects from anon, authenticated;
revoke all on public.gjm_project_activity from anon, authenticated;
revoke all on public.gjm_runtime_config from anon, authenticated;

create or replace function public.gjm_claim_outbox(p_limit integer default 10)
returns setof public.gjm_outbox
language sql
security invoker
set search_path = ''
as $$
  with due as (
    select operation_id
    from public.gjm_outbox
    where status in ('PENDING','FAILED')
      and (next_attempt_at is null or next_attempt_at <= now())
    order by created_at
    for update skip locked
    limit greatest(1, least(p_limit, 50))
  )
  update public.gjm_outbox o
  set status='PROCESSING',
      attempts=o.attempts + 1,
      updated_at=now()
  from due
  where o.operation_id=due.operation_id
  returning o.*;
$$;

revoke all on function public.gjm_claim_outbox(integer) from public, anon, authenticated;
grant execute on function public.gjm_claim_outbox(integer) to service_role;
