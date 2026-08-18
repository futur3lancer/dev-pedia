-- Phase 2 — Knowledge System (slice 3: Project references)
-- Tables: `projects`, `article_references` (polymorphic bridge sa
-- theory <-> practice). See docs/02-database-schema.md §7, §9.

-- =========================================================
-- Projects
-- =========================================================
create table projects (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users(id) not null,
  name               text not null,
  slug               text not null,
  description        text,
  stack              text[],
  architecture_notes text,
  status             text not null default 'active',
  started_at         date,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  unique (user_id, slug)
);

alter table projects enable row level security;

create policy "owner_only_projects" on projects
  for all using (auth.uid() = user_id);

-- =========================================================
-- article_references (polymorphic — project ngayon, error sunod)
-- =========================================================
create type reference_type as enum ('project', 'error');

create table article_references (
  id             uuid primary key default gen_random_uuid(),
  article_id     uuid references articles(id) on delete cascade not null,
  reference_type reference_type not null,
  reference_id   uuid not null, -- points to projects.id o errors.id
  created_at     timestamptz not null default now(),

  unique (article_id, reference_type, reference_id)
);

create index idx_references_article on article_references(article_id);
create index idx_references_lookup on article_references(reference_type, reference_id);

alter table article_references enable row level security;

-- Polymorphic ang reference_id kaya walang direct FK papunta sa projects/errors
-- (application layer ang bahalang mag-enforce ng integrity, gaya ng dokumentado
-- sa schema doc). Ownership pa rin ang batayan ng RLS, via ang parent article.
create policy "owner_only_references" on article_references
  for all using (
    exists (
      select 1 from articles
      where articles.id = article_references.article_id
        and articles.user_id = auth.uid()
    )
  );
