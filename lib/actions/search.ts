"use server";

import { createClient } from "@/lib/supabase/server";
import { ARTICLE_COLUMNS } from "@/lib/supabase/columns";
import type { Article } from "@/types/database";

// Phase 2 (slice 5): search_vector (tsvector) para sa "totoong" full-text
// match (may weight: title > excerpt > content). Kapag walang nahanap dito
// (hal. typo o partial word), bumaba sa simpleng ILIKE gamit ang pg_trgm
// index bilang fallback — hindi pa "totoong" fuzzy ranking, pero sapat na
// para sa MVP. Tunay na semantic search (pgvector) ay nasa Phase 5.
export async function searchArticles(query: string): Promise<Article[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const supabase = createClient();

  const { data: ftsResults, error: ftsError } = await supabase
    .from("articles")
    .select(ARTICLE_COLUMNS)
    .textSearch("search_vector", trimmed, {
      type: "websearch",
      config: "english",
    })
    .order("updated_at", { ascending: false })
    .limit(20);

  if (ftsError) throw ftsError;
  if (ftsResults && ftsResults.length > 0) return ftsResults;

  const { data: fallbackResults, error: fallbackError } = await supabase
    .from("articles")
    .select(ARTICLE_COLUMNS)
    .ilike("title", `%${trimmed}%`)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (fallbackError) throw fallbackError;
  return fallbackResults ?? [];
}
