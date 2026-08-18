"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

// Dark-first design: `:root` in globals.css IS the dark theme, and the
// `.light` class on <html> overrides to the light theme (see globals.css
// comment). This toggle just adds/removes that class and remembers the
// choice in localStorage. The inline script in app/layout.tsx applies the
// saved class before hydration so there's no flash of the wrong theme.
const STORAGE_KEY = "devpedia-theme";

export function ThemeToggle() {
  // Start `null` until mounted so the icon we render always matches the
  // class actually on <html> (set synchronously by the head script) —
  // avoids a hydration mismatch flash between server and client markup.
  const [isLight, setIsLight] = useState<boolean | null>(null);

  useEffect(() => {
    setIsLight(document.documentElement.classList.contains("light"));
  }, []);

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("light");
    document.documentElement.classList.toggle("light", next);
    window.localStorage.setItem(STORAGE_KEY, next ? "light" : "dark");
    setIsLight(next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      title={isLight ? "Switch to dark mode" : "Switch to light mode"}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
    >
      {isLight === null ? (
        <span className="block h-4 w-4" />
      ) : isLight ? (
        <Moon className="h-4 w-4" strokeWidth={2} />
      ) : (
        <Sun className="h-4 w-4" strokeWidth={2} />
      )}
    </button>
  );
}
