import { getActiveDeviceSession } from "@/lib/auth/device-session";
import { BUNNY_VIDEO_ID_RE, createBunnyPlayback } from "@/lib/bunny-playback";
import { createAdminClient } from "@/lib/supabase/admin";
import { forensicViewerToken } from "@/lib/forensic-watermark";

export const runtime = "nodejs";

const headers = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie", "X-Content-Type-Options": "nosniff" };

export async function GET(request: Request, { params }: { params: Promise<{ sessionId: string; videoId: string }> }) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return Response.json({ error: "Forbidden" }, { status: 403, headers });
  }
  const activeSession = await getActiveDeviceSession({ touch: true });
  if (!activeSession) {
    return Response.json({ error: "Sign in again to watch this video." }, { status: 401, headers });
  }
  const { sessionId, videoId } = await params;
  if (!BUNNY_VIDEO_ID_RE.test(sessionId) || !BUNNY_VIDEO_ID_RE.test(videoId)) {
    return Response.json({ error: "Video not found." }, { status: 404, headers });
  }
  // Same active-device authorization as course pages; never sign arbitrary IDs.
  const admin = createAdminClient();
  const [{ data: session, error: sessionError }, { data: resources, error: resourceError }, { data: profile }] = await Promise.all([
    admin.from("sessions").select("main_video_bunny_id").eq("id", sessionId).maybeSingle(),
    admin.from("session_resources").select("id").eq("session_id", sessionId)
      .in("type", ["video", "credential_video"]).eq("bunny_video_id", videoId).limit(1),
    admin.from("profiles").select("username").eq("id", activeSession.user.id).maybeSingle(),
  ]);
  if (sessionError || resourceError || !session ||
      (session.main_video_bunny_id !== videoId && !resources?.length)) {
    return Response.json({ error: "Video not found." }, { status: 404, headers });
  }
  try {
    const playback = await createBunnyPlayback(videoId);
    return Response.json({
      ...playback,
      watermark: {
        name: typeof profile?.username === "string"
          ? profile.username.trim().replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 32) || "viewer"
          : "viewer",
        token: forensicViewerToken({
          userId: activeSession.user.id,
          deviceSessionId: activeSession.deviceSessionId,
          authSessionId: activeSession.authSessionId,
        }),
      },
    }, { headers });
  } catch {
    // Never log an upstream response, credential, or signed URL.
    return Response.json({ error: "This video is temporarily unavailable. Please try again later." }, { status: 503, headers });
  }
}
