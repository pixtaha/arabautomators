export type VideoProvider = "vdocipher";
export type VideoSource = { provider: VideoProvider; videoId: string };

export const VIDEO_ID_PATTERNS = {
  vdocipher: /^[0-9a-f]{32}$/i,
};

export function parseVideoLink(input: { vdocipherVideoId?: unknown }):
  { source: VideoSource; error?: never } | { error: string; source?: never } {
  const value = input.vdocipherVideoId;
  if (typeof value !== "string" || !VIDEO_ID_PATTERNS.vdocipher.test(value.trim())) {
    return { error: "Enter a valid VdoCipher Video ID (32 hexadecimal characters)." };
  }
  return { source: { provider: "vdocipher", videoId: value.trim().toLowerCase() } };
}

/** Signature kept for compatibility with existing callers; bunnyId/provider args are ignored. */
export function resolveVideoSource(
  _provider: string | null | undefined,
  _bunnyId: string | null,
  vdocipherId?: string | null
): VideoSource | null {
  if (!vdocipherId || !VIDEO_ID_PATTERNS.vdocipher.test(vdocipherId)) return null;
  return { provider: "vdocipher", videoId: vdocipherId.toLowerCase() };
}

export function videoResourceFields(source: VideoSource) {
  return { video_provider: source.provider, vdocipher_video_id: source.videoId };
}

export function mainVideoFields(source: VideoSource) {
  return { main_video_provider: source.provider, main_video_vdocipher_id: source.videoId };
}
