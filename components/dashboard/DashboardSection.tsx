import type { ReactNode } from "react";

// Phase 4 (slice 2): Dashboard restructure sa L1/L2/L3 hierarchy. Dating
// flat na stack ng widgets ito (due-banner, learning progress, changelog,
// favorites, recently viewed — lahat parehong text-sm heading, parehong
// bordered box), kaya walang malinaw kung alin ang dapat unahing tingnan.
// Tatlong antas na lang:
//   L1 — ang pangunahing "kumusta ang encyclopedia ko" na widget. Elevated
//        card, may shadow, pinakamalaking heading. Isa lang dapat ito bawat
//        dashboard.
//   L2 — mga secondary widget na parehong importante pero hindi kasing-
//        "overview" ng L1 — regular bordered card, karaniwang magkatabi
//        sa grid.
//   L3 — tertiary/glanceable na listahan — walang card border, pinaka-
//        maliit na heading (uppercase label), pinaka-mababa ang visual
//        weight. Dito napupunta ang mga bagay na "pwede mo namang laktawan."
// Ang `meta` slot ay para sa maikling context sa kanan ng heading (hal.
// "12 / 20 published") — dating naka-inline sa loob mismo ng widget, dito
// na dapat dumaan para consistent ang spacing sa lahat ng antas.

type SectionLevel = 1 | 2 | 3;

const LEVEL_STYLES: Record<SectionLevel, { wrapper: string; heading: string }> = {
  1: {
    wrapper: "rounded-lg border border-border bg-surface-elevated p-5 shadow-sm",
    heading: "text-base font-semibold",
  },
  2: {
    wrapper: "rounded-md border border-border bg-surface p-4",
    heading: "text-sm font-medium text-muted-foreground",
  },
  3: {
    wrapper: "",
    heading: "text-xs font-medium uppercase tracking-wide text-subtle-foreground",
  },
};

export function DashboardSection({
  level,
  title,
  icon,
  meta,
  children,
}: {
  level: SectionLevel;
  title: string;
  icon?: string;
  meta?: ReactNode;
  children: ReactNode;
}) {
  const styles = LEVEL_STYLES[level];

  return (
    <section className={styles.wrapper}>
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className={styles.heading}>
          {icon && <span className="mr-1.5" aria-hidden="true">{icon}</span>}
          {title}
        </h2>
        {meta && <span className="shrink-0 text-xs text-muted-foreground">{meta}</span>}
      </div>
      {children}
    </section>
  );
}
