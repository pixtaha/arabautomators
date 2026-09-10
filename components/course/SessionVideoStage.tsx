"use client";

import { VdoCipherPlayer } from "@/components/course/VdoCipherPlayer";
import { useSessionVideo } from "@/components/course/SessionVideoContext";

export function SessionVideoStage({ sessionId }: { sessionId: string }) {
  const { selectedPart } = useSessionVideo();
  if (!selectedPart) return null;

  return (
    <section
      className="flex flex-col gap-3 rounded-card border border-border-hairline bg-surface-card p-3 shadow-card sm:p-6"
      aria-label="Session video"
    >
      <h2 className="font-display text-lg font-bold text-text-strong">{selectedPart.title}</h2>
      {selectedPart.source ? (
        <VdoCipherPlayer
          key={`${sessionId}:${selectedPart.id}`}
          sessionId={sessionId}
          partId={selectedPart.id}
          title={selectedPart.title}
        />
      ) : (
        <div
          className="flex aspect-video items-center justify-center rounded-card bg-surface-ink p-4 text-center text-sm text-white"
          role="status"
        >
          This video is temporarily unavailable.
        </div>
      )}
    </section>
  );
}
