"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const VISITOR_ID_KEY = "aa-visitor-id";

function getOrCreateVisitorId() {
  try {
    const existing = window.localStorage.getItem(VISITOR_ID_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.localStorage.setItem(VISITOR_ID_KEY, id);
    return id;
  } catch {
    // Best-effort only -- a private-mode browser or full storage just means
    // this visit isn't attributable to a returning visitor, not a broken page.
    return crypto.randomUUID();
  }
}

export function ViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const visitorId = getOrCreateVisitorId();
    fetch("/api/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, visitorId }),
      keepalive: true,
    }).catch(() => {
      // Best-effort analytics beacon -- a dropped request isn't worth surfacing.
    });
  }, [pathname]);

  return null;
}
