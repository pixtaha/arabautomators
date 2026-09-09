import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyVideoLink } from "@/lib/admin-video-link";
import { mainVideoFields, parseVideoLink } from "@/lib/video-provider";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  let input: unknown;
  try { input = await request.json(); } catch { /* invalid JSON */ }
  if (!UUID_RE.test(id) || !input || typeof input !== "object" || Array.isArray(input)) {
    return Response.json({ error: "A valid session and provider link are required." }, { status: 400 });
  }
  const link = parseVideoLink(input);
  if (link.error || !link.source) return Response.json({ error: link.error }, { status: 400 });
  const admin = createAdminClient();
  const { data: session, error } = await admin.from("sessions").select("id").eq("id", id).maybeSingle();
  if (error || !session) return Response.json({ error: "Session not found." }, { status: 404 });
  const verification = await verifyVideoLink(link.source);
  if (verification) return Response.json({ error: verification.error }, { status: verification.status });
  const { data: updated, error: updateError } = await admin.from("sessions")
    .update(mainVideoFields(link.source)).eq("id", id)
    .select("id, main_video_provider, main_video_vdocipher_id").single();
  if (updateError || !updated) return Response.json({ error: "Could not link the main session video." }, { status: 500 });
  return Response.json({ session: updated }, { headers: { "Cache-Control": "private, no-store" } });
}
