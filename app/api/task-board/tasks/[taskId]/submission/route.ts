import { getActiveDeviceSession } from "@/lib/auth/device-session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getTaskBoardTaskById,
  taskOffersLevel,
  upsertOwnSubmission,
  type TaskBoardLevel,
  type TaskBoardSubmissionPatch,
} from "@/lib/data/taskBoard";

const BUCKET = "task-board-submissions";
const MAX_FILE_SIZE_BYTES = 300 * 1024 * 1024;
const MAX_FILE_SIZE_LABEL = "300 MB";

// Never 'reviewing' or 'approved' -- those are admin-only transitions
// (claiming a submission for review, approving it). A student can only
// ever place a card in one of these three columns.
const STUDENT_STATUSES = ["todo", "progress", "submitted"] as const;
const LEVELS = ["base", "medium", "hard"] as const;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
}

export async function POST(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const session = await getActiveDeviceSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { taskId } = await params;
  if (!UUID_RE.test(taskId)) {
    return Response.json({ error: "Invalid task id." }, { status: 400 });
  }

  const task = await getTaskBoardTaskById(taskId);
  if (!task || !task.is_active) {
    return Response.json({ error: "Task not found." }, { status: 404 });
  }

  const studentId = session.user.id;
  const contentType = request.headers.get("content-type") ?? "";

  // --- Branch 1: status move / level pick (drag-and-drop, level picker) ---
  //
  // Backward moves, at this API level: the design's own mock only locks a
  // card once status === 'approved' -- a card that is 'submitted', or even
  // already claimed 'reviewing' by an admin, is still draggable back on
  // the student side (nothing in the mock's canDrag logic checks for
  // 'reviewing'). This route matches that exactly: any of the three
  // student-settable statuses is accepted regardless of the *current*
  // status, as long as the current status isn't 'approved'. That check is
  // enforced inside upsertOwnSubmission()'s guarded UPDATE
  // (`.neq("status", "approved")`), not here, so it's atomic -- a single
  // conditional UPDATE, not a read-then-write.
  //
  // Moving backward never touches level, submission_link, or the file
  // fields -- only `status`/`level` are ever patched in this branch, so
  // pulling a card out of 'reviewing' back to 'progress' doesn't lose
  // whatever was already submitted; the student's prior link/file/note
  // stay in place for whenever they submit again.
  //
  // No points_ledger side effect either way: award_task_board_points()'s
  // first check short-circuits for every status other than 'approved', so
  // this is a pure status change -- nothing was awarded pre-approval, so
  // there's nothing to claw back by moving backward.
  if (contentType.includes("application/json")) {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json({ error: "Invalid request body." }, { status: 400 });
    }

    const patch: TaskBoardSubmissionPatch = {};

    if ("status" in body) {
      if (!STUDENT_STATUSES.includes(body.status)) {
        return Response.json({ error: "Invalid status." }, { status: 400 });
      }
      patch.status = body.status;
    }

    if ("level" in body) {
      if (typeof body.level !== "string" || !LEVELS.includes(body.level as TaskBoardLevel)) {
        return Response.json({ error: "Invalid level." }, { status: 400 });
      }
      if (!taskOffersLevel(task, body.level)) {
        return Response.json({ error: "This task does not offer that level." }, { status: 400 });
      }
      patch.level = body.level as TaskBoardLevel;
    }

    if (Object.keys(patch).length === 0) {
      return Response.json({ error: "Nothing to update." }, { status: 400 });
    }

    const result = await upsertOwnSubmission(taskId, studentId, patch);
    if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
    return Response.json({ submission: result.submission });
  }

  // --- Branch 2: actual content submission (the modal's "Submit" button) ---
  //
  // A link or a file, matching the task's fixed submission_format, plus an
  // optional note. Always moves status to 'submitted' (guard against
  // 'approved' still applies inside upsertOwnSubmission) -- a fresh
  // submission means any previous review context is stale, so it goes
  // back to the top of the review queue rather than staying wherever an
  // admin had it claimed.
  const formData = await request.formData();
  const link = formData.get("link");
  const file = formData.get("file");
  const note = formData.get("note");
  const level = formData.get("level");

  const patch: TaskBoardSubmissionPatch = {
    status: "submitted",
    submitted_at: new Date().toISOString(),
  };

  if (typeof note === "string" && note.trim()) {
    patch.submission_note = note.trim().slice(0, 2000);
  }

  if (typeof level === "string") {
    if (!LEVELS.includes(level as TaskBoardLevel)) {
      return Response.json({ error: "Invalid level." }, { status: 400 });
    }
    if (!taskOffersLevel(task, level)) {
      return Response.json({ error: "This task does not offer that level." }, { status: 400 });
    }
    patch.level = level as TaskBoardLevel;
  }

  if (task.submission_format === "link") {
    if (typeof link !== "string" || !link.trim()) {
      return Response.json({ error: "A link is required for this task." }, { status: 400 });
    }
    try {
      new URL(link);
    } catch {
      return Response.json({ error: "Enter a valid URL." }, { status: 400 });
    }
    patch.submission_link = link.trim();

    const result = await upsertOwnSubmission(taskId, studentId, patch);
    if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
    return Response.json({ submission: result.submission });
  }

  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "A file is required for this task." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return Response.json({ error: `File must be ${MAX_FILE_SIZE_LABEL} or smaller.` }, { status: 400 });
  }

  const admin = createAdminClient();
  const filename = sanitizeFilename(file.name || "upload");
  // Namespaced <task_id>/<student_id>/<file> -- the storage.objects RLS
  // policy from the Stage 1 migration keys off this exact path shape
  // (folder segment [2] must equal the caller's auth.uid()).
  const path = `${taskId}/${studentId}/${Date.now()}-${filename}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type || "application/octet-stream", upsert: false });

  if (uploadError) {
    return Response.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  patch.submission_file_path = path;
  patch.submission_file_name = filename;
  patch.submission_file_size_bytes = file.size;

  const result = await upsertOwnSubmission(taskId, studentId, patch);
  if ("error" in result) {
    // Compensating cleanup on DB failure, same convention as
    // app/api/admin/session-resources/route.ts.
    await admin.storage.from(BUCKET).remove([path]);
    return Response.json({ error: result.error }, { status: result.status });
  }
  return Response.json({ submission: result.submission });
}
