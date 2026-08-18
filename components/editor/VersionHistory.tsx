"use client";

import { useEffect, useState, useTransition } from "react";
import { listArticleVersions, restoreArticleVersion } from "@/lib/actions/versions";
import type { ArticleVersion } from "@/types/database";

interface VersionHistoryProps {
  articleId: string;
}

// Phase 3 (slice 3): "Version History" — nakikita lang dito ang mga
// snapshot na ginawa ng DB trigger (0008_phase3_article_versions.sql)
// tuwing nagbago ang title/content sa mga naunang save. Edit-mode lang ito,
// gaya ng Related Concepts / Architecture Details (kailangan ng article_id).
export function VersionHistory({ articleId }: VersionHistoryProps) {
  const [versions, setVersions] = useState<ArticleVersion[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoring, startTransition] = useTransition();

  function refresh() {
    listArticleVersions(articleId)
      .then(setVersions)
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [articleId]);

  function handleRestore(version: ArticleVersion) {
    const confirmed = window.confirm(
      `I-restore ang version na ito (${new Date(version.created_at).toLocaleString(
        "en-PH"
      )})? Ang kasalukuyang laman ay ma-sa-save muna bilang bagong version bago ito i-overwrite — hindi ito permanenteng mawawala.`
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      try {
        await restoreArticleVersion(version.id);
        // Full reload (hindi router.refresh() lang) dahil ang ArticleEditor
        // ay nagba-base ng title/content useState sa initialData mula sa
        // unang mount lang — hindi ito automatic na nagre-resync kapag
        // nagbago lang ang prop pagkatapos mag-refresh ng server component.
        window.location.reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Hindi na-restore ang version.");
      }
    });
  }

  if (loading) {
    return (
      <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">
        Loading version history…
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-border p-4">
      <label className="text-sm font-medium">Version History</label>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {versions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Wala pang naka-save na naunang version — lalabas dito ang snapshot
          tuwing may binago kang title o content sa isang update.
        </p>
      ) : (
        <ul className="space-y-2">
          {versions.map((version) => {
            const expanded = expandedId === version.id;
            return (
              <li key={version.id} className="rounded-md bg-muted/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : version.id)}
                    className="flex-1 text-left"
                  >
                    <div className="text-sm font-medium">{version.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(version.created_at).toLocaleString("en-PH")} · {version.status}
                    </div>
                  </button>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : version.id)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      {expanded ? "I-collapse" : "Tingnan"}
                    </button>
                    <button
                      type="button"
                      disabled={restoring}
                      onClick={() => handleRestore(version)}
                      className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                    >
                      I-restore
                    </button>
                  </div>
                </div>

                {expanded && (
                  <pre className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-md border border-border bg-background p-3 font-mono text-xs leading-relaxed">
                    {version.content}
                  </pre>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
