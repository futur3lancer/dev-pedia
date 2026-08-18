# DevPedia — Content Templates

## 1. Panimula

Ito ang mga markdown template na gagamitin sa loob ng editor (`components/editor/`), sundan ang `content` field ng `articles` table sa `02-database-schema.md`. Layunin nito: **consistent ang structure ng bawat entry**, kahit magkaiba ang `type` (encyclopedia, concept, technology, architecture, experiment) o kahit hiwalay na table (`errors`, `projects`).

Copy-paste mo na lang ang template, punan, i-save.

## 2. Article Template (Encyclopedia / Concept / Experiment)

Gamitin ito para sa `type = 'encyclopedia'`, `'concept'`, o `'experiment'`.

```markdown
# {Title}

## What is {Title}?

{1-3 sentence definition — diretso sa punto}

## Why It Matters

{Bakit importante malaman ito — practical na dahilan, hindi textbook definition}

## How It Works

{Explanation, pwedeng may diagram}

​```
Frontend
   ↓
HTTP Request
   ↓
API
   ↓
Backend
​```

## Example

​```ts
// concrete code example, hindi abstract
​```

## Related Concepts

→ {Concept A}
→ {Concept B}
→ {Concept C}

## My Notes

{Personal insight — bakit ganito ang naiintindihan mo dito, anong analogy ang gumana sa'yo, atbp. Ito ang layer na wala sa ordinary docs site.}

## Where I Used It

→ {Project A}
→ {Project B}
```

> Ang "Related Concepts" section dito ay hindi lang plain text — sa UI, dapat naka-link ito papunta sa ibang articles gamit ang `article_relations`. Ang "Where I Used It" naman ay auto-populated mula sa `article_references` (hindi manual na tina-type), kaya hindi na kailangang i-maintain nang manual.

## 3. Technology Template

Gamitin para sa `type = 'technology'` (hal. Supabase, Vercel, Gemini). Halos kapareho ng Article Template, pero may dagdag na "Sub-Concepts" section na nagpapakita ng "mga anak" nitong concepts.

```markdown
# {Technology Name}

## What is {Technology Name}?

{Short description}

## Sub-Concepts

→ {Sub-concept A}
→ {Sub-concept B}
→ {Sub-concept C}

## Why I Use It

{Practical reasoning}

## Common Pitfalls

{Mga bagay na madalas ikamali — cross-reference sa Error Encyclopedia kung meron}

## Related Concepts

→ {Concept A}
→ {Concept B}

## Where I Used It

→ {Project A}
```

## 4. Architecture Entry Template

Gamitin para sa `type = 'architecture'`. Ang mga field na naka-**bold** dito ay direktang naka-map sa `architecture_details` table (`when_to_use`, `when_not_to_use`, `advantages`, `disadvantages`, `diagram`) — kaya sa UI, pwede itong i-render bilang structured blocks, hindi lang plain markdown text.

```markdown
# {Architecture Pattern Name}

## Definition

{1-2 paragraph explanation}

## When to Use

- {Scenario A}
- {Scenario B}

## When NOT to Use

- {Scenario A}
- {Scenario B}

## Advantages

- {Advantage A}
- {Advantage B}

## Disadvantages

- {Disadvantage A}
- {Disadvantage B}

## Diagram

​```
{ASCII o Mermaid diagram}
​```

## Example

{Concrete example — pwedeng reference sa isang totoong system}

## My Projects

→ {Project A} — {isang linyang paliwanag kung paano ginamit}
→ {Project B}

## Related Concepts

→ {Concept A}
→ {Concept B}
```

## 5. Error Entry Template

Gamitin ito para sa `errors` table (hiwalay na table, hindi bahagi ng `articles`). Ito yung sinabi mong pinaka-valuable na section.

```markdown
ERROR TITLE:
{Short, searchable title — hal. "Supabase Environment Variables Missing"}

TECHNOLOGY:
{hal. Next.js + Supabase + Vercel}

ERROR MESSAGE:
​```
{i-paste ang literal na error text}
​```

CAUSE:
{Bakit nangyari — root cause, hindi lang symptom}

SOLUTION:
{Hakbang-hakbang kung paano inayos — dapat kayang sundan ulit ng future-you}

RELATED CONCEPTS:
→ {Concept A}
→ {Concept B}
```

> **Tip:** Isulat ang CAUSE at SOLUTION na parang isusulat mo para sa ibang tao — kasi sa totoo lang, ang "ibang tao" na ito ay ikaw mismo, 6 buwan mula ngayon, na nakalimutan na kung paano mo ito inayos dati.

## 6. Project Entry Template

Gamitin para sa `projects` table. Ito ang bridge sa pagitan ng theory (`articles`) at totoong ginawa mong system.

```markdown
PROJECT NAME:
{hal. Dental Clinic AI}

DESCRIPTION:
{1-2 sentence na paglalarawan ng project}

STACK:
→ {Tech A}
→ {Tech B}
→ {Tech C}

ARCHITECTURE:
​```
Frontend
   ↓
Next.js API
   ↓
n8n
   ↓
Gemini
   ↓
Supabase
​```

CONCEPTS USED:
→ {Concept A}
→ {Concept B}
→ {Concept C}

STATUS:
{active / completed / archived}

NOTES:
{Anumang karagdagang context — challenges, learnings, atbp.}
```

> Ang "Concepts Used" dito ay dapat mag-generate ng `article_references` rows papunta sa mga related articles — hindi lang static na text. Ganito rin sinasabi sa `00-overview.md`: kapag nag-aaral ka ng isang concept, makikita mo agad kung saang project mo ito ginamit.

## 7. Bookmark Entry Template

Pinaka-simple, para sa `bookmarks` table — external references na worth balikan.

```markdown
TITLE:
{Pangalan ng resource}

URL:
{link}

DESCRIPTION:
{Bakit ito worth i-bookmark — isang linya lang}
```

## 8. Buod ng Mapping

| Template | Content Type / Table | Extra Structured Fields |
|---|---|---|
| Article | `articles` (encyclopedia / concept / experiment) | — |
| Technology | `articles` (technology) | — |
| Architecture Entry | `articles` (architecture) + `architecture_details` | when_to_use, when_not_to_use, advantages, disadvantages, diagram |
| Error Entry | `errors` | technology[], error_text, cause, solution |
| Project Entry | `projects` | stack[], architecture_notes, status |
| Bookmark Entry | `bookmarks` | url |

## 9. Susunod

Kumpleto na ang buong planning doc set:

| Doc | Status |
|---|---|
| `00-overview.md` | ✅ |
| `01-architecture.md` | ✅ |
| `02-database-schema.md` | ✅ |
| `03-roadmap.md` | ✅ |
| `04-content-templates.md` | ✅ (ito) |

Susunod na hakbang: simulan na ang Phase 1 sa `03-roadmap.md` — Next.js setup, Supabase project, at ang unang migration ng `articles` table mula sa `02-database-schema.md`.
