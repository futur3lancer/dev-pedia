"use server";

import { searchArticles } from "@/lib/actions/search";
import { generateAnswer } from "@/lib/ai/gemini";
import type { Article } from "@/types/database";

// Phase 4 (slice 2): "AI search" — simple version muna, keyword expansion
// lang (hindi pa embeddings, see docs/03-roadmap.md §5). Ibang bagay ito
// sa "Ask my encyclopedia" (lib/actions/ask.ts): dun, sinasagot ng AI ang
// tanong gamit ang laman ng mga article. Dito, ang AI ay isang query
// planner lang — gumagawa ito ng ilang keyword phrase mula sa natural-
// language na tanong, tapos ang existing na tsvector search
// (searchArticles) pa rin ang gumagawa ng totoong paghahanap. Mas mura,
// mas mabilis, at mas madaling i-debug kaysa ipahanap lahat sa AI.

export interface AiSearchResult {
  keywords: string[];
  results: Article[];
}

const MAX_KEYWORDS = 6;
const MAX_RESULTS = 20;

function parseKeywords(raw: string): string[] {
  // Tanggalin ang mga markdown code fence kung sakaling nag-wrap ang model
  // ng ```json ... ``` sa paligid ng sagot, kahit sinabihan na "JSON only".
  const cleaned = raw.replace(/```json|```/gi, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((k): k is string => typeof k === "string")
        .map((k) => k.trim())
        .filter(Boolean)
        .slice(0, MAX_KEYWORDS);
    }
  } catch {
    // bumagsak sa fallback sa baba
  }

  // Fallback: hatiin na lang bawat linya/comma kung sumablay ang JSON
  // parsing — mas mabuting may resulta kaysa mag-error agad.
  return cleaned
    .split(/[\n,]/)
    .map((k) => k.replace(/^[-*\d.\s"]+|["\s]+$/g, "").trim())
    .filter(Boolean)
    .slice(0, MAX_KEYWORDS);
}

export async function aiSearchArticles(
  naturalQuery: string
): Promise<AiSearchResult> {
  const trimmed = naturalQuery.trim();
  if (!trimmed) return { keywords: [], results: [] };

  const prompt = `Ang user ay may personal na developer encyclopedia app (mga article tungkol sa concepts, technologies, errors/solutions, architecture, projects). Ito ang tanong niya sa natural language:

"${trimmed}"

Gumawa ng 3-6 maikling keyword search phrase (1-4 words bawat isa) na pwedeng gamitin sa isang full-text search engine para makahanap ng mga kaugnay na article. Isipin ang mga terminong technical na malamang nakasulat sa mismong article (hal. pangalan ng technology, error message fragment, konsepto) sa halip na ulitin lang ang tanong nang buo.

Sagutin gamit LANG ng isang JSON array ng strings, walang ibang teksto, walang markdown code fence. Halimbawa: ["postgres connection timeout", "supabase pooler", "pgbouncer"]`;

  const raw = await generateAnswer(prompt, { temperature: 0.2 });
  const keywords = parseKeywords(raw);

  // Laging isama rin ang orihinal na buong tanong bilang isa pang query —
  // sakaling literal na nakasulat sa article ang exact phrase, hindi lang
  // ang mga na-expand na keyword.
  const queries = keywords.length > 0 ? keywords : [trimmed];
  if (!queries.includes(trimmed)) queries.push(trimmed);

  const resultLists = await Promise.all(queries.map((q) => searchArticles(q)));

  // Merge + dedupe, pinaka-una ang articles na tinamaan ng pinakamaraming
  // keyword (proxy para sa "pinaka-relevant").
  const hitCount = new Map<string, number>();
  const byId = new Map<string, Article>();

  for (const list of resultLists) {
    for (const article of list) {
      byId.set(article.id, article);
      hitCount.set(article.id, (hitCount.get(article.id) ?? 0) + 1);
    }
  }

  const merged = Array.from(byId.values()).sort((a, b) => {
    const byHits = (hitCount.get(b.id) ?? 0) - (hitCount.get(a.id) ?? 0);
    if (byHits !== 0) return byHits;
    return (
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  });

  return { keywords, results: merged.slice(0, MAX_RESULTS) };
}
