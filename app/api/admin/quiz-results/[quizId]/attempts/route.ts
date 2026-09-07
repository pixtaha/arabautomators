import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { QuizJson } from "@/lib/quizzes";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SORT_FIELDS = new Set(["score", "username", "completedAt"]);
const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 200;

// Every student who attempted one quiz, for the admin grid view. Per-attempt
// correctCount/total is reconstructed here (quiz_json questions vs
// attempt.answers) rather than trusting only the stored point score, since
// scoring.pointsPerWrong can be negative and isn't a clean 0-100% signal.
export async function GET(request: Request, { params }: { params: Promise<{ quizId: string }> }) {
  const user = await requireAdmin();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { quizId } = await params;
  if (!UUID_RE.test(quizId)) {
    return Response.json({ error: "Invalid quiz id." }, { status: 400 });
  }

  const url = new URL(request.url);
  const sortByParam = url.searchParams.get("sortBy") ?? "score";
  const sortBy = SORT_FIELDS.has(sortByParam) ? sortByParam : "score";
  const sortDir = url.searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(url.searchParams.get("limit")) || DEFAULT_LIMIT));

  const supabase = createAdminClient();

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("id, session_id, quiz_json")
    .eq("id", quizId)
    .maybeSingle();

  if (quizError || !quiz) {
    return Response.json({ error: "Quiz not found." }, { status: 404 });
  }

  const quizJson = quiz.quiz_json as QuizJson;
  const total = quizJson.questions.length;

  const { data: session } = await supabase
    .from("sessions")
    .select("title, order_index")
    .eq("id", quiz.session_id)
    .maybeSingle();

  const { data: attempts, error: attemptsError } = await supabase
    .from("quiz_attempts")
    .select("id, student_id, score, answers, completed_at")
    .eq("quiz_id", quizId);

  if (attemptsError) {
    return Response.json({ error: "Could not load attempts." }, { status: 500 });
  }

  const studentIds = (attempts ?? []).map((a) => a.student_id as string);
  const { data: profiles } = studentIds.length
    ? await supabase.from("profiles").select("id, username, avatar_url").in("id", studentIds)
    : { data: [] };

  const profileById = new Map((profiles ?? []).map((p) => [p.id as string, p]));

  const rows = (attempts ?? []).map((a) => {
    const answers = a.answers as Record<string, string>;
    const correctCount = quizJson.questions.filter((q) => answers[q.id] === q.correctOptionId).length;
    const profile = profileById.get(a.student_id as string);
    return {
      attemptId: a.id as string,
      studentId: a.student_id as string,
      username: (profile?.username as string | undefined) ?? "Student",
      avatarUrl: (profile?.avatar_url as string | null | undefined) ?? null,
      score: a.score as number,
      correctCount,
      total,
      percent: total > 0 ? Math.round((correctCount / total) * 100) : 0,
      completedAt: a.completed_at as string,
    };
  });

  rows.sort((a, b) => {
    let cmp = 0;
    if (sortBy === "username") cmp = a.username.localeCompare(b.username);
    else if (sortBy === "completedAt") cmp = new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
    else cmp = a.score - b.score;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const rowTotal = rows.length;
  const start = (page - 1) * limit;
  const pageRows = rows.slice(start, start + limit);

  return Response.json({
    quiz: {
      id: quiz.id as string,
      title: quizJson.title,
      sessionTitle: (session?.title as string | undefined) ?? "Unknown session",
      sessionOrderIndex: (session?.order_index as number | undefined) ?? null,
      questionCount: total,
    },
    attempts: pageRows,
    total: rowTotal,
    page,
    limit,
  });
}
