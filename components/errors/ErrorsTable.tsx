"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { timeAgo } from "@/lib/utils";
import type { ErrorEntry } from "@/types/database";

// Phase 4 (slice 1): Errors log bilang tunay na table view. Dating flat
// `divide-y` list lang ito (Phase 2) — sapat noon dahil kaunti pa ang mga
// naka-log. Sa scale na ito, kailangan nang makita ang technology + status
// + huling update nang magkatabi at ma-sort, hindi na kailangang i-click
// pa isa-isa para malaman kung alin ang matagal nang hindi na-touch.
// Client component dahil client-side lang ang sorting (walang query param
// round-trip) — ang technology filter naman ay nasa page.tsx pa rin
// (server-side, via searchParams), kaya URL-shareable ang filtered view.

type SortKey = "title" | "technology" | "status" | "updated_at";
type SortDirection = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "technology", label: "Technology" },
  { key: "status", label: "Status" },
  { key: "updated_at", label: "Last updated" },
];

export function ErrorsTable({ errors }: { errors: ErrorEntry[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  const sorted = useMemo(() => {
    const rows = [...errors];
    rows.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
        case "technology":
          cmp = (a.technology[0] ?? "").localeCompare(b.technology[0] ?? "");
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
        case "updated_at":
          cmp = a.updated_at.localeCompare(b.updated_at);
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [errors, sortKey, sortDirection]);

  if (errors.length === 0) {
    return (
      <p className="text-muted-foreground">
        Wala pang error na naka-log. Gawa ka ng una gamit ang &ldquo;+ New Error&rdquo;.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-surface">
            {COLUMNS.map((col) => (
              <th key={col.key} className="text-left">
                <button
                  type="button"
                  onClick={() => toggleSort(col.key)}
                  className="flex w-full items-center gap-1 px-4 py-2.5 font-medium text-muted-foreground hover:text-foreground"
                >
                  {col.label}
                  <SortIcon active={sortKey === col.key} direction={sortDirection} />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((e) => (
            <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted">
              <td className="px-4 py-2.5">
                <Link href={`/errors/${e.id}`} className="font-medium hover:text-primary">
                  {e.title}
                </Link>
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">
                {e.technology.length > 0 ? e.technology.join(" · ") : "—"}
              </td>
              <td className="px-4 py-2.5">
                <Badge tone={e.status === "resolved" ? "success" : "warning"} dot>
                  {e.status}
                </Badge>
              </td>
              <td className="px-4 py-2.5 text-muted-foreground">{timeAgo(e.updated_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortIcon({ active, direction }: { active: boolean; direction: SortDirection }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
  return direction === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5" />
  );
}
