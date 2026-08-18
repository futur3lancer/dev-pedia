"use server";

import { createClient } from "@/lib/supabase/server";
import { generateAnswer } from "@/lib/ai/gemini";

// Phase 4 (slice 5): "Generate quiz" — batay sa content ng isang article,
// para sa sariling review. Structured JSON output mula sa Gemini (walang
// SDK-level structured output enforcement dito, "ask nicely + parse
// defensively" lang — see parseQuiz below).

export interface QuizQuestion {
  question: string;
  options: string[]; // laging 4
  correctIndex: number; // 0-3
  explanation: string;
}

const MAX_CONTENT_CHARS = 6000;
const QUESTION_COUNT = 5;

function parseQuiz(raw: string): QuizQuestion[] {
  const cleaned = raw.replace(/```json|```/gi, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      "Hindi ma-parse ang quiz na ibinalik ng AI. Subukan ulit."
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Hindi inaasahang format ng quiz mula sa AI.");
  }

  const questions: QuizQuestion[] = [];
  for (const item of parsed) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as any).question !== "string" ||
      !Array.isArray((item as any).options) ||
      (item as any).options.length !== 4 ||
      typeof (item as any).correctIndex !== "number" ||
      typeof (item as any).explanation !== "string"
    ) {
      continue; // laktawan ang malformed item sa halip na i-fail lahat
    }
    questions.push({
      question: (item as any).question,
      options: (item as any).options,
      correctIndex: (item as any).correctIndex,
      explanation: (item as any).explanation,
    });
  }

  if (questions.length === 0) {
    throw new Error("Walang valid na quiz question na nabuo. Subukan ulit.");
  }

  return questions;
}

export async function generateQuiz(articleId: string): Promise<QuizQuestion[]> {
  const supabase = createClient();
  const { data: article, error } = await supabase
    .from("articles")
    .select("id, title, content")
    .eq("id", articleId)
    .single();

  if (error) throw error;
  if (!article) throw new Error("Article not found");

  const content = article.content.slice(0, MAX_CONTENT_CHARS);

  const prompt = `Gumawa ng ${QUESTION_COUNT} multiple-choice quiz questions batay sa sumusunod na developer encyclopedia article, para sa sariling pag-review ng may-akda. Dapat testable ang mga tanong sa aktwal na kaalaman mula sa content (hindi trivia, hindi generic), may isang tamang sagot bawat isa, at may maikling explanation kung bakit tama iyon.

Sagutin gamit LANG ng isang JSON array, walang ibang teksto, walang markdown code fence. Bawat item ay object na may fields:
- "question": string
- "options": array ng eksaktong 4 na strings
- "correctIndex": integer (0-3), index ng tamang option sa "options"
- "explanation": maikling paliwanag (1-2 sentences)

Title: ${article.title}

Content:
${content}`;

  const raw = await generateAnswer(prompt, { temperature: 0.5 });
  return parseQuiz(raw);
}
