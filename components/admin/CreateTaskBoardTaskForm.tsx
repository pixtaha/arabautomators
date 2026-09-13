"use client";

import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ALLOWED_CODE_LANGUAGES } from "@/lib/taskBoardConstants";

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

type ResourceType = "image" | "video" | "pdf" | "code";

const RESOURCE_TYPE_OPTIONS: { value: ResourceType; label: string }[] = [
  { value: "image", label: "Image" },
  { value: "video", label: "Video (YouTube/Vimeo link)" },
  { value: "pdf", label: "PDF" },
  { value: "code", label: "Code" },
];

interface ResourceDraft {
  key: string; // local React key only, never sent to the server
  type: ResourceType;
  label: string;
  scope: "general" | "levels";
  levels: LevelKey[];
  url: string; // video link, or the uploaded image/pdf's public URL
  codeContent: string;
  codeLanguage: string;
  uploading: boolean;
  uploadedFileName: string | null;
  uploadError: string | null;
}

let resourceKeySeq = 0;
function emptyResource(): ResourceDraft {
  resourceKeySeq += 1;
  return {
    key: `resource-${resourceKeySeq}`,
    type: "image",
    label: "",
    scope: "general",
    levels: [],
    url: "",
    codeContent: "",
    codeLanguage: ALLOWED_CODE_LANGUAGES[0],
    uploading: false,
    uploadedFileName: null,
    uploadError: null,
  };
}

// Decoupled from task creation: an image/pdf resource file is uploaded
// here the moment it's picked, and the resource draft just carries back
// the resulting public URL -- the main create-task request stays plain
// JSON, matching every other field on this form.
async function uploadResourceFile(type: "image" | "pdf", file: File): Promise<{ url: string } | { error: string }> {
  const formData = new FormData();
  formData.append("type", type);
  formData.append("file", file);
  const res = await fetch("/api/admin/task-board/resource-uploads", { method: "POST", body: formData });
  const data = await res.json().catch(() => null);
  if (!res.ok) return { error: data?.error ?? "Upload failed." };
  return { url: data.url as string };
}

// Mirrors the "add a resource" form in SessionResourcesAdminClient.tsx:
// a self-contained create form, toggled open/closed by the parent, that
// resets itself after a successful create rather than closing -- creating
// several tasks in a row (the expected pre-launch workflow) shouldn't
// require reopening the form each time.
export function CreateTaskBoardTaskForm({ onCancel }: { onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [requiresLink, setRequiresLink] = useState(false);
  const [requiresPdf, setRequiresPdf] = useState(false);
  const [requiresImage, setRequiresImage] = useState(false);
  const [requiresVideo, setRequiresVideo] = useState(false);
  const [requiresFile, setRequiresFile] = useState(true);
  const [submissionLinkLabel, setSubmissionLinkLabel] = useState("");
  const [requiresCode, setRequiresCode] = useState(false);
  const [requiresScreenshots, setRequiresScreenshots] = useState(false);
  const [levels, setLevels] = useState<Record<LevelKey, LevelState>>(emptyLevels());
  const [resources, setResources] = useState<ResourceDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  function updateLevel(key: LevelKey, patch: Partial<LevelState>) {
    setLevels((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  }

  function updateResource(key: string, patch: Partial<ResourceDraft>) {
    setResources((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeResource(key: string) {
    setResources((prev) => prev.filter((r) => r.key !== key));
  }

  function toggleResourceLevel(key: string, level: LevelKey) {
    setResources((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        const has = r.levels.includes(level);
        return { ...r, levels: has ? r.levels.filter((l) => l !== level) : [...r.levels, level] };
      }),
    );
  }

  async function handleResourceFilePick(key: string, type: "image" | "pdf", file: File | null) {
    if (!file) return;
    updateResource(key, { uploading: true, uploadError: null });
    const result = await uploadResourceFile(type, file);
    if ("error" in result) {
      updateResource(key, { uploading: false, uploadError: result.error, url: "", uploadedFileName: null });
      return;
    }
    updateResource(key, { uploading: false, url: result.url, uploadedFileName: file.name, uploadError: null });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }

    if (!requiresLink && !requiresPdf && !requiresImage && !requiresVideo && !requiresFile) {
      setFormError("Require at least one submission type (Link, PDF, Image, Video, or File).");
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

    if (startAt && endAt && new Date(startAt).getTime() > new Date(endAt).getTime()) {
      setFormError("Start date must be before end date.");
      return;
    }

    if (resources.some((r) => r.uploading)) {
      setFormError("Wait for every resource file to finish uploading.");
      return;
    }
    for (const r of resources) {
      if (r.type === "code" && !r.codeContent.trim()) {
        setFormError("Every code resource needs its code content.");
        return;
      }
      if (r.type !== "code" && !r.url.trim()) {
        setFormError(
          r.type === "video" ? "Every video resource needs a URL." : `Every ${r.type} resource needs an uploaded file.`,
        );
        return;
      }
      if (r.scope === "levels" && r.levels.length === 0) {
        setFormError("Choose at least one level for every 'Specific levels' resource, or switch it to General.");
        return;
      }
    }

    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      startAt: startAt ? new Date(startAt).toISOString() : null,
      endAt: endAt ? new Date(endAt).toISOString() : null,
      requiresLink,
      requiresPdf,
      requiresImage,
      requiresVideo,
      requiresFile,
      submissionLinkLabel: requiresLink && submissionLinkLabel.trim() ? submissionLinkLabel.trim() : null,
      requiresCode,
      requiresScreenshots,
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
      resources: resources.map((r) => ({
        type: r.type,
        label: r.label.trim() || null,
        scope: r.scope,
        levels: r.scope === "levels" ? r.levels : [],
        url: r.type === "code" ? null : r.url.trim(),
        codeContent: r.type === "code" ? r.codeContent.trim() : null,
        codeLanguage: r.type === "code" ? r.codeLanguage : null,
      })),
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
      setFormSuccess(
        data.resourcesError
          ? `Created "${data.task?.title ?? title.trim()}", but: ${data.resourcesError}`
          : `Created "${data.task?.title ?? title.trim()}".`,
      );
      setTitle("");
      setDescription("");
      setStartAt("");
      setEndAt("");
      setRequiresLink(false);
      setRequiresPdf(false);
      setRequiresImage(false);
      setRequiresVideo(false);
      setRequiresFile(true);
      setSubmissionLinkLabel("");
      setRequiresCode(false);
      setRequiresScreenshots(false);
      setLevels(emptyLevels());
      setResources([]);
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
          id="task-start-at"
          label="Start date (optional)"
          type="date"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
          disabled={submitting}
        />
        <Input
          id="task-end-at"
          label="End date (optional)"
          type="date"
          value={endAt}
          onChange={(e) => setEndAt(e.target.value)}
          disabled={submitting}
        />
      </div>
      <p className="-mt-2 text-xs text-text-faint">
        Leave start date blank to make the task available immediately. Before the start date, students see the task
        as &quot;starts on&quot; and can&apos;t attempt it yet.
      </p>

      <div className="flex flex-col gap-3 border-t-2 border-border-hairline pt-4">
        <span className="font-mono text-[11px] font-bold tracking-widest text-text-muted uppercase">Submission requirements</span>
        <p className="text-xs text-text-muted">
          At least one of Link / PDF / Image / Video / File must be required. Code and Screenshots are always
          optional extras, on top of whichever of those are checked.
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-4">
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={requiresLink}
              onChange={(e) => setRequiresLink(e.target.checked)}
              disabled={submitting}
              className="h-4 w-4 cursor-pointer"
            />
            <span className="text-sm font-semibold text-text-strong">Link</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={requiresPdf}
              onChange={(e) => setRequiresPdf(e.target.checked)}
              disabled={submitting}
              className="h-4 w-4 cursor-pointer"
            />
            <span className="text-sm font-semibold text-text-strong">PDF</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={requiresImage}
              onChange={(e) => setRequiresImage(e.target.checked)}
              disabled={submitting}
              className="h-4 w-4 cursor-pointer"
            />
            <span className="text-sm font-semibold text-text-strong">Image</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={requiresVideo}
              onChange={(e) => setRequiresVideo(e.target.checked)}
              disabled={submitting}
              className="h-4 w-4 cursor-pointer"
            />
            <span className="text-sm font-semibold text-text-strong">Video</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={requiresFile}
              onChange={(e) => setRequiresFile(e.target.checked)}
              disabled={submitting}
              className="h-4 w-4 cursor-pointer"
            />
            <span className="text-sm font-semibold text-text-strong">File (generic)</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={requiresCode}
              onChange={(e) => setRequiresCode(e.target.checked)}
              disabled={submitting}
              className="h-4 w-4 cursor-pointer"
            />
            <span className="text-sm font-semibold text-text-strong">Code</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2.5">
            <input
              type="checkbox"
              checked={requiresScreenshots}
              onChange={(e) => setRequiresScreenshots(e.target.checked)}
              disabled={submitting}
              className="h-4 w-4 cursor-pointer"
            />
            <span className="text-sm font-semibold text-text-strong">Screenshots</span>
          </label>
        </div>

        {requiresLink && (
          <Input
            id="task-submission-link-label"
            label="Link field label (optional)"
            value={submissionLinkLabel}
            onChange={(e) => setSubmissionLinkLabel(e.target.value)}
            placeholder="e.g. Tally form link (defaults to “Submission link”)"
            disabled={submitting}
          />
        )}
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

      <div className="flex flex-col gap-3 border-t-2 border-border-hairline pt-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[11px] font-bold tracking-widest text-text-muted uppercase">Resources (optional)</span>
          <button
            type="button"
            onClick={() => setResources((prev) => [...prev, emptyResource()])}
            disabled={submitting}
            className="cursor-pointer text-xs font-semibold text-text-accent underline"
          >
            + Add resource
          </button>
        </div>
        <p className="text-xs text-text-muted">
          Illustrative reference material shown alongside the task -- images, videos, PDFs, or example code. Each one
          needs an explicit visibility choice: General (shown for every level) or Specific levels.
        </p>

        {resources.length === 0 && <p className="text-xs text-text-faint">No resources added yet.</p>}

        {resources.map((r) => (
          <div key={r.key} className="flex flex-col gap-3 rounded-card-inner border border-border-hairline bg-surface-card p-4">
            <div className="flex items-center justify-between gap-2">
              <select
                value={r.type}
                onChange={(e) =>
                  updateResource(r.key, {
                    type: e.target.value as ResourceType,
                    url: "",
                    uploadedFileName: null,
                    uploadError: null,
                  })
                }
                disabled={submitting}
                className="h-11 rounded-control border border-border-hairline-strong bg-surface-card px-3.5 text-sm text-text-strong focus:border-surface-brand focus:outline-none focus:ring-2 focus:ring-surface-brand/25"
              >
                {RESOURCE_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeResource(r.key)}
                disabled={submitting}
                className="flex-none cursor-pointer text-xs font-semibold text-aa-red-700 underline"
              >
                Remove
              </button>
            </div>

            <Input
              label="Label (optional)"
              value={r.label}
              onChange={(e) => updateResource(r.key, { label: e.target.value })}
              placeholder="e.g. Example workflow screenshot"
              disabled={submitting}
            />

            {r.type === "code" ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[11px] tracking-widest text-text-muted uppercase">Language</label>
                  <select
                    value={r.codeLanguage}
                    onChange={(e) => updateResource(r.key, { codeLanguage: e.target.value })}
                    disabled={submitting}
                    className="h-11 rounded-control border border-border-hairline-strong bg-surface-card px-3.5 text-sm text-text-strong focus:border-surface-brand focus:outline-none focus:ring-2 focus:ring-surface-brand/25"
                  >
                    {ALLOWED_CODE_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  dir="ltr"
                  value={r.codeContent}
                  onChange={(e) => updateResource(r.key, { codeContent: e.target.value })}
                  rows={5}
                  disabled={submitting}
                  placeholder="Paste example code"
                  className="w-full resize-y rounded-control border border-border-hairline-strong bg-surface-card p-3 font-mono text-xs text-text-body outline-none focus:border-surface-brand focus:ring-2 focus:ring-surface-brand/25"
                />
              </>
            ) : r.type === "video" ? (
              <Input
                label="Video URL (YouTube/Vimeo)"
                value={r.url}
                onChange={(e) => updateResource(r.key, { url: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                disabled={submitting}
              />
            ) : (
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
                  {r.type === "pdf" ? "PDF file" : "Image file"}
                </label>
                <input
                  type="file"
                  accept={r.type === "pdf" ? "application/pdf" : "image/png,image/jpeg,image/webp"}
                  disabled={submitting || r.uploading}
                  onChange={(e) => handleResourceFilePick(r.key, r.type as "image" | "pdf", e.target.files?.[0] ?? null)}
                  className="cursor-pointer text-sm text-text-body file:mr-3 file:cursor-pointer file:rounded-control file:border-0 file:bg-surface-brand file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
                {r.uploading && <p className="text-xs text-text-muted">Uploading…</p>}
                {r.uploadedFileName && !r.uploading && (
                  <p className="text-xs text-text-accent">Uploaded: {r.uploadedFileName}</p>
                )}
                {r.uploadError && <p className="text-xs font-medium text-aa-red-700">{r.uploadError}</p>}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">Visible to</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateResource(r.key, { scope: "general" })}
                  disabled={submitting}
                  className={`h-9 rounded-full border-2 px-3 text-xs font-semibold transition-colors ${
                    r.scope === "general"
                      ? "border-surface-brand bg-surface-brand-soft text-aa-green-800"
                      : "border-border-hairline bg-surface-card text-text-body"
                  }`}
                >
                  General
                </button>
                <button
                  type="button"
                  onClick={() => updateResource(r.key, { scope: "levels" })}
                  disabled={submitting}
                  className={`h-9 rounded-full border-2 px-3 text-xs font-semibold transition-colors ${
                    r.scope === "levels"
                      ? "border-surface-brand bg-surface-brand-soft text-aa-green-800"
                      : "border-border-hairline bg-surface-card text-text-body"
                  }`}
                >
                  Specific levels
                </button>
              </div>
              {r.scope === "levels" && (
                <div className="flex gap-3">
                  {LEVEL_KEYS.map((lv) => (
                    <label key={lv} className="flex cursor-pointer items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={r.levels.includes(lv)}
                        onChange={() => toggleResourceLevel(r.key, lv)}
                        disabled={submitting}
                        className="h-4 w-4 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-text-strong">{LEVEL_LABELS[lv]}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
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
