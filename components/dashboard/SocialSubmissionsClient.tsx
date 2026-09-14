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

  // A student can have any number of submissions per window, so this is a
  // one-to-many grouping (unlike the old one-to-one submissionByWindowId
  // map from before the unique (window_id, student_id) constraint was
  // dropped).
  const submissionsByWindowId = useMemo(() => {
    const map = new Map<string, SocialSubmissionRow[]>();
    for (const submission of submissions) {
      const list = map.get(submission.window_id);
      if (list) list.push(submission);
      else map.set(submission.window_id, [submission]);
    }
    return map;
  }, [submissions]);

  const addSubmission = useCallback((submission: SocialSubmissionRow) => {
    setSubmissions((prev) => [submission, ...prev]);
  }, []);

  const replaceSubmission = useCallback((submission: SocialSubmissionRow) => {
    setSubmissions((prev) => prev.map((s) => (s.id === submission.id ? submission : s)));
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
              Share links to your posts during an open window and an admin will review each one for points.
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
                  submissions={submissionsByWindowId.get(socialWindow.id) ?? []}
                  onCreated={addSubmission}
                  onUpdated={replaceSubmission}
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
  submissions,
  onCreated,
  onUpdated,
}: {
  window: SocialWindowRow;
  submissions: SocialSubmissionRow[];
  onCreated: (submission: SocialSubmissionRow) => void;
  onUpdated: (submission: SocialSubmissionRow) => void;
}) {
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

      {submissions.length > 0 && (
        <div className="flex flex-col gap-2">
          {submissions.map((submission) => (
            <SubmissionRow key={submission.id} submission={submission} onUpdated={onUpdated} />
          ))}
        </div>
      )}

      <AddPostForm windowId={socialWindow.id} onCreated={onCreated} />
    </div>
  );
}

function StatusBadge({ submission }: { submission: SocialSubmissionRow }) {
  if (submission.status === "approved") {
    return (
      <span className="flex-none rounded-full bg-surface-brand-soft px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wide text-aa-green-800 uppercase">
        Approved · {submission.points_awarded ?? 0} pts
      </span>
    );
  }
  if (submission.status === "sent_back") {
    return (
      <span className="flex-none rounded-full bg-surface-danger-soft px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wide text-aa-red-700 uppercase">
        Sent back
      </span>
    );
  }
  return (
    <span className="flex-none rounded-full bg-surface-sunken px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wide text-text-muted uppercase">
      Waiting for review
    </span>
  );
}

function SubmissionRow({
  submission,
  onUpdated,
}: {
  submission: SocialSubmissionRow;
  onUpdated: (submission: SocialSubmissionRow) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(submission.post_url);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = !busy && url.trim().length > 0 && isValidUrl(url.trim());

  async function save() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/social-submissions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissionId: submission.id, postUrl: url.trim() }),
    });
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      setError(data?.error ?? "Could not update.");
      return;
    }
    setEditing(false);
    onUpdated(data.submission);
  }

  function cancel() {
    setEditing(false);
    setUrl(submission.post_url);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-2 rounded-card-inner border border-border-hairline bg-surface-card p-3">
      {editing ? (
        <>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-10 rounded-control border border-border-hairline-strong bg-surface-card px-3 font-mono text-sm text-text-strong"
          />
          {error && <p className="text-xs text-aa-red-700">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!canSave}
              onClick={save}
              className="inline-flex h-9 items-center rounded-control bg-surface-brand px-4 text-xs font-semibold text-text-inverse disabled:opacity-40"
            >
              {busy ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="inline-flex h-9 items-center rounded-control px-3 text-xs font-semibold text-text-body hover:bg-surface-hover"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={submission.post_url}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 flex-1 truncate font-mono text-xs text-text-accent underline"
          >
            {submission.post_url}
          </a>
          <StatusBadge submission={submission} />
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex-none text-xs font-semibold text-text-accent underline"
          >
            Edit
          </button>
        </div>
      )}

      {!editing && submission.status === "sent_back" && submission.admin_comment && (
        <p dir={isArabicText(submission.admin_comment) ? "rtl" : "ltr"} className="text-xs text-aa-red-700 text-pretty">
          {submission.admin_comment}
        </p>
      )}
    </div>
  );
}

function AddPostForm({ windowId, onCreated }: { windowId: string; onCreated: (submission: SocialSubmissionRow) => void }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !busy && url.trim().length > 0 && isValidUrl(url.trim());

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/social-submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ windowId, postUrl: url.trim() }),
    });
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      setError(data?.error ?? "Could not submit.");
      return;
    }
    setUrl("");
    onCreated(data.submission);
  }

  return (
    <div className="flex flex-col gap-1.5 border-t border-border-hairline pt-3">
      <span className="text-xs font-semibold text-text-strong">Add another post</span>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="url"
          placeholder="https://"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="h-10 min-w-0 flex-1 rounded-control border border-border-hairline-strong bg-surface-card px-3.5 font-mono text-sm text-text-strong"
        />
        <button
          type="button"
          disabled={!canSubmit}
          onClick={submit}
          className="inline-flex h-10 flex-none items-center rounded-control bg-surface-brand px-4 text-sm font-semibold text-text-inverse disabled:opacity-40"
        >
          {busy ? "Submitting…" : "Submit"}
        </button>
      </div>
      {error && <p className="text-xs text-aa-red-700">{error}</p>}
    </div>
  );
}
