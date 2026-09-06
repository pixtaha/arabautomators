"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { validateQuizJson, type QuizJson } from "@/lib/quizzes";

interface SessionOption {
  id: string;
  title: string;
  orderIndex: number;
  moduleOrderIndex: number | null;
}

interface QuizRow {
  id: string;
  session_id: string;
  quiz_json: QuizJson;
  is_live: boolean;
  created_at: string;
  updated_at: string;
}

export function AdminQuizzesClient() {
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState("");

  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/sessions")
      .then((res) => res.json())
      .then((data) => {
        setSessions(data.sessions ?? []);
        if (data.sessions?.length) setSelectedSessionId((prev) => prev || data.sessions[0].id);
      })
      .finally(() => setSessionsLoading(false));
  }, []);

  const loadQuizzes = useCallback((sessionId: string) => {
    if (!sessionId) return;
    fetch(`/api/admin/quizzes?sessionId=${sessionId}`)
      .then((res) => res.json())
      .then((data) => setQuizzes(data.quizzes ?? []))
      .finally(() => setQuizzesLoading(false));
  }, []);

  useEffect(() => {
    if (selectedSessionId) loadQuizzes(selectedSessionId);
  }, [selectedSessionId, loadQuizzes]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!selectedSessionId) {
      setFormError("Choose a session first.");
      return;
    }
    if (!file) {
      setFormError("Choose a quiz JSON file to upload.");
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setFormError("That file isn't valid JSON.");
      return;
    }
    const validation = validateQuizJson(parsed);
    if (!validation.ok) {
      setFormError(validation.error);
      return;
    }

    const formData = new FormData();
    formData.append("sessionId", selectedSessionId);
    formData.append("file", file);

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/quizzes", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || !data.quiz) {
        setFormError(data.error ?? "Something went wrong.");
        return;
      }

      setFormSuccess(`Uploaded "${data.quiz.quiz_json.title}".`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadQuizzes(selectedSessionId);
    } catch {
      setFormError("Request failed. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleLive(quiz: QuizRow, nextIsLive: boolean) {
    setTogglingId(quiz.id);
    try {
      const res = await fetch(`/api/admin/quizzes/${quiz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isLive: nextIsLive }),
      });
      if (res.ok) {
        loadQuizzes(selectedSessionId);
      }
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this quiz? Student attempts for it will be deleted too.")) return;
    setDeletingId(id);
    const res = await fetch(`/api/admin/quizzes/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      setQuizzes((prev) => prev.filter((q) => q.id !== id));
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
      <Header />

      <main className="relative flex-1 overflow-hidden">
        <div className="mx-auto flex max-w-[720px] flex-col gap-8 px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
              Internal · admin only
            </span>
            <h1 className="font-display text-[32px] font-extrabold tracking-[-0.03em] text-text-strong">
              Live quizzes
            </h1>
            <p className="max-w-[60ch] text-sm leading-relaxed text-text-muted">
              Upload a quiz JSON file for a session, then start it to push it live to every student in real time.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card"
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="session" className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
                Session
              </label>
              <select
                id="session"
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                disabled={submitting || sessionsLoading || sessions.length === 0}
                className="h-11 rounded-control border border-border-hairline-strong bg-surface-card px-3.5 text-sm text-text-strong focus:border-surface-brand focus:outline-none focus:ring-2 focus:ring-surface-brand/25"
              >
                {sessions.length === 0 && <option>No sessions found</option>}
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.moduleOrderIndex !== null ? `Module ${s.moduleOrderIndex} · ` : ""}
                    Session {s.orderIndex}: {s.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="quiz-file" className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
                Quiz JSON file
              </label>
              <input
                id="quiz-file"
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={(e) => {
                  setFormError(null);
                  setFile(e.target.files?.[0] ?? null);
                }}
                disabled={submitting}
                className="cursor-pointer text-sm text-text-body file:mr-3 file:cursor-pointer file:rounded-control file:border-0 file:bg-surface-brand file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
            </div>

            {formError && <p className="text-xs font-medium text-aa-red-700">{formError}</p>}
            {formSuccess && <p className="text-xs font-medium text-text-accent">{formSuccess}</p>}

            <Button type="submit" disabled={submitting} className="self-start">
              {submitting ? "Uploading…" : "Upload quiz"}
            </Button>
          </form>

          <div className="flex flex-col gap-3">
            <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
              Uploaded for this session
            </span>

            {quizzesLoading ? (
              <div className="h-24 animate-pulse rounded-card bg-surface-sunken" />
            ) : quizzes.length === 0 ? (
              <p className="text-sm text-text-muted">No quizzes uploaded yet for this session.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {quizzes.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center justify-between gap-3 rounded-card-inner border border-border-hairline bg-surface-card px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] tracking-widest text-text-faint uppercase">
                          {q.quiz_json.questions.length} question{q.quiz_json.questions.length === 1 ? "" : "s"}
                        </span>
                        {q.is_live && (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-widest text-aa-red-700 uppercase">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-aa-red-700" />
                            live
                          </span>
                        )}
                      </div>
                      <div className="truncate text-sm font-semibold text-text-strong">{q.quiz_json.title}</div>
                    </div>

                    <Switch
                      checked={q.is_live}
                      onChange={(checked) => handleToggleLive(q, checked)}
                      label={q.is_live ? "Stop quiz" : "Start quiz"}
                    />

                    <button
                      type="button"
                      onClick={() => handleDelete(q.id)}
                      disabled={deletingId === q.id || togglingId === q.id}
                      className="flex-none cursor-pointer rounded-control border border-border-hairline-strong px-3 py-1.5 text-xs font-semibold text-aa-red-700 transition-colors hover:border-aa-red-500 hover:bg-surface-danger-soft disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingId === q.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
