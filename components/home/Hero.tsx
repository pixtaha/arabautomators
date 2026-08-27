import { ButtonLink } from "@/components/ui/ButtonLink";
import { WorkflowPreview } from "@/components/home/WorkflowPreview";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="bg-dots mask-fade-b absolute inset-0 bg-surface-page" />

      <div className="relative mx-auto grid max-w-[1180px] items-center gap-8 px-4 py-12 sm:gap-16 sm:px-6 sm:py-16 md:py-[88px] lg:grid-cols-2">
        <div className="flex flex-col items-start gap-6">
          <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-widest text-text-muted uppercase">
            <span className="whitespace-nowrap">ROUND #01 · LIVE AUTOMATION PROGRAM</span>
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
            <ButtonLink href="#course" variant="primary" size="lg">
              Discover the course
            </ButtonLink>
            <ButtonLink href="#workflow" variant="secondary" size="lg">
              See a workflow
            </ButtonLink>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs text-text-muted">
            <span className="animate-pulse-ring inline-flex items-center gap-1.5 rounded-full bg-surface-brand px-3 py-1.5 text-[10px] tracking-widest text-white uppercase">
              <span className="animate-blink block h-1.5 w-1.5 rounded-full bg-white" />
              Live now
            </span>
            <span>184 on the waitlist · Round #1 filled in 9 days</span>
          </div>
        </div>

        <WorkflowPreview />
      </div>
    </section>
  );
}
