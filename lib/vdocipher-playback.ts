import "server-only";

const VIDEO_ID_RE = /^[0-9a-f]{32}$/i;
const OTP_TTL_SECONDS = 300;
const UNAVAILABLE = "Protected video authorization is unavailable.";

/** Call only after the active device and the session/part association are verified. */
export async function createVdoCipherPlayback(videoId: string, watermark: { name: string; token: string }) {
  const secret = process.env.VDOCIPHER_API_SECRET;
  if (!secret || !VIDEO_ID_RE.test(videoId) ||
      !/^[a-zA-Z0-9_.-]{1,32}$/.test(watermark.name) || !/^[A-Z2-9]{6}$/.test(watermark.token)) {
    throw new Error(UNAVAILABLE);
  }

  try {
    const expires = Math.floor(Date.now() / 1000) + OTP_TTL_SECONDS;
    const response = await fetch(`https://dev.vdocipher.com/api/videos/${videoId.toLowerCase()}/otp`, {
      method: "POST",
      headers: {
        Authorization: `Apisecret ${secret}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ttl: OTP_TTL_SECONDS,
        // VdoCipher requires annotate to be a JSON string inside the JSON body.
        // The existing lookup token travels inside the player, including fullscreen.
        annotate: JSON.stringify([{
          type: "rtext", text: `@${watermark.name} · ${watermark.token}`,
          alpha: "0.60", color: "0xFFFFFF", size: "12", interval: "10000", skip: "0",
        }]),
      }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error(UNAVAILABLE);
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || !("otp" in data) || !("playbackInfo" in data)) {
      throw new Error(UNAVAILABLE);
    }
    const { otp, playbackInfo } = data;
    // Whitelist the two credentials; never forward upstream bodies or errors.
    for (const value of [otp, playbackInfo]) {
      if (typeof value !== "string" || !value.trim() || value.length > 32_768 || value.includes(secret)) {
        throw new Error(UNAVAILABLE);
      }
    }
    const url = new URL("https://player.vdocipher.com/v2/");
    url.searchParams.set("otp", otp as string);
    url.searchParams.set("playbackInfo", playbackInfo as string);
    return { embedUrl: url.toString(), expires };
  } catch {
    // Discard fetch/JSON errors too: they can contain credentials or upstream data.
    throw new Error(UNAVAILABLE);
  }
}
