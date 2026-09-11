"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Wordmark } from "@/components/layout/Wordmark";
import { AuthStatus } from "@/components/layout/AuthStatus";
import { useLiveQuiz } from "@/lib/hooks/useLiveQuiz";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";

const DASHBOARD_AREA_PREFIXES = ["/dashboard", "/profile", "/course"];

export function Header() {
  const { quiz } = useLiveQuiz();
  const { user } = useSupabaseUser();
  const pathname = usePathname();
  const [hasPendingTask, setHasPendingTask] = useState(false);

  const inDashboardArea = DASHBOARD_AREA_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const showDashboardLinks = Boolean(user) && inDashboardArea;

  // "My Tasks" is now for every signed-in student, not just admins (the
  // link itself), but the notification dot on it stays a per-student
  // concern -- /api/task-board/pending itself excludes admin accounts, so
  // this never shows a dot for an admin's own "student" row.
  useEffect(() => {
    // Nothing to reset when this becomes false: the dot itself is only
    // ever rendered inside `{showDashboardLinks && (...)}` below, so a
    // stale `true` sitting unused in state has no visible effect, and the
    // very next time this flips back to true the fetch below runs again
    // and corrects it before anything is shown.
    if (!showDashboardLinks) return;

    let cancelled = false;
    fetch("/api/task-board/pending", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : { hasPending: false }))
      .then((data) => {
        if (!cancelled) setHasPendingTask(Boolean(data.hasPending));
      })
      .catch(() => {
        if (!cancelled) setHasPendingTask(false);
      });
    return () => {
      cancelled = true;
    };
  }, [showDashboardLinks]);

  return (
    <header className="sticky top-0 z-20 border-b border-border-hairline bg-surface-card/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex min-h-14 max-w-[1180px] items-center justify-between gap-4 px-4 py-2 sm:px-6 sm:py-3.5">
        <Link href="/" aria-label="Arab Automators home" className="transition-opacity duration-150 ease-out hover:opacity-80">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-4 sm:flex sm:gap-5">
          {showDashboardLinks && (
            <ButtonLink href="/dashboard/task-board" variant="ghost" size="md" className="relative">
              My Tasks
              {hasPendingTask && (
                <span className="absolute top-1 right-0.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aa-red-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-aa-red-500" />
                </span>
              )}
            </ButtonLink>
          )}
          <ButtonLink href="/dashboard/tasks-leaderboard" variant="ghost" size="md">
            Task Leaderboard
          </ButtonLink>
          {showDashboardLinks && (
            <ButtonLink href="/dashboard/quiz" variant="ghost" size="md" className="relative">
              Quiz
              {quiz && (
                <span className="absolute top-1 right-0.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aa-red-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-aa-red-500" />
                </span>
              )}
            </ButtonLink>
          )}
          <ButtonLink href="/help" variant="ghost" size="md">
            Help
          </ButtonLink>
          <AuthStatus />
        </nav>
        <nav aria-label="Mobile navigation" className="flex items-center gap-1.5 sm:hidden">
          <Link href="/dashboard/tasks-leaderboard" className="rounded-full px-3 py-2 text-xs font-semibold text-text-strong transition-colors hover:bg-surface-sunken">
            Leaderboard
          </Link>
          {showDashboardLinks && (
            <Link href="/dashboard/task-board" className="relative rounded-full px-3 py-2 text-xs font-semibold text-text-strong transition-colors hover:bg-surface-sunken">
              Tasks
              {hasPendingTask && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aa-red-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-aa-red-500" />
                </span>
              )}
            </Link>
          )}
          <AuthStatus />
        </nav>
      </div>
    </header>
  );
}
