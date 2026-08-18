"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { articleTypePath, cn } from "@/lib/utils";
import type { GraphData, GraphNode } from "@/lib/actions/graph";
import type { ArticleType, RelationType } from "@/types/database";

// Phase 5 (slice 1): Knowledge graph visualization.
//
// Walang d3/graph library dito — walang network access ang sandbox na
// ginamit para gawin ito kaya hindi pwedeng mag-`npm install` ng bago
// (hal. d3-force). Sa halip, munting Fruchterman-Reingold-style na force
// layout, isang beses lang tinatakbo (fixed iterations, hindi
// requestAnimationFrame loop) — sapat na para sa scale ng personal na
// encyclopedia (mga ilang dosenang article), at mas simple/mas mabilis
// kaysa mag-maintain ng continuous physics loop sa React state.
//
// Pagkatapos ma-layout, static na ang mga posisyon — pwede pang i-drag
// manually ng user (client-side lang, hindi pa naka-persist sa DB; kung
// kailangan pang i-save ang layout, dagdag na `x`/`y` columns sana sa
// isang bagong table sa susunod na slice).

interface KnowledgeGraphProps {
  data: GraphData;
}

interface LayoutNode extends GraphNode {
  x: number;
  y: number;
}

const WIDTH = 1000;
const HEIGHT = 700;
const ITERATIONS = 300;

const TYPE_COLORS: Record<ArticleType, string> = {
  encyclopedia: "#6366f1", // indigo
  concept: "#22c55e", // green
  technology: "#f59e0b", // amber
  architecture: "#ec4899", // pink
  experiment: "#06b6d4", // cyan
};

const TYPE_LABELS: Record<ArticleType, string> = {
  encyclopedia: "Encyclopedia",
  concept: "Concept",
  technology: "Technology",
  architecture: "Architecture",
  experiment: "Experiment",
};

const RELATION_DASH: Record<RelationType, string | undefined> = {
  related: undefined,
  "parent-of": "6 3",
  "used-with": "2 3",
  "depends-on": "1 4",
};

function layoutGraph(data: GraphData): LayoutNode[] {
  const n = data.nodes.length;
  if (n === 0) return [];

  // Simulate sa isang "unit" square, i-scale papunta sa WIDTH/HEIGHT sa
  // dulo — mas madaling i-tune ang constants kung 0..1 muna ang space.
  const area = 1;
  const k = Math.sqrt(area / n);

  const positions = new Map<string, { x: number; y: number }>();
  data.nodes.forEach((node, i) => {
    // Deterministic starting layout (circle) sa halip na Math.random(),
    // para consistent ang initial arrangement sa bawat render/reload.
    const angle = (2 * Math.PI * i) / n;
    positions.set(node.id, {
      x: 0.5 + 0.35 * Math.cos(angle),
      y: 0.5 + 0.35 * Math.sin(angle),
    });
  });

  let temperature = 0.1;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const disp = new Map<string, { x: number; y: number }>();
    data.nodes.forEach((node) => disp.set(node.id, { x: 0, y: 0 }));

    // Repulsion sa lahat ng pares ng nodes.
    for (let i = 0; i < data.nodes.length; i++) {
      for (let j = i + 1; j < data.nodes.length; j++) {
        const a = data.nodes[i];
        const b = data.nodes[j];
        const pa = positions.get(a.id)!;
        const pb = positions.get(b.id)!;
        let dx = pa.x - pb.x;
        let dy = pa.y - pb.y;
        let dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        const force = (k * k) / dist;
        dx = (dx / dist) * force;
        dy = (dy / dist) * force;
        const da = disp.get(a.id)!;
        const db = disp.get(b.id)!;
        da.x += dx;
        da.y += dy;
        db.x -= dx;
        db.y -= dy;
      }
    }

    // Attraction sa bawat edge.
    for (const edge of data.edges) {
      const pa = positions.get(edge.source);
      const pb = positions.get(edge.target);
      if (!pa || !pb) continue;
      let dx = pa.x - pb.x;
      let dy = pa.y - pb.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
      const force = (dist * dist) / k;
      dx = (dx / dist) * force;
      dy = (dy / dist) * force;
      const da = disp.get(edge.source)!;
      const db = disp.get(edge.target)!;
      da.x -= dx;
      da.y -= dy;
      db.x += dx;
      db.y += dy;
    }

    // I-apply ang displacement, limitado ng "temperature" (cooling
    // schedule) para huminto sa isang stable na layout sa halip na
    // walang-katapusang gumagalaw.
    for (const node of data.nodes) {
      const d = disp.get(node.id)!;
      const dist = Math.sqrt(d.x * d.x + d.y * d.y) || 0.001;
      const p = positions.get(node.id)!;
      p.x += (d.x / dist) * Math.min(dist, temperature);
      p.y += (d.y / dist) * Math.min(dist, temperature);
      // Panatilihin sa loob ng 0..1 bounds.
      p.x = Math.min(1, Math.max(0, p.x));
      p.y = Math.min(1, Math.max(0, p.y));
    }

    temperature *= 0.97;
  }

  return data.nodes.map((node) => {
    const p = positions.get(node.id)!;
    return {
      ...node,
      x: p.x * WIDTH,
      y: p.y * HEIGHT,
    };
  });
}

export function KnowledgeGraph({ data }: KnowledgeGraphProps) {
  const router = useRouter();
  const initialLayout = useMemo(() => layoutGraph(data), [data]);
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(
    () => new Map(initialLayout.map((n) => [n.id, { x: n.x, y: n.y }]))
  );

  const [hiddenTypes, setHiddenTypes] = useState<Set<ArticleType>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [view, setView] = useState({ scale: 1, tx: 0, ty: 0 });
  const panState = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(
    null
  );
  const dragState = useRef<{ id: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const nodeById = useMemo(
    () => new Map(initialLayout.map((n) => [n.id, n])),
    [initialLayout]
  );

  const matchesQuery = (title: string) =>
    !query.trim() || title.toLowerCase().includes(query.trim().toLowerCase());

  function toggleType(type: ArticleType) {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  function screenToWorld(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const sx = ((clientX - rect.left) / rect.width) * WIDTH;
    const sy = ((clientY - rect.top) / rect.height) * HEIGHT;
    return {
      x: (sx - view.tx) / view.scale,
      y: (sy - view.ty) / view.scale,
    };
  }

  function handleNodePointerDown(e: React.PointerEvent, id: string) {
    e.stopPropagation();
    dragState.current = { id };
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  function handleSvgPointerMove(e: React.PointerEvent) {
    if (dragState.current) {
      const { x, y } = screenToWorld(e.clientX, e.clientY);
      setPositions((prev) => {
        const next = new Map(prev);
        next.set(dragState.current!.id, { x, y });
        return next;
      });
      return;
    }
    if (panState.current) {
      const dx = e.clientX - panState.current.startX;
      const dy = e.clientY - panState.current.startY;
      setView((v) => ({ ...v, tx: panState.current!.ox + dx, ty: panState.current!.oy + dy }));
    }
  }

  function handleSvgPointerUp() {
    dragState.current = null;
    panState.current = null;
  }

  function handleBackgroundPointerDown(e: React.PointerEvent) {
    panState.current = { startX: e.clientX, startY: e.clientY, ox: view.tx, oy: view.ty };
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setView((v) => ({ ...v, scale: Math.min(3, Math.max(0.3, v.scale * delta)) }));
  }

  function handleNodeClick(node: GraphNode) {
    router.push(`/${articleTypePath(node.type)}/${node.slug}`);
  }

  const visibleNodeIds = new Set(
    initialLayout
      .filter((n) => !hiddenTypes.has(n.type) && matchesQuery(n.title))
      .map((n) => n.id)
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Maghanap ng node…"
          className="w-48 rounded-md border border-border bg-transparent px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPE_LABELS) as ArticleType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-opacity",
                hiddenTypes.has(type)
                  ? "border-border text-muted-foreground opacity-50"
                  : "border-border"
              )}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: TYPE_COLORS[type] }}
              />
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setView({ scale: 1, tx: 0, ty: 0 })}
          className="ml-auto rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
        >
          Reset view
        </button>
      </div>

      {data.nodes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Wala pang articles — walang mai-graph.
        </p>
      ) : (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full touch-none rounded-md border border-border bg-muted/20"
          style={{ height: "70vh", cursor: panState.current ? "grabbing" : "grab" }}
          onPointerDown={handleBackgroundPointerDown}
          onPointerMove={handleSvgPointerMove}
          onPointerUp={handleSvgPointerUp}
          onPointerLeave={handleSvgPointerUp}
          onWheel={handleWheel}
        >
          <g transform={`translate(${view.tx} ${view.ty}) scale(${view.scale})`}>
            {data.edges.map((edge) => {
              const source = positions.get(edge.source);
              const target = positions.get(edge.target);
              if (!source || !target) return null;
              if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target))
                return null;
              const dimmed =
                hoveredId !== null &&
                hoveredId !== edge.source &&
                hoveredId !== edge.target;
              return (
                <line
                  key={edge.id}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="currentColor"
                  strokeOpacity={dimmed ? 0.08 : 0.35}
                  strokeWidth={1.5}
                  strokeDasharray={RELATION_DASH[edge.relationType]}
                  className="text-muted-foreground"
                >
                  <title>{edge.relationType}</title>
                </line>
              );
            })}

            {initialLayout.map((node) => {
              const pos = positions.get(node.id);
              if (!pos) return null;
              const visible = visibleNodeIds.has(node.id);
              const dimmed = hoveredId !== null && hoveredId !== node.id && !data.edges.some(
                (e) =>
                  (e.source === hoveredId && e.target === node.id) ||
                  (e.target === hoveredId && e.source === node.id)
              );
              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x} ${pos.y})`}
                  opacity={visible ? (dimmed ? 0.25 : 1) : 0.08}
                  onPointerDown={(e) => handleNodePointerDown(e, node.id)}
                  onPointerEnter={() => setHoveredId(node.id)}
                  onPointerLeave={() => setHoveredId(null)}
                  onClick={() => visible && handleNodeClick(node)}
                  className={visible ? "cursor-pointer" : "cursor-default"}
                >
                  <circle
                    r={node.status === "published" ? 9 : 6}
                    fill={TYPE_COLORS[node.type]}
                    stroke={node.status === "draft" ? "currentColor" : "none"}
                    strokeDasharray={node.status === "draft" ? "2 2" : undefined}
                    className="text-muted-foreground"
                  />
                  <text
                    x={12}
                    y={4}
                    fontSize={11}
                    className="select-none fill-foreground"
                  >
                    {node.title.length > 28 ? `${node.title.slice(0, 28)}…` : node.title}
                  </text>
                  <title>
                    {node.title} ({TYPE_LABELS[node.type]}, {node.status})
                  </title>
                </g>
              );
            })}
          </g>
        </svg>
      )}

      <p className="text-xs text-muted-foreground">
        I-drag ang isang node para ilipat ito, i-drag ang background para
        mag-pan, scroll para mag-zoom. Dashed ring = draft (solid = published).
        Dashed edges = "parent-of" / "used-with" / "depends-on" (hover sa
        linya para makita).
      </p>
    </div>
  );
}
