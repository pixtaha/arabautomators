import "server-only";
import { createHash } from "node:crypto";

export const BUNNY_VIDEO_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PlaybackData {
  enableDRM?: boolean;
  drmVersion?: number;
  enableMP4Fallback?: boolean;
  allowEarlyPlay?: boolean;
  tokenAuthEnabled?: boolean;
  originalUrl?: string | null;
  isPlayable?: boolean;
  isPlaylistPlayable?: boolean;
  video?: {
    guid?: string;
    videoLibraryId?: number;
    status?: number;
    length?: number;
    hasMP4Fallback?: boolean;
  };
}

// Basic DRM (0/2) and flags on an unfinished/old fallback encode are insufficient.
// Packaging and old CDN URL invalidation must ALSO pass the activation audit.
export function isEnterprisePlaybackReady(data: PlaybackData): boolean {
  return data.enableDRM === true && data.drmVersion === 1 &&
    data.enableMP4Fallback === false && data.allowEarlyPlay === false &&
    data.tokenAuthEnabled === true && !data.originalUrl &&
    data.isPlayable === true && data.isPlaylistPlayable === true &&
    data.video?.status === 4 && data.video.hasMP4Fallback === false;
}

export function isBunnyDrmEnforcementEnabled() {
  return process.env.BUNNY_DRM_ENFORCEMENT_ENABLED === "true";
}

/** Call only after authorizing this video's association with a course session. */
export async function createBunnyPlayback(videoId: string) {
  const libraryId = process.env.BUNNY_STREAM_LIBRARY_ID;
  const apiKey = process.env.BUNNY_STREAM_API_KEY;
  // CDN/embed token security key, NOT the Stream API key.
  const tokenKey = process.env.BUNNY_STREAM_TOKEN_SECURITY_KEY;
  if (!BUNNY_VIDEO_ID_RE.test(videoId) || !libraryId || !/^\d+$/.test(libraryId)) {
    throw new Error("Protected video configuration is unavailable.");
  }
  videoId = videoId.toLowerCase();
  if (!tokenKey) throw new Error("Protected video configuration is unavailable.");
  const playerExpires = Math.floor(Date.now() / 1000) + 300;
  if (!isBunnyDrmEnforcementEnabled()) {
    const token = createHash("sha256").update(`${tokenKey}${videoId}${playerExpires}`).digest("hex");
    const url = new URL(`https://player.mediadelivery.net/embed/${libraryId}/${videoId}`);
    url.searchParams.set("token", token);
    url.searchParams.set("expires", String(playerExpires));
    return { embedUrl: url.toString(), expires: playerExpires };
  }
  if (!apiKey) throw new Error("Protected video configuration is unavailable.");
  const response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}/play`, {
    headers: { AccessKey: apiKey, Referer: "https://arabautomators.com/" },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
    redirect: "error",
  });
  if (!response.ok) throw new Error("Protected video metadata is unavailable.");
  const data: PlaybackData = await response.json();
  if (!isEnterprisePlaybackReady(data) || data.video?.guid !== videoId ||
      data.video.videoLibraryId !== Number(libraryId)) {
    throw new Error("Protected video is not ready.");
  }
  // Covers playback and license renewals, with a six-hour maximum lifetime.
  const length = Number.isFinite(data.video.length) ? Math.max(0, data.video.length!) : 0;
  const expires = Math.floor(Date.now() / 1000) + Math.min(21_600, Math.max(3_600, Math.ceil(length) + 1_800));
  // https://bunny.net/docs/stream/token-authentication
  const token = createHash("sha256").update(`${tokenKey}${videoId}${expires}`).digest("hex");
  const url = new URL(`https://player.mediadelivery.net/embed/${libraryId}/${videoId}`);
  url.searchParams.set("token", token);
  url.searchParams.set("expires", String(expires));
  // Never return the raw /play response: it contains CDN and source URLs.
  return { embedUrl: url.toString(), expires };
}
