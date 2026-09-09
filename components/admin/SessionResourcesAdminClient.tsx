"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { VideoProviderFields, videoLinkDraft } from "@/components/admin/VideoProviderFields";
import { SessionMainVideoEditor, type MainVideoSession } from "@/components/admin/SessionMainVideoEditor";
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

interface SessionOption extends MainVideoSession {
  title: string;
  orderIndex: number;
  moduleOrderIndex: number | null;
}

interface ResourceRow {
  id: string;
  type: string;
  title: string;
  file_url: string | null;
  bunny_video_id: string | null;
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
  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState("");

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
        setSessions(data.sessions ?? []);
        if (data.sessions?.length) setSelectedSessionId((prev) => prev || data.sessions[0].id);
      })
      .finally(() => setSessionsLoading(false));
  }, []);

  const loadResources = useCallback((sessionId: string) => {
    if (!sessionId) return;
    fetch(`/api/admin/session-resources?sessionId=${sessionId}`)
      .then((res) => res.json())
      .then((data) => setResources(data.resources ?? []))
      .finally(() => setResourcesLoading(false));
  }, []);

  useEffect(() => {
    if (selectedSessionId) loadResources(selectedSessionId);
  }, [selectedSessionId, loadResources]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!selectedSessionId) {
      setFormError("Choose a session first.");
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
    formData.append("sessionId", selectedSessionId);
    formData.append("type", type);
    formData.append("title", title.trim());
    if (type === "text") {
      formData.append("text", text);
    } else if (isVideoResource(type)) {
      formData.append("videoProvider", videoLink.videoProvider);
      formData.append(videoLink.videoProvider === "vdocipher" ? "vdocipherVideoId" : "bunnyVideoId",
        (videoLink.videoProvider === "vdocipher" ? videoLink.vdocipherVideoId : videoLink.bunnyVideoId).trim());
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
      loadResources(selectedSessionId);
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
      loadResources(selectedSessionId);
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

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
      <Header />

      <main className="relative flex-1 overflow-hidden">
        <div className="mx-auto flex max-w-[720px] flex-col gap-8 px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-2">
            <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
              Internal · admin only
            </span>
            <h1 className="font-display text-[32px] font-extrabold tracking-[-0.03em] text-text-strong">
              Session resources
            </h1>
            <p className="max-w-[60ch] text-sm leading-relaxed text-text-muted">
              Upload course materials for a session.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card"
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="session" className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
                Session
              </label>
              <select
                id="session"
                value={selectedSessionId}
                onChange={(e) => {
                  setResourcesLoading(true);
                  setSelectedSessionId(e.target.value);
                  setLinkingId(null);
                }}
                disabled={submitting || sessionsLoading || sessions.length === 0}
                className="h-11 rounded-control border border-border-hairline-strong bg-surface-card px-3.5 text-sm text-text-strong focus:border-surface-brand focus:outline-none focus:ring-2 focus:ring-surface-brand/25"
              >
                {sessions.length === 0 && <option>No sessions found</option>}
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.moduleOrderIndex !== null ? `Module ${s.moduleOrderIndex} · ` : ""}
                    Session {s.orderIndex}: {s.title}
                  </option>
                ))}
              </select>
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

          {sessions.filter((session) => session.id === selectedSessionId).map((session) => (
            <SessionMainVideoEditor key={session.id} session={session}
              onSaved={(updated) => setSessions((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item))} />
          ))}

          <div className="flex flex-col gap-3">
            <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
              Uploaded for this session
            </span>

            {resourcesLoading ? (
              <div className="h-24 animate-pulse rounded-card bg-surface-sunken" />
            ) : resources.length === 0 ? (
              <p className="text-sm text-text-muted">Nothing uploaded yet for this session.</p>
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
                        <span className="text-xs text-text-muted">{resolveVideoSource(r.video_provider, r.bunny_video_id, r.vdocipher_video_id)
                          ? `${r.video_provider === "vdocipher" ? "VdoCipher" : "Bunny"} video linked` : "Needs video link"}</span>
                        {linkingId === r.id ? (
                          <>
                            <VideoProviderFields value={replacementVideoLink} onChange={setReplacementVideoLink} disabled={submitting} />
                            <button type="button" disabled={submitting} onClick={() => linkExistingVideo(r.id)} className="cursor-pointer text-xs text-text-accent underline">Save video link</button>
                            <button type="button" disabled={submitting} onClick={() => setLinkingId(null)} className="cursor-pointer text-xs text-text-muted underline">Cancel</button>
                          </>
                        ) : (
                          <button type="button" disabled={submitting} onClick={() => { setLinkingId(r.id); setReplacementVideoLink(videoLinkDraft(r.video_provider, r.bunny_video_id, r.vdocipher_video_id)); }} className="cursor-pointer text-xs text-text-accent underline">{resolveVideoSource(r.video_provider, r.bunny_video_id, r.vdocipher_video_id) ? "Replace video" : "Link video"}</button>
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
          </div>

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
