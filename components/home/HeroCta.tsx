"use client";

import Link from "next/link";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";
import { buttonClasses } from "@/lib/buttonStyles";

export function HeroCta() {
  const { user, loading } = useSupabaseUser();

  if (loading) {
    return <div className="h-[52px] w-[140px] animate-pulse rounded-control bg-surface-sunken" />;
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
        href="/dashboard"
        aria-label="Your account"
        className="grid h-12 w-12 place-items-center overflow-hidden rounded-full border border-border-hairline-strong bg-surface-brand font-display text-lg font-bold text-white transition-transform duration-150 active:scale-[.97]"
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
    <Link href="/login" className={buttonClasses("secondary", "lg")}>
      Login
    </Link>
  );
}
