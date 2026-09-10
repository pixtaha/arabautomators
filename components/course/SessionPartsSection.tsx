"use client";

import { useState } from "react";
import Link from "next/link";
import type { CourseSessionRow } from "@/lib/data/courseSessions";

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SessionPartsSection({
  moduleTitle,
  sessions,
  currentSessionId,
}: {
  moduleTitle: string;
  sessions: CourseSessionRow[];
  currentSessionId: string;
}) {
  const [done, setDone] = useState<Set<string>>(new Set());

  const doneCount = done.size;
  const total = sessions.length;
  const progressPct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-5 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
      <div className="flex flex-col gap-2.5">
        <div className="h-[3px] w-10 bg-surface-ink" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
              Parts of this session
            </div>
            <div className="mt-1 font-display text-lg font-bold tracking-tight text-text-strong">{moduleTitle}</div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-1 w-24 overflow-hidden rounded-full bg-surface-sunken">
              <div
                className="h-full rounded-full bg-surface-brand transition-[width] duration-300 ease-[var(--ease-smooth)]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="font-mono text-[11px] text-text-muted">
              {doneCount}/{total}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {sessions.map((s) => {
          const isDone = done.has(s.id);
          const isActive = s.id === currentSessionId;
          const isLive = s.status === "live";

          return (
            <Link
              key={s.id}
              href={`/course/${s.id}`}
              className={`flex items-center gap-3 rounded-card-inner border p-3 transition-colors ${
                isActive
                  ? "border-surface-brand bg-surface-brand-soft"
                  : "border-transparent bg-surface-sunken hover:border-border-hairline"
              }`}
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
                className={`flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full ${
                  isDone
                    ? "bg-surface-brand text-white"
                    : isActive
                      ? "border-2 border-surface-brand text-surface-brand"
                      : "border-2 border-border-hairline-strong text-text-muted"
                }`}
              >
                {isDone ? <CheckIcon /> : <span className="font-mono text-[11px]">{String(s.order_index).padStart(2, "0")}</span>}
              </span>
              <span
                className={`min-w-0 flex-1 truncate text-sm ${isActive ? "font-semibold" : "font-normal"} text-text-strong`}
              >
                {s.title}
              </span>
              {isLive && <span className="flex-none font-mono text-[11px] text-surface-brand">now</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
