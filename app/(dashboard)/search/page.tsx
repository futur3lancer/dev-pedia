"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { searchArticles } from "@/lib/actions/search";
import { aiSearchArticles } from "@/lib/actions/ai-search";
import {
  semanticSearchArticles,
  type SemanticSearchResult,
} from "@/lib/actions/semantic-search";
import {
  getEmbeddingCoverage,
  regenerateMissingEmbeddings,
  type EmbeddingCoverage,
} from "@/lib/actions/embeddings";
import { articleTypePath } from "@/lib/utils";
import type { Article } from "@/types/database";

const TYPE_LABELS: Record<Article["type"], string> = {
  encyclopedia: "Encyclopedia",
  concept: "Concept",
  technology: "Technology",
  architecture: "Architecture",
  experiment: "Experiment",
};

type Mode = "keyword" | "ai" | "semantic";

// Phase 2 (slice 5) + Phase 4 (slice 2): dalawang mode sa isang page.
//
// "keyword" — orihinal na behavior, tsvector/trigram search
// (searchArticles), live-as-you-type na may debounce.
//
// "ai" — bago, natural-language query. Hindi live-as-you-type dahil may
// Gemini call bawat submit (mas mahal, mas mabagal) — kailangan i-submit
// muna (Enter o button) bago tumakbo ang paghahanap. Ipinapakita rin ang
// mga keyword na na-expand ng AI mula sa tanong, para malinaw kung paano
// naging resulta ang mga ito (walang "black box" na pakiramdam).
export default function SearchPage() {
  const [mode, setMode] = useState<Mode>("keyword");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Article[]>([]);
  const [semanticResults, setSemanticResults] = useState<SemanticSearchResult[]>([]);
  const [aiKeywords, setAiKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [coverage, setCoverage] = useState<EmbeddingCoverage | null>(null);
  const [backfilling, setBackfilling] = useState(false);

  // Live keyword search (unchanged behavior, mode === "keyword" lang).
  useEffect(() => {
    if (mode !== "keyword") return;

    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    const timeout = setTimeout(() => {
      searchArticles(query)
        .then((found) => {
          setResults(found);
          setSearched(true);
        })
        .catch((e) => setError(e instanceof Error ? e.message : "Search failed"))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, mode]);

  // Coverage widget lang habang nasa semantic mode — walang saysay i-fetch
  // ito sa ibang mode dahil hindi naman ipinapakita.
  useEffect(() => {
    if (mode !== "semantic") return;
    getEmbeddingCoverage()
      .then(setCoverage)
      .catch(() => setCoverage(null));
  }, [mode]);

  async function handleBackfill() {
    setBackfilling(true);
    setError(null);
    try {
      await regenerateMissingEmbeddings();
      const fresh = await getEmbeddingCoverage();
      setCoverage(fresh);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Hindi na-backfill ang embeddings."
      );
    } finally {
      setBackfilling(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setResults([]);
    setSemanticResults([]);
    setAiKeywords([]);
    setSearched(false);
    setError(null);
  }

  async function handleAiSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    try {
      const { keywords, results: found } = await aiSearchArticles(trimmed);
      setAiKeywords(keywords);
      setResults(found);
      setSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI search failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSemanticSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    try {
      const found = await semanticSearchArticles(trimmed);
      setSemanticResults(found);
      setSearched(true);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Semantic search failed"
      );
    } finally {
      setLoading(false);
    }
  }

  const grouped = results.reduce<Record<string, Article[]>>((acc, article) => {
    (acc[article.type] ??= []).push(article);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Search</h1>
        <div className="flex rounded-md border border-border p-0.5 text-sm">
          <button
            type="button"
            onClick={() => switchMode("keyword")}
            className={`rounded px-3 py-1.5 ${
              mode === "keyword"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            🔍 Keyword
          </button>
          <button
            type="button"
            onClick={() => switchMode("ai")}
            className={`rounded px-3 py-1.5 ${
              mode === "ai"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            ✨ AI search
          </button>
          <button
            type="button"
            onClick={() => switchMode("semantic")}
            className={`rounded px-3 py-1.5 ${
              mode === "semantic"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            🧠 Semantic
          </button>
        </div>
      </div>

      {mode === "semantic" && coverage && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
          <span>
            Embedding coverage: {coverage.withEmbedding}/{coverage.total}
            {coverage.missing > 0 ? ` (${coverage.missing} kulang)` : " ✓"}
          </span>
          {coverage.missing > 0 && (
            <button
              type="button"
              onClick={handleBackfill}
              disabled={backfilling}
              className="rounded-md border border-border px-2.5 py-1 font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              {backfilling ? "Nagba-backfill…" : `Backfill ${coverage.missing} article(s)`}
            </button>
          )}
        </div>
      )}

      {mode === "keyword" ? (
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Maghanap sa lahat ng articles…"
          className="w-full rounded-md border border-border bg-transparent px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
      ) : mode === "ai" ? (
        <form onSubmit={handleAiSubmit} className="flex gap-2">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Itanong sa natural language, hal. "paano ko na-fix yung postgres timeout dati?"'
            className="flex-1 rounded-md border border-border bg-transparent px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Search
          </button>
        </form>
      ) : (
        <form onSubmit={handleSemanticSubmit} className="flex gap-2">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Maghanap base sa meaning, hindi exact wording, hal. "paraan para paganahin ang caching"'
            className="flex-1 rounded-md border border-border bg-transparent px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            Search
          </button>
        </form>
      )}

      {mode === "ai" && aiKeywords.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Na-expand na keywords:</span>
          {aiKeywords.map((k) => (
            <span key={k} className="rounded-md bg-muted px-2 py-1">
              {k}
            </span>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading && (
        <p className="text-sm text-muted-foreground">
          {mode === "ai"
            ? "Ini-expand ang tanong at naghahanap…"
            : mode === "semantic"
            ? "Kinukwenta ang embedding at naghahanap…"
            : "Naghahanap…"}
        </p>
      )}

      {!loading &&
        searched &&
        mode !== "semantic" &&
        results.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Walang nahanap para sa "{query}".
          </p>
        )}

      {!loading &&
        searched &&
        mode === "semantic" &&
        semanticResults.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Walang nahanap para sa "{query}". Baka kulang pa ng embedding
            ang ilang article — tingnan ang coverage sa itaas.
          </p>
        )}

      {!loading && mode === "semantic" && semanticResults.length > 0 && (
        <div className="space-y-4">
          {semanticResults.some((r) => !r.belowThreshold) && (
            <div className="divide-y divide-border rounded-md border border-border">
              {semanticResults
                .filter((r) => !r.belowThreshold)
                .map((r) => (
                  <Link
                    key={r.id}
                    href={`/${articleTypePath(r.type)}/${r.slug}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted"
                  >
                    <div>
                      <div className="font-medium">{r.title}</div>
                      {r.excerpt && (
                        <div className="text-sm text-muted-foreground">
                          {r.excerpt}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {TYPE_LABELS[r.type]} · {(r.similarity * 100).toFixed(0)}%
                    </span>
                  </Link>
                ))}
            </div>
          )}

          {semanticResults.some((r) => r.belowThreshold) && (
            <details className="rounded-md border border-dashed border-border">
              <summary className="cursor-pointer px-4 py-2.5 text-xs text-muted-foreground">
                Lower confidence matches (
                {semanticResults.filter((r) => r.belowThreshold).length}) —
                below the similarity threshold, click to expand
              </summary>
              <div className="divide-y divide-border border-t border-border">
                {semanticResults
                  .filter((r) => r.belowThreshold)
                  .map((r) => (
                    <Link
                      key={r.id}
                      href={`/${articleTypePath(r.type)}/${r.slug}`}
                      className="flex items-center justify-between px-4 py-3 opacity-60 hover:bg-muted hover:opacity-100"
                    >
                      <div>
                        <div className="font-medium">{r.title}</div>
                        {r.excerpt && (
                          <div className="text-sm text-muted-foreground">
                            {r.excerpt}
                          </div>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {TYPE_LABELS[r.type]} · {(r.similarity * 100).toFixed(0)}%
                      </span>
                    </Link>
                  ))}
              </div>
            </details>
          )}
        </div>
      )}

      {!loading &&
        mode !== "semantic" &&
        Object.entries(grouped).map(([type, articles]) => (
          <div key={type} className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              {TYPE_LABELS[type as Article["type"]] ?? type}
            </h2>
            <div className="divide-y divide-border rounded-md border border-border">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/${articleTypePath(article.type)}/${article.slug}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-muted"
                >
                  <div>
                    <div className="font-medium">{article.title}</div>
                    {article.excerpt && (
                      <div className="text-sm text-muted-foreground">
                        {article.excerpt}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
