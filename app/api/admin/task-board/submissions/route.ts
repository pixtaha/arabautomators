import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_STATUSES = ["todo", "progress", "submitted", "reviewing", "approved"] as const;

// No FK from task_board_submissions to task_board_tasks/profiles that
// PostgREST can embed cleanly across two independent bulk lookups, so the
// join happens in JS from bulk IN() queries -- same approach
// app/api/admin/task-reviews/route.ts already uses.
export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

  const statusParam = new URL(request.url).searchParams.get("status");
  const supabase = createAdminClient();

  let query = supabase
    .from("task_board_submissions")
    .select(
      "id, task_id, student_id, status, level, bonus_points, submission_link, submission_file_path, submission_file_name, submission_file_size_bytes, submission_note, admin_note, points_awarded, submitted_at, reviewed_at, reviewed_by, created_at, updated_at",
    )
    .order("submitted_at", { ascending: true });

  // Default view: everything actually awaiting a decision. Any other
  // single status (most usefully 'approved', for the Reopen section) can
  // be requested explicitly.
  if (statusParam && (VALID_STATUSES as readonly string[]).includes(statusParam)) {
    query = query.eq("status", statusParam);
  } else {
    query = query.in("status", ["submitted", "reviewing"]);
  }

  const { data: rows, error } = await query;
  if (error) return Response.json({ error: "Could not load submissions." }, { status: 500 });
  if (!rows || rows.length === 0) return Response.json({ submissions: [] });

  const taskIds = [...new Set(rows.map((r) => r.task_id))];
  const studentIds = [...new Set(rows.map((r) => r.student_id))];

  const [{ data: tasks }, { data: profiles }] = await Promise.all([
    supabase
      .from("task_board_tasks")
      .select("id, title, submission_format, points_base, points_medium, points_hard")
      .in("id", taskIds),
    supabase.from("profiles").select("id, username, avatar_url").in("id", studentIds),
  ]);

  const taskById = new Map((tasks ?? []).map((t) => [t.id, t]));
  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));

  const submissions = rows.map((row) => {
    const task = taskById.get(row.task_id);
    const profile = profileById.get(row.student_id);
    return {
      ...row,
      task_title: task?.title ?? "Task",
      task_submission_format: task?.submission_format ?? "file",
      task_points_base: task?.points_base ?? null,
      task_points_medium: task?.points_medium ?? null,
      task_points_hard: task?.points_hard ?? null,
      student_username: (profile?.username as string | null) ?? null,
      student_avatar_url: (profile?.avatar_url as string | null) ?? null,
    };
  });

  return Response.json({ submissions });
}
