# DevPedia — Database Schema

## 1. Panimula

Ang schema na ito ay direktang extension ng design principle sa `01-architecture.md`:

> **Article ≠ Relation ≠ Reference**

Hiwalay ang tatlong bagay:
- **Article** — ang aktwal na content (isang concept, technology, architecture pattern, atbp.)
- **Relation** — ang koneksyon sa pagitan ng dalawang articles (edge sa knowledge graph)
- **Reference** — saan/paano ginamit ang concept sa totoong buhay (project o error)

Lahat ng tables dito ay nasa Supabase (PostgreSQL), may RLS enabled, at gagana kahit single-owner ang app. May `user_id` column pa rin sa mga content tables para future-proof — kung sakaling i-multi-user mo o i-share pa ito balang araw, hindi na kailangan pang i-restructure.

## 2. High-Level Entity Relationship Diagram

```
                     ┌──────────────┐
                     │     tags     │
                     └──────┬───────┘
                            │
                     ┌──────┴───────┐
                     │ article_tags │
                     └──────┬───────┘
                            │
┌───────────────┐    ┌──────┴───────┐    ┌────────────────────┐
│architecture_   │◄───┤   articles   ├───►│ article_relations   │
│details         │ 1:1└──────┬───────┘1:M │ (graph edges,       │
│(kung type=      │          │            │  self-referencing)  │
│ 'architecture') │          │            └────────────────────┘
└───────────────┘          │
                            ▼
                     ┌──────────────────┐
                     │article_references │
                     │ (reference_type:  │
                     │  project / error) │
                     └────────┬──────────┘
                              │
                     ┌────────┴────────┐
                     ▼                 ▼
              ┌─────────────┐   ┌─────────────┐
              │   projects   │   │    errors    │
              └─────────────┘   └─────────────┘

              ┌─────────────┐
              │  bookmarks   │  (standalone, external links)
              └─────────────┘
```

## 3. Core Content Table: `articles`

Isang table lang ang humahawak sa lahat ng content na naka-browse sa **Encyclopedia**, **Concepts**, **Technologies**, **Architecture**, at **Experiments** section. Ang nagkakaiba lang ay ang `type` column — kaya kung magdadagdag ka ng bagong section balang araw, hindi mo na kailangang gumawa ng bagong table.

```sql
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
```

## 4. `architecture_details` — extension para sa Architecture entries

Sa raw notes mo, may specific na fields ang Architecture pattern entries na wala sa ibang content types: **When to use / When NOT to use / Advantages / Disadvantages**. Sa halip na i-cram sa `content` markdown, hiwalay na structured table ito, naka-1:1 sa `articles` (kung saan `type = 'architecture'`). Benefit nito: pwede mong i-render ito bilang consistent na UI blocks (hindi laging depende sa kung paano isinulat ang markdown), at pwede mo ring i-query/filter balang araw (hal. "ipakita lahat ng architecture na may disadvantage na 'complex deployment'").

```sql
create table architecture_details (
  article_id      uuid primary key references articles(id) on delete cascade,
  when_to_use     text[],
  when_not_to_use text[],
  advantages      text[],
  disadvantages   text[],
  diagram         text          -- ASCII o Mermaid syntax, i-render sa article page
);
```

## 5. Tags: `tags` + `article_tags`

Simpleng many-to-many. Gamit ito para sa filtering/search, hiwalay sa `article_relations` (na para naman sa knowledge graph edges).

```sql
create table tags (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) not null,
  name    text not null,
  slug    text not null,
  unique (user_id, slug)
);

create table article_tags (
  article_id uuid references articles(id) on delete cascade,
  tag_id     uuid references tags(id) on delete cascade,
  primary key (article_id, tag_id)
);
```

## 6. Knowledge Graph: `article_relations`

Ito ang core ng "interconnected" na feature — ang edges sa pagitan ng dalawang articles. Directional ang relation (may `relation_type`), pero sa UI pwede mo namang ipakita bilang bidirectional (kung A → B "related", ipakita rin sa B na related sa A, via query lang, hindi kailangan ng duplicate row).

```sql
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
```

## 7. Real-World Links: `article_references`

Ito ang gumagawa ng bridge sa pagitan ng theory (`articles`) at practice (`projects` / `errors`). Isang table lang ito para sa pareho — polymorphic via `reference_type`.

```sql
create type reference_type as enum ('project', 'error');

create table article_references (
  id             uuid primary key default gen_random_uuid(),
  article_id     uuid references articles(id) on delete cascade not null,
  reference_type reference_type not null,
  reference_id   uuid not null,   -- points to projects.id o errors.id, depende sa reference_type
  created_at     timestamptz not null default now(),

  unique (article_id, reference_type, reference_id)
);

create index idx_references_article on article_references(article_id);
create index idx_references_lookup on article_references(reference_type, reference_id);
```

> Note: Dahil polymorphic ang `reference_id` (walang direct foreign key constraint), i-enforce ang integrity sa application layer (Server Action) sa halip na sa DB level. Trade-off na ito para sa flexibility — pareho lang gagana ang table kahit magdagdag ka pa ng bagong reference type balang araw (hal. `'bookmark'`).

## 8. `errors` table — ang Error Encyclopedia

Ito yung sinabi mong "pinaka-useful" na section. Bawat row dito ay isang naranasan mong error, kasama ang buong context.

```sql
create table errors (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) not null,
  title        text not null,
  technology   text[],           -- e.g. ['Next.js', 'Supabase', 'Vercel']
  error_text   text not null,    -- ang literal error message
  cause        text,
  solution     text not null,
  status       text not null default 'resolved',  -- resolved / unresolved
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index idx_errors_technology on errors using gin(technology);
```

I-link ito sa mga related concepts via `article_references` (`reference_type = 'error'`, `reference_id = errors.id`).

## 9. `projects` table — ang Project Encyclopedia

```sql
create table projects (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users(id) not null,
  name               text not null,
  slug               text not null,
  description        text,
  stack              text[],       -- e.g. ['Next.js', 'Supabase', 'n8n', 'Gemini']
  architecture_notes text,         -- markdown, pwedeng may sariling diagram
  status             text not null default 'active',  -- active / completed / archived
  started_at         date,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  unique (user_id, slug)
);
```

I-link din ito sa mga concepts na ginamit via `article_references` (`reference_type = 'project'`). Ang magandang side-effect nito: sa parehong table, dalawang direksyon ang makukuha mo —
- **Sa project page:** "Concepts Used" → query lahat ng `article_references` kung saan `reference_id = project.id`
- **Sa article page:** "Where I Used It" → query lahat ng `article_references` kung saan `article_id = article.id AND reference_type = 'project'`

## 10. `bookmarks` table

Standalone table ito — walang direct FK sa `articles`, pero pwede mo pa ring i-tag.

```sql
create table bookmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) not null,
  title       text not null,
  url         text not null,
  description text,
  created_at  timestamptz not null default now()
);
```

## 11. Search Support (Phase 2)

MVP search gamit ang PostgreSQL full-text search + `pg_trgm` para sa fuzzy title matching. Ito ang susuporta sa "hindi lang exact title" na search na nasa `00-overview.md`.

```sql
create extension if not exists pg_trgm;

alter table articles add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) stored;

create index idx_articles_search on articles using gin(search_vector);
create index idx_articles_title_trgm on articles using gin(title gin_trgm_ops);
```

Semantic search (`"paano gumagana ang RLS?"` na hindi exact match ang wording) — hintayin sa Phase 5 gamit ang `pgvector` embeddings, nasa `03-roadmap.md`.

## 12. Row Level Security (RLS)

Owner-only access sa lahat ng tables, kahit personal tool — sinabi na rin ito sa security note ng `01-architecture.md`, lalo na't puwede mong i-deploy publicly sa Vercel.

```sql
alter table articles enable row level security;
alter table tags enable row level security;
alter table errors enable row level security;
alter table projects enable row level security;
alter table bookmarks enable row level security;

create policy "owner_only_articles" on articles
  for all using (auth.uid() = user_id);

create policy "owner_only_tags" on tags
  for all using (auth.uid() = user_id);

create policy "owner_only_errors" on errors
  for all using (auth.uid() = user_id);

create policy "owner_only_projects" on projects
  for all using (auth.uid() = user_id);

create policy "owner_only_bookmarks" on bookmarks
  for all using (auth.uid() = user_id);

-- Join tables: i-check via parent article's ownership
create policy "owner_only_article_tags" on article_tags
  for all using (
    exists (select 1 from articles where articles.id = article_id and articles.user_id = auth.uid())
  );

create policy "owner_only_relations" on article_relations
  for all using (
    exists (select 1 from articles where articles.id = article_id and articles.user_id = auth.uid())
  );

create policy "owner_only_references" on article_references
  for all using (
    exists (select 1 from articles where articles.id = article_id and articles.user_id = auth.uid())
  );
```

## 13. Buod ng Tables

| Table | Layunin |
|---|---|
| `articles` | Core content — Encyclopedia, Concepts, Technologies, Architecture, Experiments |
| `architecture_details` | Extra structured fields para sa Architecture entries |
| `tags` + `article_tags` | Filtering/categorization, hiwalay sa knowledge graph |
| `article_relations` | Knowledge graph edges — "related concepts" |
| `article_references` | Bridge sa totoong buhay — saan ginamit (project/error) |
| `errors` | Personal error log — ang Error Encyclopedia |
| `projects` | Real systems built — ang Project Encyclopedia |
| `bookmarks` | External links worth balikan |

## 14. Susunod

Sa `03-roadmap.md`, ito na ang gagamiting foundation para sa Phase 1 migrations, tapos susundan ng UI at features bawat phase.
