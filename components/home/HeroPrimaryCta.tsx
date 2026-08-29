"use client";

import Link from "next/link";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";
import { buttonClasses } from "@/lib/buttonStyles";

export function HeroPrimaryCta() {
  const { user, loading } = useSupabaseUser();

  if (loading) {
    return <div className="h-[52px] w-[220px] animate-pulse rounded-control bg-surface-sunken" />;
  }

  if (user) {
    return (
      <Link href="/dashboard" className={buttonClasses("primary", "lg")}>
        Discover the course
      </Link>
    );
  }

  return (
    <Link href="/signup" className={buttonClasses("primary", "lg")}>
      Discover Round 2 details
    </Link>
  );
}
