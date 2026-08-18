"use client";

import { useState, useTransition } from "react";
import { generateQuiz, type QuizQuestion } from "@/lib/actions/quiz";
import { cn } from "@/lib/utils";

interface QuizGeneratorProps {
  articleId: string;
}

// Phase 4 (slice 5): "Generate quiz" — button na gumagawa ng 5 multiple-
// choice questions mula sa article content, tapos interactive review UI
// (piliin ang sagot bawat tanong, "Check answers" para makita ang score +
// explanation bawat isa). Bagong quiz bawat "Generate" click — walang
// pag-save ng quiz sa DB, sariling pagre-review lang ito, hindi
// permanenteng content.
export function QuizGenerator({ articleId }: QuizGeneratorProps) {
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    setChecked(false);
    setSelected({});
    startTransition(async () => {
      try {
        const q = await generateQuiz(articleId);
        setQuestions(q);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Nabigo ang paggawa ng quiz.");
        setQuestions(null);
      }
    });
  }

  function selectOption(qIndex: number, optIndex: number) {
    if (checked) return;
    setSelected((prev) => ({ ...prev, [qIndex]: optIndex }));
  }

  const score = questions
    ? questions.reduce(
        (acc, q, i) => acc + (selected[i] === q.correctIndex ? 1 : 0),
        0
      )
    : 0;

  const allAnswered =
    questions !== null &&
    questions.every((_, i) => selected[i] !== undefined);

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          🧠 Quiz Yourself
        </h2>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={pending}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          {pending
            ? "Gumagawa ng quiz…"
            : questions
            ? "🔄 Generate new quiz"
            : "Generate quiz"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {questions && (
        <div className="space-y-5">
          {questions.map((q, qIndex) => {
            const userAnswer = selected[qIndex];
            const isCorrect = checked && userAnswer === q.correctIndex;
            const isWrong = checked && userAnswer !== undefined && !isCorrect;

            return (
              <div
                key={qIndex}
                className="rounded-md border border-border p-4"
              >
                <p className="mb-3 text-sm font-medium">
                  {qIndex + 1}. {q.question}
                </p>
                <div className="space-y-1.5">
                  {q.options.map((opt, optIndex) => {
                    const isSelected = userAnswer === optIndex;
                    const isCorrectOption =
                      checked && optIndex === q.correctIndex;
                    const isWrongSelected =
                      checked && isSelected && optIndex !== q.correctIndex;

                    return (
                      <button
                        key={optIndex}
                        type="button"
                        onClick={() => selectOption(qIndex, optIndex)}
                        disabled={checked}
                        className={cn(
                          "block w-full rounded-md border px-3 py-2 text-left text-sm text-foreground transition-colors disabled:cursor-default",
                          isCorrectOption
                            ? "border-success bg-success/10"
                            : isWrongSelected
                            ? "border-error bg-error/10"
                            : isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border hover:bg-muted"
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {checked && (
                  <p
                    className={cn(
                      "mt-2 text-xs",
                      isCorrect ? "text-success" : "text-muted-foreground"
                    )}
                  >
                    {isCorrect ? "✓ Tama! " : isWrong ? "✗ Mali. " : ""}
                    {q.explanation}
                  </p>
                )}
              </div>
            );
          })}

          <div className="flex items-center gap-3">
            {!checked ? (
              <button
                type="button"
                onClick={() => setChecked(true)}
                disabled={!allAnswered}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                Check answers
              </button>
            ) : (
              <p className="text-sm font-medium">
                Score: {score} / {questions.length}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
