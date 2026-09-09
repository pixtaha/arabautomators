import { requireAdmin } from "@/lib/adminAuth";
import { forensicViewerToken } from "@/lib/forensic-watermark";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!await requireAdmin()) return Response.json({ error: "Not found." }, { status: 404 });
  const body = await request.json().catch(() => null) as { token?: unknown } | null;
  const token = typeof body?.token === "string" ? body.token.trim().toUpperCase() : "";
  if (!/^[A-Z2-9]{4,8}$/.test(token)) return Response.json({ error: "Invalid token." }, { status: 400 });

  const admin = createAdminClient();
  const { data: sessions } = await admin
    .from("user_device_sessions")
    .select("id, user_id, auth_session_id")
    .limit(5000);
  const match = (sessions ?? []).find((session) => forensicViewerToken({
    userId: session.user_id,
    deviceSessionId: session.id,
    authSessionId: session.auth_session_id,
  }) === token);
  if (!match) return Response.json({ error: "No matching viewing session." }, { status: 404 });

  const { data: profile } = await admin.from("profiles").select("username").eq("id", match.user_id).maybeSingle();
  return Response.json({
    userId: match.user_id,
    deviceSessionId: match.id,
    authSessionId: match.auth_session_id,
    username: profile?.username ?? null,
  }, { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
}
