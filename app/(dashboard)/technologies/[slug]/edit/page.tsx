import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/editor/ArticleEditor";
import { getArticleBySlug } from "@/lib/actions/articles";

export default async function EditTechnologyPage({
  params,
}: {
  params: { slug: string };
}) {
  let technology;
  try {
    technology = await getArticleBySlug("technology", params.slug);
  } catch {
    notFound();
  }

  if (!technology) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit: {technology.title}</h1>
      <ArticleEditor type="technology" basePath="/technologies" initialData={technology} />
    </div>
  );
}
