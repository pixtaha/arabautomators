import "server-only";
import { getBunnyVideo } from "@/lib/bunny";
import { VIDEO_ID_PATTERNS, type VideoSource } from "@/lib/video-provider";

/** Verify processing server-side without generating playback credentials. */
export async function verifyVideoLink(source: VideoSource): Promise<{ error: string; status: number } | null> {
  if (source.provider === "bunny") {
    try {
      return (await getBunnyVideo(source.videoId))?.isFinished ? null : {
        error: "Video must exist and finish processing in the configured Bunny library.", status: 400,
      };
    } catch {
      return { error: "Could not verify the Bunny video. Try again later.", status: 502 };
    }
  }

  const unavailable = { error: "Could not verify the VdoCipher video. Try again later.", status: 502 };
  const notReady = { error: "Video must exist and finish processing in your VdoCipher account.", status: 400 };
  const secret = process.env.VDOCIPHER_API_SECRET;
  if (!secret || !VIDEO_ID_PATTERNS.vdocipher.test(source.videoId)) return unavailable;
  try {
    // https://www.vdocipher.com/docs/server/upload/status/
    const response = await fetch(`https://dev.vdocipher.com/api/videos/${source.videoId}`, {
      method: "GET",
      headers: { Authorization: `Apisecret ${secret}`, Accept: "application/json" },
      cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15_000),
    });
    if (response.status === 404) return notReady;
    if (!response.ok) return unavailable;
    const data: unknown = await response.json();
    return data && typeof data === "object" && "id" in data && data.id === source.videoId &&
      "status" in data && data.status === "ready" ? null : notReady;
  } catch {
    // Never forward secret-bearing upstream bodies or exception messages.
    return unavailable;
  }
}
