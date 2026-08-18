"use client";

import { useState, useTransition } from "react";
import { explainArticle, type ExplainMode } from "@/lib/actions/explain";

interface ExplainConceptProps {
  articleId: string;
}

const MODE_LABEL: Record<ExplainMode, string> = {
  simple: "💡 Explain simpler",
  projects: "🧩 Explain with my projects",
};

// Phase 4 (slice 3): "Explain concept" button sa article page. Client
// component dahil kailangan ng loading/result state — pero ang totoong
// Gemini call ay nasa server action (explainArticle), kaya walang API key
// na nale-leak sa browser.
export function ExplainConcept({ articleId }: ExplainConceptProps) {
  const [activeMode, setActiveMode] = useState<ExplainMode | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleClick(mode: ExplainMode) {
    setActiveMode(mode);
    setResult(null);
    setError(null);
    startTransition(async () => {
      try {
        const text = await explainArticle(articleId, mode);
        setResult(text);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Nabigo ang pag-explain.");
      }
    });
  }

  function close() {
    setActiveMode(null);
    setResult(null);
    setError(null);
  }

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(MODE_LABEL) as ExplainMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => handleClick(mode)}
            disabled={pending && activeMode === mode}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {pending && activeMode === mode ? "Iniisip…" : MODE_LABEL[mode]}
          </button>
        ))}
      </div>

      {activeMode && (pending || result || error) && (
        <div className="space-y-2 rounded-md border border-border bg-muted/40 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              {MODE_LABEL[activeMode]}
            </h3>
            <button
              type="button"
              onClick={close}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Isara
            </button>
          </div>

          {pending && (
            <p className="text-sm text-muted-foreground">Iniisip…</p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          {result && (
            <p className="whitespace-pre-wrap text-sm">{result}</p>
          )}
        </div>
      )}
    </div>
  );
}
