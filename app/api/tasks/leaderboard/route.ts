import { getActiveDeviceSession } from "@/lib/auth/device-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRangeStart, POINTS_RANGES, type PointsRange } from "@/lib/time";

const MAX_ROWS = 20;

// Same shape as /api/points/leaderboard, but ranks by number of completed
// tasks rather than points. Sourced from points_ledger (source_type =
// 'task') rather than student_task_status directly: points_ledger only
// ever gets one row per student per task, written once by
// award_task_points() the moment a task first reaches 'done' (whether
// immediately or after admin approval of a reviewed task) -- so counting
// its rows is a stable, append-only completion count with created_at
// already available for the day/week/month filters, instead of needing to
// re-derive "first completion time" from a status column that can also
// hold transient 'ready' / 'problem' / 'pending_review' values.
export async function GET(request: Request) {
  const session = await getActiveDeviceSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const rangeParam = new URL(request.url).searchParams.get("range") ?? "all";
  const range: PointsRange = (POINTS_RANGES as string[]).includes(rangeParam) ? (rangeParam as PointsRange) : "all";
  const start = getRangeStart(range);

  const supabase = createAdminClient();
  let query = supabase.from("points_ledger").select("student_id").eq("source_type", "task");
  if (start) query = query.gte("created_at", start.toISOString());

  const { data: rows, error } = await query;
  if (error) return Response.json({ error: "Could not load leaderboard." }, { status: 500 });

  const totals = new Map<string, number>();
  for (const row of rows ?? []) {
    totals.set(row.student_id, (totals.get(row.student_id) ?? 0) + 1);
  }

  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_ROWS);

  const studentIds = ranked.map(([id]) => id);
  const { data: profiles } = studentIds.length
    ? await supabase.from("profiles").select("id, username").in("id", studentIds)
    : { data: [] };
  const usernameById = new Map((profiles ?? []).map((p) => [p.id, p.username as string | null]));

  const board = ranked.map(([studentId, tasksCompleted], index) => ({
    rank: index + 1,
    name: usernameById.get(studentId) ?? "Student",
    tasksCompleted,
    isMe: studentId === session.user.id,
  }));

  return Response.json({ board, range });
}
