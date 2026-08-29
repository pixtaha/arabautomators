"use client";

import { useEffect, useState } from "react";

export function ProgressCard({ percent }: { percent: number }) {
  const [filled, setFilled] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setFilled(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
          Overall progress
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-text-muted">
          <span className="animate-blink block h-1.5 w-1.5 rounded-full bg-text-faint" />
          demo data
        </span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="font-display text-[44px] leading-none font-extrabold tracking-tight text-text-strong">
          {percent}%
        </span>
        <span className="text-xs text-text-muted">complete</span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-sunken">
        <div
          className="h-full rounded-full bg-surface-brand transition-[width] duration-1000 ease-[var(--ease-smooth)]"
          style={{ width: filled ? `${percent}%` : "0%" }}
        />
      </div>

      <p className="text-xs text-text-muted">
        Demo data — will show your real progress once the course starts.
      </p>
    </div>
  );
}
