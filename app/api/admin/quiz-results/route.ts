import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { QuizJson } from "@/lib/quizzes";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SORT_FIELDS = new Set(["createdAt", "avgScore", "attempts", "title"]);
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Every quiz ever created, across all sessions, with aggregate attempt
// stats. Mirrors the leaderboard routes' approach (service-role client,
// aggregate/sort/paginate in JS) rather than adding a DB view -- the
// codebase has no aggregate-SQL precedent anywhere else.
export async function GET(request: Request) {
  const user = await requireAdmin();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  if (sessionId && !UUID_RE.test(sessionId)) {
    return Response.json({ error: "Invalid session id." }, { status: 400 });
  }

  const sortByParam = url.searchParams.get("sortBy") ?? "createdAt";
  const sortBy = SORT_FIELDS.has(sortByParam) ? sortByParam : "createdAt";
  const sortDir = url.searchParams.get("sortDir") === "asc" ? "asc" : "desc";

  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(url.searchParams.get("limit")) || DEFAULT_LIMIT));

  const supabase = createAdminClient();

  let quizzesQuery = supabase
    .from("quizzes")
    .select("id, session_id, quiz_json, is_live, created_at")
    .order("created_at", { ascending: false });
  if (sessionId) quizzesQuery = quizzesQuery.eq("session_id", sessionId);

  const [{ data: quizzes, error: quizzesError }, { data: sessions }, { data: modules }] = await Promise.all([
    quizzesQuery,
    supabase.from("sessions").select("id, title, order_index, module_id"),
    supabase.from("modules").select("id, order_index"),
  ]);

  if (quizzesError || !quizzes) {
    return Response.json({ error: "Could not load quizzes." }, { status: 500 });
  }

  const quizIds = quizzes.map((q) => q.id as string);
  const { data: attempts, error: attemptsError } = quizIds.length
    ? await supabase.from("quiz_attempts").select("quiz_id, score").in("quiz_id", quizIds)
    : { data: [], error: null };

  if (attemptsError) {
    return Response.json({ error: "Could not load attempt stats." }, { status: 500 });
  }

  const statsByQuizId = new Map<string, { count: number; sum: number }>();
  for (const a of attempts ?? []) {
    const key = a.quiz_id as string;
    const entry = statsByQuizId.get(key) ?? { count: 0, sum: 0 };
    entry.count += 1;
    entry.sum += a.score as number;
    statsByQuizId.set(key, entry);
  }

  const moduleOrderById = new Map((modules ?? []).map((m) => [m.id as string, m.order_index as number]));
  const sessionById = new Map(
    (sessions ?? []).map((s) => [
      s.id as string,
      {
        title: s.title as string,
        orderIndex: s.order_index as number,
        moduleOrderIndex: s.module_id ? (moduleOrderById.get(s.module_id as string) ?? null) : null,
      },
    ]),
  );

  const rows = quizzes.map((q) => {
    const quizJson = q.quiz_json as QuizJson;
    const stats = statsByQuizId.get(q.id as string);
    const session = sessionById.get(q.session_id as string) ?? null;
    return {
      id: q.id as string,
      title: quizJson.title,
      sessionId: q.session_id as string,
      sessionTitle: session?.title ?? "Unknown session",
      sessionOrderIndex: session?.orderIndex ?? null,
      moduleOrderIndex: session?.moduleOrderIndex ?? null,
      questionCount: quizJson.questions.length,
      attemptCount: stats?.count ?? 0,
      avgScore: stats && stats.count > 0 ? Math.round((stats.sum / stats.count) * 10) / 10 : null,
      isLive: q.is_live as boolean,
      createdAt: q.created_at as string,
    };
  });

  rows.sort((a, b) => {
    let cmp = 0;
    if (sortBy === "title") cmp = a.title.localeCompare(b.title);
    else if (sortBy === "avgScore") cmp = (a.avgScore ?? -1) - (b.avgScore ?? -1);
    else if (sortBy === "attempts") cmp = a.attemptCount - b.attemptCount;
    else cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return sortDir === "asc" ? cmp : -cmp;
  });

  const total = rows.length;
  const start = (page - 1) * limit;
  const pageRows = rows.slice(start, start + limit);

  return Response.json({ quizzes: pageRows, total, page, limit });
}
