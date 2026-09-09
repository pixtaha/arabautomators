import "server-only";
import type { VideoSource } from "@/lib/video-provider";
export type { VideoSource } from "@/lib/video-provider";

// Temporary compatibility for Session 1 until its existing live rows are
// explicitly linked through the provider-aware admin flow. Stored fields
// always take precedence over this map.
const overrides: Record<string, Record<string, VideoSource>> = {
  "7caceae2-03eb-4bc7-a80f-3ef463ff52fd": {
    main: { provider: "vdocipher", videoId: "5b775e705e8c43278ff60092a17c680a" },
    "1afe54f0-aab2-4583-8d77-22a591cb9885": { provider: "vdocipher", videoId: "5b775e705e8c43278ff60092a17c680a" },
    "6965a2fa-9dbf-422a-8d64-61e5ed7ce3e2": { provider: "vdocipher", videoId: "5b775e705e8c43278ff60092a17c680a" },
  },
};

export function getSessionVideoOverrides(sessionId: string) {
  if (process.env.SESSION_VIDEO_PROVIDER_OVERRIDES_ENABLED === "false") return null;
  return Object.hasOwn(overrides, sessionId) ? overrides[sessionId] : null;
}
