import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "task-board-submissions";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIGNED_URL_TTL_SECONDS = 60;

// Admin equivalent of the student-side signed-URL route, keyed by
// submission id rather than task id -- no owner check needed, an admin
// can view any submission's file.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return Response.json({ error: "Invalid submission id." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: submission } = await supabase
    .from("task_board_submissions")
    .select("submission_file_path, submission_file_name")
    .eq("id", id)
    .maybeSingle();

  if (!submission?.submission_file_path) {
    return Response.json({ error: "No file for this submission." }, { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(submission.submission_file_path, SIGNED_URL_TTL_SECONDS, {
      download: submission.submission_file_name ?? undefined,
    });

  if (error || !data) return Response.json({ error: "Could not create link." }, { status: 500 });
  return Response.json({ url: data.signedUrl }, { headers: { "Cache-Control": "private, no-store" } });
}
