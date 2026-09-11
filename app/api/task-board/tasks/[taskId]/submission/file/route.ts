import { getActiveDeviceSession } from "@/lib/auth/device-session";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "task-board-submissions";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIGNED_URL_TTL_SECONDS = 60;

// Mints a short-lived signed URL for the caller's OWN submission file.
// Ownership is enforced by filtering the row lookup itself
// (.eq("student_id", session.user.id)) rather than fetching then checking
// -- there is no code path that can return another student's file.
export async function GET(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const session = await getActiveDeviceSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId } = await params;
  if (!UUID_RE.test(taskId)) {
    return Response.json({ error: "Invalid task id." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: submission } = await admin
    .from("task_board_submissions")
    .select("submission_file_path, submission_file_name")
    .eq("task_id", taskId)
    .eq("student_id", session.user.id)
    .maybeSingle();

  if (!submission?.submission_file_path) {
    return Response.json({ error: "No file for this task." }, { status: 404 });
  }

  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(submission.submission_file_path, SIGNED_URL_TTL_SECONDS, {
      download: submission.submission_file_name ?? undefined,
    });

  if (error || !data) return Response.json({ error: "Could not create link." }, { status: 500 });
  return Response.json({ url: data.signedUrl }, { headers: { "Cache-Control": "private, no-store" } });
}
