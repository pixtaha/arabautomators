import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResourcesByTaskIds, getTaskBoardTaskById } from "@/lib/data/taskBoard";
import {
  DEFAULT_COMPLETED_COLOR_BASE,
  DEFAULT_COMPLETED_COLOR_MEDIUM,
  LEVEL_KEYS,
  type LevelKey,
  type ParsedLevel,
  type ParsedResource,
  parseDate,
  parseHexColor,
  parseLevel,
  parseResource,
} from "@/lib/taskBoardValidation";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RESOURCE_BUCKET = "task-board-resources";
const RESOURCE_PUBLIC_PREFIX = `/storage/v1/object/public/${RESOURCE_BUCKET}/`;
const SUBMISSION_BUCKET = "task-board-submissions";

// Powers the Manage Tasks edit form: full task detail (every column the
// create/edit form can seed from) plus its resources, fetched on demand
// when an admin clicks "Edit" on a task card. Not folded into the list GET
// in tasks/route.ts, which only needs its lighter TASK_LIST_COLUMNS subset.
export async function GET(_request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { taskId } = await params;
  if (!UUID_RE.test(taskId)) return Response.json({ error: "Invalid task id." }, { status: 400 });

  const task = await getTaskBoardTaskById(taskId);
  if (!task) return Response.json({ error: "Task not found." }, { status: 404 });

  const resourcesByTask = await getResourcesByTaskIds([taskId]);
  return Response.json({ task, resources: resourcesByTask[taskId] ?? [] });
}

// Edit a task in place. Body shape is identical to POST /tasks (the admin
// form sends its full current state either way) -- this is a full replace
// of every editable field, not a partial merge. order_index and is_active
// aren't in that list because neither has any UI in the create/edit form
// today; this endpoint leaves both untouched.
export async function PATCH(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { taskId } = await params;
  if (!UUID_RE.test(taskId)) return Response.json({ error: "Invalid task id." }, { status: 400 });

  const existingTask = await getTaskBoardTaskById(taskId);
  if (!existingTask) return Response.json({ error: "Task not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.title !== "string" || !body.title.trim()) {
    return Response.json({ error: "Title is required." }, { status: 400 });
  }

  const requiresLink = body.requiresLink === true;
  const requiresPdf = body.requiresPdf === true;
  const requiresImage = body.requiresImage === true;
  const requiresVideo = body.requiresVideo === true;
  const requiresFile = body.requiresFile === true;
  if (!requiresLink && !requiresPdf && !requiresImage && !requiresVideo && !requiresFile) {
    return Response.json(
      { error: "At least one submission type (Link, PDF, Image, Video, or File) must be required." },
      { status: 400 },
    );
  }
  const submissionLinkLabel =
    typeof body.submissionLinkLabel === "string" && body.submissionLinkLabel.trim() ? body.submissionLinkLabel.trim() : null;
  const submissionPdfLabel =
    typeof body.submissionPdfLabel === "string" && body.submissionPdfLabel.trim() ? body.submissionPdfLabel.trim() : null;
  const submissionImageLabel =
    typeof body.submissionImageLabel === "string" && body.submissionImageLabel.trim() ? body.submissionImageLabel.trim() : null;
  const submissionVideoLabel =
    typeof body.submissionVideoLabel === "string" && body.submissionVideoLabel.trim() ? body.submissionVideoLabel.trim() : null;
  const submissionFileLabel =
    typeof body.submissionFileLabel === "string" && body.submissionFileLabel.trim() ? body.submissionFileLabel.trim() : null;
  const submissionCodePlaceholder =
    typeof body.submissionCodePlaceholder === "string" && body.submissionCodePlaceholder.trim()
      ? body.submissionCodePlaceholder.trim()
      : null;

  const completedColorBaseResult = parseHexColor(body.completedColorBase, "Base completed color");
  if ("error" in completedColorBaseResult) return Response.json({ error: completedColorBaseResult.error }, { status: 400 });
  const completedColorMediumResult = parseHexColor(body.completedColorMedium, "Medium completed color");
  if ("error" in completedColorMediumResult) return Response.json({ error: completedColorMediumResult.error }, { status: 400 });

  const startAtResult = parseDate(body.startAt, "start date");
  if ("error" in startAtResult) return Response.json({ error: startAtResult.error }, { status: 400 });
  const endAtResult = parseDate(body.endAt, "end date");
  if ("error" in endAtResult) return Response.json({ error: endAtResult.error }, { status: 400 });
  const startAt = startAtResult.value;
  const endAt = endAtResult.value;

  if (startAt && endAt && new Date(startAt).getTime() > new Date(endAt).getTime()) {
    return Response.json({ error: "Start date must be before end date." }, { status: 400 });
  }

  const requiresCode = body.requiresCode === true;
  const requiresScreenshots = body.requiresScreenshots === true;

  const levelsInput = (body.levels ?? {}) as Record<string, unknown>;
  const parsedLevels: Record<LevelKey, ParsedLevel> = {} as Record<LevelKey, ParsedLevel>;
  for (const key of LEVEL_KEYS) {
    const result = parseLevel(levelsInput[key]);
    if ("error" in result) {
      return Response.json({ error: `${key.charAt(0).toUpperCase()}${key.slice(1)} level: ${result.error}.` }, { status: 400 });
    }
    parsedLevels[key] = result;
  }

  const anyEnabled = LEVEL_KEYS.some((key) => parsedLevels[key].enabled);
  if (!anyEnabled) {
    return Response.json({ error: "At least one level (Base, Medium, or Hard) must be enabled." }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Block removing a level (points_<key> -> null) that already has approved
  // submissions against it. points_awarded on an already-approved row is
  // frozen at approval time (app/api/admin/task-board/submissions/[id]/route.ts
  // writes it directly and never recomputes it from the task), so this
  // isn't protecting against data corruption -- it's protecting against a
  // dead end: that same route's regrade path calls taskOffersLevel() against
  // the LIVE task row, so a removed level would permanently block
  // re-approving/regrading a submission that was legitimately approved at
  // that level before the edit.
  const pointsBeforeByLevel: Record<LevelKey, number | null> = {
    base: existingTask.points_base,
    medium: existingTask.points_medium,
    hard: existingTask.points_hard,
  };
  const violations: string[] = [];
  for (const key of LEVEL_KEYS) {
    const wasEnabled = pointsBeforeByLevel[key] !== null;
    const willBeEnabled = parsedLevels[key].enabled;
    if (!wasEnabled || willBeEnabled) continue;

    const { count } = await supabase
      .from("task_board_submissions")
      .select("id", { count: "exact", head: true })
      .eq("task_id", taskId)
      .eq("level", key)
      .eq("status", "approved");

    if (count && count > 0) {
      violations.push(`${key.charAt(0).toUpperCase()}${key.slice(1)} (${count} approved submission${count === 1 ? "" : "s"})`);
    }
  }
  if (violations.length > 0) {
    return Response.json(
      { error: `Can't remove ${violations.join(", ")} -- already has approved submissions.` },
      { status: 400 },
    );
  }

  const resourcesInput = Array.isArray(body.resources) ? body.resources : [];
  const parsedResources: ParsedResource[] = [];
  for (let i = 0; i < resourcesInput.length; i++) {
    const result = parseResource(resourcesInput[i], i);
    if ("error" in result) return Response.json({ error: result.error }, { status: 400 });
    parsedResources.push(result);
  }

  const { data: updated, error } = await supabase
    .from("task_board_tasks")
    .update({
      title: body.title.trim(),
      description: typeof body.description === "string" && body.description.trim() ? body.description.trim() : null,
      start_at: startAt,
      end_at: endAt,
      requires_link: requiresLink,
      requires_pdf: requiresPdf,
      requires_image: requiresImage,
      requires_video: requiresVideo,
      requires_file: requiresFile,
      submission_link_label: submissionLinkLabel,
      submission_pdf_label: submissionPdfLabel,
      submission_image_label: submissionImageLabel,
      submission_video_label: submissionVideoLabel,
      submission_file_label: submissionFileLabel,
      requires_code: requiresCode,
      submission_code_placeholder: submissionCodePlaceholder,
      requires_screenshots: requiresScreenshots,
      points_base: parsedLevels.base.points,
      points_medium: parsedLevels.medium.points,
      points_hard: parsedLevels.hard.points,
      description_base: parsedLevels.base.description,
      description_medium: parsedLevels.medium.description,
      description_hard: parsedLevels.hard.description,
      checklist_base: parsedLevels.base.checklist,
      checklist_medium: parsedLevels.medium.checklist,
      checklist_hard: parsedLevels.hard.checklist,
      completed_color_base: parsedLevels.base.enabled ? (completedColorBaseResult.value ?? DEFAULT_COMPLETED_COLOR_BASE) : null,
      completed_color_medium: parsedLevels.medium.enabled
        ? (completedColorMediumResult.value ?? DEFAULT_COMPLETED_COLOR_MEDIUM)
        : null,
    })
    .eq("id", taskId)
    .select()
    .single();

  if (error || !updated) return Response.json({ error: "Could not save task." }, { status: 500 });

  // Resources: delete-all-and-reinsert, matching the screenshot
  // delete-then-replace precedent in
  // app/api/task-board/tasks/[taskId]/submission/route.ts -- no per-row
  // add/remove/reorder tracking, since resources have no live submission
  // data referencing them (confirmed zero rows exist before this feature
  // shipped). Old image/pdf storage objects that don't appear in the new
  // set are removed too, reversing the stored public URL back to an object
  // path the same way app/api/admin/session-resources/[id]/route.ts's
  // DELETE handler already does for session resources.
  const { data: oldResources } = await supabase
    .from("task_board_task_resources")
    .select("url, type")
    .eq("task_id", taskId);

  await supabase.from("task_board_task_resources").delete().eq("task_id", taskId);

  let resourcesError: string | null = null;
  if (parsedResources.length > 0) {
    const { error: insertError } = await supabase.from("task_board_task_resources").insert(
      parsedResources.map((r, i) => ({
        task_id: taskId,
        type: r.type,
        label: r.label,
        scope: r.scope,
        levels: r.levels,
        url: r.url,
        code_content: r.code_content,
        code_language: r.code_language,
        sort_order: i,
      })),
    );
    // The task row itself already saved successfully; only the resources
    // failed to reattach. Surfaced as a warning alongside the saved task
    // rather than a hard failure -- same partial-failure handling POST
    // uses, and there's nothing to roll back to here either (the old
    // resource rows are already gone).
    if (insertError) resourcesError = "Task saved, but resources could not be saved.";
  }

  const newImageOrPdfUrls = new Set(
    parsedResources.filter((r) => r.type === "image" || r.type === "pdf").map((r) => r.url),
  );
  const orphanedPaths = (oldResources ?? [])
    .filter((r) => (r.type === "image" || r.type === "pdf") && r.url && !newImageOrPdfUrls.has(r.url))
    .map((r) => {
      const idx = r.url!.indexOf(RESOURCE_PUBLIC_PREFIX);
      return idx === -1 ? null : decodeURIComponent(r.url!.slice(idx + RESOURCE_PUBLIC_PREFIX.length));
    })
    .filter((path): path is string => path !== null);
  if (orphanedPaths.length > 0) {
    await supabase.storage.from(RESOURCE_BUCKET).remove(orphanedPaths);
  }

  return Response.json(resourcesError ? { task: updated, resourcesError } : { task: updated });
}

// Deletes a task entirely. task_board_submissions/task_board_task_resources
// both cascade off task_board_tasks (20260911_create_task_board.sql,
// 20260914_task_board_task_resources.sql), so those DB rows clean
// themselves up. What doesn't clean itself up: Storage (cascading a DB row
// never touches Storage -- both this task's resource files and every
// student's submission files/screenshots would otherwise be orphaned
// forever) and points_ledger (source_id is a bare uuid with no FK at all,
// by design -- see 20260905_points_ledger.sql -- so a submission's awarded
// points survive its own deletion unless explicitly removed below). Both
// are gathered *before* the task delete, since the cascade removes the
// rows that name them.
export async function DELETE(request: Request, { params }: { params: Promise<{ taskId: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { taskId } = await params;
  if (!UUID_RE.test(taskId)) return Response.json({ error: "Invalid task id." }, { status: 400 });

  const existingTask = await getTaskBoardTaskById(taskId);
  if (!existingTask) return Response.json({ error: "Task not found." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const removePoints = Boolean(body && typeof body === "object" && (body as Record<string, unknown>).removePoints === true);

  const supabase = createAdminClient();

  // Every step below is best-effort cleanup, not a precondition for the
  // task delete at the bottom -- none of it is allowed to block or abort
  // the actual delete (a transient storage/network hiccup here shouldn't
  // leave an admin unable to delete a task at all). Each failure is logged
  // instead, so a partial cleanup is a visible, diagnosable event (check
  // `docker logs` for "[task-board]") rather than silently-lost state.
  const { data: submissions, error: submissionsError } = await supabase
    .from("task_board_submissions")
    .select("id, status, submission_file_path, submission_pdf_path, submission_image_path, submission_video_path")
    .eq("task_id", taskId);
  if (submissionsError) {
    // The most consequential of these failures -- both the points and
    // storage cleanup below depend on this list, so a failure here skips
    // both entirely (they safely no-op on an empty list either way).
    console.error("[task-board] Could not list submissions before task delete, skipping points/storage cleanup", {
      taskId,
      message: submissionsError.message,
    });
  }

  const submissionIds = (submissions ?? []).map((s) => s.id);

  // Only status = 'approved' submissions can have a live points_ledger row
  // right now -- revoke_task_board_points_on_status_change()
  // (20260913_task_board_revoke_points_on_status_change.sql) deletes it the
  // instant a submission leaves 'approved' for any reason, and
  // award_task_board_points() only ever (re-)inserts it on a transition
  // INTO 'approved'. So this filter is exact, not an approximation.
  if (removePoints) {
    const approvedSubmissionIds = (submissions ?? []).filter((s) => s.status === "approved").map((s) => s.id);
    if (approvedSubmissionIds.length > 0) {
      const { error: pointsError } = await supabase
        .from("points_ledger")
        .delete()
        .eq("source_type", "task_board")
        .in("source_id", approvedSubmissionIds);
      if (pointsError) {
        console.error("[task-board] Could not remove points_ledger rows for deleted task", {
          taskId,
          message: pointsError.message,
        });
      }
    }
  }

  if (submissionIds.length > 0) {
    const { data: screenshotFiles, error: screenshotFilesError } = await supabase
      .from("task_board_submission_files")
      .select("file_path")
      .in("submission_id", submissionIds);
    if (screenshotFilesError) {
      console.error("[task-board] Could not list screenshot files for deleted task, some may be orphaned in storage", {
        taskId,
        message: screenshotFilesError.message,
      });
    }

    const primaryPaths = (submissions ?? [])
      .flatMap((s) => [s.submission_file_path, s.submission_pdf_path, s.submission_image_path, s.submission_video_path])
      .filter((p): p is string => Boolean(p));
    const screenshotPaths = (screenshotFiles ?? []).map((f) => f.file_path).filter((p): p is string => Boolean(p));

    const submissionPaths = [...primaryPaths, ...screenshotPaths];
    if (submissionPaths.length > 0) {
      const { error: submissionStorageError } = await supabase.storage.from(SUBMISSION_BUCKET).remove(submissionPaths);
      if (submissionStorageError) {
        console.error("[task-board] Could not remove submission files from storage for deleted task", {
          taskId,
          message: submissionStorageError.message,
        });
      }
    }
  }

  const { data: resources, error: resourcesError } = await supabase
    .from("task_board_task_resources")
    .select("url, type")
    .eq("task_id", taskId);
  if (resourcesError) {
    console.error("[task-board] Could not list resources for deleted task, some may be orphaned in storage", {
      taskId,
      message: resourcesError.message,
    });
  }
  const resourcePaths = (resources ?? [])
    .filter((r) => (r.type === "image" || r.type === "pdf") && r.url)
    .map((r) => {
      const idx = r.url!.indexOf(RESOURCE_PUBLIC_PREFIX);
      return idx === -1 ? null : decodeURIComponent(r.url!.slice(idx + RESOURCE_PUBLIC_PREFIX.length));
    })
    .filter((path): path is string => path !== null);
  if (resourcePaths.length > 0) {
    const { error: resourceStorageError } = await supabase.storage.from(RESOURCE_BUCKET).remove(resourcePaths);
    if (resourceStorageError) {
      console.error("[task-board] Could not remove resource files from storage for deleted task", {
        taskId,
        message: resourceStorageError.message,
      });
    }
  }

  // The one step that's actually load-bearing: if this fails, nothing was
  // deleted, and the route reports it rather than claiming success.
  const { error } = await supabase.from("task_board_tasks").delete().eq("id", taskId);
  if (error) return Response.json({ error: "Could not delete task." }, { status: 500 });

  return Response.json({ ok: true });
}
