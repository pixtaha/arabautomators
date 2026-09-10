"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { VideoProviderFields, videoLinkDraft, type VideoLinkDraft } from "@/components/admin/VideoProviderFields";
import { parseVideoLink } from "@/lib/video-provider";

interface VideoPartRow {
  id: string;
  session_id: string;
  order_index: number;
  title: string;
  vdocipher_video_id: string;
}

function ChevronIcon({ direction }: { direction: "up" | "down" }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d={direction === "up" ? "M3.5 10L8 5l4.5 5" : "M3.5 6L8 11l4.5-5"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SessionVideoPartsEditor({ sessionId }: { sessionId: string }) {
  const [parts, setParts] = useState<VideoPartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newLink, setNewLink] = useState<VideoLinkDraft>(() => videoLinkDraft());
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLink, setEditLink] = useState<VideoLinkDraft>(() => videoLinkDraft());

  const load = useCallback((id: string) => {
    setLoading(true);
    fetch(`/api/admin/sessions/${id}/video`)
      .then((res) => res.json())
      .then((data) => setParts(data.parts ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(sessionId); }, [sessionId, load]);

  async function addPart(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAddError(null);
    if (!newTitle.trim()) { setAddError("Title is required."); return; }
    const parsed = parseVideoLink(newLink);
    if (parsed.error) { setAddError(parsed.error); return; }

    setAdding(true);
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}/video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim(), vdocipherVideoId: newLink.vdocipherVideoId.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.part) { setAddError(data.error ?? "Could not add video part."); return; }
      setParts((prev) => [...prev, data.part]);
      setNewTitle("");
      setNewLink(videoLinkDraft());
    } catch {
      setAddError("Could not add video part. Try again later.");
    } finally {
      setAdding(false);
    }
  }

  async function saveEdit(id: string) {
    setListError(null);
    if (!editTitle.trim()) { setListError("Title cannot be empty."); return; }
    const parsed = parseVideoLink(editLink);
    if (parsed.error) { setListError(parsed.error); return; }

    setBusyId(id);
    try {
      const response = await fetch(`/api/admin/sessions/${sessionId}/video/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim(), vdocipherVideoId: editLink.vdocipherVideoId.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.part) { setListError(data.error ?? "Could not update video part."); return; }
      setParts((prev) => prev.map((p) => (p.id === id ? data.part : p)));
      setEditingId(null);
    } catch {
      setListError("Could not update video part. Try again later.");
    } finally {
      setBusyId(null);
    }
  }

  async function removePart(id: string) {
    setListError(null);
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/sessions/${sessionId}/video/${id}`, { method: "DELETE" });
      if (!res.ok) { setListError("Could not delete video part."); return; }
      setParts((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  async function move(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= parts.length) return;
    const current = parts[index];
    const target = parts[targetIndex];

    setListError(null);
    setBusyId(current.id);
    try {
      const [a, b] = await Promise.all([
        fetch(`/api/admin/sessions/${sessionId}/video/${current.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderIndex: target.order_index }),
        }),
        fetch(`/api/admin/sessions/${sessionId}/video/${target.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderIndex: current.order_index }),
        }),
      ]);
      if (!a.ok || !b.ok) { setListError("Could not reorder video parts."); return; }
      setParts((prev) =>
        prev
          .map((p) => {
            if (p.id === current.id) return { ...p, order_index: target.order_index };
            if (p.id === target.id) return { ...p, order_index: current.order_index };
            return p;
          })
          .sort((x, y) => x.order_index - y.order_index),
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
        <div>
          <h2 className="font-display text-lg font-bold text-text-strong">Existing lecture video parts</h2>
          <p className="mt-1 text-sm text-text-muted">Ordered VdoCipher parts that make up this session&apos;s main lecture.</p>
        </div>

        {loading ? (
          <div className="h-16 animate-pulse rounded-card-inner bg-surface-sunken" />
        ) : parts.length === 0 ? (
          <p className="text-sm text-text-muted">No video parts yet for this session.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {parts.map((part, index) => (
              <div
                key={part.id}
                className="flex flex-col gap-3 rounded-card-inner border border-border-hairline bg-surface-card px-4 py-3.5 transition-colors hover:border-border-hairline-strong"
              >
                {editingId === part.id ? (
                  <>
                    <Input
                      label="Title"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      disabled={busyId === part.id}
                    />
                    <VideoProviderFields value={editLink} onChange={setEditLink} disabled={busyId === part.id} />
                    <div className="flex gap-2">
                      <Button size="sm" disabled={busyId === part.id} onClick={() => saveEdit(part.id)}>
                        {busyId === part.id ? "Saving…" : "Save"}
                      </Button>
                      <Button size="sm" variant="ghost" disabled={busyId === part.id} onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-surface-brand-soft font-display text-sm font-bold text-text-accent"
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-mono text-[10px] tracking-widest text-text-faint uppercase">Part {index + 1}</div>
                      <div className="truncate text-sm font-semibold text-text-strong">{part.title}</div>
                      <div className="truncate font-mono text-[11px] text-text-muted">{part.vdocipher_video_id}</div>
                    </div>
                    <div className="flex flex-none items-center gap-2">
                      <div className="flex flex-col overflow-hidden rounded-lg border border-border-hairline-strong" role="group" aria-label={`Reorder part ${index + 1}`}>
                        <button
                          type="button"
                          aria-label="Move part up"
                          disabled={index === 0 || busyId === part.id}
                          onClick={() => move(index, "up")}
                          className="flex h-6 w-7 cursor-pointer items-center justify-center text-text-body transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <ChevronIcon direction="up" />
                        </button>
                        <div className="h-px bg-border-hairline-strong" />
                        <button
                          type="button"
                          aria-label="Move part down"
                          disabled={index === parts.length - 1 || busyId === part.id}
                          onClick={() => move(index, "down")}
                          className="flex h-6 w-7 cursor-pointer items-center justify-center text-text-body transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <ChevronIcon direction="down" />
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={busyId === part.id}
                        onClick={() => {
                          setListError(null);
                          setEditingId(part.id);
                          setEditTitle(part.title);
                          setEditLink(videoLinkDraft(part.vdocipher_video_id));
                        }}
                        className="cursor-pointer text-xs text-text-accent underline disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busyId === part.id}
                        onClick={() => removePart(part.id)}
                        className="cursor-pointer rounded-control border border-border-hairline-strong px-2.5 py-1 text-xs font-semibold text-aa-red-700 transition-colors hover:border-aa-red-500 hover:bg-surface-danger-soft disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busyId === part.id ? "…" : "Remove"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {listError && <p role="alert" className="text-xs font-medium text-aa-red-700">{listError}</p>}
      </div>

      <div className="flex flex-col gap-4 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
        <div>
          <h2 className="font-display text-lg font-bold text-text-strong">Add a new lecture part</h2>
          <p className="mt-1 text-sm text-text-muted">Append another ordered VdoCipher part to this session&apos;s main lecture.</p>
        </div>
        <form onSubmit={addPart} className="flex flex-col gap-3">
          <Input label="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Part 2" disabled={adding} />
          <VideoProviderFields value={newLink} onChange={setNewLink} disabled={adding} />
          {addError && <p role="alert" className="text-xs font-medium text-aa-red-700">{addError}</p>}
          <Button type="submit" disabled={adding} className="self-start">
            {adding ? "Adding…" : "Add part"}
          </Button>
        </form>
      </div>
    </>
  );
}
