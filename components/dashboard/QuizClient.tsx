"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Avatar } from "@/components/ui/Avatar";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";
import { useLiveQuiz, type LiveQuizRow } from "@/lib/hooks/useLiveQuiz";
import { createClient } from "@/lib/supabase/client";
import { scoreQuiz, type QuizJson, type QuizQuestion } from "@/lib/quizzes";

interface AttemptRow {
  score: number;
  answers: Record<string, string>;
  completed_at: string;
}

interface LeaderboardRow {
  rank: number;
  name: string;
  avatarUrl: string | null;
  score: number;
  isMe: boolean;
}

interface Draft {
  idx: number;
  answers: Record<string, string>;
}

function draftKey(userId: string, quizId: string) {
  return `aa-quiz-draft:${userId}:${quizId}`;
}

function loadDraft(userId: string, quizId: string): Draft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(userId, quizId));
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function saveDraft(userId: string, quizId: string, draft: Draft) {
  try {
    window.localStorage.setItem(draftKey(userId, quizId), JSON.stringify(draft));
  } catch {
    // Best-effort only -- a private-mode browser or full storage just means
    // no draft recovery, not a broken quiz.
  }
}

function clearDraft(userId: string, quizId: string) {
  try {
    window.localStorage.removeItem(draftKey(userId, quizId));
  } catch {
    // See saveDraft.
  }
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

type OptionState = "idle" | "selected" | "correct" | "wrong" | "dim";

const OPTION_CLASSES: Record<OptionState, string> = {
  idle: "border-border-hairline-strong bg-surface-card text-text-body hover:border-border-hairline-strong hover:bg-surface-hover",
  selected: "cursor-default border-border-hairline-strong bg-surface-sunken text-text-strong",
  correct: "cursor-default border-surface-brand bg-surface-brand-soft text-text-accent",
  wrong: "cursor-default border-surface-danger bg-surface-danger-soft text-aa-red-700",
  dim: "cursor-default border-border-hairline bg-surface-card text-text-faint opacity-50",
};

const MARKER_CLASSES: Record<OptionState, string> = {
  idle: "bg-surface-sunken text-text-muted",
  selected: "bg-surface-ink text-white",
  correct: "bg-surface-brand text-text-inverse",
  wrong: "bg-surface-danger text-text-inverse",
  dim: "bg-surface-sunken text-text-muted",
};

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function QuestionCard({
  question,
  index,
  total,
  language,
  picked,
  locked,
  revealCorrectness,
  onPick,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  language: string | undefined;
  picked: string | undefined;
  locked: boolean;
  revealCorrectness: boolean;
  onPick: (optionId: string) => void;
}) {
  const contentDir = language === "ar" ? "rtl" : "ltr";
  const answered = Boolean(picked);
  const isRight = picked === question.correctOptionId;

  return (
    <div className="flex flex-col gap-6 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
          Question {index + 1} / {total}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <div dir={contentDir} className="text-left text-lg leading-snug font-bold text-text-strong text-pretty">
          {question.prompt}
        </div>
        {question.hint && !answered && (
          <div dir={contentDir} className="text-left text-sm leading-relaxed text-text-muted">
            {question.hint}
          </div>
        )}
      </div>

      <div dir={contentDir} className="flex flex-col gap-3">
        {question.options.map((option, optIndex) => {
          let state: OptionState = "idle";
          if (answered) {
            if (revealCorrectness) {
              if (option.id === question.correctOptionId) state = "correct";
              else if (option.id === picked) state = "wrong";
              else state = "dim";
            } else {
              state = option.id === picked ? "selected" : "dim";
            }
          }
          const disabled = locked && answered;

          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onPick(option.id)}
              className={`flex w-full items-center gap-3 rounded-card-inner border px-4 py-3 text-left text-[15px] font-medium transition-colors duration-150 ease-out ${OPTION_CLASSES[state]}`}
            >
              <span
                className={`flex h-7 w-7 flex-none items-center justify-center rounded-full font-mono text-xs font-bold ${MARKER_CLASSES[state]}`}
              >
                {state === "correct" ? <CheckIcon className="h-4 w-4" /> : state === "wrong" ? <XIcon className="h-4 w-4" /> : LETTERS[optIndex]}
              </span>
              <span className="min-w-0 flex-1 text-pretty">{option.text}</span>
            </button>
          );
        })}
      </div>

      {answered && revealCorrectness && (
        <div
          className={`rounded-card-inner border-l-4 bg-surface-sunken p-4 ${
            isRight ? "border-surface-brand" : "border-surface-danger"
          }`}
        >
          <div className={`text-sm font-bold ${isRight ? "text-text-accent" : "text-aa-red-700"}`}>
            {isRight ? question.correctFeedback ?? "Correct" : question.wrongFeedback ?? "Not quite"}
          </div>
          {question.explanation && (
            <div dir={contentDir} className="mt-1.5 text-left text-sm leading-relaxed text-text-body">
              {question.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultView({
  quiz,
  attempt,
  onReview,
}: {
  quiz: LiveQuizRow;
  attempt: AttemptRow;
  onReview: () => void;
}) {
  const [board, setBoard] = useState<LeaderboardRow[] | null>(null);

  useEffect(() => {
    let active = true;

    function load() {
      fetch(`/api/quizzes/${quiz.id}/leaderboard`)
        .then((res) => res.json())
        .then((data) => {
          if (active) setBoard(data.board ?? []);
        })
        .catch(() => {
          if (active) setBoard([]);
        });
    }

    load();

    // "leaderboard:quiz:<quiz.id>" is a fixed, shared broadcast topic --
    // see LeaderboardCard.tsx for why this can't use a per-mount unique
    // name the way useLiveQuiz's channel does. This one genuinely updates
    // live for every other student completing this same quiz too, unlike
    // the quiz_attempts-RLS-gated subscription it replaces (which could
    // only ever have fired for the viewer's own row).
    const supabase = createClient();
    const channel = supabase
      .channel(`leaderboard:quiz:${quiz.id}`, { config: { private: true } })
      .on("broadcast", { event: "changed" }, () => load())
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [quiz.id]);

  const total = quiz.quiz_json.questions.length;
  const correctCount = quiz.quiz_json.questions.filter((q) => attempt.answers[q.id] === q.correctOptionId).length;
  const maxPoints = total * quiz.quiz_json.scoring.pointsPerCorrect;
  const percent = Math.round((correctCount / total) * 100);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-text-strong">Quiz complete</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-card-inner bg-surface-sunken p-4">
            <div className="font-mono text-[10px] tracking-widest text-text-muted uppercase">Correct</div>
            <div className="mt-1.5 font-mono text-2xl font-extrabold text-text-strong">
              {correctCount} / {total}
            </div>
          </div>
          <div className="rounded-card-inner bg-surface-sunken p-4">
            <div className="font-mono text-[10px] tracking-widest text-text-muted uppercase">Points</div>
            <div className="mt-1.5 font-mono text-2xl font-extrabold text-text-accent">
              {attempt.score} / {maxPoints}
            </div>
          </div>
          <div className="rounded-card-inner bg-surface-sunken p-4">
            <div className="font-mono text-[10px] tracking-widest text-text-muted uppercase">Percent</div>
            <div className="mt-1.5 font-mono text-2xl font-extrabold text-text-strong">{percent}%</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onReview}
          className="self-start font-mono text-xs tracking-widest text-text-accent uppercase hover:underline"
        >
          Review your answers
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
        <h3 className="font-display text-lg font-bold text-text-strong">Leaderboard</h3>
        {board === null ? (
          <div className="h-24 animate-pulse rounded-card-inner bg-surface-sunken" />
        ) : board.length === 0 ? (
          <p className="text-sm text-text-muted">No attempts yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {board.map((row) => (
              <div
                key={row.rank}
                className={`flex items-center gap-3 rounded-card-inner px-3 py-2.5 ${
                  row.isMe ? "border-2 border-surface-brand bg-surface-brand-soft" : "bg-surface-sunken"
                }`}
              >
                <span className="w-6 flex-none font-mono text-xs text-text-muted">{row.rank}</span>
                <span className="grid h-8 w-8 flex-none place-items-center overflow-hidden rounded-full bg-surface-brand-soft font-display text-xs font-bold text-text-accent">
                  {row.avatarUrl ? (
                    <Avatar src={row.avatarUrl} className="h-full w-full" />
                  ) : (
                    row.name.charAt(0).toUpperCase()
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-strong">{row.name}</span>
                {row.isMe && (
                  <span className="flex-none rounded-full bg-surface-brand px-2 py-0.5 font-mono text-[10px] font-bold text-text-inverse uppercase">
                    You
                  </span>
                )}
                <span className="flex-none font-mono text-xs font-bold text-text-strong">{row.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Placeholder({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-card border border-border-hairline bg-surface-card p-8 text-center shadow-card">
      <h2 className="font-display text-lg font-bold text-text-strong">{title}</h2>
      <p className="text-sm text-text-muted">{body}</p>
    </div>
  );
}

// Owns everything scoped to one live quiz (attempt lookup, draft hydration,
// answering, submission). Mounted with key={quiz.id} by QuizClient below, so
// switching to a different quiz remounts it fresh instead of needing effects
// that reset state -- draft/attempt state is seeded once via lazy useState
// initializers rather than synced in afterward.
function QuizFlow({ quiz, user }: { quiz: LiveQuizRow; user: User }) {
  const [attempt, setAttempt] = useState<AttemptRow | null | undefined>(undefined);
  const [idx, setIdx] = useState<number>(() => loadDraft(user.id, quiz.id)?.idx ?? 0);
  const [answers, setAnswers] = useState<Record<string, string>>(
    () => loadDraft(user.id, quiz.id)?.answers ?? {},
  );
  const [reviewMode, setReviewMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase
      .from("quiz_attempts")
      .select("score, answers, completed_at")
      .eq("quiz_id", quiz.id)
      .eq("student_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setAttempt((data as AttemptRow | null) ?? null);
      });
    return () => {
      active = false;
    };
  }, [quiz.id, user.id]);

  // Keep the draft mirrored to localStorage so is_live flipping off and back
  // on (or a page reload) doesn't lose in-progress answers.
  useEffect(() => {
    if (attempt) return;
    saveDraft(user.id, quiz.id, { idx, answers });
  }, [attempt, idx, answers, quiz.id, user.id]);

  function pick(question: QuizQuestion, optionId: string) {
    const alreadyAnswered = Boolean(answers[question.id]);
    if (quiz.quiz_json.ui.lockAfterAnswer && alreadyAnswered) return;
    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
  }

  // Flips to the results view immediately (score is already fully computed
  // client-side by scoreQuiz) and only awaits the insert afterwards -- its
  // `error` decides whether to roll back to the quiz view and restore the
  // draft, rather than blocking the results view on the network round trip.
  async function finishQuiz() {
    setSubmitting(true);
    setSubmitError(null);

    const { score } = scoreQuiz(quiz.quiz_json, answers);
    const completedAt = new Date().toISOString();
    const submittedAnswers = answers;

    clearDraft(user.id, quiz.id);
    setAttempt({ score, answers: submittedAnswers, completed_at: completedAt });

    const supabase = createClient();
    const { error } = await supabase
      .from("quiz_attempts")
      .insert({ quiz_id: quiz.id, student_id: user.id, score, answers: submittedAnswers, completed_at: completedAt });

    setSubmitting(false);
    if (error) {
      setAttempt(null);
      saveDraft(user.id, quiz.id, { idx, answers: submittedAnswers });
      setSubmitError("Could not submit your quiz. Please try again.");
    }
  }

  function goNext(questions: QuizQuestion[]) {
    if (idx < questions.length - 1) {
      setIdx((i) => i + 1);
      return;
    }
    void finishQuiz();
  }

  if (attempt === undefined) {
    return <div className="h-40 animate-pulse rounded-card bg-surface-sunken" />;
  }
  if (attempt !== null && !reviewMode) {
    return <ResultView quiz={quiz} attempt={attempt} onReview={() => setReviewMode(true)} />;
  }

  const quizJson: QuizJson = quiz.quiz_json;
  const ui = quizJson.ui;
  const isReview = attempt !== null;
  const currentAnswers = isReview ? attempt.answers : answers;

  const questionCards = (question: QuizQuestion, index: number) => (
    <QuestionCard
      key={question.id}
      question={question}
      index={index}
      total={quizJson.questions.length}
      language={quizJson.language}
      picked={currentAnswers[question.id]}
      locked={isReview || ui.lockAfterAnswer}
      revealCorrectness={isReview || ui.instantFeedback}
      onPick={isReview ? () => {} : (optionId) => pick(question, optionId)}
    />
  );

  let content: React.ReactNode;

  if (isReview) {
    content = (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setReviewMode(false)}
          className="self-start font-mono text-xs tracking-widest text-text-accent uppercase hover:underline"
        >
          Back to results
        </button>
        {quizJson.questions.map((q, i) => questionCards(q, i))}
      </div>
    );
  } else if (ui.oneQuestionAtATime) {
    const question = quizJson.questions[idx];
    const answered = Boolean(answers[question.id]);
    const isLast = idx >= quizJson.questions.length - 1;

    content = (
      <div className="flex flex-col gap-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border-hairline">
          <div
            className="h-full rounded-full bg-surface-brand transition-[width] duration-300 ease-out"
            style={{ width: `${Math.round(((answered ? idx + 1 : idx) / quizJson.questions.length) * 100)}%` }}
          />
        </div>
        {questionCards(question, idx)}
        {answered && (
          <button
            type="button"
            onClick={() => goNext(quizJson.questions)}
            disabled={submitting}
            className="self-end rounded-control bg-surface-brand px-6 py-3 text-sm font-semibold text-text-inverse transition-transform hover:-translate-y-px disabled:opacity-60"
          >
            {submitting ? "Saving…" : isLast ? ui.lastQuestionButtonLabel ?? "Finish" : ui.nextButtonLabel ?? "Next"}
          </button>
        )}
      </div>
    );
  } else {
    const allAnswered = quizJson.questions.every((q) => Boolean(answers[q.id]));
    content = (
      <div className="flex flex-col gap-4">
        {quizJson.questions.map((q, i) => questionCards(q, i))}
        <button
          type="button"
          onClick={() => void finishQuiz()}
          disabled={!allAnswered || submitting}
          className="self-end rounded-control bg-surface-brand px-6 py-3 text-sm font-semibold text-text-inverse transition-transform hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving…" : ui.lastQuestionButtonLabel ?? "Finish"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {content}
      {submitError && <p className="text-xs font-medium text-aa-red-700">{submitError}</p>}
    </div>
  );
}

export function QuizClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useSupabaseUser();
  const { quiz, loading: quizLoading } = useLiveQuiz();

  // Remembers the last quiz id we saw live, purely to tell "paused" apart
  // from "never started" once `quiz` goes null. Set during render (React's
  // documented "storing information from previous renders" pattern) rather
  // than in an effect, since it only needs to react to `quiz` itself
  // changing, not run any side effect.
  const [lastQuizId, setLastQuizId] = useState<string | null>(null);
  if (quiz && quiz.id !== lastQuizId) {
    setLastQuizId(quiz.id);
  }

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
        <Header />
        <main className="relative flex-1 overflow-hidden">
          <div className="relative mx-auto flex max-w-[720px] flex-col gap-6 px-4 py-16 sm:px-6">
            <div className="h-8 w-64 animate-pulse rounded-control bg-surface-sunken" />
            <div className="h-40 animate-pulse rounded-card bg-surface-sunken" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  let body: React.ReactNode;

  if (quizLoading) {
    body = <div className="h-40 animate-pulse rounded-card bg-surface-sunken" />;
  } else if (!quiz) {
    body = lastQuizId ? (
      <Placeholder
        title="Quiz paused"
        body="Your instructor paused the quiz. Your answers are saved — it'll pick up right where you left off once it's live again."
      />
    ) : (
      <Placeholder
        title="No live quiz right now"
        body="Your instructor will start a quiz here during the lecture."
      />
    );
  } else {
    body = <QuizFlow key={quiz.id} quiz={quiz} user={user} />;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
      <Header />

      <main className="relative flex-1 overflow-hidden">
        <div className="bg-dots mask-fade-b absolute inset-0 bg-surface-page" />

        <div className="relative mx-auto flex max-w-[720px] flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">Live quiz</span>
            <h1 className="font-display text-[32px] font-extrabold tracking-[-0.03em] text-text-strong sm:text-[40px]">
              {quiz ? quiz.quiz_json.title : "Quiz"}
            </h1>
          </div>

          {body}
        </div>
      </main>

      <Footer />
    </div>
  );
}
