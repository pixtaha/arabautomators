"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function useSupabaseUser() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let authenticated = false;

    async function validateDeviceSession() {
      const response = await fetch("/api/auth/session", { cache: "no-store" });
      if (response.status === 401) {
        router.push("/api/auth/logout?reason=session-invalid");
        router.refresh();
      }
    }

    supabase.auth.getUser().then(({ data }) => {
      authenticated = Boolean(data.user);
      setUser(data.user);
      setLoading(false);
      if (data.user) void validateDeviceSession();
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      authenticated = Boolean(session?.user);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const heartbeat = window.setInterval(() => {
      if (authenticated) void validateDeviceSession();
    }, 5 * 60 * 1000);

    return () => {
      subscription.subscription.unsubscribe();
      window.clearInterval(heartbeat);
    };
  }, [router]);

  return { user, loading };
}
