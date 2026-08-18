// Phase 2: PostgreSQL full-text search (tsvector) + pg_trgm fuzzy title match.
// Phase 5: palitan/complement gamit ang pgvector semantic search.
//
// import { createClient } from "@/lib/supabase/server";
//
// export async function searchArticles(query: string) {
//   const supabase = createClient();
//   const { data, error } = await supabase
//     .from("articles")
//     .select("id, title, slug, type, excerpt")
//     .textSearch("search_vector", query, { type: "websearch" });
//   if (error) throw error;
//   return data;
// }

export {};
