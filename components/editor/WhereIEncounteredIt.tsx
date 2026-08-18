"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  addErrorReference,
  getErrorReferencesForArticle,
  removeReference,
  searchErrorsForPicker,
  type ErrorReference,
} from "@/lib/actions/references";
import type { ErrorEntry } from "@/types/database";

interface WhereIEncounteredItProps {
  articleId: string;
}

// Phase 2 (slice 4): "Where I Encountered It" — kaparehong pattern ng
// WhereIUsedIt (projects), pero para sa errors table.
export function WhereIEncounteredIt({ articleId }: WhereIEncounteredItProps) {
  const [refs, setRefs] = useState<ErrorReference[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ErrorEntry[]>([]);
  const [loading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    getErrorReferencesForArticle(articleId)
      .then(setRefs)
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
  }

  useEffect(refresh, [articleId]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      searchErrorsForPicker(query)
        .then((found) =>
          setResults(found.filter((e) => !refs.some((r) => r.error.id === e.id)))
        )
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, refs]);

  function handleAdd(errorEntry: ErrorEntry) {
    setError(null);
    startTransition(async () => {
      try {
        await addErrorReference(articleId, errorEntry.id);
        setQuery("");
        setResults([]);
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Hindi ma-link ang error.");
      }
    });
  }

  function handleRemove(referenceId: string) {
    startTransition(async () => {
      try {
        await removeReference(referenceId);
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Hindi ma-alis ang link.");
      }
    });
  }

  return (
    <div className="space-y-2 border-t border-border pt-4">
      <h2 className="text-sm font-medium text-muted-foreground">
        Where I Encountered It
      </h2>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="relative max-w-sm">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Maghanap ng error para i-link…"
          className="w-full rounded-md border border-border bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-background shadow-md">
            {results.map((e) => (
              <button
                key={e.id}
                type="button"
                disabled={loading}
                onClick={() => handleAdd(e)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
              >
                {e.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {refs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Wala pang naka-link na error.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {refs.map((r) => (
            <li
              key={r.reference_id}
              className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 text-sm"
            >
              <Link
                href={`/errors/${r.error.id}`}
                className="text-primary hover:underline"
              >
                {r.error.title}
              </Link>
              <button
                type="button"
                onClick={() => handleRemove(r.reference_id)}
                disabled={loading}
                className="text-xs text-muted-foreground hover:text-red-600 disabled:opacity-50"
              >
                Alisin
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
