"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { UnsupportedBrowserCard } from "@/components/course/UnsupportedBrowserCard";
import { isUnsupportedVdoCipherBrowser } from "@/lib/vdocipher-browser";

// The browser identity is stable for this document. Keep SSR/hydration on the loading UI.
const subscribeToBrowser = () => () => {};
const getBrowserSnapshot = () => isUnsupportedVdoCipherBrowser(navigator.userAgent);
const getServerSnapshot = () => null;

export function VdoCipherPlayer({ sessionId, partId, title }: { sessionId: string; partId: string; title: string }) {
  const unsupportedBrowser = useSyncExternalStore(subscribeToBrowser, getBrowserSnapshot, getServerSnapshot);
  const source = `/api/course/${encodeURIComponent(sessionId)}/parts/${encodeURIComponent(partId)}/playback`;
  const [playback, setPlayback] = useState<{ source: string; embedUrl: string } | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // Resolve support before requesting authorization or loading the third-party iframe.
    if (unsupportedBrowser !== false) return;

    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(source, {
          method: "POST", credentials: "same-origin", cache: "no-store", signal: controller.signal,
        });
        if (!response.ok) throw new Error("Playback unavailable");
        const data = await response.json();
        const url = new URL(data.embedUrl);
        if (url.origin !== "https://player.vdocipher.com" || url.pathname !== "/v2/" ||
            url.username || url.password || !url.searchParams.get("otp") || !url.searchParams.get("playbackInfo")) {
          throw new Error("Invalid player");
        }
        if (!controller.signal.aborted) {
          setPlayback({ source, embedUrl: url.toString() });
          setError(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setPlayback(null);
          setError(true);
        }
      }
    }
    void load();
    return () => controller.abort();
  }, [source, attempt, unsupportedBrowser]);

  if (unsupportedBrowser) return <UnsupportedBrowserCard />;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-card border border-border-hairline bg-surface-ink shadow-card">
      {playback?.source === source ? (
        <iframe
          src={playback.embedUrl}
          title={title}
          className="absolute inset-0 h-full w-full border-0"
          allow="autoplay; encrypted-media; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center text-sm text-white" role="status">
          <p>{error ? "This video is temporarily unavailable. Please try again later." : "Loading video…"}</p>
          {error && <button type="button" className="cursor-pointer underline" onClick={() => { setError(false); setAttempt((n) => n + 1); }}>Try again</button>}
        </div>
      )}
    </div>
  );
}
