"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface SessionOption {
  id: string;
  title: string;
  orderIndex: number;
  moduleOrderIndex: number | null;
}

interface QuizRow {
  id: string;
  title: string;
  sessionId: string;
  sessionTitle: string;
  sessionOrderIndex: number | null;
  moduleOrderIndex: number | null;
  questionCount: number;
  attemptCount: number;
  avgScore: number | null;
  isLive: boolean;
  createdAt: string;
}

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: "createdAt", label: "Most recent" },
  { value: "avgScore", label: "Highest avg score" },
  { value: "attempts", label: "Most attempts" },
  { value: "title", label: "Title (A–Z)" },
];

const LIMIT = 20;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function AdminQuizResultsClient() {
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [sessionFilter, setSessionFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");

  const [quizzes, setQuizzes] = useState<QuizRow[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetch("/api/admin/sessions")
      .then((res) => res.json())
      .then((data) => setSessions(data.sessions ?? []))
      .catch(() => setSessions([]));
  }, []);

  const load = useCallback((sessionId: string, sort: string, pageNum: number) => {
    const params = new URLSearchParams({ sortBy: sort, sortDir: sort === "title" ? "asc" : "desc", page: String(pageNum), limit: String(LIMIT) });
    if (sessionId) params.set("sessionId", sessionId);

    fetch(`/api/admin/quiz-results?${params}`)
      .then((res) => res.json())
      .then((data) => {
        setQuizzes(data.quizzes ?? []);
        setTotal(data.total ?? 0);
      })
      .catch(() => {
        setQuizzes([]);
        setTotal(0);
      });
  }, []);

  useEffect(() => {
    load(sessionFilter, sortBy, page);
  }, [sessionFilter, sortBy, page, load]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
      <Header />

      <main className="relative flex-1 overflow-hidden">
        <div className="mx-auto flex max-w-[960px] flex-col gap-8 px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
              Internal · admin only
            </span>
            <h1 className="font-display text-[32px] font-extrabold tracking-[-0.03em] text-text-strong">
              Quiz results
            </h1>
            <p className="max-w-[60ch] text-sm leading-relaxed text-text-muted">
              Every quiz ever created, across every session. Open one to see who attempted it and how they did.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="session-filter" className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
                Session
              </label>
              <select
                id="session-filter"
                value={sessionFilter}
                onChange={(e) => {
                  setQuizzes(null);
                  setSessionFilter(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-control border border-border-hairline-strong bg-surface-card px-3 text-sm text-text-strong focus:border-surface-brand focus:outline-none focus:ring-2 focus:ring-surface-brand/25"
              >
                <option value="">All sessions</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.moduleOrderIndex !== null ? `Module ${s.moduleOrderIndex} · ` : ""}
                    Session {s.orderIndex}: {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="sort-by" className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
                Sort by
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => {
                  setQuizzes(null);
                  setSortBy(e.target.value);
                  setPage(1);
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
          </div>

          {quizzes === null ? (
            <div className="h-24 animate-pulse rounded-card bg-surface-sunken" />
          ) : quizzes.length === 0 ? (
            <p className="text-sm text-text-muted">No quizzes found.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {quizzes.map((q) => (
                <Link
                  key={q.id}
                  href={`/admin/quiz-results/${q.id}`}
                  className="flex items-center justify-between gap-3 rounded-card-inner border border-border-hairline bg-surface-card px-4 py-3 transition-colors hover:border-border-hairline-strong hover:bg-surface-hover"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] tracking-widest text-text-faint uppercase">
                        {q.moduleOrderIndex !== null ? `Module ${q.moduleOrderIndex} · ` : ""}
                        {q.sessionOrderIndex !== null ? `Session ${q.sessionOrderIndex}: ` : ""}
                        {q.sessionTitle}
                      </span>
                      {q.isLive && (
                        <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-widest text-aa-red-700 uppercase">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-aa-red-700" />
                          live
                        </span>
                      )}
                    </div>
                    <div className="truncate text-sm font-semibold text-text-strong">{q.title}</div>
                    <div className="mt-0.5 font-mono text-[10px] tracking-widest text-text-faint uppercase">
                      {q.questionCount} question{q.questionCount === 1 ? "" : "s"} · {formatDate(q.createdAt)}
                    </div>
                  </div>

                  <div className="flex flex-none flex-col items-end gap-0.5">
                    <span className="font-mono text-lg font-extrabold text-text-strong">
                      {q.avgScore !== null ? q.avgScore : "—"}
                    </span>
                    <span className="font-mono text-[10px] tracking-widest text-text-muted uppercase">
                      avg · {q.attemptCount} attempt{q.attemptCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {total > LIMIT && (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setQuizzes(null);
                  setPage((p) => Math.max(1, p - 1));
                }}
                disabled={page <= 1}
                className="rounded-control border border-border-hairline-strong px-3 py-1.5 text-xs font-semibold text-text-body transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => {
                  setQuizzes(null);
                  setPage((p) => Math.min(totalPages, p + 1));
                }}
                disabled={page >= totalPages}
                className="rounded-control border border-border-hairline-strong px-3 py-1.5 text-xs font-semibold text-text-body transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
