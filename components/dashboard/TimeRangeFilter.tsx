"use client";

import type { PointsRange } from "@/lib/time";

export const RANGE_OPTIONS: { key: PointsRange; label: string }[] = [
  { key: "day", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
];

interface TimeRangeFilterProps {
  value: PointsRange;
  onChange: (range: PointsRange) => void;
  className?: string;
}

export function TimeRangeFilter({ value, onChange, className = "" }: TimeRangeFilterProps) {
  return (
    <div className={`flex flex-wrap items-center gap-0.5 rounded-full bg-surface-sunken p-1 ${className}`}>
      {RANGE_OPTIONS.map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onChange(option.key)}
          className={`rounded-full px-3 py-1.5 font-mono text-[10px] tracking-wide uppercase transition-colors ${
            value === option.key ? "bg-surface-brand text-text-inverse" : "text-text-muted hover:text-text-body"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
