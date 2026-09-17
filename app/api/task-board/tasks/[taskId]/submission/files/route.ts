import { getActiveDeviceSession } from "@/lib/auth/device-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicSignedUrls } from "@/lib/supabase/signedStorageUrl";
import { getSubmissionFiles } from "@/lib/data/taskBoard";

const BUCKET = "task-board-submissions";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIGNED_URL_TTL_SECONDS = 300;

// Lists the caller's OWN screenshot attachments for this task, as signed
// URLs -- the single-file signed-URL route next door doesn't generalize to
// "N files", since it's keyed to fetch exactly one submission_file_path.
// Batch createSignedUrls() (one storage call for all paths) rather than N
// createSignedUrl() calls, since this powers a thumbnail gallery that wants
// every image visible at once, not one link-per-click.
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
    .select("id")
    .eq("task_id", taskId)
    .eq("student_id", session.user.id)
    .maybeSingle();

  if (!submission) return Response.json({ files: [] });

  const fileRows = await getSubmissionFiles(submission.id);
  if (fileRows.length === 0) return Response.json({ files: [] });

  const { data: signed, error } = await createPublicSignedUrls(
    admin,
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
