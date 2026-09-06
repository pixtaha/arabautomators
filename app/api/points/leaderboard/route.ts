import { getActiveDeviceSession } from "@/lib/auth/device-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRangeStart, POINTS_RANGES, type PointsRange } from "@/lib/time";

const MAX_ROWS = 20;

// points_ledger RLS only lets a student read their own rows, so a
// cross-student leaderboard can't be built from the browser client -- same
// reasoning as the quiz leaderboard route. Aggregation happens in JS rather
// than a SQL group-by since supabase-js has no query builder for it and this
// cohort's row count doesn't warrant a database function.
export async function GET(request: Request) {
  const session = await getActiveDeviceSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const rangeParam = new URL(request.url).searchParams.get("range") ?? "all";
  const range: PointsRange = (POINTS_RANGES as string[]).includes(rangeParam) ? (rangeParam as PointsRange) : "all";
  const start = getRangeStart(range);

  const supabase = createAdminClient();
  let query = supabase.from("points_ledger").select("student_id, points");
  if (start) query = query.gte("created_at", start.toISOString());

  const { data: rows, error } = await query;
  if (error) return Response.json({ error: "Could not load leaderboard." }, { status: 500 });

  const totals = new Map<string, number>();
  for (const row of rows ?? []) {
    totals.set(row.student_id, (totals.get(row.student_id) ?? 0) + row.points);
  }

  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_ROWS);

  const studentIds = ranked.map(([id]) => id);
  const { data: profiles } = studentIds.length
    ? await supabase.from("profiles").select("id, username").in("id", studentIds)
    : { data: [] };
  const usernameById = new Map((profiles ?? []).map((p) => [p.id, p.username as string | null]));

  const board = ranked.map(([studentId, total], index) => ({
    rank: index + 1,
    name: usernameById.get(studentId) ?? "Student",
    points: total,
    isMe: studentId === session.user.id,
  }));

  return Response.json({ board, range });
}
