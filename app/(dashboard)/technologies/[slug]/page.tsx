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

// Technology pages gumagamit ng parent-of relations (outgoing) para
// ipakita ang "anak" na concepts — hal. Supabase -> PostgreSQL, Auth, RLS.
// Ang ibang relation types (related/used-with/depends-on) ay lumalabas sa
// pangkaraniwang "Related Concepts" section, tulad ng encyclopedia page.
export default async function TechnologyArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  let technology;
  try {
    technology = await getArticleBySlug("technology", params.slug);
  } catch {
    notFound();
  }

  if (!technology) notFound();

  const [tags, related] = await Promise.all([
    getArticleTags(technology.id),
    getRelatedArticles(technology.id),
  ]);

  const childConcepts = related.filter(
    (r) => r.direction === "outgoing" && r.relation_type === "parent-of"
  );
  const otherRelated = related.filter(
    (r) => !(r.direction === "outgoing" && r.relation_type === "parent-of")
  );

  return (
    <div className="mx-auto max-w-reading space-y-6">
      <ViewTracker articleId={technology.id} />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{technology.title}</h1>
          {technology.subcategory && (
            <p className="text-sm text-muted-foreground">
              {technology.subcategory}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <StatusToggle articleId={technology.id} initialStatus={technology.status} />
          <FavoriteButton
            articleId={technology.id}
            initialIsFavorite={technology.is_favorite}
          />
          <Link
            href={`/technologies/${technology.slug}/edit`}
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

      <MarkdownContent content={technology.content} />

      <ExplainConcept articleId={technology.id} />

      <QuizGenerator articleId={technology.id} />

      <FlashcardGenerator articleId={technology.id} />

      {childConcepts.length > 0 && (
        <div className="space-y-2 border-t border-border pt-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Concepts sa loob ng {technology.title}
          </h2>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {childConcepts.map((c) => (
              <li key={c.relation_id}>
                <Link
                  href={`/${articleTypePath(c.type)}/${c.slug}`}
                  className="block rounded-md bg-muted px-3 py-2 text-sm text-primary hover:underline"
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {otherRelated.length > 0 && (
        <div className="space-y-2 border-t border-border pt-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Related Concepts
          </h2>
          <ul className="space-y-1.5">
            {otherRelated.map((r) => (
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

      {childConcepts.length === 0 && otherRelated.length === 0 && (
        <p className="text-sm text-muted-foreground border-t border-border pt-4">
          Wala pang naka-link na concepts. I-edit ang page para mag-link gamit
          ang "Related Concepts" (piliin ang "parent-of" para ipakita dito
          bilang child concept).
        </p>
      )}

      <WhereIUsedIt articleId={technology.id} />
      <WhereIEncounteredIt articleId={technology.id} />
    </div>
  );
}
