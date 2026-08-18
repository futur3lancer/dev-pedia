import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArticleCardGrid } from "@/components/listing/ArticleCardGrid";
import { ARTICLE_COLUMNS } from "@/lib/supabase/columns";
import type { Article } from "@/types/database";

export default async function TechnologiesIndexPage() {
  const supabase = createClient();
  const { data: technologies, error } = await supabase
    .from("articles")
    .select(ARTICLE_COLUMNS)
    .eq("type", "technology")
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Technologies</h1>
          <p className="text-sm text-muted-foreground">
            Tool/vendor-specific pages — hal. Supabase, Vercel, Gemini.
          </p>
        </div>
        <Link
          href="/technologies/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          + New Technology
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600">
          Hindi ma-load ang mga technology: {error.message}
        </p>
      )}

      {!error && (!technologies || technologies.length === 0) && (
        <p className="text-muted-foreground">
          Wala pang technology page. Gawa ka ng una gamit ang "+ New
          Technology".
        </p>
      )}

      {technologies && technologies.length > 0 && (
        <ArticleCardGrid articles={technologies as Article[]} basePath="/technologies" />
      )}
    </div>
  );
}
