"use client";

import { useEffect, useState } from "react";
import { addSitePresenceListener, getSitePresenceCount } from "@/lib/realtime/sitePresence";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export function LiveVisitorCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => setCount(getSitePresenceCount());
    const unsubscribe = addSitePresenceListener(sync);
    sync();
    return unsubscribe;
  }, []);

  return <>{count === null ? "—" : formatNumber(count)}</>;
}
