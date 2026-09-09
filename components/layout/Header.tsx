"use client";

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
  const inDashboardArea = DASHBOARD_AREA_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  const showDashboardLinks = Boolean(user) && inDashboardArea;

  return (
    <header className="sticky top-0 z-20 border-b border-border-hairline bg-surface-card/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex min-h-14 max-w-[1180px] items-center justify-between gap-4 px-4 py-2 sm:px-6 sm:py-3.5">
        <Link href="/" aria-label="Arab Automators home" className="transition-opacity duration-150 ease-out hover:opacity-80">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-4 sm:flex sm:gap-5">
          {showDashboardLinks && (
            <span
              aria-disabled="true"
              title="My Tasks is currently unavailable"
              className="inline-flex h-10 select-none items-center justify-center gap-2 rounded-control px-5 text-sm font-semibold font-body text-text-body opacity-50 cursor-not-allowed"
            >
              My Tasks
            </span>
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
            <span
              aria-disabled="true"
              title="Tasks is currently unavailable"
              className="select-none rounded-full px-3 py-2 text-xs font-semibold text-text-strong opacity-50 cursor-not-allowed"
            >
              Tasks
            </span>
          )}
          <AuthStatus />
        </nav>
      </div>
    </header>
  );
}
