"use server";

import { createClient } from "@/lib/supabase/server";
import type { ArticleStatus, ArticleType, RelationType } from "@/types/database";

// Phase 5 (slice 1): Knowledge graph visualization. Walang bagong table
// dito — ginagamit lang ang existing `articles` + `article_relations`
// (parehong Phase 2). Isang query lang para sa buong graph (hindi per-
// article gaya ng getRelatedArticles sa lib/actions/relations.ts), dahil
// kailangan makita lahat ng nodes + edges nang sabay para sa visualization.

export interface GraphNode {
  id: string;
  type: ArticleType;
  title: string;
  slug: string;
  status: ArticleStatus;
}

export interface GraphEdge {
  id: string;
  source: string; // article_id
  target: string; // related_article_id
  relationType: RelationType;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export async function getGraphData(): Promise<GraphData> {
  const supabase = createClient();

  const [{ data: articles, error: articlesError }, { data: relations, error: relationsError }] =
    await Promise.all([
      supabase
        .from("articles")
        .select("id, type, title, slug, status"),
      supabase
        .from("article_relations")
        .select("id, article_id, related_article_id, relation_type"),
    ]);

  if (articlesError) throw articlesError;
  if (relationsError) throw relationsError;

  const nodes: GraphNode[] = (articles ?? []).map((a) => ({
    id: a.id,
    type: a.type,
    title: a.title,
    slug: a.slug,
    status: a.status,
  }));

  // I-drop ang anumang edge na tumuturo sa article na wala (na-delete na)
  // sa halip na basta mag-crash ang layout kapag walang mahanap na node.
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges: GraphEdge[] = (relations ?? [])
    .filter((r) => nodeIds.has(r.article_id) && nodeIds.has(r.related_article_id))
    .map((r) => ({
      id: r.id,
      source: r.article_id,
      target: r.related_article_id,
      relationType: r.relation_type,
    }));

  return { nodes, edges };
}
