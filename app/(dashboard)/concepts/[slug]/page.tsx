import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownContent } from "@/lib/markdown/render";
import { getArticleBySlug } from "@/lib/actions/articles";
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

export default async function ConceptArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  let concept;
  try {
    concept = await getArticleBySlug("concept", params.slug);
  } catch {
    notFound();
  }

  if (!concept) notFound();

  const [tags, related] = await Promise.all([
    getArticleTags(concept.id),
    getRelatedArticles(concept.id),
  ]);

  return (
    <div className="mx-auto max-w-reading space-y-6">
      <ViewTracker articleId={concept.id} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{concept.title}</h1>
          {concept.subcategory && (
            <p className="text-sm text-muted-foreground">
              {concept.subcategory}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <StatusToggle articleId={concept.id} initialStatus={concept.status} />
          <FavoriteButton articleId={concept.id} initialIsFavorite={concept.is_favorite} />
          <Link
            href={`/concepts/${concept.slug}/edit`}
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

      <MarkdownContent content={concept.content} />

      <ExplainConcept articleId={concept.id} />

      <QuizGenerator articleId={concept.id} />

      <FlashcardGenerator articleId={concept.id} />

      {related.length > 0 && (
        <div className="space-y-2 border-t border-border pt-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Related Concepts
          </h2>
          <ul className="space-y-1.5">
            {related.map((r) => (
              <li key={r.relation_id}>
                <Link
                  href={`/${articleTypePath(r.type)}/${r.slug}`}
                  className="text-sm text-primary hover:underline"
                >
                  {r.title}
                </Link>{" "}
                <span className="text-xs text-muted-foreground">
                  ({r.relation_type})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <WhereIUsedIt articleId={concept.id} />
      <WhereIEncounteredIt articleId={concept.id} />
    </div>
  );
}
