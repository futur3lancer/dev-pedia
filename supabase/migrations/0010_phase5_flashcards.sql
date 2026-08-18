-- Phase 5 (slice 5): Spaced repetition
-- Table: `flashcards` — dating ephemeral lang ang mga flashcard na ginagawa
-- ng "Generate flashcards" (Phase 4, slice 6 — lib/actions/flashcards.ts):
-- bagong deck bawat "Generate" click, walang na-se-save. Dito na sila
-- pwedeng i-persist (optional — may "Save deck" button pa rin, hindi
-- awtomatiko), kasama ang SM-2 scheduling state para may schedule ng
-- review gaya ng Anki/SuperMemo.
--
-- Join table sa `articles` gaya ng `article_versions` — walang sariling
-- `user_id`, RLS derives via join sa parent article.

create table flashcards (
  id                uuid primary key default gen_random_uuid(),
  article_id        uuid references articles(id) on delete cascade not null,
  front             text not null,
  back              text not null,

  -- SM-2 scheduling state. Bagong card = repetitions 0, ease_factor sa
  -- default (2.5, ang standard SM-2 starting ease), due agad (now()) para
  -- lumabas kaagad sa unang review session.
  ease_factor       real not null default 2.5,
  interval_days     integer not null default 0,
  repetitions       integer not null default 0,
  due_at            timestamptz not null default now(),
  last_reviewed_at  timestamptz,

  created_at        timestamptz not null default now()
);

create index idx_flashcards_article on flashcards(article_id);
-- Para sa "due cards" query (WHERE due_at <= now()) — pinaka-madalas na
-- access pattern sa /review page.
create index idx_flashcards_due on flashcards(due_at);

alter table flashcards enable row level security;

create policy "owner_only_flashcards" on flashcards
  for all using (
    exists (
      select 1 from articles
      where articles.id = flashcards.article_id
        and articles.user_id = auth.uid()
    )
  );
