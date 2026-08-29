"use client";

import { useState } from "react";
import Link from "next/link";
import type { CourseSessionRow } from "@/lib/data/courseSessions";

function PanelIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      {open ? (
        <path d="M6.5 3v10" stroke="currentColor" strokeWidth="1.3" />
      ) : (
        <path d="M9.5 3v10" stroke="currentColor" strokeWidth="1.3" />
      )}
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SessionRail({
  moduleTitle,
  sessions,
  currentSessionId,
}: {
  moduleTitle: string;
  sessions: CourseSessionRow[];
  currentSessionId: string;
}) {
  const [open, setOpen] = useState(true);
  const [done, setDone] = useState<Set<string>>(new Set());

  const doneCount = done.size;
  const total = sessions.length;
  const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <aside
      className="sticky top-4 flex flex-col gap-3.5 overflow-hidden rounded-card bg-surface-ink p-3 py-4 transition-[width] duration-200 ease-[var(--ease-smooth)]"
      style={{ width: open ? "272px" : "68px" }}
    >
      <div className="flex items-center justify-between gap-2 px-1">
        {open && (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-surface-brand" />
            <span className="font-mono text-[11px] tracking-widest text-white uppercase">Round #1</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle session list"
          className="flex h-[30px] w-[30px] flex-none items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10"
        >
          <PanelIcon open={open} />
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-2.5 px-1">
          <div className="font-display text-[15px] leading-tight font-bold tracking-tight text-white">
            {moduleTitle}
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/12">
              <div
                className="h-full rounded-full bg-surface-brand transition-[width] duration-300 ease-[var(--ease-smooth)]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="font-mono text-[11px] text-white/60">
              {doneCount}/{total}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-0.5">
        {sessions.map((s) => {
          const isDone = done.has(s.id);
          const isActive = s.id === currentSessionId;
          const isLive = s.status === "live";

          return (
            <Link
              key={s.id}
              href={`/course/${s.id}`}
              className={`flex items-center gap-2.5 rounded-[10px] py-2.5 transition-colors ${
                open ? "px-2" : "justify-center px-1"
              } ${isActive ? "bg-white/10" : "hover:bg-white/7"}`}
            >
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDone((prev) => {
                    const next = new Set(prev);
                    if (next.has(s.id)) next.delete(s.id);
                    else next.add(s.id);
                    return next;
                  });
                }}
                className={`flex h-[22px] w-[22px] flex-none items-center justify-center rounded-full ${
                  isDone
                    ? "bg-surface-brand text-white"
                    : isActive
                      ? "border-2 border-aa-green-300 text-aa-green-300"
                      : "border-2 border-white/20 text-white/60"
                }`}
              >
                {isDone ? (
                  <CheckIcon />
                ) : (
                  <span className="font-mono text-[11px]">{String(s.order_index).padStart(2, "0")}</span>
                )}
              </span>
              {open && (
                <span
                  className={`min-w-0 flex-1 truncate text-sm ${
                    isActive ? "font-semibold" : "font-normal"
                  } ${isActive || isDone ? "text-white" : "text-white/60"}`}
                >
                  {s.title}
                </span>
              )}
              {isLive && open && <span className="font-mono text-[11px] text-aa-green-300">now</span>}
            </Link>
          );
        })}
      </div>

      {open && (
        <div className="mt-0.5 border-t border-white/10 px-2 pt-3">
          <div className="text-xs text-white/60">Office hours Wednesday, 20:00 Cairo.</div>
        </div>
      )}
    </aside>
  );
}
