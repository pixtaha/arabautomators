"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Avatar } from "@/components/ui/Avatar";
import { Header } from "@/components/layout/Header";
import type {
  SubmissionFileKind,
  TaskBoardLevel,
  TaskBoardResourceRow,
  TaskBoardStatus,
  TaskBoardSubmissionRow,
  TaskBoardTaskRow,
  TaskCompletionAvatar,
} from "@/lib/data/taskBoard";

// One entry per requires_* flag that still corresponds to a single-value
// file upload (link is handled separately -- it's text, not a file).
interface PrimaryFileKindMeta {
  kind: SubmissionFileKind;
  label: string;
  accept?: string;
}
const PRIMARY_FILE_KINDS: PrimaryFileKindMeta[] = [
  { kind: "pdf", label: "PDF", accept: "application/pdf" },
  { kind: "image", label: "Image", accept: "image/png,image/jpeg,image/webp" },
  { kind: "video", label: "Video", accept: "video/*" },
  { kind: "file", label: "File" },
];

function taskRequiresKind(task: TaskBoardTaskRow, kind: SubmissionFileKind): boolean {
  if (kind === "pdf") return task.requires_pdf;
  if (kind === "image") return task.requires_image;
  if (kind === "video") return task.requires_video;
  return task.requires_file;
}

function submissionFileNameForKind(submission: TaskBoardSubmissionRow | null, kind: SubmissionFileKind): string | null {
  if (!submission) return null;
  if (kind === "pdf") return submission.submission_pdf_name;
  if (kind === "image") return submission.submission_image_name;
  if (kind === "video") return submission.submission_video_name;
  return submission.submission_file_name;
}

// Admin-settable hint for what file a given upload box actually expects
// (e.g. "Exported workflow JSON") -- falls back to the generic
// "Choose a <kind> to upload" copy at the call site when null.
function submissionLabelForKind(task: TaskBoardTaskRow, kind: SubmissionFileKind): string | null {
  if (kind === "pdf") return task.submission_pdf_label;
  if (kind === "image") return task.submission_image_label;
  if (kind === "video") return task.submission_video_label;
  return task.submission_file_label;
}

// Levels a resource is visible for -- 'general' resources show regardless
// of the currently-selected level, matching descriptionForLevel/
// checklistForLevel's own fallback reasoning just above.
function resourceVisibleForLevel(resource: TaskBoardResourceRow, level: TaskBoardLevel): boolean {
  return resource.scope === "general" || (resource.levels?.includes(level) ?? false);
}

const LEVEL_META: Record<
  TaskBoardLevel,
  { label: string; dot: string; borderVar: string; chipBg: string; chipBorder: string; chipText: string }
> = {
  base: {
    label: "Base",
    dot: "border border-border-hairline-strong bg-white",
    borderVar: "var(--color-aa-neutral-400)",
    chipBg: "bg-surface-sunken",
    chipBorder: "border-border-hairline-strong",
    chipText: "text-text-body",
  },
  medium: {
    label: "Medium",
    dot: "bg-aa-amber-400",
    borderVar: "var(--color-aa-amber-400)",
    chipBg: "bg-surface-accent-soft",
    chipBorder: "border-aa-amber-300",
    chipText: "text-aa-amber-700",
  },
  hard: {
    label: "Hard",
    dot: "bg-aa-green-600",
    borderVar: "var(--color-aa-green-600)",
    chipBg: "bg-surface-brand-soft",
    chipBorder: "border-aa-green-200",
    chipText: "text-aa-green-800",
  },
};

// Hard's "completed" card color is fixed (not admin-configurable) --
// matches --color-aa-green-600 / --color-surface-brand in app/globals.css,
// the same green already used for Hard's own dot/border elsewhere on this
// page, and --color-text-inverse for the white text.
const HARD_COMPLETED_BG = "#007858";
const HARD_COMPLETED_TEXT = "#ffffff";

// Picks readable text color for an arbitrary admin-picked background hex
// via a standard relative-luminance approximation -- not full WCAG
// contrast-ratio compliance, just a reasonable binary black/white choice
// so a custom Base/Medium color stays legible without needing a second
// "text color" control in the admin form. #000000/#ffffff match
// --color-text-strong/--color-text-inverse.
function contrastTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#000000" : "#ffffff";
}

// "Completed" means locked (status = 'approved') specifically -- submitted/
// reviewing don't count, even though they share the "Completed" column
// label below. Returns null (no color override, card keeps its plain
// background) whenever the task isn't locked, is at Hard but somehow has
// no offered level, or the admin never set a color for this level.
function completedCardColor(task: TaskBoardTaskRow, level: TaskBoardLevel, locked: boolean): { bg: string; text: string } | null {
  if (!locked) return null;
  if (level === "hard") return { bg: HARD_COMPLETED_BG, text: HARD_COMPLETED_TEXT };
  const customBg = level === "base" ? task.completed_color_base : task.completed_color_medium;
  return customBg ? { bg: customBg, text: contrastTextColor(customBg) } : null;
}

type ColumnKey = "todo" | "progress" | "submitted" | "reviewed";

const COLUMN_DEFS: { key: ColumnKey; label: string; emptyHint: string }[] = [
  { key: "todo", label: "To do", emptyHint: "Nothing waiting." },
  { key: "progress", label: "In progress", emptyHint: "Drag a task here to start it." },
  { key: "submitted", label: "Completed", emptyHint: "Drag here when you have submitted." },
  { key: "reviewed", label: "Reviewed", emptyHint: "Nothing reviewed yet." },
];

// 'progress' alone just means the student placed it there themselves;
// admin_note only gets set by an admin's "send back" action, so a
// submission sitting in 'progress' with a note attached means "sent back
// for changes" -- the admin has acted on it, so it belongs in Reviewed
// alongside approved submissions, not In progress. 'reviewing' groups with
// 'submitted' under Completed: it's only ever reached via the admin
// "reopen" action on a previously-approved row, i.e. it's back in flux
// awaiting a fresh decision, same as a first-time submission.
function columnKeyForTask(status: TaskBoardStatus, sentBack: boolean): ColumnKey {
  if (status === "todo") return "todo";
  if (status === "progress") return sentBack ? "reviewed" : "progress";
  if (status === "submitted" || status === "reviewing") return "submitted";
  return "reviewed"; // approved
}

// Long titles at the card's ~16px display font wrap to 3 lines in the
// grid's ~260px title column at text-base -- past this length, dropping to
// text-sm buys back enough characters-per-line to usually save a line,
// without touching the vast majority of titles that already fit fine.
const LONG_TITLE_CHAR_THRESHOLD = 40;

function levelPoints(task: TaskBoardTaskRow, level: TaskBoardLevel) {
  if (level === "base") return task.points_base ?? 0;
  if (level === "medium") return task.points_medium ?? 0;
  return task.points_hard ?? 0;
}

function offeredLevels(task: TaskBoardTaskRow): TaskBoardLevel[] {
  const levels: TaskBoardLevel[] = [];
  if (task.points_base !== null) levels.push("base");
  if (task.points_medium !== null) levels.push("medium");
  if (task.points_hard !== null) levels.push("hard");
  return levels;
}

function formatDue(endAt: string | null) {
  if (!endAt) return null;
  return `Due ${new Date(endAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

function formatStart(startAt: string | null) {
  if (!startAt) return null;
  return `Starts ${new Date(startAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}

function isNotYetStarted(task: TaskBoardTaskRow) {
  return Boolean(task.start_at) && new Date(task.start_at as string).getTime() > Date.now();
}

// Same mixed Arabic/English detection as SessionNotesCard.tsx, but counted
// per WORD rather than per character. A character-count comparison breaks
// down on this app's task descriptions, which are Arabic prose heavily
// larded with English API jargon and raw URLs (e.g. "استخدم GET
// /v1/products مع Query Parameters: category=computers, in_stock=true,
// sort=-rating") -- a single URL or a run of comma-separated params can
// rack up far more Latin *characters* than the surrounding Arabic sentence
// has, even though a human reads the whole thing as Arabic. Classifying by
// whole words (a word counts as Arabic if it contains any Arabic
// character at all) tracks how the paragraph actually reads much more
// reliably than raw character counts do.
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
  // Ties resolve to Arabic, not Latin -- this platform's content is
  // Arabic-first with English technical terms mixed in, so an even split
  // should still read as an Arabic paragraph rather than default to LTR.
  return arabicWords >= latinWords;
}

// Levels are genuinely different scope, not just a point multiplier on
// identical work, so each level can carry its own description/checklist.
// Falls back to the task's general description/checklist when the
// level-specific one is null -- keeps a task rendering sensibly even
// before per-level content has been filled in for every enabled level.
function descriptionForLevel(task: TaskBoardTaskRow, level: TaskBoardLevel) {
  const perLevel =
    level === "base" ? task.description_base : level === "medium" ? task.description_medium : task.description_hard;
  return perLevel ?? task.description;
}

function checklistForLevel(task: TaskBoardTaskRow, level: TaskBoardLevel) {
  const perLevel = level === "base" ? task.checklist_base : level === "medium" ? task.checklist_medium : task.checklist_hard;
  return perLevel && perLevel.length > 0 ? perLevel : task.checklist;
}

// A description with 2+ non-empty lines renders as a numbered list
// (similar container treatment to the "What is expected" checklist below
// it) instead of one dense paragraph -- admins already write multi-line
// content elsewhere on this form (the checklist textarea is literally "one
// item per line"), so this needs no new authoring convention, and a
// single-line description (every live task today) still renders as a
// plain paragraph exactly as before. Deliberately newline-based rather
// than detecting a "1. "/"1) " pattern within a run-on string: these
// descriptions already mix Arabic prose with raw URLs and API params
// (e.g. "category=computers, in_stock=true"), which makes a numeric-prefix
// regex genuinely risky to false-positive on.
function descriptionListItems(description: string): string[] | null {
  const lines = description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.length >= 2 ? lines : null;
}

const AVATAR_STACK_MAX = 4;

// Who has turned this task in -- public social proof among students, not
// an admin-only view, so it only ever renders username/avatar_url (never
// email, points, or submission content). Same fallback-initial pattern as
// LeaderboardCard.tsx: a colored circle with the first letter when there's
// no avatar_url. `size` (px) is the only thing that varies between the
// card (default, 24px) and the detail modal (36px) -- same overlap ratio,
// same +N behavior, same data, at both sizes.
function AvatarStack({ people, size = 24 }: { people: TaskCompletionAvatar[]; size?: number }) {
  if (people.length === 0) return null;
  const visible = people.slice(0, AVATAR_STACK_MAX);
  const overflow = people.length - visible.length;
  const overlap = Math.round(size * 0.42);
  const fontSize = Math.max(9, Math.round(size * 0.42));

  return (
    <div className="flex items-center">
      {visible.map((p, i) => (
        <span
          key={p.student_id}
          title={p.username ?? "Student"}
          style={{ width: size, height: size, marginLeft: i === 0 ? 0 : -overlap, fontSize }}
          className="grid flex-none place-items-center overflow-hidden rounded-full border-2 border-surface-card bg-surface-brand-soft font-display font-bold text-text-accent"
        >
          {p.avatar_url ? (
            <Avatar src={p.avatar_url} alt={p.username ?? ""} className="h-full w-full" />
          ) : (
            (p.username ?? "?").charAt(0).toUpperCase()
          )}
        </span>
      ))}
      {overflow > 0 && (
        <span
          style={{ width: size, height: size, marginLeft: -overlap, fontSize: Math.max(8, Math.round(size * 0.32)) }}
          className="grid flex-none place-items-center rounded-full border-2 border-surface-card bg-surface-sunken font-mono font-bold text-text-muted"
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

function withoutKey<T>(map: Record<string, T>, key: string): Record<string, T> {
  if (!(key in map)) return map;
  const next = { ...map };
  delete next[key];
  return next;
}

async function postJson(taskId: string, body: unknown) {
  const res = await fetch(`/api/task-board/tasks/${taskId}/submission`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.submission) return { ok: false as const, error: data?.error as string | undefined };
  return { ok: true as const, submission: data.submission as TaskBoardSubmissionRow };
}

// XHR (not fetch) specifically so upload progress is observable, matching
// the convention in lib/imageUpload.ts / SessionResourcesAdminClient.tsx.
function postWithProgress(
  taskId: string,
  formData: FormData,
  onProgress: (percent: number) => void,
): Promise<{ ok: true; submission: TaskBoardSubmissionRow } | { ok: false; error?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/task-board/tasks/${taskId}/submission`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.onload = () => {
      let data: { submission?: TaskBoardSubmissionRow; error?: string } = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        // leave data empty; handled by the status check below
      }
      if (xhr.status >= 200 && xhr.status < 300 && data.submission) {
        resolve({ ok: true, submission: data.submission });
      } else {
        resolve({ ok: false, error: data.error });
      }
    };
    xhr.onerror = () => resolve({ ok: false, error: "Upload failed. Check your connection and try again." });
    xhr.send(formData);
  });
}

interface TaskBoardClientProps {
  initialTasks: TaskBoardTaskRow[];
  initialSubmissions: TaskBoardSubmissionRow[];
  initialCompletions: Record<string, TaskCompletionAvatar[]>;
  initialResources: Record<string, TaskBoardResourceRow[]>;
}

export function TaskBoardClient({ initialTasks, initialSubmissions, initialCompletions, initialResources }: TaskBoardClientProps) {
  const [tasks] = useState(initialTasks);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [completions, setCompletions] = useState(initialCompletions);
  const [resources] = useState(initialResources);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Drag-and-drop column moves used to wait on the full moveStatus network
  // round trip before the card visually moved -- it'd snap back to its
  // original column on drop, then jump to the new one once the request
  // resolved. This overlays a same-tick optimistic status on top of
  // submissionByTaskId below, cleared once the real request settles either
  // way (reconciled with the server's row on success, rolled back on
  // failure) -- a separate small map rather than synthesizing a fake
  // TaskBoardSubmissionRow, since column placement only ever reads .status.
  const [optimisticStatus, setOptimisticStatus] = useState<Record<string, TaskBoardStatus>>({});
  // Set when a drag onto "Completed" auto-opens the submission modal
  // (below) instead of moving the card directly -- distinguishes "closed
  // without submitting, revert to In progress" from "actually submitted",
  // since a mid-modal level change also writes a row without really
  // submitting and must not be mistaken for a real submit.
  const [pendingSubmitTaskId, setPendingSubmitTaskId] = useState<string | null>(null);
  const movingTaskIds = useRef(new Set<string>());

  const submissionByTaskId = useMemo(() => {
    const map = new Map<string, TaskBoardSubmissionRow>();
    for (const submission of submissions) map.set(submission.task_id, submission);
    return map;
  }, [submissions]);

  const statusForTask = useCallback(
    (taskId: string): TaskBoardStatus => optimisticStatus[taskId] ?? submissionByTaskId.get(taskId)?.status ?? "todo",
    [optimisticStatus, submissionByTaskId],
  );

  // Deliberately reads the raw submission, not statusForTask's optimistic
  // overlay -- a drag move never touches admin_note, so there's nothing to
  // optimistically predict here, only the real row matters.
  const sentBackForTask = useCallback(
    (taskId: string) => {
      const submission = submissionByTaskId.get(taskId);
      return submission?.status === "progress" && Boolean(submission?.admin_note);
    },
    [submissionByTaskId],
  );

  const totalPointsEarned = useMemo(
    () => submissions.reduce((sum, s) => sum + (s.points_awarded ?? 0), 0),
    [submissions],
  );

  // The viewer's own row can move into or out of the qualifying
  // ('submitted'/'reviewing'/'approved') statuses that getTaskCompletions()
  // uses, so re-fetch after any mutation rather than trying to patch the
  // avatar-stack state optimistically -- the client doesn't otherwise know
  // its own username/avatar_url to construct that entry locally, and this
  // board isn't high-traffic enough to warrant threading that through just
  // to avoid one small extra request per action.
  const refreshCompletions = useCallback(async () => {
    try {
      const res = await fetch("/api/task-board", { cache: "no-store" });
      if (!res.ok) throw new Error("Task Board refresh failed");
      const data = await res.json();
      if (!data?.completions) throw new Error("Missing Task Board completions");
      setCompletions(data.completions);
    } catch {
      setError("Could not refresh the Task Board. Reload to try again.");
    }
  }, []);

  const applySubmission = useCallback(
    (submission: TaskBoardSubmissionRow) => {
      setSubmissions((prev) => [...prev.filter((s) => s.task_id !== submission.task_id), submission]);
      void refreshCompletions();
    },
    [refreshCompletions],
  );

  const moveStatus = useCallback(
    async (taskId: string, status: "todo" | "progress" | "submitted") => {
      if (movingTaskIds.current.has(taskId)) return;
      movingTaskIds.current.add(taskId);
      setError(null);
      setOptimisticStatus((prev) => ({ ...prev, [taskId]: status }));
      try {
        const result = await postJson(taskId, { status });
        if (!result.ok) {
          setError(result.error ?? "Could not move task.");
          return;
        }
        // Reconcile the saved row before clearing the optimistic move.
        applySubmission(result.submission);
      } catch {
        setError("Could not move task. Check your connection and try again.");
      } finally {
        movingTaskIds.current.delete(taskId);
        setOptimisticStatus((prev) => withoutKey(prev, taskId));
      }
    },
    [applySubmission],
  );

  // Closes the modal via any of X / backdrop / Escape / the Close button.
  // If it was auto-opened by a drag onto "Completed" and nothing was
  // actually submitted, this also reverts the optimistic placement and
  // moves the real row back to 'progress' -- safe at any time, since a
  // bare status patch never touches previously-entered submission content
  // (see the API route's own comment on backward moves).
  const closeModal = useCallback(() => {
    if (selectedTaskId && pendingSubmitTaskId === selectedTaskId) {
      setOptimisticStatus((prev) => withoutKey(prev, selectedTaskId));
      void moveStatus(selectedTaskId, "progress");
      setPendingSubmitTaskId(null);
    }
    setSelectedTaskId(null);
  }, [selectedTaskId, pendingSubmitTaskId, moveStatus]);

  // Called only after a real submit succeeds -- clears the pending-revert
  // tracking without reverting anything, then closes.
  const handleSubmitted = useCallback(() => {
    setPendingSubmitTaskId(null);
    setSelectedTaskId(null);
  }, []);

  const columns = COLUMN_DEFS.map((col) => ({
    ...col,
    tasks: tasks.filter((task) => columnKeyForTask(statusForTask(task.id), sentBackForTask(task.id)) === col.key),
  }));

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;
  const selectedSubmission = selectedTaskId ? (submissionByTaskId.get(selectedTaskId) ?? null) : null;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
      <Header />
      <div className="relative min-h-screen overflow-hidden bg-surface-page">
        <div className="bg-dots mask-fade-b absolute inset-0 bg-surface-page" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-5 p-4">
      <div className="flex flex-col gap-2 px-1">
        <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">Round #1 · tasks</span>
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-text-strong">Task board</h1>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-card border border-border-hairline bg-surface-card p-5 shadow-card">
        <span className="font-mono text-[11px] font-bold tracking-widest text-text-muted uppercase">Levels</span>
        <div className="flex flex-wrap gap-4">
          {(["base", "medium", "hard"] as TaskBoardLevel[]).map((lv) => {
            const meta = LEVEL_META[lv];
            return (
              <span key={lv} className="inline-flex items-center gap-2 text-sm text-text-body">
                <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
            );
          })}
        </div>
        <span className="flex-1" />
        <span className="font-mono text-xs text-text-muted">
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"} · {totalPointsEarned} pts earned
        </span>
      </div>

      {error && (
        <div className="rounded-card-inner border border-aa-red-500/30 bg-surface-danger-soft px-4 py-3 text-sm text-aa-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((col) => {
          const isOver = overColumn === col.key && dragTaskId !== null;
          // "Reviewed" is never a drop target -- both outcomes it holds
          // (approved, sent-back) are admin-only transitions a plain drag
          // can't produce.
          const droppable = col.key !== "reviewed";
          return (
            <div key={col.key} className="flex min-w-0 flex-col gap-2.5">
              <div className="flex items-center justify-between px-1.5">
                <span className="font-mono text-[11px] font-bold tracking-widest text-text-strong uppercase">{col.label}</span>
                <span className="font-mono text-[11px] font-medium text-text-faint">{col.tasks.length}</span>
              </div>
              <div
                onDragOver={
                  droppable
                    ? (e) => {
                        e.preventDefault();
                        if (overColumn !== col.key) setOverColumn(col.key);
                      }
                    : undefined
                }
                onDragLeave={
                  droppable
                    ? () => {
                        if (overColumn === col.key) setOverColumn(null);
                      }
                    : undefined
                }
                onDrop={
                  droppable
                    ? (e) => {
                        e.preventDefault();
                        setOverColumn(null);
                        const taskId = dragTaskId;
                        setDragTaskId(null);
                        if (!taskId) return;
                        if (statusForTask(taskId) === "approved") return;
                        // Dropping onto "Completed" no longer moves the
                        // status directly -- it used to patch a bare
                        // {status: "submitted"}, which the API accepts with
                        // zero content attached. Instead this opens the
                        // real submit flow (with its file/link validation)
                        // and just previews the move; closeModal reverts it
                        // if nothing gets submitted.
                        if (col.key === "submitted") {
                          setOptimisticStatus((prev) => ({ ...prev, [taskId]: "submitted" }));
                          setPendingSubmitTaskId(taskId);
                          setSelectedTaskId(taskId);
                          return;
                        }
                        void moveStatus(taskId, col.key as "todo" | "progress");
                      }
                    : undefined
                }
                className={`flex min-h-[180px] flex-col gap-3 rounded-card-inner border-2 border-dashed p-2.5 transition-colors ${
                  isOver ? "border-surface-brand bg-surface-brand-soft" : "border-transparent bg-surface-sunken"
                }`}
              >
                {col.tasks.map((task) => {
                  const submission = submissionByTaskId.get(task.id) ?? null;
                  const level = submission?.level ?? offeredLevels(task)[0];
                  const meta = LEVEL_META[level];
                  const locked = submission?.status === "approved";
                  const notYetStarted = isNotYetStarted(task);
                  const points = locked
                    ? `${submission?.points_awarded ?? 0} pts earned`
                    : `${levelPoints(task, level)} pts`;
                  const due = formatDue(task.end_at);
                  const completedBy = completions[task.id] ?? [];
                  const sentBack = sentBackForTask(task.id);
                  const completedColor = completedCardColor(task, level, locked);
                  const completedTextStyle = completedColor ? { color: completedColor.text } : undefined;

                  return (
                    <div
                      key={task.id}
                      draggable={!locked && !notYetStarted && !optimisticStatus[task.id]}
                      aria-busy={Boolean(optimisticStatus[task.id])}
                      onDragStart={() => setDragTaskId(task.id)}
                      onDragEnd={() => setDragTaskId(null)}
                      onClick={() => setSelectedTaskId(task.id)}
                      style={{
                        borderLeft: `4px solid ${meta.borderVar}`,
                        ...(completedColor ? { backgroundColor: completedColor.bg, borderColor: completedColor.bg } : {}),
                      }}
                      className={`flex flex-col gap-3 rounded-card border border-border-hairline bg-surface-card p-5 shadow-card transition-transform ${
                        notYetStarted ? "opacity-60" : ""
                      } ${
                        locked || notYetStarted ? "cursor-pointer" : "cursor-grab hover:-translate-y-0.5 active:cursor-grabbing"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide uppercase ${meta.chipBg} ${meta.chipBorder} ${meta.chipText}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                        {notYetStarted ? (
                          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border-hairline-strong bg-surface-sunken px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-text-muted uppercase">
                            {formatStart(task.start_at)}
                          </span>
                        ) : (
                          <>
                            {sentBack && (
                              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-aa-red-500/30 bg-surface-danger-soft px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-aa-red-700 uppercase">
                                Needs changes
                              </span>
                            )}
                            {locked && (
                              <span className="ml-auto flex items-center gap-2">
                                {Boolean(submission?.admin_note) && (
                                  <span className="inline-flex items-center gap-1.5 rounded-full border border-aa-green-500/30 bg-surface-brand-soft px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-aa-green-700 uppercase">
                                    Note
                                  </span>
                                )}
                                <span
                                  style={completedTextStyle}
                                  className="font-mono text-[11px] font-semibold tracking-wide text-aa-green-700 uppercase"
                                >
                                  Locked
                                </span>
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      <div
                        dir={isArabicText(task.title) ? "rtl" : "ltr"}
                        style={completedTextStyle}
                        className={`font-display font-bold tracking-tight text-text-strong text-pretty ${
                          task.title.length > LONG_TITLE_CHAR_THRESHOLD ? "text-sm" : "text-base"
                        }`}
                      >
                        {task.title}
                      </div>
                      {completedBy.length > 0 && (
                        <div className="flex items-center gap-2">
                          <AvatarStack people={completedBy} />
                          <span style={completedTextStyle} className="font-mono text-[10px] text-text-faint">
                            {completedBy.length} {completedBy.length === 1 ? "student" : "students"} done
                          </span>
                        </div>
                      )}
                      <div
                        className="flex items-center justify-between gap-2 border-t border-border-hairline pt-2.5"
                        style={completedColor ? { borderColor: `${completedColor.text}33` } : undefined}
                      >
                        <span style={completedTextStyle} className="font-mono text-xs text-text-muted">{due ?? ""}</span>
                        <span className="flex items-center gap-1.5">
                          {locked && Boolean(submission?.bonus_points) && (
                            <span className="inline-flex items-center whitespace-nowrap rounded-full bg-surface-accent-soft px-2 py-0.5 font-mono text-[10px] font-bold text-aa-amber-700">
                              +{submission?.bonus_points} bonus
                            </span>
                          )}
                          <span style={completedTextStyle} className="font-mono text-xs font-bold text-text-strong">{points}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
                {col.tasks.length === 0 && <div className="p-5 text-center text-xs text-text-faint">{col.emptyHint}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          submission={selectedSubmission}
          completedBy={completions[selectedTask.id] ?? []}
          resources={resources[selectedTask.id] ?? []}
          onClose={closeModal}
          onUpdated={applySubmission}
          onSubmitted={handleSubmitted}
        />
      )}
      </div>
      </div>
    </div>
  );
}

function TaskDetailModal({
  task,
  submission,
  completedBy,
  resources,
  onClose,
  onUpdated,
  onSubmitted,
}: {
  task: TaskBoardTaskRow;
  submission: TaskBoardSubmissionRow | null;
  completedBy: TaskCompletionAvatar[];
  resources: TaskBoardResourceRow[];
  onClose: () => void;
  onUpdated: (submission: TaskBoardSubmissionRow) => void;
  onSubmitted: () => void;
}) {
  const levels = offeredLevels(task);
  const [level, setLevel] = useState<TaskBoardLevel>(submission?.level ?? levels[0]);
  const [link, setLink] = useState(submission?.submission_link ?? "");
  const [note, setNote] = useState(submission?.submission_note ?? "");
  const [primaryFiles, setPrimaryFiles] = useState<Partial<Record<SubmissionFileKind, File>>>({});
  const [code, setCode] = useState(submission?.submission_code ?? "");
  const [screenshotFiles, setScreenshotFiles] = useState<File[]>([]);
  const [existingScreenshots, setExistingScreenshots] = useState<
    { id: string; name: string; url: string | null }[] | null
  >(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const locked = submission?.status === "approved";
  const notYetStarted = isNotYetStarted(task);
  const sentBack = submission?.status === "progress" && Boolean(submission?.admin_note);
  // Base + bonus only add up to points_awarded in the common case -- an
  // admin's manual points override can set points_awarded to anything, so
  // asserting a breakdown that doesn't actually sum would look like a bug
  // rather than a deliberate override.
  const approvedBonus = submission?.bonus_points ?? 0;
  const approvedTotal = submission?.points_awarded ?? 0;
  const approvedBase = levelPoints(task, submission?.level ?? level);
  const approvedPointsSummary =
    approvedBonus > 0 && approvedBase + approvedBonus === approvedTotal
      ? `${approvedBase} pts base + ${approvedBonus} pts bonus = ${approvedTotal} pts`
      : approvedBonus > 0
        ? `${approvedTotal} pts total (includes a +${approvedBonus} bonus)`
        : `${approvedTotal} pts total`;
  const linkOk = !task.requires_link || link.trim().length > 0;
  const primaryFilesOk = PRIMARY_FILE_KINDS.every((meta) => !taskRequiresKind(task, meta.kind) || Boolean(primaryFiles[meta.kind]));
  const codeOk = !task.requires_code || code.trim().length > 0;
  const screenshotsOk = !task.requires_screenshots || screenshotFiles.length > 0;
  const canSubmit = !busy && !locked && !notYetStarted && linkOk && primaryFilesOk && codeOk && screenshotsOk;
  const description = descriptionForLevel(task, level);
  const descriptionItems = description ? descriptionListItems(description) : null;
  const checklist = checklistForLevel(task, level);

  // Previously submitted screenshots (if this task collects them) -- shown
  // as a read-only gallery regardless of `locked`, purely informational:
  // whatever the student picks in the "Add screenshots" picker below
  // replaces this set on the next submit (see the API route's
  // delete-then-replace behavior), it doesn't merge with it.
  useEffect(() => {
    if (!task.requires_screenshots || !submission) {
      setExistingScreenshots([]);
      return;
    }
    let cancelled = false;
    fetch(`/api/task-board/tasks/${task.id}/submission/files`)
      .then((res) => (res.ok ? res.json() : { files: [] }))
      .then((data) => {
        if (!cancelled) setExistingScreenshots(data.files ?? []);
      })
      .catch(() => {
        if (!cancelled) setExistingScreenshots([]);
      });
    return () => {
      cancelled = true;
    };
  }, [task.id, task.requires_screenshots, submission]);

  const screenshotPreviews = useMemo(
    () => screenshotFiles.map((f) => ({ file: f, url: URL.createObjectURL(f) })),
    [screenshotFiles],
  );
  useEffect(() => {
    return () => {
      screenshotPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [screenshotPreviews]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function removeStagedScreenshot(index: number) {
    setScreenshotFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function selectLevel(next: TaskBoardLevel) {
    if (locked || notYetStarted || next === level) return;
    setLevel(next);
    const result = await postJson(task.id, { level: next });
    if (result.ok) onUpdated(result.submission);
  }

  async function handleSubmit() {
    setBusy(true);
    setLocalError(null);
    const hasUpload = Object.keys(primaryFiles).length > 0 || screenshotFiles.length > 0;
    setProgress(hasUpload ? 0 : null);

    const formData = new FormData();
    formData.append("level", level);
    if (note.trim()) formData.append("note", note.trim());
    if (task.requires_link) formData.append("link", link.trim());
    for (const meta of PRIMARY_FILE_KINDS) {
      if (!taskRequiresKind(task, meta.kind)) continue;
      const picked = primaryFiles[meta.kind];
      if (picked) formData.append(meta.kind === "file" ? "file" : `${meta.kind}File`, picked);
    }
    if (task.requires_code) formData.append("code", code.trim());
    for (const f of screenshotFiles) formData.append("files", f);

    const result = await postWithProgress(task.id, formData, setProgress);
    setBusy(false);
    setProgress(null);

    if (!result.ok) {
      setLocalError(result.error ?? "Could not submit.");
      return;
    }
    onUpdated(result.submission);
    setPrimaryFiles({});
    setScreenshotFiles([]);
    onSubmitted();
  }

  async function openFile(kind: SubmissionFileKind) {
    const res = await fetch(`/api/task-board/tasks/${task.id}/submission/file?type=${kind}`);
    const data = await res.json().catch(() => null);
    if (res.ok && data?.url) window.open(data.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-ink/[0.34] p-4 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-xl flex-col gap-5 overflow-y-auto rounded-[20px] border border-border-hairline bg-surface-card p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2
              dir={isArabicText(task.title) ? "rtl" : "ltr"}
              className="font-display text-xl font-bold tracking-tight text-text-strong"
            >
              {task.title}
            </h2>
            {formatDue(task.end_at) && <span className="font-mono text-xs text-text-muted">{formatDue(task.end_at)}</span>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-lg text-text-faint hover:text-text-strong">
            ×
          </button>
        </div>

        {notYetStarted && (
          <div className="flex flex-col gap-1.5 rounded-card-inner border border-border-hairline-strong bg-surface-sunken p-4">
            <span className="font-mono text-[11px] font-bold tracking-widest text-text-muted uppercase">Not open yet</span>
            <p className="text-sm text-text-body">
              This task unlocks on{" "}
              {new Date(task.start_at as string).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              .
            </p>
          </div>
        )}

        {sentBack && (
          <div className="flex flex-col gap-1.5 rounded-card-inner border border-aa-red-500/30 bg-surface-danger-soft p-4">
            <span className="font-mono text-[11px] font-bold tracking-widest text-aa-red-700 uppercase">
              Needs changes
            </span>
            <p
              dir={submission?.admin_note && isArabicText(submission.admin_note) ? "rtl" : "ltr"}
              className="text-sm text-aa-red-700 text-pretty"
            >
              {submission?.admin_note}
            </p>
          </div>
        )}

        {locked && (
          <div className="flex flex-col gap-1.5 rounded-card-inner border border-aa-green-500/30 bg-surface-brand-soft p-4">
            <span className="font-mono text-[11px] font-bold tracking-widest text-aa-green-700 uppercase">
              Approved
            </span>
            <p className="font-mono text-sm font-semibold text-aa-green-800">{approvedPointsSummary}</p>
            {submission?.admin_note && (
              <p
                dir={isArabicText(submission.admin_note) ? "rtl" : "ltr"}
                className="text-sm text-aa-green-800 text-pretty"
              >
                {submission.admin_note}
              </p>
            )}
          </div>
        )}

        {completedBy.length > 0 && (
          <div className="flex items-center gap-3">
            <AvatarStack people={completedBy} size={36} />
            <span className="font-mono text-xs text-text-faint">
              {completedBy.length} {completedBy.length === 1 ? "student" : "students"} done
            </span>
          </div>
        )}

        {description &&
          (descriptionItems ? (
            <div className="flex flex-col gap-2 rounded-card-inner bg-surface-sunken p-4">
              {descriptionItems.map((line, i) => (
                <div key={i} className="flex items-start gap-2.5 text-sm text-text-body">
                  <span className="mt-0.5 flex-none font-mono text-xs font-bold text-text-faint">{i + 1}.</span>
                  <span dir={isArabicText(line) ? "rtl" : "ltr"} className="text-pretty">
                    {line}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p dir={isArabicText(description) ? "rtl" : "ltr"} className="text-sm text-text-body text-pretty">
              {description}
            </p>
          ))}

        {checklist.length > 0 && (
          <div className="flex flex-col gap-2 rounded-card-inner bg-surface-sunken p-4">
            <span className="font-mono text-[11px] font-bold tracking-widest text-text-muted uppercase">What is expected</span>
            {checklist.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-text-body">
                <span className="mt-0.5 h-4 w-4 flex-none rounded border-2 border-border-hairline-strong bg-surface-card" />
                <span dir={isArabicText(item) ? "rtl" : "ltr"}>{item}</span>
              </div>
            ))}
          </div>
        )}

        {resources.filter((r) => resourceVisibleForLevel(r, level)).length > 0 && (
          <div className="flex flex-col gap-3">
            {resources
              .filter((r) => resourceVisibleForLevel(r, level))
              .map((r) => {
                if (r.type === "code") {
                  return (
                    <div key={r.id} className="flex flex-col gap-1.5">
                      {r.label && <span className="text-xs font-semibold text-text-strong">{r.label}</span>}
                      <div className="overflow-hidden rounded-card-inner border border-border-hairline text-xs">
                        <SyntaxHighlighter
                          language={r.code_language ?? "javascript"}
                          style={oneLight}
                          customStyle={{ margin: 0, fontSize: "12px" }}
                        >
                          {r.code_content ?? ""}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  );
                }
                if (r.type === "image") {
                  return (
                    <a key={r.id} href={r.url ?? "#"} target="_blank" rel="noreferrer" className="block">
                      {r.label && <span className="mb-1.5 block text-xs font-semibold text-text-strong">{r.label}</span>}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.url ?? undefined} alt={r.label ?? "Resource image"} className="max-h-64 rounded-card-inner border border-border-hairline object-contain" />
                    </a>
                  );
                }
                return (
                  <a
                    key={r.id}
                    href={r.url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 w-fit items-center gap-2 rounded-control border border-border-hairline-strong px-3 text-xs font-semibold text-text-strong"
                  >
                    {r.label ?? (r.type === "video" ? "Watch video" : "Download PDF")} ↗
                  </a>
                );
              })}
          </div>
        )}

        <div className="flex flex-col gap-2.5 border-t-2 border-border-hairline pt-5">
          <span className="font-mono text-[11px] font-bold tracking-widest text-text-muted uppercase">Level</span>
          <div className="flex flex-wrap gap-2.5">
            {levels.map((lv) => {
              const meta = LEVEL_META[lv];
              const active = level === lv;
              return (
                <button
                  key={lv}
                  type="button"
                  disabled={locked || notYetStarted}
                  onClick={() => selectLevel(lv)}
                  className={`inline-flex h-11 items-center gap-2.5 rounded-full border-2 px-4 transition-colors ${
                    active ? `${meta.chipBg} ${meta.chipBorder} ${meta.chipText}` : "border-border-hairline bg-surface-card text-text-body"
                  } ${locked || notYetStarted ? "cursor-default opacity-70" : "cursor-pointer"}`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                  <span className="text-sm font-semibold">{meta.label}</span>
                  <span className="font-mono text-xs font-bold opacity-75">{levelPoints(task, lv)} pts</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t-2 border-border-hairline pt-5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="font-mono text-[11px] font-bold tracking-widest text-text-muted uppercase">Your submission</span>
            {(task.requires_pdf || task.requires_image || task.requires_video || task.requires_file) && (
              <span className="font-mono text-xs text-text-faint">MAX 300 MB per file</span>
            )}
          </div>

          {notYetStarted ? (
            <div className="rounded-card-inner border-2 border-dashed border-border-hairline-strong bg-surface-sunken p-6 text-center text-sm text-text-muted">
              Come back once this task opens to submit.
            </div>
          ) : (
            <>
              {locked ? (
                <div className="flex flex-col gap-2">
                  {task.requires_link && (
                    <div className="flex items-center gap-3 rounded-card-inner bg-surface-brand-soft px-4 py-3">
                      <span className="text-aa-green-700">✓</span>
                      <span className="min-w-0 overflow-hidden font-mono text-sm text-ellipsis whitespace-nowrap text-aa-green-800">
                        {submission?.submission_link}
                      </span>
                    </div>
                  )}
                  {PRIMARY_FILE_KINDS.filter((meta) => taskRequiresKind(task, meta.kind)).map((meta) => (
                    <div key={meta.kind} className="flex items-center gap-3 rounded-card-inner bg-surface-brand-soft px-4 py-3">
                      <span className="text-aa-green-700">✓</span>
                      <span className="min-w-0 overflow-hidden font-mono text-sm text-ellipsis whitespace-nowrap text-aa-green-800">
                        {submissionFileNameForKind(submission, meta.kind)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {task.requires_link && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-semibold text-text-strong">{task.submission_link_label ?? "Submission link"}</span>
                      <input
                        type="text"
                        placeholder="https://"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className="h-11 rounded-control border border-border-hairline-strong bg-surface-card px-3.5 font-mono text-sm text-text-strong"
                      />
                    </div>
                  )}

                  {PRIMARY_FILE_KINDS.filter((meta) => taskRequiresKind(task, meta.kind)).map((meta) => {
                    const customLabel = submissionLabelForKind(task, meta.kind);
                    return (
                      <div key={meta.kind} className="flex flex-col gap-1.5">
                        <div className="flex flex-col items-center gap-2 rounded-card border-2 border-dashed border-border-hairline-strong bg-surface-sunken p-6 text-center">
                          <span className="text-sm font-semibold text-text-strong">
                            {primaryFiles[meta.kind]
                              ? primaryFiles[meta.kind]!.name
                              : (customLabel ?? `Choose a ${meta.label.toLowerCase()} to upload`)}
                          </span>
                          <span className="text-xs text-text-muted">{meta.label.toUpperCase()} · up to 300 MB</span>
                          <label className="mt-1 inline-flex h-8 cursor-pointer items-center rounded-control border border-border-hairline-strong bg-surface-card px-3 text-xs font-semibold text-text-strong">
                            Choose file
                            <input
                              type="file"
                              accept={meta.accept}
                              className="hidden"
                              onChange={(e) =>
                                setPrimaryFiles((prev) => ({ ...prev, [meta.kind]: e.target.files?.[0] ?? undefined }))
                              }
                            />
                          </label>
                        </div>
                        {submissionFileNameForKind(submission, meta.kind) && (
                          <button
                            type="button"
                            onClick={() => openFile(meta.kind)}
                            className="self-start text-xs font-semibold text-text-accent underline"
                          >
                            View current {meta.label.toLowerCase()}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {task.requires_code && (
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[11px] font-bold tracking-widest text-text-muted uppercase">Code</span>
                  {locked ? (
                    <pre
                      dir="ltr"
                      className="max-h-48 overflow-auto rounded-card-inner bg-surface-sunken p-3 font-mono text-xs whitespace-pre-wrap text-text-body"
                    >
                      {submission?.submission_code || "—"}
                    </pre>
                  ) : (
                    <textarea
                      dir="ltr"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder={task.submission_code_placeholder ?? "Paste your code here"}
                      rows={6}
                      className="rounded-control border border-border-hairline-strong bg-surface-card p-3 font-mono text-xs text-text-strong"
                    />
                  )}
                </div>
              )}

              {task.requires_screenshots && (
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-[11px] font-bold tracking-widest text-text-muted uppercase">Screenshots</span>

                  {existingScreenshots && existingScreenshots.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {existingScreenshots.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => f.url && window.open(f.url, "_blank", "noopener,noreferrer")}
                          className="h-16 w-16 flex-none overflow-hidden rounded-control border border-border-hairline-strong bg-surface-sunken"
                          title={f.name}
                        >
                          {f.url && <img src={f.url} alt={f.name} className="h-full w-full object-cover" />}
                        </button>
                      ))}
                    </div>
                  )}

                  {!locked && (
                    <>
                      <label className="inline-flex h-8 w-fit cursor-pointer items-center rounded-control border border-border-hairline-strong bg-surface-card px-3 text-xs font-semibold text-text-strong">
                        Add screenshots
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          multiple
                          className="hidden"
                          onChange={(e) => setScreenshotFiles(Array.from(e.target.files ?? []).slice(0, 10))}
                        />
                      </label>
                      {screenshotPreviews.length > 0 && (
                        <>
                          <div className="flex flex-wrap gap-2">
                            {screenshotPreviews.map((p, i) => (
                              <div key={i} className="relative h-16 w-16 flex-none overflow-hidden rounded-control border border-border-hairline-strong">
                                <img src={p.url} alt={p.file.name} className="h-full w-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeStagedScreenshot(i)}
                                  aria-label="Remove"
                                  className="absolute top-0 right-0 grid h-4 w-4 place-items-center rounded-bl bg-surface-ink/70 text-[10px] text-white"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <span className="text-xs text-text-faint">Submitting will replace all current screenshots with these.</span>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {!locked && (
                <textarea
                  dir={isArabicText(note) ? "rtl" : "ltr"}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="هل لديك ملاحظة؟"
                  rows={2}
                  className="rounded-control border border-border-hairline bg-surface-card p-3 text-sm text-text-body"
                />
              )}
            </>
          )}

          {progress !== null && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
              <div className="h-full bg-surface-brand transition-[width]" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        {localError && <p className="text-sm text-aa-red-700">{localError}</p>}

        <div className="flex flex-wrap justify-end gap-3 border-t border-border-hairline pt-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-control px-4 text-sm font-semibold text-text-body hover:bg-surface-hover"
          >
            Close
          </button>
          {!locked && !notYetStarted && (
            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="inline-flex h-10 items-center rounded-control bg-surface-brand px-5 text-sm font-semibold text-text-inverse disabled:opacity-40"
            >
              {busy ? "Submitting…" : "Submit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
