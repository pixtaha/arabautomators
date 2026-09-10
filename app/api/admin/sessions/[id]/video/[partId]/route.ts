import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyVideoLink } from "@/lib/admin-video-link";
import { parseVideoLink } from "@/lib/video-provider";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SELECT_FIELDS = "id, session_id, order_index, title, vdocipher_video_id";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; partId: string }> }) {
  if (!await requireAdmin()) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id, partId } = await params;
  if (!UUID_RE.test(id) || !UUID_RE.test(partId)) {
    return Response.json({ error: "Invalid session or part id." }, { status: 400 });
  }

  let input: unknown;
  try { input = await request.json(); } catch { /* invalid JSON */ }
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }
  const { title, vdocipherVideoId, orderIndex } = input as {
    title?: unknown; vdocipherVideoId?: unknown; orderIndex?: unknown;
  };

  const update: Record<string, string | number> = {};

  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      return Response.json({ error: "Title cannot be empty." }, { status: 400 });
    }
    update.title = title.trim();
  }

  if (vdocipherVideoId !== undefined) {
    const link = parseVideoLink({ vdocipherVideoId });
    if (link.error || !link.source) return Response.json({ error: link.error }, { status: 400 });
    const verification = await verifyVideoLink(link.source);
    if (verification) return Response.json({ error: verification.error }, { status: verification.status });
    update.vdocipher_video_id = link.source.videoId;
  }

  if (orderIndex !== undefined) {
    if (typeof orderIndex !== "number" || !Number.isInteger(orderIndex) || orderIndex < 0) {
      return Response.json({ error: "Invalid order." }, { status: 400 });
    }
    update.order_index = orderIndex;
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: part, error } = await admin.from("session_video_parts")
    .update(update).eq("id", partId).eq("session_id", id)
    .select(SELECT_FIELDS).single();

  if (error || !part) return Response.json({ error: "Could not update video part." }, { status: 500 });
  return Response.json({ part });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; partId: string }> }) {
  if (!await requireAdmin()) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id, partId } = await params;
  if (!UUID_RE.test(id) || !UUID_RE.test(partId)) {
    return Response.json({ error: "Invalid session or part id." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: part, error: fetchError } = await admin.from("session_video_parts")
    .select("id").eq("id", partId).eq("session_id", id).maybeSingle();
  if (fetchError || !part) return Response.json({ error: "Video part not found." }, { status: 404 });

  const { error: deleteError } = await admin.from("session_video_parts").delete().eq("id", partId);
  if (deleteError) return Response.json({ error: "Could not delete video part." }, { status: 500 });

  return Response.json({ ok: true });
}
