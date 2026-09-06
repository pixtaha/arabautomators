import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Approving sets status to 'done' -- the existing award_task_points()
// trigger (points_ledger migration) fires on that transition and pays out
// through points_ledger exactly as it does for a non-reviewed task.
// Rejecting resets to 'ready' so the student sees it's not done and can
// resubmit. The `.eq("status", "pending_review")` guard makes both actions
// a no-op update (no rows affected) if the row was already resolved, so a
// double-click can't double-process it.
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return Response.json({ error: "Invalid review id." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  if (body?.action !== "approve" && body?.action !== "reject") {
    return Response.json({ error: "Invalid action." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("student_task_status")
    .update({
      status: body.action === "approve" ? "done" : "ready",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending_review")
    .select("id");

  if (error) return Response.json({ error: "Could not update review." }, { status: 500 });
  if (!data || data.length === 0) {
    return Response.json({ error: "This review was already resolved." }, { status: 409 });
  }

  return Response.json({ ok: true });
}
