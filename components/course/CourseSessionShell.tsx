"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { SessionRail } from "@/components/course/SessionRail";
import type { CourseSessionRow } from "@/lib/data/courseSessions";

export function CourseSessionShell({
  moduleTitle,
  sessions,
  currentSessionId,
  children,
  resources,
}: {
  moduleTitle: string;
  sessions: CourseSessionRow[];
  currentSessionId: string;
  children: ReactNode;
  resources: ReactNode;
}) {
  const [railOpen, setRailOpen] = useState(true);

  return (
    <div
      className={`relative mx-auto grid max-w-[1400px] items-start gap-4 p-4 transition-[grid-template-columns] duration-300 ease-[var(--ease-smooth)] ${
        railOpen
          ? "lg:grid-cols-[272px_minmax(0,1fr)_344px]"
          : "lg:grid-cols-[68px_minmax(0,1fr)_344px]"
      }`}
    >
      <SessionRail
        moduleTitle={moduleTitle}
        sessions={sessions}
        currentSessionId={currentSessionId}
        open={railOpen}
        onOpenChange={setRailOpen}
      />

      <main className="flex min-w-0 flex-col gap-4">{children}</main>

      <aside className="flex flex-col gap-4">{resources}</aside>
    </div>
  );
}
