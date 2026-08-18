"use client";

import { useEffect, useState, useTransition } from "react";
import {
  addRelation,
  getRelatedArticles,
  removeRelation,
  searchArticlesForPicker,
} from "@/lib/actions/relations";
import {
  detectRelatedConcepts,
  type DetectedRelation,
} from "@/lib/actions/detect-relations";
import type { ArticleSummary, RelatedArticle, RelationType } from "@/types/database";

interface RelatedConceptsEditorProps {
  articleId: string;
}

const RELATION_TYPES: RelationType[] = [
  "related",
  "parent-of",
  "used-with",
  "depends-on",
];

// Phase 2 (slice 1): "Related Concepts" section sa loob ng editor.
// Kailangan na ng article_id — kaya edit mode lang ito (pagkatapos
// ma-save ang bagong article, lalabas ito sa `edit` page niya).
export function RelatedConceptsEditor({ articleId }: RelatedConceptsEditorProps) {
  const [related, setRelated] = useState<RelatedArticle[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArticleSummary[]>([]);
  const [relationType, setRelationType] = useState<RelationType>("related");
  const [loading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Phase 4 (slice 7): "Detect related concepts" — AI suggestions,
  // approve/reject lang, hindi auto-add. Hiwalay na state dito para
  // hindi masagabal sa manual search/add flow sa itaas.
  const [suggestions, setSuggestions] = useState<DetectedRelation[] | null>(
    null
  );
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  function refresh() {
    getRelatedArticles(articleId)
      .then(setRelated)
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
  }

  useEffect(refresh, [articleId]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      searchArticlesForPicker(query, articleId)
        .then(setResults)
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, articleId]);

  function handleAdd(target: ArticleSummary) {
    setError(null);
    startTransition(async () => {
      try {
        await addRelation(articleId, target.id, relationType);
        setQuery("");
        setResults([]);
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Hindi ma-link ang article.");
      }
    });
  }

  function handleRemove(relationId: string) {
    startTransition(async () => {
      try {
        await removeRelation(relationId);
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Hindi ma-alis ang relation.");
      }
    });
  }

  function handleDetect() {
    setDetecting(true);
    setDetectError(null);
    detectRelatedConcepts(articleId)
      .then(setSuggestions)
      .catch((e) =>
        setDetectError(
          e instanceof Error ? e.message : "Hindi ma-detect ang related concepts."
        )
      )
      .finally(() => setDetecting(false));
  }

  function dismissSuggestion(id: string) {
    setSuggestions((prev) => (prev ? prev.filter((s) => s.id !== id) : prev));
  }

  function approveSuggestion(s: DetectedRelation) {
    setApprovingId(s.id);
    startTransition(async () => {
      try {
        await addRelation(articleId, s.id, s.suggestedRelationType);
        dismissSuggestion(s.id);
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Hindi ma-link ang article.");
      } finally {
        setApprovingId(null);
      }
    });
  }

  return (
    <div className="space-y-3 rounded-md border border-border p-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Related Concepts</label>
        <select
          value={relationType}
          onChange={(e) => setRelationType(e.target.value as RelationType)}
          className="rounded-md border border-border bg-transparent px-2 py-1 text-xs"
        >
          {RELATION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Maghanap ng article para i-link…"
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-background shadow-md">
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                disabled={loading}
                onClick={() => handleAdd(r)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
              >
                <span>{r.title}</span>
                <span className="text-xs text-muted-foreground">{r.type}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {related.length === 0 ? (
        <p className="text-sm text-muted-foreground">Wala pang naka-link na concepts.</p>
      ) : (
        <ul className="space-y-1.5">
          {related.map((r) => (
            <li
              key={r.relation_id}
              className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 text-sm"
            >
              <span>
                {r.title}{" "}
                <span className="text-xs text-muted-foreground">
                  ({r.relation_type}
                  {r.direction === "incoming" ? " ← " : ""})
                </span>
              </span>
              <button
                type="button"
                onClick={() => handleRemove(r.relation_id)}
                disabled={loading}
                className="text-xs text-muted-foreground hover:text-red-600 disabled:opacity-50"
              >
                Alisin
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            🔎 AI Suggestions
          </span>
          <button
            type="button"
            onClick={handleDetect}
            disabled={detecting}
            className="text-xs font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {detecting ? "Naghahanap…" : "Detect related concepts"}
          </button>
        </div>

        {detectError && <p className="text-xs text-red-600">{detectError}</p>}

        {suggestions && suggestions.length === 0 && !detecting && (
          <p className="text-xs text-muted-foreground">
            Walang na-detect na malinaw na kaugnayan.
          </p>
        )}

        {suggestions && suggestions.length > 0 && (
          <ul className="space-y-1.5">
            {suggestions.map((s) => (
              <li
                key={s.id}
                className="space-y-1 rounded-md border border-dashed border-border px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span>
                    {s.title}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({s.suggestedRelationType})
                    </span>
                  </span>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => approveSuggestion(s)}
                      disabled={loading && approvingId === s.id}
                      className="text-xs font-medium text-emerald-600 hover:underline disabled:opacity-50"
                    >
                      {approvingId === s.id ? "Nili-link…" : "✓ Approve"}
                    </button>
                    <button
                      type="button"
                      onClick={() => dismissSuggestion(s.id)}
                      className="text-xs text-muted-foreground hover:text-red-600"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{s.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
