"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Stats {
  points: number;
  modulesCompleted: number;
  modulesTotal: number;
  streak: number;
  rank: number | null;
  totalRanked: number;
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Consecutive days (ending today or yesterday) with at least one
// points-earning event. Today doesn't have to have activity yet for the
// streak to still count -- the day just isn't over -- so the count starts
// from yesterday when today has nothing.
function computeStreak(activeDays: Set<string>): number {
  const cursor = new Date();
  if (!activeDays.has(localDateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (activeDays.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function ProfileStats({ studentId }: { studentId: string }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    Promise.all([
      supabase.from("points_ledger").select("points, created_at").eq("student_id", studentId),
      supabase.from("modules").select("id"),
      supabase.from("tasks").select("id, module_id"),
      supabase.from("student_task_status").select("task_id").eq("student_id", studentId).eq("status", "done"),
      fetch("/api/points/leaderboard?range=all")
        .then((res) => res.json())
        .catch(() => ({ myRank: null, totalRanked: 0 })),
    ]).then(([ledger, modules, tasks, doneStatuses, leaderboard]) => {
      if (!active) return;

      const ledgerRows = ledger.data ?? [];
      const points = ledgerRows.reduce((sum, row) => sum + row.points, 0);
      const activeDays = new Set(ledgerRows.map((row) => localDateKey(new Date(row.created_at))));

      const moduleByTask = new Map((tasks.data ?? []).map((t) => [t.id, t.module_id as string]));
      const completedModules = new Set(
        (doneStatuses.data ?? [])
          .map((row) => moduleByTask.get(row.task_id))
          .filter((moduleId): moduleId is string => Boolean(moduleId)),
      );

      setStats({
        points,
        modulesCompleted: completedModules.size,
        modulesTotal: (modules.data ?? []).length,
        streak: computeStreak(activeDays),
        rank: leaderboard.myRank ?? null,
        totalRanked: leaderboard.totalRanked ?? 0,
      });
    });

    return () => {
      active = false;
    };
  }, [studentId]);

  const items = [
    { label: "Points", value: stats ? String(stats.points) : "—", unit: "", accent: false },
    {
      label: "Modules",
      value: stats ? String(stats.modulesCompleted) : "—",
      unit: stats ? `/ ${stats.modulesTotal}` : "",
      accent: false,
    },
    { label: "Streak", value: stats ? String(stats.streak) : "—", unit: "days", accent: false },
    {
      label: "Rank",
      value: stats ? (stats.rank ? `#${stats.rank}` : "Unranked") : "—",
      unit: stats && stats.rank ? `of ${stats.totalRanked}` : "",
      accent: true,
    },
  ];

  return (
    <div className="overflow-hidden rounded-card border border-border-hairline bg-surface-card shadow-card">
      <div className="flex items-center justify-between border-b border-border-hairline px-6 py-3">
        <span className="font-mono text-[11px] tracking-widest text-text-faint uppercase">Stats</span>
      </div>
      <div className="flex flex-wrap">
        {items.map((stat, index) => (
          <div
            key={stat.label}
            className={`min-w-[140px] flex-1 px-6 py-4 ${
              index < items.length - 1 ? "border-r border-border-hairline" : ""
            }`}
          >
            <div className="font-mono text-[11px] tracking-widest text-text-faint uppercase">{stat.label}</div>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span
                className={`font-mono text-[26px] leading-none font-black tracking-tight ${
                  stat.accent ? "text-text-accent" : "text-text-strong"
                }`}
              >
                {stat.value}
              </span>
              {stat.unit && <span className="text-sm text-text-faint">{stat.unit}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
