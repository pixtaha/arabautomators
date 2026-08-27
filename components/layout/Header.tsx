import { Button } from "@/components/ui/Button";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border-hairline bg-surface-card">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="block h-2.5 w-2.5 rounded-full bg-surface-brand" />
          <span className="font-display text-lg font-extrabold tracking-tight text-text-strong">
            A.AUTOMATORS
          </span>
        </div>
        <nav className="flex flex-wrap items-center gap-4 sm:gap-7">
          <Button variant="secondary" size="md">
            Login
          </Button>
        </nav>
      </div>
    </header>
  );
}
