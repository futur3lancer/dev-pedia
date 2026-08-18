"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CodeBlock } from "@/components/article-view/CodeBlock";

interface DiagramBlockProps {
  diagram: string;
}

// Phase 3 (slice 2): architecture_details.diagram ay pwedeng ASCII o
// Mermaid syntax (spec sa docs/02-database-schema.md §4) — walang hiwalay
// na field para pumili, kaya dito nag-a-auto-detect batay sa unang linya.
// Kung Mermaid, i-render bilang SVG via ang mermaid library. Kung hindi
// (ASCII art, box-drawing, atbp.), ipasa na lang sa CodeBlock bilang plain
// text — mas mababasa iyon nang naka-monospace kaysa i-force sa mermaid
// parser at sumabog.
const MERMAID_KEYWORDS = [
  "graph",
  "flowchart",
  "sequenceDiagram",
  "classDiagram",
  "stateDiagram",
  "stateDiagram-v2",
  "erDiagram",
  "journey",
  "gantt",
  "pie",
  "gitGraph",
  "mindmap",
  "timeline",
  "quadrantChart",
  "requirementDiagram",
  "C4Context",
];

function looksLikeMermaid(diagram: string): boolean {
  const firstLine = diagram.trim().split("\n")[0]?.trim() ?? "";
  return MERMAID_KEYWORDS.some(
    (kw) => firstLine === kw || firstLine.startsWith(kw + " ") || firstLine.startsWith(kw + "\n")
  );
}

export function DiagramBlock({ diagram }: DiagramBlockProps) {
  const isMermaid = looksLikeMermaid(diagram);

  if (!isMermaid) {
    return <CodeBlock language="text" code={diagram} />;
  }

  return <MermaidDiagram diagram={diagram} />;
}

function MermaidDiagram({ diagram }: { diagram: string }) {
  const containerId = useId().replace(/:/g, "-");
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false, theme: "neutral" });
        const { svg } = await mermaid.render(`mermaid-${containerId}`, diagram);
        if (!cancelled) setSvg(svg);
      } catch (e) {
        if (!cancelled) {
          setRenderError(
            e instanceof Error ? e.message : "Hindi ma-render ang diagram."
          );
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [diagram, containerId]);

  if (renderError) {
    // Fallback sa plain code block kapag may syntax error sa mermaid —
    // mas mabuti pang makita ng user ang raw text kaysa walang laman.
    return (
      <div className="space-y-2">
        <p className="text-xs text-error">
          Hindi na-parse bilang Mermaid diagram ({renderError}) — raw text na lang:
        </p>
        <CodeBlock language="text" code={diagram} />
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex min-h-[120px] items-center justify-center rounded-lg border border-border text-xs text-muted-foreground">
        Iginu-guhit ang diagram…
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="overflow-x-auto rounded-lg border border-border bg-white p-4 [&_svg]:mx-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
