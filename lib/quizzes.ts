// Shape and validation for instructor-uploaded quiz JSON. Shared between the
// admin upload form (fast client-side rejection) and the admin API route
// (the authoritative check before quiz_json is ever saved). Nothing about a
// quiz's scoring or UI behavior is hardcoded elsewhere -- this is only a
// shape check, not a rules engine.

export interface QuizOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
  hint?: string;
  correctFeedback?: string;
  wrongFeedback?: string;
  explanation?: string;
}

export interface QuizScoring {
  pointsPerCorrect: number;
  pointsPerWrong: number;
  minQuizScore: number;
  note?: string;
}

export interface QuizUi {
  oneQuestionAtATime: boolean;
  instantFeedback: boolean;
  lockAfterAnswer: boolean;
  colors?: { correct?: string; wrong?: string };
  nextButtonLabel?: string;
  lastQuestionButtonLabel?: string;
}

export interface QuizJson {
  quizId: string;
  title: string;
  language?: string;
  description?: string;
  scoring: QuizScoring;
  ui: QuizUi;
  questions: QuizQuestion[];
}

export function validateQuizJson(value: unknown): { ok: true; quiz: QuizJson } | { ok: false; error: string } {
  if (typeof value !== "object" || value === null) {
    return { ok: false, error: "Quiz file must contain a JSON object." };
  }
  const v = value as Record<string, unknown>;

  if (typeof v.quizId !== "string" || !v.quizId.trim()) {
    return { ok: false, error: "Missing or invalid \"quizId\"." };
  }
  if (typeof v.title !== "string" || !v.title.trim()) {
    return { ok: false, error: "Missing or invalid \"title\"." };
  }

  const scoring = v.scoring;
  if (typeof scoring !== "object" || scoring === null) {
    return { ok: false, error: "Missing or invalid \"scoring\" block." };
  }
  const s = scoring as Record<string, unknown>;
  if (typeof s.pointsPerCorrect !== "number" || typeof s.pointsPerWrong !== "number" || typeof s.minQuizScore !== "number") {
    return {
      ok: false,
      error: "\"scoring\" must have numeric pointsPerCorrect, pointsPerWrong and minQuizScore.",
    };
  }

  const ui = v.ui;
  if (typeof ui !== "object" || ui === null) {
    return { ok: false, error: "Missing or invalid \"ui\" block." };
  }
  const u = ui as Record<string, unknown>;
  if (
    typeof u.oneQuestionAtATime !== "boolean" ||
    typeof u.instantFeedback !== "boolean" ||
    typeof u.lockAfterAnswer !== "boolean"
  ) {
    return {
      ok: false,
      error: "\"ui\" must have boolean oneQuestionAtATime, instantFeedback and lockAfterAnswer.",
    };
  }

  if (!Array.isArray(v.questions) || v.questions.length === 0) {
    return { ok: false, error: "\"questions\" must be a non-empty array." };
  }

  for (const [index, question] of v.questions.entries()) {
    if (typeof question !== "object" || question === null) {
      return { ok: false, error: `Question ${index + 1} is not an object.` };
    }
    const q = question as Record<string, unknown>;
    if (typeof q.id !== "string" || !q.id.trim()) {
      return { ok: false, error: `Question ${index + 1} is missing an "id".` };
    }
    if (typeof q.prompt !== "string" || !q.prompt.trim()) {
      return { ok: false, error: `Question ${index + 1} is missing a "prompt".` };
    }
    if (!Array.isArray(q.options) || q.options.length < 2) {
      return { ok: false, error: `Question ${index + 1} needs at least 2 options.` };
    }
    for (const [optIndex, option] of (q.options as unknown[]).entries()) {
      if (typeof option !== "object" || option === null) {
        return { ok: false, error: `Question ${index + 1}, option ${optIndex + 1} is not an object.` };
      }
      const o = option as Record<string, unknown>;
      if (typeof o.id !== "string" || !o.id.trim() || typeof o.text !== "string" || !o.text.trim()) {
        return { ok: false, error: `Question ${index + 1}, option ${optIndex + 1} needs an "id" and "text".` };
      }
    }
    if (typeof q.correctOptionId !== "string" || !q.correctOptionId.trim()) {
      return { ok: false, error: `Question ${index + 1} is missing "correctOptionId".` };
    }
    const optionIds = new Set((q.options as Record<string, unknown>[]).map((o) => o.id));
    if (!optionIds.has(q.correctOptionId)) {
      return { ok: false, error: `Question ${index + 1}'s correctOptionId doesn't match any option id.` };
    }
  }

  return { ok: true, quiz: v as unknown as QuizJson };
}

export function scoreQuiz(
  quiz: QuizJson,
  answers: Record<string, string>,
): { score: number; correctCount: number; total: number } {
  let score = 0;
  let correctCount = 0;
  for (const question of quiz.questions) {
    const picked = answers[question.id];
    if (!picked) continue;
    if (picked === question.correctOptionId) {
      score += quiz.scoring.pointsPerCorrect;
      correctCount += 1;
    } else {
      score += quiz.scoring.pointsPerWrong;
    }
  }
  return {
    score: Math.max(quiz.scoring.minQuizScore, score),
    correctCount,
    total: quiz.questions.length,
  };
}
