"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/types/database";

// Phase 2 (slice 3): projects table. Hindi ito naka-base sa `articles`
// (walang markdown `content`, may sariling fields gaya ng `stack` at
// `architecture_notes`) — kaya hiwalay na actions file.

export interface CreateProjectInput {
  name: string;
  slug: string;
  description?: string;
  stack?: string[];
  architecture_notes?: string;
  status?: Project["status"];
  started_at?: string;
}

export async function listProjects(): Promise<Project[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getProjectBySlug(slug: string): Promise<Project> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data;
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      stack: input.stack ?? [],
      architecture_notes: input.architecture_notes ?? null,
      status: input.status ?? "active",
      started_at: input.started_at ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/projects");
  return data;
}

export async function updateProject(
  id: string,
  updates: Partial<CreateProjectInput>
): Promise<Project> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/projects");
  revalidatePath(`/projects/${data.slug}`);
  return data;
}

export async function deleteProject(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
  revalidatePath("/projects");
}
