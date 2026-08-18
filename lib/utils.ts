import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ArticleType } from "@/types/database";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Route segment ≠ article type sa lahat ng cases — plural ang route folder
// para sa "technology" (/technologies), "concept" (/concepts), at
// "experiment" (/experiments), pero singular na tumutugma sa type mismo
// ang "encyclopedia" at "architecture". Dating ginagawa ito nang paulit-
// ulit gamit ang isang `type === "encyclopedia" ? "encyclopedia" : type`
// ternary sa bawat file — mali iyon para sa technology/concept/experiment
// (nagre-resolve sa singular na route na hindi talaga umiiral, e.g.
// `/concept/foo` sa halip na `/concepts/foo`). Dito na lang dapat dumaan
// ang lahat ng type→path resolution papunta pasulong.
const ARTICLE_TYPE_PATHS: Record<ArticleType, string> = {
  encyclopedia: "encyclopedia",
  architecture: "architecture",
  technology: "technologies",
  concept: "concepts",
  experiment: "experiments",
};

export function articleTypePath(type: ArticleType): string {
  return ARTICLE_TYPE_PATHS[type];
}

// Simple slug generator para sa article titles. Ginagamit ng
// components/editor/ArticleEditor para auto-fill ang slug field
// hangga't hindi pa manual na inedit ng user.
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Simpleng relative-time label ("2h ago", "3d ago") para sa Changelog
// widget sa Dashboard — hindi kailangan ng buong i18n library para dito.
export function timeAgo(isoDate: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
