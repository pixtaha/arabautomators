import Link from "next/link";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Wordmark } from "@/components/layout/Wordmark";
import { AuthStatus } from "@/components/layout/AuthStatus";

export function Header() {
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
          <ButtonLink href="/help" variant="ghost" size="md">
            Help
          </ButtonLink>
          <AuthStatus />
        </nav>
      </div>
    </header>
  );
}
