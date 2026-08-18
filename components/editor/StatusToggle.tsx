"use client";

import { useState, useTransition } from "react";
import { setArticleStatus } from "@/lib/actions/articles";
import type { ArticleStatus } from "@/types/database";

interface StatusToggleProps {
  articleId: string;
  initialStatus: ArticleStatus;
}

// Phase 3 (slice 4): Draft/Published toggle — parehong optimistic pattern
// gaya ng FavoriteButton, dito lang sa view page (hindi na kailangang
// pumunta sa buong editor form para lang baguhin ang status).
export function StatusToggle({ articleId, initialStatus }: StatusToggleProps) {
  const [status, setStatus] = useState(initialStatus);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const next: ArticleStatus = status === "published" ? "draft" : "published";
    setStatus(next); // optimistic
    startTransition(async () => {
      try {
        await setArticleStatus(articleId, next);
      } catch {
        setStatus(status); // revert kung nag-fail
      }
    });
  }

  const isPublished = status === "published";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={isPublished}
      title={isPublished ? "I-unpublish (gawing Draft)" : "I-publish"}
      className={`shrink-0 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors duration-150 disabled:opacity-50 ${
        isPublished
          ? "border-success/30 bg-success/10 text-success hover:bg-success/15"
          : "border-border text-muted-foreground hover:bg-muted"
      }`}
    >
      {isPublished ? "● Published" : "○ Draft"}
    </button>
  );
}
