"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { buttonClasses } from "@/lib/buttonStyles";

export function HeroCta() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

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
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </Link>
    );
  }

  return (
    <Link href="/login" className={buttonClasses("primary", "lg")}>
      Login
    </Link>
  );
}
