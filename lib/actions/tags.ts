"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import type { Tag } from "@/types/database";

// Phase 2 (slice 1): tags + article_tags. See docs/03-roadmap.md §3.

export async function listTags(): Promise<Tag[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name");

  if (error) throw error;
  return data;
}

export async function getArticleTags(articleId: string): Promise<Tag[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("article_tags")
    .select("tags(*)")
    .eq("article_id", articleId);

  if (error) throw error;
  // supabase-js returns the joined row nested under `tags`
  return (data ?? []).map((row: any) => row.tags).filter(Boolean);
}

// Ginagamit ng TagInput — kunin ang tag kung meron na (by slug), o gumawa
// ng bago. Isa itong "find or create" para hindi kailangan ng separate
// "manage tags" UI para lang makapag-tag.
async function findOrCreateTag(name: string): Promise<Tag> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const slug = slugify(name);
  if (!slug) throw new Error("Invalid tag name");

  const { data: existing, error: findError } = await supabase
    .from("tags")
    .select("*")
    .eq("user_id", user.id)
    .eq("slug", slug)
    .maybeSingle();

  if (findError) throw findError;
  if (existing) return existing;

  const { data: created, error: createError } = await supabase
    .from("tags")
    .insert({ user_id: user.id, name: name.trim(), slug })
    .select()
    .single();

  if (createError) throw createError;
  return created;
}

// Pinapalitan ang buong tag set ng isang article sa isang call — mas
// simple sa TagInput kaysa mag-diff ng add/remove sa client.
export async function setArticleTags(
  articleId: string,
  tagNames: string[]
): Promise<Tag[]> {
  const supabase = createClient();

  const uniqueNames = Array.from(
    new Set(tagNames.map((n) => n.trim()).filter(Boolean))
  );
  const tags = await Promise.all(uniqueNames.map(findOrCreateTag));

  const { error: deleteError } = await supabase
    .from("article_tags")
    .delete()
    .eq("article_id", articleId);
  if (deleteError) throw deleteError;

  if (tags.length > 0) {
    const { error: insertError } = await supabase
      .from("article_tags")
      .insert(tags.map((tag) => ({ article_id: articleId, tag_id: tag.id })));
    if (insertError) throw insertError;
  }

  revalidatePath("/encyclopedia");
  return tags;
}
