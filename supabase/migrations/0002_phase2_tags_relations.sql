-- Phase 2 — Knowledge System (slice 1: Tags + Related Concepts)
-- Tables na gagamitin: `tags`, `article_tags`, `article_relations`
-- See: docs/03-roadmap.md §3, docs/02-database-schema.md §5-6

-- =========================================================
-- Tags
-- =========================================================
create table tags (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name    text not null,
  slug    text not null,

  unique (user_id, slug)
);

create table article_tags (
  article_id uuid references articles(id) on delete cascade not null,
  tag_id     uuid references tags(id) on delete cascade not null,

  primary key (article_id, tag_id)
);

create index idx_article_tags_article on article_tags(article_id);
create index idx_article_tags_tag on article_tags(tag_id);

alter table tags enable row level security;
alter table article_tags enable row level security;

create policy "owner_only_tags" on tags
  for all using (auth.uid() = user_id);

-- article_tags has no user_id of its own — ownership derives from the
-- parent article (join tables inherit owner-only access this way).
create policy "owner_only_article_tags" on article_tags
  for all using (
    exists (
      select 1 from articles
      where articles.id = article_tags.article_id
        and articles.user_id = auth.uid()
    )
  );

-- =========================================================
-- Related Concepts (knowledge graph edges)
-- =========================================================
create type relation_type as enum ('related', 'parent-of', 'used-with', 'depends-on');

create table article_relations (
  id                 uuid primary key default gen_random_uuid(),
  article_id         uuid references articles(id) on delete cascade not null,
  related_article_id uuid references articles(id) on delete cascade not null,
  relation_type      relation_type not null default 'related',
  created_at         timestamptz not null default now(),

  check (article_id <> related_article_id),
  unique (article_id, related_article_id, relation_type)
);

create index idx_relations_article on article_relations(article_id);
create index idx_relations_related on article_relations(related_article_id);

alter table article_relations enable row level security;

create policy "owner_only_relations" on article_relations
  for all using (
    exists (
      select 1 from articles
      where articles.id = article_relations.article_id
        and articles.user_id = auth.uid()
    )
  );
