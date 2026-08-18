import { ArticleEditor } from "@/components/editor/ArticleEditor";

export default function NewArchitecturePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New Architecture Pattern</h1>
      <p className="text-sm text-muted-foreground">
        I-save muna bilang draft para lumabas ang Architecture Details form
        (When to use / Advantages / Diagram, atbp.) — kailangan na ng
        article_id iyon.
      </p>
      <ArticleEditor type="architecture" basePath="/architecture" />
    </div>
  );
}
