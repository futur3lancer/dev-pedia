"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createError, updateError } from "@/lib/actions/errors";
import type { ErrorEntry } from "@/types/database";

interface ErrorEditorProps {
  initialData?: ErrorEntry;
}

// Phase 2 (slice 4): errors table — walang markdown content, plain
// textareas lang (error_text, cause, solution).
export function ErrorEditor({ initialData }: ErrorEditorProps) {
  const router = useRouter();
  const mode = initialData ? "edit" : "create";

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [technologyInput, setTechnologyInput] = useState(
    initialData?.technology?.join(", ") ?? ""
  );
  const [errorText, setErrorText] = useState(initialData?.error_text ?? "");
  const [cause, setCause] = useState(initialData?.cause ?? "");
  const [solution, setSolution] = useState(initialData?.solution ?? "");
  const [status, setStatus] = useState<ErrorEntry["status"]>(
    initialData?.status ?? "resolved"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!title.trim()) {
      setError("Kailangan ng title bago mag-save.");
      return;
    }
    if (!errorText.trim()) {
      setError("Kailangan ng error text bago mag-save.");
      return;
    }
    if (!solution.trim()) {
      setError("Kailangan ng solution bago mag-save.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const input = {
        title: title.trim(),
        technology: technologyInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        error_text: errorText.trim(),
        cause: cause.trim() || undefined,
        solution: solution.trim(),
        status,
      };

      const saved =
        mode === "create"
          ? await createError(input)
          : await updateError(initialData!.id, input);

      router.push(`/errors/${saved.id}`);
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
          <label className="text-sm font-medium">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder='hal. "PGRST116: JSON object requested, multiple rows returned"'
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Technology (comma-separated)</label>
          <input
            value={technologyInput}
            onChange={(e) => setTechnologyInput(e.target.value)}
            placeholder="Next.js, Supabase, Vercel"
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ErrorEntry["status"])}
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="resolved">resolved</option>
            <option value="unresolved">unresolved</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Error Text</label>
        <textarea
          value={errorText}
          onChange={(e) => setErrorText(e.target.value)}
          rows={4}
          spellCheck={false}
          placeholder="I-paste ang literal na error message."
          className="w-full resize-y rounded-md border border-border bg-transparent px-3 py-2 font-mono text-sm leading-relaxed outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Cause (optional)</label>
        <textarea
          value={cause}
          onChange={(e) => setCause(e.target.value)}
          rows={3}
          className="w-full resize-y rounded-md border border-border bg-transparent px-3 py-2 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Solution</label>
        <textarea
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          rows={6}
          className="w-full resize-y rounded-md border border-border bg-transparent px-3 py-2 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Sinasave…" : mode === "create" ? "I-save ang Error" : "I-save"}
        </button>
      </div>
    </div>
  );
}
