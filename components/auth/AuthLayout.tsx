import Link from "next/link";
import { ReactNode } from "react";

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthLayout({ eyebrow, title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div className="bg-dots mask-fade-b absolute inset-0 bg-surface-page" />

      <div className="relative w-full max-w-[440px]">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="block h-2.5 w-2.5 rounded-full bg-surface-brand" />
          <span className="font-display text-lg font-extrabold tracking-tight text-text-strong">
            A.AUTOMATORS
          </span>
        </Link>

        <div className="rounded-card border border-border-hairline bg-surface-card p-7 shadow-card sm:p-9">
          <div className="mb-7 flex flex-col gap-2">
            <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">{eyebrow}</span>
            <h1 className="font-display text-[28px] leading-tight font-extrabold tracking-tight text-text-strong sm:text-[32px]">
              {title}
            </h1>
            <p className="text-sm leading-relaxed text-text-body">{subtitle}</p>
          </div>

          {children}
        </div>

        <div className="mt-6 text-center text-sm text-text-muted">{footer}</div>
      </div>
    </div>
  );
}
