"use client";

import { useCallback, useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import type { SocialSubmissionRow, SocialWindowRow } from "@/lib/data/socialSubmissions";

// Same mixed Arabic/English detection as TaskBoardClient.tsx, duplicated
// locally per this codebase's existing convention (see that file's own
// comment on why it isn't shared) rather than imported.
const ARABIC_CHAR_RE = /[؀-ۿ]/;
const LATIN_CHAR_RE = /[A-Za-z]/;

function isArabicText(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  let arabicWords = 0;
  let latinWords = 0;
  for (const word of words) {
    if (ARABIC_CHAR_RE.test(word)) arabicWords++;
    else if (LATIN_CHAR_RE.test(word)) latinWords++;
  }
  return arabicWords >= latinWords;
}

function isValidUrl(value: string) {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

interface SocialSubmissionsClientProps {
  initialWindows: SocialWindowRow[];
  initialSubmissions: SocialSubmissionRow[];
}

export function SocialSubmissionsClient({ initialWindows, initialSubmissions }: SocialSubmissionsClientProps) {
  const [windows] = useState(initialWindows);
  const [submissions, setSubmissions] = useState(initialSubmissions);

  const submissionByWindowId = useMemo(() => {
    const map = new Map<string, SocialSubmissionRow>();
    for (const submission of submissions) map.set(submission.window_id, submission);
    return map;
  }, [submissions]);

  const applySubmission = useCallback((submission: SocialSubmissionRow) => {
    setSubmissions((prev) => [...prev.filter((s) => s.window_id !== submission.window_id), submission]);
  }, []);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
      <Header />

      <main className="relative flex-1 overflow-hidden">
        <div className="bg-dots mask-fade-b absolute inset-0 bg-surface-page" />
        <div className="relative mx-auto flex max-w-[720px] flex-col gap-5 px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">Social</span>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-strong">Social submissions</h1>
            <p className="max-w-[60ch] text-sm leading-relaxed text-text-muted">
              Share a link to your post during an open window and an admin will review it for points.
            </p>
          </div>

          {windows.length === 0 ? (
            <p className="text-sm text-text-muted">No social windows are open right now.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {windows.map((socialWindow) => (
                <WindowCard
                  key={socialWindow.id}
                  window={socialWindow}
                  submission={submissionByWindowId.get(socialWindow.id) ?? null}
                  onUpdated={applySubmission}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function WindowCard({
  window: socialWindow,
  submission,
  onUpdated,
}: {
  window: SocialWindowRow;
  submission: SocialSubmissionRow | null;
  onUpdated: (submission: SocialSubmissionRow) => void;
}) {
  const [url, setUrl] = useState(submission?.status === "sent_back" ? submission.post_url : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showForm = !submission || submission.status === "sent_back";
  const canSubmit = !busy && url.trim().length > 0 && isValidUrl(url.trim());

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/social-submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ windowId: socialWindow.id, postUrl: url.trim() }),
    });
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      setError(data?.error ?? "Could not submit.");
      return;
    }
    onUpdated(data.submission);
  }

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border-hairline bg-surface-card p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-display text-base font-bold tracking-tight text-text-strong">{socialWindow.title}</span>
        {socialWindow.platform && (
          <span className="rounded-full bg-surface-sunken px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-text-muted uppercase">
            {socialWindow.platform}
          </span>
        )}
      </div>

      {showForm ? (
        <>
          {submission?.status === "sent_back" && (
            <div className="flex flex-col gap-1.5 rounded-card-inner border border-aa-red-500/30 bg-surface-danger-soft p-4">
              <span className="font-mono text-[11px] font-bold tracking-widest text-aa-red-700 uppercase">Sent back</span>
              {submission.admin_comment && (
                <p
                  dir={isArabicText(submission.admin_comment) ? "rtl" : "ltr"}
                  className="text-sm text-aa-red-700 text-pretty"
                >
                  {submission.admin_comment}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-text-strong">Post URL</span>
            <input
              type="url"
              placeholder="https://"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-11 rounded-control border border-border-hairline-strong bg-surface-card px-3.5 font-mono text-sm text-text-strong"
            />
          </div>

          {error && <p className="text-sm text-aa-red-700">{error}</p>}

          <button
            type="button"
            disabled={!canSubmit}
            onClick={submit}
            className="inline-flex h-10 w-fit items-center rounded-control bg-surface-brand px-5 text-sm font-semibold text-text-inverse disabled:opacity-40"
          >
            {busy ? "Submitting…" : submission?.status === "sent_back" ? "Resubmit" : "Submit"}
          </button>
        </>
      ) : submission.status === "pending" ? (
        <div className="rounded-card-inner bg-surface-sunken px-4 py-3 text-sm text-text-muted">Waiting for review</div>
      ) : (
        <div className="flex items-center gap-3 rounded-card-inner bg-surface-brand-soft px-4 py-3">
          <span className="text-aa-green-700">✓</span>
          <span className="text-sm font-semibold text-aa-green-800">Approved · {submission.points_awarded ?? 0} pts</span>
        </div>
      )}
    </div>
  );
}
