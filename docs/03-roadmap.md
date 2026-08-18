# DevPedia — Roadmap

## 1. Prinsipyo

> Huwag agad gawin lahat.

Limang phase, sunod-sunod, at bawat phase ay may malinaw na "Definition of Done" — kaya alam mo kung kailan pwede nang lumipat sa susunod. Ang schema sa `02-database-schema.md` ay hindi kailangang gawin lahat nang sabay — bawat phase, sasabihin kung anong tables ang gagamitin.

```
Phase 1  Foundation          → basic CRUD app na gumagana
Phase 2  Knowledge System    → naging "encyclopedia" na, hindi lang notes app
Phase 3  Developer Features  → naging "premium developer docs" na ang look/feel
Phase 4  AI                  → naging "ask my encyclopedia" na
Phase 5  Advanced            → naging tunay na knowledge graph + semantic search
```

> **Addendum:** Pagkatapos ma-achieve ang Phase 5 Definition of Done, may naidagdag pang isang round ng UI refinement (tingnan sa `Phase 6` sa ibaba) — hindi ito bagong content-layer feature (walang bagong table, walang bagong AI capability), kundi paglilinis ng listing/dashboard UI na sapat na para sa Phase 1-3 scale noon pero kailangan nang i-restructure ngayong lumaki na ang laman.

## 2. Phase 1 — Foundation

**Goal:** Magkaroon ng gumaganang app kung saan pwede kang mag-create, mag-view, at mag-edit ng articles. Wala pang relations, wala pang search — plain CRUD muna.

**Tables na gagamitin:** `articles` (base fields lang, walang `search_vector` pa)

| Task | Detalye |
|---|---|
| [ ] Next.js setup | App Router, TypeScript, Tailwind, shadcn/ui — sundin ang folder structure sa `01-architecture.md` §4 |
| [ ] Supabase project | Gawin ang project, i-connect sa Next.js via `lib/supabase/` |
| [ ] `articles` table migration | Base version muna: id, user_id, type, title, slug, content, status, timestamps |
| [ ] Authentication | Supabase Auth, owner-only login (email/password o magic link) |
| [ ] Dashboard page | Simpleng landing page pagka-login — placeholder muna, di pa kailangang functional |
| [ ] Categories (static) | Sidebar navigation base sa sitemap ng `00-overview.md` — pwedeng hardcoded muna ang mga section labels |
| [ ] Articles CRUD | Create / Read / Update / Delete gamit ang Server Actions |
| [ ] Markdown editor | Plain textarea muna na naka-preview sa markdown — hindi pa kailangan ng fancy WYSIWYG |
| [ ] Article viewer | I-render ang markdown content sa isang article page |

**Definition of Done:** Kaya mong gumawa ng article, i-save bilang draft o published, at buksan ito sa isang page na naka-render mula markdown.

## 3. Phase 2 — Knowledge System

**Goal:** Dito lumalabas ang "interconnected" na core feature — hindi na lang flat list ang mga articles, may relations, references, at search na.

**Tables na gagamitin:** `tags`, `article_tags`, `article_relations`, `article_references`, `errors`, `projects`, `search_vector` column sa `articles`

| Task | Detalye |
|---|---|
| [x] Tags | `tags` + `article_tags` tables, UI para mag-add ng tags sa article editor |
| [x] Related concepts | `article_relations` table + UI para mag-link ng dalawang articles ("Related Concepts" section sa article page) |
| [x] Technology pages | Gamitin ang `type = 'technology'` — page na nagpapakita ng "anak" na concepts (hal. Supabase → PostgreSQL, Auth, RLS, Storage) |
| [x] Project references | `projects` table + `article_references` — "Where I used it" sa bawat article |
| [x] Error encyclopedia | `errors` table + editor form + listing page |
| [x] Search | `search_vector` (tsvector) + `pg_trgm`, search bar sa top nav |
| [x] Favorites | Simpleng `is_favorite` boolean o hiwalay na join table, para sa mabilisang access |
| [x] Recently viewed | I-track sa client (o simpleng `last_viewed_at` column) para sa Dashboard widget |

**Definition of Done:** Kapag nag-open ka ng article, makikita mo ang related concepts AT kung saang project/error ito ginamit — buhay na ang knowledge graph, kahit basic pa lang ang visualization.

## 4. Phase 3 — Developer Features

**Goal:** Dito nagiging "premium developer documentation" ang itsura — hindi na generic CRUD dashboard, kundi parang MDN/GitBook na.

**Tables na gagamitin:** wala nang bagong table dito — mostly UI/UX at content-quality features.

| Task | Detalye |
|---|---|
| [x] Code blocks | Fenced code blocks sa markdown editor/renderer |
| [x] Syntax highlighting | Gamit ang isang library (hal. Shiki o Prism) sa `lib/markdown/` |
| [x] Copy code button | Sa bawat code block sa article viewer |
| [x] Architecture diagrams | I-render ang `architecture_details.diagram` field — ASCII muna, o Mermaid kung gusto mong mas visual |
| [x] Version history | Simpleng `article_versions` table (snapshot bago mag-save ng update) |
| [x] Draft / Published toggle | UI polish sa `status` field na nasa Phase 1 pa |
| [x] Changelog | Listahan ng recent edits sa Dashboard — "updated 3 articles this week" |

**Definition of Done:** Kapag pinakita mo ang app sa ibang developer, hindi mukhang "notes app" — mukhang totoong documentation site.

## 5. Phase 4 — AI

**Goal:** Dito pumapasok ang AI layer na nasa `01-architecture.md` §2 — "Ask my encyclopedia."

**Bagong dependency:** Gemini API (o alternatibo)

| Task | Detalye |
|---|---|
| [x] AI search | Natural-language query → i-map sa relevant articles (simple version muna: keyword expansion, hindi pa embeddings) |
| [x] Ask my encyclopedia | Chat interface na sumasagot base sa laman ng iyong `articles` (retrieval muna sa full-text search bago pumunta sa semantic sa Phase 5) |
| [x] Explain concept | Button sa article page — "explain this simpler" o "explain with my own projects as examples" (nasa Encyclopedia, Technology, Architecture, **at Concepts** pages na — tingnan ang pagwawasto sa note sa ibaba) |
| [x] Generate summary | Auto-generate ng `excerpt` mula sa `content` gamit ang AI |
| [x] Generate quiz | Batay sa content ng isang article — para sa sariling review |
| [x] Generate flashcards | Parehong batay sa article content |
| [x] Detect related concepts | AI suggestion ng possible `article_relations` — approve/reject na lang, hindi auto-add |

**Definition of Done:** Kaya mong magtanong sa sarili mong encyclopedia gamit ang natural language, at sasagot ito base sa laman mo mismo — hindi generic AI answer.

> **Pagwawasto (Phase 6 audit):** Luma na pala itong note — na-verify na buo na ang `concepts/[slug]/page.tsx`, `concepts/page.tsx`, `concepts/new/`, at `concepts/[slug]/edit/`, at naka-wire na rin ang `<ExplainConcept />` sa concept detail page. Hindi na ito "known gap" — na-resolve na ito sa isang punto pagkatapos ma-flag, bago pa ang Phase 6 audit na ito, pero hindi na-update ang note. Natitirang open item na lang: hindi pa card grid ang `concepts/page.tsx` listing (tingnan sa Phase 6 follow-up).

## 6. Phase 5 — Advanced

**Goal:** Tunay na knowledge graph visualization + semantic search + learning tools.

**Tables na gagamitin:** bagong `embeddings` table (o column) gamit ang `pgvector` extension

| Task | Detalye |
|---|---|
| [x] Knowledge graph visualization | Interactive graph view (nodes = articles, edges = `article_relations`) — click node → punta sa article |
| [x] Semantic search | `pgvector` + embeddings column sa `articles`, palitan/complement ang `tsvector` search |
| [x] Embeddings pipeline | Auto-generate ng embedding tuwing na-save ang article (via Edge Function o background job) |
| [x] Learning progress | Simpleng tracking — ilang articles na ba ang na-cover mo sa isang topic tree |
| [x] Skill roadmap | Visual na progress path (hal. React → Next.js → Auth → Deployment) |
| [x] Spaced repetition | Gamit ang mga generated flashcards sa Phase 4 — schedule ng review base sa spaced repetition algorithm |

**Definition of Done:** Nagiging tunay na "developer operating system" na ang DevPedia — may visual graph, semantic search, at learning system.

> **Note (slice 1 — Knowledge graph):** Walang bagong npm dependency na idinagdag (hal. d3-force) — custom, from-scratch na Fruchterman-Reingold-style layout na lang sa `components/graph/KnowledgeGraph.tsx` (fixed iterations, hindi continuous simulation loop). Sapat na ito sa scale ng isang personal na encyclopedia. Client-side lang ang manual drag-to-reposition — hindi pa naka-persist sa DB; kung gusto pang i-save ang layout sa pagitan ng sessions, kakailanganin ng `x`/`y` columns (o hiwalay na table) sa susunod.
>
> **Note (slice 2 — Semantic search + embeddings):** Walang tunay na background job / Edge Function queue — "best-effort, inline sa server action" na lang ang embeddings pipeline (`lib/actions/embeddings.ts`): tinatawag mula sa `createArticle`/`updateArticle`, naka-try/catch kaya hindi nabibigo ang save kahit mabigo ang embedding call. Dagdag na latency ito sa bawat save na may binagong title/content — kung magiging mabagal o mahal, dito unang tumingin (Edge Function, queue, o debounce). May "Backfill" button sa Search page (semantic mode) para sa mga article na na-save bago dumating ang embeddings column. `MIN_SIMILARITY` threshold sa `lib/actions/semantic-search.ts` ay approximate lang — hindi pa na-calibrate sa totoong data dahil wala pang live `GEMINI_API_KEY` na nasubukan sa environment na ito; i-adjust pagkatapos ng unang real test pass.
>
> **Known follow-up (bandwidth):** Ang bagong `articles.embedding` column (768 floats bawat row) ay awtomatikong kasama sa anumang `select("*")` (o `.select()` na walang column list) sa `articles` table — kasama na ang mga listing page (`encyclopedia/page.tsx`, `concepts/page.tsx`, `technologies/page.tsx`, `architecture/page.tsx`) at dashboard widgets (`listFavorites`, `listRecentlyViewed`, atbp. sa `lib/actions/articles.ts`), kahit hindi naman ginagamit doon ang embedding. Hindi pa ito na-aayos sa slice na ito — kakailanganin i-audit ang bawat `.from("articles").select(...)` call (mga 15 files) para explicit na i-exclude ang `embedding` maliban sa mga lugar na talagang kailangan ito (`match_articles` RPC, `embeddings.ts`).
>
> **Note (slice 3 — Learning progress):** Walang bagong table — ginamit na lang ang existing `type` + `subcategory` columns sa `articles` bilang "topic tree" (2 levels: type → subcategory), sa halip na gumawa ng hiwalay na curated topic hierarchy. "Covered" = `status = 'published'` (draft articles nabibilang sa total pero hindi pa sa "covered" count). Bagong query lang ito sa `lib/actions/learning-progress.ts` — `select("type, subcategory, status")` na explicit, sinadya na hindi `select("*")`, para hindi na madagdagan pa ang naka-flag nang embedding-bandwidth na isyu sa itaas. Widget sa Dashboard (`components/dashboard/LearningProgressWidget.tsx`) — client component dahil may per-type expand/collapse, pero server-computed pa rin ang data mismo.
>
> **Note (slice 4 — Skill roadmap):** Walang bagong table din dito, at walang bagong "curated path" na kailangan pang i-maintain nang hiwalay — muling ginamit ang `depends-on` relation type na nasa `article_relations` na (Phase 2, dating generic knowledge-graph edge lang sa slice 1). Isang "path" = isang connected component ng depends-on edges, naka-topological sort (Kahn's algorithm) para lumabas ang tamang pagkakasunod-sunod ng prerequisites. Step states: "done" (published), "next" (unpublished pero na-satisfy na lahat ng prerequisites nito), "locked" (may unpublished pang prerequisite). May cycle-detection din — kung may circular dependency (posible dahil walang DB-level constraint laban dito, at pwedeng galing sa AI-detected relations sa `detect-relations.ts`), naka-flag na lang ito sa UI sa halip na mag-crash. Bagong page sa `/roadmap` (`app/(dashboard)/roadmap/page.tsx`) + link sa sidebar nav — walang branching visualization pa (straight na vertical list kahit magka-branch ang dependencies); i-upgrade lang sa tunay na DAG layout (gaya ng `KnowledgeGraph.tsx`) kung lalaki na ito.
>
> **Note (slice 5 — Spaced repetition):** Ito ang unang slice sa Phase 5 na may bagong table talaga (`flashcards`, migration `0010_phase5_flashcards.sql`) — hindi na kasya sa existing schema dahil kailangan ng persisted state (dating ephemeral lang ang "Generate flashcards" sa Phase 4, bagong deck bawat click, walang na-se-save). Opt-in ang pag-save: may bagong "💾 Save deck for review" button sa `FlashcardGenerator.tsx` matapos mag-generate — hindi awtomatikong na-se-save ang bawat generate. Scheduling algorithm: standard SM-2 (SuperMemo 2), simplified sa 4 grade button na lang sa UI (Again/Hard/Good/Easy, naka-map sa 0/3/4/5 sa loob ng quality scale — karaniwang simplification na ginagawa rin ng mga tool gaya ng Anki) sa halip na buong 0-5 scale. `lib/actions/spaced-repetition.ts` ang may hawak ng formula (`computeSm2`) at ng list/save/review actions. Bagong `/review` page (max 30 cards bawat session) + due-count banner sa Dashboard na naka-link papunta roon. May dedup check na sa pagitan ng bagong-generate at dati nang na-save na cards ng parehong article — tingnan ang pagwawasto sa ibaba.

**Phase 5 — Definition of Done: nakamit na.** Lahat ng task sa itaas (knowledge graph, semantic search, embeddings pipeline, learning progress, skill roadmap, spaced repetition) ay tapos na — tunay nang "developer operating system" ang DevPedia, may visual graph, semantic search, at learning system. Natitirang open items: ang mga "Known follow-up" / "Note" sa itaas (embedding bandwidth audit — ✅ resolved; MIN_SIMILARITY calibration — ✅ addressed sa abot ng kaya, tingnan sa ibaba; flashcard dedup — ✅ resolved na rin pala, tingnan sa ibaba) — mga polish/audit item, hindi bagong feature.

> **Resolved — Embedding bandwidth audit:** Na-audit na ang lahat ng `.from("articles").select(...)` call sa buong codebase. 9 na call sa 5 files ang gumagamit ng `select("*")` (o bare `.select()` pagkatapos ng insert/update, parehong effect) kahit hindi kailangan ang `embedding`: ang apat na listing page (`encyclopedia/`, `technologies/`, `concepts/`, `architecture/` — `page.tsx`), `lib/actions/search.ts` (parehong full-text at ILIKE fallback), at `lib/actions/articles.ts` (`createArticle`, `updateArticle`, `getArticleBySlug`, `setArticleStatus`, `toggleFavorite`, `listFavorites`, `listRecentlyViewed`). Bagong shared constant, `ARTICLE_COLUMNS` (`lib/supabase/columns.ts`) — explicit column list na tumutugma sa `Article` interface MINUS `embedding`, ginamit sa lahat ng siyam na lugar sa halip na paulit-ulit na i-type ang buong listahan. Hindi na kasama dito ang `lib/actions/embeddings.ts` (talagang kailangan doon ang column, base sa pipeline mismo) at ang `match_articles` RPC sa `semantic-search.ts` (SQL function call, hindi apektado ng issue na ito dahil hindi ito dumadaan sa `.select()`).
>
> **Addressed (bahagya) — MIN_SIMILARITY calibration:** Hindi ito ma-close nang buo nang walang totoong `GEMINI_API_KEY` at totoong content na susubukan — walang paraan para malaman ang tamang cutoff nang hindi talaga tinitingnan ang similarity distribution sa totoong queries. Dalawang bagay na lang ang ginawa: (1) `MIN_SIMILARITY` ay `SEMANTIC_SEARCH_MIN_SIMILARITY` na env var ngayon (`.env.example`), hindi na naka-hardcode — pwede nang i-adjust nang walang code change; (2) hindi na tinatanggal sa server side (`semantic-search.ts`) ang mga below-threshold na resulta — nananatili sila sa return value na may `belowThreshold` flag, at ipinapakita ng `/search` page (semantic mode) sa hiwalay na collapsed na "Lower confidence matches" section sa halip na basta itago. Layunin: makita ng may-ari ng app ang buong spread ng similarity scores sa totoong queries niya, para doon niya ma-set nang informed ang env var — hindi na kailangan pang mag-edit ng code para dito.
>
> **Pagwawasto (Phase 6 audit) — Flashcard dedup:** Luma na rin pala ang note sa itaas na nagsasabing "walang dedup check." Na-verify kong buo na pala ang dedup logic — `normalizeFront()` sa `spaced-repetition.ts` (lowercase, tanggalin ang punctuation, i-collapse ang whitespace, tapos exact-match comparison) ay ginagamit ng `saveFlashcardDeck()` para i-check ang bagong cards laban sa parehong article's existing na naka-save na cards SA `flashcards` table, AT laban sa ibang cards sa parehong batch (kung nag-duplicate ang AI sa isang generate). Ipinapakita rin sa UI (`FlashcardGenerator.tsx`) ang resulta pagkatapos mag-save: "X card(s) saved · Y skipped as duplicate(s)." Hindi malinaw kung kailan ito na-implement pagkatapos ma-flag bilang open item, pero hindi na-update ang note dito. Walang kulang na code — doc-fix lang ito.

## 7. Phase 6 — UI Refinement

**Goal:** Hindi bagong content layer o bagong capability — round ng UI polish sa mga lugar na dumaming laman na (errors log, dashboard, listing pages) at hindi na sapat ang simpleng flat list/plain divs na ginamit noong Phase 2-3 pa.

**Tables na gagamitin:** wala nang bagong table — existing na `errors` at `articles` lang, mostly UI/UX layer.

| Task | Detalye |
|---|---|
| [x] Errors log — table view | `/errors` mula flat `divide-y` list papuntang tunay na sortable table (`components/errors/ErrorsTable.tsx`) — client-side sort sa Title/Technology/Status/Last updated; ang technology filter chips ay nananatili sa `page.tsx`, server-side pa rin via `searchParams` (URL-shareable ang filtered view) |
| [x] Dashboard restructure — L1/L2/L3 hierarchy | Bagong `components/dashboard/DashboardSection.tsx` — 3 antas ng visual weight sa halip na patung-patong na parehong-weight na widgets: **L1** = Learning Progress (elevated card, ang pangunahing "kumusta ang encyclopedia ko" overview, iisa lang), **L2** = Changelog + Favorites (magkatabing bordered cards sa grid), **L3** = Recently Viewed (walang card, glanceable lang, pinakamababang weight) |
| [x] Listing pages — card grid | Bagong `components/listing/ArticleCardGrid.tsx` (shared, dahil magkaparehong shape ang mga page) — ginamit sa `encyclopedia/`, `technologies/`, `architecture/`, **at `concepts/`** listing pages (dating flat list, ngayon responsive 1/2/3-column card grid: title, status badge, excerpt, subcategory badge, "updated X ago") |

**Definition of Done:** Kapag pinakita mo ang app, hindi na mukhang generic list-of-links ang errors log, dashboard, at ang apat na pangunahing listing page — may visual hierarchy at scanning na, hindi na flat.

> **Update:** Naisama na rin ang `concepts/page.tsx` sa card-grid conversion (dating naka-flag bilang "Known follow-up") — apat na ang listing page ngayon gamit ang shared `ArticleCardGrid`.

## 8. Suggested Build Order Buod

```
Phase 1 → basic CRUD (articles lang)
Phase 2 → tags, relations, references, errors, projects, search (tsvector)
Phase 3 → developer-grade UI polish
Phase 4 → AI layer sa ibabaw ng laman na nasa Phase 1-2
Phase 5 → pgvector, graph viz, learning tools
Phase 6 → UI refinement round (errors table, dashboard hierarchy, listing card grids)
```

Bawat phase ay umaasa sa naunang phase — kaya huwag lalaktawan. Halimbawa, walang saysay ang semantic search (Phase 5) kung wala pang laman ang `articles` table (Phase 1-2).

## 9. Susunod

Sa `04-content-templates.md`, ito na ang mga actual na template — Article, Error, Project, at Architecture entry — na gagamitin mo sa loob ng markdown editor mula Phase 1 pa.
