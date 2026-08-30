"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { ModuleRow } from "@/lib/data/modules";

export function CourseTocList({ modules }: { modules: ModuleRow[] }) {
  const [open, setOpen] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="text-[26px] font-extrabold tracking-tight text-text-strong sm:text-[34px]">
            Table of contents
          </h2>
          <p className="max-w-[60ch] text-[15px] leading-relaxed text-text-muted">
            Eleven sections. First half: plumbing that runs without you — webhooks, databases,
            WhatsApp, self-healing workflows. Second half: agents, RAG, conversational AI, Claude
            Code. You finish by shipping one idea to production.
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={() => setOpen((v) => !v)}>
          {open ? "Hide sections" : "Show sections"}
        </Button>
      </div>

      <div
        className="grid transition-[grid-template-rows,opacity] duration-500 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr", opacity: open ? 1 : 0 }}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            ref={listRef}
            className="mt-7 overflow-hidden rounded-card border border-border-hairline bg-surface-card shadow-card"
          >
            <div className="grid grid-cols-[56px_minmax(0,1fr)] items-center border-b-2 border-black px-5 py-3.5 font-mono text-[11px] tracking-widest text-text-muted uppercase">
              <span>No.</span>
              <span>Section</span>
            </div>
            {modules.map((module, index) => (
              <div
                key={module.order_index}
                className={`grid grid-cols-[56px_minmax(0,1fr)] items-center border-b border-border-hairline px-5 py-[18px] transition-colors hover:bg-surface-hover ${
                  revealed ? "reveal-row" : "opacity-0"
                }`}
                style={revealed ? { animationDelay: `${Math.min(index, 10) * 45}ms` } : undefined}
              >
                <span className="font-mono text-[15px] text-surface-brand">
                  {String(module.order_index).padStart(2, "0")}
                </span>
                <span className="text-[15px] font-semibold text-text-strong">{module.title}</span>
              </div>
            ))}
            <div className="bg-surface-sunken px-5 py-4 text-sm text-text-muted">
              Eleven sections. You ship something that runs in every one.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
