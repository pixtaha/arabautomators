import { getActiveDeviceSession } from "@/lib/auth/device-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUBMISSION_FILE_KIND_COLUMNS, type SubmissionFileKind } from "@/lib/data/taskBoard";

const BUCKET = "task-board-submissions";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIGNED_URL_TTL_SECONDS = 60;

function parseKind(value: string | null): SubmissionFileKind | null {
  if (value === "pdf" || value === "image" || value === "video" || value === "file") return value;
  return value === null ? "file" : null;
}

// Mints a short-lived signed URL for the caller's OWN submission file.
// Ownership is enforced by filtering the row lookup itself
// (.eq("student_id", session.user.id)) rather than fetching then checking
// -- there is no code path that can return another student's file.
// `?type=` selects which of the (now up to 4) single-value file slots to
// sign -- defaults to "file" (the generic slot) for backward compatibility.
export async function GET(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const session = await getActiveDeviceSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId } = await params;
  if (!UUID_RE.test(taskId)) {
    return Response.json({ error: "Invalid task id." }, { status: 400 });
  }

  const kind = parseKind(new URL(request.url).searchParams.get("type"));
  if (!kind) return Response.json({ error: "Invalid file type." }, { status: 400 });
  const { path: pathCol, name: nameCol } = SUBMISSION_FILE_KIND_COLUMNS[kind];

  const admin = createAdminClient();
  // Static column list (not a dynamic `${pathCol}, ${nameCol}` template) so
  // Supabase's generated types can infer a concrete row shape -- a dynamic
  // select string can't be parsed at the type level, which otherwise
  // degrades to a multi-hundred-branch union that can't be indexed at all.
  const { data: submission } = await admin
    .from("task_board_submissions")
    .select(
      "submission_file_path, submission_file_name, submission_pdf_path, submission_pdf_name, submission_image_path, submission_image_name, submission_video_path, submission_video_name",
    )
    .eq("task_id", taskId)
    .eq("student_id", session.user.id)
    .maybeSingle();

  const submissionFields = submission as Record<string, string | null> | null;
  const filePath = submissionFields?.[pathCol] ?? null;
  const fileName = submissionFields?.[nameCol] ?? null;
  if (!filePath) {
    return Response.json({ error: "No file for this task." }, { status: 404 });
  }

  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS, { download: fileName ?? undefined });

  if (error || !data) return Response.json({ error: "Could not create link." }, { status: 500 });
  return Response.json({ url: data.signedUrl }, { headers: { "Cache-Control": "private, no-store" } });
}
