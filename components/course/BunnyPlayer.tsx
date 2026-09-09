"use client";

import { useEffect, useState } from "react";

const POSITIONS = [
  "left-3 top-3", "right-3 top-3", "right-3 bottom-3", "left-3 bottom-3", "left-1/2 top-3 -translate-x-1/2",
];

export function BunnyPlayer({ sessionId, videoId, title = "Session video" }: {
  sessionId: string;
  videoId: string;
  title?: string;
}) {
  const [playback, setPlayback] = useState<{ source: string; embedUrl: string; watermark: { name: string; token: string } } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const source = `/api/course/${sessionId}/videos/${videoId}/playback`;
  const [position, setPosition] = useState(0);
  const [showSecondary, setShowSecondary] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(source, { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error("Playback unavailable");
        const url = new URL(data.embedUrl);
        if (url.origin !== "https://player.mediadelivery.net" || !url.pathname.startsWith("/embed/")) {
          throw new Error("Invalid player");
        }
        if (!controller.signal.aborted) {
          if (!data.watermark || typeof data.watermark.name !== "string" || typeof data.watermark.token !== "string") {
            throw new Error("Missing viewer watermark");
          }
          setPlayback({ source, embedUrl: url.toString(), watermark: data.watermark });
          setError(null);
        }
      } catch {
        if (!controller.signal.aborted) {
          setPlayback(null);
          setError("This video is temporarily unavailable. Please try again later.");
        }
      }
    }
    void load();
    return () => controller.abort();
  }, [source, attempt]);

  useEffect(() => {
    if (!playback) return;
    let timer: ReturnType<typeof setTimeout>;
    let secondaryTimer: ReturnType<typeof setTimeout> | undefined;
    let active = true;
    const move = () => {
      if (!active) return;
      setPosition((current) => (current + 1) % POSITIONS.length);
      const show = Math.random() < 0.45;
      setShowSecondary(show);
      if (secondaryTimer) clearTimeout(secondaryTimer);
      if (show) secondaryTimer = setTimeout(() => setShowSecondary(false), 2_500);
      timer = setTimeout(move, 8_000 + Math.floor(Math.random() * 7_000));
    };
    timer = setTimeout(move, 8_000 + Math.floor(Math.random() * 7_000));
    return () => {
      active = false;
      clearTimeout(timer);
      if (secondaryTimer) clearTimeout(secondaryTimer);
    };
  }, [playback]);

  const watermark = playback?.watermark;

  return (
    <div
      className="relative aspect-video w-full overflow-hidden rounded-card border border-border-hairline bg-surface-ink shadow-card"
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
    >
      {playback?.source === source ? (
        <div className="h-full w-full origin-center scale-[1.01]">
          <iframe
            src={playback.embedUrl}
            title={title}
            className="h-full w-full"
            allow="accelerometer; gyroscope; autoplay; encrypted-media; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-white" role="status">
          <p>{error ?? "Loading video…"}</p>
          {error && <button type="button" className="cursor-pointer underline" onClick={() => setAttempt((n) => n + 1)}>Try again</button>}
        </div>
      )}
      {watermark && (
        <>
          <div className={`pointer-events-none absolute z-10 rounded bg-black/45 px-2 py-1 font-mono text-[10px] font-medium tracking-wide text-white/75 ${POSITIONS[position]}`}>
            @{watermark.name} · {watermark.token}
          </div>
          {showSecondary && (
            <div className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded bg-black/35 px-2 py-1 font-mono text-[10px] text-white/55">
              @{watermark.name} · {watermark.token}
            </div>
          )}
        </>
      )}
    </div>
  );
}
