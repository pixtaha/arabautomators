"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Avatar } from "@/components/ui/Avatar";
import { createClient } from "@/lib/supabase/client";
import type { PointsRange } from "@/lib/time";

interface BoardRow {
  rank: number;
  name: string;
  avatarUrl: string | null;
  tasksCompleted: number;
  isMe: boolean;
}

const RANGE_OPTIONS: { key: PointsRange; label: string }[] = [
  { key: "day", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
];

const RANK_STYLE: Record<number, { ring: string; medal: string }> = {
  1: { ring: "#F8C800", medal: "🥇" },
  2: { ring: "#B9BFC6", medal: "🥈" },
  3: { ring: "#CD7F32", medal: "🥉" },
};

export function TasksLeaderboardClient() {
  const [range, setRange] = useState<PointsRange>("all");
  const [board, setBoard] = useState<BoardRow[] | null>(null);

  useEffect(() => {
    let active = true;

    function load() {
      fetch(`/api/tasks/leaderboard?range=${range}`)
        .then((res) => res.json())
        .then((data) => {
          if (active) setBoard(data.board ?? []);
        })
        .catch(() => {
          if (active) setBoard([]);
        });
    }

    load();

    // "leaderboard:tasks" is a fixed, shared broadcast topic -- see
    // LeaderboardCard.tsx for why this can't use a per-mount unique name
    // the way useLiveQuiz's channel does (the topic here is the actual
    // pub/sub routing address the trigger and every client must share).
    const supabase = createClient();
    const channel = supabase
      .channel("leaderboard:tasks", { config: { private: true } })
      .on("broadcast", { event: "changed" }, () => load())
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [range]);

  const entries = board ?? [];

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
      <Header />

      <main className="relative flex-1 overflow-hidden">
        <div className="bg-dots mask-fade-b absolute inset-0 bg-surface-page" />

        <div className="relative mx-auto flex max-w-[720px] flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
              Task leaderboard
            </span>
            <h1 className="font-display text-[32px] font-extrabold tracking-[-0.03em] text-text-strong sm:text-[40px]">
              Who&apos;s getting things done
            </h1>
            <p className="max-w-[60ch] text-sm leading-relaxed text-text-muted">
              Ranked by number of tasks completed, not points earned. A task awaiting admin review doesn&apos;t
              count until it&apos;s approved.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">Top 20</span>
              <div className="flex flex-wrap items-center gap-1">
                {RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      setBoard(null);
                      setRange(option.key);
                    }}
                    className={`rounded-full px-2 py-1 font-mono text-[10px] tracking-widest uppercase transition-colors ${
                      range === option.key
                        ? "bg-surface-brand text-text-inverse"
                        : "text-text-muted hover:bg-surface-sunken"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {board === null ? (
              <div className="h-24 animate-pulse rounded-card-inner bg-surface-sunken" />
            ) : entries.length === 0 ? (
              <p className="text-sm text-text-muted">No tasks completed in this range yet.</p>
            ) : (
              <div className="flex flex-col">
                {entries.map((entry, index) => {
                  const rank = index + 1;
                  const rankStyle = RANK_STYLE[rank];

                  return (
                    <div
                      key={`${range}-${entry.rank}-${entry.name}`}
                      className={`flex items-center gap-3 rounded-card-inner px-2 py-2.5 transition-all duration-200 ease-[var(--ease-smooth)] hover:scale-[1.015] hover:bg-surface-hover ${
                        index < entries.length - 1 ? "border-b border-border-hairline" : ""
                      } ${entry.isMe ? "ring-2 ring-surface-brand" : ""}`}
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

                      <span className="flex-none font-mono text-xs text-text-muted">
                        {entry.tasksCompleted} task{entry.tasksCompleted === 1 ? "" : "s"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
