-- Phase 2 — Knowledge System (deferred slice: Bookmarks)
-- Table: `bookmarks`. Standalone, walang FK sa `articles` — external
-- references lang na gustong balikan. See docs/02-database-schema.md §10.
-- Huli na ito na-migrate kaysa sa ibang Phase 2 tables (0003-0006) dahil
-- naiwan itong stub noon; ang schema doc mismo ay hindi nagbago.

create table bookmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) not null,
  title       text not null,
  url         text not null,
  description text,
  created_at  timestamptz not null default now()
);

create index idx_bookmarks_user_id on bookmarks(user_id);

alter table bookmarks enable row level security;

create policy "owner_only_bookmarks" on bookmarks
  for all using (auth.uid() = user_id);
