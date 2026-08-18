"use client";

import { useEffect, useState } from "react";
import {
  getArchitectureDetails,
  upsertArchitectureDetails,
} from "@/lib/actions/architecture";

interface ArchitectureDetailsEditorProps {
  articleId: string;
}

// Phase 3 (slice 2): "When to use / When NOT to use / Advantages /
// Disadvantages / Diagram" — structured fields na hiwalay sa `content`
// markdown (architecture_details table). Kailangan na ng article_id kaya
// edit mode lang ito, parehong pattern gaya ng RelatedConceptsEditor.
//
// Isa-isang linya bawat item para sa list fields (hindi comma-separated,
// dahil malamang may mga kuwit ang mismong mga sentence, hal. "Mataas ang
// traffic, kailangan ng horizontal scaling").
function toLines(value: string[]): string {
  return value.join("\n");
}

function fromLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function ArchitectureDetailsEditor({ articleId }: ArchitectureDetailsEditorProps) {
  const [whenToUse, setWhenToUse] = useState("");
  const [whenNotToUse, setWhenNotToUse] = useState("");
  const [advantages, setAdvantages] = useState("");
  const [disadvantages, setDisadvantages] = useState("");
  const [diagram, setDiagram] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    getArchitectureDetails(articleId)
      .then((details) => {
        if (cancelled) return;
        setWhenToUse(toLines(details.when_to_use));
        setWhenNotToUse(toLines(details.when_not_to_use));
        setAdvantages(toLines(details.advantages));
        setDisadvantages(toLines(details.disadvantages));
        setDiagram(details.diagram ?? "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [articleId]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await upsertArchitectureDetails(articleId, {
        when_to_use: fromLines(whenToUse),
        when_not_to_use: fromLines(whenNotToUse),
        advantages: fromLines(advantages),
        disadvantages: fromLines(disadvantages),
        diagram: diagram.trim() || undefined,
      });
      setSavedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hindi na-save ang architecture details.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">
        Loading architecture details…
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-md border border-border p-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Architecture Details</label>
        {savedAt && (
          <span className="text-xs text-muted-foreground">
            Na-save {savedAt.toLocaleTimeString("en-PH")}
          </span>
        )}
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            When to Use (isang linya bawat item)
          </label>
          <textarea
            value={whenToUse}
            onChange={(e) => setWhenToUse(e.target.value)}
            rows={4}
            placeholder={"High write throughput\nIndependent team scaling"}
            className="w-full resize-y rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            When NOT to Use
          </label>
          <textarea
            value={whenNotToUse}
            onChange={(e) => setWhenNotToUse(e.target.value)}
            rows={4}
            placeholder={"Maliit na team\nMabilis na MVP lang"}
            className="w-full resize-y rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Advantages
          </label>
          <textarea
            value={advantages}
            onChange={(e) => setAdvantages(e.target.value)}
            rows={4}
            className="w-full resize-y rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Disadvantages
          </label>
          <textarea
            value={disadvantages}
            onChange={(e) => setDisadvantages(e.target.value)}
            rows={4}
            className="w-full resize-y rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Diagram (ASCII o Mermaid syntax — auto-detect kung Mermaid)
        </label>
        <textarea
          value={diagram}
          onChange={(e) => setDiagram(e.target.value)}
          rows={6}
          spellCheck={false}
          placeholder={"graph TD\n  Client --> API\n  API --> DB"}
          className="w-full resize-y rounded-md border border-border bg-transparent px-3 py-2 font-mono text-sm leading-relaxed outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          {saving ? "Sina-save…" : "I-save ang Architecture Details"}
        </button>
      </div>
    </div>
  );
}
