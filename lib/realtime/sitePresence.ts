"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

// Both PresenceBeacon and LiveVisitorCount need to observe the same
// "site-presence" Realtime channel, but supabase-js dedupes `.channel()` by
// topic against one shared, singleton browser client (createBrowserClient
// caches itself per tab) -- so whichever of them mounted second used to get
// back the SAME already-subscribed channel object from the first, and
// Realtime throws the instant you call `.on("presence", ...)` on a channel
// that has already joined. This module is the one place that creates the
// channel, attaches the only `.on("presence", "sync")` binding, and calls
// `subscribe()` -- everything else here goes through addSitePresenceListener
// instead of touching `supabase.channel("site-presence")` directly.
let channel: RealtimeChannel | null = null;
let listenerCount = 0;
const listeners = new Set<() => void>();

function ensureChannel() {
  if (channel) return channel;

  const supabase = createClient();
  const joined = supabase.channel("site-presence", {
    config: { presence: { key: crypto.randomUUID() } },
  });

  joined.on("presence", { event: "sync" }, () => {
    listeners.forEach((listener) => listener());
  });

  joined.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      joined.track({ online_at: new Date().toISOString() });
    }
  });

  channel = joined;
  return joined;
}

export function getSitePresenceCount() {
  return channel ? Object.keys(channel.presenceState()).length : 0;
}

// Registers a callback for presence "sync" events and returns an unsubscribe
// function. The underlying channel is created (and subscribed) lazily on
// the first call from either component, and torn down once the last one
// unmounts -- so mount order between PresenceBeacon and LiveVisitorCount
// never matters.
export function addSitePresenceListener(onSync: () => void) {
  ensureChannel();
  listeners.add(onSync);
  listenerCount += 1;

  return () => {
    listeners.delete(onSync);
    listenerCount -= 1;
    if (listenerCount <= 0 && channel) {
      const supabase = createClient();
      void supabase.removeChannel(channel);
      channel = null;
      listeners.clear();
      listenerCount = 0;
    }
  };
}
