"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { articleTypePath, cn } from "@/lib/utils";
import type { GraphData, GraphNode } from "@/lib/actions/graph";
import type { ArticleType, RelationType } from "@/types/database";

// Phase 5 (slice 2): Knowledge graph visualization — "Obsidian-style".
//
// Bakit canvas sa halip na SVG (dating implementation): sa dati, lahat ng
// node ay pumupunta sa tinatawag na "shape" ng isang one-shot Fruchterman-
// Reingold layout — walang collision radius, kaya kapag maraming naka-
// cluster na node sa isang lugar, nagtatabing ang mga label at text
// (makikita mo ito sa mga screenshot: nagkakabuhol-buhol ang text sa
// kaliwang itaas). Dito, tuloy-tuloy na tumatakbo ang simulation
// (requestAnimationFrame, hindi fixed 300 iterations) kasama ang soft
// collision detection kaya humihiwalay ang mga magkakalapit na node sa
// halip na magkapatong — kagaya ng Obsidian's graph view. Canvas din ang
// mas gusto dahil mas mura ang pag-draw ng daan-daang linya/glow kaysa sa
// pag-mount ng ganoon karaming SVG node bilang DOM elements.
//
// GSAP ang gumagalaw sa lahat ng "presentational" na values (hindi sa
// physics mismo): entrance scale/stagger ng mga node, fade-in ng edges,
// hover glow pulse, at yung smooth camera pan/zoom papunta sa isang node
// paglipat dito.

interface KnowledgeGraphProps {
  data: GraphData;
}

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  degree: number;
  spawn: number; // gsap-driven entrance scale, 0..1
  glow: number; // gsap-driven hover/focus glow, 0..1
  dragging: boolean;
  labelWidth: number; // measured sa canvas, ginagamit para sa collision allowance
  wanderPhase: number; // random per-node offset para hindi magkasabay ang idle drift
  wanderFreq: number; // random per-node speed ng idle drift
}

interface SimEdge {
  id: string;
  source: SimNode;
  target: SimNode;
  relationType: RelationType;
  draw: number; // gsap-driven draw-in progress, 0..1
}

const TYPE_COLORS: Record<ArticleType, string> = {
  encyclopedia: "#7c9cf6",
  concept: "#4ade80",
  technology: "#f5a623",
  architecture: "#f0629c",
  experiment: "#22d3ee",
};

const TYPE_LABELS: Record<ArticleType, string> = {
  encyclopedia: "Encyclopedia",
  concept: "Concept",
  technology: "Technology",
  architecture: "Architecture",
  experiment: "Experiment",
};

const RELATION_ALPHA: Record<RelationType, number> = {
  related: 0.14,
  "parent-of": 0.2,
  "used-with": 0.14,
  "depends-on": 0.18,
};

// Physics tuning — panatilihing katulad ng Obsidian: mahinang center pull,
// malakas na repulsion, links na parang spring, at soft collision para
// hindi magkapatong ang mga bilog/labels.
const CENTER_STRENGTH = 0.012;
const REPULSE = 2600;
const LINK_DIST = 78;
const LINK_STRENGTH = 0.045;
const DAMPING = 0.86;
const ALPHA_DECAY = 0.0018;
// Sa halip na tumigil nang tuluyan ang simulation (dating ALPHA_MIN gate),
// may permanenteng "idle floor" na alpha para mabuhay pa rin nang bahagya
// ang graph — mahihinang puwersa lamang, hindi na malakas na re-layout.
const ALPHA_IDLE = 0.045;
// Mahinang random na "wander" na puwersa bawat node kada frame, hiwalay sa
// alpha decay, para may tuloy-tuloy na subtle na galaw (parang humihinga)
// sa halip na tuluyang tumigil at mag-freeze.
const WANDER_STRENGTH = 0.03;
// Karagdagang layo sa collision base sa r+r+padding, para may espasyo ang
// mga node mula sa isa't isa kahit magkalapit — allowance para sa readability.
const COLLISION_PADDING = 34;
// Gaano kalakas ibalik pabalik-papasok ang isang node kapag lumagpas na ito
// sa boundaryRadius — sapat lang para mapanatili ang hugis-sphere, pero
// hindi masyadong malakas na parang bakod na bumabato sa node.
const BOUNDARY_STRENGTH = 0.05;
// Gaano kalaki ang idadagdag na collision allowance base sa haba ng label
// (sa mundo/world units) ng bawat node, para hindi nagsasapaw ang text.
const LABEL_ALLOWANCE_FACTOR = 0.42;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function buildSim(data: GraphData): { nodes: SimNode[]; edges: SimEdge[]; boundaryRadius: number } {
  // Filled-disk ("sunflower seed") packing: pantay-pantay na kumakalat ang
  // mga node papuno ng isang bounded na circle sa halip na isang spiral na
  // lumalayo nang lumalayo — kaya kahit ilan pa ang node, naka-fit lahat sa
  // loob ng iisang circle sa una pa lang, bago pa man kumilos ang physics.
  const n = data.nodes.length || 1;
  const R = 30 * Math.sqrt(n);
  const nodes: SimNode[] = data.nodes.map((node, i) => {
    const a = i * GOLDEN_ANGLE;
    const rFrac = Math.sqrt((i + 0.5) / n);
    const r = R * rFrac;
    return {
      ...node,
      x: r * Math.cos(a),
      y: r * Math.sin(a),
      vx: 0,
      vy: 0,
      r: 5,
      degree: 0,
      spawn: 0,
      glow: 0,
      dragging: false,
      labelWidth: 0,
      wanderPhase: Math.random() * Math.PI * 2,
      wanderFreq: 0.35 + Math.random() * 0.5,
    };
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges: SimEdge[] = [];
  data.edges.forEach((e) => {
    const source = byId.get(e.source);
    const target = byId.get(e.target);
    if (!source || !target) return;
    source.degree++;
    target.degree++;
    edges.push({ id: e.id, source, target, relationType: e.relationType, draw: 0 });
  });
  nodes.forEach((n) => {
    n.r = 5 + Math.min(9, n.degree * 1.15);
  });
  // Bahagyang mas malaki kaysa sa packing radius sa itaas, para may espasyo
  // pang huminga ang mga node/edge kapag nag-settle na ang physics, pero
  // hindi pa rin sila makakalabas nang malayo sa hugis-sphere na hangganan.
  const boundaryRadius = R * 1.25;
  return { nodes, edges, boundaryRadius };
}

export function KnowledgeGraph({ data }: KnowledgeGraphProps) {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const infoCardRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const sim = useMemo(() => buildSim(data), [data]);

  const [hiddenTypes, setHiddenTypes] = useState<Set<ArticleType>>(new Set());
  const [query, setQuery] = useState("");
  const [hoverNode, setHoverNode] = useState<SimNode | null>(null);

  // Mutable, non-reactive state — sadyang hindi ito naka-useState dahil
  // gagalawin ito 60x/sec sa animation loop, at hindi natin gustong
  // mag-trigger ng React re-render sa bawat frame.
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1 });
  const alphaRef = useRef(1);
  const interactionRef = useRef<{
    panning: boolean;
    panStart: { sx: number; sy: number; cx: number; cy: number } | null;
    dragNode: SimNode | null;
    moved: boolean;
  }>({ panning: false, panStart: null, dragNode: null, moved: false });

  function toggleType(type: ArticleType) {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  function worldToScreen(x: number, y: number, W: number, H: number) {
    const cam = cameraRef.current;
    return { x: W / 2 + (x - cam.x) * cam.zoom, y: H / 2 + (y - cam.y) * cam.zoom };
  }
  function screenToWorld(sx: number, sy: number, W: number, H: number) {
    const cam = cameraRef.current;
    return { x: (sx - W / 2) / cam.zoom + cam.x, y: (sy - H / 2) / cam.zoom + cam.y };
  }

  function nodeAtScreen(sx: number, sy: number, W: number, H: number): SimNode | null {
    for (let i = sim.nodes.length - 1; i >= 0; i--) {
      const n = sim.nodes[i];
      if (hiddenTypes.has(n.type)) continue;
      const p = worldToScreen(n.x, n.y, W, H);
      const rr = n.r * n.spawn * cameraRef.current.zoom + 4;
      const dx = sx - p.x;
      const dy = sy - p.y;
      if (dx * dx + dy * dy <= rr * rr) return n;
    }
    return null;
  }

  function focusNode(n: SimNode) {
    gsap.to(cameraRef.current, { x: n.x, y: n.y, zoom: 1.7, duration: 0.8, ease: "power3.inOut" });
    gsap.fromTo(n, { glow: 0.3 }, { glow: 1, duration: 0.5, yoyo: true, repeat: 1, ease: "sine.inOut" });
  }

  function playEntrance() {
    sim.nodes.forEach((n) => (n.spawn = 0));
    sim.edges.forEach((e) => (e.draw = 0));
    const tl = gsap.timeline();
    // Slow-motion "pop up": mas mahabang duration bawat node, mas mahinang
    // overshoot (hindi kasing-bounce ng dati), at "amount"-based na stagger
    // (sa halip na "each") para bounded ang kabuuang haba ng animation
    // anuman ang bilang ng node — lumalabas ito mula sa gitna papalabas,
    // parang bumubukadkad, bagay sa bagong filled-circle na layout.
    tl.to(
      sim.nodes,
      { spawn: 1, duration: 1.3, ease: "back.out(1.6)", stagger: { amount: 1.7, from: "center" } },
      0
    );
    tl.to(
      sim.edges,
      { draw: 1, duration: 1.0, ease: "power2.out", stagger: { amount: 1.3, from: "start" } },
      0.5
    );
  }

  function resetView() {
    gsap.to(cameraRef.current, { x: 0, y: 0, zoom: 1, duration: 0.7, ease: "power3.inOut" });
  }

  // Setup: canvas sizing, physics + render loop, pointer/wheel handlers.
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let W = 0;
    let H = 0;
    const ctx = canvas.getContext("2d")!;

    // I-measure ang label ng bawat node isang beses lang dito (hindi sa
    // tuwing draw) para magamit bilang collision allowance sa physics —
    // kaya may sapat na puwang ang mga node na may mahabang title.
    ctx.font = "11px -apple-system, Inter, sans-serif";
    for (const n of sim.nodes) {
      const label = n.title.length > 34 ? `${n.title.slice(0, 34)}…` : n.title;
      n.labelWidth = ctx.measureText(label).width;
    }

    let frame = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = container!.clientWidth;
      H = container!.clientHeight;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    function tickPhysics() {
      frame++;
      // Bumaba ang alpha papunta sa isang idle floor sa halip na zero —
      // hindi na kailangang mag-early-return/mag-freeze; magpapatuloy pa
      // rin ang mahihinang puwersa (at ang collision push, na hiwalay sa
      // alpha) kahit matagal nang bukas ang graph.
      alphaRef.current = Math.max(ALPHA_IDLE, alphaRef.current - ALPHA_DECAY);
      const alpha = alphaRef.current;
      const nodes = sim.nodes;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          let dx = a.x - b.x;
          let dy = a.y - b.y;
          let d2 = dx * dx + dy * dy;
          if (d2 < 0.01) {
            dx = Math.random() - 0.5;
            dy = Math.random() - 0.5;
            d2 = 0.01;
          }
          const d = Math.sqrt(d2);
          const labelAllowance =
            Math.max(a.labelWidth, b.labelWidth) * LABEL_ALLOWANCE_FACTOR;
          const minD = a.r + b.r + COLLISION_PADDING + labelAllowance;
          const force = (REPULSE / d2) * alpha;
          const fx = (dx / d) * force;
          const fy = (dy / d) * force;
          if (!a.dragging) {
            a.vx += fx;
            a.vy += fy;
          }
          if (!b.dragging) {
            b.vx -= fx;
            b.vy -= fy;
          }
          if (d < minD) {
            const push = (minD - d) * 0.5;
            const px = (dx / d) * push;
            const py = (dy / d) * push;
            if (!a.dragging) {
              a.x += px * 0.5;
              a.y += py * 0.5;
            }
            if (!b.dragging) {
              b.x -= px * 0.5;
              b.y -= py * 0.5;
            }
          }
        }
        if (!a.dragging) {
          a.vx -= a.x * CENTER_STRENGTH * alpha;
          a.vy -= a.y * CENTER_STRENGTH * alpha;
          // Soft boundary wall: kapag lumagpas ang isang node sa hangganan
          // ng sphere/circle, itutulak ito pabalik papasok — kaya kahit
          // tumatakbo ang repulsion sa mahabang panahon, nananatiling
          // naka-contain sa loob ng bilog ang buong graph sa halip na
          // kumalat sa buong canvas.
          const dist = Math.sqrt(a.x * a.x + a.y * a.y) || 0.01;
          if (dist > sim.boundaryRadius) {
            const excess = dist - sim.boundaryRadius;
            const nx = a.x / dist;
            const ny = a.y / dist;
            a.vx -= nx * excess * BOUNDARY_STRENGTH * alpha;
            a.vy -= ny * excess * BOUNDARY_STRENGTH * alpha;
          }
        }
      }
      for (const e of sim.edges) {
        const a = e.source;
        const b = e.target;
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const force = (d - LINK_DIST) * LINK_STRENGTH * alpha;
        const fx = (dx / d) * force;
        const fy = (dy / d) * force;
        if (!a.dragging) {
          a.vx += fx;
          a.vy += fy;
        }
        if (!b.dragging) {
          b.vx -= fx;
          b.vy -= fy;
        }
      }
      for (const n of nodes) {
        if (n.dragging) continue;
        // Tuloy-tuloy, mahinang random na galaw — hiwalay sa alpha decay
        // kaya hindi na tuluyang tumitigil ang mga node, pero dahil ang
        // bilis at amplitude ay maliit lamang, "low movement" lang ito,
        // hindi malaking re-layout. Ang collision push naman sa itaas ang
        // bumabantay para hindi sila magbanggaan habang gumagalaw.
        n.vx += Math.sin(frame * 0.016 * n.wanderFreq + n.wanderPhase) * WANDER_STRENGTH;
        n.vy += Math.cos(frame * 0.016 * n.wanderFreq * 0.85 + n.wanderPhase * 1.7) * WANDER_STRENGTH;
        n.vx *= DAMPING;
        n.vy *= DAMPING;
        n.x += n.vx;
        n.y += n.vy;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      const cam = cameraRef.current;
      ctx.translate(W / 2, H / 2);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-cam.x, -cam.y);

      const hn = hoverNodeRef.current;
      const activeIds = hn
        ? new Set<string>([
            hn.id,
            ...sim.edges
              .filter((e) => e.source === hn || e.target === hn)
              .map((e) => (e.source === hn ? e.target.id : e.source.id)),
          ])
        : null;
      const q = queryRef.current;

      for (const e of sim.edges) {
        if (hiddenTypes.has(e.source.type) || hiddenTypes.has(e.target.type)) continue;
        if (e.draw <= 0) continue;
        const dim = activeIds && !activeIds.has(e.source.id) && !activeIds.has(e.target.id);
        const hi = !!(activeIds && activeIds.has(e.source.id) && activeIds.has(e.target.id));
        const sx = e.source.x;
        const sy = e.source.y;
        const ex = e.source.x + (e.target.x - e.source.x) * e.draw;
        const ey = e.source.y + (e.target.y - e.source.y) * e.draw;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = hi
          ? "rgba(139,124,246,0.85)"
          : dim
            ? "rgba(255,255,255,0.03)"
            : `rgba(255,255,255,${RELATION_ALPHA[e.relationType]})`;
        ctx.lineWidth = (hi ? 1.6 : 1) / cam.zoom;
        ctx.stroke();
      }

      const showLabelZoom = cam.zoom > 0.55;
      for (const n of sim.nodes) {
        if (hiddenTypes.has(n.type)) continue;
        if (n.spawn <= 0.001) continue;
        const matches = !q || n.title.toLowerCase().includes(q);
        const dim = (activeIds && !activeIds.has(n.id)) || (!!q && !matches);
        const r = n.r * n.spawn;

        ctx.save();
        ctx.globalAlpha = dim ? 0.12 : 1;
        if (n.glow > 0) {
          ctx.shadowColor = TYPE_COLORS[n.type];
          ctx.shadowBlur = 18 * n.glow;
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = TYPE_COLORS[n.type];
        ctx.fill();
        if (n.status === "draft") {
          ctx.shadowBlur = 0;
          ctx.setLineDash([2, 2]);
          ctx.strokeStyle = "rgba(231,231,234,0.6)";
          ctx.lineWidth = 1 / cam.zoom;
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.shadowBlur = 0;

        if (n === hn) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 3.5, 0, Math.PI * 2);
          ctx.strokeStyle = TYPE_COLORS[n.type];
          ctx.lineWidth = 1.4 / cam.zoom;
          ctx.stroke();
        }

        const labelShown = !dim && (showLabelZoom || n === hn || n.degree >= 5 || (!!q && matches));
        if (labelShown) {
          ctx.font = `${11 / cam.zoom}px -apple-system, Inter, sans-serif`;
          ctx.fillStyle = "rgba(231,231,234,0.92)";
          ctx.textBaseline = "middle";
          const label = n.title.length > 34 ? `${n.title.slice(0, 34)}…` : n.title;
          ctx.fillText(label, n.x + r + 6 / cam.zoom, n.y);
        }
        ctx.restore();
      }
      ctx.restore();
    }

    function loop() {
      tickPhysics();
      draw();
      rafRef.current = requestAnimationFrame(loop);
    }

    function reheat(v: number) {
      alphaRef.current = Math.max(alphaRef.current, v);
    }

    function handlePointerDown(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const it = interactionRef.current;
      it.moved = false;
      const hit = nodeAtScreen(sx, sy, W, H);
      if (hit) {
        it.dragNode = hit;
        hit.dragging = true;
        canvas!.setPointerCapture(e.pointerId);
      } else {
        it.panning = true;
        it.panStart = { sx, sy, cx: cameraRef.current.x, cy: cameraRef.current.y };
        canvas!.classList.add("cursor-grabbing");
      }
    }

    function handlePointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const it = interactionRef.current;
      if (it.dragNode) {
        it.moved = true;
        const w = screenToWorld(sx, sy, W, H);
        it.dragNode.x = w.x;
        it.dragNode.y = w.y;
        it.dragNode.vx = 0;
        it.dragNode.vy = 0;
        reheat(0.35);
      } else if (it.panning && it.panStart) {
        it.moved = true;
        cameraRef.current.x = it.panStart.cx - (sx - it.panStart.sx) / cameraRef.current.zoom;
        cameraRef.current.y = it.panStart.cy - (sy - it.panStart.sy) / cameraRef.current.zoom;
      } else {
        const hit = nodeAtScreen(sx, sy, W, H);
        if (hit !== hoverNodeRef.current) {
          setHoverNode(hit);
        }
      }
    }

    function handlePointerUp() {
      const it = interactionRef.current;
      if (it.dragNode) {
        it.dragNode.dragging = false;
        it.dragNode = null;
      }
      it.panning = false;
      it.panStart = null;
      canvas!.classList.remove("cursor-grabbing");
    }

    function handleClick(e: MouseEvent) {
      const it = interactionRef.current;
      if (it.moved) return;
      const rect = canvas!.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const hit = nodeAtScreen(sx, sy, W, H);
      if (hit) {
        focusNode(hit);
        window.setTimeout(() => {
          router.push(`/${articleTypePath(hit.type)}/${hit.slug}`);
        }, 350);
      }
    }

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = canvas!.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const before = screenToWorld(sx, sy, W, H);
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      cameraRef.current.zoom = Math.min(3.2, Math.max(0.25, cameraRef.current.zoom * factor));
      const after = screenToWorld(sx, sy, W, H);
      cameraRef.current.x += before.x - after.x;
      cameraRef.current.y += before.y - after.y;
    }

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointerleave", handlePointerUp);
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("wheel", handleWheel, { passive: false });

    playEntrance();
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      ro.disconnect();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointerleave", handlePointerUp);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("wheel", handleWheel);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim, hiddenTypes]);

  // Refs para magamit ang latest hover/query values sa loob ng closures na
  // itinakda na noong mount (sa halip na i-restart ang buong effect sa
  // bawat keystroke, na magre-restart din sa entrance animation).
  const hoverNodeRef = useRef<SimNode | null>(null);
  const queryRef = useRef("");
  useEffect(() => {
    hoverNodeRef.current = hoverNode;
  }, [hoverNode]);
  useEffect(() => {
    queryRef.current = query.trim().toLowerCase();
  }, [query]);

  useEffect(() => {
    if (!infoCardRef.current) return;
    if (hoverNode) {
      gsap.to(infoCardRef.current, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" });
    } else {
      gsap.to(infoCardRef.current, { opacity: 0, y: -6, duration: 0.2, ease: "power2.in" });
    }
  }, [hoverNode]);

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
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={playEntrance}
            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
          >
            Replay animation
          </button>
          <button
            type="button"
            onClick={resetView}
            className="rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted"
          >
            Reset view
          </button>
        </div>
      </div>

      {data.nodes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Wala pang articles — walang mai-graph.
        </p>
      ) : (
        <div ref={containerRef} className="relative w-full overflow-hidden rounded-md border border-border bg-[#0a0a0d]" style={{ height: "70vh" }}>
          <canvas ref={canvasRef} className="h-full w-full cursor-grab touch-none" />

          <div
            ref={infoCardRef}
            className="pointer-events-none absolute right-3 top-3 w-56 rounded-lg border border-white/10 bg-black/70 p-3 opacity-0 backdrop-blur"
            style={{ transform: "translateY(-6px)" }}
          >
            {hoverNode && (
              <>
                <div
                  className="mb-1 text-[10px] font-medium uppercase tracking-wide"
                  style={{ color: TYPE_COLORS[hoverNode.type] }}
                >
                  {TYPE_LABELS[hoverNode.type]}
                </div>
                <div className="mb-1.5 text-sm font-semibold leading-snug text-white">
                  {hoverNode.title}
                </div>
                <div className="text-[11px] text-white/50">
                  {hoverNode.degree} na koneksyon · {hoverNode.status}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        I-drag ang isang node para ilipat ito, i-drag ang background para
        mag-pan, scroll para mag-zoom, click para mag-focus at pumunta sa
        article. Dashed ring = draft (solid = published).
      </p>
    </div>
  );
}
