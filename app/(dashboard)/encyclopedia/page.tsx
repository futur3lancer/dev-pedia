import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArticleCardGrid } from "@/components/listing/ArticleCardGrid";
import { ARTICLE_COLUMNS } from "@/lib/supabase/columns";
import type { Article } from "@/types/database";

export default async function EncyclopediaIndexPage() {
  const supabase = createClient();
  const { data: articles, error } = await supabase
    .from("articles")
    .select(ARTICLE_COLUMNS)
    .eq("type", "encyclopedia")
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Encyclopedia</h1>
        <Link
          href="/encyclopedia/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          + New Article
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600">
          Hindi ma-load ang mga article: {error.message}
        </p>
      )}

      {!error && (!articles || articles.length === 0) && (
        <p className="text-muted-foreground">
          Wala pang encyclopedia article. Gawa ka ng una gamit ang "+ New
          Article".
        </p>
      )}

      {articles && articles.length > 0 && (
        <ArticleCardGrid articles={articles as Article[]} basePath="/encyclopedia" />
      )}
    </div>
  );
}
