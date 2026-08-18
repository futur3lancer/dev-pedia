-- Phase 2 — Knowledge System (slice 6: Favorites + Recently Viewed)
-- Simpleng columns na lang sa `articles` — hindi na kailangan ng bagong
-- table para dito. See docs/03-roadmap.md §3.

alter table articles add column is_favorite boolean not null default false;
alter table articles add column last_viewed_at timestamptz;

create index idx_articles_favorite on articles(is_favorite) where is_favorite;
create index idx_articles_last_viewed on articles(last_viewed_at desc nulls last);
