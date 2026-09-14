"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CreateTaskBoardTaskForm, type TaskBoardTaskDetail } from "@/components/admin/CreateTaskBoardTaskForm";

type Level = "base" | "medium" | "hard";

const LEVEL_LABELS: Record<Level, string> = { base: "Base", medium: "Medium", hard: "Hard" };

type RequirementKey =
  | "requires_link"
  | "requires_pdf"
  | "requires_image"
  | "requires_video"
  | "requires_file"
  | "requires_code"
  | "requires_screenshots";

interface TaskListRow {
  id: string;
  title: string;
  order_index: number;
  points_base: number | null;
  points_medium: number | null;
  points_hard: number | null;
  requires_link: boolean;
  requires_pdf: boolean;
  requires_image: boolean;
  requires_video: boolean;
  requires_file: boolean;
  requires_code: boolean;
  requires_screenshots: boolean;
  start_at: string | null;
  end_at: string | null;
  is_active: boolean;
  pending_count: number;
}

function offeredLevels(task: TaskListRow): { level: Level; points: number }[] {
  const levels: { level: Level; points: number }[] = [];
  if (task.points_base !== null) levels.push({ level: "base", points: task.points_base });
  if (task.points_medium !== null) levels.push({ level: "medium", points: task.points_medium });
  if (task.points_hard !== null) levels.push({ level: "hard", points: task.points_hard });
  return levels;
}

// Independent flags a task can require, in the order they're shown --
// mirrors CreateTaskBoardTaskForm.tsx's "Submission requirements" checkbox
// list exactly.
const REQUIREMENT_FLAGS: { key: RequirementKey; label: string }[] = [
  { key: "requires_link", label: "Link" },
  { key: "requires_pdf", label: "PDF" },
  { key: "requires_image", label: "Image" },
  { key: "requires_video", label: "Video" },
  { key: "requires_file", label: "File" },
  { key: "requires_code", label: "Code" },
  { key: "requires_screenshots", label: "Screenshots" },
];

function formatTaskDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// Distinguishes "form closed" from "creating a brand new task" from
// "editing task X" as one piece of state, rather than a boolean plus a
// separately-tracked task id that could disagree with each other.
type FormMode = { type: "closed" } | { type: "create" } | { type: "edit"; task: TaskBoardTaskDetail };

// Mirrors AdminTaskBoardSubmissionsClient.tsx's own page shape (Header/
// Footer/eyebrow/h1/intro pattern) -- this page and that one are now the
// two halves of what used to be a single combined page: this one for
// creating and seeing what tasks exist, that one for reviewing what
// students have submitted against them.
export function AdminTaskBoardClient() {
  const [formMode, setFormMode] = useState<FormMode>({ type: "closed" });
  const [editLoadError, setEditLoadError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskListRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(() => {
    fetch("/api/admin/task-board/tasks")
      .then((r) => r.json())
      .then((data) => setTasks(data.tasks ?? []))
      .catch(() => setError("Could not load tasks."));
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  async function openEditForm(taskId: string) {
    setEditLoadError(null);
    try {
      const res = await fetch(`/api/admin/task-board/tasks/${taskId}`);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.task) {
        setEditLoadError("Could not load task for editing.");
        return;
      }
      setFormMode({ type: "edit", task: { ...data.task, resources: data.resources ?? [] } });
    } catch {
      setEditLoadError("Could not load task for editing.");
    }
  }

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
              Manage tasks
            </h1>
            <p className="max-w-[60ch] text-sm leading-relaxed text-text-muted">
              Create new Task Board tasks and see every task that&apos;s currently live, at a glance.
            </p>
          </div>

          {error && <p className="text-xs font-medium text-aa-red-700">{error}</p>}
          {editLoadError && <p className="text-xs font-medium text-aa-red-700">{editLoadError}</p>}

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold tracking-widest text-text-strong uppercase">
                {formMode.type === "edit" ? "Edit task" : formMode.type === "create" ? "New task" : "Tasks"}
              </span>
              <button
                type="button"
                onClick={() => setFormMode((m) => (m.type === "closed" ? { type: "create" } : { type: "closed" }))}
                className="cursor-pointer text-xs font-semibold text-text-accent underline"
              >
                {formMode.type === "closed" ? "+ Create new task" : "Close"}
              </button>
            </div>
            {formMode.type === "create" && (
              <CreateTaskBoardTaskForm onCancel={() => setFormMode({ type: "closed" })} onSaved={loadTasks} />
            )}
            {formMode.type === "edit" && (
              <CreateTaskBoardTaskForm
                key={formMode.task.id}
                initialTask={formMode.task}
                onCancel={() => setFormMode({ type: "closed" })}
                onSaved={() => {
                  setFormMode({ type: "closed" });
                  loadTasks();
                }}
              />
            )}
          </div>

          <div className="flex flex-col gap-3 border-t-2 border-border-hairline pt-8">
            <span className="font-mono text-[11px] font-bold tracking-widest text-text-strong uppercase">
              All tasks {tasks ? `(${tasks.length})` : ""}
            </span>
            {tasks === null ? (
              <div className="h-24 animate-pulse rounded-card bg-surface-sunken" />
            ) : tasks.length === 0 ? (
              <p className="text-sm text-text-muted">No tasks created yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {tasks.map((task) => (
                  <TaskListCard key={task.id} task={task} onEdit={openEditForm} />
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

function TaskListCard({ task, onEdit }: { task: TaskListRow; onEdit: (taskId: string) => void }) {
  const levels = offeredLevels(task);
  const requirements = REQUIREMENT_FLAGS.filter((f) => task[f.key]);
  const start = formatTaskDate(task.start_at);
  const end = formatTaskDate(task.end_at);

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border-hairline bg-surface-card p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span className="text-sm font-semibold text-text-strong">{task.title}</span>
        <div className="flex flex-none items-center gap-3">
          <button
            type="button"
            onClick={() => onEdit(task.id)}
            className="cursor-pointer text-xs font-semibold text-text-accent underline"
          >
            Edit
          </button>
          <span
            className={`rounded-full px-2.5 py-1 font-mono text-[11px] font-bold ${
              task.pending_count > 0 ? "bg-surface-accent-soft text-aa-amber-700" : "bg-surface-sunken text-text-muted"
            }`}
          >
            {task.pending_count} pending
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {levels.map(({ level, points }) => (
          <span
            key={level}
            className="inline-flex items-center gap-1 rounded-full border border-border-hairline-strong bg-surface-sunken px-2.5 py-1 font-mono text-[11px] font-semibold text-text-body"
          >
            {LEVEL_LABELS[level]} · {points} pts
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {requirements.map((r) => (
          <span
            key={r.key}
            className="rounded-full bg-surface-brand-soft px-2.5 py-1 font-mono text-[11px] font-semibold text-aa-green-800"
          >
            {r.label}
          </span>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 border-t border-border-hairline pt-3 font-mono text-xs text-text-muted">
        <span>Start: {start ?? "Available immediately"}</span>
        <span>End: {end ?? "No deadline"}</span>
      </div>
    </div>
  );
}
