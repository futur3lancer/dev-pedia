-- =============================================================
-- seed_roadmap_topics.sql (v2 — FULL CONTENT + REAL PROJECTS)
--
-- Pinalitan ang placeholder-only na bersyon: ngayon ang bawat isa
-- sa 89 topics (8-Level Full-Stack + AI Roadmap) ay may KUMPLETONG
-- content na (Why It Matters / How It Works / Example / My Notes /
-- Where I Used It) — hindi na placeholder. Status = 'published' na
-- rin ngayon (dating 'draft').
--
-- Dagdag din dito ang 5 SAMPLE REAL-WORLD PROJECTS (bukod pa sa
-- 'DevPedia' na project mula sa demo seed.sql):
--   1. ShopLokal    — E-commerce marketplace (Next.js/Supabase)
--   2. QueueWise    — Realtime multi-tenant queueing system
--   3. SupportGenie — AI customer-support chatbot with RAG
--   4. VoiceDesk    — Voice AI phone receptionist
--   5. PulseOps     — Microservices analytics/monitoring dashboard
--
-- Bawat topic ay naka-link na rin (via article_references) papunta
-- sa project kung saan ito aktwal na ginamit, may knowledge-graph
-- edges (article_relations) sa pagitan ng mga magkakaugnay na
-- topics, at 5 karagdagang sample errors (isa bawat project) na
-- naka-link din sa mga kaugnay na articles.
--
-- Idempotent: sina-cleanup muna ang lahat ng dating rows (batay sa
-- topic slugs / project slugs / error titles) bago mag-insert ulit.
--
-- Kailangan muna ng account (auth.users) bago ito i-run.
-- =============================================================

do $$
declare
  v_user_id  uuid;
  v_slug_ids jsonb := '{}'::jsonb;
  v_article_id uuid;
  v_proj_shoplokal_id uuid;
  v_proj_queuewise_id uuid;
  v_proj_supportgenie_id uuid;
  v_proj_voicedesk_id uuid;
  v_proj_pulseops_id uuid;
  v_proj_devpedia_id uuid;
  v_err_id uuid;
begin
  select id into v_user_id from auth.users order by created_at limit 1;

  if v_user_id is null then
    raise exception 'Walang laman ang auth.users — mag sign-up muna sa app bago i-run ang seed na ito.';
  end if;

  -- Kunin ang 'devpedia' project kung na-run na ang supabase/seed.sql.
  -- Kung hindi pa, mananatiling null ito — sina-skip na lang ang mga
  -- article_references na dapat sana naka-link dito (see WHERE clause
  -- sa ibaba), walang isasabak na null reference_id.
  select id into v_proj_devpedia_id from projects where user_id = v_user_id and slug = 'devpedia';

  -- =========================================================
  -- Cleanup (idempotency)
  -- =========================================================
  delete from articles where user_id = v_user_id and slug in ('html', 'css', 'javascript', 'dom', 'http', 'browser-fundamentals', 'json', 'forms', 'cookies-local-storage', 'react', 'components', 'props-state', 'hooks', 'forms-validation', 'api-calls', 'routing', 'authentication-ui', 'responsive-design', 'tailwind-css', 'nextjs', 'nodejs', 'rest-api', 'api-routes', 'middleware', 'authentication', 'authorization', 'validation', 'error-handling', 'file-uploads', 'webhooks', 'background-jobs', 'postgresql', 'tables', 'relationships', 'primary-foreign-keys', 'indexes', 'sql', 'transactions', 'views', 'db-functions', 'database-security', 'rls', 'supabase', 'frontend-api-database-flow', 'server-side-rendering', 'client-side-rendering', 'server-actions', 'api-architecture', 'authentication-flow', 'authorization-rbac', 'multi-tenant-architecture', 'realtime-systems', 'caching', 'git', 'github', 'environment-variables', 'docker', 'ci-cd', 'vercel', 'cloud-deployment', 'logs', 'monitoring', 'domains', 'dns', 'ssl', 'production-debugging', 'redis', 'queues', 'websockets', 'realtime', 'microservices', 'event-driven-architecture', 'rate-limiting', 'scalability', 'load-balancing', 'performance-optimization', 'security', 'openai-gemini-apis', 'ai-streaming', 'function-calling', 'rag', 'vector-databases', 'embeddings', 'ai-agents', 'voice-ai', 'deepgram', 'webrtc', 'ai-automation', 'n8n');
  delete from projects where user_id = v_user_id and slug in ('shoplokal', 'queuewise', 'supportgenie', 'voicedesk', 'pulseops');
  delete from errors where user_id = v_user_id and title in (
    'Hydration mismatch: Text content does not match server-rendered HTML',
    'Realtime channel not receiving postgres_changes events',
    'Gemini API: 429 Resource has been exhausted',
    'WebRTC: ICE connection stuck in ''checking'' state on mobile networks',
    'Redis ECONNREFUSED in production but works locally'
  );

  -- =========================================================
  -- Sample Real-World Projects
  -- =========================================================
  insert into projects (user_id, name, slug, description, stack, architecture_notes, status, started_at)
  values (
    v_user_id, 'ShopLokal', 'shoplokal',
    'Multi-vendor e-commerce marketplace para sa mga local sellers — product catalog, cart, checkout, at order tracking.',
    array['Next.js', 'Supabase', 'TypeScript', 'Tailwind', 'Vercel'],
    'Server Components para sa product listing/SEO, Server Actions para sa cart/checkout mutations, Supabase Postgres + RLS para sa multi-vendor data isolation, at Vercel para sa hosting.',
    'completed', current_date - interval '8 months'
  )
  returning id into v_proj_shoplokal_id;

  insert into projects (user_id, name, slug, description, stack, architecture_notes, status, started_at)
  values (
    v_user_id, 'QueueWise', 'queuewise',
    'Realtime na queueing/ticketing system para sa mga clinic at maliliit na negosyo — kumukuha ng number ang customer sa phone nila, nakikita nila real-time kung sino na ang tinatawag.',
    array['React', 'Node.js', 'PostgreSQL', 'Supabase Realtime', 'Docker', 'Tailwind'],
    'Multi-tenant architecture (bawat klinika/negosyo may sariling tenant_id + RLS policy), Supabase Realtime channels para sa live queue updates, at role-based access (staff vs customer).',
    'active', current_date - interval '5 months'
  )
  returning id into v_proj_queuewise_id;

  insert into projects (user_id, name, slug, description, stack, architecture_notes, status, started_at)
  values (
    v_user_id, 'SupportGenie', 'supportgenie',
    'AI-powered customer support chatbot na naka-embed sa website ng client — sinasagot ang FAQs gamit ang RAG laban sa aktwal na docs/policies ng negosyo, at kayang mag-escalate sa tao.',
    array['Next.js', 'Gemini API', 'pgvector', 'Supabase', 'n8n'],
    'RAG pipeline (embeddings + pgvector similarity search) para sa grounded na sagot, streaming responses papunta sa widget, at function calling para sa order status checks at human escalation.',
    'active', current_date - interval '3 months'
  )
  returning id into v_proj_supportgenie_id;

  insert into projects (user_id, name, slug, description, stack, architecture_notes, status, started_at)
  values (
    v_user_id, 'VoiceDesk', 'voicedesk',
    'Voice AI phone receptionist — sumasagot ng calls, kumukuha ng appointment details, at nag-fo-forward ng summary sa tamang staff member via n8n.',
    array['Deepgram', 'WebRTC', 'Gemini API', 'n8n', 'Node.js'],
    'Pipeline: WebRTC audio -> Deepgram STT -> Gemini para sa intent/response -> TTS -> audio output, na naka-orchestrate gamit ang n8n workflows para sa post-call actions.',
    'completed', current_date - interval '4 months'
  )
  returning id into v_proj_voicedesk_id;

  insert into projects (user_id, name, slug, description, stack, architecture_notes, status, started_at)
  values (
    v_user_id, 'PulseOps', 'pulseops',
    'Internal analytics at monitoring dashboard — nagko-collect ng metrics mula sa iba''t ibang microservices, may real-time alerting kapag lumagpas sa threshold.',
    array['Docker', 'Redis', 'PostgreSQL', 'Node.js', 'React'],
    'Microservices architecture (hiwalay na ingestion, aggregation, alert services), event-driven communication sa pagitan ng mga ito, Redis para sa caching at pub/sub, load-balanced deployment.',
    'completed', current_date - interval '6 months'
  )
  returning id into v_proj_pulseops_id;

  -- =========================================================
  -- Articles — lahat ng 89 roadmap topics, may full content na
  -- =========================================================

  -- HTML (level 1, type=encyclopedia)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'encyclopedia', 'HTML', 'html', 'Level 1 — Web Fundamentals',
    'The standard markup language used to structure content on web pages using elements and tags.',
    '# HTML

## What is HTML?

The standard markup language used to structure content on web pages using elements and tags.

## Why It Matters

Pundasyon ng lahat — kahit gaano ka-sopistikado ang framework, HTML pa rin ang final output na ipinapadala sa browser. Malaking tulong din ang semantic HTML sa accessibility at SEO.

## How It Works

Ginagawa ng browser ang isang DOM tree mula sa HTML tags, saka ito ipinapakita bilang visual na page (render tree -> layout -> paint).

## Example

```
<article>
  <h1>Order #1024</h1>
  <p>Status: Shipped</p>
</article>
```

## Related Concepts

→ Browser fundamentals
→ CSS
→ Cookies / Local Storage
→ DOM
→ Forms

## My Notes

Madalas kong nakakalimutan gumamit ng semantic tags (`<nav>`, `<main>`, `<article>`) kaysa puro `<div>` — malaki ang epekto nito sa Lighthouse accessibility score.

## Where I Used It

→ ShopLokal',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('html', v_article_id);

  -- CSS (level 1, type=encyclopedia)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'encyclopedia', 'CSS', 'css', 'Level 1 — Web Fundamentals',
    'The stylesheet language used to control the visual presentation of HTML — layout, color, spacing, and typography.',
    '# CSS

## What is CSS?

The stylesheet language used to control the visual presentation of HTML — layout, color, spacing, and typography.

## Why It Matters

Kahit gumagamit ako ng Tailwind ngayon, importante pa ring maintindihan ang raw CSS — flexbox, grid, specificity — para hindi ako nalilito kapag may weird styling bug.

## How It Works

Cascading: nagmumula ang final style sa combination ng browser default, external stylesheet, at inline styles, base sa specificity at order.

## Example

```
.card {
  display: flex;
  gap: 1rem;
  padding: 1rem;
}
```

## Related Concepts

→ Browser fundamentals
→ Cookies / Local Storage
→ DOM
→ Forms
→ HTML

## My Notes

Yung specificity wars (`!important` madness) ang pinaka-common na dahilan ng "bakit hindi gumagana yung style ko" — Tailwind actually tumulong dito kasi utility classes lang, konti ang specificity conflicts.

## Where I Used It

→ ShopLokal',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('css', v_article_id);

  -- JavaScript (level 1, type=encyclopedia)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'encyclopedia', 'JavaScript', 'javascript', 'Level 1 — Web Fundamentals',
    'The scripting language that adds interactivity and dynamic behavior to web pages, and also runs on servers via Node.js.',
    '# JavaScript

## What is JavaScript?

The scripting language that adds interactivity and dynamic behavior to web pages, and also runs on servers via Node.js.

## Why It Matters

Kahit anong framework gamitin ko (React, Next.js, n8n custom nodes), JavaScript/TypeScript pa rin ang core language — kailangan komportable dito bago pa man mag-aral ng framework.

## How It Works

Single-threaded pero may event loop — async operations (fetch, timers) ay hindi bumabara sa main thread, pumupunta sa callback/microtask queue.

## Example

```
const res = await fetch(''/api/orders'');
const orders = await res.json();
```

## Related Concepts

→ Browser fundamentals
→ CSS
→ Cookies / Local Storage
→ DOM
→ Forms

## My Notes

Yung async/await vs Promise chaining — mas madali basahin ang async/await pero kailangan pa ring maintindihan kung paano gumagana ang Promises sa ilalim, lalo na pag nag-de-debug ng race conditions.

## Where I Used It

→ ShopLokal
→ SupportGenie',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('javascript', v_article_id);

  -- DOM (level 1, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'DOM', 'dom', 'Level 1 — Web Fundamentals',
    'The Document Object Model — a tree-like, in-memory representation of an HTML page that JavaScript can read and manipulate.',
    '# DOM

## What is DOM?

The Document Object Model — a tree-like, in-memory representation of an HTML page that JavaScript can read and manipulate.

## Why It Matters

Ito ang jump-off point papunta sa pag-intindi kung paano gumagana ang React sa ilalim — bakit kailangan ng virtual DOM diffing, at bakit mahal ang direct DOM manipulation.

## How It Works

document.querySelector, addEventListener, at classList ang common APIs — pero sa mga modern frameworks, bihira ka na direktang gumagalaw dito.

## Example

```
document.querySelector(''#submit'').addEventListener(''click'', handleSubmit);
```

## Related Concepts

→ Browser fundamentals
→ CSS
→ Cookies / Local Storage
→ Forms
→ HTML

## My Notes

Noong wala pa akong alam sa React, jQuery-style DOM manipulation ang ginagawa ko — malaking upgrade yung pag-intindi kung bakit mas maganda ang declarative approach ng React.

## Where I Used It

→ ShopLokal',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('dom', v_article_id);

  -- HTTP/HTTPS (level 1, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'HTTP/HTTPS', 'http', 'Level 1 — Web Fundamentals',
    'The protocol used for communication between clients and servers on the web; HTTPS adds TLS encryption on top of it.',
    '# HTTP/HTTPS

## What is HTTP/HTTPS?

The protocol used for communication between clients and servers on the web; HTTPS adds TLS encryption on top of it.

## Why It Matters

Kahit anong framework o language, HTTP ang common ground — kailangan itong maintindihan para makapag-debug ng network issues.

## How It Works

Request: method + path + headers + body. Response: status code + headers + body. Naka-layer ang HTTPS sa ibabaw ng TCP gamit ang TLS handshake bago mag-request.

## Example

```
GET /api/orders HTTP/1.1
Host: shoplokal.ph
```

## Related Concepts

→ Browser fundamentals
→ CSS
→ Cookies / Local Storage
→ DOM
→ Forms

## My Notes

Status codes ang pinaka-underrated na part nito — 200 vs 201 vs 204 ay may specific na meaning, hindi lang "success".

## Where I Used It

→ ShopLokal
→ QueueWise',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('http', v_article_id);

  -- Browser fundamentals (level 1, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Browser fundamentals', 'browser-fundamentals', 'Level 1 — Web Fundamentals',
    'How browsers parse HTML/CSS/JS, build the render tree, and paint pixels to the screen — the runtime environment every frontend app lives in.',
    '# Browser fundamentals

## What is Browser fundamentals?

How browsers parse HTML/CSS/JS, build the render tree, and paint pixels to the screen — the runtime environment every frontend app lives in.

## Why It Matters

Pag naiintindihan mo ang critical rendering path, mas madali mag-optimize ng loading performance — alam mo kung saan mag-lazy load, kung saan mag-defer ng script.

## How It Works

Parse HTML -> DOM tree, parse CSS -> CSSOM, i-combine -> render tree -> layout (reflow) -> paint -> composite.

## Example

```
<link rel="preload" href="/hero.webp" as="image">
```

## Related Concepts

→ CSS
→ Cookies / Local Storage
→ DOM
→ Forms
→ HTML

## My Notes

Nagulat ako noon sa dami ng "layout thrashing" na nangyayari kapag paulit-ulit kang nagba-bagsak ng read/write sa layout properties sa loob ng loop.

## Where I Used It

→ ShopLokal',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('browser-fundamentals', v_article_id);

  -- JSON (level 1, type=encyclopedia)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'encyclopedia', 'JSON', 'json', 'Level 1 — Web Fundamentals',
    'A lightweight, text-based data format for representing structured data — the de facto format for exchanging data between clients and APIs.',
    '# JSON

## What is JSON?

A lightweight, text-based data format for representing structured data — the de facto format for exchanging data between clients and APIs.

## Why It Matters

Ito ang "lingua franca" ng data exchange — halos lahat ng API na ginamit ko (REST, webhooks, LLM responses) ay JSON ang format.

## How It Works

Key-value pairs, arrays, at nested objects — walang comments, walang trailing commas, strict ang syntax kumpara sa JS object literals.

## Example

```
{ "orderId": 1024, "status": "shipped", "items": ["mug", "shirt"] }
```

## Related Concepts

→ Browser fundamentals
→ CSS
→ Cookies / Local Storage
→ DOM
→ Forms

## My Notes

Common gotcha: JSON.parse ng malformed JSON (hal. galing sa LLM output na may extra text) — kailangan mag-strip muna ng markdown fences bago mag-parse.

## Where I Used It

→ ShopLokal
→ SupportGenie',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('json', v_article_id);

  -- Forms (level 1, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Forms', 'forms', 'Level 1 — Web Fundamentals',
    'HTML elements used to collect user input, and the browser mechanisms (submission, encoding, validation) around them.',
    '# Forms

## What is Forms?

HTML elements used to collect user input, and the browser mechanisms (submission, encoding, validation) around them.

## Why It Matters

Kahit sinong app na may user input, may form talaga — checkout page, login, contact — kaya kailangan maintindihan ang native behavior bago pa man mag-abstract gamit ang React state.

## How It Works

Bawat input may `name`, na siyang key sa submitted data; `<form>` may `action`/`method`, pero sa SPA/Next.js karaniwang pinipigilan ang default submit (`preventDefault`) at hawak na ng JS ang flow.

## Example

```
<input name="email" type="email" required />
```

## Related Concepts

→ Browser fundamentals
→ CSS
→ Cookies / Local Storage
→ DOM
→ HTML

## My Notes

Sa Next.js, sinusubukan ko na ngayon gumamit ng native `<form action={serverAction}>` sa halip na `preventDefault` + fetch — mas simple pag basic CRUD lang.

## Where I Used It

→ ShopLokal',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('forms', v_article_id);

  -- Cookies / Local Storage (level 1, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Cookies / Local Storage', 'cookies-local-storage', 'Level 1 — Web Fundamentals',
    'Two browser storage mechanisms for persisting small amounts of data on the client — cookies are sent with every HTTP request, local storage stays client-side only.',
    '# Cookies / Local Storage

## What is Cookies / Local Storage?

Two browser storage mechanisms for persisting small amounts of data on the client — cookies are sent with every HTTP request, local storage stays client-side only.

## Why It Matters

Malaking factor ito sa authentication design — kung saan mo ilalagay ang session token (cookie vs localStorage) ay may security implications (XSS vs CSRF exposure).

## How It Works

Cookies: automatic na naisasama sa bawat request papunta sa parehong domain, may expiry/flags (`HttpOnly`, `Secure`, `SameSite`). Local storage: manual access lang via JS, walang automatic transmission.

## Example

```
document.cookie = ''theme=dark; path=/; SameSite=Lax'';
```

## Related Concepts

→ Browser fundamentals
→ CSS
→ DOM
→ Forms
→ HTML

## My Notes

Common mistake: paglagay ng JWT sa localStorage kasi "mas madali" — pero mas vulnerable ito sa XSS kumpara sa httpOnly cookie.

## Where I Used It

→ ShopLokal',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('cookies-local-storage', v_article_id);

  -- React (level 2, type=technology)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'technology', 'React', 'react', 'Level 2 — Frontend Development',
    'A JavaScript library for building user interfaces out of reusable, composable components.',
    '# React

## What is React?

A JavaScript library for building user interfaces out of reusable, composable components.

## Why It Matters

Halos lahat ng client work ko ay gumagamit ng React (via Next.js) — mas mabilis mag-build ng consistent UI kapag component-based ang approach.

## How It Works

Declarative rendering gamit ang virtual DOM diffing — nagre-render lang ulit ang mga component na nagbago ang state/props, hindi buong page.

## Example

```
function OrderCard({ order }) {
  return <div>{order.status}</div>;
}
```

## Related Concepts

→ API calls
→ Authentication UI
→ Components
→ Forms & validation
→ Hooks

## My Notes

Yung mental shift papunta sa declarative ("ganito dapat ang UI base sa state") vs imperative ("gawin mo ito, tapos ito") ang pinaka-mahirap na part noong nag-aaral pa lang ako.

## Where I Used It

→ ShopLokal
→ QueueWise',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('react', v_article_id);

  -- Components (level 2, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Components', 'components', 'Level 2 — Frontend Development',
    'Self-contained, reusable pieces of UI that encapsulate their own markup, logic, and (optionally) state.',
    '# Components

## What is Components?

Self-contained, reusable pieces of UI that encapsulate their own markup, logic, and (optionally) state.

## Why It Matters

Malaking pagbabago sa maintainability kapag pinaghiwa-hiwalay mo ang UI sa maliliit na components — mas madaling i-test, i-reuse, at i-debug.

## How It Works

Composition over inheritance — binubuo ang malalaking pages sa pamamagitan ng pag-combine ng maliliit na components, hindi extension ng isang base class.

## Example

```
<OrderList orders={orders} onCancel={handleCancel} />
```

## Related Concepts

→ API calls
→ Authentication UI
→ Forms & validation
→ Hooks
→ Next.js

## My Notes

Rule of thumb ko: kapag umabot na sa 200+ lines ang isang component, oras na para hatiin — malaking sign din ''yan na masyadong maraming responsibilities.

## Where I Used It

→ ShopLokal',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('components', v_article_id);

  -- Props / State (level 2, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Props / State', 'props-state', 'Level 2 — Frontend Development',
    'Props pass data into a component from its parent (read-only); state is data a component owns and can change over time.',
    '# Props / State

## What is Props / State?

Props pass data into a component from its parent (read-only); state is data a component owns and can change over time.

## Why It Matters

Ito ang pinaka-basic na mental model na kailangan bago pa man maintindihan ang hooks, forms, o kahit anong interactivity sa React.

## How It Works

One-way data flow: state -> props pababa sa tree; para bumalik ang data pataas, kailangan mag-pass ng callback function bilang prop.

## Example

```
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

## Related Concepts

→ API calls
→ Authentication UI
→ Components
→ Forms & validation
→ Hooks

## My Notes

Common bug: pag-mutate ng state object/array directly (`state.push(x)`) sa halip na gumawa ng bagong reference — hindi mare-render ulit ang component.

## Where I Used It

→ ShopLokal',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('props-state', v_article_id);

  -- Hooks (level 2, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Hooks', 'hooks', 'Level 2 — Frontend Development',
    'Functions (like useState, useEffect) that let function components use state, side effects, and other React features without classes.',
    '# Hooks

## What is Hooks?

Functions (like useState, useEffect) that let function components use state, side effects, and other React features without classes.

## Why It Matters

Kailangan ito para sa halos lahat ng interactive na feature — mula sa simpleng form input hanggang sa data fetching at subscriptions.

## How It Works

`useState` para sa local state, `useEffect` para sa side effects (fetch, subscriptions, timers) na tumatakbo pagkatapos mag-render, `useMemo`/`useCallback` para sa optimization.

## Example

```
useEffect(() => {
  const id = setInterval(refreshQueue, 5000);
  return () => clearInterval(id);
}, []);
```

## Related Concepts

→ API calls
→ Authentication UI
→ Components
→ Forms & validation
→ Next.js

## My Notes

Yung dependency array ng `useEffect` ang laging pinagmumulan ng bugs — either infinite loop (missing dependency) o stale closures (extra/missing values).

## Where I Used It

→ QueueWise',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('hooks', v_article_id);

  -- Forms & validation (level 2, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Forms & validation', 'forms-validation', 'Level 2 — Frontend Development',
    'Handling user input in the UI layer — controlled inputs, client-side validation rules, and surfacing errors before hitting the backend.',
    '# Forms & validation

## What is Forms & validation?

Handling user input in the UI layer — controlled inputs, client-side validation rules, and surfacing errors before hitting the backend.

## Why It Matters

Mabilis na feedback sa user (bago pa man mag-hit sa server) ang malaking UX win nito — pero hindi ito pwedeng maging tanging validation, kailangan pa rin i-validate ulit sa server.

## How It Works

Controlled inputs: state ang "source of truth" ng value ng input, hindi ang DOM mismo — bawat keystroke ay nag-a-update ng state.

## Example

```
const [email, setEmail] = useState('''');
<input value={email} onChange={e => setEmail(e.target.value)} />
```

## Related Concepts

→ API calls
→ Authentication UI
→ Components
→ Hooks
→ Next.js

## My Notes

Naging mas simple ang buhay ko nung nag-switch ako sa `react-hook-form` + `zod` schema — parehong client at server validation, iisang schema lang.

## Where I Used It

→ ShopLokal',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('forms-validation', v_article_id);

  -- API calls (level 2, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'API calls', 'api-calls', 'Level 2 — Frontend Development',
    'How a frontend fetches or sends data to a backend — typically via fetch/axios, handling loading, error, and success states.',
    '# API calls

## What is API calls?

How a frontend fetches or sends data to a backend — typically via fetch/axios, handling loading, error, and success states.

## Why It Matters

Bawat non-trivial na app ay kailangang mag-fetch ng data — importante ang tamang paghawak ng loading/error states para hindi "nakatingin lang sa wala" ang user.

## How It Works

Tatlong states minimum ang kailangang i-handle: loading, error, at success — karaniwang gamit ang `useEffect` + `useState`, o library tulad ng SWR/React Query, o server components sa Next.js.

## Example

```
const { data, error, isLoading } = useSWR(''/api/orders'', fetcher);
```

## Related Concepts

→ Authentication UI
→ Components
→ Forms & validation
→ Hooks
→ Next.js

## My Notes

Sa Next.js App Router, mas gusto ko na ngayon mag-fetch sa Server Components kaysa client-side `useEffect` — mas mabilis at hindi na kailangan ng loading spinner sa unang load.

## Where I Used It

→ ShopLokal',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('api-calls', v_article_id);

  -- Routing (level 2, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Routing', 'routing', 'Level 2 — Frontend Development',
    'Mapping URLs to specific views/pages in a frontend app, either client-side (SPA router) or file-based (Next.js app router).',
    '# Routing

## What is Routing?

Mapping URLs to specific views/pages in a frontend app, either client-side (SPA router) or file-based (Next.js app router).

## Why It Matters

Bawat multi-page app ay nangangailangan ng routing — kung paano magbago ang URL nang hindi nag-fu-full page reload ang malaking selling point ng SPA routing.

## How It Works

File-based routing (Next.js): ang folder structure sa `app/` ay direktang nagiging URL structure — `app/orders/[id]/page.tsx` -> `/orders/123`.

## Example

```
// app/orders/[id]/page.tsx
export default function OrderPage({ params }) { ... }
```

## Related Concepts

→ API calls
→ Authentication UI
→ Components
→ Forms & validation
→ Hooks

## My Notes

Malaking productivity boost ang file-based routing kumpara sa manual na pag-configure ng React Router routes — walang "routes.js" na kailangang i-maintain nang hiwalay.

## Where I Used It

→ ShopLokal',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('routing', v_article_id);

  -- Authentication UI (level 2, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Authentication UI', 'authentication-ui', 'Level 2 — Frontend Development',
    'The user-facing flows (login, signup, session handling) that sit on top of a backend authentication system.',
    '# Authentication UI

## What is Authentication UI?

The user-facing flows (login, signup, session handling) that sit on top of a backend authentication system.

## Why It Matters

Kahit gaano ka-solid ang backend auth, kung magulo o mabagal ang UX ng login/signup, mataas ang drop-off rate ng users.

## How It Works

Karaniwang flow: form submit -> call sa auth backend (hal. Supabase Auth) -> i-store ang session (cookie) -> i-redirect papunta sa protected page.

## Example

```
const { error } = await supabase.auth.signInWithPassword({ email, password });
```

## Related Concepts

→ API calls
→ Components
→ Forms & validation
→ Hooks
→ Next.js

## My Notes

Yung tamang paghawak ng loading state habang naghihintay ng response ang login button — kung wala nito, common ang double-submit bugs.

## Where I Used It

→ ShopLokal
→ QueueWise',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('authentication-ui', v_article_id);

  -- Responsive design (level 2, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Responsive design', 'responsive-design', 'Level 2 — Frontend Development',
    'Designing UI that adapts cleanly across screen sizes, typically using flexible layouts, breakpoints, and relative units.',
    '# Responsive design

## What is Responsive design?

Designing UI that adapts cleanly across screen sizes, typically using flexible layouts, breakpoints, and relative units.

## Why It Matters

Mobile-first ang karamihan sa users ng mga client apps ko dito sa PH — kaya kailangan talagang gumana nang maayos ang UI sa maliit na screens bago pa man i-optimize para sa desktop.

## How It Works

Mobile-first approach: base styles para sa maliit na screens, tapos dagdagan ng media queries/breakpoints papunta sa mas malaking screens.

## Example

```
<div class="flex flex-col md:flex-row gap-4">...</div>
```

## Related Concepts

→ API calls
→ Authentication UI
→ Components
→ Forms & validation
→ Hooks

## My Notes

Common na nakakalimutan: pag-test sa tunay na mobile device, hindi lang sa dev tools resize — may mga touch target size issues na hindi lumalabas sa emulator.

## Where I Used It

→ ShopLokal
→ QueueWise',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('responsive-design', v_article_id);

  -- Tailwind CSS (level 2, type=technology)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'technology', 'Tailwind CSS', 'tailwind-css', 'Level 2 — Frontend Development',
    'A utility-first CSS framework where styling is done by composing small, single-purpose classes directly in markup.',
    '# Tailwind CSS

## What is Tailwind CSS?

A utility-first CSS framework where styling is done by composing small, single-purpose classes directly in markup.

## Why It Matters

Mas mabilis mag-prototype at mas konsistent ang design system kapag utility-first — walang naiiwang unused CSS classes, at halos wala nang "naming things is hard" problem.

## How It Works

Bawat utility class (`flex`, `p-4`, `text-sm`) ay isang specific CSS property — kino-compile lang ang mga class na aktwal na ginamit sa project (JIT/tree-shaking).

## Example

```
<button class="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">Save</button>
```

## Related Concepts

→ API calls
→ Authentication UI
→ Components
→ Forms & validation
→ Hooks

## My Notes

Noong una, ayaw ko dito kasi "magulo tignan" ang markup — pero mabilis akong na-convert nung nakita ko kung gaano kabilis mag-iterate kumpara sa paglipat-lipat sa CSS files.

## Where I Used It

→ ShopLokal
→ QueueWise',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('tailwind-css', v_article_id);

  -- Next.js (level 2, type=technology)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'technology', 'Next.js', 'nextjs', 'Level 2 — Frontend Development',
    'A React framework for building full-stack web applications with server-side rendering and routing built in.',
    '# Next.js

## What is Next.js?

A React framework for building full-stack web applications with server-side rendering and routing built in.

## Why It Matters

File-based routing at server actions ang pinaka-nagpapabilis ng development — hindi na kailangan ng hiwalay na backend para sa simpleng CRUD.

## How It Works

App Router: Server Components by default (walang JS bundle papunta sa client maliban kung `''use client''`), Server Actions para sa mutations nang walang manual API route.

## Example

```
''use server'';
export async function createOrder(formData) { ... }
```

## Related Concepts

→ API calls
→ Authentication UI
→ Components
→ Forms & validation
→ Hooks

## My Notes

Client vs Server Components confusion — madalas makalimutan kung saan pwede gumamit ng `useState`/`useEffect` (client lang).

## Where I Used It

→ ShopLokal
→ QueueWise
→ DevPedia',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('nextjs', v_article_id);

  -- Node.js (level 3, type=technology)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'technology', 'Node.js', 'nodejs', 'Level 3 — Backend Development',
    'A JavaScript runtime built on Chrome''s V8 engine that lets JavaScript run outside the browser, commonly used to build backend servers.',
    '# Node.js

## What is Node.js?

A JavaScript runtime built on Chrome''s V8 engine that lets JavaScript run outside the browser, commonly used to build backend servers.

## Why It Matters

Malaking convenience na parehong language (JS/TS) ang gamit sa frontend at backend — mas mabilis mag-share ng types/logic sa pagitan ng dalawa.

## How It Works

Single-threaded event loop na non-blocking — kaya bagay siya sa I/O-heavy workloads (API calls, DB queries) pero hindi sa CPU-heavy computation.

## Example

```
const server = http.createServer((req, res) => res.end(''ok''));
```

## Related Concepts

→ API routes
→ Authentication
→ Authorization
→ Background jobs
→ Error handling

## My Notes

Naguluhan ako noon sa dami ng CPU-bound tasks na sinusubukan kong ilagay sa parehong process — pag heavy computation talaga, dapat naka-hiwalay na worker/queue.

## Where I Used It

→ QueueWise
→ SupportGenie',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('nodejs', v_article_id);

  -- REST API (level 3, type=encyclopedia)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'encyclopedia', 'REST API', 'rest-api', 'Level 3 — Backend Development',
    'An architectural style for designing networked applications using stateless HTTP requests.',
    '# REST API

## What is REST API?

An architectural style for designing networked applications using stateless HTTP requests.

## Why It Matters

Almost every web app talks to a backend through some form of REST API. Understanding it well makes debugging, designing, and consuming APIs much faster.

## How It Works

Resources are nouns (`/orders`), and HTTP methods are verbs (`GET`, `POST`, `PATCH`, `DELETE`). Stateless — walang naka-store na session sa server sa pagitan ng requests.

## Example

```
const res = await fetch(''/api/orders/123'', { method: ''PATCH'', body: JSON.stringify({status: ''shipped''}) });
```

## Related Concepts

→ API routes
→ Authentication
→ Authorization
→ Background jobs
→ Error handling

## My Notes

Madaling makalimutan na "REST" ay style lang, hindi protocol — kaya walang "official" enforcement, konsensus lang sa team ang gumagana dito.

## Where I Used It

→ ShopLokal
→ QueueWise
→ DevPedia',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('rest-api', v_article_id);

  -- API routes (level 3, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'API routes', 'api-routes', 'Level 3 — Backend Development',
    'Server-side endpoints (e.g. Next.js Route Handlers, Express routes) that map an HTTP method + path to a handler function.',
    '# API routes

## What is API routes?

Server-side endpoints (e.g. Next.js Route Handlers, Express routes) that map an HTTP method + path to a handler function.

## Why It Matters

Ito ang aktwal na "entry point" kung saan tumatama ang mga request mula sa frontend o external systems (webhooks) papunta sa business logic.

## How It Works

Bawat route file/handler ay naka-map sa isang path pattern, at ang function sa loob nito ang bahalang mag-parse ng request, tumawag ng business logic, at magbalik ng response.

## Example

```
// app/api/orders/route.ts
export async function POST(req) { ... }
```

## Related Concepts

→ Authentication
→ Authorization
→ Background jobs
→ Error handling
→ File uploads

## My Notes

Sa Next.js, mas madalas ko na lang gamitin ang Server Actions kaysa Route Handlers para sa internal mutations — nire-reserve ko na lang ang Route Handlers para sa webhooks o external API consumers.

## Where I Used It

→ ShopLokal
→ SupportGenie',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('api-routes', v_article_id);

  -- Middleware (level 3, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Middleware', 'middleware', 'Level 3 — Backend Development',
    'Functions that run between a request and its final handler — used for things like auth checks, logging, or request transformation.',
    '# Middleware

## What is Middleware?

Functions that run between a request and its final handler — used for things like auth checks, logging, or request transformation.

## Why It Matters

Malaking tulong para hindi paulit-ulit isulat ang parehong logic (auth check, logging) sa bawat route — iisang lugar na lang.

## How It Works

Chain of functions: bawat middleware ay pwedeng i-modify ang request/response, o i-halt ang chain (hal. `return 401` kung walang valid session).

## Example

```
export function middleware(req) {
  if (!hasSession(req)) return NextResponse.redirect(''/login'');
}
```

## Related Concepts

→ API routes
→ Authentication
→ Authorization
→ Background jobs
→ Error handling

## My Notes

Common gotcha: pag-run ng heavy logic (DB query) sa middleware — tumatakbo ito sa bawat matching request, kaya dapat mabilis lang laging tumakbo.

## Where I Used It

→ ShopLokal
→ QueueWise',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('middleware', v_article_id);

  -- Authentication (level 3, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Authentication', 'authentication', 'Level 3 — Backend Development',
    'Verifying who a user is, typically via credentials, tokens, or sessions, before granting access to protected resources.',
    '# Authentication

## What is Authentication?

Verifying who a user is, typically via credentials, tokens, or sessions, before granting access to protected resources.

## Why It Matters

Foundation ito ng bawat multi-user system — walang authentication, walang paraan para malaman kung sino ang gumagawa ng request.

## How It Works

Karaniwang flow: mag-verify ng credentials (email/password, OAuth), mag-issue ng session/token, tapos i-validate ang token sa bawat susunod na protected request.

## Example

```
const { data: { user } } = await supabase.auth.getUser();
```

## Related Concepts

→ API routes
→ Authorization
→ Background jobs
→ Error handling
→ File uploads

## My Notes

Sa mga project ko, halos lagi ko na lang ginagamit ang Supabase Auth kaysa mag-roll ng sariling password hashing/session logic — mas maliit ang attack surface.

## Where I Used It

→ ShopLokal
→ QueueWise
→ SupportGenie',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('authentication', v_article_id);

  -- Authorization (level 3, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Authorization', 'authorization', 'Level 3 — Backend Development',
    'Determining what an already-authenticated user is allowed to do or access.',
    '# Authorization

## What is Authorization?

Determining what an already-authenticated user is allowed to do or access.

## Why It Matters

Common security bug ang paglito sa authentication ("sino ka") at authorization ("pwede mo bang gawin ''to") — pareho kailangan, magkaiba ang tamang pag-check.

## How It Works

Karaniwang gamit: role-based checks ("admin lang pwede mag-delete") o ownership checks ("pwede mo lang i-edit ang sarili mong data") — best enforced sa DB layer (RLS) at hindi lang sa UI.

## Example

```
if (order.user_id !== currentUser.id) throw new Error(''Forbidden'');
```

## Related Concepts

→ API routes
→ Authentication
→ Background jobs
→ Error handling
→ File uploads

## My Notes

Malaking red flag kapag "UI lang" ang naghihide ng button pero walang backend check — kahit tinago mo sa frontend, kaya pa ring i-call ng user ang API directly.

## Where I Used It

→ ShopLokal
→ QueueWise',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('authorization', v_article_id);

  -- Validation (level 3, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Validation', 'validation', 'Level 3 — Backend Development',
    'Checking that incoming data (from a form, API request, etc.) matches expected shape and constraints before it''s used or stored.',
    '# Validation

## What is Validation?

Checking that incoming data (from a form, API request, etc.) matches expected shape and constraints before it''s used or stored.

## Why It Matters

Kahit na-validate na sa frontend, kailangan pa ring i-validate ulit sa server — hindi mo pwedeng i-trust ang kahit anong galing sa client.

## How It Works

Schema-based validation (hal. Zod) ang pinaka-maintainable — isang schema definition, magagamit sa client at server, may automatic type inference pa sa TypeScript.

## Example

```
const OrderSchema = z.object({ items: z.array(z.string()).min(1) });
const parsed = OrderSchema.parse(input);
```

## Related Concepts

→ API routes
→ Authentication
→ Authorization
→ Background jobs
→ Error handling

## My Notes

Bago ko na-discover ang Zod, manual if-checks lang ang ginagamit ko — mabilis nagiging magulo pag maraming fields, at madaling makalimutan ang isang edge case.

## Where I Used It

→ ShopLokal
→ SupportGenie',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('validation', v_article_id);

  -- Error handling (level 3, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Error handling', 'error-handling', 'Level 3 — Backend Development',
    'Catching, logging, and gracefully responding to failures — both expected (validation errors) and unexpected (crashes, timeouts).',
    '# Error handling

## What is Error handling?

Catching, logging, and gracefully responding to failures — both expected (validation errors) and unexpected (crashes, timeouts).

## Why It Matters

Ang pagkakaiba ng "production-ready" app sa "gumagana sa demo lang" ay kung paano ito humahawak ng mga unexpected failures nang hindi nagpa-crash ng buong system.

## How It Works

Distinguish expected errors (validation, not-found — i-handle gracefully, ipakita sa user) vs unexpected errors (bugs, network failures — i-log, ipakita ng generic message, huwag i-expose ang stack trace).

## Example

```
try {
  await createOrder(data);
} catch (e) {
  logger.error(e);
  return { error: ''Something went wrong.'' };
}
```

## Related Concepts

→ API routes
→ Authentication
→ Authorization
→ Background jobs
→ File uploads

## My Notes

Malaking pagkakamali noon: pareho kong tinatrato lahat ng errors bilang "generic 500" — hindi ako naka-move fast pag nag-de-debug kasi walang context sa logs.

## Where I Used It

→ ShopLokal
→ QueueWise
→ SupportGenie',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('error-handling', v_article_id);

  -- File uploads (level 3, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'File uploads', 'file-uploads', 'Level 3 — Backend Development',
    'Accepting binary/file data from a client, typically via multipart form data, and storing it (disk, S3, Supabase Storage, etc.).',
    '# File uploads

## What is File uploads?

Accepting binary/file data from a client, typically via multipart form data, and storing it (disk, S3, Supabase Storage, etc.).

## Why It Matters

Karaniwang feature ito sa halos lahat ng client apps — profile photos, product images, attachments — kaya kailangan maintindihan kahit paulit-ulit lang gamitin.

## How It Works

Client uploads via multipart form data o direct-to-storage (presigned URL); server/storage ang nag-hahawak ng aktwal na binary, DB naman ang naka-store lang ng reference/path.

## Example

```
const { data } = await supabase.storage.from(''products'').upload(path, file);
```

## Related Concepts

→ API routes
→ Authentication
→ Authorization
→ Background jobs
→ Error handling

## My Notes

Iwasan ang pag-store ng raw binary sa database column — laging sa dedicated storage (Supabase Storage, S3) ito ilalagay, path/URL na lang ang naka-save sa DB row.

## Where I Used It

→ ShopLokal',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('file-uploads', v_article_id);

  -- Webhooks (level 3, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Webhooks', 'webhooks', 'Level 3 — Backend Development',
    'HTTP callbacks that let one system notify another in real time when an event happens, instead of the receiver having to poll.',
    '# Webhooks

## What is Webhooks?

HTTP callbacks that let one system notify another in real time when an event happens, instead of the receiver having to poll.

## Why It Matters

Malaking part ito ng pag-integrate sa third-party services (payment gateways, n8n workflows) — imbes na paulit-ulit mag-poll, sila na ang tatawag sa''yo pag may nangyari.

## How It Works

Ang external service ang nagpapadala ng HTTP POST request papunta sa isang endpoint mo, kasama ang payload tungkol sa event — kailangan mag-verify ng signature para sigurado na tunay ang pinanggalingan.

## Example

```
app.post(''/webhooks/payment'', (req, res) => {
  verifySignature(req);
  handlePaymentEvent(req.body);
});
```

## Related Concepts

→ API routes
→ Authentication
→ Authorization
→ Background jobs
→ Error handling

## My Notes

Common gotcha: hindi idempotent na webhook handler — pwedeng maulit-ulit maipadala ng provider ang parehong event, kaya kailangang i-check muna kung na-process na.

## Where I Used It

→ ShopLokal
→ SupportGenie',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('webhooks', v_article_id);

  -- Background jobs (level 3, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Background jobs', 'background-jobs', 'Level 3 — Backend Development',
    'Work that runs outside the request/response cycle — queued tasks, scheduled jobs, or long-running processes that shouldn''t block a user''s request.',
    '# Background jobs

## What is Background jobs?

Work that runs outside the request/response cycle — queued tasks, scheduled jobs, or long-running processes that shouldn''t block a user''s request.

## Why It Matters

Kailangan ito para sa mabibigat/matagal na tasks (email sending, report generation, AI processing) para hindi maghintay ang user habang tumatakbo ang buong operation.

## How It Works

Push task papunta sa queue (o schedule via cron), tapos may separate worker process ang bahalang mag-consume at mag-process nito, hiwalay sa web request/response cycle.

## Example

```
await queue.add(''send-receipt-email'', { orderId });
```

## Related Concepts

→ API routes
→ Authentication
→ Authorization
→ Error handling
→ File uploads

## My Notes

Sa mas simpleng projects, sapat na ang n8n para sa background/scheduled workflows — hindi na kailangan mag-set up ng dedicated job queue system agad.

## Where I Used It

→ SupportGenie
→ VoiceDesk',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('background-jobs', v_article_id);

  -- PostgreSQL (level 4, type=technology)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'technology', 'PostgreSQL', 'postgresql', 'Level 4 — Database',
    'An open-source, relational database known for strong SQL standard compliance, extensibility (e.g. pgvector), and reliability.',
    '# PostgreSQL

## What is PostgreSQL?

An open-source, relational database known for strong SQL standard compliance, extensibility (e.g. pgvector), and reliability.

## Why It Matters

Ito ang default na database choice ko ngayon sa halos lahat ng project — solid ang relational modeling, at extensible pa (pgvector para sa AI features).

## How It Works

ACID-compliant relational database — tables na may typed columns, relationships via foreign keys, at support sa complex queries/joins/transactions.

## Example

```
select o.id, o.status, c.name from orders o join customers c on c.id = o.customer_id;
```

## Related Concepts

→ Database security
→ Functions
→ Indexes
→ Primary/Foreign Keys
→ RLS

## My Notes

Yung extensibility ang pumasok sa akin — nung kailangan ko ng vector search para sa RAG feature, `pgvector` extension na lang, hindi na kailangan mag-set up ng hiwalay na vector DB.

## Where I Used It

→ ShopLokal
→ QueueWise
→ SupportGenie',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('postgresql', v_article_id);

  -- Tables (level 4, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Tables', 'tables', 'Level 4 — Database',
    'The core structure in a relational database — rows and typed columns that store a single kind of entity.',
    '# Tables

## What is Tables?

The core structure in a relational database — rows and typed columns that store a single kind of entity.

## Why It Matters

Bago pa man mag-isip ng complex queries, kailangang matino ang table design — malaking epekto ito sa maintainability at performance ng buong app.

## How It Works

Bawat table ay dapat kumakatawan sa isang klarong entity (users, orders, products) — typed columns na may constraints (not null, unique, check) para masigurong valid ang data.

## Example

```
create table orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default ''pending''
);
```

## Related Concepts

→ Database security
→ Functions
→ Indexes
→ PostgreSQL
→ Primary/Foreign Keys

## My Notes

Naging mas madali ang buhay ko nung sinanay kong isipin muna ang schema bago pa man magsulat ng UI code — mas kaunting migrations sa gitna ng project.

## Where I Used It

→ ShopLokal
→ QueueWise',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('tables', v_article_id);

  -- Relationships (level 4, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Relationships', 'relationships', 'Level 4 — Database',
    'How rows in different tables connect to each other — one-to-many, many-to-many, one-to-one — usually via foreign keys.',
    '# Relationships

## What is Relationships?

How rows in different tables connect to each other — one-to-many, many-to-many, one-to-one — usually via foreign keys.

## Why It Matters

Kailangan maintindihan ito para hindi ma-duplicate ang data (denormalization gone wrong) at para tama ang pagka-model ng totoong domain (isang customer, maraming orders).

## How It Works

One-to-many: FK sa "many" side (order.customer_id). Many-to-many: kailangan ng junction table (order_items). One-to-one: FK na may unique constraint.

## Example

```
create table order_items (
  order_id uuid references orders(id),
  product_id uuid references products(id)
);
```

## Related Concepts

→ Database security
→ Functions
→ Indexes
→ PostgreSQL
→ Primary/Foreign Keys

## My Notes

Common mistake noong nag-uumpisa pa lang: gumagawa ako ng maraming duplicate columns sa halip na mag-normalize gamit ang proper relationships.

## Where I Used It

→ ShopLokal
→ QueueWise',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('relationships', v_article_id);

  -- Primary/Foreign Keys (level 4, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Primary/Foreign Keys', 'primary-foreign-keys', 'Level 4 — Database',
    'A primary key uniquely identifies a row; a foreign key references a primary key in another table to enforce a relationship.',
    '# Primary/Foreign Keys

## What is Primary/Foreign Keys?

A primary key uniquely identifies a row; a foreign key references a primary key in another table to enforce a relationship.

## Why It Matters

Ito ang nag-e-enforce ng data integrity sa DB level — imposibleng magkaroon ng "orphan" na order na naka-link sa customer na hindi naman umiiral.

## How It Works

`uuid` na may `default gen_random_uuid()` ang karaniwang gamit kong primary key type; `on delete cascade`/`restrict` ang nagde-define kung ano ang mangyayari sa child rows pag na-delete ang parent.

## Example

```
customer_id uuid references customers(id) on delete cascade
```

## Related Concepts

→ Database security
→ Functions
→ Indexes
→ PostgreSQL
→ RLS

## My Notes

Malaking desisyon kung `cascade` o `restrict` — sa mga cases na parang "soft delete" ang gusto, mas maganda gumamit ng `deleted_at` column kaysa aktwal na i-delete ang row.

## Where I Used It

→ ShopLokal
→ QueueWise',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('primary-foreign-keys', v_article_id);

  -- Indexes (level 4, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Indexes', 'indexes', 'Level 4 — Database',
    'Data structures that speed up lookups on specific columns, at the cost of extra storage and slightly slower writes.',
    '# Indexes

## What is Indexes?

Data structures that speed up lookups on specific columns, at the cost of extra storage and slightly slower writes.

## Why It Matters

Nakaramdaman na ako ng aktwal na performance win nito — isang `create index` lang, biglang bumilis ng ilang segundo papunta sa milliseconds ang isang slow query.

## How It Works

B-tree index ang default — mabilis para sa equality/range queries. GIN index naman ang gamit para sa array columns o full-text search.

## Example

```
create index idx_orders_status on orders(status);
```

## Related Concepts

→ Database security
→ Functions
→ PostgreSQL
→ Primary/Foreign Keys
→ RLS

## My Notes

Common mistake: pag-iindex ng bawat column "para safe" — may cost din sa bawat write operation ang extra index, kaya dapat batay sa aktwal na query patterns.

## Where I Used It

→ ShopLokal
→ QueueWise',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('indexes', v_article_id);

  -- SQL (level 4, type=encyclopedia)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'encyclopedia', 'SQL', 'sql', 'Level 4 — Database',
    'The standard language for querying and manipulating relational databases — select, insert, update, delete, and schema definitions.',
    '# SQL

## What is SQL?

The standard language for querying and manipulating relational databases — select, insert, update, delete, and schema definitions.

## Why It Matters

Kahit gaano ka-abstract ang ORM/query builder, kailangan pa ring maintindihan ang raw SQL para sa complex queries at para sa aktwal na pag-debug kung ano talaga ang tumatakbo sa DB.

## How It Works

DDL (create/alter table) para sa schema, DML (select/insert/update/delete) para sa data — declarative: sinasabi mo kung ANO ang gusto mo, hindi kung PAANO kunin.

## Example

```
select status, count(*) from orders group by status order by count(*) desc;
```

## Related Concepts

→ Database security
→ Functions
→ Indexes
→ PostgreSQL
→ Primary/Foreign Keys

## My Notes

Napakalaking upgrade ang pag-alam ng `explain analyze` — dun ko lang nalaman kung bakit mabagal talaga ang isang query, hindi lang basta "tumatagal."

## Where I Used It

→ ShopLokal
→ QueueWise',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('sql', v_article_id);

  -- Transactions (level 4, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Transactions', 'transactions', 'Level 4 — Database',
    'A group of database operations that either all succeed together or all fail together, preserving data consistency.',
    '# Transactions

## What is Transactions?

A group of database operations that either all succeed together or all fail together, preserving data consistency.

## Why It Matters

Kritikal ito sa mga multi-step operations (hal. bawasan ang stock at gumawa ng order record) — hindi puwedeng "kalahati lang natupad" pag may error sa gitna.

## How It Works

`begin` -> mga statements -> `commit` (kung lahat successful) o `rollback` (kung may error) — lahat o wala, walang partial state.

## Example

```
begin;
update products set stock = stock - 1 where id = $1;
insert into orders (product_id) values ($1);
commit;
```

## Related Concepts

→ Database security
→ Functions
→ Indexes
→ PostgreSQL
→ Primary/Foreign Keys

## My Notes

Nagkaroon ako ng inconsistent data noon dahil hiwalay-hiwalay na queries (walang transaction) ang ginamit ko para sa multi-step operation — minsan may nag-fail sa gitna.

## Where I Used It

→ ShopLokal',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('transactions', v_article_id);

  -- Views (level 4, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Views', 'views', 'Level 4 — Database',
    'Saved, named SQL queries that behave like virtual tables — useful for reusing complex queries or restricting exposed columns.',
    '# Views

## What is Views?

Saved, named SQL queries that behave like virtual tables — useful for reusing complex queries or restricting exposed columns.

## Why It Matters

Malaking tulong pag paulit-ulit ginagamit ang parehong complex join/aggregation — iisang lugar na lang ang pinapanatili, hindi kailangang kopyahin sa bawat query.

## How It Works

Ang view ay hindi nag-i-store ng aktwal na data — kino-compute lang ito on-the-fly tuwing kino-query, base sa underlying tables.

## Example

```
create view order_summary as
select o.id, o.status, c.name from orders o join customers c on c.id = o.customer_id;
```

## Related Concepts

→ Database security
→ Functions
→ Indexes
→ PostgreSQL
→ Primary/Foreign Keys

## My Notes

Ginagamit ko rin ito paminsan para "i-simplify" ang pina-expose sa reporting dashboard — hindi na kailangang malaman ng frontend ang buong complexity ng joins.

## Where I Used It

→ QueueWise',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('views', v_article_id);

  -- Functions (level 4, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Functions', 'db-functions', 'Level 4 — Database',
    'Reusable, named blocks of SQL/PLpgSQL logic stored in the database — used for things like computed values, triggers, or RPC-style calls.',
    '# Functions

## What is Functions?

Reusable, named blocks of SQL/PLpgSQL logic stored in the database — used for things like computed values, triggers, or RPC-style calls.

## Why It Matters

Malaking tulong ito para sa logic na kailangang laging tumakbo consistently sa DB level, kahit anong client ang gumagamit (app, admin panel, script).

## How It Works

Naka-store sa loob mismo ng database ang logic, pwedeng tawagin via RPC call mula sa client, o i-trigger automatically kapag may certain events (insert/update).

## Example

```
create function fn_order_total(order_id uuid) returns numeric as $$
  select sum(price * qty) from order_items where order_items.order_id = $1;
$$ language sql;
```

## Related Concepts

→ Database security
→ Indexes
→ PostgreSQL
→ Primary/Foreign Keys
→ RLS

## My Notes

Ginamit ko ito para sa `article_versions` auto-snapshot sa DevPedia — trigger function na kumukuha ng snapshot bago mag-overwrite ng title/content.

## Where I Used It

→ DevPedia',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('db-functions', v_article_id);

  -- Database security (level 4, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Database security', 'database-security', 'Level 4 — Database',
    'Practices for protecting data at the database layer — least-privilege roles, encrypted connections, RLS, and careful credential handling.',
    '# Database security

## What is Database security?

Practices for protecting data at the database layer — least-privilege roles, encrypted connections, RLS, and careful credential handling.

## Why It Matters

Kahit gaano ka-solid ang application-level auth, kung open ang database sa kahit sino, wala rin — dapat naka-defense-in-depth sa maraming layers.

## How It Works

Least privilege roles (huwag gamitin ang superuser sa app), encrypted connections (`sslmode=require`), Row Level Security, at pag-iwas mag-hardcode ng credentials sa code.

## Example

```
-- huwag: connection string na may plain password sa repo
-- oo: env vars, secrets manager
```

## Related Concepts

→ Functions
→ Indexes
→ PostgreSQL
→ Primary/Foreign Keys
→ RLS

## My Notes

Malaking aral: kahit "personal tool lang" ang app, dapat may RLS pa rin kasi puwede mo pang i-deploy publicly balang araw — mas madali i-set up agad kaysa i-retrofit.

## Where I Used It

→ ShopLokal
→ QueueWise
→ DevPedia',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('database-security', v_article_id);

  -- RLS (level 4, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'RLS', 'rls', 'Level 4 — Database',
    'Row Level Security — a PostgreSQL feature that restricts which rows a query can see or modify based on policies tied to the current user.',
    '# RLS

## What is RLS?

Row Level Security — a PostgreSQL feature that restricts which rows a query can see or modify based on policies tied to the current user.

## Why It Matters

Ito ang last line of defense laban sa data leaks sa multi-tenant o multi-user apps — kahit may bug sa application code, hindi pa rin makikita ng user ang data ng iba.

## How It Works

Naka-attach ang policy sa bawat table, may `using` clause (para sa read/existing rows) at `with check` clause (para sa insert/update) — automatic itong nag-a-apply sa bawat query, kahit walang explicit `where` sa app code.

## Example

```
create policy "owner_only" on orders
  for all using (auth.uid() = user_id);
```

## Related Concepts

→ Database security
→ Functions
→ Indexes
→ PostgreSQL
→ Primary/Foreign Keys

## My Notes

Nung una, akala ko "extra step" lang ito — pero nung nagkaroon ako ng bug sa application-layer authorization check, RLS pa rin ang nag-save sa akin.

## Where I Used It

→ ShopLokal
→ QueueWise
→ DevPedia',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('rls', v_article_id);

  -- Supabase (level 4, type=technology)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'technology', 'Supabase', 'supabase', 'Level 4 — Database',
    'A backend-as-a-service built on PostgreSQL, bundling auth, storage, realtime, edge functions, and a REST/RPC API on top of the database.',
    '# Supabase

## What is Supabase?

A backend-as-a-service built on PostgreSQL, bundling auth, storage, realtime, edge functions, and a REST/RPC API on top of the database.

## Why It Matters

Malaking bilis sa development ang na-gain ko dito — hindi na kailangang mag-set up ng hiwalay na auth service, storage, at API layer, isang platform na lang.

## How It Works

Direktang PostgreSQL sa ilalim (walang "black box"), auto-generated REST/RPC API base sa schema mo, at may client SDKs na respect sa RLS policies mo.

## Example

```
const { data } = await supabase.from(''orders'').select(''*'').eq(''status'', ''pending'');
```

## Related Concepts

→ Database security
→ Functions
→ Indexes
→ PostgreSQL
→ Primary/Foreign Keys

## My Notes

Malaking factor sa pagpili ko dito: hindi ako "naka-lock in" sa isang proprietary API — totoong PostgreSQL ang nasa ilalim, kaya pwede pa rin akong gumamit ng raw SQL/migrations anytime.

## Where I Used It

→ ShopLokal
→ QueueWise
→ SupportGenie
→ DevPedia',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('supabase', v_article_id);

  -- Frontend ↔ API ↔ Database (level 5, type=architecture)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'architecture', 'Frontend ↔ API ↔ Database', 'frontend-api-database-flow', 'Level 5 — Full-Stack Architecture',
    'The end-to-end request flow of a typical full-stack app — UI triggers a request, an API layer applies logic, and the database persists or returns data.',
    '# Frontend ↔ API ↔ Database

## What is Frontend ↔ API ↔ Database?

The end-to-end request flow of a typical full-stack app — UI triggers a request, an API layer applies logic, and the database persists or returns data.

## Why It Matters

Ito ang mental model na ginagamit ko sa bawat feature na ginagawa ko — malinaw kung saang layer dapat ilagay ang anong klaseng logic.

## How It Works

UI (event) -> Server Action/API route (validation + business logic) -> DB query (persistence) -> response pabalik sa UI (revalidate/update state).

## Example

```
Client -> Server Action -> Supabase query -> revalidatePath(''/orders'')
```

## Related Concepts

→ API architecture
→ Authentication flow
→ Authorization/RBAC
→ Caching
→ Client-side rendering

## My Notes

Common anti-pattern: pag-put ng business logic sa loob ng React component mismo — mahirap i-test at mahirap i-reuse kapag ganito.

## Where I Used It

→ ShopLokal
→ QueueWise
→ DevPedia',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('frontend-api-database-flow', v_article_id);

  -- Server-side rendering (level 5, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Server-side rendering', 'server-side-rendering', 'Level 5 — Full-Stack Architecture',
    'Generating HTML for a page on the server per-request, so the browser receives already-rendered content instead of an empty shell.',
    '# Server-side rendering

## What is Server-side rendering?

Generating HTML for a page on the server per-request, so the browser receives already-rendered content instead of an empty shell.

## Why It Matters

Malaking effect ito sa perceived performance at SEO — nakikita agad ng user ang content, hindi naghihintay ng JS bundle bago lumabas ang kahit ano.

## How It Works

Kino-compute ng server ang buong HTML output bago pa man ipadala sa browser — pwedeng i-hydrate pa ng client-side JS pagkatapos para maging interactive.

## Example

```
// Server Component (Next.js) — walang JS papunta sa client
export default async function Page() {
  const data = await getOrders();
  return <OrderList orders={data} />;
}
```

## Related Concepts

→ API architecture
→ Authentication flow
→ Authorization/RBAC
→ Caching
→ Client-side rendering

## My Notes

Sa Next.js App Router, default na SSR/Server Components ang gamit ko ngayon, `''use client''` na lang kapag talagang kailangan ng interactivity — mas maliit ang JS bundle papunta sa user.

## Where I Used It

→ ShopLokal
→ DevPedia',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('server-side-rendering', v_article_id);

  -- Client-side rendering (level 5, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Client-side rendering', 'client-side-rendering', 'Level 5 — Full-Stack Architecture',
    'Sending a mostly-empty HTML shell and letting JavaScript in the browser build the UI after load.',
    '# Client-side rendering

## What is Client-side rendering?

Sending a mostly-empty HTML shell and letting JavaScript in the browser build the UI after load.

## Why It Matters

Bagay ito sa mga highly-interactive na dashboards o internal tools kung saan mas mahalaga ang smooth interactivity kaysa initial load speed/SEO.

## How It Works

Papadalhan lang ng browser ng basic HTML shell + JS bundle, tapos ang JS ang bahalang mag-render ng buong UI at mag-fetch ng data client-side.

## Example

```
''use client'';
function Dashboard() {
  const { data } = useSWR(''/api/stats'', fetcher);
  return <Chart data={data} />;
}
```

## Related Concepts

→ API architecture
→ Authentication flow
→ Authorization/RBAC
→ Caching
→ Frontend ↔ API ↔ Database

## My Notes

Gamit ko ito para sa internal admin dashboards kung saan SEO ay hindi issue, pero mabilis na interactivity (real-time filters, sorting) ang priority.

## Where I Used It

→ QueueWise',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('client-side-rendering', v_article_id);

  -- Server actions (level 5, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Server actions', 'server-actions', 'Level 5 — Full-Stack Architecture',
    'Next.js functions that run only on the server but can be called directly from client components, without manually wiring an API route.',
    '# Server actions

## What is Server actions?

Next.js functions that run only on the server but can be called directly from client components, without manually wiring an API route.

## Why It Matters

Malaking simplification ito sa dev workflow — hindi na kailangang gumawa ng hiwalay na API route + fetch call para sa simpleng mutations.

## How It Works

Function na may `''use server''` directive — pwedeng i-call directly mula sa client component na parang normal na async function, pero server-side talaga ito tumatakbo.

## Example

```
''use server'';
export async function updateOrderStatus(id, status) {
  await supabase.from(''orders'').update({ status }).eq(''id'', id);
  revalidatePath(''/orders'');
}
```

## Related Concepts

→ API architecture
→ Authentication flow
→ Authorization/RBAC
→ Caching
→ Client-side rendering

## My Notes

Naging default ko na ito para sa lahat ng internal mutations — nire-reserve ko na lang ang traditional API routes para sa webhooks o external consumers.

## Where I Used It

→ ShopLokal
→ DevPedia',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('server-actions', v_article_id);

  -- API architecture (level 5, type=architecture)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'architecture', 'API architecture', 'api-architecture', 'Level 5 — Full-Stack Architecture',
    'The overall shape of how an app''s API is organized — REST vs RPC vs GraphQL, versioning, and how routes map to business logic layers.',
    '# API architecture

## What is API architecture?

The overall shape of how an app''s API is organized — REST vs RPC vs GraphQL, versioning, and how routes map to business logic layers.

## Why It Matters

Malaking desisyon ito na maaapektuhan ang buong project — mahirap i-refactor kapag nagbago na ang shape mo pagkatapos magkaroon ng maraming consumers.

## How It Works

REST: resource-oriented (`/orders/:id`). RPC: action-oriented (`/rpc/cancelOrder`). GraphQL: single endpoint, client-defined queries — bawat isa may trade-offs sa flexibility vs simplicity.

## Example

```
-- REST
PATCH /api/orders/123 { status: ''cancelled'' }
-- RPC-style Server Action
await cancelOrder(123)
```

## Related Concepts

→ Authentication flow
→ Authorization/RBAC
→ Caching
→ Client-side rendering
→ Frontend ↔ API ↔ Database

## My Notes

Sa mga personal/small team na projects, mas gusto ko na Server Actions (RPC-ish) kaysa buong REST layer — mas mabilis mag-develop kapag isang team lang ang consumer.

## Where I Used It

→ ShopLokal
→ QueueWise',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('api-architecture', v_article_id);

  -- Authentication flow (level 5, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Authentication flow', 'authentication-flow', 'Level 5 — Full-Stack Architecture',
    'The end-to-end sequence of steps — login, token/session issuance, refresh, and validation on each request — that makes authentication actually work.',
    '# Authentication flow

## What is Authentication flow?

The end-to-end sequence of steps — login, token/session issuance, refresh, and validation on each request — that makes authentication actually work.

## Why It Matters

Kailangan intindihin ang buong flow (hindi lang "tumatawag ako ng login function") para makapag-debug ng session issues, expired tokens, at redirect loops.

## How It Works

Login -> issue access/refresh tokens -> i-store bilang httpOnly cookie -> validate sa middleware bawat request -> auto-refresh gamit ang refresh token bago mag-expire.

## Example

```
// middleware.ts
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.redirect(''/login'');
```

## Related Concepts

→ API architecture
→ Authorization/RBAC
→ Caching
→ Client-side rendering
→ Frontend ↔ API ↔ Database

## My Notes

Yung refresh token rotation ang pinaka-nagpapalito sa akin noon — bakit paminsan "na-logout" bigla ang user kahit hindi pa dapat mag-expire.

## Where I Used It

→ ShopLokal
→ QueueWise',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('authentication-flow', v_article_id);

  -- Authorization/RBAC (level 5, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Authorization/RBAC', 'authorization-rbac', 'Level 5 — Full-Stack Architecture',
    'Role-Based Access Control — assigning permissions to roles (not individual users) and checking a user''s role before allowing an action.',
    '# Authorization/RBAC

## What is Authorization/RBAC?

Role-Based Access Control — assigning permissions to roles (not individual users) and checking a user''s role before allowing an action.

## Why It Matters

Mas maintainable ito kumpara sa per-user permissions — kapag maraming users na may parehong access level, iisang role definition na lang ang binabago.

## How It Works

Bawat user may naka-assign na role (admin, staff, customer); bawat action/resource may required role — i-check ang role bago payagan ang action, best enforced via RLS policy o middleware.

## Example

```
create policy "staff_can_update_orders" on orders
  for update using (auth.jwt() ->> ''role'' = ''staff'');
```

## Related Concepts

→ API architecture
→ Authentication flow
→ Caching
→ Client-side rendering
→ Frontend ↔ API ↔ Database

## My Notes

Sa QueueWise, ginamit ko ito para paghiwalayin ang "staff" (pwedeng i-update ang queue) sa "customer" (view-only ng sariling number) — RLS policy base sa role claim sa JWT.

## Where I Used It

→ QueueWise',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('authorization-rbac', v_article_id);

  -- Multi-tenant architecture (level 5, type=architecture)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'architecture', 'Multi-tenant architecture', 'multi-tenant-architecture', 'Level 5 — Full-Stack Architecture',
    'A system design where a single application instance serves multiple independent customers (tenants), with their data kept isolated.',
    '# Multi-tenant architecture

## What is Multi-tenant architecture?

A system design where a single application instance serves multiple independent customers (tenants), with their data kept isolated.

## Why It Matters

Kailangan itong isipin nang maaga kapag SaaS ang direksyon ng project — mahirap i-retrofit ang tenant isolation kapag late na sa development.

## How It Works

Karaniwang pattern: `tenant_id` column sa bawat table, RLS policy na nagre-restrict base rito, at consistent na pag-scope ng bawat query sa current tenant.

## Example

```
create policy "tenant_isolation" on orders
  for all using (tenant_id = current_setting(''app.tenant_id'')::uuid);
```

## Related Concepts

→ API architecture
→ Authentication flow
→ Authorization/RBAC
→ Caching
→ Client-side rendering

## My Notes

Sa QueueWise, isinaayos ko itong multi-tenant mula sa umpisa (bawat business/klinika ay may sariling `tenant_id`) — mas magulo sana kung idinagdag ko pa lang matapos ang unang launch.

## Where I Used It

→ QueueWise',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('multi-tenant-architecture', v_article_id);

  -- Realtime systems (level 5, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Realtime systems', 'realtime-systems', 'Level 5 — Full-Stack Architecture',
    'Systems that push updates to clients as they happen, instead of clients having to poll — typically via WebSockets or a realtime database feature.',
    '# Realtime systems

## What is Realtime systems?

Systems that push updates to clients as they happen, instead of clients having to poll — typically via WebSockets or a realtime database feature.

## Why It Matters

Malaking UX upgrade ito sa mga apps na kailangan ng "live" na feeling — queue numbers, chat, dashboards — imbes na paulit-ulit mag-refresh ang user.

## How It Works

Server ang nagpapadala ng update papunta sa connected clients sa sandaling magbago ang data, gamit ang persistent connection (WebSocket) o database-level subscriptions.

## Example

```
supabase.channel(''queue'').on(''postgres_changes'', { event: ''UPDATE'', table: ''queue_tickets'' }, handleUpdate).subscribe();
```

## Related Concepts

→ API architecture
→ Authentication flow
→ Authorization/RBAC
→ Caching
→ Client-side rendering

## My Notes

Sa QueueWise, malaking pagbabago ang Supabase Realtime — nakikita agad ng customer sa sarili nilang phone kung tumawag na ang kanilang number, walang polling na kailangan.

## Where I Used It

→ QueueWise',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('realtime-systems', v_article_id);

  -- Caching (level 5, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Caching', 'caching', 'Level 5 — Full-Stack Architecture',
    'Storing a copy of expensive-to-compute or slow-to-fetch data so future requests can be served faster, at the cost of potential staleness.',
    '# Caching

## What is Caching?

Storing a copy of expensive-to-compute or slow-to-fetch data so future requests can be served faster, at the cost of potential staleness.

## Why It Matters

Malaking performance win ito para sa data na hindi madalas magbago pero madalas i-request — pero kailangan ding maingat sa staleness (paglabas ng lumang data).

## How It Works

I-store ang result ng isang mahal na operation (DB query, API call, computation) sa mabilis na access na lugar (memory, Redis) — may TTL o explicit invalidation para hindi paglumaan.

## Example

```
const cached = await redis.get(`orders:${userId}`);
if (cached) return JSON.parse(cached);
```

## Related Concepts

→ API architecture
→ Authentication flow
→ Authorization/RBAC
→ Client-side rendering
→ Frontend ↔ API ↔ Database

## My Notes

Sa PulseOps, ginamit namin ang Redis para i-cache ang mabibigat na aggregation queries sa dashboard — pinababa ang load sa Postgres nang malaki.

## Where I Used It

→ PulseOps',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('caching', v_article_id);

  -- Git (level 6, type=technology)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'technology', 'Git', 'git', 'Level 6 — DevOps',
    'A distributed version control system for tracking changes to code over time and coordinating work across branches and collaborators.',
    '# Git

## What is Git?

A distributed version control system for tracking changes to code over time and coordinating work across branches and collaborators.

## Why It Matters

Non-negotiable ito sa kahit anong project, kahit solo pa lang — safety net ito para sa "paano ko na naman ito naka-break" moments.

## How It Works

Snapshots (commits) ng buong project state, naka-branch para sa parallel work, naka-merge para pagsamahin — distributed, kaya bawat clone ay may buong history.

## Example

```
git checkout -b feature/queue-realtime
git commit -m ''Add realtime queue updates''
```

## Related Concepts

→ CI/CD
→ Cloud deployment
→ DNS
→ Docker
→ Domains

## My Notes

Malaking habit change: madalas at maliliit na commits kaysa isang malaking "final commit" — mas madaling i-trace kung saan nagsimula ang isang bug.

## Where I Used It

→ ShopLokal
→ QueueWise
→ DevPedia',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('git', v_article_id);

  -- GitHub (level 6, type=technology)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'technology', 'GitHub', 'github', 'Level 6 — DevOps',
    'A hosting platform for Git repositories, adding collaboration features like pull requests, issues, and CI/CD via Actions.',
    '# GitHub

## What is GitHub?

A hosting platform for Git repositories, adding collaboration features like pull requests, issues, and CI/CD via Actions.

## Why It Matters

Central hub ito ng code collaboration at deployment pipeline — halos lahat ng client projects ko ay naka-host dito, konektado pa sa Vercel para sa auto-deploy.

## How It Works

Pull requests para sa code review bago mag-merge, Issues para sa tracking ng bugs/features, Actions para sa automated workflows (tests, linting, deploy).

## Example

```
# .github/workflows/ci.yml
name: CI
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
```

## Related Concepts

→ CI/CD
→ Cloud deployment
→ DNS
→ Docker
→ Domains

## My Notes

Malaking productivity boost ang PR preview deployments (via Vercel integration) — nakikita agad ng client ang changes bago pa man ma-merge sa main.

## Where I Used It

→ ShopLokal
→ QueueWise
→ DevPedia',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('github', v_article_id);

  -- Environment variables (level 6, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Environment variables', 'environment-variables', 'Level 6 — DevOps',
    'Configuration values (API keys, URLs, secrets) injected into an app at runtime instead of hardcoded, so behavior can differ per environment.',
    '# Environment variables

## What is Environment variables?

Configuration values (API keys, URLs, secrets) injected into an app at runtime instead of hardcoded, so behavior can differ per environment.

## Why It Matters

Kailangan ito para hindi ma-leak ang secrets sa code repo, at para magkaiba ang config (dev vs staging vs production) nang hindi binabago ang aktwal na code.

## How It Works

Naka-store sa `.env` file (hindi kasama sa git) para local, at sa platform''s dashboard (Vercel, Supabase) para sa deployed environments — na-a-access sa code via `process.env`.

## Example

```
const apiKey = process.env.GEMINI_API_KEY;
```

## Related Concepts

→ CI/CD
→ Cloud deployment
→ DNS
→ Docker
→ Domains

## My Notes

Common mistake noon: pag-commit ng `.env` file dahil nakalimutan i-add sa `.gitignore` — laging una kong tinitignan bago mag-first commit sa bagong repo.

## Where I Used It

→ ShopLokal
→ QueueWise
→ SupportGenie
→ DevPedia',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('environment-variables', v_article_id);

  -- Docker (level 6, type=technology)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'technology', 'Docker', 'docker', 'Level 6 — DevOps',
    'A tool for packaging an application and its dependencies into a portable, isolated container that runs consistently across environments.',
    '# Docker

## What is Docker?

A tool for packaging an application and its dependencies into a portable, isolated container that runs consistently across environments.

## Why It Matters

Malaking tulong ito para sa "gumagana sa machine ko" problem — pareho ang environment kahit saan mo patakbuhin, dev man o production.

## How It Works

I-define ang buong environment sa Dockerfile (base image, dependencies, config) -> i-build bilang image -> i-run bilang isolated container.

## Example

```
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "start"]
```

## Related Concepts

→ CI/CD
→ Cloud deployment
→ DNS
→ Domains
→ Environment variables

## My Notes

Sa PulseOps, ginamit namin ang Docker Compose para i-orchestrate ang multiple services (API, worker, Redis) nang magkakasabay sa local dev, parehong setup halos sa production.

## Where I Used It

→ PulseOps
→ QueueWise',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('docker', v_article_id);

  -- CI/CD (level 6, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'CI/CD', 'ci-cd', 'Level 6 — DevOps',
    'Continuous Integration/Continuous Deployment — automatically testing and shipping code changes on every push, instead of manual releases.',
    '# CI/CD

## What is CI/CD?

Continuous Integration/Continuous Deployment — automatically testing and shipping code changes on every push, instead of manual releases.

## Why It Matters

Malaking bawas ng "human error" sa deployment — automated tests bago mag-merge, automated deploy pagkatapos, walang manual copy-paste ng files sa server.

## How It Works

Bawat push/PR ay nagti-trigger ng pipeline: install dependencies -> run tests/lint -> build -> deploy (kung pumasa lahat).

## Example

```
on: [push]
jobs:
  deploy:
    steps:
      - run: npm test
      - run: npm run deploy
```

## Related Concepts

→ Cloud deployment
→ DNS
→ Docker
→ Domains
→ Environment variables

## My Notes

Malaking peace of mind ito — kapag may broken test, hindi na maaabot ang production, hindi na kailangang i-manually check bago mag-deploy.

## Where I Used It

→ ShopLokal
→ QueueWise
→ PulseOps',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('ci-cd', v_article_id);

  -- Vercel (level 6, type=technology)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'technology', 'Vercel', 'vercel', 'Level 6 — DevOps',
    'A hosting platform built around Next.js, optimized for zero-config deployment, serverless functions, and preview deployments per branch.',
    '# Vercel

## What is Vercel?

A hosting platform built around Next.js, optimized for zero-config deployment, serverless functions, and preview deployments per branch.

## Why It Matters

Default choice ko para sa Next.js apps — zero-config deployment, automatic preview URLs per PR, at built-in edge network para sa mabilis na load times kahit saan.

## How It Works

Git push -> automatic build & deploy -> unique preview URL per branch/PR -> promote sa production kapag na-merge sa main branch.

## Example

```
vercel --prod
```

## Related Concepts

→ CI/CD
→ Cloud deployment
→ DNS
→ Docker
→ Domains

## My Notes

Malaking time-saver ang preview deployments — kaya kong ipadala sa client ang link bago pa man mag-merge, walang staging server na kailangang i-maintain nang hiwalay.

## Where I Used It

→ ShopLokal
→ QueueWise
→ DevPedia',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('vercel', v_article_id);

  -- Cloud deployment (level 6, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Cloud deployment', 'cloud-deployment', 'Level 6 — DevOps',
    'Running an application on infrastructure managed by a cloud provider instead of a self-hosted server.',
    '# Cloud deployment

## What is Cloud deployment?

Running an application on infrastructure managed by a cloud provider instead of a self-hosted server.

## Why It Matters

Malaking bawas sa operational overhead — hindi na kailangang mag-alala tungkol sa physical servers, patching ng OS, o hardware failures.

## How It Works

Managed platforms (Vercel, Supabase, Railway) ang naghahawak ng infrastructure layer; ang binibigyan lang ng pansin ay application code at configuration.

## Example

```
# Simpleng deploy sa Railway
railway up
```

## Related Concepts

→ CI/CD
→ DNS
→ Docker
→ Domains
→ Environment variables

## My Notes

Sa PulseOps, ginamit namin ang mix ng Vercel (frontend) at isang VPS/container platform (backend workers) — hindi laging "isang platform lang para sa lahat."

## Where I Used It

→ PulseOps',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('cloud-deployment', v_article_id);

  -- Logs (level 6, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Logs', 'logs', 'Level 6 — DevOps',
    'Timestamped records of what an application did — the first place to look when debugging production issues.',
    '# Logs

## What is Logs?

Timestamped records of what an application did — the first place to look when debugging production issues.

## Why It Matters

Kapag walang access sa live debugger sa production, logs na lang ang mata mo sa kung ano talaga ang nangyayari sa system.

## How It Works

Structured logging (JSON, may consistent fields) ang mas madaling i-search at i-filter kaysa plain text — dapat may enough context (request ID, user ID, timestamp) sa bawat entry.

## Example

```
logger.info(''order_created'', { orderId, userId, amount });
```

## Related Concepts

→ CI/CD
→ Cloud deployment
→ DNS
→ Docker
→ Domains

## My Notes

Malaking habit change: dati "console.log lang" ang gamit ko — ngayon structured logging na, mas madali maghanap sa dami ng logs pag production issue.

## Where I Used It

→ QueueWise
→ PulseOps',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('logs', v_article_id);

  -- Monitoring (level 6, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Monitoring', 'monitoring', 'Level 6 — DevOps',
    'Continuously tracking an app''s health (errors, latency, uptime) so problems are caught before — or as soon as — users notice.',
    '# Monitoring

## What is Monitoring?

Continuously tracking an app''s health (errors, latency, uptime) so problems are caught before — or as soon as — users notice.

## Why It Matters

Mas maganda alam mo agad kapag may nasira, kaysa malaman mo na lang sa complaint ng client — proactive kaysa reactive.

## How It Works

Track ang key metrics (error rate, response time, uptime) at mag-set ng alerts pag lumagpas sa threshold — dashboard para sa visibility, alerts para sa immediate response.

## Example

```
// Sentry error tracking
Sentry.captureException(error);
```

## Related Concepts

→ CI/CD
→ Cloud deployment
→ DNS
→ Docker
→ Domains

## My Notes

Sa PulseOps, ang buong point ng project ay monitoring/analytics dashboard mismo — dun ko talaga naranasan kung gaano kahalaga ang tamang alerting thresholds (hindi masyadong sensitive, hindi rin masyadong tahimik).

## Where I Used It

→ PulseOps',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('monitoring', v_article_id);

  -- Domains (level 6, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Domains', 'domains', 'Level 6 — DevOps',
    'Human-readable addresses (e.g. example.com) that point to a server''s IP address via DNS.',
    '# Domains

## What is Domains?

Human-readable addresses (e.g. example.com) that point to a server''s IP address via DNS.

## Why It Matters

Kailangan ito para maging "professional" ang delivery ng project sa client — mas maganda `shoplokal.ph` kaysa isang random na Vercel subdomain.

## How It Works

Nagpaparehistro ka ng domain sa registrar, tapos i-configure ang DNS records para i-point papunta sa hosting provider (Vercel, Supabase, etc).

## Example

```
shoplokal.ph  CNAME  cname.vercel-dns.com
```

## Related Concepts

→ CI/CD
→ Cloud deployment
→ DNS
→ Docker
→ Environment variables

## My Notes

Common gotcha: pagbabago ng DNS records ay hindi agad-agad — may propagation delay na ilang minuto hanggang oras, kaya laging may buffer time bago i-launch.

## Where I Used It

→ ShopLokal',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('domains', v_article_id);

  -- DNS (level 6, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'DNS', 'dns', 'Level 6 — DevOps',
    'The system that translates domain names into IP addresses, using a hierarchy of nameservers and record types (A, CNAME, MX, etc.).',
    '# DNS

## What is DNS?

The system that translates domain names into IP addresses, using a hierarchy of nameservers and record types (A, CNAME, MX, etc.).

## Why It Matters

Kailangang maintindihan ito kapag nagse-set up ng custom domains, email, o kapag nagde-debug ng "bakit hindi naa-access ang site."

## How It Works

A record: domain -> IP address. CNAME: domain -> ibang domain. MX: para sa email routing. TXT: karaniwang para sa verification/SPF/DKIM.

## Example

```
shoplokal.ph.   A     76.76.21.21
www.shoplokal.ph. CNAME cname.vercel-dns.com.
```

## Related Concepts

→ CI/CD
→ Cloud deployment
→ Docker
→ Domains
→ Environment variables

## My Notes

Nung una, nalilito ako sa A vs CNAME — rule of thumb ko na ngayon: A record para sa root domain, CNAME para sa subdomains na naka-point sa managed service.

## Where I Used It

→ ShopLokal',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('dns', v_article_id);

  -- SSL (level 6, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'SSL', 'ssl', 'Level 6 — DevOps',
    'The protocol (technically superseded by TLS) that encrypts traffic between client and server, enabling HTTPS.',
    '# SSL

## What is SSL?

The protocol (technically superseded by TLS) that encrypts traffic between client and server, enabling HTTPS.

## Why It Matters

Basic requirement na ito ngayon para sa kahit anong production app — browsers mismo ang nagba-babala kapag walang HTTPS, at required ito para sa maraming modern browser APIs.

## How It Works

TLS handshake bago mag-simula ang aktwal na data exchange — nag-e-establish ng encrypted channel gamit ang certificates na naka-issue ng trusted Certificate Authority.

## Example

```
// Karamihan ng modern hosts (Vercel, Supabase) ay auto-provisioned na ang SSL cert
```

## Related Concepts

→ CI/CD
→ Cloud deployment
→ DNS
→ Docker
→ Domains

## My Notes

Malaking convenience ang auto-provisioned SSL certs sa mga modern platforms — dati, manual pang process ang pag-renew ng certificates.

## Where I Used It

→ ShopLokal',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('ssl', v_article_id);

  -- Production debugging (level 6, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Production debugging', 'production-debugging', 'Level 6 — DevOps',
    'Diagnosing issues in a live environment — using logs, monitoring, and reproduction steps — without the luxury of a local debugger.',
    '# Production debugging

## What is Production debugging?

Diagnosing issues in a live environment — using logs, monitoring, and reproduction steps — without the luxury of a local debugger.

## Why It Matters

Ibang klase ng skill ito kumpara sa local debugging — kailangang mag-isip base sa logs/metrics, hindi sa breakpoints, at may added pressure ng live users.

## How It Works

Simulan sa monitoring/alerts (ano ang sumabog), tapos logs (ano ang totoong nangyari), tapos i-reproduce locally kung kaya, bago mag-deploy ng fix.

## Example

```
-- Common workflow: check error tracker -> grep logs by request ID -> reproduce locally
```

## Related Concepts

→ CI/CD
→ Cloud deployment
→ DNS
→ Docker
→ Domains

## My Notes

Malaking aral: laging mag-add ng enough context sa logs bago pa man kailanganin — nakaka-frustrate mag-debug ng production issue na walang enough detail sa logs.

## Where I Used It

→ QueueWise
→ PulseOps',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('production-debugging', v_article_id);

  -- Redis (level 7, type=technology)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'technology', 'Redis', 'redis', 'Level 7 — Advanced',
    'An in-memory data store commonly used for caching, session storage, pub/sub messaging, and queues, due to its speed.',
    '# Redis

## What is Redis?

An in-memory data store commonly used for caching, session storage, pub/sub messaging, and queues, due to its speed.

## Why It Matters

Malaking performance boost ito kapag kailangan ng sub-millisecond na access sa madalas gamiting data — caching, rate limiting counters, session storage.

## How It Works

In-memory key-value store na may support sa iba''t ibang data structures (strings, hashes, lists, sorted sets) — hindi persistent by default pero pwedeng i-configure na may persistence.

## Example

```
await redis.set(`session:${userId}`, JSON.stringify(session), ''EX'', 3600);
```

## Related Concepts

→ Event-driven architecture
→ Load balancing
→ Microservices
→ Performance optimization
→ Queues

## My Notes

Sa PulseOps, ginamit namin ang Redis pub/sub para mag-broadcast ng real-time metrics papunta sa maraming connected dashboard clients nang sabay-sabay.

## Where I Used It

→ PulseOps',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('redis', v_article_id);

  -- Queues (level 7, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Queues', 'queues', 'Level 7 — Advanced',
    'A pattern for deferring and ordering work — producers push tasks onto a queue, and workers process them asynchronously, often with retries.',
    '# Queues

## What is Queues?

A pattern for deferring and ordering work — producers push tasks onto a queue, and workers process them asynchronously, often with retries.

## Why It Matters

Malaking tulong ito para gawing reliable ang mabibigat na operations — kahit mag-crash ang worker sa gitna, hindi mawawala ang task, pwede pang i-retry.

## How It Works

Producer ang nag-push ng task papunta sa queue; hiwalay na worker process(es) ang bahalang mag-consume at mag-process, may retry logic para sa failed tasks.

## Example

```
await queue.add(''process-ai-response'', { conversationId }, { attempts: 3 });
```

## Related Concepts

→ Event-driven architecture
→ Load balancing
→ Microservices
→ Performance optimization
→ Rate limiting

## My Notes

Sa SupportGenie, ginamit namin ang queue para sa mabibigat na AI processing tasks — hindi na kailangang maghintay ang webhook response habang tumatakbo pa ang buong AI pipeline.

## Where I Used It

→ SupportGenie
→ PulseOps',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('queues', v_article_id);

  -- WebSockets (level 7, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'WebSockets', 'websockets', 'Level 7 — Advanced',
    'A protocol that keeps a persistent, two-way connection open between client and server, enabling realtime, low-latency communication.',
    '# WebSockets

## What is WebSockets?

A protocol that keeps a persistent, two-way connection open between client and server, enabling realtime, low-latency communication.

## Why It Matters

Kailangan ito kapag hindi na sapat ang traditional request/response — chat, live dashboards, collaborative tools — kung saan parehong direksyon (server->client) kailangang bukas.

## How It Works

Isang beses lang mag-handshake (HTTP upgrade), pagkatapos nananatiling bukas ang connection — pwedeng magpadala ng messages sa kahit anong direksyon nang walang overhead ng bagong HTTP request bawat beses.

## Example

```
const ws = new WebSocket(''wss://api.queuewise.ph/live'');
ws.onmessage = (event) => updateQueue(JSON.parse(event.data));
```

## Related Concepts

→ Event-driven architecture
→ Load balancing
→ Microservices
→ Performance optimization
→ Queues

## My Notes

Sa QueueWise, sa halip na mag-roll ng sariling WebSocket server, ginamit ko na lang ang Supabase Realtime (naka-batay sa Postgres logical replication) — mas kaunting infra na kailangang i-maintain.

## Where I Used It

→ QueueWise',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('websockets', v_article_id);

  -- Realtime (level 7, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Realtime', 'realtime', 'Level 7 — Advanced',
    'The broader category of techniques (WebSockets, SSE, polling) used to deliver updates to clients with minimal delay.',
    '# Realtime

## What is Realtime?

The broader category of techniques (WebSockets, SSE, polling) used to deliver updates to clients with minimal delay.

## Why It Matters

Importante malaman ang iba''t ibang options dito kasi hindi laging WebSockets ang tamang sagot — minsan sapat na ang simpleng polling o SSE, depende sa scale at complexity ng use case.

## How It Works

Polling: paulit-ulit mag-request sa fixed interval (simple pero may delay/waste). SSE: one-way stream mula server. WebSockets: full two-way, pinaka-complex pero pinaka-flexible.

## Example

```
// SSE — bagay sa AI streaming responses
const stream = new EventSource(''/api/chat/stream'');
```

## Related Concepts

→ Event-driven architecture
→ Load balancing
→ Microservices
→ Performance optimization
→ Queues

## My Notes

Rule of thumb ko: SSE para sa AI streaming responses (one-way lang naman ang kailangan), WebSockets/Supabase Realtime para sa bidirectional na updates tulad ng queue status.

## Where I Used It

→ SupportGenie
→ QueueWise',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('realtime', v_article_id);

  -- Microservices (level 7, type=architecture)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'architecture', 'Microservices', 'microservices', 'Level 7 — Advanced',
    'An architecture where an application is split into small, independently deployable services, each owning a specific piece of functionality.',
    '# Microservices

## What is Microservices?

An architecture where an application is split into small, independently deployable services, each owning a specific piece of functionality.

## Why It Matters

Nakatulong ito sa PulseOps para makapag-scale nang hiwalay ang bawat piyesa (ingestion, aggregation, alerting) base sa aktwal na load ng bawat isa, hindi lahat sabay-sabay.

## How It Works

Bawat service ay may sariling codebase, deployment, at kadalasan sariling database — nag-uusap sila sa isa''t isa via APIs o message queues, hindi direktang function calls.

## Example

```
// Hiwalay na services: ingestion-service, aggregation-service, alert-service
```

## Related Concepts

→ Event-driven architecture
→ Load balancing
→ Performance optimization
→ Queues
→ Rate limiting

## My Notes

Malaking trade-off na natutunan namin: dagdag na operational complexity (maraming services na i-deploy at i-monitor) kapalit ng independent scalability — hindi ito "libreng" upgrade, dapat may aktwal na dahilan.

## Where I Used It

→ PulseOps',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('microservices', v_article_id);

  -- Event-driven architecture (level 7, type=architecture)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'architecture', 'Event-driven architecture', 'event-driven-architecture', 'Level 7 — Advanced',
    'A design where services communicate by emitting and reacting to events, rather than calling each other directly — decoupling producers from consumers.',
    '# Event-driven architecture

## What is Event-driven architecture?

A design where services communicate by emitting and reacting to events, rather than calling each other directly — decoupling producers from consumers.

## Why It Matters

Malaking tulong ito para gawing loosely-coupled ang system — hindi na kailangang malaman ng isang service ang existence ng lahat ng iba pang services na interesado sa event nito.

## How It Works

Nag-e-emit ang isang service ng event ("order.created") papunta sa isang event bus/queue; kahit sinong service na naka-subscribe ang tatanggap at magre-react, independent sa isa''t isa.

## Example

```
eventBus.publish(''order.created'', { orderId, total });
// Hiwalay na listener: sendReceiptEmail, updateInventory
```

## Related Concepts

→ Load balancing
→ Microservices
→ Performance optimization
→ Queues
→ Rate limiting

## My Notes

Sa PulseOps, ginamit namin ito para sa alerting pipeline — pag lumagpas sa threshold ang isang metric, nag-e-emit ng event, tapos hiwalay na consumers ang bahalang mag-notify (email, Slack, SMS).

## Where I Used It

→ PulseOps',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('event-driven-architecture', v_article_id);

  -- Rate limiting (level 7, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Rate limiting', 'rate-limiting', 'Level 7 — Advanced',
    'Restricting how many requests a client can make in a given time window, to protect a system from abuse or overload.',
    '# Rate limiting

## What is Rate limiting?

Restricting how many requests a client can make in a given time window, to protect a system from abuse or overload.

## Why It Matters

Kailangan ito para maprotektahan ang system laban sa abuse (intentional man o accidental) at para maiwasan ang runaway costs sa mga paid APIs (hal. LLM calls).

## How It Works

Bilangin ang requests per client (IP, user, API key) sa loob ng time window (fixed o sliding), i-reject o i-delay ang excess requests, karaniwang gamit ang Redis para sa distributed counting.

## Example

```
const count = await redis.incr(`ratelimit:${userId}`);
if (count > 100) throw new Error(''Rate limit exceeded'');
```

## Related Concepts

→ Event-driven architecture
→ Load balancing
→ Microservices
→ Performance optimization
→ Queues

## My Notes

Sa SupportGenie, kailangan namin ng rate limiting sa AI chat endpoint — hindi lang para sa abuse protection, kundi para talagang kontrolin ang gastos sa LLM API calls.

## Where I Used It

→ SupportGenie',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('rate-limiting', v_article_id);

  -- Scalability (level 7, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Scalability', 'scalability', 'Level 7 — Advanced',
    'A system''s ability to handle increased load — more users, data, or traffic — by adding resources rather than falling over.',
    '# Scalability

## What is Scalability?

A system''s ability to handle increased load — more users, data, or traffic — by adding resources rather than falling over.

## Why It Matters

Importante itong isipin bago pa man kailanganin — mahirap i-retrofit sa isang system na dinisenyo talaga para sa maliit na scale lang mula umpisa.

## How It Works

Vertical scaling: dagdagan ang resources ng isang server (mas mabilis na CPU/RAM). Horizontal scaling: dagdagan ang bilang ng servers, i-distribute ang load sa pagitan nila.

## Example

```
-- Vercel/serverless: automatic horizontal scaling per-request
-- Traditional server: kailangan mag-set up ng load balancer
```

## Related Concepts

→ Event-driven architecture
→ Load balancing
→ Microservices
→ Performance optimization
→ Queues

## My Notes

Malaking bentahe ng serverless platforms (Vercel) — automatic na ang horizontal scaling, hindi ko na kailangang isipin hanggang saan ang traffic bago pa man kailanganin.

## Where I Used It

→ PulseOps
→ ShopLokal',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('scalability', v_article_id);

  -- Load balancing (level 7, type=architecture)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'architecture', 'Load balancing', 'load-balancing', 'Level 7 — Advanced',
    'Distributing incoming traffic across multiple server instances so no single instance is overwhelmed.',
    '# Load balancing

## What is Load balancing?

Distributing incoming traffic across multiple server instances so no single instance is overwhelmed.

## Why It Matters

Kritikal na piyesa ito sa horizontal scaling — walang saysay ang maraming server instances kung hindi pantay-pantay ang pagkaka-distribute ng traffic sa kanila.

## How It Works

Load balancer (hardware o software) ang tumatanggap ng incoming requests, tapos ipinapamahagi papunta sa available na backend instances base sa algorithm (round-robin, least-connections, health checks).

## Example

```
-- Karaniwang na-handle na ito ng platform (Vercel edge network, cloud LB)
-- pero sa self-hosted setup: nginx/HAProxy configuration
```

## Related Concepts

→ Event-driven architecture
→ Microservices
→ Performance optimization
→ Queues
→ Rate limiting

## My Notes

Sa PulseOps, ginamit namin ang managed load balancer ng cloud provider — mas gusto naming mag-focus sa application logic kaysa mag-maintain ng sariling LB configuration.

## Where I Used It

→ PulseOps',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('load-balancing', v_article_id);

  -- Performance optimization (level 7, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Performance optimization', 'performance-optimization', 'Level 7 — Advanced',
    'The practice of identifying and removing bottlenecks — slow queries, unnecessary re-renders, large bundles — to make an app faster.',
    '# Performance optimization

## What is Performance optimization?

The practice of identifying and removing bottlenecks — slow queries, unnecessary re-renders, large bundles — to make an app faster.

## Why It Matters

Direktang naaapektuhan nito ang user experience at, sa mga cases na may traffic-based costs (serverless functions, DB queries), pati ang gastos.

## How It Works

Sukatin muna bago mag-optimize (profiling, EXPLAIN ANALYZE, Lighthouse) — huwag mag-guess kung saan ang bottleneck, base sa data ang desisyon.

## Example

```
explain analyze select * from orders where status = ''pending'';
```

## Related Concepts

→ Event-driven architecture
→ Load balancing
→ Microservices
→ Queues
→ Rate limiting

## My Notes

Malaking aral: madalas hindi ang code ang bottleneck kundi ang N+1 queries o missing index — laging tignan muna ang database bago mag-optimize ng application code.

## Where I Used It

→ ShopLokal
→ QueueWise
→ PulseOps',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('performance-optimization', v_article_id);

  -- Security (level 7, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Security', 'security', 'Level 7 — Advanced',
    'The broad practice of protecting an app and its data from unauthorized access, tampering, or leakage — spans auth, input validation, encryption, and more.',
    '# Security

## What is Security?

The broad practice of protecting an app and its data from unauthorized access, tampering, or leakage — spans auth, input validation, encryption, and more.

## Why It Matters

Hindi ito "isang beses na gawin" na task — kailangan itong isipin sa bawat layer (input validation, auth, DB, infra) at sa bawat bagong feature na idinadagdag.

## How It Works

Defense in depth: input validation (huwag i-trust ang client), authentication/authorization (RLS pati application-level), encryption (in-transit via TLS, at-rest kung sensitive), at regular dependency updates.

## Example

```
-- Common checklist: validate input, parameterized queries (SQL injection), RLS, HTTPS only, no secrets in code
```

## Related Concepts

→ Event-driven architecture
→ Load balancing
→ Microservices
→ Performance optimization
→ Queues

## My Notes

Malaking wake-up call noon nung na-realize kong hindi pala sapat ang "UI lang ang naghihide" ng admin features — laging dapat naka-enforce sa server/DB level ang totoong access control.

## Where I Used It

→ ShopLokal
→ QueueWise
→ SupportGenie',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('security', v_article_id);

  -- OpenAI/Gemini APIs (level 8, type=technology)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'technology', 'OpenAI/Gemini APIs', 'openai-gemini-apis', 'Level 8 — AI Full-Stack',
    'Hosted LLM APIs (OpenAI, Google Gemini, etc.) that let an app send a prompt and get back generated text, structured data, or tool calls.',
    '# OpenAI/Gemini APIs

## What is OpenAI/Gemini APIs?

Hosted LLM APIs (OpenAI, Google Gemini, etc.) that let an app send a prompt and get back generated text, structured data, or tool calls.

## Why It Matters

Ito ang core building block ng lahat ng AI features na ginawa ko — chat, summarization, structured extraction — hindi na kailangang mag-train ng sariling model.

## How It Works

Nagpapadala ka ng messages array (system + user + optional history), binabalik ng API ang generated response — pwede ring i-request na structured JSON o tool/function call.

## Example

```
const res = await fetch(''https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent'', { method: ''POST'', body: JSON.stringify({ contents: [...] }) });
```

## Related Concepts

→ AI agents
→ AI automation
→ Deepgram
→ Embeddings
→ Function calling

## My Notes

Malaking gastos-saver: paggamit ng mas maliit/mabilis na model (hal. flash variants) para sa simpleng classification tasks, at i-reserve ang mas malaking model para sa complex reasoning lang.

## Where I Used It

→ SupportGenie
→ VoiceDesk',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('openai-gemini-apis', v_article_id);

  -- Streaming (level 8, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Streaming', 'ai-streaming', 'Level 8 — AI Full-Stack',
    'Receiving an LLM''s response token-by-token as it''s generated, instead of waiting for the full response, for a faster perceived experience.',
    '# Streaming

## What is Streaming?

Receiving an LLM''s response token-by-token as it''s generated, instead of waiting for the full response, for a faster perceived experience.

## Why It Matters

Malaking UX difference ito — kahit parehas ang total time, mas maganda ang "feel" kapag unti-unting lumalabas ang sagot kaysa maghintay ng ilang segundo ng blangko.

## How It Works

Server-Sent Events o chunked responses ang karaniwang gamit — bawat token/chunk na dumarating ay direktang ipinapakita sa UI habang buo pa ang generation.

## Example

```
for await (const chunk of stream) {
  res.write(`data: ${chunk.text}\
\
`);
}
```

## Related Concepts

→ AI agents
→ AI automation
→ Deepgram
→ Embeddings
→ Function calling

## My Notes

Sa SupportGenie, malaking factor ito sa "pakiramdam ng bilis" ng chatbot — mas patient ang users kapag nakikita nilang aktibong sumasagot ang AI, kaysa nakatingin lang sa loading spinner.

## Where I Used It

→ SupportGenie',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('ai-streaming', v_article_id);

  -- Function calling (level 8, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Function calling', 'function-calling', 'Level 8 — AI Full-Stack',
    'Letting an LLM request that a specific function/tool be called (with structured arguments) so it can take actions or fetch live data.',
    '# Function calling

## What is Function calling?

Letting an LLM request that a specific function/tool be called (with structured arguments) so it can take actions or fetch live data.

## Why It Matters

Ito ang nagpapa-"agentic" sa isang simpleng chatbot — hindi na lang nagta-text, nakakagawa na rin ng aktwal na aksyon (mag-book ng appointment, mag-check ng order status).

## How It Works

Nagpapadala ka ng available tools/functions (kasama ang schema ng arguments), binabalik ng model kung anong function ang gusto niyang tawagin at anong arguments — ikaw ang aktwal na nagsasagawa nito, ibabalik mo lang ang result.

## Example

```
tools: [{ name: ''check_order_status'', parameters: { orderId: ''string'' } }]
```

## Related Concepts

→ AI agents
→ AI automation
→ Deepgram
→ Embeddings
→ OpenAI/Gemini APIs

## My Notes

Sa SupportGenie, ginamit namin ito para sa "check order status" at "escalate to human" actions — malaking pagbabago mula sa purong FAQ bot papunta sa aktwal na functional assistant.

## Where I Used It

→ SupportGenie
→ VoiceDesk',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('function-calling', v_article_id);

  -- RAG (level 8, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'RAG', 'rag', 'Level 8 — AI Full-Stack',
    'Retrieval-Augmented Generation — fetching relevant context (e.g. via search or embeddings) and feeding it to an LLM so its answers are grounded in real data.',
    '# RAG

## What is RAG?

Retrieval-Augmented Generation — fetching relevant context (e.g. via search or embeddings) and feeding it to an LLM so its answers are grounded in real data.

## Why It Matters

Ito ang solusyon sa "hallucination" problem ng LLMs sa domain-specific na content — imbes na umasa lang sa training data ng model, binibigyan mo ng aktwal, updated na context.

## How It Works

Query -> i-convert sa embedding -> maghanap ng similar content sa vector DB (semantic search) -> i-inject ang mga nahanap na context sa prompt bago ipadala sa LLM.

## Example

```
const matches = await supabase.rpc(''match_articles'', { query_embedding, match_count: 5 });
const context = matches.map(m => m.content).join(''\
'');
```

## Related Concepts

→ AI agents
→ AI automation
→ Deepgram
→ Embeddings
→ Function calling

## My Notes

Sa SupportGenie, ginamit namin ang RAG para masagot ng bot ang mga specific na tanong tungkol sa produkto/policy ng client — hindi na kailangang i-retrain ang model tuwing may bagong information.

## Where I Used It

→ SupportGenie
→ DevPedia',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('rag', v_article_id);

  -- Vector databases (level 8, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Vector databases', 'vector-databases', 'Level 8 — AI Full-Stack',
    'Databases (or extensions like pgvector) optimized for storing and searching high-dimensional embeddings by similarity.',
    '# Vector databases

## What is Vector databases?

Databases (or extensions like pgvector) optimized for storing and searching high-dimensional embeddings by similarity.

## Why It Matters

Kailangan ito para gumana ang semantic search at RAG — hindi na keyword matching lang, kundi "meaning-based" na paghahanap ng similar content.

## How It Works

I-store ang embeddings (arrays ng floats) kasama ng original content, mag-index gamit ang approximate nearest neighbor algorithm (hal. HNSW) para mabilis ang similarity search kahit malaki na ang dataset.

## Example

```
create index on article_embeddings using hnsw (embedding vector_cosine_ops);
```

## Related Concepts

→ AI agents
→ AI automation
→ Deepgram
→ Embeddings
→ Function calling

## My Notes

Malaking convenience ang `pgvector` — hindi na kailangang mag-set up ng hiwalay na vector DB service, iisang PostgreSQL na lang ang pinapanatili.

## Where I Used It

→ SupportGenie
→ DevPedia',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('vector-databases', v_article_id);

  -- Embeddings (level 8, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Embeddings', 'embeddings', 'Level 8 — AI Full-Stack',
    'Numerical vector representations of text (or other data) that capture semantic meaning, enabling similarity search.',
    '# Embeddings

## What is Embeddings?

Numerical vector representations of text (or other data) that capture semantic meaning, enabling similarity search.

## Why It Matters

Foundation ito ng semantic search at RAG — nagbibigay-daan para maghanap base sa "meaning" ng tanong, hindi lang exact keyword matches.

## How It Works

Ipinapasa ang text sa isang embedding model, ibinabalik nito ay isang array ng floats (vector) na kumakatawan sa semantic meaning nito — magkalapit ang vectors ng magkaparehong meaning na text.

## Example

```
const { embedding } = await embedModel.embed(''Paano mag-reset ng password?'');
```

## Related Concepts

→ AI agents
→ AI automation
→ Deepgram
→ Function calling
→ OpenAI/Gemini APIs

## My Notes

Common gotcha: iba-ibang embedding models ay hindi compatible sa isa''t isa — dapat consistent ang model na ginagamit sa pag-generate at pag-search, at maging maingat kapag nag-migrate sa bagong model version.

## Where I Used It

→ SupportGenie
→ DevPedia',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('embeddings', v_article_id);

  -- AI agents (level 8, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'AI agents', 'ai-agents', 'Level 8 — AI Full-Stack',
    'LLM-powered systems that can plan, call tools, and take multi-step actions toward a goal, rather than just answering a single prompt.',
    '# AI agents

## What is AI agents?

LLM-powered systems that can plan, call tools, and take multi-step actions toward a goal, rather than just answering a single prompt.

## Why It Matters

Ito ang next level pagkatapos ng simpleng chatbot — kayang mag-decide ng multi-step approach papunta sa isang goal, hindi lang single-turn Q&A.

## How It Works

Loop: LLM ang nag-decide ng susunod na action (batay sa goal at current state) -> i-execute ang action (tool call) -> ibalik ang result sa LLM -> ulitin hanggang matapos ang goal o umabot sa limit.

## Example

```
while (!done && steps < maxSteps) {
  const action = await llm.decideNextAction(state);
  state = await executeAction(action);
}
```

## Related Concepts

→ AI automation
→ Deepgram
→ Embeddings
→ Function calling
→ OpenAI/Gemini APIs

## My Notes

Malaking aral: kailangan ng hard limits (max steps, timeout, budget) sa mga agentic loops — madaling maging costly o mag-loop nang walang katapusan kung walang guardrails.

## Where I Used It

→ SupportGenie',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('ai-agents', v_article_id);

  -- Voice AI (level 8, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'Voice AI', 'voice-ai', 'Level 8 — AI Full-Stack',
    'Systems that combine speech-to-text, an LLM, and text-to-speech to hold spoken conversations with users.',
    '# Voice AI

## What is Voice AI?

Systems that combine speech-to-text, an LLM, and text-to-speech to hold spoken conversations with users.

## Why It Matters

Malaking expansion ito sa mga use cases na hindi comfortable mag-type ang users — phone-based customer service, accessibility, hands-free interactions.

## How It Works

Pipeline: audio input -> speech-to-text (transcription) -> LLM processing (understanding + response generation) -> text-to-speech (synthesized voice) -> audio output, kadalasang naka-stream para bumilis.

## Example

```
const transcript = await deepgram.transcribe(audioStream);
const reply = await llm.generate(transcript);
const audio = await tts.synthesize(reply);
```

## Related Concepts

→ AI agents
→ AI automation
→ Deepgram
→ Embeddings
→ Function calling

## My Notes

Sa VoiceDesk, ang pinaka-mahirap na part ay hindi ang bawat piyesa nang hiwalay, kundi ang latency ng buong pipeline — kailangang mabilis lahat para maramdaman ng caller na "natural" ang usapan.

## Where I Used It

→ VoiceDesk',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('voice-ai', v_article_id);

  -- Deepgram (level 8, type=technology)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'technology', 'Deepgram', 'deepgram', 'Level 8 — AI Full-Stack',
    'A speech-to-text (and text-to-speech) API commonly used for realtime transcription in voice AI pipelines.',
    '# Deepgram

## What is Deepgram?

A speech-to-text (and text-to-speech) API commonly used for realtime transcription in voice AI pipelines.

## Why It Matters

Napili namin ito sa VoiceDesk dahil sa mababang latency nito para sa real-time transcription — kritikal para sa natural na feel ng phone conversations.

## How It Works

Nagpapadala ka ng audio stream (WebSocket), binabalik nito ang transcribed text nang halos real-time, may support pa sa interim (partial) results habang nagsasalita pa ang tao.

## Example

```
const connection = deepgram.listen.live({ model: ''nova-2'', language: ''en'' });
connection.on(''transcript'', handleTranscript);
```

## Related Concepts

→ AI agents
→ AI automation
→ Embeddings
→ Function calling
→ OpenAI/Gemini APIs

## My Notes

Malaking factor sa latency ng buong voice pipeline ang mabilis na transcription — bahagya lang ang delay dito, malaking epekto na sa "pakiramdam ng natural na usapan" ng caller.

## Where I Used It

→ VoiceDesk',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('deepgram', v_article_id);

  -- WebRTC (level 8, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'WebRTC', 'webrtc', 'Level 8 — AI Full-Stack',
    'A browser-native protocol for realtime peer-to-peer audio, video, and data — the transport layer under many voice/video AI apps.',
    '# WebRTC

## What is WebRTC?

A browser-native protocol for realtime peer-to-peer audio, video, and data — the transport layer under many voice/video AI apps.

## Why It Matters

Ito ang "pipes" na gumagawa ng possible ang voice AI sa browser — mababang latency na audio streaming nang walang kailangang i-install na plugin.

## How It Works

Peer-to-peer connection (o via SFU/media server) na naka-negotiate gamit ang signaling server bago mag-simula ang direktang audio/video/data exchange sa pagitan ng dalawang peers.

## Example

```
const pc = new RTCPeerConnection();
pc.addTrack(audioTrack, stream);
```

## Related Concepts

→ AI agents
→ AI automation
→ Deepgram
→ Embeddings
→ Function calling

## My Notes

Sa VoiceDesk, kailangan naming maintindihan ang STUN/TURN servers para gumana ang connection kahit naka-likod ng NAT/firewall ang mga caller — hindi ito "plug and play" agad.

## Where I Used It

→ VoiceDesk',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('webrtc', v_article_id);

  -- AI automation (level 8, type=concept)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'concept', 'AI automation', 'ai-automation', 'Level 8 — AI Full-Stack',
    'Using LLMs combined with workflow tools to automate multi-step business processes, rather than just answering questions.',
    '# AI automation

## What is AI automation?

Using LLMs combined with workflow tools to automate multi-step business processes, rather than just answering questions.

## Why It Matters

Malaking value-add ito para sa mga client na gusto talagang mabawasan ang manual work, hindi lang "may chatbot kami" — invoice processing, lead qualification, data entry.

## How It Works

I-chain ang mga steps (trigger -> AI processing -> action) gamit ang workflow tool (n8n) o custom code — ang AI ay isa lang sa mga nodes sa buong pipeline, hindi ang buong solusyon mismo.

## Example

```
// n8n workflow: Webhook trigger -> Gemini node (extract data) -> Supabase node (save) -> Email node (notify)
```

## Related Concepts

→ AI agents
→ Deepgram
→ Embeddings
→ Function calling
→ OpenAI/Gemini APIs

## My Notes

Sa SupportGenie, ang AI chat ay isa lang piyesa — ang buong value ay sa automation sa likod nito (auto-tagging ng tickets, auto-escalation, auto-summary papunta sa Slack).

## Where I Used It

→ SupportGenie
→ VoiceDesk',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('ai-automation', v_article_id);

  -- n8n (level 8, type=technology)
  insert into articles (user_id, type, title, slug, subcategory, excerpt, content, status)
  values (
    v_user_id, 'technology', 'n8n', 'n8n', 'Level 8 — AI Full-Stack',
    'An open-source workflow automation tool that lets you visually chain together APIs, logic, and AI steps without writing a full backend.',
    '# n8n

## What is n8n?

An open-source workflow automation tool that lets you visually chain together APIs, logic, and AI steps without writing a full backend.

## Why It Matters

Malaking bilis sa pag-deliver ng automation projects — hindi na kailangang mag-set up ng buong backend service para lang sa multi-step na workflow, visual na node editor na lang.

## How It Works

Bawat workflow ay binubuo ng mga nodes (trigger, action, logic) na naka-connect sa isa''t isa — pwedeng gumamit ng built-in integrations o custom code nodes kapag kailangan ng mas specific na logic.

## Example

```
// Webhook Trigger -> HTTP Request (fetch order) -> IF node (check status) -> Send Email
```

## Related Concepts

→ AI agents
→ AI automation
→ Deepgram
→ Embeddings
→ Function calling

## My Notes

Ginagamit ko ito para sa mga automation na hindi naman kailangan ng full custom app — mabilis ma-prototype, at kayang i-hand off sa client para sa simpleng edits nila mismo.

## Where I Used It

→ SupportGenie
→ VoiceDesk',
    'published'
  )
  returning id into v_article_id;
  v_slug_ids := v_slug_ids || jsonb_build_object('n8n', v_article_id);

  -- =========================================================
  -- article_references — link bawat topic sa project(s) kung
  -- saan ito ginamit ('Where I Used It' <-> 'Concepts Used')
  -- =========================================================
  insert into article_references (article_id, reference_type, reference_id)
  select (v_slug_ids ->> x.slug)::uuid, 'project', x.project_id
  from (values
    ('html', v_proj_shoplokal_id),
    ('css', v_proj_shoplokal_id),
    ('javascript', v_proj_shoplokal_id),
    ('javascript', v_proj_supportgenie_id),
    ('dom', v_proj_shoplokal_id),
    ('http', v_proj_shoplokal_id),
    ('http', v_proj_queuewise_id),
    ('browser-fundamentals', v_proj_shoplokal_id),
    ('json', v_proj_shoplokal_id),
    ('json', v_proj_supportgenie_id),
    ('forms', v_proj_shoplokal_id),
    ('cookies-local-storage', v_proj_shoplokal_id),
    ('react', v_proj_shoplokal_id),
    ('react', v_proj_queuewise_id),
    ('components', v_proj_shoplokal_id),
    ('props-state', v_proj_shoplokal_id),
    ('hooks', v_proj_queuewise_id),
    ('forms-validation', v_proj_shoplokal_id),
    ('api-calls', v_proj_shoplokal_id),
    ('routing', v_proj_shoplokal_id),
    ('authentication-ui', v_proj_shoplokal_id),
    ('authentication-ui', v_proj_queuewise_id),
    ('responsive-design', v_proj_shoplokal_id),
    ('responsive-design', v_proj_queuewise_id),
    ('tailwind-css', v_proj_shoplokal_id),
    ('tailwind-css', v_proj_queuewise_id),
    ('nextjs', v_proj_shoplokal_id),
    ('nextjs', v_proj_queuewise_id),
    ('nextjs', v_proj_devpedia_id),
    ('nodejs', v_proj_queuewise_id),
    ('nodejs', v_proj_supportgenie_id),
    ('rest-api', v_proj_shoplokal_id),
    ('rest-api', v_proj_queuewise_id),
    ('rest-api', v_proj_devpedia_id),
    ('api-routes', v_proj_shoplokal_id),
    ('api-routes', v_proj_supportgenie_id),
    ('middleware', v_proj_shoplokal_id),
    ('middleware', v_proj_queuewise_id),
    ('authentication', v_proj_shoplokal_id),
    ('authentication', v_proj_queuewise_id),
    ('authentication', v_proj_supportgenie_id),
    ('authorization', v_proj_shoplokal_id),
    ('authorization', v_proj_queuewise_id),
    ('validation', v_proj_shoplokal_id),
    ('validation', v_proj_supportgenie_id),
    ('error-handling', v_proj_shoplokal_id),
    ('error-handling', v_proj_queuewise_id),
    ('error-handling', v_proj_supportgenie_id),
    ('file-uploads', v_proj_shoplokal_id),
    ('webhooks', v_proj_shoplokal_id),
    ('webhooks', v_proj_supportgenie_id),
    ('background-jobs', v_proj_supportgenie_id),
    ('background-jobs', v_proj_voicedesk_id),
    ('postgresql', v_proj_shoplokal_id),
    ('postgresql', v_proj_queuewise_id),
    ('postgresql', v_proj_supportgenie_id),
    ('tables', v_proj_shoplokal_id),
    ('tables', v_proj_queuewise_id),
    ('relationships', v_proj_shoplokal_id),
    ('relationships', v_proj_queuewise_id),
    ('primary-foreign-keys', v_proj_shoplokal_id),
    ('primary-foreign-keys', v_proj_queuewise_id),
    ('indexes', v_proj_shoplokal_id),
    ('indexes', v_proj_queuewise_id),
    ('sql', v_proj_shoplokal_id),
    ('sql', v_proj_queuewise_id),
    ('transactions', v_proj_shoplokal_id),
    ('views', v_proj_queuewise_id),
    ('db-functions', v_proj_devpedia_id),
    ('database-security', v_proj_shoplokal_id),
    ('database-security', v_proj_queuewise_id),
    ('database-security', v_proj_devpedia_id),
    ('rls', v_proj_shoplokal_id),
    ('rls', v_proj_queuewise_id),
    ('rls', v_proj_devpedia_id),
    ('supabase', v_proj_shoplokal_id),
    ('supabase', v_proj_queuewise_id),
    ('supabase', v_proj_supportgenie_id),
    ('supabase', v_proj_devpedia_id),
    ('frontend-api-database-flow', v_proj_shoplokal_id),
    ('frontend-api-database-flow', v_proj_queuewise_id),
    ('frontend-api-database-flow', v_proj_devpedia_id),
    ('server-side-rendering', v_proj_shoplokal_id),
    ('server-side-rendering', v_proj_devpedia_id),
    ('client-side-rendering', v_proj_queuewise_id),
    ('server-actions', v_proj_shoplokal_id),
    ('server-actions', v_proj_devpedia_id),
    ('api-architecture', v_proj_shoplokal_id),
    ('api-architecture', v_proj_queuewise_id),
    ('authentication-flow', v_proj_shoplokal_id),
    ('authentication-flow', v_proj_queuewise_id),
    ('authorization-rbac', v_proj_queuewise_id),
    ('multi-tenant-architecture', v_proj_queuewise_id),
    ('realtime-systems', v_proj_queuewise_id),
    ('caching', v_proj_pulseops_id),
    ('git', v_proj_shoplokal_id),
    ('git', v_proj_queuewise_id),
    ('git', v_proj_devpedia_id),
    ('github', v_proj_shoplokal_id),
    ('github', v_proj_queuewise_id),
    ('github', v_proj_devpedia_id),
    ('environment-variables', v_proj_shoplokal_id),
    ('environment-variables', v_proj_queuewise_id),
    ('environment-variables', v_proj_supportgenie_id),
    ('environment-variables', v_proj_devpedia_id),
    ('docker', v_proj_pulseops_id),
    ('docker', v_proj_queuewise_id),
    ('ci-cd', v_proj_shoplokal_id),
    ('ci-cd', v_proj_queuewise_id),
    ('ci-cd', v_proj_pulseops_id),
    ('vercel', v_proj_shoplokal_id),
    ('vercel', v_proj_queuewise_id),
    ('vercel', v_proj_devpedia_id),
    ('cloud-deployment', v_proj_pulseops_id),
    ('logs', v_proj_queuewise_id),
    ('logs', v_proj_pulseops_id),
    ('monitoring', v_proj_pulseops_id),
    ('domains', v_proj_shoplokal_id),
    ('dns', v_proj_shoplokal_id),
    ('ssl', v_proj_shoplokal_id),
    ('production-debugging', v_proj_queuewise_id),
    ('production-debugging', v_proj_pulseops_id),
    ('redis', v_proj_pulseops_id),
    ('queues', v_proj_supportgenie_id),
    ('queues', v_proj_pulseops_id),
    ('websockets', v_proj_queuewise_id),
    ('realtime', v_proj_supportgenie_id),
    ('realtime', v_proj_queuewise_id),
    ('microservices', v_proj_pulseops_id),
    ('event-driven-architecture', v_proj_pulseops_id),
    ('rate-limiting', v_proj_supportgenie_id),
    ('scalability', v_proj_pulseops_id),
    ('scalability', v_proj_shoplokal_id),
    ('load-balancing', v_proj_pulseops_id),
    ('performance-optimization', v_proj_shoplokal_id),
    ('performance-optimization', v_proj_queuewise_id),
    ('performance-optimization', v_proj_pulseops_id),
    ('security', v_proj_shoplokal_id),
    ('security', v_proj_queuewise_id),
    ('security', v_proj_supportgenie_id),
    ('openai-gemini-apis', v_proj_supportgenie_id),
    ('openai-gemini-apis', v_proj_voicedesk_id),
    ('ai-streaming', v_proj_supportgenie_id),
    ('function-calling', v_proj_supportgenie_id),
    ('function-calling', v_proj_voicedesk_id),
    ('rag', v_proj_supportgenie_id),
    ('rag', v_proj_devpedia_id),
    ('vector-databases', v_proj_supportgenie_id),
    ('vector-databases', v_proj_devpedia_id),
    ('embeddings', v_proj_supportgenie_id),
    ('embeddings', v_proj_devpedia_id),
    ('ai-agents', v_proj_supportgenie_id),
    ('voice-ai', v_proj_voicedesk_id),
    ('deepgram', v_proj_voicedesk_id),
    ('webrtc', v_proj_voicedesk_id),
    ('ai-automation', v_proj_supportgenie_id),
    ('ai-automation', v_proj_voicedesk_id),
    ('n8n', v_proj_supportgenie_id),
    ('n8n', v_proj_voicedesk_id)
  ) as x(slug, project_id)
  where x.project_id is not null;
  -- =========================================================
  -- article_relations — knowledge graph edges sa pagitan ng
  -- magkakaugnay na topics (cross-level, hindi lang same-subcategory)
  -- =========================================================
  insert into article_relations (article_id, related_article_id, relation_type)
  select (v_slug_ids ->> x.a)::uuid, (v_slug_ids ->> x.b)::uuid, x.rel::relation_type
  from (values
    -- Web fundamentals -> frontend
    ('html', 'css', 'used-with'),
    ('css', 'tailwind-css', 'parent-of'),
    ('dom', 'react', 'related'),
    ('javascript', 'react', 'used-with'),
    ('javascript', 'nodejs', 'used-with'),
    ('json', 'rest-api', 'used-with'),
    -- React fundamentals
    ('react', 'components', 'parent-of'),
    ('components', 'props-state', 'related'),
    ('props-state', 'hooks', 'related'),
    ('hooks', 'api-calls', 'used-with'),
    ('forms', 'forms-validation', 'parent-of'),
    ('forms-validation', 'validation', 'related'),
    ('react', 'nextjs', 'used-with'),
    ('routing', 'nextjs', 'used-with'),
    -- HTTP / REST / API chain
    ('http', 'rest-api', 'related'),
    ('http', 'cors', 'related'),
    ('rest-api', 'idempotency', 'related'),
    ('rest-api', 'api-routes', 'related'),
    ('api-routes', 'middleware', 'used-with'),
    ('rest-api', 'api-architecture', 'parent-of'),
    ('webhooks', 'rest-api', 'related'),
    -- Auth chain
    ('authentication', 'authentication-ui', 'used-with'),
    ('authentication', 'authorization', 'related'),
    ('authentication', 'authentication-flow', 'parent-of'),
    ('authorization', 'authorization-rbac', 'parent-of'),
    ('authorization-rbac', 'rls', 'used-with'),
    ('cookies-local-storage', 'authentication-flow', 'related'),
    -- Database chain
    ('postgresql', 'tables', 'parent-of'),
    ('tables', 'relationships', 'related'),
    ('relationships', 'primary-foreign-keys', 'related'),
    ('primary-foreign-keys', 'indexes', 'related'),
    ('sql', 'postgresql', 'used-with'),
    ('sql', 'transactions', 'related'),
    ('postgresql', 'rls', 'used-with'),
    ('postgresql', 'supabase', 'parent-of'),
    ('supabase', 'authentication', 'used-with'),
    ('supabase', 'realtime-systems', 'used-with'),
    ('database-security', 'rls', 'parent-of'),
    ('db-functions', 'transactions', 'related'),
    -- Full-stack architecture
    ('frontend-api-database-flow', 'rest-api', 'used-with'),
    ('frontend-api-database-flow', 'postgresql', 'used-with'),
    ('server-side-rendering', 'nextjs', 'used-with'),
    ('client-side-rendering', 'server-side-rendering', 'related'),
    ('server-actions', 'nextjs', 'used-with'),
    ('server-actions', 'api-routes', 'related'),
    ('multi-tenant-architecture', 'rls', 'used-with'),
    ('realtime-systems', 'websockets', 'related'),
    ('caching', 'redis', 'used-with'),
    -- DevOps chain
    ('git', 'github', 'parent-of'),
    ('github', 'ci-cd', 'used-with'),
    ('ci-cd', 'vercel', 'used-with'),
    ('environment-variables', 'database-security', 'related'),
    ('docker', 'ci-cd', 'used-with'),
    ('domains', 'dns', 'related'),
    ('dns', 'ssl', 'related'),
    ('logs', 'monitoring', 'related'),
    ('monitoring', 'production-debugging', 'used-with'),
    ('vercel', 'cloud-deployment', 'parent-of'),
    -- Advanced
    ('redis', 'queues', 'used-with'),
    ('queues', 'background-jobs', 'related'),
    ('websockets', 'realtime', 'parent-of'),
    ('realtime', 'ai-streaming', 'related'),
    ('microservices', 'event-driven-architecture', 'used-with'),
    ('microservices', 'load-balancing', 'used-with'),
    ('load-balancing', 'scalability', 'related'),
    ('rate-limiting', 'security', 'related'),
    ('performance-optimization', 'indexes', 'related'),
    ('security', 'validation', 'related'),
    ('security', 'authorization', 'related'),
    -- AI full-stack chain
    ('openai-gemini-apis', 'ai-streaming', 'used-with'),
    ('openai-gemini-apis', 'function-calling', 'used-with'),
    ('function-calling', 'ai-agents', 'parent-of'),
    ('rag', 'embeddings', 'used-with'),
    ('embeddings', 'vector-databases', 'used-with'),
    ('vector-databases', 'postgresql', 'used-with'),
    ('rag', 'openai-gemini-apis', 'used-with'),
    ('voice-ai', 'deepgram', 'used-with'),
    ('voice-ai', 'webrtc', 'used-with'),
    ('voice-ai', 'openai-gemini-apis', 'used-with'),
    ('ai-automation', 'n8n', 'used-with'),
    ('ai-automation', 'webhooks', 'related'),
    ('ai-agents', 'ai-automation', 'related'),
    ('rate-limiting', 'openai-gemini-apis', 'related')
  ) as x(a, b, rel)
  where (v_slug_ids ? x.a) and (v_slug_ids ? x.b);

  -- =========================================================
  -- Sample Errors — isa bawat project, naka-link sa related
  -- articles via article_references
  -- =========================================================
  insert into errors (user_id, title, technology, error_text, cause, solution, status)
  values (
    v_user_id, 'Hydration mismatch: Text content does not match server-rendered HTML',
    array['Next.js', 'React'],
    'Error: Text content does not match server-rendered HTML. Warning: Text content did not match. Server: "..." Client: "..."',
    'Gumamit ng non-deterministic na value (hal. `new Date()`, `Math.random()`, o locale-dependent formatting) sa loob ng isang Server Component na naka-render din sa client — magkaiba ang output sa server vs sa unang client render.',
    'Ilipat ang non-deterministic na computation papunta sa `useEffect` (client-only, tatakbo lang pagkatapos ng initial hydration) o gumamit ng `suppressHydrationWarning` kung intentional talaga ang pagkakaiba (hal. relative timestamps).',
    'resolved'
  ) returning id into v_err_id;
  insert into article_references (article_id, reference_type, reference_id) values
    ((v_slug_ids ->> 'server-side-rendering')::uuid, 'error', v_err_id),
    ((v_slug_ids ->> 'nextjs')::uuid, 'error', v_err_id);

  insert into errors (user_id, title, technology, error_text, cause, solution, status)
  values (
    v_user_id, 'Realtime channel not receiving postgres_changes events',
    array['Supabase', 'PostgreSQL'],
    '(walang error na lumalabas — tahimik lang na hindi dumarating ang mga expected na realtime events sa subscriber)',
    'Hindi naka-enable ang Realtime replication para sa specific na table (default disabled ito sa Supabase), o hindi tugma ang RLS policy kaya na-filter out ang event bago pa man makarating sa client.',
    'I-enable ang table sa Database > Replication settings ng Supabase dashboard, at i-verify na may `select` policy ang current user na covers sa row na nagbago.',
    'resolved'
  ) returning id into v_err_id;
  insert into article_references (article_id, reference_type, reference_id) values
    ((v_slug_ids ->> 'realtime-systems')::uuid, 'error', v_err_id),
    ((v_slug_ids ->> 'rls')::uuid, 'error', v_err_id);

  insert into errors (user_id, title, technology, error_text, cause, solution, status)
  values (
    v_user_id, 'Gemini API: 429 Resource has been exhausted',
    array['Gemini API', 'Node.js'],
    '429 Resource has been exhausted (e.g. check quota).',
    'Umabot sa rate limit (requests per minute) ang API key — karaniwang nangyayari kapag walang client-side rate limiting at biglang dumami ang concurrent requests (hal. spam mula sa isang user o bot).',
    'Nag-implement ng exponential backoff + retry sa API calls, at nagdagdag ng application-level rate limiting (Redis-based) bago pa man umabot sa Gemini API mismo.',
    'resolved'
  ) returning id into v_err_id;
  insert into article_references (article_id, reference_type, reference_id) values
    ((v_slug_ids ->> 'openai-gemini-apis')::uuid, 'error', v_err_id),
    ((v_slug_ids ->> 'rate-limiting')::uuid, 'error', v_err_id);

  insert into errors (user_id, title, technology, error_text, cause, solution, status)
  values (
    v_user_id, 'WebRTC: ICE connection stuck in ''checking'' state on mobile networks',
    array['WebRTC', 'Deepgram'],
    'iceConnectionState: "checking" (hindi natatapos maging "connected" o "failed")',
    'Naka-likod ng symmetric NAT/carrier-grade NAT ang caller (karaniwan sa mobile networks) kaya hindi sapat ang STUN lang para makahanap ng valid na peer-to-peer path.',
    'Nagdagdag ng TURN server bilang fallback relay — hindi lahat ng networks ay kayang mag-establish ng direct peer connection, kailangan talaga ng relay option.',
    'resolved'
  ) returning id into v_err_id;
  insert into article_references (article_id, reference_type, reference_id) values
    ((v_slug_ids ->> 'webrtc')::uuid, 'error', v_err_id),
    ((v_slug_ids ->> 'voice-ai')::uuid, 'error', v_err_id);

  insert into errors (user_id, title, technology, error_text, cause, solution, status)
  values (
    v_user_id, 'Redis ECONNREFUSED in production but works locally',
    array['Redis', 'Docker'],
    'Error: connect ECONNREFUSED 127.0.0.1:6379',
    'Naka-hardcode ang `localhost`/`127.0.0.1` bilang Redis host — gumagana ito locally (parehong machine) pero hindi sa production kung saan hiwalay na container/service ang Redis.',
    'Ginawang configurable via environment variable ang Redis host/port (`REDIS_URL`), at ginamit ang service name (hal. `redis`) bilang host sa loob ng Docker Compose network.',
    'resolved'
  ) returning id into v_err_id;
  insert into article_references (article_id, reference_type, reference_id) values
    ((v_slug_ids ->> 'redis')::uuid, 'error', v_err_id),
    ((v_slug_ids ->> 'environment-variables')::uuid, 'error', v_err_id),
    ((v_slug_ids ->> 'docker')::uuid, 'error', v_err_id);

  -- =========================================================
  -- Extra flashcards para sa ilang core AI/architecture topics
  -- =========================================================
  insert into flashcards (article_id, front, back) values
    ((v_slug_ids ->> 'rag')::uuid, 'What does RAG stand for?', 'Retrieval-Augmented Generation'),
    ((v_slug_ids ->> 'rag')::uuid, 'Why use RAG instead of just fine-tuning?', 'Grounds answers in current, real data without retraining the model every time information changes'),
    ((v_slug_ids ->> 'rls')::uuid, 'What does RLS restrict?', 'Which rows a query can see or modify, based on policies tied to the current user'),
    ((v_slug_ids ->> 'rest-api')::uuid, 'Which HTTP methods are idempotent by convention?', 'GET, PUT, DELETE (POST is not, by default)'),
    ((v_slug_ids ->> 'microservices')::uuid, 'What is the main trade-off of microservices vs a monolith?', 'Independent scalability/deployment in exchange for added operational complexity');

end $$;
