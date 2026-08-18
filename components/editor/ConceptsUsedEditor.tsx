"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { addProjectReference, getConceptsForProject, removeReference } from "@/lib/actions/references";
import { searchArticlesForPicker } from "@/lib/actions/relations";
import { articleTypePath } from "@/lib/utils";
import type { ArticleSummary } from "@/types/database";

interface ConceptsUsedEditorProps {
  projectId: string;
}

// Phase 2 (slice 3): "Concepts Used" sa project page — kabaligtaran ng
// direksyon ng WhereIUsedIt (dito, hinahanap natin ang mga article/concept
// para i-link papunta sa project na ito).
export function ConceptsUsedEditor({ projectId }: ConceptsUsedEditorProps) {
  const [concepts, setConcepts] = useState<
    { reference_id: string; article: ArticleSummary }[]
  >([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ArticleSummary[]>([]);
  const [loading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    getConceptsForProject(projectId)
      .then(setConcepts)
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
  }

  useEffect(refresh, [projectId]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    // Walang excludeArticleId dito — walang article ang project mismo,
    // kaya walang need i-exclude (iba ito sa RelatedConceptsEditor).
    const timeout = setTimeout(() => {
      searchArticlesForPicker(query)
        .then((found) =>
          setResults(
            found.filter((a) => !concepts.some((c) => c.article.id === a.id))
          )
        )
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, concepts]);

  function handleAdd(article: ArticleSummary) {
    setError(null);
    startTransition(async () => {
      try {
        await addProjectReference(article.id, projectId);
        setQuery("");
        setResults([]);
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Hindi ma-link ang concept.");
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
    <div className="space-y-3 rounded-md border border-border p-4">
      <label className="text-sm font-medium">Concepts Used</label>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="relative">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Maghanap ng concept na ginamit sa project na ito…"
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-background shadow-md">
            {results.map((a) => (
              <button
                key={a.id}
                type="button"
                disabled={loading}
                onClick={() => handleAdd(a)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
              >
                <span>{a.title}</span>
                <span className="text-xs text-muted-foreground">{a.type}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {concepts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Wala pang naka-link na concepts.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {concepts.map((c) => (
            <li
              key={c.reference_id}
              className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 text-sm"
            >
              <Link
                href={`/${articleTypePath(c.article.type)}/${c.article.slug}`}
                className="text-primary hover:underline"
              >
                {c.article.title}
              </Link>
              <button
                type="button"
                onClick={() => handleRemove(c.reference_id)}
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
