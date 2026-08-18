import { ProjectEditor } from "@/components/editor/ProjectEditor";

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">New Project</h1>
      <ProjectEditor />
    </div>
  );
}
