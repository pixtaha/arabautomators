"use client";

import Link from "next/link";
import { ChevronRightIcon } from "@/components/profile/icons";

export function ProfileAccount({
  onSignOut,
  signingOut,
}: {
  onSignOut: () => void;
  signingOut: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
      <div className="flex items-center gap-2.5">
        <span className="h-4 w-[3px] bg-black" />
        <span className="font-mono text-[11px] tracking-widest text-text-strong uppercase">Account</span>
      </div>

      <Link
        href="/forgot-password"
        className="flex items-center justify-between gap-3 border-b border-aa-neutral-200 py-3.5 text-text-strong no-underline transition-colors hover:text-text-accent"
      >
        <span className="flex flex-col">
          <span className="text-sm font-semibold">Change password</span>
          <span className="text-sm text-text-muted">We&apos;ll email you a reset link</span>
        </span>
        <ChevronRightIcon className="h-[18px] w-[18px] flex-none" />
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t-2 border-border-hairline pt-5">
        <span className="max-w-[40ch] text-sm text-text-muted">
          Signing out ends this session on this device only.
        </span>
        <button
          type="button"
          onClick={onSignOut}
          disabled={signingOut}
          className="inline-flex h-10 flex-none cursor-pointer items-center justify-center whitespace-nowrap rounded-full border border-aa-red-500 bg-surface-card px-5 text-sm font-semibold text-aa-red-500 transition-colors duration-150 hover:bg-surface-danger-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
