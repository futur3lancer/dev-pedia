import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArticleCardGrid } from "@/components/listing/ArticleCardGrid";
import { ARTICLE_COLUMNS } from "@/lib/supabase/columns";
import type { Article } from "@/types/database";

export default async function ConceptsIndexPage() {
  const supabase = createClient();
  const { data: concepts, error } = await supabase
    .from("articles")
    .select(ARTICLE_COLUMNS)
    .eq("type", "concept")
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Concepts</h1>
          <p className="text-sm text-muted-foreground">
            Cross-cutting ideas (REST, RLS, Caching, atbp.) — type = "concept".
          </p>
        </div>
        <Link
          href="/concepts/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          + New Concept
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600">
          Hindi ma-load ang mga concept: {error.message}
        </p>
      )}

      {!error && (!concepts || concepts.length === 0) && (
        <p className="text-muted-foreground">
          Wala pang concept article. Gawa ka ng una gamit ang "+ New Concept".
        </p>
      )}

      {concepts && concepts.length > 0 && (
        <ArticleCardGrid articles={concepts as Article[]} basePath="/concepts" />
      )}
    </div>
  );
}
