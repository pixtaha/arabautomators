import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicSignedUrls } from "@/lib/supabase/signedStorageUrl";
import { getSubmissionFiles } from "@/lib/data/taskBoard";

const BUCKET = "task-board-submissions";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIGNED_URL_TTL_SECONDS = 300;

// Admin equivalent of the student-side screenshot list route -- no owner
// check, keyed by submission id directly.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return Response.json({ error: "Invalid submission id." }, { status: 400 });
  }

  const fileRows = await getSubmissionFiles(id);
  if (fileRows.length === 0) return Response.json({ files: [] });

  const supabase = createAdminClient();
  const { data: signed, error } = await createPublicSignedUrls(
    supabase,
    BUCKET,
    fileRows.map((f) => f.file_path),
    SIGNED_URL_TTL_SECONDS,
  );
  if (error || !signed) return Response.json({ error: "Could not create links." }, { status: 500 });

  const files = fileRows.map((f, i) => ({
    id: f.id,
    name: f.file_name,
    size_bytes: f.file_size_bytes,
    url: signed[i]?.signedUrl ?? null,
  }));

  return Response.json({ files }, { headers: { "Cache-Control": "private, no-store" } });
}
