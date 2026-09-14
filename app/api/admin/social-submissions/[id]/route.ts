import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The one admin write path for a submission. Two actions:
//
// - approve: the points_ledger row is inserted first, then the submission
//   is flipped to 'approved' behind a `.eq("status", "pending")` guard.
//   If that guarded update loses a race (e.g. a concurrent second
//   approve, or the row got sent back moments earlier) it touches no row,
//   so the just-inserted ledger row is deleted to compensate -- same
//   upload-then-write, delete-on-failure convention as
//   app/api/task-board/tasks/[taskId]/submission/route.ts uses for its
//   storage uploads. The points_ledger_one_award_per_source unique
//   constraint also rejects a duplicate insert outright if one somehow
//   already exists for this submission.
// - send_back: status -> 'sent_back' with a REQUIRED admin_comment the
//   student board surfaces. Guarded to only fire from 'pending' so a
//   double-click can't re-send-back an already-decided row.
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
    .from("social_submissions")
    .select("id, student_id, window_id, status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) return Response.json({ error: "Could not load submission." }, { status: 500 });
  if (!submission) return Response.json({ error: "Submission not found." }, { status: 404 });

  if (body.action === "approve") {
    if (!Number.isInteger(body.points) || body.points < 0) {
      return Response.json({ error: "Points must be a non-negative whole number." }, { status: 400 });
    }
    if (submission.status !== "pending") {
      return Response.json({ error: "This submission is no longer awaiting review." }, { status: 409 });
    }

    const { data: socialWindow } = await supabase
      .from("social_windows")
      .select("title")
      .eq("id", submission.window_id)
      .maybeSingle();

    const { error: ledgerError } = await supabase.from("points_ledger").insert({
      student_id: submission.student_id,
      source_type: "social",
      source_id: submission.id,
      points: body.points,
      reason: `Social post approved${socialWindow?.title ? `: ${socialWindow.title}` : ""}`,
    });

    if (ledgerError) {
      return Response.json({ error: "Could not record points." }, { status: 409 });
    }

    const { data: updated, error: updateError } = await supabase
      .from("social_submissions")
      .update({
        status: "approved",
        points_awarded: body.points,
        admin_comment: null,
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "pending")
      .select()
      .maybeSingle();

    if (updateError || !updated) {
      await supabase.from("points_ledger").delete().eq("source_type", "social").eq("source_id", id);
      return Response.json({ error: "This submission is no longer awaiting review." }, { status: 409 });
    }

    return Response.json({ submission: updated });
  }

  if (body.action === "send_back") {
    if (typeof body.comment !== "string" || !body.comment.trim()) {
      return Response.json({ error: "A comment is required when sending a submission back." }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabase
      .from("social_submissions")
      .update({
        status: "sent_back",
        admin_comment: body.comment.trim().slice(0, 2000),
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "pending")
      .select()
      .maybeSingle();

    if (updateError) return Response.json({ error: "Could not send back submission." }, { status: 500 });
    if (!updated) return Response.json({ error: "This submission is no longer awaiting review." }, { status: 409 });
    return Response.json({ submission: updated });
  }

  return Response.json({ error: "Invalid action." }, { status: 400 });
}
