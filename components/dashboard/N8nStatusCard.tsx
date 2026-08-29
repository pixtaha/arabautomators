"use client";

import { useEffect, useState } from "react";

const DEMO_USAGE_PERCENT = 12;

export function N8nStatusCard() {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">n8n workspace</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-muted">
          <span className="animate-blink block h-1.5 w-1.5 rounded-full bg-text-faint" />
          demo data
        </span>
      </div>

      <span className="animate-pulse-ring inline-flex w-fit items-center gap-1.5 rounded-full bg-surface-brand-soft px-3 py-1.5 text-[10px] font-medium tracking-widest text-text-accent uppercase">
        <span className="animate-blink block h-1.5 w-1.5 rounded-full bg-surface-brand" />
        Running
      </span>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-text-body">Resource usage</span>
          <span className="font-mono text-xs text-text-muted">
            Avg. {DEMO_USAGE_PERCENT}% of capacity used
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-sunken">
          <div
            className="h-full rounded-full bg-surface-brand transition-[width] duration-1000 ease-[var(--ease-smooth)]"
            style={{ width: filled ? `${DEMO_USAGE_PERCENT}%` : "0%" }}
          />
        </div>
      </div>

      <p className="text-xs text-text-muted">
        Demo data — will show your real workspace usage once your n8n instance is connected.
      </p>
    </div>
  );
}
