"use client";

import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const SUBMISSION_FORMATS = [
  { value: "link", label: "Link" },
  { value: "pdf", label: "PDF" },
  { value: "image", label: "Image" },
  { value: "video", label: "Video" },
  { value: "file", label: "File (generic)" },
] as const;

type SubmissionFormat = (typeof SUBMISSION_FORMATS)[number]["value"];
type LevelKey = "base" | "medium" | "hard";

const LEVEL_LABELS: Record<LevelKey, string> = { base: "Base", medium: "Medium", hard: "Hard" };
const LEVEL_KEYS: LevelKey[] = ["base", "medium", "hard"];

interface LevelState {
  enabled: boolean;
  points: string;
  description: string;
  checklist: string;
}

function emptyLevel(enabled: boolean): LevelState {
  return { enabled, points: "", description: "", checklist: "" };
}

function emptyLevels(): Record<LevelKey, LevelState> {
  return { base: emptyLevel(true), medium: emptyLevel(false), hard: emptyLevel(false) };
}

// Mirrors the "add a resource" form in SessionResourcesAdminClient.tsx:
// a self-contained create form, toggled open/closed by the parent, that
// resets itself after a successful create rather than closing -- creating
// several tasks in a row (the expected pre-launch workflow) shouldn't
// require reopening the form each time.
export function CreateTaskBoardTaskForm({ onCancel }: { onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [submissionFormat, setSubmissionFormat] = useState<SubmissionFormat>("file");
  const [levels, setLevels] = useState<Record<LevelKey, LevelState>>(emptyLevels());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  function updateLevel(key: LevelKey, patch: Partial<LevelState>) {
    setLevels((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }

    const enabledKeys = LEVEL_KEYS.filter((key) => levels[key].enabled);
    if (enabledKeys.length === 0) {
      setFormError("Enable at least one level (Base, Medium, or Hard).");
      return;
    }

    for (const key of enabledKeys) {
      const points = levels[key].points.trim();
      if (!points || !Number.isInteger(Number(points)) || Number(points) < 0) {
        setFormError(`${LEVEL_LABELS[key]} level needs a non-negative whole number of points.`);
        return;
      }
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      dueAt: dueAt ? new Date(dueAt).toISOString() : null,
      submissionFormat,
      levels: Object.fromEntries(
        LEVEL_KEYS.map((key) => {
          const lv = levels[key];
          return [
            key,
            {
              enabled: lv.enabled,
              points: lv.enabled ? Number(lv.points) : null,
              description: lv.enabled && lv.description.trim() ? lv.description.trim() : null,
              checklist: lv.enabled
                ? lv.checklist
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean)
                : [],
            },
          ];
        }),
      ),
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/task-board/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setFormError(data?.error ?? "Could not create task.");
        return;
      }
      setFormSuccess(`Created "${data.task?.title ?? title.trim()}".`);
      setTitle("");
      setDescription("");
      setDueAt("");
      setSubmissionFormat("file");
      setLevels(emptyLevels());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card"
    >
      <div>
        <h3 className="font-display text-base font-bold text-text-strong">New task</h3>
        <p className="mt-1 text-sm text-text-muted">
          At least one level must be enabled — that&apos;s what students will be able to attempt.
        </p>
      </div>

      <Input
        id="task-title"
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Build your first webhook workflow"
        disabled={submitting}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="task-description" className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
          Description (general / fallback)
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          disabled={submitting}
          placeholder="Shown for any level that doesn't have its own description."
          className="w-full resize-y rounded-control border border-border-hairline-strong bg-surface-card p-3.5 text-sm text-text-body outline-none focus:border-surface-brand focus:ring-2 focus:ring-surface-brand/25"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="task-due-at"
          label="Due date (optional)"
          type="date"
          value={dueAt}
          onChange={(e) => setDueAt(e.target.value)}
          disabled={submitting}
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="task-submission-format" className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
            Submission format
          </label>
          <select
            id="task-submission-format"
            value={submissionFormat}
            onChange={(e) => setSubmissionFormat(e.target.value as SubmissionFormat)}
            disabled={submitting}
            className="h-11 rounded-control border border-border-hairline-strong bg-surface-card px-3.5 text-sm text-text-strong focus:border-surface-brand focus:outline-none focus:ring-2 focus:ring-surface-brand/25"
          >
            {SUBMISSION_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t-2 border-border-hairline pt-4">
        <span className="font-mono text-[11px] font-bold tracking-widest text-text-muted uppercase">Levels</span>
        {LEVEL_KEYS.map((key) => {
          const lv = levels[key];
          return (
            <div
              key={key}
              className={`flex flex-col gap-3 rounded-card-inner border p-4 transition-colors ${
                lv.enabled ? "border-border-hairline-strong bg-surface-sunken" : "border-border-hairline bg-surface-card"
              }`}
            >
              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={lv.enabled}
                  onChange={(e) => updateLevel(key, { enabled: e.target.checked })}
                  disabled={submitting}
                  className="h-4 w-4 cursor-pointer"
                />
                <span className="text-sm font-semibold text-text-strong">{LEVEL_LABELS[key]}</span>
              </label>

              {lv.enabled && (
                <div className="flex flex-col gap-3 pl-6">
                  <Input
                    id={`task-points-${key}`}
                    label="Points"
                    type="number"
                    min={0}
                    step={1}
                    value={lv.points}
                    onChange={(e) => updateLevel(key, { points: e.target.value })}
                    placeholder="e.g. 30"
                    disabled={submitting}
                  />
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={`task-desc-${key}`} className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
                      {LEVEL_LABELS[key]} description (optional)
                    </label>
                    <textarea
                      id={`task-desc-${key}`}
                      value={lv.description}
                      onChange={(e) => updateLevel(key, { description: e.target.value })}
                      rows={2}
                      disabled={submitting}
                      placeholder="Leave blank to fall back to the general description above."
                      className="w-full resize-y rounded-control border border-border-hairline-strong bg-surface-card p-3 text-sm text-text-body outline-none focus:border-surface-brand focus:ring-2 focus:ring-surface-brand/25"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={`task-checklist-${key}`} className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
                      {LEVEL_LABELS[key]} checklist (optional, one item per line)
                    </label>
                    <textarea
                      id={`task-checklist-${key}`}
                      value={lv.checklist}
                      onChange={(e) => updateLevel(key, { checklist: e.target.value })}
                      rows={3}
                      disabled={submitting}
                      placeholder={"Webhook node responds with 200\nPayload is written to the correct table"}
                      className="w-full resize-y rounded-control border border-border-hairline-strong bg-surface-card p-3 text-sm text-text-body outline-none focus:border-surface-brand focus:ring-2 focus:ring-surface-brand/25"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {formError && <p className="text-xs font-medium text-aa-red-700">{formError}</p>}
      {formSuccess && <p className="text-xs font-medium text-text-accent">{formSuccess}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="cursor-pointer rounded-control px-4 py-2 text-sm font-semibold text-text-body hover:bg-surface-hover"
        >
          Close
        </button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create task"}
        </Button>
      </div>
    </form>
  );
}
