"use client";

import { useEffect } from "react";
import { recordView } from "@/lib/actions/articles";

// Phase 2 (slice 6): "Recently Viewed". Server components ang mga article
// pages, kaya kailangan ng maliit na client wrapper para i-fire ang
// recordView sa useEffect tuwing bubukas ang page. Walang UI na inilalabas.
export function ViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    recordView(articleId).catch(() => {
      // Tahimik lang i-ignore — hindi kritikal kung minsan mabigo ito.
    });
  }, [articleId]);

  return null;
}
