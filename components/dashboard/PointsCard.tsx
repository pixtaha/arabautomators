"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface LedgerRow {
  source_type: string;
  points: number;
}

function labelForSource(sourceType: string) {
  return `${sourceType.charAt(0).toUpperCase()}${sourceType.slice(1)}s`;
}

export function PointsCard({ studentId }: { studentId: string }) {
  const [rows, setRows] = useState<LedgerRow[] | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase
      .from("points_ledger")
      .select("source_type, points")
      .eq("student_id", studentId)
      .then(({ data }) => {
        if (active) setRows((data as LedgerRow[] | null) ?? []);
      });
    return () => {
      active = false;
    };
  }, [studentId]);

  const total = (rows ?? []).reduce((sum, row) => sum + row.points, 0);

  const breakdown = new Map<string, number>();
  for (const row of rows ?? []) {
    breakdown.set(row.source_type, (breakdown.get(row.source_type) ?? 0) + row.points);
  }
  const breakdownList = [...breakdown.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div
      className="flex flex-col gap-2 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">Your points</span>
        {breakdownList.length > 0 && (
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

      <span className="font-display text-[36px] leading-none font-extrabold tracking-tight text-text-strong">
        {rows === null ? "—" : total}
      </span>

      {rows !== null && rows.length === 0 && (
        <p className="text-xs text-text-muted">Complete a task or a live quiz to start earning points.</p>
      )}

      {breakdownList.length > 0 && (
        <div
          className="grid transition-[grid-template-rows] duration-300 ease-[var(--ease-smooth)]"
          style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div
              className="flex flex-col gap-2 border-t border-border-hairline pt-3 mt-1 transition-opacity duration-300 ease-[var(--ease-smooth)]"
              style={{ opacity: expanded ? 1 : 0 }}
            >
              {breakdownList.map(([sourceType, points], index) => (
                <div key={sourceType} className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 text-text-muted">
                    <span
                      className="animate-blink block h-1.5 w-1.5 rounded-full bg-surface-brand"
                      style={{ animationDelay: `${index * 150}ms` }}
                    />
                    {labelForSource(sourceType)}
                  </span>
                  <span className="font-mono text-text-strong">{points} points</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
