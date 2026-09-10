"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Avatar } from "@/components/ui/Avatar";
import { TimeRangeFilter } from "@/components/dashboard/TimeRangeFilter";
import { createClient } from "@/lib/supabase/client";
import type { PointsRange } from "@/lib/time";

type LeaderboardTab = "overall" | "tasks";

interface BoardRow {
  rank: number;
  name: string;
  avatarUrl: string | null;
  isMe: boolean;
  points?: number;
  tasksCompleted?: number;
}

const TAB_OPTIONS: { key: LeaderboardTab; label: string; hint: string; endpoint: string; channel: string }[] = [
  {
    key: "overall",
    label: "Overall",
    hint: "Quiz points + task points",
    endpoint: "/api/points/leaderboard",
    channel: "leaderboard:points",
  },
  {
    key: "tasks",
    label: "Tasks only",
    hint: "Completed tasks count",
    endpoint: "/api/tasks/leaderboard",
    channel: "leaderboard:tasks",
  },
];

const RANK_SKIN: Record<number, { bg: string; border: string; fg: string; medal: string }> = {
  1: { bg: "bg-aa-amber-100", border: "border-aa-amber-400", fg: "text-aa-amber-700", medal: "🥇" },
  2: { bg: "bg-aa-neutral-100", border: "border-aa-neutral-400", fg: "text-aa-neutral-700", medal: "🥈" },
  3: { bg: "bg-aa-green-50", border: "border-aa-green-200", fg: "text-aa-green-800", medal: "🥉" },
};

export function TasksLeaderboardClient() {
  const [tab, setTab] = useState<LeaderboardTab>("overall");
  const [range, setRange] = useState<PointsRange>("all");
  const [board, setBoard] = useState<BoardRow[] | null>(null);

  const activeTab = TAB_OPTIONS.find((t) => t.key === tab)!;

  useEffect(() => {
    let active = true;

    function load() {
      fetch(`${activeTab.endpoint}?range=${range}`)
        .then((res) => res.json())
        .then((data) => {
          if (active) setBoard(data.board ?? []);
        })
        .catch(() => {
          if (active) setBoard([]);
        });
    }

    load();

    // Fixed, shared broadcast topics -- see LeaderboardCard.tsx for why these
    // can't use a per-mount unique name the way useLiveQuiz's channel does
    // (the topic here is the actual pub/sub routing address the trigger and
    // every client must share).
    const supabase = createClient();
    const channel = supabase
      .channel(activeTab.channel, { config: { private: true } })
      .on("broadcast", { event: "changed" }, () => load())
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [activeTab.endpoint, activeTab.channel, range]);

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
              {tab === "overall"
                ? "Ranked by total points earned -- quiz points plus task points, combined."
                : "Ranked by number of tasks completed, not points earned. A task awaiting admin review doesn't count until it's approved."}
            </p>
          </div>

          <div className="flex flex-col rounded-card border border-border-hairline bg-surface-card shadow-card">
            <div className="flex flex-col gap-2.5 border-b border-border-hairline p-4">
              <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">Rank by</span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {TAB_OPTIONS.map((option) => {
                  const active = tab === option.key;
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        setBoard(null);
                        setTab(option.key);
                      }}
                      className={`flex flex-col items-start gap-1 rounded-card-inner border-2 px-3.5 py-2.5 text-left transition-colors ${
                        active
                          ? "border-surface-brand bg-surface-brand-soft"
                          : "border-border-hairline bg-surface-card hover:bg-surface-hover"
                      }`}
                    >
                      <span
                        className={`font-display text-base font-bold tracking-tight ${
                          active ? "text-text-accent" : "text-text-muted"
                        }`}
                      >
                        {option.label}
                      </span>
                      <span
                        className={`font-mono text-[10px] tracking-wide uppercase ${
                          active ? "text-aa-green-700" : "text-text-faint"
                        }`}
                      >
                        {option.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">Time range</span>
              <TimeRangeFilter
                value={range}
                onChange={(key) => {
                  setBoard(null);
                  setRange(key);
                }}
              />
            </div>

            <div className="flex items-center gap-3 border-t-2 border-surface-ink border-b border-border-hairline px-4 py-2">
              <span className="w-7 flex-none font-mono text-[10px] tracking-wide text-text-faint uppercase">#</span>
              <span className="flex-1 font-mono text-[10px] tracking-widest text-text-faint uppercase">Member</span>
              <span className="flex-none font-mono text-[10px] tracking-widest text-text-faint uppercase">
                {tab === "overall" ? "Points" : "Tasks"}
              </span>
            </div>

            <div className="flex flex-col p-2">
              {board === null ? (
                <div className="h-24 animate-pulse rounded-card-inner bg-surface-sunken" />
              ) : entries.length === 0 ? (
                <p className="p-4 text-sm text-text-muted">
                  {tab === "overall" ? "No points earned in this range yet." : "No tasks completed in this range yet."}
                </p>
              ) : (
                entries.map((entry, index) => {
                  const rank = index + 1;
                  const skin = RANK_SKIN[rank];
                  const value = tab === "overall" ? (entry.points ?? 0) : (entry.tasksCompleted ?? 0);

                  return (
                    <div
                      key={`${tab}-${range}-${entry.rank}-${entry.name}`}
                      className={`flex items-center gap-3 rounded-card-inner px-2 py-2.5 transition-all duration-200 ease-[var(--ease-smooth)] hover:scale-[1.015] hover:bg-surface-hover ${
                        index < entries.length - 1 ? "border-b border-border-hairline" : ""
                      } ${rank === 1 ? "bg-surface-brand-soft/60" : ""} ${entry.isMe ? "ring-2 ring-surface-brand" : ""}`}
                    >
                      <span
                        className={`grid h-7 w-7 flex-none place-items-center rounded-full border font-mono text-xs font-bold ${
                          skin ? `${skin.bg} ${skin.border} ${skin.fg}` : "border-border-hairline text-text-faint"
                        }`}
                      >
                        {rank}
                      </span>

                      <span
                        className={`grid flex-none place-items-center overflow-hidden rounded-full bg-surface-brand-soft font-display font-bold text-text-accent ${
                          rank === 1 ? "h-11 w-11 text-sm" : "h-8 w-8 text-xs"
                        }`}
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

                      {skin && <span className="flex-none text-base leading-none">{skin.medal}</span>}

                      <span className="flex-none font-mono text-xs text-text-muted">
                        {tab === "overall" ? `${value} pts` : `${value} task${value === 1 ? "" : "s"}`}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
