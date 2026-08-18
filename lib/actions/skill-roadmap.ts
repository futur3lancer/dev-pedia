"use server";

import { createClient } from "@/lib/supabase/server";
import type { ArticleStatus, ArticleType } from "@/types/database";

// Phase 5 (slice 4): Skill roadmap — "Visual na progress path (hal.
// React → Next.js → Auth → Deployment)" (03-roadmap.md §6). Walang
// bagong table dito, at walang bagong hiwalay na "curated path" na
// kailangan pang i-edit manually: ginamit na lang ang `depends-on`
// relation type na nasa `article_relations` na mismo (Phase 2), na
// dating ginagamit lang bilang generic knowledge-graph edge (slice 1)
// pero hindi pa bilang ordered sequence.
//
// Direksyon (see lib/actions/graph.ts + detect-relations.ts):
//   article_id --depends-on--> related_article_id
//   ibig sabihin "kailangan muna ang related_article_id (prerequisite)
//   bago ang article_id (dependent)".
//
// Isang "path" dito = isang connected component ng depends-on edges
// (undirected, para magkasama kahit branching ang dependencies), naka-
// topological sort (prerequisites muna) gamit ang Kahn's algorithm.
// Kung may cycle (posible dahil AI-detected/manual ang relations, walang
// DB-level constraint laban dito), inilalagay na lang sa hiwalay na
// "unresolved" bucket sa halip na mag-crash o mag-infinite loop.

export type RoadmapStepState = "done" | "next" | "locked";

export interface RoadmapStep {
  id: string;
  type: ArticleType;
  title: string;
  slug: string;
  status: ArticleStatus;
  state: RoadmapStepState;
  requiresTitles: string[];
}

export interface RoadmapPath {
  steps: RoadmapStep[];
  hasCycle: boolean;
}

export async function getSkillRoadmap(): Promise<RoadmapPath[]> {
  const supabase = createClient();

  const [{ data: articles, error: articlesError }, { data: relations, error: relationsError }] =
    await Promise.all([
      supabase.from("articles").select("id, type, title, slug, status"),
      supabase
        .from("article_relations")
        .select("article_id, related_article_id")
        .eq("relation_type", "depends-on"),
    ]);

  if (articlesError) throw articlesError;
  if (relationsError) throw relationsError;

  const articleById = new Map((articles ?? []).map((a) => [a.id, a]));

  // I-drop ang mga edge na tumuturo sa na-delete nang article, gaya ng
  // ginagawa na sa getGraphData.
  const edges = (relations ?? []).filter(
    (r) => articleById.has(r.article_id) && articleById.has(r.related_article_id)
  );

  if (edges.length === 0) return [];

  // requires[node] = listahan ng prerequisite ids (mga related_article_id
  // kung saan `node` ang article_id).
  const requires = new Map<string, string[]>();
  // requiredBy[node] = listahan ng dependent ids na nangangailangan sa node.
  const requiredBy = new Map<string, string[]>();
  // undirected adjacency, para sa connected components.
  const undirected = new Map<string, Set<string>>();

  function addUndirected(a: string, b: string) {
    if (!undirected.has(a)) undirected.set(a, new Set());
    if (!undirected.has(b)) undirected.set(b, new Set());
    undirected.get(a)!.add(b);
    undirected.get(b)!.add(a);
  }

  for (const edge of edges) {
    const dependent = edge.article_id;
    const prerequisite = edge.related_article_id;

    if (!requires.has(dependent)) requires.set(dependent, []);
    requires.get(dependent)!.push(prerequisite);

    if (!requiredBy.has(prerequisite)) requiredBy.set(prerequisite, []);
    requiredBy.get(prerequisite)!.push(dependent);

    addUndirected(dependent, prerequisite);
  }

  // Connected components via BFS sa undirected adjacency.
  const visited = new Set<string>();
  const components: string[][] = [];

  for (const nodeId of undirected.keys()) {
    if (visited.has(nodeId)) continue;
    const component: string[] = [];
    const queue = [nodeId];
    visited.add(nodeId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);
      for (const neighbor of undirected.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    components.push(component);
  }

  const paths: RoadmapPath[] = components.map((componentIds) => {
    const idSet = new Set(componentIds);

    // Kahn's algorithm: in-degree = bilang ng prerequisites (na nasa
    // parehong component) na kailangan munang ma-satisfy.
    const inDegree = new Map<string, number>();
    for (const id of componentIds) {
      const reqs = (requires.get(id) ?? []).filter((r) => idSet.has(r));
      inDegree.set(id, reqs.length);
    }

    const queue = componentIds.filter((id) => inDegree.get(id) === 0);
    const order: string[] = [];

    while (queue.length > 0) {
      // Stable-ish order: pinaka-maagang title muna kapag magkatabing
      // parehong in-degree 0, para hindi random ang pagkakasunod-sunod
      // sa magkakaibang render.
      queue.sort((a, b) =>
        (articleById.get(a)?.title ?? "").localeCompare(
          articleById.get(b)?.title ?? ""
        )
      );
      const current = queue.shift()!;
      order.push(current);

      for (const dependent of requiredBy.get(current) ?? []) {
        if (!idSet.has(dependent)) continue;
        const remaining = (inDegree.get(dependent) ?? 0) - 1;
        inDegree.set(dependent, remaining);
        if (remaining === 0) queue.push(dependent);
      }
    }

    const hasCycle = order.length < componentIds.length;
    // Kung may cycle, ilagay na lang sa dulo ang mga natitirang node
    // (hindi na-topologically-sort) sa halip na basta iwan sila.
    const orderedIds = hasCycle
      ? [...order, ...componentIds.filter((id) => !order.includes(id))]
      : order;

    const doneIds = new Set(
      orderedIds.filter((id) => articleById.get(id)?.status === "published")
    );

    const steps: RoadmapStep[] = orderedIds.map((id) => {
      const article = articleById.get(id)!;
      const reqs = (requires.get(id) ?? []).filter((r) => idSet.has(r));
      const requiresTitles = reqs.map((r) => articleById.get(r)?.title ?? "?");

      let state: RoadmapStepState;
      if (article.status === "published") {
        state = "done";
      } else if (reqs.every((r) => doneIds.has(r))) {
        state = "next";
      } else {
        state = "locked";
      }

      return {
        id,
        type: article.type,
        title: article.title,
        slug: article.slug,
        status: article.status,
        state,
        requiresTitles,
      };
    });

    return { steps, hasCycle };
  });

  // Pinakamahabang path muna — mas madalas ito ang pinaka-"meaningful" na
  // roadmap (hal. "React → Next.js → Auth → Deployment" vs isang
  // 2-node na fragment).
  paths.sort((a, b) => b.steps.length - a.steps.length);

  return paths;
}
