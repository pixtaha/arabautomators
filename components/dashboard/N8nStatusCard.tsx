"use client";

import { useState } from "react";
import type { N8nWorkflowStatus } from "@/lib/data/n8nWorkflows";

export function N8nStatusCard({ status, total, active, inactive }: N8nWorkflowStatus) {
  const [expanded, setExpanded] = useState(false);
  const isRunning = status === "ok";

  const breakdown = [
    { label: "Active", count: active },
    { label: "Inactive", count: inactive },
  ];

  return (
    <div
      className="flex flex-col gap-4 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card"
      onMouseEnter={() => isRunning && setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">n8n workspace</span>
        {isRunning && (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            className="font-mono text-[10px] tracking-widest text-text-faint uppercase transition-colors hover:text-text-accent"
          >
            {expanded ? "hide" : "breakdown"}
          </button>
        )}
      </div>

      {isRunning ? (
        <span className="animate-pulse-ring inline-flex w-fit items-center gap-1.5 rounded-full bg-surface-brand-soft px-3 py-1.5 text-[10px] font-medium tracking-widest text-text-accent uppercase">
          <span className="animate-blink block h-1.5 w-1.5 rounded-full bg-surface-brand" />
          Running
        </span>
      ) : (
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-surface-sunken px-3 py-1.5 text-[10px] font-medium tracking-widest text-text-faint uppercase">
          <span className="block h-1.5 w-1.5 rounded-full bg-text-faint" />
          Unavailable
        </span>
      )}

      {isRunning ? (
        <>
          <span className="font-display text-[36px] leading-none font-extrabold tracking-tight text-text-strong">
            {total}
            <span className="ml-1.5 font-mono text-base font-medium text-text-faint">workflows</span>
          </span>

          <div
            className="grid transition-[grid-template-rows] duration-300 ease-[var(--ease-smooth)]"
            style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <div
                className="mt-1 flex flex-col gap-2 border-t border-border-hairline pt-3 transition-opacity duration-300 ease-[var(--ease-smooth)]"
                style={{ opacity: expanded ? 1 : 0 }}
              >
                {breakdown.map((item, index) => (
                  <div key={item.label} className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-1.5 text-text-muted">
                      <span
                        className="animate-blink block h-1.5 w-1.5 rounded-full bg-surface-brand"
                        style={{ animationDelay: `${index * 150}ms` }}
                      />
                      {item.label}
                    </span>
                    <span className="font-mono text-text-strong">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="text-xs text-text-muted">Couldn&apos;t reach your n8n instance. Check back later.</p>
      )}
    </div>
  );
}
