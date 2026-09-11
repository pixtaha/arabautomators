import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

const SUBMISSION_FORMATS = ["link", "pdf", "image", "video", "file"] as const;
const LEVEL_KEYS = ["base", "medium", "hard"] as const;
type LevelKey = (typeof LEVEL_KEYS)[number];

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
  if (typeof body.submissionFormat !== "string" || !(SUBMISSION_FORMATS as readonly string[]).includes(body.submissionFormat)) {
    return Response.json({ error: "Invalid submission format." }, { status: 400 });
  }

  let dueAt: string | null = null;
  if (typeof body.dueAt === "string" && body.dueAt.trim()) {
    const parsed = new Date(body.dueAt);
    if (Number.isNaN(parsed.getTime())) {
      return Response.json({ error: "Invalid due date." }, { status: 400 });
    }
    dueAt = parsed.toISOString();
  }

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
      due_at: dueAt,
      submission_format: body.submissionFormat,
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
  return Response.json({ task: inserted });
}
