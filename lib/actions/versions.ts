"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { articleTypePath } from "@/lib/utils";
import type { Article, ArticleVersion } from "@/types/database";

// Phase 3 (slice 3): article_versions. Ang mismong snapshot ay nangyayari
// sa DB level (trigger, see 0008_phase3_article_versions.sql) tuwing
// magbago ang title o content — dito lang ang pag-list at pag-restore.

export async function listArticleVersions(articleId: string): Promise<ArticleVersion[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("article_versions")
    .select("*")
    .eq("article_id", articleId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// I-restore ang isang naunang version bilang kasalukuyang laman ng article.
// Dahil update ito sa `articles`, sasakyan ng snapshot trigger ang
// *kasalukuyang* (bago i-restore) na content bilang bago pa lang na
// version — kaya hindi permanenteng nawawala ang na-overwrite, "undo-able"
// pa rin ang restore mismo.
export async function restoreArticleVersion(versionId: string): Promise<Article> {
  const supabase = createClient();

  const { data: version, error: versionError } = await supabase
    .from("article_versions")
    .select("*")
    .eq("id", versionId)
    .single();

  if (versionError) throw versionError;

  const { data, error } = await supabase
    .from("articles")
    .update({
      title: version.title,
      content: version.content,
      excerpt: version.excerpt,
      status: version.status,
    })
    .eq("id", version.article_id)
    .select()
    .single();

  if (error) throw error;

  revalidatePath(`/${articleTypePath(data.type)}/${data.slug}`);
  revalidatePath(`/${articleTypePath(data.type)}/${data.slug}/edit`);
  revalidatePath("/dashboard");
  return data;
}
