-- Phase 2 — Knowledge System (slice 4: Error Encyclopedia)
-- Table: `errors`. Ni-link ito sa mga concepts via `article_references`
-- (reference_type = 'error') — table at enum na ginawa na sa
-- 0003_phase2_projects_references.sql. See docs/02-database-schema.md §8.

create table errors (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) not null,
  title        text not null,
  technology   text[],
  error_text   text not null,
  cause        text,
  solution     text not null,
  status       text not null default 'resolved',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_errors_technology on errors using gin(technology);

alter table errors enable row level security;

create policy "owner_only_errors" on errors
  for all using (auth.uid() = user_id);
