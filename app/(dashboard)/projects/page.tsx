import Link from "next/link";
import { listProjects } from "@/lib/actions/projects";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-success/15 text-success",
  completed: "bg-info/15 text-info",
  archived: "bg-muted text-muted-foreground",
};

export default async function ProjectsIndexPage() {
  let projects: Awaited<ReturnType<typeof listProjects>> = [];
  let error: string | null = null;

  try {
    projects = await listProjects();
  } catch (e) {
    error = e instanceof Error ? e.message : "Hindi ma-load ang mga project.";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Real systems built — bridge sa theory.
          </p>
        </div>
        <Link
          href="/projects/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          + New Project
        </Link>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && projects.length === 0 && (
        <p className="text-muted-foreground">
          Wala pang project. Gawa ka ng una gamit ang "+ New Project".
        </p>
      )}

      <div className="divide-y divide-border rounded-md border border-border">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.slug}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-muted"
          >
            <div>
              <div className="font-medium">{project.name}</div>
              {project.stack.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {project.stack.join(" · ")}
                </div>
              )}
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_STYLES[project.status] ?? STATUS_STYLES.archived
              }`}
            >
              {project.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
