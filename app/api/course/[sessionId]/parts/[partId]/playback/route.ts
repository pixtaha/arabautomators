import { getActiveDeviceSession } from "@/lib/auth/device-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { forensicViewerToken } from "@/lib/forensic-watermark";
import { getSessionVideoParts } from "@/lib/session-video-parts";
import { createVdoCipherPlayback } from "@/lib/vdocipher-playback";
import { SITE_URL } from "@/lib/siteUrl";

export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const headers = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie", "X-Content-Type-Options": "nosniff" };

export async function POST(request: Request, { params }: { params: Promise<{ sessionId: string; partId: string }> }) {
  if (request.headers.get("sec-fetch-site") === "cross-site" ||
      (request.headers.has("origin") && request.headers.get("origin") !== new URL(SITE_URL).origin)) {
    return Response.json({ error: "Forbidden" }, { status: 403, headers });
  }
  try {
    // Use exactly the active-device authorization required by the course pages.
    const activeSession = await getActiveDeviceSession({ touch: true });
    if (!activeSession) {
      return Response.json({ error: "Sign in again to watch this video." }, { status: 401, headers });
    }
    const { sessionId, partId } = await params;
    if (!UUID_RE.test(sessionId) || !UUID_RE.test(partId)) {
      return Response.json({ error: "Video not found." }, { status: 404, headers });
    }
    const admin = createAdminClient();
    const { data: session, error: sessionError } = await admin.from("sessions").select("id,module_id").eq("id", sessionId).maybeSingle();
    if (sessionError || !session) {
      return Response.json({ error: "Video not found." }, { status: 404, headers });
    }
    const [{ data: lectureParts, error: partsError }, { data: resources, error: resourceError }, { data: profile }] = await Promise.all([
      admin.from("session_video_parts").select("id,session_id,order_index,title,vdocipher_video_id").eq("session_id", sessionId),
      session.module_id
        ? admin.from("session_resources").select("id,title,type,order_index,video_provider,vdocipher_video_id")
            .eq("module_id", session.module_id).in("type", ["video", "credential_video"])
        : Promise.resolve({ data: [], error: null }),
      admin.from("profiles").select("username").eq("id", activeSession.user.id).maybeSingle(),
    ]);
    if (partsError || resourceError) {
      return Response.json({ error: "Video not found." }, { status: 404, headers });
    }
    const part = getSessionVideoParts(sessionId, lectureParts ?? [], resources ?? []).find((part) => part.id === partId);
    if (part?.source?.provider !== "vdocipher") {
      return Response.json({ error: "Video not found." }, { status: 404, headers });
    }
    const watermark = {
      name: typeof profile?.username === "string"
        ? profile.username.trim().replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 32) || "viewer"
        : "viewer",
      token: forensicViewerToken({
        userId: activeSession.user.id,
        deviceSessionId: activeSession.deviceSessionId,
        authSessionId: activeSession.authSessionId,
      }),
    };
    const playback = await createVdoCipherPlayback(part.source.videoId, watermark);
    return Response.json({ embedUrl: playback.embedUrl, expires: playback.expires }, { headers });
  } catch {
    return Response.json({ error: "This video is temporarily unavailable. Please try again later." }, { status: 503, headers });
  }
}
