"use server";

import { createClient } from "@/lib/supabase/server";
import { generateAnswer } from "@/lib/ai/gemini";

// Phase 4 (slice 6): "Generate flashcards" — parehong batay sa article
// content gaya ng quiz (lib/actions/quiz.ts), pero front/back recall
// cards sa halip na multiple-choice. Parehong "ask nicely + parse
// defensively" na approach para sa JSON output ng Gemini.

export interface Flashcard {
  front: string;
  back: string;
}

const MAX_CONTENT_CHARS = 6000;
const CARD_COUNT = 8;

function parseFlashcards(raw: string): Flashcard[] {
  const cleaned = raw.replace(/```json|```/gi, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      "Hindi ma-parse ang flashcards na ibinalik ng AI. Subukan ulit."
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Hindi inaasahang format ng flashcards mula sa AI.");
  }

  const cards: Flashcard[] = [];
  for (const item of parsed) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as any).front !== "string" ||
      typeof (item as any).back !== "string" ||
      !(item as any).front.trim() ||
      !(item as any).back.trim()
    ) {
      continue; // laktawan ang malformed item sa halip na i-fail lahat
    }
    cards.push({
      front: (item as any).front.trim(),
      back: (item as any).back.trim(),
    });
  }

  if (cards.length === 0) {
    throw new Error("Walang valid na flashcard na nabuo. Subukan ulit.");
  }

  return cards;
}

export async function generateFlashcards(
  articleId: string
): Promise<Flashcard[]> {
  const supabase = createClient();
  const { data: article, error } = await supabase
    .from("articles")
    .select("id, title, content")
    .eq("id", articleId)
    .single();

  if (error) throw error;
  if (!article) throw new Error("Article not found");

  const content = article.content.slice(0, MAX_CONTENT_CHARS);

  const prompt = `Gumawa ng ${CARD_COUNT} flashcards batay sa sumusunod na developer encyclopedia article, para sa spaced-repetition style na pag-review ng may-akda. Ang "front" ay isang tanong o term na kailangang alalahanin (maikli), at ang "back" ay ang sagot/paliwanag (1-3 sentences, maikli at diretso — hindi buong artikulo ulit). Dapat magkaiba ang tinatarget ng bawat card (huwag ulit-ulitin ang parehong ideya), at dapat testable sa aktwal na laman ng article, hindi generic trivia.

Sagutin gamit LANG ng isang JSON array, walang ibang teksto, walang markdown code fence. Bawat item ay object na may fields "front" at "back", parehong strings.

Title: ${article.title}

Content:
${content}`;

  const raw = await generateAnswer(prompt, { temperature: 0.5 });
  return parseFlashcards(raw);
}
