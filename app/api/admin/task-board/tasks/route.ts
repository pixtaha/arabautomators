import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
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

const TASK_LIST_COLUMNS =
  "id, title, order_index, points_base, points_medium, points_hard, requires_link, requires_pdf, requires_image, requires_video, requires_file, requires_code, requires_screenshots, start_at, end_at, is_active";

// Powers the Manage Tasks page's persistent task list -- every task
// (not just is_active ones, since there's no archive/deactivate UI
// anywhere yet), plus a pending-submission count per task. The count is
// computed in JS from one bulk select rather than a SQL group-by, matching
// this codebase's existing convention (see getTaskCompletions() in
// lib/data/taskBoard.ts) of doing joins/aggregation in application code
// since there's no generated-types setup for raw SQL here.
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();
  const { data: tasks, error } = await supabase.from("task_board_tasks").select(TASK_LIST_COLUMNS).order("order_index");

  if (error || !tasks) return Response.json({ error: "Could not load tasks." }, { status: 500 });

  const taskIds = tasks.map((t) => t.id);
  const pendingCountByTaskId = new Map<string, number>();
  // submission_count/approved_count power the Delete button's confirmation
  // (see the DELETE handler in [taskId]/route.ts): no submissions, has
  // submissions but nothing approved, or has submissions with live points.
  // approved_count doubles as "how many currently have a live points_ledger
  // row" -- revoke_task_board_points_on_status_change()
  // (20260913_task_board_revoke_points_on_status_change.sql) guarantees a
  // submission has one iff its status is currently 'approved'.
  const submissionCountByTaskId = new Map<string, number>();
  const approvedCountByTaskId = new Map<string, number>();
  if (taskIds.length > 0) {
    const { data: submissionRows } = await supabase
      .from("task_board_submissions")
      .select("task_id, status")
      .in("task_id", taskIds);
    for (const row of submissionRows ?? []) {
      submissionCountByTaskId.set(row.task_id, (submissionCountByTaskId.get(row.task_id) ?? 0) + 1);
      if (row.status === "submitted" || row.status === "reviewing") {
        pendingCountByTaskId.set(row.task_id, (pendingCountByTaskId.get(row.task_id) ?? 0) + 1);
      }
      if (row.status === "approved") {
        approvedCountByTaskId.set(row.task_id, (approvedCountByTaskId.get(row.task_id) ?? 0) + 1);
      }
    }
  }

  const result = tasks.map((t) => ({
    ...t,
    pending_count: pendingCountByTaskId.get(t.id) ?? 0,
    submission_count: submissionCountByTaskId.get(t.id) ?? 0,
    approved_count: approvedCountByTaskId.get(t.id) ?? 0,
  }));
  return Response.json({ tasks: result });
}

// Validates the same constraints the DB enforces (submission_format enum,
// task_board_tasks_has_a_level -- at least one of points_base/medium/hard
// set) before ever hitting the database, so a misconfigured create gets a
// clear field-level message instead of a raw constraint-violation 400.
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

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

  const resourcesInput = Array.isArray(body.resources) ? body.resources : [];
  const parsedResources: ParsedResource[] = [];
  for (let i = 0; i < resourcesInput.length; i++) {
    const result = parseResource(resourcesInput[i], i);
    if ("error" in result) return Response.json({ error: result.error }, { status: 400 });
    parsedResources.push(result);
  }

  const supabase = createAdminClient();

  const { data: last } = await supabase
    .from("task_board_tasks")
    .select("order_index")
    .order("order_index", { ascending: false })
    .limit(1);
  const nextOrderIndex = (last?.[0]?.order_index ?? -1) + 1;

  const { data: inserted, error } = await supabase
    .from("task_board_tasks")
    .insert({
      order_index: nextOrderIndex,
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
    .select()
    .single();

  if (error || !inserted) return Response.json({ error: "Could not create task." }, { status: 500 });

  if (parsedResources.length > 0) {
    const { error: resourcesError } = await supabase.from("task_board_task_resources").insert(
      parsedResources.map((r, i) => ({
        task_id: inserted.id,
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
    // The task itself was created successfully; only the resources
    // failed to attach. Surfaced as a warning alongside the created task
    // rather than a hard failure, since there's no cross-table
    // transaction here to roll the task creation back atomically.
    if (resourcesError) {
      return Response.json({ task: inserted, resourcesError: "Task created, but resources could not be saved." });
    }
  }

  return Response.json({ task: inserted });
}
