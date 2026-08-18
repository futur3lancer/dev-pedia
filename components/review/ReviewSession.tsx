"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { reviewFlashcard, type ReviewGrade } from "@/lib/actions/spaced-repetition";
import { articleTypePath } from "@/lib/utils";
import type { DueFlashcard } from "@/types/database";

// Phase 5 (slice 5): Review session — isang-card-at-a-time, flip para
// makita ang sagot, pagkatapos apat na grade button (SM-2 quality,
// tingnan ang QUALITY_MAP sa spaced-repetition.ts). Client-side ang
// "queue" (kinuha na lahat ng due cards nang isang beses mula sa server
// component), tinatanggal na lang sa listahan pagkatapos ma-grade —
// hindi kailangang mag-refetch bawat card, at "in-session lang" naman
// ang queue kahit paano (kung magkaroon ng bagong due card habang
// nagre-review ka, sa susunod na session pa lalabas iyon).

const GRADE_BUTTONS: { grade: ReviewGrade; label: string; className: string }[] = [
  {
    grade: "again",
    label: "Again",
    className: "bg-error/15 text-error hover:bg-error/25",
  },
  {
    grade: "hard",
    label: "Hard",
    className: "bg-warning/15 text-warning hover:bg-warning/25",
  },
  {
    grade: "good",
    label: "Good",
    className: "bg-success/15 text-success hover:bg-success/25",
  },
  {
    grade: "easy",
    label: "Easy",
    className: "bg-info/15 text-info hover:bg-info/25",
  },
];

export function ReviewSession({ initialCards }: { initialCards: DueFlashcard[] }) {
  const [queue, setQueue] = useState(initialCards);
  const [flipped, setFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [pending, startTransition] = useTransition();

  const current = queue[0];

  function handleGrade(grade: ReviewGrade) {
    if (!current || pending) return;
    startTransition(async () => {
      try {
        await reviewFlashcard(current.id, grade);
      } finally {
        // Tanggalin sa queue kahit mabigo ang save — mas mabuti pang
        // ma-late ang schedule kaysa ma-stuck ang session sa isang card.
        setQueue((q) => q.slice(1));
        setReviewedCount((n) => n + 1);
        setFlipped(false);
      }
    });
  }

  if (!current) {
    return (
      <div className="rounded-md border border-border px-6 py-10 text-center">
        <p className="text-lg font-medium">
          {reviewedCount > 0 ? "🎉 Tapos na ang session!" : "Walang due card ngayon"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {reviewedCount > 0
            ? `Na-review mo ang ${reviewedCount} ${
                reviewedCount === 1 ? "card" : "cards"
              } ngayon.`
            : "Bumalik ka pagkatapos ma-due ulit ang mga card, o gumawa ng bagong deck sa isang article."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <Link
          href={`/${articleTypePath(current.article_type)}/${current.article_slug}`}
          className="hover:underline"
        >
          from: {current.article_title}
        </Link>
        <span>{queue.length} remaining</span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-[180px] w-full items-center justify-center rounded-md border border-border bg-muted/40 px-6 py-8 text-center hover:bg-muted"
      >
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
            {flipped ? "Sagot" : "Tanong"} · I-tap para i-flip
          </p>
          <p className="text-base font-medium">
            {flipped ? current.back : current.front}
          </p>
        </div>
      </button>

      {flipped ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {GRADE_BUTTONS.map((b) => (
            <button
              key={b.grade}
              type="button"
              onClick={() => handleGrade(b.grade)}
              disabled={pending}
              className={`min-h-[44px] rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50 ${b.className}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-center text-xs text-muted-foreground">
          I-tap para makita ang mga grade option.
        </p>
      )}
    </div>
  );
}
