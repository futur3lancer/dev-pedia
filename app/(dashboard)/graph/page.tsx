import { getGraphData } from "@/lib/actions/graph";
import { KnowledgeGraph } from "@/components/graph/KnowledgeGraph";

export default async function GraphPage() {
  const data = await getGraphData();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Knowledge Graph</h1>
        <p className="text-sm text-muted-foreground">
          Nodes = articles, edges = related concepts. I-click ang isang node para buksan.
        </p>
      </div>
      <KnowledgeGraph data={data} />
    </div>
  );
}
