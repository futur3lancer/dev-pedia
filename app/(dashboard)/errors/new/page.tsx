import { ErrorEditor } from "@/components/editor/ErrorEditor";

export default function NewErrorPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New Error</h1>
      <ErrorEditor />
    </div>
  );
}
