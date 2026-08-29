"use client";

import type { CourseModule } from "@/data/courseModules";

const UNLOCKED_COUNT = 2;

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function CourseModulesCard({ modules }: { modules: CourseModule[] }) {
  return (
    <div
      id="continue-course"
      className="flex flex-col gap-3 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
          Continue where you left off
        </span>
        <span className="font-mono text-[10px] tracking-widest text-text-muted uppercase">
          {UNLOCKED_COUNT} of {modules.length} available
        </span>
      </div>

      <div className="flex max-h-[320px] flex-col gap-1.5 overflow-y-auto pr-1">
        {modules.map((module, index) => {
          const isUnlocked = index < UNLOCKED_COUNT;

          return (
            <div
              key={module.no}
              className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-card-inner border px-4 py-2.5 transition-colors ${
                isUnlocked
                  ? "border-border-hairline bg-surface-sunken"
                  : "cursor-not-allowed border-border-hairline/60 bg-surface-sunken/40 opacity-50"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`font-mono text-[13px] ${isUnlocked ? "text-surface-brand" : "text-text-faint"}`}
                >
                  {module.no}
                </span>
                <span
                  className={`truncate text-sm font-semibold ${
                    isUnlocked ? "text-text-strong" : "text-text-muted"
                  }`}
                >
                  {module.title}
                </span>
                {!isUnlocked && <LockIcon className="h-3.5 w-3.5 flex-none text-text-faint" />}
              </div>
              <span className="font-mono text-[10px] tracking-widest text-text-muted uppercase">
                Available Sep 5, 2026
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-text-muted">Demo placeholder — no course content exists yet.</p>
    </div>
  );
}
