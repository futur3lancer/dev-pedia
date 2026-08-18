import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/editor/ArticleEditor";
import { getArticleBySlug } from "@/lib/actions/articles";

export default async function EditConceptPage({
  params,
}: {
  params: { slug: string };
}) {
  let concept;
  try {
    concept = await getArticleBySlug("concept", params.slug);
  } catch {
    notFound();
  }

  if (!concept) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit: {concept.title}</h1>
      <ArticleEditor type="concept" basePath="/concepts" initialData={concept} />
    </div>
  );
}
