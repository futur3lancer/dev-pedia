import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/editor/ArticleEditor";
import { getArticleBySlug } from "@/lib/actions/articles";

export default async function EditArchitecturePage({
  params,
}: {
  params: { slug: string };
}) {
  let architecture;
  try {
    architecture = await getArticleBySlug("architecture", params.slug);
  } catch {
    notFound();
  }

  if (!architecture) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit: {architecture.title}</h1>
      <ArticleEditor type="architecture" basePath="/architecture" initialData={architecture} />
    </div>
  );
}
