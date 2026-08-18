"use client";

import { useEffect } from "react";

// Naka-hiwalay sa layout.tsx (Server Component) dahil kailangan ng
// `useEffect`/`navigator` — client-only ito. Production-only ang pag-
// register para hindi makasagabal sa Fast Refresh/HMR habang naka-dev.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  }, []);

  return null;
}
