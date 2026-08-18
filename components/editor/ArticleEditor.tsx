"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createArticle, updateArticle } from "@/lib/actions/articles";
import { getArticleTags, setArticleTags } from "@/lib/actions/tags";
import { generateExcerpt } from "@/lib/actions/summarize";
import { MarkdownContent } from "@/lib/markdown/render";
import { getStarterContent } from "@/lib/markdown/templates";
import { slugify, cn } from "@/lib/utils";
import { TagInput } from "@/components/editor/TagInput";
import { RelatedConceptsEditor } from "@/components/editor/RelatedConceptsEditor";
import { ArchitectureDetailsEditor } from "@/components/editor/ArchitectureDetailsEditor";
import { VersionHistory } from "@/components/editor/VersionHistory";
import { StatusBadge } from "@/components/article-view/StatusBadge";
import type { Article, ArticleType } from "@/types/database";

// Phase 1: plain textarea na naka-preview sa markdown (walang WYSIWYG pa).
// Phase 2: Tags + Related Concepts. Related Concepts ay edit-mode lang
// (kailangan ng existing article_id bago pwedeng mag-link).
// Phase 3 (slice 1): syntax highlighting sa preview — nasa MarkdownContent
// na ito (lib/markdown/render.tsx), automatic dahil ginagamit na dito.
// Phase 3 (slice 2): Architecture Details — edit-mode lang din, parehong
// dahilan gaya ng Related Concepts (kailangan ng existing article_id).
// Phase 3 (slice 3): Version History — edit-mode lang, applicable sa lahat
// ng types (hindi lang architecture). Ang snapshot mismo ay DB trigger,
// automatic tuwing may binago sa title/content — walang kailangang gawin
// dito sa handleSave.

interface ArticleEditorProps {
  type: ArticleType;
  basePath: string; // hal. "/encyclopedia" — pinupuntahan pagkatapos i-save
  initialData?: Article; // kapag edit mode
}

type ViewMode = "write" | "preview";

export function ArticleEditor({ type, basePath, initialData }: ArticleEditorProps) {
  const router = useRouter();
  const mode = initialData ? "edit" : "create";

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [slug, setSlug] = useState(initialData?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [subcategory, setSubcategory] = useState(initialData?.subcategory ?? "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt ?? "");
  const [content, setContent] = useState(
    initialData?.content ?? getStarterContent(type, "")
  );
  const [view, setView] = useState<ViewMode>("write");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [generatingExcerpt, setGeneratingExcerpt] = useState(false);

  useEffect(() => {
    if (!initialData) return;
    getArticleTags(initialData.id)
      .then((t) => setTags(t.map((tag) => tag.name)))
      .catch(() => setTags([]));
  }, [initialData]);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    setSlug(slugify(value));
  }

  async function handleGenerateExcerpt() {
    setGeneratingExcerpt(true);
    setError(null);
    try {
      const generated = await generateExcerpt(title, content);
      setExcerpt(generated);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Hindi ma-generate ang excerpt."
      );
    } finally {
      setGeneratingExcerpt(false);
    }
  }

  async function handleSave(status: "draft" | "published") {
    if (!title.trim()) {
      setError("Kailangan ng title bago mag-save.");
      return;
    }
    if (!slug.trim()) {
      setError("Kailangan ng slug bago mag-save.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const input = {
        type,
        title: title.trim(),
        slug: slug.trim(),
        content,
        subcategory: subcategory.trim() || undefined,
        excerpt: excerpt.trim() || undefined,
        status,
      };

      const saved =
        mode === "create"
          ? await createArticle(input)
          : await updateArticle(initialData!.id, input);

      await setArticleTags(saved.id, tags);

      router.push(`${basePath}/${saved.slug}`);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "May error na hindi inaasahan habang sina-save."
      );
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md border border-error bg-error/10 px-4 py-2 text-sm text-foreground">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <label className="text-sm font-medium">Title</label>
          <input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="hal. Row Level Security (RLS)"
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Slug</label>
          <input
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="row-level-security"
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Subcategory (optional)</label>
          <input
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            placeholder="hal. Database"
            className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Excerpt (optional)</label>
            <button
              type="button"
              onClick={handleGenerateExcerpt}
              disabled={generatingExcerpt || !content.trim()}
              className="text-xs font-medium text-primary hover:underline disabled:opacity-50 disabled:no-underline"
            >
              {generatingExcerpt ? "Nagge-generate…" : "✨ Generate"}
            </button>
          </div>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            placeholder="Isa o dalawang pangungusap na buod — lalabas sa listing."
            className="w-full resize-none rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="sm:col-span-2">
          <TagInput value={tags} onChange={setTags} />
        </div>
      </div>

      {initialData && type === "architecture" && (
        <ArchitectureDetailsEditor articleId={initialData.id} />
      )}

      {initialData && <RelatedConceptsEditor articleId={initialData.id} />}

      {initialData && <VersionHistory articleId={initialData.id} />}

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Content (Markdown)</label>
          <div className="inline-flex rounded-md border border-border p-0.5">
            <button
              type="button"
              onClick={() => setView("write")}
              className={cn(
                "rounded-sm px-3 py-1 text-xs font-medium transition-colors",
                view === "write"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setView("preview")}
              className={cn(
                "rounded-sm px-3 py-1 text-xs font-medium transition-colors",
                view === "preview"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Preview
            </button>
          </div>
        </div>

        {view === "write" ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={24}
            spellCheck={false}
            className="w-full resize-y rounded-md border border-border bg-transparent px-3 py-2 font-mono text-sm leading-relaxed outline-none focus:ring-2 focus:ring-primary/30"
          />
        ) : (
          <div className="min-h-[300px] rounded-md border border-border px-4 py-3">
            <MarkdownContent content={content} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
        <button
          type="button"
          disabled={saving}
          onClick={() => handleSave("draft")}
          className={cn(
            "rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-50",
            initialData?.status === "draft"
              ? "border-border bg-muted"
              : "border-border hover:bg-muted"
          )}
        >
          {saving
            ? "Sina-save…"
            : initialData?.status === "published"
            ? "Unpublish (Save as Draft)"
            : "Save as Draft"}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => handleSave("published")}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50",
            initialData?.status === "published"
              ? "bg-primary text-primary-foreground ring-2 ring-primary/30 hover:opacity-90"
              : "bg-primary text-primary-foreground hover:opacity-90"
          )}
        >
          {saving ? "Sina-save…" : "Publish"}
        </button>
        {initialData && (
          <div className="flex w-full items-center gap-2 text-xs text-muted-foreground sm:ml-auto sm:w-auto">
            <span>Kasalukuyan:</span>
            <StatusBadge status={initialData.status} />
            <span>
              · Huling na-update: {new Date(initialData.updated_at).toLocaleString("en-PH")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
