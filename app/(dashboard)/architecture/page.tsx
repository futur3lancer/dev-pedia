import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArticleCardGrid } from "@/components/listing/ArticleCardGrid";
import { ARTICLE_COLUMNS } from "@/lib/supabase/columns";
import type { Article } from "@/types/database";

export default async function ArchitectureIndexPage() {
  const supabase = createClient();
  const { data: patterns, error } = await supabase
    .from("articles")
    .select(ARTICLE_COLUMNS)
    .eq("type", "architecture")
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Architecture</h1>
          <p className="text-sm text-muted-foreground">
            Patterns (monolith, microservices, event-driven, atbp.) — may
            When to use / Advantages / Diagram bawat isa.
          </p>
        </div>
        <Link
          href="/architecture/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          + New Pattern
        </Link>
      </div>

      {error && (
        <p className="text-sm text-red-600">
          Hindi ma-load ang mga architecture pattern: {error.message}
        </p>
      )}

      {!error && (!patterns || patterns.length === 0) && (
        <p className="text-muted-foreground">
          Wala pang architecture pattern. Gawa ka ng una gamit ang "+ New
          Pattern".
        </p>
      )}

      {patterns && patterns.length > 0 && (
        <ArticleCardGrid articles={patterns as Article[]} basePath="/architecture" />
      )}
    </div>
  );
}
