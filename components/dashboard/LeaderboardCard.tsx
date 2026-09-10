"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { TimeRangeFilter } from "@/components/dashboard/TimeRangeFilter";
import { createClient } from "@/lib/supabase/client";
import type { PointsRange } from "@/lib/time";

interface BoardRow {
  rank: number;
  name: string;
  avatarUrl: string | null;
  points: number;
  isMe: boolean;
}

const RANK_STYLE: Record<number, { ring: string; medal: string }> = {
  1: { ring: "#F8C800", medal: "🥇" },
  2: { ring: "#B9BFC6", medal: "🥈" },
  3: { ring: "#CD7F32", medal: "🥉" },
};

const VISIBLE_COUNT = 5;

export function LeaderboardCard() {
  const [range, setRange] = useState<PointsRange>("all");
  const [board, setBoard] = useState<BoardRow[] | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let active = true;

    function load() {
      fetch(`/api/points/leaderboard?range=${range}`)
        .then((res) => res.json())
        .then((data) => {
          if (active) setBoard(data.board ?? []);
        })
        .catch(() => {
          if (active) setBoard([]);
        });
    }

    load();

    // "leaderboard:points" is a fixed, shared broadcast topic -- a Postgres
    // trigger (20260906_leaderboard_broadcast.sql) sends to this exact name
    // whenever ANY student earns points, so every viewer refetches and sees
    // everyone's updates live, not just their own. This is unlike
    // useLiveQuiz's per-mount unique channel name: that trick only works
    // for postgres_changes (topic is just a local label there; delivery is
    // decided by the .on() filter). For a broadcast, the topic itself is
    // the routing address the trigger and every client must agree on, so it
    // can't be made unique per instance without breaking delivery. This
    // component is only ever rendered from one place, so there's no
    // collision risk from sharing this fixed name.
    const supabase = createClient();
    const channel = supabase
      .channel("leaderboard:points", { config: { private: true } })
      .on("broadcast", { event: "changed" }, () => load())
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [range]);

  const entries = board ?? [];
  const visibleEntries = showAll ? entries : entries.slice(0, VISIBLE_COUNT);

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">Leaderboard</span>
        <TimeRangeFilter
          value={range}
          onChange={(key) => {
            setBoard(null);
            setShowAll(false);
            setRange(key);
          }}
        />
      </div>

      {board === null ? (
        <div className="h-24 animate-pulse rounded-card-inner bg-surface-sunken" />
      ) : entries.length === 0 ? (
        <p className="text-sm text-text-muted">No points earned in this range yet.</p>
      ) : (
        <div className="flex flex-col">
          {visibleEntries.map((entry, index) => {
            const rank = index + 1;
            const isRunnerUp = rank === 4 || rank === 5;
            const rankStyle = RANK_STYLE[rank];

            return (
              <div
                key={`${range}-${entry.rank}-${entry.name}`}
                className={`flex items-center gap-3 rounded-card-inner px-2 py-2.5 transition-all duration-200 ease-[var(--ease-smooth)] hover:scale-[1.015] hover:bg-surface-hover ${
                  index < visibleEntries.length - 1 ? "border-b border-border-hairline" : ""
                } ${isRunnerUp ? "bg-surface-sunken/60" : ""} ${entry.isMe ? "ring-2 ring-surface-brand" : ""}`}
              >
                <span
                  className={`flex-none font-mono text-text-faint ${
                    rank === 1 ? "w-6 text-sm font-bold" : "w-5 text-[11px]"
                  }`}
                >
                  {rank}
                </span>

                <span
                  className={`grid flex-none place-items-center overflow-hidden rounded-full bg-surface-brand-soft font-display font-bold text-text-accent ${
                    rank === 1 ? "h-11 w-11 text-sm" : "h-8 w-8 text-xs"
                  }`}
                  style={
                    rankStyle
                      ? { boxShadow: `0 0 0 2px var(--color-surface-card), 0 0 0 4px ${rankStyle.ring}` }
                      : undefined
                  }
                >
                  {entry.avatarUrl ? (
                    <Avatar src={entry.avatarUrl} className="h-full w-full" />
                  ) : (
                    entry.name.charAt(0).toUpperCase()
                  )}
                </span>

                <span
                  className={`min-w-0 flex-1 truncate font-medium text-text-strong ${
                    rank === 1 ? "text-base" : "text-sm"
                  }`}
                >
                  @{entry.name}
                </span>

                {entry.isMe && (
                  <span className="flex-none rounded-full bg-surface-brand px-2 py-0.5 font-mono text-[10px] font-bold text-text-inverse uppercase">
                    You
                  </span>
                )}

                {rankStyle && <span className="flex-none text-base leading-none">{rankStyle.medal}</span>}

                <span className="flex-none font-mono text-xs text-text-muted">{entry.points} pts</span>
              </div>
            );
          })}
        </div>
      )}

      {entries.length > VISIBLE_COUNT && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="self-start font-mono text-[11px] tracking-widest text-text-accent uppercase transition-colors hover:text-surface-brand-hover"
        >
          {showAll ? "Show less" : `Show more (ranks 6–${entries.length})`}
        </button>
      )}
    </div>
  );
}
