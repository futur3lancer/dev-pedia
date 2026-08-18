"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Flashcard } from "@/lib/actions/flashcards";
import type { DueFlashcard, FlashcardRecord } from "@/types/database";

// Phase 5 (slice 5): Spaced repetition — schedule ng review base sa mga
// flashcard na na-generate sa Phase 4 (03-roadmap.md §6). Dalawang parte
// ito:
//   1. Pag-save ng isang generated deck (mula sa ephemeral
//      generateFlashcards() sa lib/actions/flashcards.ts) papunta sa
//      bagong `flashcards` table.
//   2. Ang aktwal na SM-2 algorithm — kung kailan lalabas ulit ang isang
//      card pagkatapos mong i-review (see: SuperMemo 2, Piotr Wozniak).
//
// Quality scale: sinasadyang 4 buttons na lang sa UI (Again/Hard/Good/
// Easy) sa halip na ang buong 0-5 scale ng orihinal na SM-2 — mas simple
// para sa isang personal na tool, standard na simplification ito na
// ginagawa rin ng mga tool gaya ng Anki. Naka-map sa mismong 0-5 scale sa
// ibaba (QUALITY_MAP) para hindi kailangang baguhin ang formula mismo.

export type ReviewGrade = "again" | "hard" | "good" | "easy";

const QUALITY_MAP: Record<ReviewGrade, number> = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5,
};

const MIN_EASE_FACTOR = 1.3;

// normalizeFront: para sa dedup lang, hindi para sa display. Lowercase,
// tanggalin ang punctuation, i-collapse ang whitespace — sadyang simpleng
// exact-match-after-normalization (hindi fuzzy/embedding-based), sapat na
// para sa karaniwang "nag-regenerate, parehong tanong ulit" na case nang
// hindi kailangan ng bagong dependency o AI call. Kung magkaiba talaga ang
// pagkakasabi (hindi lang punctuation/casing), papasa pa rin — sinadya
// itong konserbatibo, mas ok ang di-natanggal na duplicate kaysa
// natanggal na hindi naman duplicate.
function normalizeFront(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface SaveFlashcardDeckResult {
  saved: number;
  skipped: number;
}

export async function saveFlashcardDeck(
  articleId: string,
  cards: Flashcard[]
): Promise<SaveFlashcardDeckResult> {
  if (cards.length === 0) return { saved: 0, skipped: 0 };

  const supabase = createClient();

  const { data: existing, error: existingError } = await supabase
    .from("flashcards")
    .select("front")
    .eq("article_id", articleId);

  if (existingError) throw existingError;

  const existingNormalized = new Set(
    (existing ?? []).map((c) => normalizeFront(c.front))
  );

  const toInsert: Flashcard[] = [];
  // Dedup din laban sa ibang cards sa parehong batch (hal. inulit ng AI
  // ang parehong tanong sa isang generate) — kaya idinaragdag agad sa
  // Set ang bawat kasama, hindi lang ang galing sa DB.
  for (const card of cards) {
    const key = normalizeFront(card.front);
    if (existingNormalized.has(key)) continue;
    existingNormalized.add(key);
    toInsert.push(card);
  }

  const skipped = cards.length - toInsert.length;
  if (toInsert.length === 0) {
    return { saved: 0, skipped };
  }

  const { error } = await supabase.from("flashcards").insert(
    toInsert.map((c) => ({
      article_id: articleId,
      front: c.front,
      back: c.back,
    }))
  );

  if (error) throw error;

  revalidatePath("/review");
  return { saved: toInsert.length, skipped };
}

export async function countFlashcardsForArticle(
  articleId: string
): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("flashcards")
    .select("id", { count: "exact", head: true })
    .eq("article_id", articleId);

  if (error) throw error;
  return count ?? 0;
}

// listDueFlashcards: mga card na due_at <= ngayon, kasama ang parent
// article title/type/slug (para malaman ng reviewer kung saang article
// galing bawat tanong — walang FK-based auto-join sa supabase-js kaya
// dalawang query + manual merge, gaya ng ginawa na sa getGraphData).
export async function listDueFlashcards(limit = 30): Promise<DueFlashcard[]> {
  const supabase = createClient();

  const { data: due, error: dueError } = await supabase
    .from("flashcards")
    .select(
      "id, article_id, front, back, ease_factor, interval_days, repetitions, due_at, last_reviewed_at, created_at"
    )
    .lte("due_at", new Date().toISOString())
    .order("due_at", { ascending: true })
    .limit(limit);

  if (dueError) throw dueError;
  if (!due || due.length === 0) return [];

  const articleIds = Array.from(new Set(due.map((c) => c.article_id)));
  const { data: articles, error: articlesError } = await supabase
    .from("articles")
    .select("id, title, type, slug")
    .in("id", articleIds);

  if (articlesError) throw articlesError;

  const articleById = new Map((articles ?? []).map((a) => [a.id, a]));

  return due
    .filter((c) => articleById.has(c.article_id))
    .map((c) => {
      const article = articleById.get(c.article_id)!;
      return {
        ...c,
        article_title: article.title,
        article_type: article.type,
        article_slug: article.slug,
      };
    });
}

export async function countDueFlashcards(): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("flashcards")
    .select("id", { count: "exact", head: true })
    .lte("due_at", new Date().toISOString());

  if (error) throw error;
  return count ?? 0;
}

interface Sm2State {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
}

// Standard SM-2: sa quality < 3 ("again"), reset ang repetitions at bumalik
// sa 1-day interval — ibig sabihin nakalimutan mo, kaya kailangan ulit
// magsimula sa madalas na review. Sa quality >= 3, tumataas ang interval
// (1 araw → 6 araw → interval * ease_factor), at ina-adjust ang ease_factor
// mismo base sa dating formula ni Wozniak — mas mataas na quality =
// unti-unting tumataas ang ease (mas matagal ang susunod na interval sa
// parehong repetition count), mas mababa (pero pasado pa rin, >= 3) =
// bumababa ang ease. Naka-clamp sa 1.3 minimum para hindi ito bumagsak
// nang sobra sa mga paulit-ulit na mahihirapang card.
function computeSm2(current: Sm2State, quality: number): Sm2State {
  if (quality < 3) {
    return {
      ease_factor: current.ease_factor,
      interval_days: 1,
      repetitions: 0,
    };
  }

  const repetitions = current.repetitions + 1;
  let interval_days: number;

  if (repetitions === 1) {
    interval_days = 1;
  } else if (repetitions === 2) {
    interval_days = 6;
  } else {
    interval_days = Math.round(current.interval_days * current.ease_factor);
  }

  const easeDelta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  const ease_factor = Math.max(
    MIN_EASE_FACTOR,
    current.ease_factor + easeDelta
  );

  return { ease_factor, interval_days, repetitions };
}

export async function reviewFlashcard(
  flashcardId: string,
  grade: ReviewGrade
): Promise<FlashcardRecord> {
  const supabase = createClient();

  const { data: card, error: fetchError } = await supabase
    .from("flashcards")
    .select("ease_factor, interval_days, repetitions")
    .eq("id", flashcardId)
    .single();

  if (fetchError) throw fetchError;
  if (!card) throw new Error("Flashcard not found");

  const quality = QUALITY_MAP[grade];
  const next = computeSm2(card, quality);

  const now = new Date();
  const dueAt = new Date(now);
  dueAt.setDate(dueAt.getDate() + next.interval_days);

  const { data, error } = await supabase
    .from("flashcards")
    .update({
      ease_factor: next.ease_factor,
      interval_days: next.interval_days,
      repetitions: next.repetitions,
      due_at: dueAt.toISOString(),
      last_reviewed_at: now.toISOString(),
    })
    .eq("id", flashcardId)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/review");
  return data;
}
