"use client";

import { useState } from "react";

const WORKFLOWS_TOTAL = 8;

const WORKFLOWS_BREAKDOWN = [
  { label: "Published", count: 5 },
  { label: "Unpublished / draft", count: 3 },
];

export function WorkflowsCard() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="flex flex-col gap-2 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
          Workflows built · demo data
        </span>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="font-mono text-[10px] tracking-widest text-text-faint uppercase transition-colors hover:text-text-accent"
        >
          {expanded ? "hide" : "breakdown"}
        </button>
      </div>

      <span className="font-display text-[36px] leading-none font-extrabold tracking-tight text-text-strong">
        {WORKFLOWS_TOTAL}
        <span className="ml-1.5 font-mono text-base font-medium text-text-faint">workflows</span>
      </span>

      <p className="text-xs text-text-muted">
        Preview only — real workflow count starts once live sessions begin.
      </p>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-[var(--ease-smooth)]"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div
            className="mt-1 flex flex-col gap-2 border-t border-border-hairline pt-3 transition-opacity duration-300 ease-[var(--ease-smooth)]"
            style={{ opacity: expanded ? 1 : 0 }}
          >
            {WORKFLOWS_BREAKDOWN.map((item, index) => (
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
    </div>
  );
}
