import { NextRequest, NextResponse } from "next/server";
import { searchArticles } from "@/lib/actions/search";

// GET /api/search?q=... — tsvector full-text search, ILIKE fallback
// (see lib/actions/search.ts para sa buong rationale).
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";

  try {
    const results = await searchArticles(q);
    return NextResponse.json({ query: q, results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}
