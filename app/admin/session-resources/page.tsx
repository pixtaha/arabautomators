"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useSupabaseUser } from "@/lib/hooks/useSupabaseUser";
import { ADMIN_EMAILS } from "@/lib/adminAllowlist";

const RESOURCE_TYPES = [
  { value: "pdf", label: "PDF" },
  { value: "voice_note", label: "Voice note" },
  { value: "workflow_file", label: "Workflow file (n8n JSON)" },
  { value: "text", label: "Text note" },
  { value: "credential_video", label: "Credential setup video" },
] as const;

type ResourceType = (typeof RESOURCE_TYPES)[number]["value"];

interface SessionOption {
  id: string;
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
  order_index: number;
}

export default function SessionResourcesAdminPage() {
  const router = useRouter();
  const { user, loading } = useSupabaseUser();

  const authorized = Boolean(user?.email && ADMIN_EMAILS.includes(user.email));

  useEffect(() => {
    if (!loading && (!user || !authorized)) {
      router.replace("/");
    }
  }, [loading, user, authorized, router]);

  const [sessions, setSessions] = useState<SessionOption[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState("");

  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [type, setType] = useState<ResourceType>("pdf");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authorized) return;
    fetch("/api/admin/sessions")
      .then((res) => res.json())
      .then((data) => {
        setSessions(data.sessions ?? []);
        if (data.sessions?.length) setSelectedSessionId((prev) => prev || data.sessions[0].id);
      })
      .finally(() => setSessionsLoading(false));
  }, [authorized]);

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
    if (type !== "text" && !file) {
      setFormError("Choose a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("sessionId", selectedSessionId);
    formData.append("type", type);
    formData.append("title", title.trim());
    if (type === "text") {
      formData.append("text", text);
    } else if (file) {
      formData.append("file", file);
    }

    setSubmitting(true);
    const res = await fetch("/api/admin/session-resources", { method: "POST", body: formData });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setFormError(data.error ?? "Something went wrong.");
      return;
    }

    setFormSuccess(`Uploaded "${data.resource.title}".`);
    setTitle("");
    setText("");
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    loadResources(selectedSessionId);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/admin/session-resources/${id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) {
      setResources((prev) => prev.filter((r) => r.id !== id));
    }
  }

  if (loading || !user || !authorized) {
    return (
      <div className="flex min-h-full flex-1 flex-col bg-surface-page font-body text-text-body">
        <Header />
        <main className="relative flex-1 overflow-hidden">
          <div className="mx-auto flex max-w-[720px] flex-col gap-6 px-4 py-16 sm:px-6">
            <div className="h-8 w-64 animate-pulse rounded-control bg-surface-sunken" />
            <div className="h-40 animate-pulse rounded-card bg-surface-sunken" />
          </div>
        </main>
        <Footer />
      </div>
    );
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
              Upload course materials for a session. This page isn&apos;t linked anywhere for
              students — keep the URL to yourself.
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
                }}
                disabled={sessionsLoading || sessions.length === 0}
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
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Session 1 slides"
            />

            {type === "text" ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="text" className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
                  Note text
                </label>
                <textarea
                  id="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={5}
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
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="cursor-pointer text-sm text-text-body file:mr-3 file:cursor-pointer file:rounded-control file:border-0 file:bg-surface-brand file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
              </div>
            )}

            {formError && <p className="text-xs font-medium text-aa-red-700">{formError}</p>}
            {formSuccess && <p className="text-xs font-medium text-text-accent">{formSuccess}</p>}

            <Button type="submit" disabled={submitting} className="self-start">
              {submitting ? "Uploading…" : "Upload resource"}
            </Button>
          </form>

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
                    className="flex items-center justify-between gap-3 rounded-card-inner border border-border-hairline bg-surface-card px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] tracking-widest text-text-faint uppercase">
                          {r.type}
                        </span>
                      </div>
                      <div className="truncate text-sm font-semibold text-text-strong">{r.title}</div>
                    </div>
                    {r.file_url && (
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
