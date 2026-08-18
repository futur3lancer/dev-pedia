// Manual types na sumusunod sa 02-database-schema.md.
// Later, pwede itong palitan ng auto-generated types
// (`supabase gen types typescript`).

export type ArticleType =
  | "encyclopedia"
  | "concept"
  | "technology"
  | "architecture"
  | "experiment";

export type ArticleStatus = "draft" | "published";

export interface Article {
  id: string;
  user_id: string;
  type: ArticleType;
  title: string;
  slug: string;
  subcategory: string | null;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  status: ArticleStatus;
  is_favorite: boolean;
  last_viewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type RelationType = "related" | "parent-of" | "used-with" | "depends-on";

export interface ArticleRelation {
  id: string;
  article_id: string;
  related_article_id: string;
  relation_type: RelationType;
  created_at: string;
}

export type ReferenceType = "project" | "error";

export interface ArticleReference {
  id: string;
  article_id: string;
  reference_type: ReferenceType;
  reference_id: string;
  created_at: string;
}

export interface ErrorEntry {
  id: string;
  user_id: string;
  title: string;
  technology: string[];
  error_text: string;
  cause: string | null;
  solution: string;
  status: "resolved" | "unresolved";
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  description: string | null;
  stack: string[];
  architecture_notes: string | null;
  status: "active" | "completed" | "archived";
  started_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  title: string;
  url: string;
  description: string | null;
  created_at: string;
}

export interface ArchitectureDetails {
  article_id: string;
  when_to_use: string[];
  when_not_to_use: string[];
  advantages: string[];
  disadvantages: string[];
  diagram: string | null;
}

export interface ArticleVersion {
  id: string;
  article_id: string;
  title: string;
  content: string;
  excerpt: string | null;
  status: ArticleStatus;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  slug: string;
}

export interface ArticleTag {
  article_id: string;
  tag_id: string;
}

// Lightweight article shape para sa Related Concepts picker at sa
// pag-display ng related articles — hindi kailangan ang buong `content`.
export interface ArticleSummary {
  id: string;
  type: ArticleType;
  title: string;
  slug: string;
}

// Isang related article kasama ang relation metadata — ginagamit sa
// article view page (§ Related Concepts section).
export interface RelatedArticle extends ArticleSummary {
  relation_id: string;
  relation_type: RelationType;
  direction: "outgoing" | "incoming"; // outgoing: article -> related; incoming: related -> article
}

// Phase 5 (slice 5): persisted flashcard + SM-2 scheduling state. Tingnan
// ang lib/actions/flashcards.ts (Phase 4) para sa ephemeral generation
// type (front/back lang, walang id) — hiwalay ito dahil hindi lahat ng
// na-generate na deck ay naka-save.
export interface FlashcardRecord {
  id: string;
  article_id: string;
  front: string;
  back: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  due_at: string;
  last_reviewed_at: string | null;
  created_at: string;
}

// Flashcard na kasama na ang parent article info — ginagamit sa /review
// page para malaman kung saang article galing ang bawat due card.
export interface DueFlashcard extends FlashcardRecord {
  article_title: string;
  article_type: ArticleType;
  article_slug: string;
}
