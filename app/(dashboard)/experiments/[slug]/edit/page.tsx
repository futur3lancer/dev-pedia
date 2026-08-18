import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/editor/ArticleEditor";
import { getArticleBySlug } from "@/lib/actions/articles";

export default async function EditExperimentPage({
  params,
}: {
  params: { slug: string };
}) {
  let experiment;
  try {
    experiment = await getArticleBySlug("experiment", params.slug);
  } catch {
    notFound();
  }

  if (!experiment) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit: {experiment.title}</h1>
      <ArticleEditor type="experiment" basePath="/experiments" initialData={experiment} />
    </div>
  );
}
