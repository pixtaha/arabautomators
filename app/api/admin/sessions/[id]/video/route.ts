import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyVideoLink } from "@/lib/admin-video-link";
import { parseVideoLink } from "@/lib/video-provider";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SELECT_FIELDS = "id, session_id, order_index, title, vdocipher_video_id";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!UUID_RE.test(id)) return Response.json({ error: "Invalid session id." }, { status: 400 });

  const admin = createAdminClient();
  const { data: parts, error } = await admin
    .from("session_video_parts")
    .select(SELECT_FIELDS)
    .eq("session_id", id)
    .order("order_index");

  if (error) return Response.json({ error: "Could not load video parts." }, { status: 500 });
  return Response.json({ parts: parts ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  if (!UUID_RE.test(id)) return Response.json({ error: "Invalid session id." }, { status: 400 });

  let input: unknown;
  try { input = await request.json(); } catch { /* invalid JSON */ }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return Response.json({ error: "A title and VdoCipher video ID are required." }, { status: 400 });
  }

  const { title } = input as { title?: unknown };
  if (typeof title !== "string" || !title.trim()) {
    return Response.json({ error: "Title is required." }, { status: 400 });
  }

  const link = parseVideoLink(input as { vdocipherVideoId?: unknown });
  if (link.error || !link.source) return Response.json({ error: link.error }, { status: 400 });

  const admin = createAdminClient();
  const { data: session, error: sessionError } = await admin.from("sessions").select("id").eq("id", id).maybeSingle();
  if (sessionError || !session) return Response.json({ error: "Session not found." }, { status: 404 });

  const verification = await verifyVideoLink(link.source);
  if (verification) return Response.json({ error: verification.error }, { status: verification.status });

  const { data: last, error: orderError } = await admin.from("session_video_parts")
    .select("order_index").eq("session_id", id).order("order_index", { ascending: false }).limit(1);
  if (orderError) return Response.json({ error: "Could not save video part." }, { status: 500 });

  const { data: part, error } = await admin.from("session_video_parts").insert({
    session_id: id,
    title: title.trim(),
    vdocipher_video_id: link.source.videoId,
    order_index: (last?.[0]?.order_index ?? 0) + 1,
  }).select(SELECT_FIELDS).single();

  if (error || !part) return Response.json({ error: "Could not save video part." }, { status: 500 });
  return Response.json({ part });
}
