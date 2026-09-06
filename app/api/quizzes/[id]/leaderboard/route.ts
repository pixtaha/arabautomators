import { getActiveDeviceSession } from "@/lib/auth/device-session";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ROWS = 20;

// quiz_attempts RLS only lets a student read their own row, so a per-quiz
// leaderboard can't be built from the browser client. This route runs with
// the service-role client instead, but only ever returns name + score (no
// raw answers), keeping quiz_attempts itself locked down as specified.
// getActiveDeviceSession (not requireDeviceSession) is used deliberately --
// the latter calls redirect(), which is wrong for a JSON API route.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getActiveDeviceSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id: quizId } = await params;
  if (!UUID_RE.test(quizId)) {
    return Response.json({ error: "Invalid quiz id." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: attempts, error } = await supabase
    .from("quiz_attempts")
    .select("student_id, score")
    .eq("quiz_id", quizId)
    .order("score", { ascending: false })
    .limit(MAX_ROWS);

  if (error) return Response.json({ error: "Could not load leaderboard." }, { status: 500 });

  const studentIds = (attempts ?? []).map((a) => a.student_id);
  const { data: profiles } = studentIds.length
    ? await supabase.from("profiles").select("id, username").in("id", studentIds)
    : { data: [] };

  const usernameById = new Map((profiles ?? []).map((p) => [p.id, p.username as string | null]));

  const board = (attempts ?? []).map((a, index) => ({
    rank: index + 1,
    name: usernameById.get(a.student_id) ?? "Student",
    score: a.score as number,
    isMe: a.student_id === session.user.id,
  }));

  return Response.json({ board });
}
