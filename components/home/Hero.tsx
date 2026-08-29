import { WorkflowPreview } from "@/components/home/WorkflowPreview";
import { HeroCta } from "@/components/home/HeroCta";
import { HeroPrimaryCta } from "@/components/home/HeroPrimaryCta";
import { getActiveStudentCount } from "@/lib/data/students";

const ROUND_1_START = new Date(2026, 8, 5, 9, 0); // September 5, 2026, 9:00 AM

function daysUntil(target: Date) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.max(0, Math.round((startOfTarget.getTime() - startOfToday.getTime()) / 86400000));
}

export async function Hero() {
  const activeStudentCount = await getActiveStudentCount();
  const daysToStart = daysUntil(ROUND_1_START);

  return (
    <section className="relative overflow-hidden">
      <div className="bg-dots mask-fade-b absolute inset-0 bg-surface-page" />

      <div className="relative mx-auto grid max-w-[1180px] items-center gap-8 px-4 py-12 sm:gap-16 sm:px-6 sm:py-16 md:py-[88px] lg:grid-cols-2">
        <div className="flex flex-col items-start gap-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2.5 font-mono text-[11px] tracking-widest text-text-muted uppercase">
              <span className="whitespace-nowrap">ROUND #01 · LIVE AUTOMATION PROGRAM</span>
            </div>
            <p className="font-mono text-[11px] text-text-muted">
              Starts Sep 5, 2026, 9:00 AM ·{" "}
              {daysToStart === 0 ? "starting today" : `${daysToStart} day${daysToStart === 1 ? "" : "s"} to go`}
              {" · "}
              <span className="text-text-accent">Missed it? Round #2 starts November 1, 2026</span>
            </p>
          </div>

          <h1 className="text-[38px] leading-[1.02] font-extrabold tracking-[-0.04em] text-text-strong text-balance sm:text-6xl lg:text-[76px]">
            The short road to professional automation work
            <span className="text-surface-brand">.</span>
          </h1>

          <p className="max-w-[52ch] text-base leading-relaxed text-text-body text-pretty sm:text-lg">
            Six weeks, live, in Arabic. You build real client-grade workflows from the first
            session, break them on purpose, then make them recover on their own. You leave with
            work you can charge for.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <HeroPrimaryCta />
            <HeroCta />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs text-text-muted">
            <span className="animate-pulse-ring inline-flex items-center gap-1.5 rounded-full bg-surface-brand px-3 py-1.5 text-[10px] tracking-widest text-white uppercase">
              <span className="animate-blink block h-1.5 w-1.5 rounded-full bg-white" />
              Live now
            </span>
            <span>
              {activeStudentCount !== null ? activeStudentCount : "—"} on the waitlist for Round #1 · Round #2
              starts Nov 1
            </span>
          </div>
        </div>

        <WorkflowPreview />
      </div>
    </section>
  );
}
