-- Phase 1 — Foundation
-- Tables na gagamitin: `articles` (base fields lang, walang search_vector pa)
-- See: docs/03-roadmap.md §2, docs/02-database-schema.md §3

create extension if not exists pgcrypto;

create type article_type as enum (
  'encyclopedia',
  'concept',
  'technology',
  'architecture',
  'experiment'
);

create type article_status as enum ('draft', 'published');

create table articles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) not null,
  type          article_type not null,
  title         text not null,
  slug          text not null,
  subcategory   text,               -- e.g. "Frontend", "Database" (para sa sidebar grouping)
  excerpt       text,               -- short summary, ipapakita sa search results
  content       text not null,      -- markdown/MDX body
  cover_image   text,               -- Supabase Storage path, optional
  status        article_status not null default 'draft',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique (user_id, slug)
);

create index idx_articles_type on articles(type);
create index idx_articles_status on articles(status);

-- Owner-only RLS, kahit personal tool (see docs/01-architecture.md §7)
alter table articles enable row level security;

create policy "owner_only_articles" on articles
  for all using (auth.uid() = user_id);

-- Auto-update updated_at on row change
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_articles_updated_at
  before update on articles
  for each row
  execute function set_updated_at();
