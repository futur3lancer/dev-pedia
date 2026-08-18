"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type {
  ArticleSummary,
  RelatedArticle,
  RelationType,
} from "@/types/database";

// Phase 2 (slice 1): article_relations (knowledge graph edges).
// See docs/03-roadmap.md §3, docs/02-database-schema.md §6.

// Directional ang storage (article_id -> related_article_id) pero
// bidirectional ang display: kunin lahat ng edges kung saan lumalabas
// ang article, papunta man o pinupuntahan.
export async function getRelatedArticles(
  articleId: string
): Promise<RelatedArticle[]> {
  const supabase = createClient();

  const [{ data: outgoing, error: outError }, { data: incoming, error: inError }] =
    await Promise.all([
      supabase
        .from("article_relations")
        .select("id, relation_type, related:related_article_id(id, type, title, slug)")
        .eq("article_id", articleId),
      supabase
        .from("article_relations")
        .select("id, relation_type, related:article_id(id, type, title, slug)")
        .eq("related_article_id", articleId),
    ]);

  if (outError) throw outError;
  if (inError) throw inError;

  const outgoingMapped: RelatedArticle[] = (outgoing ?? []).map((row: any) => ({
    ...row.related,
    relation_id: row.id,
    relation_type: row.relation_type,
    direction: "outgoing" as const,
  }));

  const incomingMapped: RelatedArticle[] = (incoming ?? []).map((row: any) => ({
    ...row.related,
    relation_id: row.id,
    relation_type: row.relation_type,
    direction: "incoming" as const,
  }));

  return [...outgoingMapped, ...incomingMapped];
}

export async function addRelation(
  articleId: string,
  relatedArticleId: string,
  relationType: RelationType = "related"
) {
  const supabase = createClient();
  const { error } = await supabase.from("article_relations").insert({
    article_id: articleId,
    related_article_id: relatedArticleId,
    relation_type: relationType,
  });

  if (error) throw error;
  revalidatePath("/encyclopedia");
}

export async function removeRelation(relationId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("article_relations")
    .delete()
    .eq("id", relationId);

  if (error) throw error;
  revalidatePath("/encyclopedia");
}

// Simple ILIKE title search — panandaliang stand-in ito bago dumating
// ang tsvector search sa ibang bahagi ng Phase 2. Ginagamit ng
// RelatedConceptsEditor picker.
export async function searchArticlesForPicker(
  query: string,
  excludeArticleId?: string
): Promise<ArticleSummary[]> {
  if (!query.trim()) return [];

  const supabase = createClient();
  let request = supabase
    .from("articles")
    .select("id, type, title, slug")
    .ilike("title", `%${query.trim()}%`)
    .limit(8);

  if (excludeArticleId) {
    request = request.neq("id", excludeArticleId);
  }

  const { data, error } = await request;

  if (error) throw error;
  return data;
}
