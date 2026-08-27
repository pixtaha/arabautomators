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
            Six sections, six things that keep running after the session ends: a form that files
            itself, an inbox that answers, a database that stays clean, a workflow that recovers
            from its own errors, and a client handover you get paid for.
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide sections" : "Show sections"}
        </Button>
      </div>

      {open && (
        <div className="mt-7 overflow-hidden rounded-card border border-border-hairline bg-surface-card shadow-card">
          <div className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center border-b-2 border-black px-5 py-3.5 font-mono text-[11px] tracking-widest text-text-muted uppercase">
            <span>Section</span>
            <span>Title</span>
            <span className="text-right">Status</span>
          </div>
          {courseModules.map((module) => (
            <div
              key={module.no}
              className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center border-b border-border-hairline px-5 py-[18px]"
            >
              <span className="font-mono text-[15px] text-surface-brand">{module.no}</span>
              <span className="text-[15px] font-semibold text-text-strong">{module.title}</span>
              <span className="text-right font-mono text-[11px] text-text-faint">
                {module.status}
              </span>
            </div>
          ))}
          <div className="bg-surface-sunken px-5 py-4 text-sm text-text-muted">
            Titles are placeholders. Numbers are final.
          </div>
        </div>
      )}
    </section>
  );
}
