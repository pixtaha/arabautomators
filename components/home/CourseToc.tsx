"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { courseModules } from "@/data/courseModules";

export function CourseToc() {
  const [open, setOpen] = useState(false);

  return (
    <section
      id="course"
      className="mx-auto max-w-[1180px] scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16 md:py-[72px]"
    >
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="text-[26px] font-extrabold tracking-tight text-text-strong sm:text-[34px]">
            Table of contents
          </h2>
          <p className="max-w-[60ch] text-[15px] leading-relaxed text-text-muted">
            Eleven sections. The first half is plumbing that runs without you: webhooks,
            databases, WhatsApp, production workflows that recover from their own errors. The
            second half is agents: your first one, RAG and sub-agents, conversational AI, and
            Claude Code. You finish by taking one idea to production.
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide sections" : "Show sections"}
        </Button>
      </div>

      <div
        className="grid transition-[grid-template-rows,opacity] duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="mt-7 overflow-hidden rounded-card border border-border-hairline bg-surface-card shadow-card">
            <div className="grid grid-cols-[56px_minmax(0,1fr)] items-center border-b-2 border-black px-5 py-3.5 font-mono text-[11px] tracking-widest text-text-muted uppercase">
              <span>No.</span>
              <span>Section</span>
            </div>
            {courseModules.map((module) => (
              <div
                key={module.no}
                className="grid grid-cols-[56px_minmax(0,1fr)] items-center border-b border-border-hairline px-5 py-[18px]"
              >
                <span className="font-mono text-[15px] text-surface-brand">{module.no}</span>
                <span className="text-[15px] font-semibold text-text-strong">{module.title}</span>
              </div>
            ))}
            <div className="bg-surface-sunken px-5 py-4 text-sm text-text-muted">
              Eleven sections. You ship something that runs in every one.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
