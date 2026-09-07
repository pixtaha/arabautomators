"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Avatar } from "@/components/ui/Avatar";

interface QuizMeta {
  id: string;
  title: string;
  sessionTitle: string;
  sessionOrderIndex: number | null;
  questionCount: number;
}

interface AttemptRow {
  attemptId: string;
  studentId: string;
  username: string;
  avatarUrl: string | null;
  score: number;
  correctCount: number;
  total: number;
  percent: number;
  completedAt: string;
}

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "score", label: "Highest score" },
  { value: "username", label: "Name (A–Z)" },
  { value: "completedAt", label: "Most recent" },
];

function percentColor(percent: number) {
  if (percent >= 80) return "text-text-accent";
  if (percent >= 50) return "text-aa-amber-700";
  return "text-aa-red-700";
}

export function AdminQuizAttemptsClient({ quizId }: { quizId: string }) {
  const [quiz, setQuiz] = useState<QuizMeta | null>(null);
  const [attempts, setAttempts] = useState<AttemptRow[] | null>(null);
  const [sortBy, setSortBy] = useState("score");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback((sort: string) => {
    const params = new URLSearchParams({ sortBy: sort, sortDir: sort === "username" ? "asc" : "desc", limit: "200" });
    fetch(`/api/admin/quiz-results/${quizId}/attempts?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setQuiz(data.quiz ?? null);
        setAttempts(data.attempts ?? []);
      })
      .catch(() => {
        setError("Could not load this quiz's attempts.");
        setAttempts([]);
      });
  }, [quizId]);

  useEffect(() => {
    load(sortBy);
  }, [sortBy, load]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
      <Header />

      <main className="relative flex-1 overflow-hidden">
        <div className="mx-auto flex max-w-[960px] flex-col gap-8 px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-2">
            <Link
              href="/admin/quiz-results"
              className="self-start font-mono text-[11px] tracking-widest text-text-accent uppercase hover:underline"
            >
              ← All quiz results
            </Link>
            <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
              {quiz ? (
                <>
                  {quiz.sessionOrderIndex !== null ? `Session ${quiz.sessionOrderIndex}: ` : ""}
                  {quiz.sessionTitle}
                </>
              ) : (
                "Loading…"
              )}
            </span>
            <h1 className="font-display text-[32px] font-extrabold tracking-[-0.03em] text-text-strong">
              {quiz?.title ?? "Quiz results"}
            </h1>
            {quiz && (
              <p className="text-sm text-text-muted">
                {quiz.questionCount} question{quiz.questionCount === 1 ? "" : "s"} · {attempts?.length ?? 0} attempt
                {attempts?.length === 1 ? "" : "s"}
              </p>
            )}
          </div>

          {error && <p className="text-xs font-medium text-aa-red-700">{error}</p>}

          <div className="flex flex-col gap-1.5 self-start">
            <label htmlFor="sort-by" className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
              Sort by
            </label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => {
                setAttempts(null);
                setSortBy(e.target.value);
              }}
              className="h-10 rounded-control border border-border-hairline-strong bg-surface-card px-3 text-sm text-text-strong focus:border-surface-brand focus:outline-none focus:ring-2 focus:ring-surface-brand/25"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {attempts === null ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-32 animate-pulse rounded-card bg-surface-sunken" />
              ))}
            </div>
          ) : attempts.length === 0 ? (
            <p className="text-sm text-text-muted">No students have attempted this quiz yet.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {attempts.map((a) => (
                <Link
                  key={a.attemptId}
                  href={`/admin/quiz-results/${quizId}/${a.attemptId}`}
                  className="flex flex-col items-center gap-2 rounded-card border border-border-hairline bg-surface-card p-4 text-center transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-border-hairline-strong hover:shadow-card"
                >
                  <span className="grid h-14 w-14 flex-none place-items-center overflow-hidden rounded-full bg-surface-brand-soft font-display text-lg font-bold text-text-accent">
                    {a.avatarUrl ? (
                      <Avatar src={a.avatarUrl} className="h-full w-full" />
                    ) : (
                      a.username.charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="w-full truncate text-sm font-semibold text-text-strong">@{a.username}</span>
                  <span className={`font-mono text-xl font-extrabold ${percentColor(a.percent)}`}>{a.percent}%</span>
                  <span className="font-mono text-[10px] tracking-widest text-text-faint uppercase">
                    {a.correctCount}/{a.total} correct · {a.score} pts
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
