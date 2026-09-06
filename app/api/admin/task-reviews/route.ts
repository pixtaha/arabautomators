import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

// Lists every student_task_status row currently awaiting approval. There's
// no FK from student_task_status to profiles (both reference auth.users
// independently), so the join with task titles and student usernames is
// done in JS from bulk IN() lookups -- same approach as the points
// leaderboard route.
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const supabase = createAdminClient();
  const { data: rows, error } = await supabase
    .from("student_task_status")
    .select("id, task_id, student_id, updated_at")
    .eq("status", "pending_review")
    .order("updated_at", { ascending: true });

  if (error) return Response.json({ error: "Could not load pending reviews." }, { status: 500 });
  if (!rows || rows.length === 0) return Response.json({ reviews: [] });

  const taskIds = [...new Set(rows.map((row) => row.task_id))];
  const studentIds = [...new Set(rows.map((row) => row.student_id))];

  const [{ data: tasks }, { data: profiles }] = await Promise.all([
    supabase.from("tasks").select("id, title, points").in("id", taskIds),
    supabase.from("profiles").select("id, username").in("id", studentIds),
  ]);

  const taskById = new Map((tasks ?? []).map((t) => [t.id, t]));
  const usernameById = new Map((profiles ?? []).map((p) => [p.id, p.username as string | null]));

  const reviews = rows.map((row) => ({
    id: row.id,
    taskTitle: taskById.get(row.task_id)?.title ?? "Task",
    points: taskById.get(row.task_id)?.points ?? 0,
    username: usernameById.get(row.student_id) ?? "Student",
    submittedAt: row.updated_at,
  }));

  return Response.json({ reviews });
}
