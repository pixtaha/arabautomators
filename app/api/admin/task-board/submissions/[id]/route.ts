import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { taskOffersLevel, type TaskBoardLevel } from "@/lib/data/taskBoard";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LEVELS = ["base", "medium", "hard"] as const;
const BONUS_VALUES = [0, 5, 10, 20];

// The one admin write path for a submission. Three actions:
//
// - approve: computes points_awarded here (level preset + bonus, or a
//   pointsOverride) and writes it directly -- award_task_board_points()
//   (the DB trigger) no longer recomputes this itself, it just pushes
//   whatever points_awarded already says into points_ledger. See the
//   20260911_task_board_admin_review.sql migration comment for why.
// - send_back: status -> 'progress' (not 'todo' -- the student was
//   actively working on it) with a REQUIRED admin_note the student board
//   surfaces. Guarded to only fire from 'submitted'/'reviewing' so a
//   double-click can't re-send-back an already-moved-on row.
// - reopen: 'approved' -> 'reviewing' only, guarded atomically the same
//   way. Never touches points_awarded/points_ledger -- matches the
//   established "never claw back" philosophy; only a subsequent
//   re-approval changes the payout.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return Response.json({ error: "Invalid submission id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: submission, error: fetchError } = await supabase
    .from("task_board_submissions")
    .select("id, task_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) return Response.json({ error: "Could not load submission." }, { status: 500 });
  if (!submission) return Response.json({ error: "Submission not found." }, { status: 404 });

  if (body.action === "approve") {
    if (typeof body.level !== "string" || !LEVELS.includes(body.level as (typeof LEVELS)[number])) {
      return Response.json({ error: "Invalid level." }, { status: 400 });
    }
    if (!BONUS_VALUES.includes(body.bonusPoints)) {
      return Response.json({ error: "Invalid bonus points." }, { status: 400 });
    }

    const { data: task } = await supabase
      .from("task_board_tasks")
      .select("title, points_base, points_medium, points_hard")
      .eq("id", submission.task_id)
      .maybeSingle();

    if (!task || !taskOffersLevel(task, body.level)) {
      return Response.json({ error: "This task does not offer that level." }, { status: 400 });
    }

    let pointsAwarded: number;
    if (body.pointsOverride !== undefined && body.pointsOverride !== null) {
      if (!Number.isInteger(body.pointsOverride) || body.pointsOverride < 0) {
        return Response.json({ error: "Points override must be a non-negative whole number." }, { status: 400 });
      }
      pointsAwarded = body.pointsOverride;
    } else {
      const level = body.level as TaskBoardLevel;
      const levelPoints = level === "base" ? task.points_base : level === "medium" ? task.points_medium : task.points_hard;
      pointsAwarded = Math.max(levelPoints ?? 0, 0) + Math.max(body.bonusPoints, 0);
    }

    const { data: updated, error: updateError } = await supabase
      .from("task_board_submissions")
      .update({
        status: "approved",
        level: body.level,
        bonus_points: body.bonusPoints,
        points_awarded: pointsAwarded,
        admin_note: null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: admin.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError || !updated) return Response.json({ error: "Could not approve submission." }, { status: 500 });
    return Response.json({ submission: updated });
  }

  if (body.action === "send_back") {
    if (typeof body.note !== "string" || !body.note.trim()) {
      return Response.json({ error: "A note is required when sending a submission back." }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabase
      .from("task_board_submissions")
      .update({
        status: "progress",
        admin_note: body.note.trim().slice(0, 2000),
        reviewed_at: new Date().toISOString(),
        reviewed_by: admin.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .in("status", ["submitted", "reviewing"])
      .select()
      .maybeSingle();

    if (updateError) return Response.json({ error: "Could not send back submission." }, { status: 500 });
    if (!updated) return Response.json({ error: "This submission is no longer awaiting review." }, { status: 409 });
    return Response.json({ submission: updated });
  }

  if (body.action === "reopen") {
    const { data: updated, error: updateError } = await supabase
      .from("task_board_submissions")
      .update({ status: "reviewing", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "approved")
      .select()
      .maybeSingle();

    if (updateError) return Response.json({ error: "Could not reopen submission." }, { status: 500 });
    if (!updated) return Response.json({ error: "Only an approved submission can be reopened." }, { status: 409 });
    return Response.json({ submission: updated });
  }

  return Response.json({ error: "Invalid action." }, { status: 400 });
}
