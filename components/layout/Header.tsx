import { ButtonLink } from "@/components/ui/ButtonLink";
import { Wordmark } from "@/components/layout/Wordmark";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border-hairline bg-surface-card">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3.5 sm:px-6">
        <Wordmark />
        <nav className="flex flex-wrap items-center gap-4 sm:gap-7">
          <ButtonLink href="/help" variant="ghost" size="md">
            Help
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
