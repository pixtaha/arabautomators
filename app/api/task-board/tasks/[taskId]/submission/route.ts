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
const MAX_CODE_LENGTH = 50_000;
const MAX_SCREENSHOT_COUNT = 10;
const MAX_SCREENSHOT_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_SCREENSHOT_SIZE_LABEL = "10 MB";
const MAX_TOTAL_SCREENSHOT_BYTES = 50 * 1024 * 1024;
const MAX_TOTAL_SCREENSHOT_BYTES_LABEL = "50 MB";
const ALLOWED_SCREENSHOT_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
  if (task.start_at && new Date(task.start_at).getTime() > Date.now()) {
    return Response.json({ error: "This task is not open yet." }, { status: 403 });
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
  const code = formData.get("code");
  const screenshotFiles = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);

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

  // --- Validate everything before uploading anything (see below for why) ---

  const codeText = typeof code === "string" ? code.trim() : "";
  if (task.requires_code && !codeText) {
    return Response.json({ error: "Code is required for this task." }, { status: 400 });
  }
  if (codeText) {
    patch.submission_code = codeText.slice(0, MAX_CODE_LENGTH);
  }

  // Every submit resends the whole payload -- there's no partial-update
  // path for content fields (matching how the primary link/file below has
  // always had to be resent on every resubmit too) -- so requiring fresh
  // screenshots here, even on a resubmit that only changed e.g. the code
  // text, is intentional, not an oversight.
  if (task.requires_screenshots && screenshotFiles.length === 0) {
    return Response.json({ error: "At least one screenshot is required for this task." }, { status: 400 });
  }
  if (screenshotFiles.length > MAX_SCREENSHOT_COUNT) {
    return Response.json({ error: `Attach at most ${MAX_SCREENSHOT_COUNT} screenshots.` }, { status: 400 });
  }
  let totalScreenshotBytes = 0;
  for (const f of screenshotFiles) {
    if (!ALLOWED_SCREENSHOT_TYPES.includes(f.type)) {
      return Response.json({ error: "Screenshots must be JPG, PNG, or WEBP." }, { status: 400 });
    }
    if (f.size > MAX_SCREENSHOT_SIZE_BYTES) {
      return Response.json({ error: `Each screenshot must be ${MAX_SCREENSHOT_SIZE_LABEL} or smaller.` }, { status: 400 });
    }
    totalScreenshotBytes += f.size;
  }
  if (totalScreenshotBytes > MAX_TOTAL_SCREENSHOT_BYTES) {
    return Response.json({ error: `Screenshots must total ${MAX_TOTAL_SCREENSHOT_BYTES_LABEL} or smaller.` }, { status: 400 });
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
  } else {
    if (!(file instanceof File) || file.size === 0) {
      return Response.json({ error: "A file is required for this task." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return Response.json({ error: `File must be ${MAX_FILE_SIZE_LABEL} or smaller.` }, { status: 400 });
    }
  }

  // --- Uploads: all-or-nothing, and strictly before any DB write ---
  //
  // Every object (the primary attachment, if this is a file-format task,
  // plus every screenshot) is uploaded to storage first. If any single
  // upload fails partway through, everything already uploaded in this
  // batch is removed and the request fails before upsertOwnSubmission()
  // ever runs -- so a failed submit can never leave the student's previous
  // submission half-overwritten.
  const admin = createAdminClient();
  const uploadedPaths: string[] = [];

  if (task.submission_format !== "link") {
    const primaryFile = file as File;
    const filename = sanitizeFilename(primaryFile.name || "upload");
    // Namespaced <task_id>/<student_id>/<file> -- the storage.objects RLS
    // policy keys off this exact path shape (folder segment [2] must equal
    // the caller's auth.uid()).
    const path = `${taskId}/${studentId}/${Date.now()}-${filename}`;
    const buffer = Buffer.from(await primaryFile.arrayBuffer());
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: primaryFile.type || "application/octet-stream", upsert: false });
    if (uploadError) {
      return Response.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }
    uploadedPaths.push(path);
    patch.submission_file_path = path;
    patch.submission_file_name = filename;
    patch.submission_file_size_bytes = primaryFile.size;
  }

  const screenshotUploads: { path: string; name: string; size: number }[] = [];
  for (let i = 0; i < screenshotFiles.length; i++) {
    const f = screenshotFiles[i];
    const filename = sanitizeFilename(f.name || `screenshot-${i}`);
    const path = `${taskId}/${studentId}/${Date.now()}-${i}-${filename}`;
    const buffer = Buffer.from(await f.arrayBuffer());
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: f.type, upsert: false });
    if (uploadError) {
      await admin.storage.from(BUCKET).remove([...uploadedPaths, path]);
      return Response.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }
    uploadedPaths.push(path);
    screenshotUploads.push({ path, name: filename, size: f.size });
  }

  const result = await upsertOwnSubmission(taskId, studentId, patch);
  if ("error" in result) {
    // Compensating cleanup on DB failure, same convention as
    // app/api/admin/session-resources/route.ts.
    await admin.storage.from(BUCKET).remove(uploadedPaths);
    return Response.json({ error: result.error }, { status: result.status });
  }

  // Screenshots: resubmission always replaces the previous set -- delete
  // old DB rows + storage objects, then insert whatever was uploaded this
  // time. Runs unconditionally (not just when new screenshots were sent)
  // so it also cleans up if a task's requires_screenshots was later turned
  // off; harmless no-op when there was nothing to replace.
  const { data: oldFiles } = await admin
    .from("task_board_submission_files")
    .select("id, file_path")
    .eq("submission_id", result.submission.id);

  if (oldFiles && oldFiles.length > 0) {
    await admin.storage.from(BUCKET).remove(oldFiles.map((f) => f.file_path));
    await admin.from("task_board_submission_files").delete().eq("submission_id", result.submission.id);
  }

  if (screenshotUploads.length > 0) {
    await admin.from("task_board_submission_files").insert(
      screenshotUploads.map((f, i) => ({
        submission_id: result.submission.id,
        file_path: f.path,
        file_name: f.name,
        file_size_bytes: f.size,
        sort_order: i,
      })),
    );
  }

  return Response.json({ submission: result.submission });
}
