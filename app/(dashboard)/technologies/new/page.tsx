import { ArticleEditor } from "@/components/editor/ArticleEditor";

export default function NewTechnologyPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New Technology</h1>
      <ArticleEditor type="technology" basePath="/technologies" />
    </div>
  );
}
