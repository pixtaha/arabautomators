"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Script from "next/script";
import { UnsupportedBrowserCard } from "@/components/course/UnsupportedBrowserCard";
import { isUnsupportedVdoCipherBrowser } from "@/lib/vdocipher-browser";

// The browser identity is stable for this document. Keep SSR/hydration on the loading UI.
const subscribeToBrowser = () => () => {};
const getBrowserSnapshot = () => isUnsupportedVdoCipherBrowser(navigator.userAgent);
const getServerSnapshot = () => null;

// VdoCipher's official player API (loaded below via player.vdocipher.com/v2/api.js)
// exposes a global VdoPlayer.getInstance(iframe) -> { video, api }. `video`
// mirrors HTMLMediaElement: addEventListener('play' | 'pause' | 'timeupdate'
// | 'ended' | ...) behaves exactly like a normal <video>, but every property
// read (currentTime, duration) resolves as a Promise, since the actual
// element lives inside the cross-origin iframe and can't be read
// synchronously. This is the officially documented integration point (see
// vdocipher.com/docs/player/v2/api-reference/accessing-player/ and
// .../video-apis/) -- not raw postMessage parsing.
interface VdoCipherVideoProxy {
  readonly currentTime: number | Promise<number>;
  readonly duration: number | Promise<number>;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

declare global {
  interface Window {
    VdoPlayer?: { getInstance(iframe: HTMLIFrameElement): { video: VdoCipherVideoProxy } };
  }
}

// Sampled on this interval while playing, rather than on every single
// 'timeupdate' tick (which can fire multiple times a second) -- plus an
// immediate flush on pause/ended so stopping early still records an
// accurate position.
const PROGRESS_REPORT_INTERVAL_MS = 12_000;

export function VdoCipherPlayer({ sessionId, partId, title }: { sessionId: string; partId: string; title: string }) {
  const unsupportedBrowser = useSyncExternalStore(subscribeToBrowser, getBrowserSnapshot, getServerSnapshot);
  const source = `/api/course/${encodeURIComponent(sessionId)}/parts/${encodeURIComponent(partId)}/playback`;
  const [playback, setPlayback] = useState<{ source: string; embedUrl: string } | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [scriptReady, setScriptReady] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

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

  // Wires up watch-progress reporting once both the api.js script and this
  // part's iframe have loaded. VdoCipherPlayer is remounted (via a `key`
  // keyed on sessionId+partId in SessionVideoStage) on every part switch, so
  // this effect's cleanup runs on every switch as well as on unmount -- no
  // stale interval/listener can leak onto a different part's iframe.
  useEffect(() => {
    if (!scriptReady || !iframeLoaded) return;
    const iframe = iframeRef.current;
    if (!iframe || !window.VdoPlayer) return;

    const player = window.VdoPlayer.getInstance(iframe);
    let disposed = false;

    async function report() {
      const [position, duration] = await Promise.all([
        Promise.resolve(player.video.currentTime),
        Promise.resolve(player.video.duration),
      ]);
      if (disposed || !Number.isFinite(position)) return;
      fetch("/api/course/video-progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          sessionVideoPartId: partId,
          positionSeconds: position,
          durationSeconds: Number.isFinite(duration) && duration > 0 ? duration : undefined,
        }),
      }).catch(() => {
        // Best-effort telemetry -- a failed report must never affect playback.
      });
    }

    const interval = setInterval(() => void report(), PROGRESS_REPORT_INTERVAL_MS);
    const onReport = () => void report();
    // "play" is reported too (not just pause/ended) so that opening the
    // video is enough to mark it watched server-side -- without this, a
    // student who starts playback and then closes the tab or navigates away
    // inside the first PROGRESS_REPORT_INTERVAL_MS never sends a report at
    // all, since the interval hasn't fired yet and neither pause nor ended
    // ever does either.
    player.video.addEventListener("play", onReport);
    player.video.addEventListener("pause", onReport);
    player.video.addEventListener("ended", onReport);

    return () => {
      disposed = true;
      clearInterval(interval);
      player.video.removeEventListener("play", onReport);
      player.video.removeEventListener("pause", onReport);
      player.video.removeEventListener("ended", onReport);
    };
  }, [scriptReady, iframeLoaded, partId]);

  if (unsupportedBrowser) return <UnsupportedBrowserCard />;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-card border border-border-hairline bg-surface-ink shadow-card">
      <Script id="vdocipher-player-api" src="https://player.vdocipher.com/v2/api.js" onReady={() => setScriptReady(true)} />
      {playback?.source === source ? (
        <iframe
          ref={iframeRef}
          onLoad={() => setIframeLoaded(true)}
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
