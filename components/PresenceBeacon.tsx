"use client";

import { useEffect } from "react";
import { addSitePresenceListener } from "@/lib/realtime/sitePresence";

export function PresenceBeacon() {
  useEffect(() => addSitePresenceListener(() => {}), []);

  return null;
}
