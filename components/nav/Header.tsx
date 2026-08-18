import Link from "next/link";
import { Search, Settings } from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { MobileNav } from "@/components/nav/MobileNav";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

// Plain <Link> styled as a search field for now (not a live input) — the
// actual /search page owns its own query state client-side (see
// app/(dashboard)/search/page.tsx). Cmd+K command palette is a Phase 3+
// item; this is the discoverable, no-JS-required entry point until then.
export function Header() {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <MobileNav />
        <Link
          href="/search"
          className="flex w-full max-w-sm items-center gap-2 rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:border-primary/40 hover:text-foreground"
        >
          <Search className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span className="truncate">Search DevPedia…</span>
          <kbd className="ml-auto hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-subtle-foreground sm:inline-block">
            ⌘K
          </kbd>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        {/* No /settings route yet in this codebase — kept as a
            non-interactive affordance (matches prior behavior) instead of
            linking to a 404. Wire this up once the route exists. */}
        <span
          className="flex cursor-not-allowed items-center gap-1.5 text-sm text-subtle-foreground"
          title="Settings — coming soon"
        >
          <Settings className="h-4 w-4" strokeWidth={2} />
          Settings
        </span>
        <form action={signOutAction}>
          <button
            type="submit"
            className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
