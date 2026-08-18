import { NextRequest, NextResponse } from "next/server";
import { createArticle, listArticles } from "@/lib/actions/articles";
import type { ArticleStatus, ArticleType } from "@/types/database";

const ARTICLE_TYPES: ArticleType[] = [
  "encyclopedia",
  "concept",
  "technology",
  "architecture",
  "experiment",
];
const ARTICLE_STATUSES: ArticleStatus[] = ["draft", "published"];

// GET /api/articles?type=&status=&subcategory= — list articles (RLS: owner-only)
export async function GET(req: NextRequest) {
  const typeParam = req.nextUrl.searchParams.get("type");
  const statusParam = req.nextUrl.searchParams.get("status");
  const subcategory = req.nextUrl.searchParams.get("subcategory") ?? undefined;

  if (typeParam && !ARTICLE_TYPES.includes(typeParam as ArticleType)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${ARTICLE_TYPES.join(", ")}` },
      { status: 400 }
    );
  }
  if (statusParam && !ARTICLE_STATUSES.includes(statusParam as ArticleStatus)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${ARTICLE_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const articles = await listArticles({
      type: (typeParam as ArticleType) ?? undefined,
      status: (statusParam as ArticleStatus) ?? undefined,
      subcategory,
    });
    return NextResponse.json({ articles });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list articles" },
      { status: 500 }
    );
  }
}

// POST /api/articles — create a new article
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, title, slug, content, subcategory, excerpt, status } = body ?? {};

  if (!type || !ARTICLE_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `Missing or invalid "type". Must be one of: ${ARTICLE_TYPES.join(", ")}` },
      { status: 400 }
    );
  }
  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: 'Missing required field "title"' }, { status: 400 });
  }
  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ error: 'Missing required field "slug"' }, { status: 400 });
  }
  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: 'Missing required field "content"' }, { status: 400 });
  }
  if (status && !ARTICLE_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${ARTICLE_STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const article = await createArticle({
      type,
      title,
      slug,
      content,
      subcategory,
      excerpt,
      status,
    });
    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create article";
    const status = message === "Not authenticated" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
