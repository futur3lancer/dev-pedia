"use server";

import { createClient } from "@/lib/supabase/server";
import type { ArticleType } from "@/types/database";

// Phase 5 (slice 3): Learning progress — "ilang articles na ba ang
// na-cover mo sa isang topic tree" (03-roadmap.md §6). Walang bagong
// table dito: ang "topic tree" ay ang existing `type` → `subcategory`
// grouping na nasa `articles` na mismo (Phase 1 pa ang `subcategory`
// column), hindi hiwalay na curated structure. "Covered" = published
// (draft articles are counted as part of the tree but not yet "done").
//
// select() dito ay explicit na column list, HINDI select("*") — sinadya,
// para hindi madagdagan pa ang embedding-bandwidth issue na naka-flag
// na sa slice 2 (03-roadmap.md, "Known follow-up (bandwidth)"). Progress
// tracking ay isa sa mga exact na lugar na sinasabi noong note na dapat
// explicit ang column list, kaya sinusunod na agad dito sa halip na
// idagdag pa sa audit backlog.

const TYPE_ORDER: ArticleType[] = [
  "encyclopedia",
  "concept",
  "technology",
  "architecture",
  "experiment",
];

const UNCATEGORIZED = "Uncategorized";

export interface SubcategoryProgress {
  subcategory: string;
  total: number;
  published: number;
}

export interface TypeProgress {
  type: ArticleType;
  total: number;
  published: number;
  subcategories: SubcategoryProgress[];
}

export interface LearningProgress {
  overall: { total: number; published: number };
  byType: TypeProgress[];
}

export async function getLearningProgress(): Promise<LearningProgress> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("articles")
    .select("type, subcategory, status");

  if (error) throw error;

  const byType = new Map<
    ArticleType,
    { total: number; published: number; subs: Map<string, SubcategoryProgress> }
  >();

  for (const type of TYPE_ORDER) {
    byType.set(type, { total: 0, published: 0, subs: new Map() });
  }

  let overallTotal = 0;
  let overallPublished = 0;

  for (const row of data) {
    const bucket = byType.get(row.type as ArticleType);
    if (!bucket) continue; // hindi dapat mangyari — safety lang laban sa future type na hindi pa nakalista dito

    const isPublished = row.status === "published";
    const subKey = row.subcategory?.trim() || UNCATEGORIZED;

    bucket.total += 1;
    if (isPublished) bucket.published += 1;

    const sub = bucket.subs.get(subKey) ?? {
      subcategory: subKey,
      total: 0,
      published: 0,
    };
    sub.total += 1;
    if (isPublished) sub.published += 1;
    bucket.subs.set(subKey, sub);

    overallTotal += 1;
    if (isPublished) overallPublished += 1;
  }

  const result: TypeProgress[] = TYPE_ORDER.map((type) => {
    const bucket = byType.get(type)!;
    const subcategories = Array.from(bucket.subs.values()).sort((a, b) => {
      // Uncategorized laging huli, iba pa alphabetical.
      if (a.subcategory === UNCATEGORIZED) return 1;
      if (b.subcategory === UNCATEGORIZED) return -1;
      return a.subcategory.localeCompare(b.subcategory);
    });

    return {
      type,
      total: bucket.total,
      published: bucket.published,
      subcategories,
    };
  });

  return {
    overall: { total: overallTotal, published: overallPublished },
    byType: result,
  };
}
