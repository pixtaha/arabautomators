"use client";

import Link from "next/link";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";

export function AuthStatus() {
  const { user, loading } = useSupabaseUser();

  if (loading) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-surface-sunken" />;
  }

  if (user) {
    const avatarUrl = (user.user_metadata?.avatar_url ?? user.user_metadata?.picture) as
      | string
      | undefined;
    const label = (user.user_metadata?.username ??
      user.user_metadata?.full_name ??
      user.email ??
      "?") as string;
    const initial = label.charAt(0).toUpperCase();

    return (
      <Link
        href="/profile"
        aria-label="Your account"
        className="grid h-9 w-9 flex-none place-items-center overflow-hidden rounded-full border border-black/[.06] bg-surface-brand-soft font-display text-sm font-bold text-aa-green-800 transition-transform duration-150 active:scale-[.97]"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-full w-full object-cover object-center" />
        ) : (
          initial
        )}
      </Link>
    );
  }

  return (
    <Link
      href="/login"
      className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-full border border-border-hairline-strong bg-surface-card px-4 text-sm font-semibold text-text-strong transition-colors duration-150 hover:border-aa-neutral-500 hover:bg-surface-hover active:scale-[.985]"
    >
      Login
    </Link>
  );
}
