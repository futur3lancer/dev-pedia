# DevPedia

Sariling Full-Stack Developer Encyclopedia — Wikipedia (interconnected
articles) + MDN (technical depth) + Notion (flexible editor) + GitBook
(clean docs UI), personalized sa sariling learning journey at projects.

Basahin ang buong planning docs sa `docs/`:

| Doc | Nilalaman |
|---|---|
| `docs/00-overview.md` | Ang malaking picture |
| `docs/01-architecture.md` | System architecture (stack, structure, diagrams) |
| `docs/02-database-schema.md` | Buong database schema |
| `docs/03-roadmap.md` | Phase-by-phase build plan |
| `docs/04-content-templates.md` | Mga template sa loob ng editor |

## Status

✅ **Phase 1 — Foundation** (done). ✅ **Phase 2 — Knowledge System** (done:
Tags, Related Concepts, Technology pages, Project references, Error
Encyclopedia, Search, Favorites, Recently Viewed). Susunod: **Phase 3 —
Developer Features**. Tingnan ang `docs/03-roadmap.md` §4 para sa checklist.

## Stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · shadcn/ui ·
Supabase (PostgreSQL + Auth + Storage) · Vercel

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase project

1. Gumawa ng bagong project sa [supabase.com](https://supabase.com).
2. Kopyahin ang `.env.example` bilang `.env.local`, punan ng project URL at
   keys.

```bash
cp .env.example .env.local
```

3. I-apply ang Phase 1 migration (`supabase/migrations/0001_phase1_articles.sql`)
   — via Supabase CLI (`supabase db push`) o i-paste sa SQL Editor sa
   dashboard.

### 3. Run dev server

```bash
npm run dev
```

Buksan ang [http://localhost:3000](http://localhost:3000).

## Folder Structure

Sinusunod nito ang `docs/01-architecture.md` §4:

```
app/
├── (dashboard)/       ← sidebar layout + lahat ng section pages
├── api/                ← route handlers (articles, search, relations)
└── login/
components/
├── editor/             ← markdown editor (Phase 1: plain textarea)
├── article-view/        ← rendered article + related sidebar
├── graph/                ← knowledge graph visualization (Phase 5)
└── search/
lib/
├── supabase/            ← client.ts (browser), server.ts (server)
├── actions/              ← Server Actions (articles CRUD)
├── markdown/             ← MDX rendering
└── search/                ← full-text search queries (Phase 2)
supabase/
├── migrations/
└── seed.sql
types/
└── database.ts           ← types na sumusunod sa schema
```

## Core Design Principle

> Article ≠ Relation ≠ Reference

Tatlong magkahiwalay na bagay ang bumubuo sa knowledge graph — ang aktwal
na content (`articles`), ang koneksyon sa pagitan ng dalawang articles
(`article_relations`), at kung saan/paano ginamit ang concept sa totoong
buhay (`article_references` → `projects` / `errors`). Detalye sa
`docs/01-architecture.md` §3 at `docs/02-database-schema.md`.

## Security

Owner-only access sa lahat ng tables gamit ang Supabase RLS, kahit personal
tool lang ito — lalo na kapag idedeploy publicly sa Vercel. Huwag
i-expose sa client ang `SUPABASE_SERVICE_ROLE_KEY`.
