import Link from "next/link";
import { StatusBadge } from "@/components/article-view/StatusBadge";
import { Badge } from "@/components/ui/Badge";
import { timeAgo } from "@/lib/utils";
import type { Article } from "@/types/database";

// Phase 4 (slice 3): encyclopedia/technologies/architecture listing pages
// bilang card grid sa halip na simpleng `divide-y` list. Ang tatlong
// listing page na ito ay magkapareho ang shape (parehong article-backed,
// parehong may title/excerpt/subcategory/status) — dating tig-iisang
// halos-magkaparehong `<Link>` row markup bawat isa. Iisang shared card +
// grid component na lang dito, iba-iba lang ang `basePath` at empty-state
// text bawat page.

export function ArticleCardGrid({
  articles,
  basePath,
}: {
  articles: Article[];
  basePath: string;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} basePath={basePath} />
      ))}
    </div>
  );
}

function ArticleCard({ article, basePath }: { article: Article; basePath: string }) {
  return (
    <Link
      href={`${basePath}/${article.slug}`}
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary/40 hover:bg-muted"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium leading-snug">{article.title}</h3>
        <StatusBadge status={article.status} />
      </div>

      {article.excerpt && (
        <p className="line-clamp-2 flex-1 text-sm text-muted-foreground">
          {article.excerpt}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        {article.subcategory ? (
          <Badge tone="neutral">{article.subcategory}</Badge>
        ) : (
          <span />
        )}
        <span className="text-xs text-subtle-foreground">
          Updated {timeAgo(article.updated_at)}
        </span>
      </div>
    </Link>
  );
}
