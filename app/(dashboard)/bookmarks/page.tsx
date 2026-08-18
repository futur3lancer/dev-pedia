import { listBookmarks } from "@/lib/actions/bookmarks";
import { BookmarksManager } from "@/components/bookmarks/BookmarksManager";

export default async function BookmarksPage() {
  let bookmarks: Awaited<ReturnType<typeof listBookmarks>> = [];
  let error: string | null = null;

  try {
    bookmarks = await listBookmarks();
  } catch (e) {
    error = e instanceof Error ? e.message : "Hindi ma-load ang mga bookmark.";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Bookmarks</h1>
        <p className="text-sm text-muted-foreground">
          External references worth balikan.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <BookmarksManager initialBookmarks={bookmarks} />
      )}
    </div>
  );
}
