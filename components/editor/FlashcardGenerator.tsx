"use client";

import { useState, useTransition } from "react";
import { generateFlashcards, type Flashcard } from "@/lib/actions/flashcards";
import { saveFlashcardDeck } from "@/lib/actions/spaced-repetition";

interface FlashcardGeneratorProps {
  articleId: string;
}

// Phase 4 (slice 6): "Generate flashcards" — button na gumagawa ng deck ng
// front/back cards mula sa article content, tapos isang-card-at-a-time na
// flip UI (click para i-flip, Prev/Next para mag-navigate).
//
// Phase 5 (slice 5): dagdag na "Save deck" button — opt-in pa rin ang
// pag-save (hindi awtomatiko bawat generate), dahil madalas gusto mo
// munang tingnan/i-regenerate ang deck bago mo ito i-commit sa spaced-
// repetition schedule (lib/actions/spaced-repetition.ts). Bawat "Save"
// click ay dine-dedupe (normalized front text) laban sa dati nang na-save
// na cards ng parehong article — kung mag-regenerate ka pagkatapos
// mag-save, hindi na uulitin sa /review ang mga cards na pareho lang ang
// tanong. Ang saveFlashcardDeck ang may hawak ng dedup logic; dito lang
// ipinapakita ang resulta (ilan ang na-save, ilan ang na-skip).
export function FlashcardGenerator({ articleId }: FlashcardGeneratorProps) {
  const [cards, setCards] = useState<Flashcard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [saveResult, setSaveResult] = useState<{
    saved: number;
    skipped: number;
  } | null>(null);

  function handleGenerate() {
    setError(null);
    setIndex(0);
    setFlipped(false);
    setSaveState("idle");
    setSaveResult(null);
    startTransition(async () => {
      try {
        const found = await generateFlashcards(articleId);
        setCards(found);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Nabigo ang paggawa ng flashcards."
        );
        setCards(null);
      }
    });
  }

  function handleSave() {
    if (!cards) return;
    setSaveState("saving");
    startTransition(async () => {
      try {
        const result = await saveFlashcardDeck(articleId, cards);
        setSaveResult(result);
        setSaveState("saved");
      } catch {
        setSaveState("idle");
        setError("Nabigo ang pag-save ng deck. Subukan ulit.");
      }
    });
  }

  function goTo(next: number) {
    if (!cards) return;
    setIndex(Math.max(0, Math.min(cards.length - 1, next)));
    setFlipped(false);
  }

  const current = cards ? cards[index] : null;

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          🗂️ Flashcards
        </h2>
        <div className="flex items-center gap-2">
          {cards && (
            <button
              type="button"
              onClick={handleSave}
              disabled={pending || saveState === "saved"}
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              {saveState === "saved"
                ? "✓ Saved for review"
                : saveState === "saving"
                ? "Saving…"
                : "💾 Save deck for review"}
            </button>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={pending}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
          >
            {pending
              ? "Gumagawa ng deck…"
              : cards
              ? "🔄 Generate new deck"
              : "Generate flashcards"}
          </button>
        </div>
      </div>

      {saveState === "saved" && saveResult && (
        <p className="text-xs text-muted-foreground">
          {saveResult.saved} card{saveResult.saved === 1 ? "" : "s"} saved
          {saveResult.skipped > 0
            ? ` · ${saveResult.skipped} skipped as duplicate${
                saveResult.skipped === 1 ? "" : "s"
              } of existing cards`
            : ""}
          .
        </p>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {current && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setFlipped((f) => !f)}
            className="flex min-h-[140px] w-full items-center justify-center rounded-md border border-border bg-muted/40 px-6 py-8 text-center hover:bg-muted"
          >
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                {flipped ? "Sagot" : "Tanong"} · Click para i-flip
              </p>
              <p className="text-sm font-medium">
                {flipped ? current.back : current.front}
              </p>
            </div>
          </button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              className="rounded-md border border-border px-3 py-1.5 font-medium hover:bg-muted disabled:opacity-50"
            >
              ← Prev
            </button>
            <span className="text-xs text-muted-foreground">
              {index + 1} / {cards!.length}
            </span>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={index === cards!.length - 1}
              className="rounded-md border border-border px-3 py-1.5 font-medium hover:bg-muted disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
