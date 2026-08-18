-- Sample data para sa local development — sinasakop ang LAHAT ng tables
-- (articles bawat type, tags, relations, project, error, architecture
-- details, flashcards, bookmarks). Idempotent: safe na paulit-ulit i-run —
-- dine-delete muna ang dating seed rows (batay sa mga slug/name sa ibaba)
-- bago mag-insert ulit, kaya hindi dumadami ang datos sa bawat re-run.
--
-- Hindi kasama dito ang `article_versions` — auto-populated ito ng
-- `trg_articles_snapshot_version` trigger (0008) tuwing nagbabago ang
-- title/content ng isang article, kaya hindi ito dapat i-seed nang manual.
--
-- Kinukuha ang user_id mula sa unang row sa auth.users — kailangan muna
-- ng isang account (mag sign-up sa app) bago i-run ito. Kung gusto mong
-- specific na user lang ang ma-seed-an, palitan ang `select id from
-- auth.users order by created_at limit 1` ng sarili mong
-- `'YOUR-USER-UUID'::uuid`.

do $$
declare
  v_user_id           uuid;
  v_rest_api_id       uuid;
  v_http_id           uuid;
  v_idempotency_id    uuid;
  v_nextjs_id         uuid;
  v_layered_arch_id   uuid;
  v_cors_id           uuid;
  v_project_id        uuid;
  v_error_id          uuid;
  v_tag_backend_id    uuid;
  v_tag_frontend_id   uuid;
  v_tag_api_id        uuid;
begin
  select id into v_user_id from auth.users order by created_at limit 1;

  if v_user_id is null then
    raise exception 'Walang laman ang auth.users — mag sign-up muna sa app bago i-run ang seed.sql.';
  end if;

  -- =========================================================
  -- Cleanup (idempotency) — tanggalin muna ang dating seed rows.
  -- Cascade ang mga child tables (tags join, relations, references,
  -- architecture_details, flashcards, versions) dahil naka-`on delete
  -- cascade` sila sa articles/projects/errors.
  -- =========================================================
  delete from articles where user_id = v_user_id and slug in
    ('rest-api', 'http', 'idempotency', 'nextjs', 'layered-architecture', 'cors');
  delete from projects where user_id = v_user_id and slug = 'devpedia';
  delete from errors where user_id = v_user_id and title = 'CORS: No Access-Control-Allow-Origin header';
  delete from tags where user_id = v_user_id and slug in ('backend', 'frontend', 'api-design');
  delete from bookmarks where user_id = v_user_id and url in (
    'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview',
    'https://nextjs.org/docs/app/building-your-application/routing/route-handlers',
    'https://supabase.com/docs/guides/database/postgres/row-level-security'
  );

  -- =========================================================
  -- Articles — isa bawat `article_type` (encyclopedia, concept,
  -- technology, architecture, experiment)
  -- =========================================================

  -- type = 'encyclopedia'
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'encyclopedia', 'REST API', 'rest-api', 'Backend',
    'An architectural style for designing networked applications using stateless HTTP requests.',
    '# REST API

## What is REST API?

REST (Representational State Transfer) is an architectural style for designing networked applications. A REST API exposes resources (users, articles, orders) as URLs, and clients interact with them using standard HTTP methods.

## Why It Matters

Almost every web app talks to a backend through some form of REST API. Understanding it well makes debugging, designing, and consuming APIs much faster.

## How It Works

```
Client
  ↓  GET /api/articles/123
Server
  ↓  200 OK + JSON body
Client
```

Resources are nouns (`/articles`), and HTTP methods are verbs (`GET`, `POST`, `PATCH`, `DELETE`).

## Example

```ts
const res = await fetch("/api/articles/123");
const article = await res.json();
```

## Related Concepts

→ HTTP
→ Idempotency

## My Notes

Madaling makalimutan na "REST" ay style lang, hindi protocol — kaya walang "official" enforcement, konsensus lang sa team ang gumagana dito.

## Where I Used It

→ DevPedia
',
    'published'
  )
  returning id into v_rest_api_id;

  -- type = 'concept'
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'HTTP', 'http', 'Networking',
    'The protocol that powers data exchange on the web — requests, responses, methods, and status codes.',
    '# HTTP

## What is HTTP?

HTTP (HyperText Transfer Protocol) is the protocol used for communication between clients and servers on the web.

## Why It Matters

Kahit anong framework o language, HTTP ang common ground — kailangan itong maintindihan para makapag-debug ng network issues.

## How It Works

```
Request:  method + path + headers + body
Response: status code + headers + body
```

## Example

```
GET /api/articles HTTP/1.1
Host: example.com
```

## Related Concepts

→ REST API
→ CORS

## My Notes

Status codes ang pinaka-underrated na part nito — 200 vs 201 vs 204 ay may specific na meaning, hindi lang "success".

## Where I Used It

→ DevPedia
',
    'published'
  )
  returning id into v_http_id;

  -- type = 'concept'
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Idempotency', 'idempotency', 'API Design',
    'An operation is idempotent if calling it multiple times has the same effect as calling it once.',
    '# Idempotency

## What is Idempotency?

An operation is idempotent kapag ang pag-call dito ng paulit-ulit ay parehas lang ang resulta sa isang beses na pag-call.

## Why It Matters

Importante ito para sa retry logic — kapag naka-timeout ang request pero natupad naman pala sa server, safe lang ulit i-retry kung idempotent ang operation.

## How It Works

```
PUT    -> idempotent (same payload, same end-state)
DELETE -> idempotent (already-deleted stays deleted)
POST   -> NOT idempotent by default (creates a new resource each time)
```

## Example

```ts
// Safe to retry — parehas lang ang end-state
await fetch(`/api/articles/${id}`, { method: "PUT", body: JSON.stringify(data) });
```

## Related Concepts

→ REST API
→ HTTP

## My Notes

Common mistake: akala idempotent na lahat ng GET/PUT/DELETE by default — depende pa rin sa implementation ng server.

## Where I Used It

→ DevPedia
',
    'published'
  )
  returning id into v_idempotency_id;

  -- type = 'technology'
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'technology', 'Next.js', 'nextjs', 'Framework',
    'A React framework for building full-stack web applications with server-side rendering and routing built in.',
    '# Next.js

## What is Next.js?

Next.js ay isang React framework na may built-in na routing, server-side rendering, at API routes.

## Sub-Concepts

→ App Router
→ Server Actions
→ Middleware

## Why I Use It

File-based routing at server actions ang pinaka-nagpapabilis ng development — hindi na kailangan ng hiwalay na backend para sa simpleng CRUD.

## Common Pitfalls

Client vs Server Components confusion — madalas makalimutan kung saan pwede gumamit ng `useState`/`useEffect`.

## Related Concepts

→ REST API

## Where I Used It

→ DevPedia
',
    'published'
  )
  returning id into v_nextjs_id;

  -- type = 'architecture'
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'architecture', 'Layered Architecture', 'layered-architecture', 'Architecture Pattern',
    'Organizing code into horizontal layers (presentation, business logic, data access) with each layer depending only on the one below it.',
    '# Layered Architecture

## Definition

Layered architecture organizes code into horizontal layers — karaniwan ay presentation, business logic, at data access — kung saan bawat layer ay depende lang sa layer sa ibaba nito.

## When to Use

- Medium-sized applications na may malinaw na separation ng concerns
- Kapag maraming developers ang magtatrabaho sa iba''t ibang layer

## When NOT to Use

- Napaka-simpleng CRUD apps — sobrang overhead
- Kapag mabilis magbago ang requirements sa cross-cutting concerns

## Advantages

- Malinaw ang responsibilities ng bawat layer
- Madaling i-test ang business logic nang hiwalay sa UI o DB

## My Notes

Sa personal projects, madalas ko itong i-simplify sa 3 layers na lang: UI, server actions, at DB queries — sapat na para hindi mag-mix ang concerns.

## Where I Used It

→ DevPedia
',
    'published'
  )
  returning id into v_layered_arch_id;

  insert into architecture_details (article_id, when_to_use, when_not_to_use, advantages, disadvantages, diagram)
  values (
    v_layered_arch_id,
    array['Medium-sized applications with clear separation of concerns', 'Teams working on different layers in parallel'],
    array['Very simple CRUD apps — too much overhead', 'Fast-changing cross-cutting requirements'],
    array['Clear responsibility per layer', 'Business logic is easy to test in isolation'],
    array['Extra indirection for simple flows', 'Can encourage over-engineering on small projects'],
    'Presentation
   ↓
Business Logic
   ↓
Data Access
   ↓
Database'
  );

  -- type = 'experiment'
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'experiment', 'CORS preflight caching', 'cors', 'Networking',
    'Testing how long browsers cache CORS preflight (OPTIONS) responses using Access-Control-Max-Age.',
    '# CORS preflight caching

## What is CORS preflight caching?

Sinubukan kong i-benchmark kung gaano katagal nagpe-persist ang preflight (`OPTIONS`) cache ng browser gamit ang `Access-Control-Max-Age` header.

## Why It Matters

Ang bawat uncached preflight ay dagdag round-trip bago pa man ma-fire ang actual request — malaking epekto sa latency ng cross-origin API calls.

## How It Works

```
Browser --OPTIONS--> Server (preflight, cache-able)
Browser --GET/POST--> Server (actual request)
```

## Example

```ts
res.setHeader("Access-Control-Max-Age", "600"); // 10 minutes
```

## Related Concepts

→ HTTP
→ REST API

## My Notes

Nagulat ako na may hard cap ang Chrome (2 hours) kahit mas mataas pa ang Max-Age na nakalagay — good to know bago mag-over-optimize dito.

## Where I Used It

→ DevPedia
',
    'draft'
  )
  returning id into v_cors_id;

  -- =========================================================
  -- Tags
  -- =========================================================
  insert into tags (user_id, name, slug) values (v_user_id, 'Backend', 'backend') returning id into v_tag_backend_id;
  insert into tags (user_id, name, slug) values (v_user_id, 'Frontend', 'frontend') returning id into v_tag_frontend_id;
  insert into tags (user_id, name, slug) values (v_user_id, 'API Design', 'api-design') returning id into v_tag_api_id;

  insert into article_tags (article_id, tag_id) values
    (v_rest_api_id, v_tag_backend_id),
    (v_rest_api_id, v_tag_api_id),
    (v_http_id, v_tag_backend_id),
    (v_idempotency_id, v_tag_api_id),
    (v_nextjs_id, v_tag_frontend_id),
    (v_layered_arch_id, v_tag_backend_id),
    (v_cors_id, v_tag_backend_id);

  -- =========================================================
  -- Related Concepts (knowledge graph edges)
  -- =========================================================
  insert into article_relations (article_id, related_article_id, relation_type) values
    (v_rest_api_id, v_http_id, 'related'),
    (v_rest_api_id, v_idempotency_id, 'related'),
    (v_http_id, v_cors_id, 'related'),
    (v_nextjs_id, v_rest_api_id, 'used-with'),
    (v_layered_arch_id, v_rest_api_id, 'used-with');

  -- =========================================================
  -- Projects + article_references (theory <-> practice link)
  -- =========================================================
  insert into projects (user_id, name, slug, description, stack, architecture_notes, status, started_at)
  values (
    v_user_id, 'DevPedia', 'devpedia',
    'Personal encyclopedia app para sa mga concepts, errors, at architecture patterns na natutunan sa trabaho.',
    array['Next.js', 'Supabase', 'TypeScript', 'Tailwind'],
    'Layered architecture: app router (presentation) -> lib/actions (business logic) -> Supabase client (data access).',
    'active', current_date - interval '3 months'
  )
  returning id into v_project_id;

  insert into article_references (article_id, reference_type, reference_id) values
    (v_rest_api_id, 'project', v_project_id),
    (v_nextjs_id, 'project', v_project_id),
    (v_layered_arch_id, 'project', v_project_id);

  -- =========================================================
  -- Errors + article_references
  -- =========================================================
  insert into errors (user_id, title, technology, error_text, cause, solution, status)
  values (
    v_user_id, 'CORS: No Access-Control-Allow-Origin header',
    array['Next.js', 'REST API'],
    'Access to fetch at ''https://api.example.com/articles'' from origin ''https://app.example.com'' has been blocked by CORS policy',
    'Ang API server ay hindi nagse-set ng Access-Control-Allow-Origin header sa response nito.',
    'Idagdag ang tamang CORS headers sa server (o middleware), o gumamit ng proxy/rewrite kung parehong domain lang naman ang gusto.',
    'resolved'
  )
  returning id into v_error_id;

  insert into article_references (article_id, reference_type, reference_id) values
    (v_cors_id, 'error', v_error_id),
    (v_http_id, 'error', v_error_id);

  -- =========================================================
  -- Flashcards (sample deck, saved para sa REST API article)
  -- =========================================================
  insert into flashcards (article_id, front, back) values
    (v_rest_api_id, 'What does REST stand for?', 'Representational State Transfer'),
    (v_rest_api_id, 'What are resources represented as in a REST API?', 'URLs / endpoints (nouns), acted on via HTTP methods (verbs)'),
    (v_rest_api_id, 'Name three common HTTP methods used in REST APIs.', 'GET, POST, PATCH (also PUT and DELETE)');

  -- =========================================================
  -- Bookmarks (standalone, walang FK sa articles — see 0011)
  -- =========================================================
  insert into bookmarks (user_id, title, url, description) values
    (v_user_id, 'HTTP Overview — MDN',
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview',
      'Reference kapag nakakalimutan ang specifics ng HTTP methods/status codes.'),
    (v_user_id, 'Next.js Route Handlers docs',
      'https://nextjs.org/docs/app/building-your-application/routing/route-handlers',
      'Official docs para sa app/api routes — GET/POST conventions, NextRequest/NextResponse.'),
    (v_user_id, 'Supabase RLS guide',
      'https://supabase.com/docs/guides/database/postgres/row-level-security',
      null);

end $$;
