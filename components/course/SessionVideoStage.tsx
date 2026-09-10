"use client";

import { VdoCipherPlayer } from "@/components/course/VdoCipherPlayer";
import { useSessionVideo } from "@/components/course/SessionVideoContext";
import { ArrowIcon } from "@/components/course/ArrowIcon";

export function SessionVideoStage({ sessionId }: { sessionId: string }) {
  const { selectedPart, selectPart, lecturePartIds } = useSessionVideo();
  if (!selectedPart) return null;

  const lectureIndex = lecturePartIds.indexOf(selectedPart.id);
  const showPartNav = lectureIndex !== -1 && lecturePartIds.length > 1;

  return (
    <section
      className="flex flex-col gap-3 rounded-card border border-border-hairline bg-surface-card p-3 shadow-card sm:p-6"
      aria-label="Session video"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-text-strong">{selectedPart.title}</h2>
        {showPartNav && (
          <div className="flex items-center gap-2" aria-label="Lecture part navigation">
            <button
              type="button"
              aria-label="Previous part"
              disabled={lectureIndex === 0}
              onClick={() => selectPart(lecturePartIds[lectureIndex - 1])}
              className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-surface-sunken text-text-strong transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowIcon direction="left" />
            </button>
            <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
              Part {lectureIndex + 1} of {lecturePartIds.length}
            </span>
            <button
              type="button"
              aria-label="Next part"
              disabled={lectureIndex === lecturePartIds.length - 1}
              onClick={() => selectPart(lecturePartIds[lectureIndex + 1])}
              className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-surface-sunken text-text-strong transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowIcon direction="right" />
            </button>
          </div>
        )}
      </div>
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
