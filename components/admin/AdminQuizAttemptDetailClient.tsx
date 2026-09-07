"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Avatar } from "@/components/ui/Avatar";

interface QuizMeta {
  id: string;
  title: string;
  language: string | null;
  sessionTitle: string;
  sessionOrderIndex: number | null;
}

interface StudentMeta {
  id: string;
  username: string;
  avatarUrl: string | null;
}

interface AttemptMeta {
  score: number;
  maxPoints: number;
  completedAt: string;
  correctCount: number;
  total: number;
  percent: number;
}

interface QuestionBreakdown {
  id: string;
  prompt: string;
  options: { id: string; text: string }[];
  pickedOptionId: string | null;
  pickedOptionText: string | null;
  correctOptionId: string;
  correctOptionText: string | null;
  isCorrect: boolean;
  explanation: string | null;
  correctFeedback: string | null;
  wrongFeedback: string | null;
}

interface DetailData {
  quiz: QuizMeta;
  student: StudentMeta;
  attempt: AttemptMeta;
  questions: QuestionBreakdown[];
}

const LETTERS = ["A", "B", "C", "D", "E", "F"];

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// Mirrors the option-state visual language of the student-facing QuestionCard
// in components/dashboard/QuizClient.tsx (correct = brand green, the
// student's wrong pick = danger red, everything else dimmed) so the admin
// breakdown reads the same way a student's own "review your answers" does.
function QuestionRow({ question, index, total, contentDir }: { question: QuestionBreakdown; index: number; total: number; contentDir: "ltr" | "rtl" }) {
  const unanswered = question.pickedOptionId === null;

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
          Question {index + 1} / {total}
        </span>
        {unanswered ? (
          <span className="rounded-full bg-surface-sunken px-2 py-0.5 font-mono text-[10px] font-bold text-text-muted uppercase">
            Not answered
          </span>
        ) : (
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
              question.isCorrect ? "bg-surface-brand-soft text-text-accent" : "bg-surface-danger-soft text-aa-red-700"
            }`}
          >
            {question.isCorrect ? <CheckIcon className="h-3 w-3" /> : <XIcon className="h-3 w-3" />}
            {question.isCorrect ? "Correct" : "Wrong"}
          </span>
        )}
      </div>

      <div dir={contentDir} className="text-left text-base leading-snug font-bold text-text-strong text-pretty">
        {question.prompt}
      </div>

      <div dir={contentDir} className="flex flex-col gap-2.5">
        {question.options.map((option, optIndex) => {
          const isCorrectOption = option.id === question.correctOptionId;
          const isPicked = option.id === question.pickedOptionId;

          let classes = "border-border-hairline bg-surface-card text-text-faint opacity-60";
          let markerClasses = "bg-surface-sunken text-text-muted";
          if (isCorrectOption) {
            classes = "border-surface-brand bg-surface-brand-soft text-text-accent";
            markerClasses = "bg-surface-brand text-text-inverse";
          } else if (isPicked) {
            classes = "border-surface-danger bg-surface-danger-soft text-aa-red-700";
            markerClasses = "bg-surface-danger text-text-inverse";
          }

          return (
            <div
              key={option.id}
              className={`flex w-full items-center gap-3 rounded-card-inner border px-4 py-3 text-left text-sm font-medium ${classes}`}
            >
              <span className={`flex h-6 w-6 flex-none items-center justify-center rounded-full font-mono text-[11px] font-bold ${markerClasses}`}>
                {isCorrectOption ? <CheckIcon className="h-3.5 w-3.5" /> : isPicked ? <XIcon className="h-3.5 w-3.5" /> : LETTERS[optIndex]}
              </span>
              <span className="min-w-0 flex-1 text-pretty">{option.text}</span>
              {isPicked && (
                <span className="flex-none font-mono text-[9px] tracking-widest uppercase opacity-80">Picked</span>
              )}
            </div>
          );
        })}
      </div>

      {question.explanation && (
        <div className="rounded-card-inner border-l-4 border-border-hairline-strong bg-surface-sunken p-4">
          <div dir={contentDir} className="text-left text-sm leading-relaxed text-text-body">
            {question.explanation}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminQuizAttemptDetailClient({ quizId, attemptId }: { quizId: string; attemptId: string }) {
  const [data, setData] = useState<DetailData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/quiz-results/${quizId}/attempts/${attemptId}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((json) => setData(json))
      .catch(() => setError("Could not load this attempt."));
  }, [quizId, attemptId]);

  const contentDir = data?.quiz.language === "ar" ? "rtl" : "ltr";

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
      <Header />

      <main className="relative flex-1 overflow-hidden">
        <div className="mx-auto flex max-w-[720px] flex-col gap-6 px-4 py-12 sm:px-6 sm:py-16">
          <Link
            href={`/admin/quiz-results/${quizId}`}
            className="self-start font-mono text-[11px] tracking-widest text-text-accent uppercase hover:underline"
          >
            ← Back to attempts
          </Link>

          {error && <p className="text-xs font-medium text-aa-red-700">{error}</p>}

          {!data ? (
            <div className="h-48 animate-pulse rounded-card bg-surface-sunken" />
          ) : (
            <>
              <div className="flex flex-col gap-6 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 flex-none place-items-center overflow-hidden rounded-full bg-surface-brand-soft font-display text-base font-bold text-text-accent">
                    {data.student.avatarUrl ? (
                      <Avatar src={data.student.avatarUrl} className="h-full w-full" />
                    ) : (
                      data.student.username.charAt(0).toUpperCase()
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-lg font-semibold text-text-strong">@{data.student.username}</div>
                    <div className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
                      {data.quiz.title} · {formatDate(data.attempt.completedAt)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-card-inner bg-surface-sunken p-4">
                    <div className="font-mono text-[10px] tracking-widest text-text-muted uppercase">Correct</div>
                    <div className="mt-1.5 font-mono text-2xl font-extrabold text-text-strong">
                      {data.attempt.correctCount} / {data.attempt.total}
                    </div>
                  </div>
                  <div className="rounded-card-inner bg-surface-sunken p-4">
                    <div className="font-mono text-[10px] tracking-widest text-text-muted uppercase">Points</div>
                    <div className="mt-1.5 font-mono text-2xl font-extrabold text-text-accent">
                      {data.attempt.score} / {data.attempt.maxPoints}
                    </div>
                  </div>
                  <div className="rounded-card-inner bg-surface-sunken p-4">
                    <div className="font-mono text-[10px] tracking-widest text-text-muted uppercase">Percent</div>
                    <div className="mt-1.5 font-mono text-2xl font-extrabold text-text-strong">{data.attempt.percent}%</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {data.questions.map((q, index) => (
                  <QuestionRow key={q.id} question={q} index={index} total={data.questions.length} contentDir={contentDir} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
