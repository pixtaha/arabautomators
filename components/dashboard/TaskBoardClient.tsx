"use client";

import { useCallback, useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import type {
  TaskBoardLevel,
  TaskBoardStatus,
  TaskBoardSubmissionRow,
  TaskBoardTaskRow,
  TaskCompletionAvatar,
} from "@/lib/data/taskBoard";

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

const COLUMN_DEFS: {
  key: "todo" | "progress" | "submitted";
  label: string;
  statuses: TaskBoardStatus[];
  emptyHint: string;
}[] = [
  { key: "todo", label: "To do", statuses: ["todo"], emptyHint: "Nothing waiting." },
  { key: "progress", label: "In progress", statuses: ["progress"], emptyHint: "Drag a task here to start it." },
  {
    key: "submitted",
    label: "Completed",
    statuses: ["submitted", "reviewing", "approved"],
    emptyHint: "Drag here when you have submitted.",
  },
];

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

function formatDue(dueAt: string | null) {
  if (!dueAt) return null;
  return `Due ${new Date(dueAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
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

const AVATAR_STACK_MAX = 4;

// Who has turned this task in -- public social proof among students, not
// an admin-only view, so it only ever renders username/avatar_url (never
// email, points, or submission content). Same fallback-initial pattern as
// LeaderboardCard.tsx: a colored circle with the first letter when there's
// no avatar_url.
function AvatarStack({ people }: { people: TaskCompletionAvatar[] }) {
  if (people.length === 0) return null;
  const visible = people.slice(0, AVATAR_STACK_MAX);
  const overflow = people.length - visible.length;

  return (
    <div className="flex items-center">
      {visible.map((p, i) => (
        <span
          key={p.student_id}
          title={p.username ?? "Student"}
          style={{ marginLeft: i === 0 ? 0 : "-10px" }}
          className="grid h-6 w-6 flex-none place-items-center overflow-hidden rounded-full border-2 border-surface-card bg-surface-brand-soft font-display text-[10px] font-bold text-text-accent"
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
          style={{ marginLeft: "-10px" }}
          className="grid h-6 w-6 flex-none place-items-center rounded-full border-2 border-surface-card bg-surface-sunken font-mono text-[9px] font-bold text-text-muted"
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

async function postJson(taskId: string, body: unknown) {
  const res = await fetch(`/api/task-board/tasks/${taskId}/submission`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) return { ok: false as const, error: data?.error as string | undefined };
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
}

export function TaskBoardClient({ initialTasks, initialSubmissions, initialCompletions }: TaskBoardClientProps) {
  const [tasks] = useState(initialTasks);
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [completions, setCompletions] = useState(initialCompletions);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submissionByTaskId = useMemo(() => {
    const map = new Map<string, TaskBoardSubmissionRow>();
    for (const submission of submissions) map.set(submission.task_id, submission);
    return map;
  }, [submissions]);

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
    const res = await fetch("/api/task-board", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json().catch(() => null);
    if (data?.completions) setCompletions(data.completions);
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
      setError(null);
      const result = await postJson(taskId, { status });
      if (!result.ok) {
        setError(result.error ?? "Could not move task.");
        return;
      }
      applySubmission(result.submission);
    },
    [applySubmission],
  );

  const columns = COLUMN_DEFS.map((col) => ({
    ...col,
    tasks: tasks.filter((task) => col.statuses.includes(submissionByTaskId.get(task.id)?.status ?? "todo")),
  }));

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;
  const selectedSubmission = selectedTaskId ? (submissionByTaskId.get(selectedTaskId) ?? null) : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-page">
      <div className="bg-dots mask-fade-b absolute inset-0 bg-surface-page" />
      <div className="relative mx-auto flex max-w-5xl flex-col gap-5 p-4">
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {columns.map((col) => {
          const isOver = overColumn === col.key && dragTaskId !== null;
          return (
            <div key={col.key} className="flex min-w-0 flex-col gap-2.5">
              <div className="flex items-center justify-between px-1.5">
                <span className="font-mono text-[11px] font-bold tracking-widest text-text-strong uppercase">{col.label}</span>
                <span className="font-mono text-[11px] font-medium text-text-faint">{col.tasks.length}</span>
              </div>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (overColumn !== col.key) setOverColumn(col.key);
                }}
                onDragLeave={() => {
                  if (overColumn === col.key) setOverColumn(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setOverColumn(null);
                  const taskId = dragTaskId;
                  setDragTaskId(null);
                  if (!taskId) return;
                  if ((submissionByTaskId.get(taskId)?.status ?? "todo") === "approved") return;
                  void moveStatus(taskId, col.statuses[0] as "todo" | "progress" | "submitted");
                }}
                className={`flex min-h-[180px] flex-col gap-3 rounded-card-inner border-2 border-dashed p-2.5 transition-colors ${
                  isOver ? "border-surface-brand bg-surface-brand-soft" : "border-transparent bg-surface-sunken"
                }`}
              >
                {col.tasks.map((task) => {
                  const submission = submissionByTaskId.get(task.id) ?? null;
                  const level = submission?.level ?? offeredLevels(task)[0];
                  const meta = LEVEL_META[level];
                  const locked = submission?.status === "approved";
                  const points = locked
                    ? `${submission?.points_awarded ?? 0} pts earned`
                    : `${levelPoints(task, level)} pts`;
                  const due = formatDue(task.due_at);
                  const completedBy = completions[task.id] ?? [];

                  return (
                    <div
                      key={task.id}
                      draggable={!locked}
                      onDragStart={() => setDragTaskId(task.id)}
                      onDragEnd={() => setDragTaskId(null)}
                      onClick={() => setSelectedTaskId(task.id)}
                      style={{ borderLeft: `4px solid ${meta.borderVar}` }}
                      className={`flex flex-col gap-3 rounded-card border border-border-hairline bg-surface-card p-5 shadow-card transition-transform ${
                        locked ? "cursor-pointer" : "cursor-grab hover:-translate-y-0.5 active:cursor-grabbing"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide uppercase ${meta.chipBg} ${meta.chipBorder} ${meta.chipText}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                          {meta.label}
                        </span>
                        {locked && (
                          <span className="ml-auto font-mono text-[11px] font-semibold tracking-wide text-aa-green-700 uppercase">
                            Locked
                          </span>
                        )}
                      </div>
                      <div className="font-display text-base font-bold tracking-tight text-text-strong text-pretty">{task.title}</div>
                      {completedBy.length > 0 && (
                        <div className="flex items-center gap-2">
                          <AvatarStack people={completedBy} />
                          <span className="font-mono text-[10px] text-text-faint">
                            {completedBy.length} {completedBy.length === 1 ? "student" : "students"} done
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2 border-t border-border-hairline pt-2.5">
                        <span className="font-mono text-xs text-text-muted">{due ?? ""}</span>
                        <span className="font-mono text-xs font-bold text-text-strong">{points}</span>
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
          onClose={() => setSelectedTaskId(null)}
          onUpdated={applySubmission}
        />
      )}
      </div>
    </div>
  );
}

function TaskDetailModal({
  task,
  submission,
  onClose,
  onUpdated,
}: {
  task: TaskBoardTaskRow;
  submission: TaskBoardSubmissionRow | null;
  onClose: () => void;
  onUpdated: (submission: TaskBoardSubmissionRow) => void;
}) {
  const levels = offeredLevels(task);
  const [level, setLevel] = useState<TaskBoardLevel>(submission?.level ?? levels[0]);
  const [link, setLink] = useState(submission?.submission_link ?? "");
  const [note, setNote] = useState(submission?.submission_note ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const locked = submission?.status === "approved";
  const canSubmit =
    !busy && !locked && (task.submission_format === "link" ? link.trim().length > 0 : Boolean(file));
  const description = descriptionForLevel(task, level);
  const checklist = checklistForLevel(task, level);

  async function selectLevel(next: TaskBoardLevel) {
    if (locked || next === level) return;
    setLevel(next);
    const result = await postJson(task.id, { level: next });
    if (result.ok) onUpdated(result.submission);
  }

  async function handleSubmit() {
    setBusy(true);
    setLocalError(null);
    setProgress(task.submission_format === "link" ? null : 0);

    const formData = new FormData();
    formData.append("level", level);
    if (note.trim()) formData.append("note", note.trim());
    if (task.submission_format === "link") {
      formData.append("link", link.trim());
    } else if (file) {
      formData.append("file", file);
    }

    const result = await postWithProgress(task.id, formData, setProgress);
    setBusy(false);
    setProgress(null);

    if (!result.ok) {
      setLocalError(result.error ?? "Could not submit.");
      return;
    }
    onUpdated(result.submission);
    setFile(null);
  }

  async function openFile() {
    const res = await fetch(`/api/task-board/tasks/${task.id}/submission/file`);
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
            <h2 className="font-display text-xl font-bold tracking-tight text-text-strong">{task.title}</h2>
            {formatDue(task.due_at) && <span className="font-mono text-xs text-text-muted">{formatDue(task.due_at)}</span>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-lg text-text-faint hover:text-text-strong">
            ×
          </button>
        </div>

        {description && <p className="text-sm text-text-body text-pretty">{description}</p>}

        {checklist.length > 0 && (
          <div className="flex flex-col gap-2 rounded-card-inner bg-surface-sunken p-4">
            <span className="font-mono text-[11px] font-bold tracking-widest text-text-muted uppercase">What is expected</span>
            {checklist.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-text-body">
                <span className="mt-0.5 h-4 w-4 flex-none rounded border-2 border-border-hairline-strong bg-surface-card" />
                {item}
              </div>
            ))}
          </div>
        )}

        {(task.resource_link_url || task.resource_youtube_url || task.resource_pdf_url) && (
          <div className="flex flex-wrap gap-2">
            {task.resource_youtube_url && (
              <a
                href={task.resource_youtube_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center rounded-control bg-surface-ink px-3 text-xs font-semibold text-text-inverse"
              >
                Watch on YouTube
              </a>
            )}
            {task.resource_link_url && (
              <a
                href={task.resource_link_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center gap-2 rounded-control border border-border-hairline-strong px-3 text-xs font-semibold text-text-strong"
              >
                {task.resource_link_label ?? "Reference link"} ↗
              </a>
            )}
            {task.resource_pdf_url && (
              <a
                href={task.resource_pdf_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-8 items-center gap-2 rounded-control border border-border-hairline-strong px-3 text-xs font-semibold text-text-strong"
              >
                Download brief ↗
              </a>
            )}
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
                  disabled={locked}
                  onClick={() => selectLevel(lv)}
                  className={`inline-flex h-11 items-center gap-2.5 rounded-full border-2 px-4 transition-colors ${
                    active ? `${meta.chipBg} ${meta.chipBorder} ${meta.chipText}` : "border-border-hairline bg-surface-card text-text-body"
                  } ${locked ? "cursor-default opacity-70" : "cursor-pointer"}`}
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
            {task.submission_format !== "link" && <span className="font-mono text-xs text-text-faint">MAX 300 MB</span>}
          </div>

          {locked ? (
            <div className="flex items-center gap-3 rounded-card-inner bg-surface-brand-soft px-4 py-3">
              <span className="text-aa-green-700">✓</span>
              <span className="min-w-0 overflow-hidden font-mono text-sm text-ellipsis whitespace-nowrap text-aa-green-800">
                {task.submission_format === "link" ? submission?.submission_link : submission?.submission_file_name}
              </span>
            </div>
          ) : task.submission_format === "link" ? (
            <input
              type="text"
              placeholder="https://"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="h-11 rounded-control border border-border-hairline-strong bg-surface-card px-3.5 font-mono text-sm text-text-strong"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-card border-2 border-dashed border-border-hairline-strong bg-surface-sunken p-6 text-center">
              <span className="text-sm font-semibold text-text-strong">{file ? file.name : "Choose a file to upload"}</span>
              <span className="text-xs text-text-muted">{task.submission_format.toUpperCase()} · up to 300 MB</span>
              <label className="mt-1 inline-flex h-8 cursor-pointer items-center rounded-control border border-border-hairline-strong bg-surface-card px-3 text-xs font-semibold text-text-strong">
                Choose file
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
          )}

          {submission?.submission_file_name && !locked && (
            <button type="button" onClick={openFile} className="self-start text-xs font-semibold text-text-accent underline">
              View current file
            </button>
          )}

          {!locked && (
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note for the reviewer"
              rows={2}
              className="rounded-control border border-border-hairline bg-surface-card p-3 text-sm text-text-body"
            />
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
          {!locked && (
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
