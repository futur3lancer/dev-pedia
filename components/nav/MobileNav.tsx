"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV_GROUPS, isNavItemActive } from "@/lib/nav/config";

// Sidebar is desktop-only (`hidden md:flex`) — this is the mobile
// equivalent, a hamburger trigger in the header that opens a slide-in
// drawer with the same grouped nav. Own open/closed state; closes on
// route change (via key remount is overkill here, closing on link click
// is enough for this scale of app).
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Header has `backdrop-blur`, which (per spec) makes it a containing
  // block for any `position: fixed` descendant — so without a portal,
  // the drawer below would be clipped to the header's own box instead
  // of the viewport. Rendering into document.body sidesteps that.
  // Also lock background scroll while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Menu className="h-5 w-5" strokeWidth={2} />
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-background/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div className="relative flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto border-r border-border bg-surface px-3 py-4 shadow-elevated">
              <div className="mb-6 flex items-center justify-between px-2">
                <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
                    D
                  </span>
                  DevPedia
                </span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close navigation"
                  className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              </div>

              <nav className="flex flex-1 flex-col gap-5">
                {NAV_GROUPS.map((group) => (
                  <div key={group.label}>
                    <div className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wide text-subtle-foreground">
                      {group.label}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {group.items.map((item) => {
                        const active = isNavItemActive(pathname, item.href);
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            aria-current={active ? "page" : undefined}
                            className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors duration-150 ${
                              active
                                ? "bg-primary/10 font-medium text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            <Icon
                              className="h-4 w-4 shrink-0"
                              strokeWidth={2}
                            />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
