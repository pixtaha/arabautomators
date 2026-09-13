"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { PointsCard } from "@/components/dashboard/PointsCard";
import { LeaderboardCard } from "@/components/dashboard/LeaderboardCard";
import { CourseModulesCard } from "@/components/dashboard/CourseModulesCard";
import { N8nStatusCard } from "@/components/dashboard/N8nStatusCard";
import type { ModuleWithSession } from "@/lib/data/modules";
import type { N8nWorkflowStatus } from "@/lib/data/n8nWorkflows";

// Flip to false to disable the "Go to course" button again without touching its logic.
const COURSE_ACCESS_ENABLED = true;

export function DashboardClient({
  modules,
  firstSessionId,
  isAdmin,
  workflowStatus,
}: {
  modules: ModuleWithSession[];
  firstSessionId: string | null;
  isAdmin: boolean;
  workflowStatus: N8nWorkflowStatus;
}) {
  const router = useRouter();
  const { user, loading } = useSupabaseUser();
  const [modulesCompleted, setModulesCompleted] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  // session_video_parts (needed to work out module completion from real watch
  // data) has RLS enabled with no policies, so it can't be queried from the
  // browser client -- this goes through the same server route /profile uses.
  useEffect(() => {
    if (!user) return;
    let active = true;
    fetch("/api/profile/modules-progress")
      .then((res) => res.json())
      .then((data) => {
        if (active) setModulesCompleted(data.modulesCompleted ?? 0);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
        <Header />
        <main className="relative flex-1 overflow-hidden">
          <div className="bg-dots mask-fade-b absolute inset-0 bg-surface-page" />
          <div className="relative mx-auto flex max-w-[1180px] flex-col gap-6 px-4 py-16 sm:px-6">
            <div className="h-8 w-64 animate-pulse rounded-control bg-surface-sunken" />
            <div className="h-40 animate-pulse rounded-card bg-surface-sunken" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const username = (user.user_metadata?.username as string | undefined) ?? user.email ?? "there";
  const modulesTotal = modules.length;
  const progressPercent = modulesTotal > 0 ? Math.round((modulesCompleted / modulesTotal) * 100) : 0;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
      <Header />

      <main className="relative flex-1 overflow-hidden">
        <div className="bg-dots mask-fade-b absolute inset-0 bg-surface-page" />

        <div className="relative mx-auto flex max-w-[1180px] flex-col gap-8 px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
              Round #01 · dashboard
            </span>
            <h1 className="font-display text-[32px] font-extrabold tracking-[-0.03em] text-text-strong sm:text-[40px]">
              Hello, {username} 👋
            </h1>
            <p className="max-w-[60ch] text-sm leading-relaxed text-text-muted">
              Track your modules, progress and ranking here as you move through Round #01.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex flex-col gap-6">
              <ProgressCard
                percent={progressPercent}
                modulesCompleted={modulesCompleted}
                modulesTotal={modulesTotal}
              />

              <CourseModulesCard modules={modules} isAdmin={isAdmin} />

              {COURSE_ACCESS_ENABLED && firstSessionId ? (
                <Link
                  href={`/course/${firstSessionId}`}
                  className="flex min-h-[64px] cursor-pointer items-center justify-center rounded-2xl bg-[linear-gradient(100deg,#006A4E_0%,#007858_26%,#109B75_50%,#007858_74%,#006A4E_100%)] bg-[length:260%_100%] px-6 py-4 text-center transition-transform duration-200 ease-[var(--ease-smooth)] [animation:aa-sheen_5.1s_var(--ease-smooth)_infinite_alternate,aa-pulse_2800ms_var(--ease-smooth)_infinite] hover:scale-[1.01]"
                >
                  <span className="font-display text-base font-extrabold tracking-tight text-white">
                    Go to course — starts September 5, 2026
                  </span>
                </Link>
              ) : (
                <div
                  aria-disabled="true"
                  className="flex min-h-[64px] cursor-not-allowed items-center justify-center rounded-2xl bg-[linear-gradient(100deg,#006A4E_0%,#007858_26%,#109B75_50%,#007858_74%,#006A4E_100%)] bg-[length:260%_100%] px-6 py-4 text-center opacity-60 grayscale-[.3]"
                >
                  <span className="font-display text-base font-extrabold tracking-tight text-white">
                    {COURSE_ACCESS_ENABLED ? "No sessions available yet" : "Go to course — starts September 5, 2026"}
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-6">
              <PointsCard studentId={user.id} />
              <N8nStatusCard {...workflowStatus} />
              <LeaderboardCard />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
