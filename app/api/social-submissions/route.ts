import { getActiveDeviceSession } from "@/lib/auth/device-session";
import { getSocialWindowById, upsertOwnSocialSubmission } from "@/lib/data/socialSubmissions";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const session = await getActiveDeviceSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { windowId, postUrl } = body as { windowId?: unknown; postUrl?: unknown };
  if (typeof windowId !== "string" || !UUID_RE.test(windowId)) {
    return Response.json({ error: "Invalid window id." }, { status: 400 });
  }
  if (typeof postUrl !== "string" || !postUrl.trim()) {
    return Response.json({ error: "A post URL is required." }, { status: 400 });
  }
  try {
    new URL(postUrl.trim());
  } catch {
    return Response.json({ error: "Enter a valid URL." }, { status: 400 });
  }

  const window = await getSocialWindowById(windowId);
  if (!window || !window.is_active) {
    return Response.json({ error: "This window is not open." }, { status: 404 });
  }
  const now = Date.now();
  if (new Date(window.opens_at).getTime() > now) {
    return Response.json({ error: "This window is not open yet." }, { status: 403 });
  }
  if (window.closes_at && new Date(window.closes_at).getTime() < now) {
    return Response.json({ error: "This window has closed." }, { status: 403 });
  }

  const result = await upsertOwnSocialSubmission(windowId, session.user.id, postUrl.trim());
  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ submission: result.submission });
}
