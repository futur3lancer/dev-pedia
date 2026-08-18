"use server";

import { createClient } from "@/lib/supabase/server";
import { generateEmbedding } from "@/lib/ai/gemini";

// Phase 5 (slice 2): embeddings pipeline. Walang tunay na background job
// / Edge Function queue dito (wala kaming infra para diyan sa ngayon) —
// "best-effort, inline sa server action" na lang muna: tinatawag ito
// mula sa createArticle/updateArticle (see lib/actions/articles.ts),
// naka-await pero naka-try/catch, kaya kung mabigo ang embedding call
// (hal. rate limit, walang API key), hindi mabibigo ang buong save —
// mag-lo-log lang, at mananatiling null ang embedding hangga't hindi
// na-retry (manual retry via regenerateMissingEmbeddings sa ibaba).
//
// Trade-off: dagdag na latency sa Save (isa pang Gemini round-trip) sa
// halip na tunay na async/background — katanggap-tanggap para sa scale
// at simplicity ng personal na tool, pero unang lugar na dapat baguhin
// kung magiging mabagal ang editor o kung dadami ang cost mula sa
// bawat-save na embedding call (hal. i-debounce, o edge function queue).

const MAX_EMBED_CHARS = 8000;

function buildEmbeddingInput(title: string, content: string): string {
  // Isama ang title dahil malaking bahagi ito ng "meaning" ng article at
  // maikli lang — hindi masyadong nakaka-dilute sa content.
  return `${title}\n\n${content}`.slice(0, MAX_EMBED_CHARS);
}

export async function generateArticleEmbedding(articleId: string): Promise<void> {
  const supabase = createClient();
  const { data: article, error } = await supabase
    .from("articles")
    .select("id, title, content")
    .eq("id", articleId)
    .single();

  if (error) throw error;
  if (!article) throw new Error("Article not found");

  const input = buildEmbeddingInput(article.title, article.content);
  const embedding = await generateEmbedding(input, "RETRIEVAL_DOCUMENT");

  const { error: updateError } = await supabase
    .from("articles")
    .update({ embedding: JSON.stringify(embedding) })
    .eq("id", articleId);

  if (updateError) throw updateError;
}

// Fire-and-forget wrapper — ginagamit sa createArticle/updateArticle para
// hindi kailangang ulit-ulitin ang try/catch sa bawat caller.
export async function tryGenerateArticleEmbedding(articleId: string): Promise<void> {
  try {
    await generateArticleEmbedding(articleId);
  } catch (e) {
    console.error(
      `[embeddings] Hindi na-generate ang embedding para sa article ${articleId}:`,
      e instanceof Error ? e.message : e
    );
  }
}

export interface EmbeddingCoverage {
  total: number;
  withEmbedding: number;
  missing: number;
}

export async function getEmbeddingCoverage(): Promise<EmbeddingCoverage> {
  const supabase = createClient();

  const [{ count: total, error: totalError }, { count: withEmbedding, error: withError }] =
    await Promise.all([
      supabase.from("articles").select("id", { count: "exact", head: true }),
      supabase
        .from("articles")
        .select("id", { count: "exact", head: true })
        .not("embedding", "is", null),
    ]);

  if (totalError) throw totalError;
  if (withError) throw withError;

  const totalCount = total ?? 0;
  const withCount = withEmbedding ?? 0;

  return {
    total: totalCount,
    withEmbedding: withCount,
    missing: totalCount - withCount,
  };
}

// Backfill — para sa mga article na na-save bago dumating ang embeddings
// column, o kung nabigo ang inline generation noong save. Sunod-sunod
// (hindi Promise.all) sa halip na sabay-sabay, para hindi ma-rate-limit
// ang Gemini API kapag maraming article na kulang.
export async function regenerateMissingEmbeddings(): Promise<{
  processed: number;
  failed: number;
}> {
  const supabase = createClient();
  const { data: articles, error } = await supabase
    .from("articles")
    .select("id")
    .is("embedding", null);

  if (error) throw error;

  let processed = 0;
  let failed = 0;

  for (const article of articles ?? []) {
    try {
      await generateArticleEmbedding(article.id);
      processed++;
    } catch (e) {
      failed++;
      console.error(
        `[embeddings] Backfill failed para sa article ${article.id}:`,
        e instanceof Error ? e.message : e
      );
    }
  }

  return { processed, failed };
}
