import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "session-resources";
const PUBLIC_PREFIX = `/storage/v1/object/public/${BUCKET}/`;

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
