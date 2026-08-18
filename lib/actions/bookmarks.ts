"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Bookmark } from "@/types/database";

// Phase 2 (deferred stub, tinapos dito): `bookmarks` table — standalone,
// walang FK sa `articles`. Simple CRUD lang ito, walang slug/detail page
// dahil 3 field lang naman ang laman (title, url, description).

export interface CreateBookmarkInput {
  title: string;
  url: string;
  description?: string;
}

export type UpdateBookmarkInput = Partial<CreateBookmarkInput>;

export async function listBookmarks(): Promise<Bookmark[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function createBookmark(input: CreateBookmarkInput): Promise<Bookmark> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const title = input.title.trim();
  const url = input.url.trim();
  if (!title) throw new Error("Kailangan ng title.");
  if (!url) throw new Error("Kailangan ng URL.");

  const { data, error } = await supabase
    .from("bookmarks")
    .insert({
      user_id: user.id,
      title,
      url,
      description: input.description?.trim() || null,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/bookmarks");
  return data;
}

export async function updateBookmark(
  id: string,
  updates: UpdateBookmarkInput
): Promise<Bookmark> {
  const supabase = createClient();

  const payload: Record<string, unknown> = {};
  if (updates.title !== undefined) payload.title = updates.title.trim();
  if (updates.url !== undefined) payload.url = updates.url.trim();
  if (updates.description !== undefined) {
    payload.description = updates.description.trim() || null;
  }

  const { data, error } = await supabase
    .from("bookmarks")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/bookmarks");
  return data;
}

export async function deleteBookmark(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("bookmarks").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/bookmarks");
}
