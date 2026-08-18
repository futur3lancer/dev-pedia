import { notFound } from "next/navigation";
import { ErrorEditor } from "@/components/editor/ErrorEditor";
import { getErrorById } from "@/lib/actions/errors";

export default async function EditErrorPage({
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
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit: {errorEntry.title}</h1>
      <ErrorEditor initialData={errorEntry} />
    </div>
  );
}
