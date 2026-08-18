import Link from "next/link";
import {
  listFavorites,
  listRecentEdits,
  listRecentlyViewed,
} from "@/lib/actions/articles";
import { getLearningProgress } from "@/lib/actions/learning-progress";
import { LearningProgressWidget } from "@/components/dashboard/LearningProgressWidget";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { countDueFlashcards } from "@/lib/actions/spaced-repetition";
import { timeAgo, articleTypePath } from "@/lib/utils";
import type { Article } from "@/types/database";

function ArticleRow({ article }: { article: Article }) {
  return (
    <Link
      href={`/${articleTypePath(article.type)}/${article.slug}`}
      className="flex items-center justify-between px-4 py-2.5 hover:bg-muted"
    >
      <span className="font-medium">{article.title}</span>
      <span className="text-xs text-muted-foreground capitalize">
        {article.type}
      </span>
    </Link>
  );
}

export default async function DashboardPage() {
  const [favorites, recentlyViewed, changelog, learningProgress, dueCount] =
    await Promise.all([
      listFavorites(),
      listRecentlyViewed(),
      listRecentEdits(),
      getLearningProgress(),
      countDueFlashcards(),
    ]);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {dueCount > 0 && (
        <Link
          href="/review"
          className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-4 py-3 hover:bg-muted"
        >
          <span className="text-sm font-medium">
            🧠 {dueCount} flashcard{dueCount === 1 ? "" : "s"} due for review
          </span>
          <span className="text-sm text-muted-foreground">Review now →</span>
        </Link>
      )}

      {/* L1 — ang "kumusta ang encyclopedia ko" na pangunahing overview. */}
      <DashboardSection
        level={1}
        title="Learning Progress"
        icon="📈"
        meta={
          learningProgress.overall.total > 0
            ? `${learningProgress.overall.published} / ${learningProgress.overall.total} published`
            : undefined
        }
      >
        <LearningProgressWidget data={learningProgress} />
      </DashboardSection>

      {/* L2 — magkatabing secondary widgets, parehong importante. */}
      <div className="grid gap-4 md:grid-cols-2">
        <DashboardSection
          level={2}
          title="Changelog"
          icon="✎"
          meta={
            changelog.count > 0
              ? `${changelog.count} ${changelog.count === 1 ? "article" : "articles"} this week`
              : undefined
          }
        >
          {changelog.count === 0 ? (
            <p className="text-sm text-muted-foreground">
              Walang na-update na article this week.
            </p>
          ) : (
            <div className="divide-y divide-border rounded-md border border-border">
              {changelog.edits.map((edit) => (
                <div
                  key={edit.id}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <span className="font-medium">{edit.title}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{edit.type}</span>
                    <span>·</span>
                    <span>{timeAgo(edit.updated_at)}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </DashboardSection>

        <DashboardSection level={2} title="Favorites" icon="★">
          {favorites.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Wala ka pang na-favorite. I-star ang isang article para lumabas
              dito.
            </p>
          ) : (
            <div className="divide-y divide-border rounded-md border border-border">
              {favorites.map((a) => (
                <ArticleRow key={a.id} article={a} />
              ))}
            </div>
          )}
        </DashboardSection>
      </div>

      {/* L3 — glanceable, pinaka-mababang visual weight. */}
      <DashboardSection level={3} title="Recently Viewed" icon="🕐">
        {recentlyViewed.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Wala ka pang binuksan na article — dito lalabas ang huling
            binisita mo.
          </p>
        ) : (
          <div className="divide-y divide-border rounded-md border border-border">
            {recentlyViewed.map((a) => (
              <ArticleRow key={a.id} article={a} />
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );
}
