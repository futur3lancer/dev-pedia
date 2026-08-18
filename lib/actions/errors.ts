"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ErrorEntry } from "@/types/database";

// Phase 2 (slice 4): errors table — ang Error Encyclopedia.

export interface CreateErrorInput {
  title: string;
  technology?: string[];
  error_text: string;
  cause?: string;
  solution: string;
  status?: ErrorEntry["status"];
}

export async function listErrors(technologyFilter?: string): Promise<ErrorEntry[]> {
  const supabase = createClient();
  let request = supabase
    .from("errors")
    .select("*")
    .order("updated_at", { ascending: false });

  if (technologyFilter) {
    request = request.contains("technology", [technologyFilter]);
  }

  const { data, error } = await request;
  if (error) throw error;
  return data;
}

export async function getErrorById(id: string): Promise<ErrorEntry> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("errors")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createError(input: CreateErrorInput): Promise<ErrorEntry> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("errors")
    .insert({
      user_id: user.id,
      title: input.title,
      technology: input.technology ?? [],
      error_text: input.error_text,
      cause: input.cause ?? null,
      solution: input.solution,
      status: input.status ?? "resolved",
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/errors");
  return data;
}

export async function updateError(
  id: string,
  updates: Partial<CreateErrorInput>
): Promise<ErrorEntry> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("errors")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/errors");
  revalidatePath(`/errors/${id}`);
  return data;
}

export async function deleteError(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("errors").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/errors");
}
