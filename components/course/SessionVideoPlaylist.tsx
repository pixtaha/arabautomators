"use client";

import { useId, useState } from "react";
import { VdoCipherPlayer } from "@/components/course/VdoCipherPlayer";
import type { SessionVideoPart } from "@/lib/session-video-parts";

export function SessionVideoPlaylist({ sessionId, parts }: { sessionId: string; parts: SessionVideoPart[] }) {
  const [selectedId, setSelectedId] = useState(parts[0]?.id);
  const playerId = useId();
  const selected = parts.find((part) => part.id === selectedId) ?? parts[0];
  if (!selected) return null;

  return (
    <section className="flex flex-col gap-4 rounded-card border border-border-hairline bg-surface-card p-3 shadow-card sm:p-6" aria-label="Session videos">
      <div id={playerId}>
        {selected.source ? (
          <VdoCipherPlayer key={`${sessionId}:${selected.id}`} sessionId={sessionId} partId={selected.id} title={selected.title} />
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-card bg-surface-ink p-4 text-center text-sm text-white" role="status">This video is temporarily unavailable.</div>
        )}
      </div>
      <h2 className="font-display text-lg font-bold text-text-strong">Video parts</h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {parts.map((part, index) => (
          <button
            key={part.id}
            type="button"
            aria-pressed={part.id === selected.id}
            aria-controls={playerId}
            onClick={() => setSelectedId(part.id)}
            className={`min-w-0 cursor-pointer rounded-card-inner border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface-brand ${part.id === selected.id ? "border-surface-brand bg-surface-brand-soft" : "border-border-hairline bg-surface-sunken hover:bg-surface-hover"}`}
          >
            <span className="block font-mono text-[11px] text-text-muted">Part {index + 1}</span>
            <span className="mt-1 block break-words text-sm font-semibold text-text-strong">{part.title}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
