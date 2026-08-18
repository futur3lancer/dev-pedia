"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { articleTypePath } from "@/lib/utils";
import { tryGenerateArticleEmbedding } from "@/lib/actions/embeddings";
import { ARTICLE_COLUMNS } from "@/lib/supabase/columns";
import type { Article, ArticleStatus, ArticleType } from "@/types/database";

export interface CreateArticleInput {
  type: ArticleType;
  title: string;
  slug: string;
  content: string;
  subcategory?: string;
  excerpt?: string;
  status?: ArticleStatus;
}

// Phase 1: base CRUD lang, walang relations/tags/search pa.
export async function createArticle(input: CreateArticleInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("articles")
    .insert({
      user_id: user.id,
      type: input.type,
      title: input.title,
      slug: input.slug,
      content: input.content,
      subcategory: input.subcategory ?? null,
      excerpt: input.excerpt ?? null,
      status: input.status ?? "draft",
    })
    .select(ARTICLE_COLUMNS)
    .single();

  if (error) throw error;

  // Best-effort — see lib/actions/embeddings.ts para sa buong rationale.
  // Bagong article palagi, kaya laging tinatawag (walang laman pa ang
  // embedding).
  await tryGenerateArticleEmbedding(data.id);

  revalidatePath(`/${articleTypePath(input.type)}`);
  return data;
}

export async function updateArticle(
  id: string,
  updates: Partial<CreateArticleInput>
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("articles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(ARTICLE_COLUMNS)
    .single();

  if (error) throw error;

  // Muling i-generate lang ang embedding kung nagbago ang title o content
  // — hindi kailangan kung status/tags/etc. lang ang na-update, para
  // hindi mag-aksaya ng Gemini call sa bawat maliit na edit.
  if (updates.title !== undefined || updates.content !== undefined) {
    await tryGenerateArticleEmbedding(data.id);
  }

  revalidatePath(`/${articleTypePath(data.type)}/${data.slug}`);
  revalidatePath("/dashboard");
  return data;
}

export async function deleteArticle(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) throw error;
}

export interface ListArticlesFilters {
  type?: ArticleType;
  status?: ArticleStatus;
  subcategory?: string;
}

// Ginagamit ng GET /api/articles — parehong filters (type/status/subcategory)
// gaya ng listing pages sa dashboard, pero exposed bilang query params.
export async function listArticles(
  filters: ListArticlesFilters = {}
): Promise<Article[]> {
  const supabase = createClient();
  let request = supabase
    .from("articles")
    .select(ARTICLE_COLUMNS)
    .order("updated_at", { ascending: false });

  if (filters.type) request = request.eq("type", filters.type);
  if (filters.status) request = request.eq("status", filters.status);
  if (filters.subcategory) request = request.eq("subcategory", filters.subcategory);

  const { data, error } = await request;
  if (error) throw error;
  return data;
}

export async function getArticleBySlug(type: ArticleType, slug: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_COLUMNS)
    .eq("type", type)
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data;
}

// Phase 3 (slice 4): quick Draft <-> Published toggle mula sa article view
// page mismo — hindi na kailangang pumunta sa buong editor para lang
// baguhin ang status. Hiwalay ito sa `updateArticle` dahil kailangan din
// i-revalidate ang index listing (`/${type}`), hindi lang ang detail page —
// otherwise hindi mag-a-update agad ang badge sa listing pagbalik doon.
export async function setArticleStatus(
  id: string,
  status: ArticleStatus
): Promise<Article> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("articles")
    .update({ status })
    .eq("id", id)
    .select(ARTICLE_COLUMNS)
    .single();

  if (error) throw error;

  const basePath = `/${articleTypePath(data.type)}`;
  revalidatePath(basePath);
  revalidatePath(`${basePath}/${data.slug}`);
  revalidatePath("/dashboard");
  return data;
}

// Phase 2 (slice 6): Favorites + Recently Viewed. Simpleng columns na lang
// sa articles (is_favorite, last_viewed_at) — walang bagong table.

export async function toggleFavorite(id: string, isFavorite: boolean): Promise<Article> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("articles")
    .update({ is_favorite: isFavorite })
    .eq("id", id)
    .select(ARTICLE_COLUMNS)
    .single();

  if (error) throw error;
  revalidatePath("/dashboard");
  revalidatePath(`/${articleTypePath(data.type)}/${data.slug}`);
  return data;
}

// Tinatawag tuwing binubuksan ang isang article page — walang balik na
// value dahil "fire and forget" lang ito mula sa isang client wrapper.
export async function recordView(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("articles")
    .update({ last_viewed_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function listFavorites(): Promise<Article[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_COLUMNS)
    .eq("is_favorite", true)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function listRecentlyViewed(limit = 8): Promise<Article[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("articles")
    .select(ARTICLE_COLUMNS)
    .not("last_viewed_at", "is", null)
    .order("last_viewed_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

// Phase 3 (slice 4): Changelog widget sa Dashboard — "updated N articles
// this week". "Week" dito ay rolling 7 days, hindi calendar week (Monday-
// start), mas simple at mas tumpak kung kailan ka huling gumawa ng edit.
// "Na-edit" = updated_at na huli pa sa created_at, para hindi kasama ang
// bagong-gawang article na hindi pa naman talaga na-revise — kung hindi,
// bawat bagong article ay "edit" na agad dahil pareho ang dalawang
// timestamp nang bahagya lang sila magkalayo sa insert.
export interface RecentEdit {
  id: string;
  title: string;
  type: ArticleType;
  updated_at: string;
}

export async function listRecentEdits(limit = 5): Promise<{
  count: number;
  edits: RecentEdit[];
}> {
  const supabase = createClient();
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("articles")
    .select("id, title, type, updated_at, created_at")
    .gte("updated_at", sevenDaysAgo)
    .order("updated_at", { ascending: false });

  if (error) throw error;

  const edits = data.filter((a) => a.updated_at > a.created_at);
  return { count: edits.length, edits: edits.slice(0, limit) };
}
