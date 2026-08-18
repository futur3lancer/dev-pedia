import Link from "next/link";
import { notFound } from "next/navigation";
import { getErrorById } from "@/lib/actions/errors";
import { ConceptsForErrorEditor } from "@/components/editor/ConceptsForErrorEditor";
import { Badge } from "@/components/ui/Badge";

export default async function ErrorDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let errorEntry;
  try {
    errorEntry = await getErrorById(params.id);
  } catch {
    notFound();
  }

  if (!errorEntry) notFound();

  return (
    <div className="mx-auto max-w-reading space-y-6">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{errorEntry.title}</h1>
        <Link
          href={`/errors/${errorEntry.id}/edit`}
          className="shrink-0 rounded-md border border-border px-3 py-1.5 text-sm font-medium transition-colors duration-150 hover:bg-muted"
        >
          Edit
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={errorEntry.status === "resolved" ? "success" : "warning"} dot>
          {errorEntry.status}
        </Badge>
        {errorEntry.technology.map((tech) => (
          <Badge key={tech} tone="neutral">
            {tech}
          </Badge>
        ))}
      </div>

      <div className="space-y-1.5">
        <h2 className="text-sm font-medium text-muted-foreground">Error Text</h2>
        <pre className="whitespace-pre-wrap rounded-md border border-border bg-surface px-3 py-2 font-mono text-sm">
          {errorEntry.error_text}
        </pre>
      </div>

      {errorEntry.cause && (
        <div className="space-y-1.5">
          <h2 className="text-sm font-medium text-muted-foreground">Cause</h2>
          <p className="text-sm leading-relaxed">{errorEntry.cause}</p>
        </div>
      )}

      <div className="space-y-1.5">
        <h2 className="text-sm font-medium text-muted-foreground">Solution</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {errorEntry.solution}
        </p>
      </div>

      <ConceptsForErrorEditor errorId={errorEntry.id} />
    </div>
  );
}
