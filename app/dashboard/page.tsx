"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";
import { courseModules } from "@/data/courseModules";

const DEMO_PROGRESS_PERCENT = 15;
const DEMO_POINTS = 340;

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
  const nextModule = courseModules[0];

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
              <div className="flex flex-col gap-4 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
                    Overall progress
                  </span>
                  <span className="font-mono text-[11px] text-text-muted">
                    {DEMO_PROGRESS_PERCENT}% · demo data
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                  <div
                    className="h-full rounded-full bg-surface-brand"
                    style={{ width: `${DEMO_PROGRESS_PERCENT}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted">
                  Demo data — will show your real progress once the course starts.
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
                <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
                  Continue where you left off
                </span>
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-card-inner border border-border-hairline bg-surface-sunken px-5 py-4">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-[15px] text-surface-brand">{nextModule.no}</span>
                    <span className="text-[15px] font-semibold text-text-strong">{nextModule.title}</span>
                  </div>
                  <span className="font-mono text-[10px] tracking-widest text-text-muted uppercase">
                    Available Sep 5, 2026
                  </span>
                </div>
                <p className="text-xs text-text-muted">Demo placeholder — no course content exists yet.</p>
              </div>

              <div
                aria-disabled="true"
                className="flex min-h-[64px] cursor-not-allowed items-center justify-center rounded-2xl bg-[linear-gradient(100deg,#006A4E_0%,#007858_26%,#109B75_50%,#007858_74%,#006A4E_100%)] bg-[length:260%_100%] px-6 py-4 text-center [animation:aa-sheen_5.1s_var(--ease-smooth)_infinite_alternate,aa-pulse_2800ms_var(--ease-smooth)_infinite]"
              >
                <span className="font-display text-base font-extrabold tracking-tight text-white">
                  Go to course — starts September 5, 2026
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
                <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
                  Your points · demo data
                </span>
                <span className="font-display text-[36px] font-extrabold tracking-tight text-text-strong">
                  {DEMO_POINTS}
                </span>
                <p className="text-xs text-text-muted">
                  Preview only — real points start counting once live sessions begin.
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
                    Top 10 leaderboard
                  </span>
                  <span className="font-mono text-[10px] tracking-widest text-text-muted uppercase">Demo</span>
                </div>
                <div className="flex flex-col">
                  {DEMO_LEADERBOARD.map((entry, index) => (
                    <div
                      key={entry.username}
                      className={`flex items-center gap-3 py-2.5 ${
                        index < DEMO_LEADERBOARD.length - 1 ? "border-b border-border-hairline" : ""
                      }`}
                    >
                      <span className="w-5 flex-none font-mono text-[11px] text-text-faint">{index + 1}</span>
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-surface-brand-soft font-display text-xs font-bold text-text-accent">
                        {entry.username.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-strong">
                        @{entry.username}
                      </span>
                      <span className="font-mono text-xs text-text-muted">{entry.points} pts</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-text-muted">
                  Placeholder rankings — will populate with real students once live sessions begin.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
