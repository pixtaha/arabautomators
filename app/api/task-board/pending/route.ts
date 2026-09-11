import { getActiveDeviceSession } from "@/lib/auth/device-session";
import { createAdminClient } from "@/lib/supabase/admin";

// Powers the red notification dot on the header's "My Tasks" link.
// Deliberately narrow selects (id / task_id+status only), not the full
// TASK_COLUMNS/SUBMISSION_COLUMNS from lib/data/taskBoard.ts -- this fires
// on every dashboard-area page load just to decide whether to show a dot,
// not to render the board itself.
export async function GET() {
  const session = await getActiveDeviceSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();

  // Per-student concern only -- an admin account (e.g. the instructor's
  // own "student" row) never shows this dot, matching the same
  // admin-exclusion convention as getTaskCompletions()/leaderboard routes.
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
  if (profile?.role === "admin") {
    return Response.json({ hasPending: false }, { headers: { "Cache-Control": "private, no-store" } });
  }

  const [{ data: tasks }, { data: submissions }] = await Promise.all([
    supabase.from("task_board_tasks").select("id").eq("is_active", true),
    supabase.from("task_board_submissions").select("task_id, status").eq("student_id", session.user.id),
  ]);

  const statusByTaskId = new Map((submissions ?? []).map((s) => [s.task_id, s.status]));
  // No submission row for a task means it's implicitly 'todo' -- also
  // counts as "not approved" for this check.
  const hasPending = (tasks ?? []).some((t) => (statusByTaskId.get(t.id) ?? "todo") !== "approved");

  return Response.json({ hasPending }, { headers: { "Cache-Control": "private, no-store" } });
}
