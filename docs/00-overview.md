# DevPedia — Project Overview

## Ano ang DevPedia?

**DevPedia** ay ang sarili mong Full-Stack Developer Encyclopedia — kombinasyon ng Wikipedia (interconnected articles) + MDN (technical depth) + Notion (flexible editor) + GitBook (clean docs UI), pero personalized sa sariling learning journey at projects mo.

Hindi ito basta notes app. Ito ay:
- Isang **knowledge base** na naka-markdown, naka-relate sa isa't isa (knowledge graph)
- Isang **error encyclopedia** — permanenteng record ng bawat error na na-encounter mo at kung paano mo ito inayos
- Isang **project archive** — bridge sa pagitan ng theory at actual na ginawa mong systems
- Eventually, isang **AI assistant** na sasagot base sa sarili mong accumulated knowledge

## Bakit ito worth gawin?

1. **Compounding value** — habang tumatagal, dumadami ang laman, at bumabalik ang value sa bawat bagong problema na kahawig ng dati mong na-solve.
2. **Training ground mismo** — ang pag-build ng DevPedia ay full-stack project mismo (Next.js, Supabase, Auth, RLS, Search, Deployment), kaya natututo ka habang ginagawa mo ito.
3. **Portfolio + operating system** — hindi lang siya portfolio piece, kundi araw-araw mong gagamitin bilang developer.

## Core Principle

> Huwag i-store ang **"ano"** lang (definition). I-store din ang **"paano mo natutunan,"** **"anong nasira,"** at **"paano mo inayos."**

Ito ang difference ng DevPedia sa ordinary docs site — may layer ng personal experience sa bawat concept.

## High-Level Sitemap

```
DEV PEDIA
│
├── 🏠 Dashboard              — recently viewed, progress, quick links
├── 📚 Encyclopedia           — core technical topics (React, SQL, Auth, atbp.)
├── 🧩 Concepts                — cross-cutting ideas (REST, RLS, Caching, atbp.)
├── 🛠️ Technologies            — tool/vendor-specific pages (Supabase, Vercel, Gemini)
├── 🐛 Errors & Solutions      — personal error log, ang pinaka-valuable section
├── 🏗️ Architecture            — patterns (monolith, microservices, event-driven, atbp.)
├── 🚀 Projects                — real systems built, bridge sa theory
├── 🧪 Experiments             — mga sinusubukan pa, hindi pa "solid"
└── 🔖 Bookmarks               — external references worth balikan
```

## Ang Pinaka-Importanteng Feature: Interconnection

Hindi flat list ang mga articles — magkakaugnay sila. Kapag binuksan mo ang **Supabase**, makikita mo ang mga anak nitong concepts (PostgreSQL, Auth, RLS, Storage, Realtime). Kapag binuksan mo ang **RLS**, makikita mo ang related concepts (PostgreSQL, Authorization, Multi-tenancy) AT kung saang project mo ito ginamit.

Ito ang gumagawa sa DevPedia na parang **knowledge graph**, hindi lang listahan ng notes.

## Susunod na mga Docs

Itong overview na ito ay bahagi ng isang buong set ng planning docs:

| Doc | Nilalaman |
|---|---|
| `00-overview.md` | Ito — ang malaking picture |
| `01-architecture.md` | System architecture ng DevPedia app mismo (stack, structure, diagrams) |
| `02-database-schema.md` | Buong database schema (articles, tags, relations, errors, projects) |
| `03-roadmap.md` | Phase-by-phase build plan (Foundation → Knowledge System → AI → Advanced) |
| `04-content-templates.md` | Ang mga template na gagamitin sa loob ng app (article, error, project, architecture entry) |

Simulan natin sa architecture.
