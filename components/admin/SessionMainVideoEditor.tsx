"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { VideoProviderFields, videoLinkDraft } from "@/components/admin/VideoProviderFields";
import { parseVideoLink, type VideoProvider } from "@/lib/video-provider";

export interface MainVideoSession {
  id: string;
  main_video_provider: VideoProvider | null;
  main_video_vdocipher_id: string | null;
}

export function SessionMainVideoEditor({ session, onSaved }: { session: MainVideoSession; onSaved: (session: MainVideoSession) => void }) {
  const [value, setValue] = useState(() => videoLinkDraft(session.main_video_vdocipher_id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    const parsed = parseVideoLink(value);
    if (parsed.error) { setError(parsed.error); return; }
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/sessions/${session.id}/video`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value),
      });
      const data = await response.json();
      if (!response.ok || !data.session) { setError(data.error ?? "Could not link the main session video."); return; }
      setValue(videoLinkDraft(data.session.main_video_vdocipher_id));
      onSaved(data.session);
      setSuccess(true);
    } catch {
      setError("Could not link the main session video. Try again later.");
    } finally { setSaving(false); }
  }

  return (
    <form onSubmit={save} aria-label="Main session video" className="flex flex-col gap-4 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
      <div>
        <h2 className="font-display text-lg font-bold text-text-strong">Main session video</h2>
        <p className="mt-1 text-sm text-text-muted">The primary recording for the selected session.</p>
      </div>
      <VideoProviderFields value={value} onChange={(next) => { setValue(next); setSuccess(false); setError(null); }} disabled={saving} />
      {error && <p role="alert" className="text-xs font-medium text-aa-red-700">{error}</p>}
      <p role="status" className="text-xs font-medium text-text-accent">{success ? "Main session video linked." : ""}</p>
      <Button type="submit" disabled={saving} className="self-start">{saving ? "Saving…" : "Link main video"}</Button>
    </form>
  );
}
