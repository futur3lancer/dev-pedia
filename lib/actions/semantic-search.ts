"use server";

import { createClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/ai/gemini";
import type { Article } from "@/types/database";

// Phase 5 (slice 2): Semantic search — complement (hindi kapalit) ng
// existing tsvector search (lib/actions/search.ts). Nangangailangan ito ng
// naka-generate nang embedding sa parehong query AT sa mga article
// (articles.embedding, see migration 0009 + lib/actions/embeddings.ts) —
// kung marami pang articles na kulang ng embedding (bago pa ang column),
// hindi sila lalabas dito hangga't hindi na-backfill.

export interface SemanticSearchResult {
  id: string;
  type: Article["type"];
  title: string;
  slug: string;
  excerpt: string | null;
  status: Article["status"];
  similarity: number;
  belowThreshold: boolean;
}

const MATCH_COUNT = 15;

// MIN_SIMILARITY (bandwidth-audit follow-up, post-Phase-5): dating
// hardcoded 0.55 na naka-comment na "approximate lang, hindi pa
// calibrated". Hindi ito ma-calibrate nang tama nang walang totoong
// query/article pairs mula sa live GEMINI_API_KEY at totoong content —
// walang paraan para malaman kung saan talaga tumataas ang noise sa
// totoong dataset mo nang hindi ito talaga sinusubukan. Dalawang bagay
// na lang ang ginawa dito sa halip na basta manghula ng bagong number:
//
//   1. Env var na ngayon ito (SEMANTIC_SEARCH_MIN_SIMILARITY), hindi na
//      naka-code lang — pwede mo nang i-adjust nang hindi na kailangang
//      mag-deploy ulit, once may sapat ka nang totoong data para makita
//      kung saan talaga bumababa ang relevance.
//   2. Hindi na tinatanggal sa server side ang mga below-threshold na
//      resulta — kasama pa rin sila sa return value (may `belowThreshold`
//      flag), tapos ang UI (search/page.tsx) na ang nagpapakita sa kanila
//      sa hiwalay na "Lower confidence" section. Kaya makikita mo ang
//      buong spread ng similarity scores sa totoong queries mo — doon mo
//      makikita kung saan talaga bumabagsak ang relevance, at doon ka
//      pwede mag-set ng bagong default kung kailangan.
const MIN_SIMILARITY = Number(
  process.env.SEMANTIC_SEARCH_MIN_SIMILARITY ?? "0.55"
);

export async function semanticSearchArticles(
  query: string
): Promise<SemanticSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const queryEmbedding = await generateEmbedding(trimmed, "RETRIEVAL_QUERY");

  // Plain number array dito (hindi JSON.stringify'd, kabaligtaran ng
  // ginagawa sa embeddings.ts para sa direktang table update) — iba ang
  // paraan ng PostgREST sa pag-bind ng RPC function parameters (type-aware
  // batay sa function signature) kumpara sa pag-encode ng column values sa
  // isang regular na table insert/update.
  const { data, error } = await supabase.rpc("match_articles", {
    query_embedding: queryEmbedding,
    match_owner_id: user.id,
    match_count: MATCH_COUNT,
  });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    status: row.status,
    similarity: row.similarity,
    belowThreshold: row.similarity < MIN_SIMILARITY,
  }));
}

