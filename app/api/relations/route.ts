import { NextRequest, NextResponse } from "next/server";
import { addRelation, getRelatedArticles } from "@/lib/actions/relations";
import type { RelationType } from "@/types/database";

const RELATION_TYPES: RelationType[] = [
  "related",
  "parent-of",
  "used-with",
  "depends-on",
];

// GET /api/relations?articleId=... — list related articles (article_relations),
// both directions (outgoing + incoming edges).
export async function GET(req: NextRequest) {
  const articleId = req.nextUrl.searchParams.get("articleId");

  if (!articleId) {
    return NextResponse.json(
      { error: 'Missing required query param "articleId"' },
      { status: 400 }
    );
  }

  try {
    const relations = await getRelatedArticles(articleId);
    return NextResponse.json({ articleId, relations });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list relations" },
      { status: 500 }
    );
  }
}

// POST /api/relations — link two articles (article_relations)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { articleId, relatedArticleId, relationType } = body ?? {};

  if (!articleId || typeof articleId !== "string") {
    return NextResponse.json({ error: 'Missing required field "articleId"' }, { status: 400 });
  }
  if (!relatedArticleId || typeof relatedArticleId !== "string") {
    return NextResponse.json(
      { error: 'Missing required field "relatedArticleId"' },
      { status: 400 }
    );
  }
  if (relationType && !RELATION_TYPES.includes(relationType)) {
    return NextResponse.json(
      { error: `Invalid relationType. Must be one of: ${RELATION_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    await addRelation(articleId, relatedArticleId, relationType ?? "related");
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create relation" },
      { status: 500 }
    );
  }
}
