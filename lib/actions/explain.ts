"use server";

import { createClient } from "@/lib/supabase/server";
import { generateAnswer } from "@/lib/ai/gemini";
import { getProjectReferencesForArticle } from "@/lib/actions/references";

// Phase 4 (slice 3): "Explain concept" button sa article page. Dalawang
// mode:
//   - "simple": ipaliwanag nang mas simple, may analogy — walang ibang
//     context kundi ang article content mismo.
//   - "projects": ipaliwanag gamit ang sariling mga project ng user
//     (article_references, reference_type='project') bilang halimbawa —
//     kaya kailangan munang tignan kung may naka-link na project.

export type ExplainMode = "simple" | "projects";

const MAX_CONTENT_CHARS = 4000;

export async function explainArticle(
  articleId: string,
  mode: ExplainMode
): Promise<string> {
  const supabase = createClient();
  const { data: article, error } = await supabase
    .from("articles")
    .select("id, title, type, content")
    .eq("id", articleId)
    .single();

  if (error) throw error;
  if (!article) throw new Error("Article not found");

  const content = article.content.slice(0, MAX_CONTENT_CHARS);

  if (mode === "simple") {
    const prompt = `Ipaliwanag ang sumusunod na developer concept sa pinakasimpleng paraan — parang ipinapaliwanag sa isang junior developer na bago pa lang dito. Gumamit ng analogy kung makakatulong. Huwag lang ulitin/i-summarize ang artikulo — bagong paliwanag talaga, maikli (3-6 sentences), conversational ang tono.

Title: ${article.title}

Content:
${content}`;

    return generateAnswer(prompt, { temperature: 0.4 });
  }

  // mode === "projects"
  const refs = await getProjectReferencesForArticle(articleId);

  if (refs.length === 0) {
    return 'Wala pang naka-link na project sa article na ito. I-link muna ang isa o higit pang project gamit ang "Where I Used It" section sa ibaba, para makapagbigay ako ng paliwanag gamit ang sarili mong mga proyekto bilang halimbawa.';
  }

  const projectsContext = refs
    .map((r) => {
      const parts = [`- ${r.project.name}`];
      if (r.project.description) parts.push(`(${r.project.description})`);
      if (r.project.stack.length > 0) parts.push(`— stack: ${r.project.stack.join(", ")}`);
      return parts.join(" ");
    })
    .join("\n");

  const prompt = `Ipaliwanag ang sumusunod na developer concept, gamit ang sariling mga project ng user bilang konkretong halimbawa kung saan/paano ito posibleng na-apply. Kung hindi malinaw mula sa ibinigay na impormasyon kung paano eksaktong konektado ang isang partikular na project, huwag mag-imbento ng detalye — sabihin na lang nang pangkalahatan na ginamit ang concept doon batay sa stack/description. Maikli at kongkreto (4-7 sentences).

Title: ${article.title}

Content:
${content}

Mga project ng user na naka-link sa concept na ito:
${projectsContext}`;

  return generateAnswer(prompt, { temperature: 0.4 });
}
