"use client";

import { ReactNode, useState } from "react";

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="ml-0.5 h-3 w-3" aria-hidden="true">
      <path d="M4 2.5v11l9-5.5-9-5.5z" />
    </svg>
  );
}

export function ExpandableVideoCard({
  title,
  subtitle,
  player,
}: {
  title: string;
  subtitle?: string | null;
  player: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 rounded-card-inner border border-border-hairline p-2 text-left transition-transform duration-150 ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:shadow-card"
      >
        <span className="relative flex h-12 w-[82px] flex-none items-center justify-center overflow-hidden rounded-lg bg-surface-ink bg-dots-ink">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black">
            <PlayIcon />
          </span>
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-text-strong">{title}</span>
          {subtitle && <span className="mt-0.5 block text-xs text-text-muted">{subtitle}</span>}
        </span>
      </button>
      {open && <div className="max-w-sm">{player}</div>}
    </div>
  );
}
