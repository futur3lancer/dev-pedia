import { notFound } from "next/navigation";
import { ProjectEditor } from "@/components/editor/ProjectEditor";
import { getProjectBySlug } from "@/lib/actions/projects";

export default async function EditProjectPage({
  params,
}: {
  params: { slug: string };
}) {
  let project;
  try {
    project = await getProjectBySlug(params.slug);
  } catch {
    notFound();
  }

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit: {project.name}</h1>
      <ProjectEditor initialData={project} />
    </div>
  );
}
