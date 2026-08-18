import { ArticleEditor } from "@/components/editor/ArticleEditor";

export default function NewEncyclopediaArticlePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New Encyclopedia Article</h1>
      <ArticleEditor type="encyclopedia" basePath="/encyclopedia" />
    </div>
  );
}
