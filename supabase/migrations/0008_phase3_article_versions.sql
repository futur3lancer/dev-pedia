-- Phase 3 — Developer Features (slice 3: Version history)
-- Table: `article_versions` — snapshot ng title/content/excerpt/status BAGO
-- ma-apply ang isang update sa `articles`. See docs/03-roadmap.md §4.
--
-- Ginawa itong DB trigger (sa halip na application-level insert bago mag-
-- update) para hindi na kailangang tandaan sa bawat caller ng articles
-- update (updateArticle, toggleFavorite, recordView, atbp.) na mag-snapshot
-- muna — otomatiko itong tama kahit saan galing ang update. Ang trigger ay
-- WHEN-guarded para lang mag-snapshot kapag nagbago ang title o content —
-- hindi kada favorite toggle o view-tracking ping.

create table article_versions (
  id         uuid primary key default gen_random_uuid(),
  article_id uuid references articles(id) on delete cascade not null,
  title      text not null,
  content    text not null,
  excerpt    text,
  status     article_status not null,
  created_at timestamptz not null default now()
);

create index idx_article_versions_article on article_versions(article_id, created_at desc);

alter table article_versions enable row level security;

create policy "owner_only_article_versions" on article_versions
  for all using (
    exists (
      select 1 from articles
      where articles.id = article_versions.article_id
        and articles.user_id = auth.uid()
    )
  );

create or replace function snapshot_article_version()
returns trigger as $$
begin
  if (old.title is distinct from new.title) or (old.content is distinct from new.content) then
    insert into article_versions (article_id, title, content, excerpt, status)
    values (old.id, old.title, old.content, old.excerpt, old.status);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_articles_snapshot_version
  before update on articles
  for each row
  execute function snapshot_article_version();
