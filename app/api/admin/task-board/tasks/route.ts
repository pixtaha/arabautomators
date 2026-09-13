import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ALLOWED_CODE_LANGUAGES } from "@/lib/taskBoardConstants";

const LEVEL_KEYS = ["base", "medium", "hard"] as const;
type LevelKey = (typeof LEVEL_KEYS)[number];
const RESOURCE_TYPES = ["image", "video", "pdf", "code"] as const;
type ResourceType = (typeof RESOURCE_TYPES)[number];
const RESOURCE_SCOPES = ["general", "levels"] as const;

interface ParsedResource {
  type: ResourceType;
  label: string | null;
  scope: "general" | "levels";
  levels: LevelKey[] | null;
  url: string | null;
  code_content: string | null;
  code_language: string | null;
}

// Mirrors the CHECK constraints on task_board_task_resources (scope/levels
// agreement, content matching type) so a misconfigured resource gets a
// clear field-level message instead of a raw constraint-violation 500.
function parseResource(input: unknown, index: number): ParsedResource | { error: string } {
  const r = (input ?? {}) as Record<string, unknown>;
  const label = typeof r.label === "string" && r.label.trim() ? r.label.trim() : null;

  if (typeof r.type !== "string" || !(RESOURCE_TYPES as readonly string[]).includes(r.type)) {
    return { error: `Resource ${index + 1}: invalid type.` };
  }
  const type = r.type as ResourceType;

  if (typeof r.scope !== "string" || !(RESOURCE_SCOPES as readonly string[]).includes(r.scope)) {
    return { error: `Resource ${index + 1}: choose a scope (General or Specific levels).` };
  }
  const scope = r.scope as "general" | "levels";

  let levels: LevelKey[] | null = null;
  if (scope === "levels") {
    const raw = Array.isArray(r.levels) ? r.levels : [];
    const filtered = raw.filter((l): l is LevelKey => typeof l === "string" && (LEVEL_KEYS as readonly string[]).includes(l));
    if (filtered.length === 0) {
      return { error: `Resource ${index + 1}: pick at least one level.` };
    }
    levels = filtered;
  }

  if (type === "code") {
    if (typeof r.codeContent !== "string" || !r.codeContent.trim()) {
      return { error: `Resource ${index + 1}: code content is required.` };
    }
    const codeLanguage =
      typeof r.codeLanguage === "string" && (ALLOWED_CODE_LANGUAGES as readonly string[]).includes(r.codeLanguage)
        ? r.codeLanguage
        : ALLOWED_CODE_LANGUAGES[0];
    return { type, label, scope, levels, url: null, code_content: r.codeContent.trim().slice(0, 20_000), code_language: codeLanguage };
  }

  if (typeof r.url !== "string" || !r.url.trim()) {
    return { error: `Resource ${index + 1}: a ${type} URL is required.` };
  }
  try {
    new URL(r.url.trim());
  } catch {
    return { error: `Resource ${index + 1}: enter a valid URL.` };
  }
  return { type, label, scope, levels, url: r.url.trim(), code_content: null, code_language: null };
}

interface ParsedLevel {
  enabled: boolean;
  points: number | null;
  description: string | null;
  checklist: string[] | null;
}

function parseLevel(input: unknown): ParsedLevel | { error: string } {
  const level = (input ?? {}) as Record<string, unknown>;
  if (!level.enabled) {
    return { enabled: false, points: null, description: null, checklist: null };
  }
  if (typeof level.points !== "number" || !Number.isInteger(level.points) || level.points < 0) {
    return { error: "points must be a non-negative whole number" };
  }
  const description = typeof level.description === "string" && level.description.trim() ? level.description.trim() : null;
  const checklist = Array.isArray(level.checklist)
    ? level.checklist.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim())
    : [];
  return { enabled: true, points: level.points, description, checklist: checklist.length > 0 ? checklist : null };
}

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
  if (taskIds.length > 0) {
    const { data: pendingRows } = await supabase
      .from("task_board_submissions")
      .select("task_id")
      .in("task_id", taskIds)
      .in("status", ["submitted", "reviewing"]);
    for (const row of pendingRows ?? []) {
      pendingCountByTaskId.set(row.task_id, (pendingCountByTaskId.get(row.task_id) ?? 0) + 1);
    }
  }

  const result = tasks.map((t) => ({ ...t, pending_count: pendingCountByTaskId.get(t.id) ?? 0 }));
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

  // The client sends a full ISO instant here (already anchored to Cairo
  // local time via cairoDateStringToUtcInstant() in
  // CreateTaskBoardTaskForm.tsx), not a bare "YYYY-MM-DD" -- so this is
  // just validating/normalizing an unambiguous timestamp, not doing any
  // timezone conversion of its own.
  function parseDate(input: unknown, label: string): { value: string | null } | { error: string } {
    if (typeof input !== "string" || !input.trim()) return { value: null };
    const parsed = new Date(input);
    if (Number.isNaN(parsed.getTime())) return { error: `Invalid ${label}.` };
    return { value: parsed.toISOString() };
  }

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
      requires_code: requiresCode,
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
