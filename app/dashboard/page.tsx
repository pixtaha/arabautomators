"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";
import { courseModules } from "@/data/courseModules";
import { ProgressCard } from "@/components/dashboard/ProgressCard";
import { PointsCard } from "@/components/dashboard/PointsCard";
import { LeaderboardCard } from "@/components/dashboard/LeaderboardCard";
import { CourseModulesCard } from "@/components/dashboard/CourseModulesCard";
import { N8nStatusCard } from "@/components/dashboard/N8nStatusCard";

// Flip to false to disable the "Go to course" button again without touching its logic.
const COURSE_ACCESS_ENABLED = true;

const DEMO_PROGRESS_PERCENT = 15;
const DEMO_POINTS = 340;
const DEMO_MAX_POINTS = 5000;

const DEMO_LEADERBOARD = [
  { username: "sara_automates", points: 1240 },
  { username: "omar_dev", points: 1180 },
  { username: "khaled_n8n", points: 1050 },
  { username: "mona_ai", points: 980 },
  { username: "yousef_flows", points: 910 },
  { username: "layla_builds", points: 860 },
  { username: "tarek_agent", points: 790 },
  { username: "nour_rag", points: 720 },
  { username: "ali_webhook", points: 650 },
  { username: "hana_supabase", points: 590 },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useSupabaseUser();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

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
              This is a preview of your course dashboard. Real modules, progress and rankings go
              live once Round #01 starts on September 5, 2026.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex flex-col gap-6">
              <ProgressCard percent={DEMO_PROGRESS_PERCENT} />

              <CourseModulesCard modules={courseModules} />

              {COURSE_ACCESS_ENABLED ? (
                <a
                  href="#continue-course"
                  className="flex min-h-[64px] cursor-pointer items-center justify-center rounded-2xl bg-[linear-gradient(100deg,#006A4E_0%,#007858_26%,#109B75_50%,#007858_74%,#006A4E_100%)] bg-[length:260%_100%] px-6 py-4 text-center transition-transform duration-200 ease-[var(--ease-smooth)] [animation:aa-sheen_5.1s_var(--ease-smooth)_infinite_alternate,aa-pulse_2800ms_var(--ease-smooth)_infinite] hover:scale-[1.01]"
                >
                  <span className="font-display text-base font-extrabold tracking-tight text-white">
                    Go to course — starts September 5, 2026
                  </span>
                </a>
              ) : (
                <div
                  aria-disabled="true"
                  className="flex min-h-[64px] cursor-not-allowed items-center justify-center rounded-2xl bg-[linear-gradient(100deg,#006A4E_0%,#007858_26%,#109B75_50%,#007858_74%,#006A4E_100%)] bg-[length:260%_100%] px-6 py-4 text-center [animation:aa-sheen_5.1s_var(--ease-smooth)_infinite_alternate,aa-pulse_2800ms_var(--ease-smooth)_infinite]"
                >
                  <span className="font-display text-base font-extrabold tracking-tight text-white">
                    Go to course — starts September 5, 2026
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-6">
              <PointsCard points={DEMO_POINTS} maxPoints={DEMO_MAX_POINTS} />
              <N8nStatusCard />
              <LeaderboardCard entries={DEMO_LEADERBOARD} />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
