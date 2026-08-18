import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/editor/ArticleEditor";
import { getArticleBySlug } from "@/lib/actions/articles";

export default async function EditEncyclopediaArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  let article;
  try {
    article = await getArticleBySlug("encyclopedia", params.slug);
  } catch {
    notFound();
  }

  if (!article) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit: {article.title}</h1>
      <ArticleEditor type="encyclopedia" basePath="/encyclopedia" initialData={article} />
    </div>
  );
}
