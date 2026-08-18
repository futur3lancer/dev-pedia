import { ArticleEditor } from "@/components/editor/ArticleEditor";

export default function NewConceptPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New Concept</h1>
      <ArticleEditor type="concept" basePath="/concepts" />
    </div>
  );
}
