"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject, updateProject } from "@/lib/actions/projects";
import { MarkdownContent } from "@/lib/markdown/render";
import { slugify, cn } from "@/lib/utils";
import type { Project } from "@/types/database";

// Phase 2 (slice 3): hiwalay sa ArticleEditor dahil hindi ito naka-base
// sa `articles` table — may sariling fields (stack, architecture_notes,
// started_at) at ibang status values (active/completed/archived).

interface ProjectEditorProps {
  initialData?: Project;
}

const STATUS_OPTIONS: Project["status"][] = ["active", "completed", "archived"];

export function ProjectEditor({ initialData }: ProjectEditorProps) {
  const router = useRouter();
  const mode = initialData ? "edit" : "create";

  const [name, setName] = useState(initialData?.name ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [stackInput, setStackInput] = useState(
    initialData?.stack?.join(", ") ?? ""
  );
  const [architectureNotes, setArchitectureNotes] = useState(
    initialData?.architecture_notes ?? ""
  );
  const [status, setStatus] = useState<Project["status"]>(
    initialData?.status ?? "active"
  );
  const [startedAt, setStartedAt] = useState(initialData?.started_at ?? "");
  const [view, setView] = useState<"write" | "preview">("write");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("Kailangan ng name bago mag-save.");
      return;
    }
    if (!slug.trim()) {
      setError("Kailangan ng slug bago mag-save.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const input = {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        stack: stackInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        architecture_notes: architectureNotes.trim() || undefined,
        status,
        started_at: startedAt || undefined,
      };

      const saved =
        mode === "create"
          ? await createProject(input)
          : await updateProject(initialData!.id, input);

      router.push(`/projects/${saved.slug}`);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "May error na hindi inaasahan habang sina-save."
      );
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-error bg-error/10 px-4 py-2 text-sm text-foreground">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium">Name</label>
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="hal. Electric Coop Suite"
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Slug</label>
          <input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            placeholder="electric-coop-suite"
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Project["status"])}
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Stack (comma-separated)</label>
          <input
            value={stackInput}
            onChange={(e) => setStackInput(e.target.value)}
            placeholder="Next.js, Supabase, n8n"
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Started (optional)</label>
          <input
            type="date"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">
            Architecture Notes (Markdown, optional)
          </label>
          <div className="inline-flex rounded-md border border-border p-0.5">
            <button
              type="button"
              onClick={() => setView("write")}
              className={cn(
                "rounded-sm px-3 py-1 text-xs font-medium transition-colors",
                view === "write"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setView("preview")}
              className={cn(
                "rounded-sm px-3 py-1 text-xs font-medium transition-colors",
                view === "preview"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Preview
            </button>
          </div>
        </div>

        {view === "write" ? (
          <textarea
            value={architectureNotes}
            onChange={(e) => setArchitectureNotes(e.target.value)}
            rows={14}
            spellCheck={false}
            placeholder="Pwedeng maglagay ng ASCII diagram o buod ng architecture dito."
            className="w-full resize-y rounded-md border border-border bg-transparent px-3 py-2 font-mono text-sm leading-relaxed outline-none focus:ring-2 focus:ring-primary/30"
          />
        ) : (
          <div className="rounded-md border border-border px-4 py-3">
            <MarkdownContent content={architectureNotes} />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Sinasave…" : mode === "create" ? "Gawin ang Project" : "I-save"}
        </button>
      </div>
    </div>
  );
}
