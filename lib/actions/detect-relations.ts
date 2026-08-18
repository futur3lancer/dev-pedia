"use server";

import { createClient } from "@/lib/supabase/server";
import { generateAnswer } from "@/lib/ai/gemini";
import { getRelatedArticles } from "@/lib/actions/relations";
import type { ArticleType, RelationType } from "@/types/database";

// Phase 4 (slice 7): "Detect related concepts" — AI suggestion ng posibleng
// article_relations. Approve/reject na lang sa UI, HINDI ito nagda-direct
// insert sa article_relations — kaya walang bagong server action na
// "insert"; ginagamit na lang ulit ang existing addRelation() (lib/actions/
// relations.ts) sa client kapag "approve" ang ginawa ng user.
//
// Dahil wala pang embeddings (Phase 5 pa iyon), ang "detection" dito ay:
// ipadala sa Gemini ang title/content ng kasalukuyang article + listahan
// ng candidate articles (title + excerpt lang, hindi buong content, para
// hindi sumabog ang prompt), tapos hilingin na piliin kung alin dito ang
// talagang may kaugnayan.

export interface DetectedRelation {
  id: string;
  type: ArticleType;
  title: string;
  slug: string;
  suggestedRelationType: RelationType;
  reason: string;
}

const MAX_CONTENT_CHARS = 3000;
const MAX_CANDIDATES = 60;
const VALID_RELATION_TYPES: RelationType[] = [
  "related",
  "parent-of",
  "used-with",
  "depends-on",
];

function parseSuggestions(
  raw: string
): { index: number; relationType: RelationType; reason: string }[] {
  const cleaned = raw.replace(/```json|```/gi, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      "Hindi ma-parse ang suggestions na ibinalik ng AI. Subukan ulit."
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Hindi inaasahang format ng suggestions mula sa AI.");
  }

  const out: { index: number; relationType: RelationType; reason: string }[] = [];
  for (const item of parsed) {
    const index = (item as any)?.index;
    const relationType = (item as any)?.relationType;
    const reason = (item as any)?.reason;
    if (
      typeof index !== "number" ||
      typeof reason !== "string" ||
      !VALID_RELATION_TYPES.includes(relationType)
    ) {
      continue; // laktawan ang malformed item sa halip na i-fail lahat
    }
    out.push({ index, relationType, reason });
  }
  return out;
}

export async function detectRelatedConcepts(
  articleId: string
): Promise<DetectedRelation[]> {
  const supabase = createClient();

  const [{ data: article, error: articleError }, existing] = await Promise.all([
    supabase
      .from("articles")
      .select("id, title, type, content")
      .eq("id", articleId)
      .single(),
    getRelatedArticles(articleId),
  ]);

  if (articleError) throw articleError;
  if (!article) throw new Error("Article not found");

  const alreadyLinkedIds = new Set(existing.map((r) => r.id));
  alreadyLinkedIds.add(article.id);

  const { data: candidates, error: candidatesError } = await supabase
    .from("articles")
    .select("id, type, title, slug, excerpt")
    .neq("id", article.id)
    .order("updated_at", { ascending: false })
    .limit(MAX_CANDIDATES + alreadyLinkedIds.size);

  if (candidatesError) throw candidatesError;

  const filtered = (candidates ?? [])
    .filter((c) => !alreadyLinkedIds.has(c.id))
    .slice(0, MAX_CANDIDATES);

  if (filtered.length === 0) {
    return [];
  }

  const candidateList = filtered
    .map(
      (c, i) =>
        `[${i}] (${c.type}) ${c.title}${c.excerpt ? ` — ${c.excerpt}` : ""}`
    )
    .join("\n");

  const prompt = `Ito ang isang article sa personal na developer encyclopedia ng user:

Title: ${article.title} (${article.type})
Content:
${article.content.slice(0, MAX_CONTENT_CHARS)}

Ito naman ang listahan ng ibang articles na naka-index [0], [1], atbp:
${candidateList}

Alin sa mga naka-listang article ang talagang may malinaw na kaugnayan sa unang article (hindi malabo, hindi basta parehong general topic lang)? Para sa bawat isa na piliin mo, magbigay ng pinaka-angkop na relation type mula sa apat na ito LANG: "related" (pangkalahatang kaugnayan), "parent-of" (kapag ang unang article ay mas malaking konsepto/technology na kinabibilangan ng candidate), "used-with" (madalas magkasama sa paggamit), "depends-on" (kailangan ng candidate bago magamit/maintindihan ang unang article).

Sagutin gamit LANG ng isang JSON array, walang ibang teksto, walang markdown code fence. Bawat item ay object na may fields:
- "index": integer, tumutugma sa bracket number sa listahan sa itaas
- "relationType": isa sa "related" | "parent-of" | "used-with" | "depends-on"
- "reason": maikling paliwanag (1 sentence) kung bakit related

Kung wala talagang malinaw na kaugnayan sa listahan, ibalik ang walang laman na array [].`;

  const raw = await generateAnswer(prompt, { temperature: 0.2 });
  const suggestions = parseSuggestions(raw);

  const results: DetectedRelation[] = [];
  for (const s of suggestions) {
    const candidate = filtered[s.index];
    if (!candidate) continue;
    results.push({
      id: candidate.id,
      type: candidate.type,
      title: candidate.title,
      slug: candidate.slug,
      suggestedRelationType: s.relationType,
      reason: s.reason,
    });
  }

  return results;
}
