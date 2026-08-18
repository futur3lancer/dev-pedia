"use client";

import { useState, useTransition } from "react";
import { toggleFavorite } from "@/lib/actions/articles";

interface FavoriteButtonProps {
  articleId: string;
  initialIsFavorite: boolean;
}

// Phase 2 (slice 6): simpleng star toggle — walang optimistic rollback UI
// dahil mabilis lang naman ang update at maliit ang tsansang mag-fail.
export function FavoriteButton({ articleId, initialIsFavorite }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const next = !isFavorite;
    setIsFavorite(next); // optimistic
    startTransition(async () => {
      try {
        await toggleFavorite(articleId, next);
      } catch {
        setIsFavorite(!next); // revert kung nag-fail
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={isFavorite}
      title={isFavorite ? "Alisin sa Favorites" : "Idagdag sa Favorites"}
      className="shrink-0 rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
    >
      {isFavorite ? "★ Favorited" : "☆ Favorite"}
    </button>
  );
}
