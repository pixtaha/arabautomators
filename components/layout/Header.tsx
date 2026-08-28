import Image from "next/image";
import { Button } from "@/components/ui/Button";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border-hairline bg-surface-card">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <Image src="/assets/logo-mark-green.svg" alt="" width={30} height={30} className="h-auto w-[30px]" />
          <span className="flex flex-col items-start font-display text-[17px] leading-[1.02] font-extrabold tracking-[-0.03em] text-text-strong">
            <span>
              <span className="text-surface-brand">A</span>rab
            </span>
            <span>
              <span className="text-surface-brand">A</span>utomators
            </span>
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
