"use client";

import { useState } from "react";

export interface LeaderboardEntry {
  username: string;
  points: number;
}

const RANK_STYLE: Record<number, { ring: string; medal: string }> = {
  1: { ring: "#F8C800", medal: "🥇" },
  2: { ring: "#B9BFC6", medal: "🥈" },
  3: { ring: "#CD7F32", medal: "🥉" },
};

const VISIBLE_COUNT = 5;

export function LeaderboardCard({ entries }: { entries: LeaderboardEntry[] }) {
  const [showAll, setShowAll] = useState(false);
  const visibleEntries = showAll ? entries : entries.slice(0, VISIBLE_COUNT);

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
          Top 10 leaderboard
        </span>
        <span className="font-mono text-[10px] tracking-widest text-text-muted uppercase">Demo</span>
      </div>

      <div className="flex flex-col">
        {visibleEntries.map((entry, index) => {
          const rank = index + 1;
          const isRunnerUp = rank === 4 || rank === 5;
          const rankStyle = RANK_STYLE[rank];

          return (
            <div
              key={entry.username}
              className={`flex items-center gap-3 rounded-card-inner px-2 py-2.5 transition-all duration-200 ease-[var(--ease-smooth)] hover:scale-[1.015] hover:bg-surface-hover ${
                index < visibleEntries.length - 1 ? "border-b border-border-hairline" : ""
              } ${isRunnerUp ? "bg-surface-sunken/60" : ""} ${rank > 5 ? "reveal-row" : ""}`}
              style={rank > 5 ? { animationDelay: `${(rank - 6) * 70}ms` } : undefined}
            >
              <span
                className={`flex-none font-mono text-text-faint ${
                  rank === 1 ? "w-6 text-sm font-bold" : "w-5 text-[11px]"
                }`}
              >
                {rank}
              </span>

              <span
                className={`grid flex-none place-items-center rounded-full bg-surface-brand-soft font-display font-bold text-text-accent ${
                  rank === 1 ? "h-11 w-11 text-sm" : "h-8 w-8 text-xs"
                }`}
                style={
                  rankStyle
                    ? { boxShadow: `0 0 0 2px var(--color-surface-card), 0 0 0 4px ${rankStyle.ring}` }
                    : undefined
                }
              >
                {entry.username.charAt(0).toUpperCase()}
              </span>

              <span
                className={`min-w-0 flex-1 truncate font-medium text-text-strong ${
                  rank === 1 ? "text-base" : "text-sm"
                }`}
              >
                @{entry.username}
              </span>

              {rankStyle && <span className="flex-none text-base leading-none">{rankStyle.medal}</span>}

              <span className="flex-none font-mono text-xs text-text-muted">{entry.points} pts</span>
            </div>
          );
        })}
      </div>

      {entries.length > VISIBLE_COUNT && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="self-start font-mono text-[11px] tracking-widest text-text-accent uppercase transition-colors hover:text-surface-brand-hover"
        >
          {showAll ? "Show less" : `Show more (ranks 6–${entries.length})`}
        </button>
      )}

      <p className="text-xs text-text-muted">
        Placeholder rankings — will populate with real students once live sessions begin.
      </p>
    </div>
  );
}
