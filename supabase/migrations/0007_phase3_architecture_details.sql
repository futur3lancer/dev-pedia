-- Phase 3 — Developer Features (slice 2: Architecture diagrams)
-- Table: `architecture_details`, 1:1 extension sa `articles` kung saan
-- type = 'architecture'. See docs/02-database-schema.md §4.

create table architecture_details (
  article_id      uuid primary key references articles(id) on delete cascade,
  when_to_use     text[],
  when_not_to_use text[],
  advantages      text[],
  disadvantages   text[],
  diagram         text          -- ASCII o Mermaid syntax, i-render sa article page
);

alter table architecture_details enable row level security;

-- Walang sariling user_id ang table na ito (1:1 extension lang sa articles),
-- kaya ownership check via join sa parent article — parehong pattern gaya ng
-- article_references sa 0003_phase2_projects_references.sql.
create policy "owner_only_architecture_details" on architecture_details
  for all using (
    exists (
      select 1 from articles
      where articles.id = architecture_details.article_id
        and articles.user_id = auth.uid()
    )
  );
