import { requireAdmin } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { QuizJson } from "@/lib/quizzes";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The full per-question breakdown for one student's attempt: quiz_json is
// the source of truth for prompts/options/correct answers, quiz_attempts
// .answers is the source of truth for what the student actually picked --
// joined here in JS, nothing new to store.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ quizId: string; attemptId: string }> },
) {
  const user = await requireAdmin();
  if (!user) return Response.json({ error: "Forbidden" }, { status: 403 });

  const { quizId, attemptId } = await params;
  if (!UUID_RE.test(quizId) || !UUID_RE.test(attemptId)) {
    return Response.json({ error: "Invalid id." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("id, session_id, quiz_json")
    .eq("id", quizId)
    .maybeSingle();

  if (quizError || !quiz) {
    return Response.json({ error: "Quiz not found." }, { status: 404 });
  }

  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .select("id, student_id, score, answers, completed_at")
    .eq("id", attemptId)
    .eq("quiz_id", quizId)
    .maybeSingle();

  if (attemptError || !attempt) {
    return Response.json({ error: "Attempt not found." }, { status: 404 });
  }

  const { data: session } = await supabase
    .from("sessions")
    .select("title, order_index")
    .eq("id", quiz.session_id)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", attempt.student_id)
    .maybeSingle();

  const quizJson = quiz.quiz_json as QuizJson;
  const answers = attempt.answers as Record<string, string>;

  const questions = quizJson.questions.map((q) => {
    const pickedOptionId = answers[q.id] ?? null;
    const pickedOption = q.options.find((o) => o.id === pickedOptionId) ?? null;
    const correctOption = q.options.find((o) => o.id === q.correctOptionId) ?? null;
    return {
      id: q.id,
      prompt: q.prompt,
      options: q.options.map((o) => ({ id: o.id, text: o.text })),
      pickedOptionId,
      pickedOptionText: pickedOption?.text ?? null,
      correctOptionId: q.correctOptionId,
      correctOptionText: correctOption?.text ?? null,
      isCorrect: pickedOptionId !== null && pickedOptionId === q.correctOptionId,
      explanation: q.explanation ?? null,
      correctFeedback: q.correctFeedback ?? null,
      wrongFeedback: q.wrongFeedback ?? null,
    };
  });

  const total = quizJson.questions.length;
  const correctCount = questions.filter((q) => q.isCorrect).length;
  const maxPoints = total * quizJson.scoring.pointsPerCorrect;

  return Response.json({
    quiz: {
      id: quiz.id as string,
      title: quizJson.title,
      language: quizJson.language ?? null,
      sessionTitle: (session?.title as string | undefined) ?? "Unknown session",
      sessionOrderIndex: (session?.order_index as number | undefined) ?? null,
    },
    student: {
      id: attempt.student_id as string,
      username: (profile?.username as string | undefined) ?? "Student",
      avatarUrl: (profile?.avatar_url as string | null | undefined) ?? null,
    },
    attempt: {
      score: attempt.score as number,
      maxPoints,
      completedAt: attempt.completed_at as string,
      correctCount,
      total,
      percent: total > 0 ? Math.round((correctCount / total) * 100) : 0,
    },
    questions,
  });
}
