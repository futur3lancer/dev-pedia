"use server";

import { generateAnswer } from "@/lib/ai/gemini";

// Phase 4 (slice 4): "Generate summary" — auto-generate ng `excerpt` mula
// sa `content` gamit ang AI. Tumatanggap ng buong title/content mula sa
// editor state mismo (hindi articleId) sa sinasadya — kasi kailangan itong
// gumana kahit unsaved pa ang draft (bagong article, "new" page), hindi
// lang sa mga existing na article.

const MAX_CONTENT_CHARS = 6000;

export async function generateExcerpt(
  title: string,
  content: string
): Promise<string> {
  const trimmedContent = content.trim();
  if (!trimmedContent) {
    throw new Error("Walang laman ang content — magsulat muna bago mag-generate ng excerpt.");
  }

  const prompt = `Gumawa ng isang maikling excerpt/summary (isa hanggang dalawang pangungusap, max ~200 characters) para sa sumusunod na developer encyclopedia article. Ito ang lalabas sa listing/search results, kaya dapat scannable at malinaw kung ano ang tungkol dito ang article — hindi generic, hindi clickbait.

Sagutin gamit LANG ng plain text na excerpt mismo — walang quotation marks, walang markdown, walang preamble tulad ng "Here's a summary:".

Title: ${title || "(walang title)"}

Content:
${trimmedContent.slice(0, MAX_CONTENT_CHARS)}`;

  const raw = await generateAnswer(prompt, { temperature: 0.3 });

  // I-clean ang sagot kung sakaling may nakadikit pa ring quotes o
  // preamble kahit sinabihan na "plain text lang".
  return raw
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/^(here'?s?\s+(a\s+)?(summary|excerpt)[:\-]?\s*)/i, "")
    .trim();
}
