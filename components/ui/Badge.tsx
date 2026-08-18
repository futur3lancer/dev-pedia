import type { ReactNode } from "react";

export type BadgeTone = "success" | "warning" | "error" | "info" | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
  info: "bg-info/10 text-info",
  neutral: "bg-muted text-muted-foreground",
};

const DOT_CLASSES: Record<BadgeTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
  info: "bg-info",
  neutral: "bg-subtle-foreground",
};

// Every content-state chip in the app (article draft/published, error
// resolved/unresolved, project active/completed/archived, architecture
// advantage/disadvantage) was previously its own hardcoded
// emerald/amber/blue/red className string, duplicated per page. This is
// the single place that maps a semantic "tone" to the design tokens —
// status color always means the same thing everywhere in the app now.
export function Badge({
  tone = "neutral",
  dot = false,
  children,
}: {
  tone?: BadgeTone;
  dot?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[tone]}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
