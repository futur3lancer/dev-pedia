"use client";

import { useState } from "react";
import Link from "next/link";
import { articleTypePath } from "@/lib/utils";
import type { LearningProgress } from "@/lib/actions/learning-progress";
import type { ArticleType } from "@/types/database";

// Phase 5 (slice 3): Learning progress widget — client component dahil
// may per-type expand/collapse (subcategory breakdown) na state, hindi
// dahil kailangan ng interactivity sa data mismo (server component pa
// rin ang nagko-compute niyan, see lib/actions/learning-progress.ts).

const TYPE_LABELS: Record<ArticleType, string> = {
  encyclopedia: "Encyclopedia",
  concept: "Concepts",
  technology: "Technologies",
  architecture: "Architecture",
  experiment: "Experiments",
};

function ProgressBar({ published, total }: { published: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((published / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
        {pct}%
      </span>
    </div>
  );
}

export function LearningProgressWidget({ data }: { data: LearningProgress }) {
  const [expanded, setExpanded] = useState<Set<ArticleType>>(new Set());

  function toggle(type: ArticleType) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  const hasAnyArticles = data.overall.total > 0;

  return (
    <div>
      {!hasAnyArticles ? (
        <p className="text-sm text-muted-foreground">
          Wala ka pang articles. Habang lumalaki ang encyclopedia mo,
          lalabas dito kung gaano karami ang na-cover mo sa bawat topic.
        </p>
      ) : (
        <div className="divide-y divide-border rounded-md border border-border">
          {data.byType
            .filter((t) => t.total > 0)
            .map((typeProgress) => {
              const isExpanded = expanded.has(typeProgress.type);
              const showToggle = typeProgress.subcategories.length > 1;

              return (
                <div key={typeProgress.type} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => showToggle && toggle(typeProgress.type)}
                      className={`flex items-center gap-1.5 text-sm font-medium ${
                        showToggle ? "cursor-pointer hover:underline" : ""
                      }`}
                    >
                      {showToggle && (
                        <span className="text-xs text-muted-foreground">
                          {isExpanded ? "▾" : "▸"}
                        </span>
                      )}
                      <Link
                        href={`/${articleTypePath(typeProgress.type)}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:underline"
                      >
                        {TYPE_LABELS[typeProgress.type]}
                      </Link>
                    </button>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {typeProgress.published} / {typeProgress.total}
                    </span>
                  </div>
                  <div className="mt-1.5 w-48 max-w-full">
                    <ProgressBar
                      published={typeProgress.published}
                      total={typeProgress.total}
                    />
                  </div>

                  {isExpanded && (
                    <div className="mt-3 space-y-2 border-l border-border pl-4">
                      {typeProgress.subcategories.map((sub) => (
                        <div key={sub.subcategory}>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-xs text-muted-foreground">
                              {sub.subcategory}
                            </span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {sub.published} / {sub.total}
                            </span>
                          </div>
                          <div className="mt-1 w-48 max-w-full">
                            <ProgressBar
                              published={sub.published}
                              total={sub.total}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
