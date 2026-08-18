import Link from "next/link";
import { notFound } from "next/navigation";
import { getProjectBySlug } from "@/lib/actions/projects";
import { MarkdownContent } from "@/lib/markdown/render";
import { ConceptsUsedEditor } from "@/components/editor/ConceptsUsedEditor";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

const STATUS_TONE: Record<string, BadgeTone> = {
  active: "success",
  completed: "info",
  archived: "neutral",
};

export default async function ProjectDetailPage({
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
    <div className="mx-auto max-w-reading space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>
        <Link
          href={`/projects/${project.slug}/edit`}
          className="shrink-0 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors duration-150 hover:bg-muted"
        >
          Edit
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={STATUS_TONE[project.status] ?? "neutral"} dot>
          {project.status}
        </Badge>
        {project.stack.map((tech) => (
          <Badge key={tech} tone="neutral">
            {tech}
          </Badge>
        ))}
      </div>

      {project.architecture_notes && (
        <div className="space-y-1.5">
          <h2 className="text-sm font-medium text-muted-foreground">
            Architecture Notes
          </h2>
          <MarkdownContent content={project.architecture_notes} />
        </div>
      )}

      <ConceptsUsedEditor projectId={project.id} />

      {/* TODO (Phase 2): Error entries na naranasan habang ginagawa ang
          project na ito, kapag nagawa na ang Error Encyclopedia. */}
    </div>
  );
}
