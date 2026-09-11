"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Avatar } from "@/components/ui/Avatar";

type Level = "base" | "medium" | "hard";

const LEVEL_META: Record<Level, { label: string; dot: string }> = {
  base: { label: "Base", dot: "border border-border-hairline-strong bg-white" },
  medium: { label: "Medium", dot: "bg-aa-amber-400" },
  hard: { label: "Hard", dot: "bg-aa-green-600" },
};

const BONUS_OPTIONS = [0, 5, 10, 20];

interface AdminSubmissionRow {
  id: string;
  task_id: string;
  student_id: string;
  status: string;
  level: Level | null;
  bonus_points: number;
  submission_link: string | null;
  submission_file_name: string | null;
  submission_file_size_bytes: number | null;
  submission_note: string | null;
  admin_note: string | null;
  points_awarded: number | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  task_title: string;
  task_submission_format: string;
  task_points_base: number | null;
  task_points_medium: number | null;
  task_points_hard: number | null;
  student_username: string | null;
  student_avatar_url: string | null;
}

function offeredLevels(row: AdminSubmissionRow): Level[] {
  const levels: Level[] = [];
  if (row.task_points_base !== null) levels.push("base");
  if (row.task_points_medium !== null) levels.push("medium");
  if (row.task_points_hard !== null) levels.push("hard");
  return levels;
}

function levelPoints(row: AdminSubmissionRow, level: Level) {
  if (level === "base") return row.task_points_base ?? 0;
  if (level === "medium") return row.task_points_medium ?? 0;
  return row.task_points_hard ?? 0;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AdminTaskBoardClient() {
  const [pending, setPending] = useState<AdminSubmissionRow[] | null>(null);
  const [approved, setApproved] = useState<AdminSubmissionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/admin/task-board/submissions").then((r) => r.json()),
      fetch("/api/admin/task-board/submissions?status=approved").then((r) => r.json()),
    ])
      .then(([pendingRes, approvedRes]) => {
        setPending(pendingRes.submissions ?? []);
        setApproved(approvedRes.submissions ?? []);
      })
      .catch(() => {
        setPending([]);
        setApproved([]);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Reconciles a single updated row into the right list (or out of both,
  // for a send_back -- that row isn't "awaiting review" anymore, nor
  // "graded", until the student resubmits) without a full reload.
  const replaceRow = useCallback((updated: AdminSubmissionRow) => {
    setPending((prev) => (prev ?? []).filter((r) => r.id !== updated.id));
    setApproved((prev) => (prev ?? []).filter((r) => r.id !== updated.id));
    if (updated.status === "approved") {
      setApproved((prev) => [updated, ...(prev ?? [])]);
    } else if (updated.status === "submitted" || updated.status === "reviewing") {
      setPending((prev) => [updated, ...(prev ?? [])]);
    }
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
              Task board review
            </h1>
            <p className="max-w-[60ch] text-sm leading-relaxed text-text-muted">
              Approve a submission at a level, with an optional bonus or a full points override, or send it back with
              a note the student will see.
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
                  <SubmissionReviewCard key={row.id} row={row} onResolved={replaceRow} onError={setError} />
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t-2 border-border-hairline pt-8">
            <span className="font-mono text-[11px] font-bold tracking-widest text-text-strong uppercase">
              Graded {approved ? `(${approved.length})` : ""}
            </span>
            {approved === null ? (
              <div className="h-16 animate-pulse rounded-card bg-surface-sunken" />
            ) : approved.length === 0 ? (
              <p className="text-sm text-text-muted">Nothing graded yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {approved.map((row) => (
                  <ApprovedRow key={row.id} row={row} onResolved={replaceRow} onError={setError} />
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

function SubmissionReviewCard({
  row,
  onResolved,
  onError,
}: {
  row: AdminSubmissionRow;
  onResolved: (row: AdminSubmissionRow) => void;
  onError: (msg: string) => void;
}) {
  const levels = offeredLevels(row);
  const [level, setLevel] = useState<Level>(row.level && levels.includes(row.level) ? row.level : levels[0]);
  const [bonus, setBonus] = useState(row.bonus_points ?? 0);
  const [override, setOverride] = useState("");
  const [busy, setBusy] = useState(false);
  const [sendingBack, setSendingBack] = useState(false);
  const [note, setNote] = useState("");

  async function openFile() {
    const res = await fetch(`/api/admin/task-board/submissions/${row.id}/file`);
    const data = await res.json().catch(() => null);
    if (res.ok && data?.url) window.open(data.url, "_blank", "noopener,noreferrer");
    else onError(data?.error ?? "Could not open file.");
  }

  async function approve() {
    const body: Record<string, unknown> = { action: "approve", level, bonusPoints: bonus };
    if (override.trim()) {
      const parsed = Number(override.trim());
      if (!Number.isInteger(parsed) || parsed < 0) {
        onError("Points override must be a non-negative whole number.");
        return;
      }
      body.pointsOverride = parsed;
    }
    setBusy(true);
    onError("");
    const res = await fetch(`/api/admin/task-board/submissions/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      onError(data?.error ?? "Could not approve.");
      return;
    }
    onResolved(data.submission);
  }

  async function sendBack() {
    if (!note.trim()) {
      onError("A note is required when sending back.");
      return;
    }
    setBusy(true);
    onError("");
    const res = await fetch(`/api/admin/task-board/submissions/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_back", note: note.trim() }),
    });
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      onError(data?.error ?? "Could not send back.");
      return;
    }
    onResolved(data.submission);
  }

  const overrideValue = override.trim() ? Number(override.trim()) : null;
  const total = overrideValue !== null && Number.isInteger(overrideValue) ? overrideValue : levelPoints(row, level) + bonus;

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
          <span className="font-mono text-[11px] text-text-faint">{formatDate(row.submitted_at)}</span>
        </div>
        <span className="flex-1" />
        <span className="text-sm font-semibold text-text-strong">{row.task_title}</span>
      </div>

      <div className="flex items-center gap-3 rounded-card-inner bg-surface-sunken px-4 py-3">
        {row.task_submission_format === "link" ? (
          <a
            href={row.submission_link ?? "#"}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 flex-1 truncate font-mono text-sm text-text-accent underline"
          >
            {row.submission_link}
          </a>
        ) : (
          <>
            <span className="min-w-0 flex-1 truncate font-mono text-sm text-text-strong">
              {row.submission_file_name ?? "No file"}
              {row.submission_file_size_bytes ? ` · ${formatSize(row.submission_file_size_bytes)}` : ""}
            </span>
            <button
              type="button"
              onClick={openFile}
              className="flex-none rounded-control border border-border-hairline-strong bg-surface-card px-3 py-1.5 text-xs font-semibold text-text-strong hover:bg-surface-hover"
            >
              Open
            </button>
          </>
        )}
      </div>

      {row.submission_note && <p className="text-sm text-text-body">{row.submission_note}</p>}

      <div className="flex flex-col gap-2">
        <span className="font-mono text-[11px] font-bold tracking-widest text-text-muted uppercase">Approve at level</span>
        <div className="flex flex-wrap gap-2">
          {levels.map((lv) => {
            const meta = LEVEL_META[lv];
            const active = level === lv;
            return (
              <button
                key={lv}
                type="button"
                onClick={() => setLevel(lv)}
                className={`inline-flex h-9 items-center gap-2 rounded-full border-2 px-3 text-xs font-semibold transition-colors ${
                  active
                    ? "border-surface-brand bg-surface-brand-soft text-aa-green-800"
                    : "border-border-hairline bg-surface-card text-text-body"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                {meta.label}
                <span className="font-mono opacity-75">{levelPoints(row, lv)} pts</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-[11px] font-bold tracking-widest text-text-muted uppercase">Bonus</span>
        <div className="flex gap-1.5">
          {BONUS_OPTIONS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBonus(b)}
              className={`h-7 rounded-full px-3 font-mono text-xs font-bold transition-colors ${
                bonus === b ? "bg-surface-accent-soft text-aa-amber-700" : "bg-surface-sunken text-text-muted"
              }`}
            >
              {b === 0 ? "None" : `+${b}`}
            </button>
          ))}
        </div>
        <span className="flex-1" />
        <label className="flex items-center gap-2 font-mono text-xs text-text-muted">
          Override
          <input
            type="number"
            min={0}
            step={1}
            placeholder={String(levelPoints(row, level) + bonus)}
            value={override}
            onChange={(e) => setOverride(e.target.value)}
            className="w-20 rounded-control border border-border-hairline-strong bg-surface-card px-2 py-1 font-mono text-xs text-text-strong"
          />
        </label>
        <span className="font-mono text-sm font-bold text-text-strong">{total} pts total</span>
      </div>

      {sendingBack && (
        <div className="flex flex-col gap-2 rounded-card-inner border border-aa-red-500/30 bg-surface-danger-soft p-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
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
              disabled={busy || !note.trim()}
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
          disabled={busy}
          onClick={approve}
          className="rounded-control bg-surface-brand px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-surface-brand-hover disabled:opacity-40"
        >
          {busy ? "Working…" : "Approve"}
        </button>
      </div>
    </div>
  );
}

function ApprovedRow({
  row,
  onResolved,
  onError,
}: {
  row: AdminSubmissionRow;
  onResolved: (row: AdminSubmissionRow) => void;
  onError: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function reopen() {
    setBusy(true);
    const res = await fetch(`/api/admin/task-board/submissions/${row.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reopen" }),
    });
    const data = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) {
      onError(data?.error ?? "Could not reopen.");
      return;
    }
    onResolved(data.submission);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-card-inner border border-border-hairline bg-surface-card px-4 py-3">
      <div className="min-w-0 flex-1">
        <span className="font-mono text-[10px] tracking-widest text-text-faint uppercase">
          @{row.student_username ?? "student"} · {row.points_awarded ?? 0} pts · {formatDate(row.reviewed_at)}
        </span>
        <div className="truncate text-sm font-semibold text-text-strong">{row.task_title}</div>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={reopen}
        className="flex-none rounded-control border border-border-hairline-strong px-3 py-1.5 text-xs font-semibold text-text-strong hover:bg-surface-hover disabled:opacity-40"
      >
        {busy ? "Working…" : "Reopen"}
      </button>
    </div>
  );
}
