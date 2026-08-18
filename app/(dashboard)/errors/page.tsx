import Link from "next/link";
import { listErrors } from "@/lib/actions/errors";
import { ErrorsTable } from "@/components/errors/ErrorsTable";

export default async function ErrorsIndexPage({
  searchParams,
}: {
  searchParams: { tech?: string };
}) {
  let errors: Awaited<ReturnType<typeof listErrors>> = [];
  let allTechnologies: string[] = [];
  let error: string | null = null;

  try {
    const [filtered, all] = await Promise.all([
      listErrors(searchParams.tech),
      listErrors(),
    ]);
    errors = filtered;
    allTechnologies = Array.from(new Set(all.flatMap((e) => e.technology))).sort();
  } catch (e) {
    error = e instanceof Error ? e.message : "Hindi ma-load ang mga error.";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Errors & Solutions</h1>
          <p className="text-sm text-muted-foreground">
            Ang personal error log — pinaka-valuable section.
          </p>
        </div>
        <Link
          href="/errors/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          + New Error
        </Link>
      </div>

      {allTechnologies.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Link
            href="/errors"
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              !searchParams.tech
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </Link>
          {allTechnologies.map((tech) => (
            <Link
              key={tech}
              href={`/errors?tech=${encodeURIComponent(tech)}`}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                searchParams.tech === tech
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tech}
            </Link>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && <ErrorsTable errors={errors} />}
    </div>
  );
}
