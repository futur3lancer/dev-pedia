"use client";

import { useState, useTransition } from "react";
import { createBookmark, deleteBookmark, updateBookmark } from "@/lib/actions/bookmarks";
import { timeAgo } from "@/lib/utils";
import type { Bookmark } from "@/types/database";

// Phase 2 (deferred stub, tinapos dito): dating "TODO" na lang ang buong
// page. Simpleng list + inline add/edit form, walang separate slug/detail
// route dahil 3 field lang (title, url, description) ang laman ng table.

const inputClass =
  "w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30";

export function BookmarksManager({ initialBookmarks }: { initialBookmarks: Bookmark[] }) {
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleCreated(bookmark: Bookmark) {
    setBookmarks((prev) => [bookmark, ...prev]);
  }

  function handleUpdated(bookmark: Bookmark) {
    setBookmarks((prev) => prev.map((b) => (b.id === bookmark.id ? bookmark : b)));
    setEditingId(null);
  }

  function handleDeleted(id: string) {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div className="space-y-6">
      <BookmarkForm onCreated={handleCreated} onError={setError} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {bookmarks.length === 0 ? (
        <p className="text-muted-foreground">
          Wala pang bookmark. Idagdag ang unang external link gamit ang form sa itaas.
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {bookmarks.map((bookmark) =>
            editingId === bookmark.id ? (
              <li key={bookmark.id} className="p-4">
                <BookmarkForm
                  initialData={bookmark}
                  onCreated={handleUpdated}
                  onError={setError}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            ) : (
              <BookmarkRow
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={() => setEditingId(bookmark.id)}
                onDeleted={() => handleDeleted(bookmark.id)}
                onError={setError}
              />
            )
          )}
        </ul>
      )}
    </div>
  );
}

function BookmarkRow({
  bookmark,
  onEdit,
  onDeleted,
  onError,
}: {
  bookmark: Bookmark;
  onEdit: () => void;
  onDeleted: () => void;
  onError: (message: string | null) => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Tanggalin ang bookmark na "${bookmark.title}"?`)) return;
    startTransition(async () => {
      try {
        await deleteBookmark(bookmark.id);
        onError(null);
        onDeleted();
      } catch (e) {
        onError(e instanceof Error ? e.message : "Hindi natanggal ang bookmark.");
      }
    });
  }

  return (
    <li className="flex items-start justify-between gap-4 p-4">
      <div className="min-w-0 flex-1 space-y-1">
        <a
          href={bookmark.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary hover:underline"
        >
          {bookmark.title}
        </a>
        <p className="truncate text-xs text-muted-foreground">{bookmark.url}</p>
        {bookmark.description && (
          <p className="text-sm text-muted-foreground">{bookmark.description}</p>
        )}
        <p className="text-xs text-muted-foreground">{timeAgo(bookmark.created_at)}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="rounded-md border border-error/40 px-3 py-1.5 text-sm font-medium text-error hover:bg-error/10 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function BookmarkForm({
  initialData,
  onCreated,
  onError,
  onCancel,
}: {
  initialData?: Bookmark;
  onCreated: (bookmark: Bookmark) => void;
  onError: (message: string | null) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [url, setUrl] = useState(initialData?.url ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [pending, startTransition] = useTransition();

  const isEdit = Boolean(initialData);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onError(null);
    startTransition(async () => {
      try {
        const result = isEdit
          ? await updateBookmark(initialData!.id, { title, url, description })
          : await createBookmark({ title, url, description });
        onCreated(result);
        if (!isEdit) {
          setTitle("");
          setUrl("");
          setDescription("");
        }
      } catch (err) {
        onError(err instanceof Error ? err.message : "Hindi na-save ang bookmark.");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-md border border-border p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Hal. Next.js App Router docs"
            className={inputClass}
            required
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">URL</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            type="url"
            className={inputClass}
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Description (optional)
        </label>
        <textarea
          value={description ?? ""}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Sinasave..." : isEdit ? "Save Changes" : "+ Add Bookmark"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
