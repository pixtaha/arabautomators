"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";
import { buttonClasses } from "@/lib/buttonStyles";

export function HeroPrimaryCta() {
  const { user, loading } = useSupabaseUser();
  const [revealed, setRevealed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={revealed ? "reveal-row" : "opacity-0"}>
      {loading ? (
        <div className="h-[52px] w-[220px] animate-pulse rounded-control bg-surface-sunken" />
      ) : user ? (
        <Link href="/dashboard" className={buttonClasses("primary", "lg")}>
          Start Learning Automation
        </Link>
      ) : (
        <Link href="/signup" className={buttonClasses("primary", "lg")}>
          Discover Round 2 details
        </Link>
      )}
    </div>
  );
}
