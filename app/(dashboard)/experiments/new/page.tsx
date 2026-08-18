import { ArticleEditor } from "@/components/editor/ArticleEditor";

export default function NewExperimentPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New Experiment</h1>
      <ArticleEditor type="experiment" basePath="/experiments" />
    </div>
  );
}
