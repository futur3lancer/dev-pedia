-- Phase 2 — Knowledge System (slice 5: Search)
-- MVP full-text search gamit ang tsvector + pg_trgm para sa fuzzy title
-- matching. See docs/02-database-schema.md §11.

create extension if not exists pg_trgm;

alter table articles add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) stored;

create index idx_articles_search on articles using gin(search_vector);
create index idx_articles_title_trgm on articles using gin(title gin_trgm_ops);
