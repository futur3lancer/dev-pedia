"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ArchitectureDetails } from "@/types/database";

// Phase 3 (slice 2): architecture_details — 1:1 extension sa articles
// (type = 'architecture'). Walang sariling `created_at` — laging upsert
// keyed sa article_id, gaya ng favorites/last_viewed_at sa articles mismo.

export interface ArchitectureDetailsInput {
  when_to_use: string[];
  when_not_to_use: string[];
  advantages: string[];
  disadvantages: string[];
  diagram?: string;
}

// Nagbabalik ng "empty" default kapag wala pang row — mas simple ito sa
// caller kaysa mag-null-check bago i-render ang editor/viewer.
export async function getArchitectureDetails(
  articleId: string
): Promise<ArchitectureDetails> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("architecture_details")
    .select("*")
    .eq("article_id", articleId)
    .maybeSingle();

  if (error) throw error;

  return (
    data ?? {
      article_id: articleId,
      when_to_use: [],
      when_not_to_use: [],
      advantages: [],
      disadvantages: [],
      diagram: null,
    }
  );
}

export async function upsertArchitectureDetails(
  articleId: string,
  input: ArchitectureDetailsInput
): Promise<ArchitectureDetails> {
  const supabase = createClient();

  // Ownership check via ang parent article — sinasalamin ang RLS policy
  // sa 0007_phase3_architecture_details.sql (defense in depth, hindi lang
  // umaasa sa RLS na mag-401 nang tahimik).
  const { data: article, error: articleError } = await supabase
    .from("articles")
    .select("id, slug, type")
    .eq("id", articleId)
    .single();

  if (articleError) throw articleError;
  if (article.type !== "architecture") {
    throw new Error("Architecture details ay para lang sa type='architecture' articles.");
  }

  const { data, error } = await supabase
    .from("architecture_details")
    .upsert({
      article_id: articleId,
      when_to_use: input.when_to_use,
      when_not_to_use: input.when_not_to_use,
      advantages: input.advantages,
      disadvantages: input.disadvantages,
      diagram: input.diagram ?? null,
    })
    .select()
    .single();

  if (error) throw error;

  revalidatePath(`/architecture/${article.slug}`);
  return data;
}
