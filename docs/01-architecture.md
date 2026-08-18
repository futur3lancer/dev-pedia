# DevPedia — System Architecture

## 1. Recommended Tech Stack

```
Frontend
────────────────
Next.js (App Router)
React
TypeScript
Tailwind CSS
shadcn/ui

Backend
────────────────
Next.js Server Actions
Route Handlers (API routes)

Database
────────────────
PostgreSQL
Supabase

Authentication
────────────────
Supabase Auth

Search
────────────────
PostgreSQL Full Text Search + pg_trgm
(later: pgvector for semantic search)

Editor
────────────────
Markdown / MDX

Deployment
────────────────
Vercel

Version Control
────────────────
Git + GitHub
```

Ito rin mismo ang stack na gusto mong i-master, kaya double purpose ang project: gumagana bilang tool AT bilang training ground.

## 2. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                        BROWSER                          │
│              Next.js (App Router) + React                │
└───────────────────────────┬───────────────────────────────┘
                            │
                     Server Actions /
                     Route Handlers
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    NEXT.JS SERVER                        │
│                                                           │
│  • Auth middleware                                        │
│  • Article CRUD                                           │
│  • Search query handling                                  │
│  • Relation resolver (related concepts)                   │
└───────────────────────────┬───────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                        SUPABASE                          │
│                                                           │
│  • PostgreSQL (articles, tags, relations, errors, projects)│
│  • Auth (owner-only access, kahit personal tool)           │
│  • RLS policies                                            │
│  • Storage (para sa mga inuupload na images/diagrams)      │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼ (Phase 4+)
┌─────────────────────────────────────────────────────────┐
│                     AI LAYER (later)                     │
│  Gemini API — "Ask my encyclopedia", summaries, quizzes   │
│  pgvector — semantic search over embeddings                │
└─────────────────────────────────────────────────────────┘
```

## 3. Core Design Principle: Article ≠ Relation ≠ Reference

Katulad ng "Call ≠ Conversation ≠ Agent" sa call center project, dapat magkahiwalay din ang tatlong bagay dito:

**Article** — ang aktwal na content (isang concept/topic).
```
article
 ├── title
 ├── slug
 ├── category
 ├── content (markdown/MDX)
 ├── status (draft/published)
 └── updated_at
```

**Relation** — ang koneksyon sa pagitan ng dalawang articles (hindi content, kundi edge sa graph).
```
article_relation
 ├── article_id
 ├── related_article_id
 └── relation_type (e.g. "related", "parent-of", "used-with")
```

**Reference** — saan/paano ginamit ang concept sa totoong buhay (project o error).
```
article_reference
 ├── article_id
 ├── reference_type (project / error)
 └── reference_id
```

Ang paghihiwalay na ito ang magpapagana sa knowledge graph — hindi mahihirapan ang query kung "anong related sa RLS" vs "saan ginamit ang RLS."

## 4. Folder Structure (Next.js App)

```
devpedia/
│
├── app/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── encyclopedia/
│   │   │   └── [slug]/
│   │   ├── concepts/
│   │   │   └── [slug]/
│   │   ├── technologies/
│   │   │   └── [slug]/
│   │   ├── errors/
│   │   │   └── [id]/
│   │   ├── architecture/
│   │   │   └── [slug]/
│   │   ├── projects/
│   │   │   └── [slug]/
│   │   ├── experiments/
│   │   ├── bookmarks/
│   │   └── search/
│   │
│   ├── api/
│   │   ├── articles/
│   │   ├── search/
│   │   └── relations/
│   │
│   └── layout.tsx
│
├── components/
│   ├── editor/            ← markdown editor
│   ├── article-view/      ← rendered article + related sidebar
│   ├── graph/              ← knowledge graph visualization
│   └── search/
│
├── lib/
│   ├── supabase/
│   ├── markdown/           ← MDX rendering, syntax highlighting
│   └── search/
│
├── supabase/
│   ├── migrations/
│   └── seed.sql
│
└── docs/                    ← itong mga planning docs na ito
    ├── 00-overview.md
    ├── 01-architecture.md
    ├── 02-database-schema.md
    ├── 03-roadmap.md
    └── 04-content-templates.md
```

## 5. Article Page Layout (Reference)

```
┌───────────────────────────────────────────────────────────────┐
│ DEV PEDIA                         🔍 Search       ⚙ Settings   │
├───────────────┬───────────────────────────────────────────────┤
│               │                                               │
│ ENCYCLOPEDIA  │  REST API                                     │
│               │  ─────────────────────────────────────────    │
│ Fundamentals  │                                               │
│ JavaScript    │  # REST API                                   │
│ TypeScript    │                                               │
│ React         │  A REST API is an architectural style...      │
│ Next.js       │                                               │
│ Backend       │  ## How it works                              │
│ Database      │                                               │
│ DevOps        │  ┌───────────────────────────────────────┐    │
│ AI            │  │ Client → API → Server → Database     │    │
│               │  └───────────────────────────────────────┘    │
│               │                                               │
│               │  ## Example                                   │
│ PROJECTS      │                                               │
│ Dental AI     │  ```ts                                        │
│ BMS           │  fetch('/api/users')                          │
│ Meter System  │  ```                                          │
│               │                                               │
│               │  ## Related Concepts                           │
│               │  HTTP · JSON · CRUD · Authentication          │
│               │                                               │
├───────────────┴───────────────────────────────────────────────┤
│ Last updated: Aug 17, 2026                                    │
└───────────────────────────────────────────────────────────────┘
```

Sidebar = navigation base sa category. Main panel = ang article mismo, naka-render mula markdown, may related concepts sa dulo.

## 6. Search Strategy

**Phase 2 (MVP search):** PostgreSQL full-text search (`tsvector`) + `pg_trgm` para sa fuzzy matching ng titles. Sapat na ito para sa exact/near-exact term matches.

**Phase 5 (semantic search):** Embeddings + `pgvector`. Dito na gagana ang "paano gumagana ang RLS?" kahit hindi exact match ang wording, dahil semantic similarity na ang ginagamit.

## 7. Security Note

Kahit personal tool ito, dapat may Supabase Auth pa rin (owner-only), lalo na kung idedeploy mo ito publicly sa Vercel. Huwag ilalantad sa client ang `SUPABASE_SERVICE_ROLE_KEY` — parehong prinsipyo sa call center project.
