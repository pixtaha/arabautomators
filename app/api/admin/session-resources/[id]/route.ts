import { requireAdmin } from "@/lib/adminAuth";
import { verifyVideoLink } from "@/lib/admin-video-link";
import { parseVideoLink, videoResourceFields } from "@/lib/video-provider";
import { BUNNY_VIDEO_ID_RE } from "@/lib/bunny-playback";
import { isVideoResource, withoutVideoFileUrl } from "@/lib/sessionResources";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "session-resources";
const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`;

// Relink an existing card in place. Preserve its ID, category, title and order.
// The migration archives legacy source locations privately; never delete media.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await requireAdmin()) return Response.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  let input: unknown;
  try { input = await request.json(); } catch { /* invalid JSON */ }
  if (!BUNNY_VIDEO_ID_RE.test(id) || !input || typeof input !== "object" || Array.isArray(input)) {
    return Response.json({ error: "A valid video resource and provider link are required." }, { status: 400 });
  }
  const link = parseVideoLink(input);
  if (link.error || !link.source) return Response.json({ error: link.error }, { status: 400 });
  const supabase = createAdminClient();
  const { data: resource, error } = await supabase.from("session_resources").select("id, type, file_url").eq("id", id).maybeSingle();
  if (error || !resource || !isVideoResource(resource.type)) {
    return Response.json({ error: "Video resource not found." }, { status: 404 });
  }
  // Require the source archive migration before clearing a legacy URL.
  if (resource.file_url) {
    return Response.json({ error: "Apply the protected-video data migration before linking this legacy resource." }, { status: 409 });
  }
  const verification = await verifyVideoLink(link.source);
  if (verification) return Response.json({ error: verification.error }, { status: verification.status });
  const { data: updated, error: updateError } = await supabase.from("session_resources")
    .update({ ...videoResourceFields(link.source), file_url: null }).eq("id", id).in("type", ["video", "credential_video"])
    .select("id, type, title, file_url, bunny_video_id, video_provider, vdocipher_video_id, order_index, file_size_bytes, page_count").single();
  if (updateError || !updated) return Response.json({ error: "Could not link video." }, { status: 500 });
  return Response.json({ resource: withoutVideoFileUrl(updated) });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmin();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: resource, error: fetchError } = await supabase
    .from("session_resources")
    .select("id, file_url")
    .eq("id", id)
    .maybeSingle();

  if (fetchError || !resource) {
    return Response.json({ error: "Resource not found." }, { status: 404 });
  }

  const { error: deleteError } = await supabase.from("session_resources").delete().eq("id", id);
  if (deleteError) {
    return Response.json({ error: "Could not delete resource." }, { status: 500 });
  }

  if (resource.file_url) {
    const prefixIndex = resource.file_url.indexOf(PUBLIC_PREFIX);
    if (prefixIndex !== -1) {
      const path = decodeURIComponent(resource.file_url.slice(prefixIndex + PUBLIC_PREFIX.length));
      await supabase.storage.from(BUCKET).remove([path]);
    }
  }

  return Response.json({ ok: true });
}
