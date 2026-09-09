export type VideoProvider = "vdocipher" | "bunny";
export type VideoSource = { provider: VideoProvider; videoId: string };

export const VIDEO_ID_PATTERNS = {
  vdocipher: /^[0-9a-f]{32}$/i,
  bunny: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
};

export function parseVideoLink(input: { videoProvider?: unknown; vdocipherVideoId?: unknown; bunnyVideoId?: unknown }):
  { source: VideoSource; error?: never } | { error: string; source?: never } {
  // Preserve requests from the earlier Bunny-only admin client.
  const provider = input.videoProvider === undefined
    ? (typeof input.bunnyVideoId === "string" ? "bunny" : "vdocipher")
    : input.videoProvider;
  if (provider !== "vdocipher" && provider !== "bunny") return { error: "Choose VdoCipher or Bunny as the video provider." };
  const value = provider === "vdocipher" ? input.vdocipherVideoId : input.bunnyVideoId;
  if (typeof value !== "string" || !VIDEO_ID_PATTERNS[provider].test(value.trim())) {
    return { error: provider === "vdocipher" ? "Enter a valid VdoCipher Video ID (32 hexadecimal characters)." : "Enter the video's Bunny Stream ID." };
  }
  return { source: { provider, videoId: value.trim().toLowerCase() } };
}

/** Explicit provider wins; only a null/absent provider may use legacy Bunny. */
export function resolveVideoSource(provider: string | null | undefined, bunnyId: string | null, vdocipherId?: string | null): VideoSource | null {
  const selected = provider ?? "bunny";
  if (selected !== "bunny" && selected !== "vdocipher") return null;
  const id = selected === "bunny" ? bunnyId : vdocipherId;
  return id && VIDEO_ID_PATTERNS[selected].test(id)
    ? { provider: selected, videoId: id.toLowerCase() }
    : null;
}

/** Partial updates deliberately omit the inactive provider's ID. */
export function videoResourceFields(source: VideoSource) {
  return source.provider === "vdocipher"
    ? { video_provider: source.provider, vdocipher_video_id: source.videoId }
    : { video_provider: source.provider, bunny_video_id: source.videoId };
}

export function mainVideoFields(source: VideoSource) {
  return source.provider === "vdocipher"
    ? { main_video_provider: source.provider, main_video_vdocipher_id: source.videoId }
    : { main_video_provider: source.provider, main_video_bunny_id: source.videoId };
}
