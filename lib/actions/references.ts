"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ArticleSummary, ErrorEntry, Project } from "@/types/database";

// Phase 2 (slice 3): article_references. Polymorphic ang `reference_id`
// (walang FK sa DB level — projects.id o errors.id depende sa
// reference_type), kaya dalawang hakbang ang mga query dito: kunin muna
// ang reference rows, tapos i-fetch ang aktwal na projects/errors sa
// hiwalay na call. See docs/02-database-schema.md §7.

export interface ProjectReference {
  reference_id: string; // article_references.id
  project: Project;
}

// "Where I Used It" sa article page.
export async function getProjectReferencesForArticle(
  articleId: string
): Promise<ProjectReference[]> {
  const supabase = createClient();

  const { data: refs, error: refError } = await supabase
    .from("article_references")
    .select("id, reference_id")
    .eq("article_id", articleId)
    .eq("reference_type", "project");

  if (refError) throw refError;
  if (!refs || refs.length === 0) return [];

  const { data: projects, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .in(
      "id",
      refs.map((r) => r.reference_id)
    );

  if (projectError) throw projectError;

  const projectsById = new Map((projects ?? []).map((p) => [p.id, p]));
  return refs
    .map((r) => {
      const project = projectsById.get(r.reference_id);
      return project ? { reference_id: r.id, project } : null;
    })
    .filter((r): r is ProjectReference => r !== null);
}

// "Concepts Used" sa project page.
export async function getConceptsForProject(
  projectId: string
): Promise<{ reference_id: string; article: ArticleSummary }[]> {
  const supabase = createClient();

  const { data: refs, error: refError } = await supabase
    .from("article_references")
    .select("id, article_id")
    .eq("reference_type", "project")
    .eq("reference_id", projectId);

  if (refError) throw refError;
  if (!refs || refs.length === 0) return [];

  const { data: articles, error: articleError } = await supabase
    .from("articles")
    .select("id, type, title, slug")
    .in(
      "id",
      refs.map((r) => r.article_id)
    );

  if (articleError) throw articleError;

  const articlesById = new Map((articles ?? []).map((a) => [a.id, a]));
  return refs
    .map((r) => {
      const article = articlesById.get(r.article_id);
      return article ? { reference_id: r.id, article } : null;
    })
    .filter(
      (r): r is { reference_id: string; article: ArticleSummary } => r !== null
    );
}

export async function addProjectReference(articleId: string, projectId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("article_references").insert({
    article_id: articleId,
    reference_type: "project",
    reference_id: projectId,
  });

  if (error) throw error;
  revalidatePath("/projects");
}

export async function removeReference(referenceId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("article_references")
    .delete()
    .eq("id", referenceId);

  if (error) throw error;
  revalidatePath("/projects");
}

// Ginagamit ng "Where I Used It" picker sa article page (maghanap ng project).
export async function searchProjectsForPicker(query: string): Promise<Project[]> {
  if (!query.trim()) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .ilike("name", `%${query.trim()}%`)
    .limit(8);

  if (error) throw error;
  return data;
}

// =========================================================
// Errors (kaparehong pattern ng Projects sa taas, pero
// reference_type = 'error' at title/technology ang schema)
// =========================================================

export interface ErrorReference {
  reference_id: string; // article_references.id
  error: ErrorEntry;
}

// "Where I Encountered It" sa article page.
export async function getErrorReferencesForArticle(
  articleId: string
): Promise<ErrorReference[]> {
  const supabase = createClient();

  const { data: refs, error: refError } = await supabase
    .from("article_references")
    .select("id, reference_id")
    .eq("article_id", articleId)
    .eq("reference_type", "error");

  if (refError) throw refError;
  if (!refs || refs.length === 0) return [];

  const { data: errors, error: errorError } = await supabase
    .from("errors")
    .select("*")
    .in(
      "id",
      refs.map((r) => r.reference_id)
    );

  if (errorError) throw errorError;

  const errorsById = new Map((errors ?? []).map((e) => [e.id, e]));
  return refs
    .map((r) => {
      const errorEntry = errorsById.get(r.reference_id);
      return errorEntry ? { reference_id: r.id, error: errorEntry } : null;
    })
    .filter((r): r is ErrorReference => r !== null);
}

// "Related Concepts" sa error detail page.
export async function getConceptsForError(
  errorId: string
): Promise<{ reference_id: string; article: ArticleSummary }[]> {
  const supabase = createClient();

  const { data: refs, error: refError } = await supabase
    .from("article_references")
    .select("id, article_id")
    .eq("reference_type", "error")
    .eq("reference_id", errorId);

  if (refError) throw refError;
  if (!refs || refs.length === 0) return [];

  const { data: articles, error: articleError } = await supabase
    .from("articles")
    .select("id, type, title, slug")
    .in(
      "id",
      refs.map((r) => r.article_id)
    );

  if (articleError) throw articleError;

  const articlesById = new Map((articles ?? []).map((a) => [a.id, a]));
  return refs
    .map((r) => {
      const article = articlesById.get(r.article_id);
      return article ? { reference_id: r.id, article } : null;
    })
    .filter(
      (r): r is { reference_id: string; article: ArticleSummary } => r !== null
    );
}

export async function addErrorReference(articleId: string, errorId: string) {
  const supabase = createClient();
  const { error } = await supabase.from("article_references").insert({
    article_id: articleId,
    reference_type: "error",
    reference_id: errorId,
  });

  if (error) throw error;
  revalidatePath("/errors");
}

// Ginagamit ng "Where I Encountered It" picker sa article page.
export async function searchErrorsForPicker(query: string): Promise<ErrorEntry[]> {
  if (!query.trim()) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("errors")
    .select("*")
    .ilike("title", `%${query.trim()}%`)
    .limit(8);

  if (error) throw error;
  return data;
}
