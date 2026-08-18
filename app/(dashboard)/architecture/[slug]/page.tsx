import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/lib/markdown/render";
import { DiagramBlock } from "@/components/article-view/DiagramBlock";
import { getArticleBySlug } from "@/lib/actions/articles";
import { getArchitectureDetails } from "@/lib/actions/architecture";
import { getArticleTags } from "@/lib/actions/tags";
import { getRelatedArticles } from "@/lib/actions/relations";
import { articleTypePath } from "@/lib/utils";
import { WhereIUsedIt } from "@/components/editor/WhereIUsedIt";
import { WhereIEncounteredIt } from "@/components/editor/WhereIEncounteredIt";
import { ExplainConcept } from "@/components/editor/ExplainConcept";
import { QuizGenerator } from "@/components/editor/QuizGenerator";
import { FlashcardGenerator } from "@/components/editor/FlashcardGenerator";
import { FavoriteButton } from "@/components/editor/FavoriteButton";
import { StatusToggle } from "@/components/editor/StatusToggle";
import { ViewTracker } from "@/components/editor/ViewTracker";

// Phase 3 (slice 2): Architecture Details — When to use / When NOT to use /
// Advantages / Disadvantages bilang consistent UI blocks (hindi nakadepende
// sa markdown formatting), + Diagram (ASCII o Mermaid, auto-detect).
function DetailList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "positive" | "negative" | "neutral";
}) {
  if (items.length === 0) return null;

  const toneClass =
    tone === "positive"
      ? "border-success/30"
      : tone === "negative"
      ? "border-error/30"
      : "border-border";

  const markerClass =
    tone === "positive"
      ? "text-success"
      : tone === "negative"
      ? "text-error"
      : "text-muted-foreground";

  return (
    <div className={`rounded-md border ${toneClass} p-4`}>
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      <ul className="space-y-1 text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className={markerClass}>
              {tone === "positive" ? "+" : tone === "negative" ? "−" : "•"}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function ArchitectureArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  let architecture;
  try {
    architecture = await getArticleBySlug("architecture", params.slug);
  } catch {
    notFound();
  }

  if (!architecture) notFound();

  const [details, tags, related] = await Promise.all([
    getArchitectureDetails(architecture.id),
    getArticleTags(architecture.id),
    getRelatedArticles(architecture.id),
  ]);

  const hasDetails =
    details.when_to_use.length > 0 ||
    details.when_not_to_use.length > 0 ||
    details.advantages.length > 0 ||
    details.disadvantages.length > 0 ||
    Boolean(details.diagram);

  return (
    <div className="mx-auto max-w-reading space-y-6">
      <ViewTracker articleId={architecture.id} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{architecture.title}</h1>
          {architecture.subcategory && (
            <p className="text-sm text-muted-foreground">{architecture.subcategory}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <StatusToggle articleId={architecture.id} initialStatus={architecture.status} />
          <FavoriteButton
            articleId={architecture.id}
            initialIsFavorite={architecture.is_favorite}
          />
          <Link
            href={`/architecture/${architecture.slug}/edit`}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            Edit
          </Link>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium"
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {details.diagram && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Diagram</h2>
          <DiagramBlock diagram={details.diagram} />
        </div>
      )}

      {(details.when_to_use.length > 0 || details.when_not_to_use.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailList title="When to Use" items={details.when_to_use} tone="neutral" />
          <DetailList title="When NOT to Use" items={details.when_not_to_use} tone="neutral" />
        </div>
      )}

      {(details.advantages.length > 0 || details.disadvantages.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailList title="Advantages" items={details.advantages} tone="positive" />
          <DetailList title="Disadvantages" items={details.disadvantages} tone="negative" />
        </div>
      )}

      {!hasDetails && (
        <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
          Wala pang Architecture Details (When to use / Advantages / Diagram,
          atbp.) — i-edit ang page para punan ito.
        </p>
      )}

      <MarkdownContent content={architecture.content} />

      <ExplainConcept articleId={architecture.id} />

      <QuizGenerator articleId={architecture.id} />

      <FlashcardGenerator articleId={architecture.id} />

      {related.length > 0 && (
        <div className="space-y-2 border-t border-border pt-4">
          <h2 className="text-sm font-medium text-muted-foreground">Related Concepts</h2>
          <ul className="space-y-1.5">
            {related.map((r) => (
              <li key={r.relation_id}>
                <Link
                  href={`/${articleTypePath(r.type)}/${r.slug}`}
                  className="text-sm text-primary hover:underline"
                >
                  {r.title}
                </Link>{" "}
                <span className="text-xs text-muted-foreground">({r.relation_type})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <WhereIUsedIt articleId={architecture.id} />
      <WhereIEncounteredIt articleId={architecture.id} />
    </div>
  );
}
