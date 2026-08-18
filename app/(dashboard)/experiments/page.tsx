import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArticleCardGrid } from "@/components/listing/ArticleCardGrid";
import { ARTICLE_COLUMNS } from "@/lib/supabase/columns";
import type { Article } from "@/types/database";

export default async function ExperimentsIndexPage() {
  const supabase = createClient();
  const { data: experiments, error } = await supabase
    .from("articles")
    .select(ARTICLE_COLUMNS)
    .eq("type", "experiment")
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Experiments</h1>
          <p className="text-sm text-muted-foreground">
            Mga sinusubukan pa, hindi pa "solid" — type = "experiment".
          </p>
        </div>
        <Link
          href="/experiments/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          + New Experiment
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600">
          Hindi ma-load ang mga experiment: {error.message}
        </p>
      )}

      {!error && (!experiments || experiments.length === 0) && (
        <p className="text-muted-foreground">
          Wala pang experiment article. Gawa ka ng una gamit ang "+ New Experiment".
        </p>
      )}

      {experiments && experiments.length > 0 && (
        <ArticleCardGrid articles={experiments as Article[]} basePath="/experiments" />
      )}
    </div>
  );
}
