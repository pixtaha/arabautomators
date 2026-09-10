"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { VideoProviderFields, videoLinkDraft } from "@/components/admin/VideoProviderFields";
import { SessionVideoPartsEditor } from "@/components/admin/SessionVideoPartsEditor";
import { CreateSessionForm, type CreatedSession, type ModuleOption } from "@/components/admin/CreateSessionForm";
import { parseVideoLink, resolveVideoSource, type VideoProvider } from "@/lib/video-provider";
import {
  SESSION_RESOURCE_MAX_FILE_SIZE_BYTES,
  SESSION_RESOURCE_MAX_FILE_SIZE_LABEL,
  isVideoResource,
} from "@/lib/sessionResources";

const RESOURCE_TYPES = [
  { value: "pdf", label: "PDF" },
  { value: "voice_note", label: "Voice note" },
  { value: "workflow_file", label: "Workflow file (n8n JSON)" },
  { value: "text", label: "Text note" },
  { value: "video", label: "General session video" },
  { value: "credential_video", label: "Credential setup video" },
] as const;

type ResourceType = (typeof RESOURCE_TYPES)[number]["value"];

interface SessionOption {
  id: string;
  title: string;
  orderIndex: number;
  moduleId: string | null;
}

interface ResourceRow {
  id: string;
  type: string;
  title: string;
  file_url: string | null;
  video_provider: VideoProvider | null;
  vdocipher_video_id: string | null;
  order_index: number;
  file_size_bytes: number | null;
  page_count: number | null;
}

interface UploadResponse {
  resource?: ResourceRow;
  error?: string;
}

interface PushResult {
  subdomain: string;
  studentName: string;
  success: boolean;
  message: string;
}

interface PushWorkflowResponse {
  results?: PushResult[];
  summary?: { total: number; succeeded: number; failed: number };
  error?: string;
}

function SectionHeading({ eyebrow, title, hint }: { eyebrow: string; title: string; hint?: string }) {
  return (
    <div>
      <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">{eyebrow}</span>
      <h2 className="font-display text-xl font-bold tracking-tight text-text-strong">{title}</h2>
      {hint && <p className="mt-1 text-sm text-text-muted">{hint}</p>}
    </div>
  );
}

function uploadSessionResource(
  formData: FormData,
  onProgress: (percent: number) => void,
): Promise<{ status: number; data: UploadResponse }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/session-resources");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
      }
    };

    xhr.onload = () => {
      let data: UploadResponse = {};
      try {
        data = JSON.parse(xhr.responseText) as UploadResponse;
      } catch {
        // A non-JSON response is reported as a generic upload failure below.
      }
      resolve({ status: xhr.status, data });
    };

    xhr.onerror = () => resolve({ status: 0, data: { error: "Upload failed. Check your connection and try again." } });
    xhr.onabort = () => resolve({ status: 0, data: { error: "Upload was cancelled." } });
    xhr.send(formData);
  });
}

export function SessionResourcesAdminClient() {
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);

  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [type, setType] = useState<ResourceType>("pdf");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [videoLink, setVideoLink] = useState(() => videoLinkDraft());
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [replacementVideoLink, setReplacementVideoLink] = useState(() => videoLinkDraft());
  const [pageCount, setPageCount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [workflowFile, setWorkflowFile] = useState<File | null>(null);
  const workflowFileInputRef = useRef<HTMLInputElement>(null);
  const [pushing, setPushing] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [pushResults, setPushResults] = useState<PushResult[]>([]);
  const [pushSummary, setPushSummary] = useState<{ total: number; succeeded: number; failed: number } | null>(null);

  useEffect(() => {
    fetch("/api/admin/sessions")
      .then((res) => res.json())
      .then((data) => {
        setModules(data.modules ?? []);
        setSessions(data.sessions ?? []);
        if (data.modules?.length) setSelectedModuleId((prev) => prev || data.modules[0].id);
      })
      .finally(() => setModulesLoading(false));
  }, []);

  const sessionsInModule = sessions
    .filter((s) => s.moduleId === selectedModuleId)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const selectedModule = modules.find((m) => m.id === selectedModuleId) ?? null;

  // Derived, not stored: falls back to the module's first session whenever the
  // explicitly chosen one isn't (or is no longer) in the selected module.
  const activeEditingId = (editingSessionId && sessionsInModule.some((s) => s.id === editingSessionId))
    ? editingSessionId
    : (sessionsInModule[0]?.id ?? null);

  function handleSessionCreated(session: CreatedSession) {
    const option: SessionOption = {
      id: session.id,
      title: session.title,
      orderIndex: session.order_index,
      moduleId: session.module_id,
    };
    setSessions((prev) => [...prev, option]);
    setEditingSessionId(option.id);
    setShowCreateSession(false);
  }

  const loadResources = useCallback((moduleId: string) => {
    if (!moduleId) return;
    setResourcesLoading(true);
    fetch(`/api/admin/session-resources?moduleId=${moduleId}`)
      .then((res) => res.json())
      .then((data) => setResources(data.resources ?? []))
      .finally(() => setResourcesLoading(false));
  }, []);

  useEffect(() => {
    if (selectedModuleId) loadResources(selectedModuleId);
  }, [selectedModuleId, loadResources]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!selectedModuleId) {
      setFormError("Choose a module first.");
      return;
    }
    if (!title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (type === "text" && !text.trim()) {
      setFormError("Note text is required.");
      return;
    }
    if (isVideoResource(type)) {
      const parsed = parseVideoLink(videoLink);
      if (parsed.error) { setFormError(parsed.error); return; }
    }
    if (type !== "text" && !isVideoResource(type) && !file) {
      setFormError("Choose a file to upload.");
      return;
    }
    if (!isVideoResource(type) && file && file.size > SESSION_RESOURCE_MAX_FILE_SIZE_BYTES) {
      setFormError(`File must be ${SESSION_RESOURCE_MAX_FILE_SIZE_LABEL} or smaller.`);
      return;
    }

    const formData = new FormData();
    formData.append("moduleId", selectedModuleId);
    formData.append("type", type);
    formData.append("title", title.trim());
    if (type === "text") {
      formData.append("text", text);
    } else if (isVideoResource(type)) {
      formData.append("vdocipherVideoId", videoLink.vdocipherVideoId.trim());
    } else if (file) {
      formData.append("file", file);
    }
    if (type === "pdf" && pageCount.trim()) {
      formData.append("pageCount", pageCount.trim());
    }

    setSubmitting(true);
    setUploadProgress(type === "text" || isVideoResource(type) ? null : 0);

    try {
      const { status, data } = await uploadSessionResource(formData, (percent) => {
        if (!isVideoResource(type)) setUploadProgress(percent);
      });

      if (status < 200 || status >= 300 || !data.resource) {
        setFormError(data.error ?? "Something went wrong.");
        return;
      }

      setFormSuccess(`${isVideoResource(type) ? "Linked" : "Uploaded"} "${data.resource.title}".`);
      setTitle("");
      setText("");
      setVideoLink(videoLinkDraft());
      setPageCount("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadResources(selectedModuleId);
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  }

  async function linkExistingVideo(id: string) {
    setFormError(null);
    const parsed = parseVideoLink(replacementVideoLink);
    if (parsed.error) { setFormError(parsed.error); return; }
    setSubmitting(true);
    try {
      const response = await fetch(`/api/admin/session-resources/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(replacementVideoLink),
      });
      const data = await response.json();
      if (!response.ok) { setFormError(data.error ?? "Could not link video."); return; }
      setLinkingId(null);
      setReplacementVideoLink(videoLinkDraft());
      setFormSuccess("Video link updated.");
      loadResources(selectedModuleId);
    } catch {
      setFormError("Could not link video. Try again later.");
    } finally { setSubmitting(false); }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/admin/session-resources/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      setResources((prev) => prev.filter((r) => r.id !== id));
    }
  }

  async function handlePushWorkflow() {
    setPushError(null);
    setPushResults([]);
    setPushSummary(null);

    if (!workflowFile) {
      setPushError("Choose a workflow JSON file first.");
      return;
    }
    if (!window.confirm("Push this workflow to all provisioned students now?")) {
      return;
    }

    const formData = new FormData();
    formData.append("file", workflowFile);

    setPushing(true);
    try {
      const res = await fetch("/api/admin/push-workflow", { method: "POST", body: formData });
      const data = (await res.json()) as PushWorkflowResponse;

      if (!res.ok || !data.results) {
        setPushError(data.error ?? "Something went wrong.");
        return;
      }

      setPushResults(data.results);
      setPushSummary(data.summary ?? null);
      setWorkflowFile(null);
      if (workflowFileInputRef.current) workflowFileInputRef.current.value = "";
    } catch {
      setPushError("Request failed. Check your connection and try again.");
    } finally {
      setPushing(false);
    }
  }

  const editingSession = sessionsInModule.find((s) => s.id === activeEditingId) ?? null;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
      <Header />

      <main className="relative flex-1 overflow-hidden">
        <div className="mx-auto flex max-w-[820px] flex-col gap-10 px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
              Internal · admin only
            </span>
            <h1 className="font-display text-[32px] font-extrabold tracking-[-0.03em] text-text-strong">
              Session &amp; module resources
            </h1>
            <p className="max-w-[60ch] text-sm leading-relaxed text-text-muted">
              Pick a module, then manage its sessions (with each session&apos;s lecture video parts) and its shared
              resources — PDFs, notes, voice notes, workflow files, and videos, visible to every session in the module.
            </p>
          </div>

          <section className="flex flex-col gap-3 rounded-card border border-border-hairline bg-surface-card p-5 shadow-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div>
                <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">Step 1</span>
                <h2 id="module-picker-heading" className="font-display text-lg font-bold text-text-strong">Select a module</h2>
              </div>
              <select
                id="module"
                aria-labelledby="module-picker-heading"
                value={selectedModuleId}
                onChange={(e) => {
                  setSelectedModuleId(e.target.value);
                  setShowCreateSession(false);
                }}
                disabled={modulesLoading || modules.length === 0}
                className="h-11 min-w-0 rounded-control border border-border-hairline-strong bg-surface-card px-3.5 text-sm text-text-strong focus:border-surface-brand focus:outline-none focus:ring-2 focus:ring-surface-brand/25 sm:w-[380px]"
              >
                {modules.length === 0 && <option>No modules found</option>}
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    Module {m.orderIndex}: {m.title}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {selectedModuleId && (
            <>
              {/* Sessions in this module */}
              <div className="flex flex-col gap-4">
                <SectionHeading
                  eyebrow="Step 2"
                  title="Sessions in this module"
                  hint="Create sessions and manage each one's lecture video parts."
                />

                <section className="flex flex-col gap-4 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
                  {sessionsInModule.length === 0 ? (
                    <p className="text-sm text-text-muted">No sessions yet in this module.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {sessionsInModule.map((s) => (
                        <div
                          key={s.id}
                          className={`flex items-center justify-between gap-3 rounded-card-inner border px-4 py-3 transition-colors ${
                            activeEditingId === s.id
                              ? "border-surface-brand bg-surface-brand-soft"
                              : "border-border-hairline bg-surface-card hover:border-border-hairline-strong"
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="font-mono text-[10px] tracking-widest text-text-faint uppercase">
                              Session {s.orderIndex}
                            </div>
                            <div className="truncate text-sm font-semibold text-text-strong">{s.title}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingSessionId(s.id)}
                            className="flex-none cursor-pointer rounded-control border border-border-hairline-strong bg-surface-card px-3 py-1.5 text-xs font-semibold text-text-accent transition-colors hover:bg-surface-hover"
                          >
                            {activeEditingId === s.id ? "Editing lecture parts" : "Manage lecture parts"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t border-border-hairline pt-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateSession((v) => !v)}
                      className="cursor-pointer text-xs font-semibold text-text-accent underline"
                    >
                      {showCreateSession ? "Cancel" : "+ Create new session"}
                    </button>
                  </div>
                </section>

                {showCreateSession && selectedModule && (
                  <CreateSessionForm
                    modules={[selectedModule]}
                    onCreated={handleSessionCreated}
                    onCancel={() => setShowCreateSession(false)}
                  />
                )}

                {editingSession && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 rounded-card-inner border border-border-hairline-strong bg-surface-sunken px-4 py-2.5">
                      <span className="font-mono text-[10px] tracking-widest text-text-faint uppercase">Editing</span>
                      <span className="text-sm font-semibold text-text-strong">
                        Session {editingSession.orderIndex}: {editingSession.title}
                      </span>
                    </div>
                    <SessionVideoPartsEditor key={editingSession.id} sessionId={editingSession.id} />
                  </div>
                )}
              </div>

              {/* Module resources */}
              <div className="flex flex-col gap-4">
                <SectionHeading
                  eyebrow="Step 3"
                  title="Module resources"
                  hint={`Shared across all ${sessionsInModule.length || 0} session${sessionsInModule.length === 1 ? "" : "s"} in this module.`}
                />

                <form
                  onSubmit={handleSubmit}
                  className="flex flex-col gap-4 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card"
                >
                  <div>
                    <h3 className="font-display text-base font-bold text-text-strong">Add a resource</h3>
                    <p className="mt-1 text-sm text-text-muted">
                      Upload or link a document, note, recording, workflow, or video for{" "}
                      <span className="font-semibold text-text-strong">
                        Module {selectedModule?.orderIndex}: {selectedModule?.title}
                      </span>
                      .
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="type" className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
                      Resource type
                    </label>
                    <select
                      id="type"
                      value={type}
                      onChange={(e) => setType(e.target.value as ResourceType)}
                      disabled={submitting}
                      className="h-11 rounded-control border border-border-hairline-strong bg-surface-card px-3.5 text-sm text-text-strong focus:border-surface-brand focus:outline-none focus:ring-2 focus:ring-surface-brand/25"
                    >
                      {RESOURCE_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    id="resource-title"
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Session 1 slides"
                    disabled={submitting}
                  />

                  {isVideoResource(type) ? (
                    <VideoProviderFields value={videoLink} onChange={setVideoLink} disabled={submitting} />
                  ) : type === "text" ? (
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="text" className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
                        Note text
                      </label>
                      <textarea
                        id="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        rows={5}
                        disabled={submitting}
                        className="w-full resize-y rounded-control border border-border-hairline-strong bg-surface-card p-3.5 text-sm text-text-body outline-none focus:border-surface-brand focus:ring-2 focus:ring-surface-brand/25"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="resource-file" className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
                        File
                      </label>
                      <input
                        id="resource-file"
                        ref={fileInputRef}
                        type="file"
                        onChange={(e) => {
                          const selectedFile = e.target.files?.[0] ?? null;
                          setFormError(null);

                          if (selectedFile && selectedFile.size > SESSION_RESOURCE_MAX_FILE_SIZE_BYTES) {
                            setFile(null);
                            e.target.value = "";
                            setFormError(`File must be ${SESSION_RESOURCE_MAX_FILE_SIZE_LABEL} or smaller.`);
                            return;
                          }

                          setFile(selectedFile);
                        }}
                        disabled={submitting}
                        className="cursor-pointer text-sm text-text-body file:mr-3 file:cursor-pointer file:rounded-control file:border-0 file:bg-surface-brand file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-white"
                      />
                      <p className="text-xs text-text-muted">
                        Maximum file size: {SESSION_RESOURCE_MAX_FILE_SIZE_LABEL}.
                      </p>
                    </div>
                  )}

                  {type === "pdf" && (
                    <Input
                      label="Page count (optional)"
                      type="number"
                      min="1"
                      step="1"
                      value={pageCount}
                      onChange={(e) => setPageCount(e.target.value)}
                      placeholder="e.g. 22"
                      disabled={submitting}
                    />
                  )}

                  {uploadProgress !== null && (
                    <div className="flex flex-col gap-2 rounded-control border border-border-hairline-strong bg-surface-sunken px-3.5 py-3">
                      <div className="flex items-center justify-between gap-3 text-xs font-medium text-text-body">
                        <span>{uploadProgress < 100 ? "Uploading file…" : "Upload received. Saving resource…"}</span>
                        <span className="font-mono tabular-nums text-text-strong">{uploadProgress}%</span>
                      </div>
                      <div
                        role="progressbar"
                        aria-label="File upload progress"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={uploadProgress}
                        className="h-1.5 w-full overflow-hidden rounded-full bg-border-hairline"
                      >
                        <div
                          className="h-full rounded-full bg-surface-brand transition-[width] duration-200 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {formError && <p className="text-xs font-medium text-aa-red-700">{formError}</p>}
                  {formSuccess && <p className="text-xs font-medium text-text-accent">{formSuccess}</p>}

                  <Button type="submit" disabled={submitting} className="self-start">
                    {submitting ? "Saving…" : isVideoResource(type) ? "Link video" : "Upload resource"}
                  </Button>
                </form>

                <section className="flex flex-col gap-3 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
                  <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
                    Uploaded for this module
                  </span>

                  {resourcesLoading ? (
                    <div className="h-24 animate-pulse rounded-card-inner bg-surface-sunken" />
                  ) : resources.length === 0 ? (
                    <p className="text-sm text-text-muted">Nothing uploaded yet for this module.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {resources.map((r) => (
                        <div
                          key={r.id}
                          className={`flex gap-3 rounded-card-inner border border-border-hairline bg-surface-card px-4 py-3 ${isVideoResource(r.type) ? "flex-wrap items-start" : "items-center justify-between"}`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] tracking-widest text-text-faint uppercase">
                                {r.type}
                              </span>
                            </div>
                            <div className="truncate text-sm font-semibold text-text-strong">{r.title}</div>
                          </div>
                          {isVideoResource(r.type) && (
                            <div className={`flex min-w-0 flex-col gap-2 ${linkingId === r.id ? "order-last w-full" : ""}`}>
                              <span className="text-xs text-text-muted">{resolveVideoSource(r.video_provider, null, r.vdocipher_video_id)
                                ? "VdoCipher video linked" : "Needs video link"}</span>
                              {linkingId === r.id ? (
                                <>
                                  <VideoProviderFields value={replacementVideoLink} onChange={setReplacementVideoLink} disabled={submitting} />
                                  <button type="button" disabled={submitting} onClick={() => linkExistingVideo(r.id)} className="cursor-pointer text-xs text-text-accent underline">Save video link</button>
                                  <button type="button" disabled={submitting} onClick={() => setLinkingId(null)} className="cursor-pointer text-xs text-text-muted underline">Cancel</button>
                                </>
                              ) : (
                                <button type="button" disabled={submitting} onClick={() => { setLinkingId(r.id); setReplacementVideoLink(videoLinkDraft(r.vdocipher_video_id)); }} className="cursor-pointer text-xs text-text-accent underline">{resolveVideoSource(r.video_provider, null, r.vdocipher_video_id) ? "Replace video" : "Link video"}</button>
                              )}
                            </div>
                          )}
                          {!isVideoResource(r.type) && r.file_url && (
                            <a
                              href={r.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-text-accent hover:underline"
                            >
                              view
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id)}
                            disabled={deletingId === r.id}
                            className="flex-none cursor-pointer rounded-control border border-border-hairline-strong px-3 py-1.5 text-xs font-semibold text-aa-red-700 transition-colors hover:border-aa-red-500 hover:bg-surface-danger-soft disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === r.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </>
          )}

          <div className="flex flex-col gap-4 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
            <div className="flex flex-col gap-1">
              <h2 className="font-display text-lg font-bold text-text-strong">Push Workflow to All Students</h2>
              <p className="max-w-[60ch] text-sm leading-relaxed text-text-muted">
                Upload an n8n workflow JSON file to create it directly inside every provisioned student&apos;s live n8n
                instance via its API. This is separate from the &quot;Workflow file&quot; resource type above, which
                only stores a downloadable file.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="workflow-file" className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
                Workflow JSON file
              </label>
              <input
                id="workflow-file"
                ref={workflowFileInputRef}
                type="file"
                accept=".json"
                onChange={(e) => {
                  setPushError(null);
                  setWorkflowFile(e.target.files?.[0] ?? null);
                }}
                disabled={pushing}
                className="cursor-pointer text-sm text-text-body file:mr-3 file:cursor-pointer file:rounded-control file:border-0 file:bg-surface-brand file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
            </div>

            {pushError && <p className="text-xs font-medium text-aa-red-700">{pushError}</p>}

            <Button type="button" onClick={handlePushWorkflow} disabled={pushing || !workflowFile} className="self-start">
              {pushing ? "Pushing to all students…" : "Push to All Students"}
            </Button>

            {pushing && (
              <div className="flex items-center gap-2 text-xs font-medium text-text-muted">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-border-hairline-strong border-t-surface-brand" />
                This can take a few seconds for all 33 instances…
              </div>
            )}

            {pushSummary && (
              <p className="text-xs font-medium text-text-body">
                {pushSummary.succeeded} succeeded, {pushSummary.failed} failed (of {pushSummary.total}).
              </p>
            )}

            {pushResults.length > 0 && (
              <div className="flex flex-col gap-2">
                {pushResults.map((r) => (
                  <div
                    key={r.subdomain}
                    className="flex items-center justify-between gap-3 rounded-card-inner border border-border-hairline bg-surface-card px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-text-strong">
                        {r.studentName} <span className="font-mono text-xs text-text-faint">({r.subdomain})</span>
                      </div>
                      <div className={`truncate text-xs ${r.success ? "text-text-muted" : "text-aa-red-700"}`}>
                        {r.message}
                      </div>
                    </div>
                    <span
                      className={`flex-none font-mono text-[10px] tracking-widest uppercase ${
                        r.success ? "text-text-accent" : "text-aa-red-700"
                      }`}
                    >
                      {r.success ? "success" : "failed"}
                    </span>
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
