"use server";

import { searchArticles } from "@/lib/actions/search";
import { generateAnswer } from "@/lib/ai/gemini";
import type { ArticleType } from "@/types/database";

// Phase 4 (slice 1): "Ask my encyclopedia" — retrieval muna sa existing
// full-text search (search_vector, see lib/actions/search.ts) bago
// pumunta sa semantic/pgvector retrieval sa Phase 5. Hindi pa ito totoong
// multi-turn RAG (walang conversation memory na ipinapasa pabalik sa
// retrieval) — bawat tanong, sariling search + sariling Gemini call.

export interface AskSource {
  id: string;
  title: string;
  slug: string;
  type: ArticleType;
}

export interface AskResult {
  answer: string;
  sources: AskSource[];
}

const MAX_SOURCES = 5;
// Per-article context trim — sapat para makapagbigay ng buong sagot ang
// model, pero hindi masyadong malaki na mauubos ang context window kapag
// maraming naka-match na article.
const MAX_CONTENT_CHARS = 1500;

export async function askEncyclopedia(question: string): Promise<AskResult> {
  const trimmed = question.trim();
  if (!trimmed) {
    throw new Error("Walang tanong.");
  }

  const matches = await searchArticles(trimmed);
  const top = matches.slice(0, MAX_SOURCES);

  if (top.length === 0) {
    return {
      answer:
        "Wala akong nahanap na article na may kaugnayan sa tanong mo. Subukan mong i-reword, o baka wala ka pang naisulat na article tungkol dito.",
      sources: [],
    };
  }

  const context = top
    .map((a, i) => {
      const body = a.content.slice(0, MAX_CONTENT_CHARS);
      return `[${i + 1}] ${a.title} (${a.type})\n${body}`;
    })
    .join("\n\n---\n\n");

  const prompt = `Ikaw ang personal na encyclopedia assistant ng user. Sagutin ang tanong niya base LANG sa mga article excerpt sa ibaba — huwag gumamit ng panlabas na kaalaman. Kung hindi sapat ang context para sagutin nang tama, sabihin iyon sa halip na manghula.

Kapag gumamit ka ng impormasyon mula sa isang article, i-cite ito gamit ang bracket number nito, hal. [1]. Maikli at direkta ang sagot, parang isang kasamahang developer na sumasagot, hindi generic AI essay.

=== ARTICLES ===
${context}
=== KATAPUSAN NG ARTICLES ===

Tanong: ${trimmed}`;

  const answer = await generateAnswer(prompt);

  return {
    answer,
    sources: top.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      type: a.type,
    })),
  };
}
