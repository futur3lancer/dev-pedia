import { listDueFlashcards } from "@/lib/actions/spaced-repetition";
import { ReviewSession } from "@/components/review/ReviewSession";

// Phase 5 (slice 5): /review page. Server component lang ang fetch (isang
// listDueFlashcards() call, max 30 cards bawat session — sapat na para sa
// isang sitting, at pinipigilan din nito na sumobra ang laki ng session
// kung dumami ang naipong due cards sa mahabang panahon na hindi
// nagre-review).

export default async function ReviewPage() {
  const dueCards = await listDueFlashcards();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">🧠 Review</h1>
        <p className="text-sm text-muted-foreground">
          Spaced repetition base sa mga flashcard na na-save mo mula sa
          articles. Bawat grade ay nag-aadjust ng susunod na review date
          (SM-2 algorithm).
        </p>
      </div>

      <ReviewSession initialCards={dueCards} />
    </div>
  );
}
