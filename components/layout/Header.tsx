"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Wordmark } from "@/components/layout/Wordmark";
import { AuthStatus } from "@/components/layout/AuthStatus";
import { useLiveQuiz } from "@/lib/hooks/useLiveQuiz";

export function Header() {
  const { quiz } = useLiveQuiz();

  return (
    <header className="sticky top-0 z-20 border-b border-border-hairline bg-surface-card">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3.5 sm:px-6">
        <Link href="/" aria-label="Arab Automators home" className="transition-opacity duration-150 ease-out hover:opacity-80">
          <Wordmark />
        </Link>
        <nav className="flex flex-wrap items-center gap-4 sm:gap-5">
          <ButtonLink href="/dashboard/tasks" variant="ghost" size="md">
            My Tasks
          </ButtonLink>
          <ButtonLink href="/dashboard/tasks-leaderboard" variant="ghost" size="md">
            Task Leaderboard
          </ButtonLink>
          <ButtonLink href="/dashboard/quiz" variant="ghost" size="md" className="relative">
            Quiz
            {quiz && (
              <span className="absolute top-1 right-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-aa-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-aa-red-500" />
              </span>
            )}
          </ButtonLink>
          <ButtonLink href="/help" variant="ghost" size="md">
            Help
          </ButtonLink>
          <AuthStatus />
        </nav>
      </div>
    </header>
  );
}
