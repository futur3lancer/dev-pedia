"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  addProjectReference,
  getProjectReferencesForArticle,
  removeReference,
  searchProjectsForPicker,
  type ProjectReference,
} from "@/lib/actions/references";
import type { Project } from "@/types/database";

interface WhereIUsedItProps {
  articleId: string;
}

// Phase 2 (slice 3): "Where I Used It" — ipinapakita kung saang project
// na-apply ang concept na ito. Kabaligtaran ito ng ConceptsUsedEditor sa
// project page (parehong article_references table lang, iba ang direksyon
// ng query).
export function WhereIUsedIt({ articleId }: WhereIUsedItProps) {
  const [refs, setRefs] = useState<ProjectReference[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Project[]>([]);
  const [loading, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    getProjectReferencesForArticle(articleId)
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
      searchProjectsForPicker(query)
        .then((found) =>
          setResults(found.filter((p) => !refs.some((r) => r.project.id === p.id)))
        )
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query, refs]);

  function handleAdd(project: Project) {
    setError(null);
    startTransition(async () => {
      try {
        await addProjectReference(articleId, project.id);
        setQuery("");
        setResults([]);
        refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Hindi ma-link ang project.");
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
        Where I Used It
      </h2>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="relative max-w-sm">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Maghanap ng project para i-link…"
          className="w-full rounded-md border border-border bg-transparent px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        {results.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-background shadow-md">
            {results.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={loading}
                onClick={() => handleAdd(p)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {refs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Wala pang naka-link na project.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {refs.map((r) => (
            <li
              key={r.reference_id}
              className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 text-sm"
            >
              <Link
                href={`/projects/${r.project.slug}`}
                className="text-primary hover:underline"
              >
                {r.project.name}
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
