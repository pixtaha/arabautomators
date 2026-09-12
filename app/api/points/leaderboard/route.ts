import { getActiveDeviceSession } from "@/lib/auth/device-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { getRangeStart, POINTS_RANGES, type PointsRange } from "@/lib/time";

const MAX_ROWS = 20;

// points_ledger RLS only lets a student read their own rows, so a
// cross-student leaderboard can't be built from the browser client -- same
// reasoning as the quiz leaderboard route. Aggregation happens in JS rather
// than a SQL group-by since supabase-js has no query builder for it and this
// cohort's row count doesn't warrant a database function.
//
// Intentionally public: this route already runs server-side with the
// service-role client (createAdminClient(), below), which bypasses
// points_ledger's RLS regardless of who's asking -- exactly like
// /api/tasks/leaderboard, which never gates on a session either. The
// session is only used to compute `isMe`/`myRank`/`myPoints` for whichever
// visitor is logged in; a logged-out visitor just gets those as
// false/null/0. Do not reintroduce a `if (!session) return 401` here -- that
// previously made the "Overall" tab blank for anonymous visitors on the
// public leaderboard page while "Tasks only" (same page) worked fine.
export async function GET(request: Request) {
  const session = await getActiveDeviceSession();

  const rangeParam = new URL(request.url).searchParams.get("range") ?? "all";
  const range: PointsRange = (POINTS_RANGES as string[]).includes(rangeParam) ? (rangeParam as PointsRange) : "all";
  const start = getRangeStart(range);

  const supabase = createAdminClient();

  // Team members (admins) shouldn't appear on the student-facing leaderboard.
  const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
  const adminIds = new Set((admins ?? []).map((a) => a.id));

  let query = supabase.from("points_ledger").select("student_id, points");
  if (start) query = query.gte("created_at", start.toISOString());

  const { data: rows, error } = await query;
  if (error) return Response.json({ error: "Could not load leaderboard." }, { status: 500 });

  const totals = new Map<string, number>();
  for (const row of rows ?? []) {
    if (adminIds.has(row.student_id)) continue;
    totals.set(row.student_id, (totals.get(row.student_id) ?? 0) + row.points);
  }

  const fullyRanked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  const ranked = fullyRanked.slice(0, MAX_ROWS);

  // Kept alongside the top-20 `board` so a caller like /profile can show a
  // student's own rank even when they've fallen outside it, without a
  // second full aggregation pass.
  const myIndex = session ? fullyRanked.findIndex(([id]) => id === session.user.id) : -1;
  const myRank = myIndex === -1 ? null : myIndex + 1;
  const myPoints = session ? (totals.get(session.user.id) ?? 0) : 0;

  const studentIds = ranked.map(([id]) => id);
  const { data: profiles } = studentIds.length
    ? await supabase.from("profiles").select("id, username, avatar_url").in("id", studentIds)
    : { data: [] };
  const usernameById = new Map((profiles ?? []).map((p) => [p.id, p.username as string | null]));
  const avatarUrlById = new Map((profiles ?? []).map((p) => [p.id, p.avatar_url as string | null]));

  const board = ranked.map(([studentId, total], index) => ({
    rank: index + 1,
    name: usernameById.get(studentId) ?? "Student",
    avatarUrl: avatarUrlById.get(studentId) ?? null,
    points: total,
    isMe: studentId === session?.user.id,
  }));

  return Response.json({ board, range, myRank, myPoints, totalRanked: fullyRanked.length });
}
