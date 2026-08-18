# DevPedia — Markdown Import (Phase 7)

## 1. Layunin

Ngayon, ang tanging paraan para magkaroon ng laman ang isang article ay ang
mano-manong pag-type sa `ArticleEditor` (`components/editor/ArticleEditor.tsx`),
simula sa blangkong starter template mula `lib/markdown/templates.ts`. Kung may
existing na `.md` file ka na (halimbawa, luma mong notes, o galing sa ibang
tool), kailangan mo pang i-copy-paste at ayusin manually papasok sa
istruktura ng DevPedia (headings, "Related Concepts" section, atbp.).

Ang Markdown Import ay nagbibigay ng shortcut: mag-upload ng `.md` file, at
ang AI (parehong Gemini wrapper na ginagamit na ng `generateExcerpt`,
`explainConcept`, atbp. sa `lib/ai/gemini.ts`) ang bahalang i-restructure ito
papasok sa tamang template ng napiling `ArticleType`, bago ito ilagay sa
loob ng normal na `ArticleEditor` para sa review.

**Hindi kasama sa Phase 7 (deferred):**
- Bulk import (maraming files nang sabay) — isang file lang muna bawat import
- Auto-save nang diretso — laging dadaan muna sa editor review bago ma-save
- Import ng ibang format (`.txt`, `.docx`, atbp.) — `.md` lang muna

## 2. Saan ito pumapasok sa existing architecture

```
[.md file]
    │  (client-side file read)
    ▼
Import Dialog (bagong shared component)
    │  (raw markdown string + target ArticleType)
    ▼
Server Action: importMarkdown()  ← bago, sa lib/actions/articles.ts
    │  (prompt: raw content + template shape ng type)
    ▼
lib/ai/gemini.ts → generateAnswer()  ← existing, walang babaguhin dito
    │  (JSON response: title/slug/excerpt/content/subcategory/tags)
    ▼
ArticleEditor (existing component)
    │  (naka-prefill lang ang lahat ng fields, parang "New Article" state)
    ▼
User reviews/edits → "Save as Draft" / "Publish"  ← existing na save flow
```

Walang babaguhin sa `createArticle`/`updateArticle` (`lib/actions/articles.ts`)
mismo — ang import ay nauuwi lang sa parehong "may laman na nang editor
state" na parang normal na paggawa ng article, kaya ang pag-save mismo ay
ang existing na code path na rin.

## 3. UI Entry Points

Dalawang lugar (base sa napagkasunduan):

1. **Listing pages** (`encyclopedia/`, `concepts/`, `technologies/`,
   `architecture/` — apat na `page.tsx`) — bagong "Import Markdown" button
   katabi ng existing "New Article" button, sa parehong `ArticleCardGrid`
   header area.
2. **Loob ng editor** (`ArticleEditor.tsx`, create mode lang — walang saysay
   sa edit mode dahil may laman na ang article) — bagong "Import from .md"
   link/button malapit sa starter-template textarea, para sa taong nag-click
   na ng "New Article" pero naalala na may `.md` na pala siyang meron.

Parehong entry point ay nagbubukas ng parehong shared dialog/component
(iisang `MarkdownImportDialog`, hindi doble-doblehin ang logic).

## 4. Flow, hakbang-hakbang

1. Click "Import Markdown" → nagbubukas ang dialog, may file picker
   (`accept=".md"`).
2. Piliin ang file → babasahin client-side (`File.text()`), i-validate:
   - Hindi blangko
   - May reasonable max size (hal. 200KB — sapat na para sa kahit anong
     article, hindi dapat mas malaki pa sa isang buong libro)
3. Ipapakita agad ang isang "Converting…" state habang tumatawag sa bagong
   server action (`importMarkdown(rawContent, type)`).
4. Sa server: bubuoin ang prompt na naglalaman ng (a) raw markdown, (b) ang
   target template structure mula `lib/markdown/templates.ts` para sa
   partikular na `ArticleType`, (c) explicit na instruction na mag-respond
   lang sa JSON, walang preamble.
5. I-parse ang JSON response. Kung mabigo ang parsing (hindi valid JSON, o
   walang laman) → fallback: gamitin na lang ang raw markdown bilang
   `content`, at title mula sa unang `# Heading` (o filename kung wala) —
   huwag mag-error, para hindi mawala ang orihinal na binuksan ng user.
6. Isasara ang dialog, at ang `ArticleEditor` state (title, slug, excerpt,
   content, subcategory, tags) ay pupunuin ng resulta — parang normal na
   "New Article" state na lang, may laman na.
7. User: pwede pang baguhin kahit ano (parehong write/preview toggle na
   meron na), tapos "Save as Draft" o "Publish" — existing flow na, walang
   binago dito.

## 5. AI conversion contract

**Input sa prompt:**
- Raw markdown content (buo, walang truncation maliban kung sobrang haba)
- Ang target template (kunin mula `getStarterContent(type, "")` bilang
  "shape reference" — hindi kailangang gumawa ng bagong duplicate na
  template description sa prompt, gamitin na lang ang existing constant)
- Explicit constraint: JSON-only response, walang markdown code fence sa
  paligid ng JSON mismo

**Expected output shape:**
```ts
{
  title: string;
  slug: string;        // kebab-case, hango sa title
  excerpt: string;      // 1-2 sentence
  content: string;      // buong markdown, naka-fit na sa template sections
  subcategory: string | null;
  tags: string[];       // 0-5 suggested tags
}
```

**Prinsipyo sa conversion:** huwag magdagdag ng impormasyon na wala sa
orihinal na file — restructure at reorganize lang, hindi mag-imbento ng
bagong content. Kung may section sa template na walang katugmang laman sa
orihinal (hal. walang "My Notes" sa source), iwan na lang blangko/placeholder
sa halip na AI-hallucinate.

## 6. Edge cases

| Sitwasyon | Behavior |
|---|---|
| Blangkong file | Validation error bago pa tumawag sa AI — "Walang laman ang file." |
| Sobrang laki ng file | Validation error bago tumawag sa AI — iwasan ang malaking token cost/timeout |
| Hindi `.md` extension | Naka-block na sa file picker (`accept=".md"`), pero i-validate pa rin sa client bilang safety net |
| AI down / error mula Gemini | Ipapakita ang error message (parehong pattern ng existing `handleGenerateExcerpt`), pero mananatiling nakabukas ang dialog para masubukan ulit — hindi mawawala ang na-upload na file |
| Malabo/hindi maayos ma-parse ng AI ang response | Fallback sa raw content (tingnan #5 sa itaas ng Flow) sa halip na mag-throw |
| Duplicate slug pagka-save | Existing na behavior ng `createArticle` — walang bagong logic na kailangan dito |

## 7. Implementation phases (slices)

Hinati sa maliliit na slice para may checkpoint sa bawat isa — sundin ang
parehong pattern ng `03-roadmap.md` (bawat slice, may sariling "commit-able"
na resulta).

### Slice 1 — Shared import dialog (UI shell lang, walang AI pa)
- [ ] Bagong `components/editor/MarkdownImportDialog.tsx` — file picker,
      client-side validation (blangko/size), "Converting…" loading state,
      error display
- [ ] Placeholder na `onImport(content: string)` callback muna (wala pang
      AI call) — layunin: matiyak munang tama ang UX shell bago idugtong
      ang server logic

**DoD:** Kayang mag-upload ng `.md` file at makita ang raw content sa
console/preview, may validation na gumagana.

### Slice 2 — Server action + AI conversion
- [ ] Bagong `importMarkdown(rawContent: string, type: ArticleType)` sa
      `lib/actions/articles.ts` (o bagong `lib/actions/markdown-import.ts`
      kung gusto ihiwalay)
- [ ] Prompt construction gamit ang `getStarterContent` bilang template
      reference
- [ ] JSON parsing + fallback logic (tingnan #5 sa itaas)

**DoD:** Kayang tawagin ang action nang direkta (hal. via test script o
temporary button) at makakuha ng structured JSON pabalik mula sa totoong
`.md` file.

### Slice 3 — Wire dialog → editor prefill
- [ ] I-connect ang `MarkdownImportDialog` sa `importMarkdown` action
- [ ] Sa `ArticleEditor.tsx`: bagong prop/handler para tanggapin ang
      imported data at i-prefill ang lahat ng existing `useState` fields
      (title, slug, excerpt, content, subcategory, tags)
- [ ] "Import from .md" button sa loob ng editor (create mode lang)

**DoD:** End-to-end na gumagana ang buong flow mula sa loob ng editor —
upload → AI convert → naka-prefill na editor → pwedeng i-save.

### Slice 4 — Listing page entry points
- [ ] "Import Markdown" button sa apat na listing page
      (`encyclopedia/`, `concepts/`, `technologies/`, `architecture/`)
- [ ] Pag-click, bubukas ang parehong dialog, tapos mag-navigate papunta sa
      `/[type]/new` na naka-prefill (via query param, session storage, o
      direktang pag-render ng `ArticleEditor` sa parehong page kasama ang
      imported data)

**DoD:** Parehong entry point (listing page at editor) ay gumagana at
dumadaan sa iisang shared na logic — walang duplicated na import code.

### Slice 5 — Polish + edge case pass
- [ ] Subukan ang lahat ng edge case sa talahanayan (#6 sa itaas) nang
      manu-mano
- [ ] I-verify na tama ang mapping ng bawat `ArticleType` sa tamang
      template shape (encyclopedia/concept/experiment vs technology vs
      architecture — magkaiba ang sections base sa `04-content-templates.md`)
- [ ] UX polish: disable ang "Import" button habang naka-loading, tamang
      focus management sa dialog

**DoD:** Buong Phase 7 tapos na — production-ready ang import feature para
sa apat na Knowledge section.

## 8. Susunod pagkatapos ng Phase 7 (hindi pa saklaw dito)

- Bulk import (maramihang `.md` files nang sabay, hal. buong folder)
- Import mula sa ibang format (`.txt`, Notion export, atbp.)
- "Detect relations" pass pagkatapos mag-import (gamitin ang existing
  `lib/actions/detect-relations.ts` — AI suggestion ng possible
  `article_relations` batay sa na-import na content)
