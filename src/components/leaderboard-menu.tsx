"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Item = { slug: string; name: string };

export function LeaderboardMenu({ tracks }: { tracks: Item[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 font-mono text-meta uppercase tracking-[0.16em] text-ink-soft transition-colors hover:text-ink"
      >
        Leaderboard
        <span
          aria-hidden="true"
          className={cn(
            "inline-block transition-transform",
            open && "rotate-180",
          )}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-3 w-[280px] origin-top-right border border-rule bg-cream shadow-[0_12px_32px_-16px_rgba(0,0,0,0.18)]"
        >
          <p className="border-b border-rule px-4 py-3 font-mono text-meta uppercase tracking-[0.16em] text-ink-soft">
            Pick a track
          </p>
          <ul className="max-h-[60vh] overflow-y-auto py-1">
            {tracks.map((t) => (
              <li key={t.slug}>
                <Link
                  href={`/tracks/${t.slug}/leaderboard`}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 text-body text-ink transition-colors hover:bg-accent-soft/60 hover:text-accent-deep"
                >
                  <span className="truncate">{t.name}</span>
                  <span
                    aria-hidden="true"
                    className="text-ink-soft transition-transform"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
