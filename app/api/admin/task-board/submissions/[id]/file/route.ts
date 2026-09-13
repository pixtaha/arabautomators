import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUBMISSION_FILE_KIND_COLUMNS, type SubmissionFileKind } from "@/lib/data/taskBoard";

const BUCKET = "task-board-submissions";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIGNED_URL_TTL_SECONDS = 60;

function parseKind(value: string | null): SubmissionFileKind | null {
  if (value === "pdf" || value === "image" || value === "video" || value === "file") return value;
  return value === null ? "file" : null;
}

// Admin equivalent of the student-side signed-URL route, keyed by
// submission id rather than task id -- no owner check needed, an admin
// can view any submission's file. `?type=` selects which single-value file
// slot to sign, same as the student route -- defaults to "file".
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return Response.json({ error: "Invalid submission id." }, { status: 400 });
  }

  const kind = parseKind(new URL(request.url).searchParams.get("type"));
  if (!kind) return Response.json({ error: "Invalid file type." }, { status: 400 });
  const { path: pathCol, name: nameCol } = SUBMISSION_FILE_KIND_COLUMNS[kind];

  const supabase = createAdminClient();
  // Static column list, not a dynamic `${pathCol}, ${nameCol}` template --
  // see the student-side route for why (a dynamic select string can't be
  // parsed at the type level, degrading to an unindexable union).
  const { data: submission } = await supabase
    .from("task_board_submissions")
    .select(
      "submission_file_path, submission_file_name, submission_pdf_path, submission_pdf_name, submission_image_path, submission_image_name, submission_video_path, submission_video_name",
    )
    .eq("id", id)
    .maybeSingle();

  const submissionFields = submission as Record<string, string | null> | null;
  const filePath = submissionFields?.[pathCol] ?? null;
  const fileName = submissionFields?.[nameCol] ?? null;
  if (!filePath) {
    return Response.json({ error: "No file for this submission." }, { status: 404 });
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS, { download: fileName ?? undefined });

  if (error || !data) return Response.json({ error: "Could not create link." }, { status: 500 });
  return Response.json({ url: data.signedUrl }, { headers: { "Cache-Control": "private, no-store" } });
}
