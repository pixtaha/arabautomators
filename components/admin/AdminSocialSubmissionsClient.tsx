"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Avatar } from "@/components/ui/Avatar";

const POINT_PRESETS = [5, 10, 20, 30];

interface AdminSocialSubmissionRow {
  id: string;
  window_id: string;
  student_id: string;
  post_url: string;
  status: string;
  admin_comment: string | null;
  points_awarded: number | null;
  reviewed_at: string | null;
  created_at: string;
  window_title: string;
  student_username: string | null;
  student_avatar_url: string | null;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// Same mixed Arabic/English detection as AdminTaskBoardSubmissionsClient.tsx,
// duplicated locally per this codebase's existing convention rather than
// imported (see that file's own comment on why).
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

export function AdminSocialSubmissionsClient() {
  const [pending, setPending] = useState<AdminSocialSubmissionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/social-submissions")
      .then((r) => r.json())
      .then((data) => setPending(data.submissions ?? []))
      .catch(() => setPending([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const removeRow = useCallback((id: string) => {
    setPending((prev) => (prev ?? []).filter((r) => r.id !== id));
  }, []);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
      <Header />

      <main className="relative flex-1 overflow-hidden">
        <div className="bg-dots mask-fade-b absolute inset-0 bg-surface-page" />
        <div className="relative mx-auto flex max-w-[880px] flex-col gap-8 px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
              Internal · admin only
            </span>
            <h1 className="font-display text-[32px] font-extrabold tracking-[-0.03em] text-text-strong">
              Social submissions
            </h1>
            <p className="max-w-[60ch] text-sm leading-relaxed text-text-muted">
              Approve a submitted post with a points award, or send it back with a comment the student will see.
            </p>
          </div>

          {error && <p className="text-xs font-medium text-aa-red-700">{error}</p>}

          <div className="flex flex-col gap-3">
            <span className="font-mono text-[11px] font-bold tracking-widest text-text-strong uppercase">
              Awaiting review {pending ? `(${pending.length})` : ""}
            </span>
            {pending === null ? (
              <div className="h-24 animate-pulse rounded-card bg-surface-sunken" />
            ) : pending.length === 0 ? (
              <p className="text-sm text-text-muted">Nothing waiting right now.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {pending.map((row) => (
                  <SubmissionCard key={row.id} row={row} onResolved={removeRow} onError={setError} />
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

function SubmissionCard({
  row,
  onResolved,
  onError,
}: {
  row: AdminSocialSubmissionRow;
  onResolved: (id: string) => void;
  onError: (msg: string) => void;
}) {
  const [points, setPoints] = useState(POINT_PRESETS[0]);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const [sendingBack, setSendingBack] = useState(false);
  const [comment, setComment] = useState("");

  const effectivePoints = custom.trim() ? Number(custom.trim()) : points;
  const pointsValid = Number.isInteger(effectivePoints) && effectivePoints >= 0;

  async function approve() {
    if (!pointsValid) {
      onError("Points must be a non-negative whole number.");
      return;
    }
    setBusy(true);
    onError("");
    const res = await fetch(`/api/admin/social-submissions/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve", points: effectivePoints }),
    });
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      onError(data?.error ?? "Could not approve.");
      return;
    }
    onResolved(row.id);
  }

  async function sendBack() {
    if (!comment.trim()) {
      onError("A comment is required when sending back.");
      return;
    }
    setBusy(true);
    onError("");
    const res = await fetch(`/api/admin/social-submissions/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_back", comment: comment.trim() }),
    });
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      onError(data?.error ?? "Could not send back.");
      return;
    }
    onResolved(row.id);
  }

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border-hairline bg-surface-card p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid h-9 w-9 flex-none place-items-center overflow-hidden rounded-full bg-surface-brand-soft font-display text-xs font-bold text-text-accent">
          {row.student_avatar_url ? (
            <Avatar src={row.student_avatar_url} alt={row.student_username ?? ""} className="h-full w-full" />
          ) : (
            (row.student_username ?? "?").charAt(0).toUpperCase()
          )}
        </span>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-text-strong">@{row.student_username ?? "student"}</span>
          <span className="font-mono text-[11px] text-text-faint">{formatDate(row.created_at)}</span>
        </div>
        <span className="flex-1" />
        <span className="text-sm font-semibold text-text-strong">{row.window_title}</span>
      </div>

      <div className="flex items-center gap-3 rounded-card-inner bg-surface-sunken px-4 py-3">
        <span className="font-mono text-[10px] tracking-widest text-text-faint uppercase">Post</span>
        <a
          href={row.post_url}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 flex-1 truncate font-mono text-sm text-text-accent underline"
        >
          {row.post_url}
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-[11px] font-bold tracking-widest text-text-muted uppercase">Points</span>
        <div className="flex gap-1.5">
          {POINT_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPoints(p);
                setCustom("");
              }}
              className={`h-8 rounded-full px-3 font-mono text-xs font-bold transition-colors ${
                !custom.trim() && points === p ? "bg-surface-brand-soft text-aa-green-800" : "bg-surface-sunken text-text-muted"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 font-mono text-xs text-text-muted">
          Custom
          <input
            type="number"
            min={0}
            step={1}
            placeholder="0"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="w-20 rounded-control border border-border-hairline-strong bg-surface-card px-2 py-1 font-mono text-xs text-text-strong"
          />
        </label>
        <span className="flex-1" />
        <span className="font-mono text-sm font-bold text-text-strong">{pointsValid ? effectivePoints : "—"} pts</span>
      </div>

      {sendingBack && (
        <div className="flex flex-col gap-2 rounded-card-inner border border-aa-red-500/30 bg-surface-danger-soft p-3">
          <textarea
            dir={isArabicText(comment) ? "rtl" : "ltr"}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What does the student need to fix?"
            rows={2}
            className="rounded-control border border-border-hairline bg-surface-card p-2 text-sm text-text-body"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSendingBack(false)}
              className="rounded-control px-3 py-1.5 text-xs font-semibold text-text-body hover:bg-surface-hover"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || !comment.trim()}
              onClick={sendBack}
              className="rounded-control bg-aa-red-500 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              {busy ? "Sending…" : "Confirm send back"}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2 border-t border-border-hairline pt-3">
        {!sendingBack && (
          <button
            type="button"
            onClick={() => setSendingBack(true)}
            disabled={busy}
            className="rounded-control border border-border-hairline-strong px-4 py-2 text-sm font-semibold text-aa-red-700 hover:border-aa-red-500 hover:bg-surface-danger-soft disabled:opacity-40"
          >
            Send back
          </button>
        )}
        <button
          type="button"
          disabled={busy || !pointsValid}
          onClick={approve}
          className="rounded-control bg-surface-brand px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-surface-brand-hover disabled:opacity-40"
        >
          {busy ? "Working…" : "Approve"}
        </button>
      </div>
    </div>
  );
}
