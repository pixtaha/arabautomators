"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BunnyPlayer } from "@/components/course/BunnyPlayer";

type Signal = { name: string; detail: string; weight: number; at: string };
const MAX_LOGS = 80;
const THRESHOLD = 8;

export function CaptureDetectionLab({ sessionId, videoId, title }: { sessionId: string; videoId: string; title: string }) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [score, setScore] = useState(0);
  const [blackout, setBlackout] = useState(false);
  const [captureActive, setCaptureActive] = useState(false);
  const [captureSupport] = useState(() => typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia ? "available (page-initiated only)" : "unavailable");
  const [mediaCount] = useState<number | null>(() => typeof document !== "undefined" ? document.querySelectorAll("video").length : null);
  const [frameStats, setFrameStats] = useState({ raf: "waiting", timerDrift: 0 });
  const captureStream = useRef<MediaStream | null>(null);
  const scoreRef = useRef(0);
  const lastFrame = useRef(0);

  const addSignal = useCallback((name: string, detail: string, weight = 0) => {
    const signal = { name, detail, weight, at: new Date().toLocaleTimeString() };
    setSignals((current) => [signal, ...current].slice(0, MAX_LOGS));
    if (weight > 0) {
      scoreRef.current = Math.min(20, scoreRef.current + weight);
      setScore(scoreRef.current);
      if (scoreRef.current >= THRESHOLD) setBlackout(true);
    }
  }, []);

  useEffect(() => {
    const listeners: Array<[EventTarget, string, EventListener]> = [];
    const listen = (target: EventTarget, type: string, handler: EventListener) => {
      target.addEventListener(type, handler);
      listeners.push([target, type, handler]);
    };
    listen(document, "visibilitychange", () => addSignal("visibilitychange", document.visibilityState));
    listen(window, "blur", () => addSignal("window blur", "focus left page", 1));
    listen(window, "focus", () => addSignal("window focus", "focus returned"));
    listen(window, "resize", () => addSignal("viewport resize", `${window.innerWidth}×${window.innerHeight}`, 1));
    listen(window, "orientationchange", () => addSignal("orientationchange", String(screen.orientation?.type ?? "unknown"), 1));
    listen(document, "fullscreenchange", () => addSignal("fullscreenchange", document.fullscreenElement ? "entered" : "exited"));
    listen(document, "pagehide", () => addSignal("pagehide", "lifecycle hidden"));
    listen(document, "pageshow", () => addSignal("pageshow", "lifecycle shown"));
    listen(document, "enterpictureinpicture", () => addSignal("enterpictureinpicture", "PiP entered", 2));
    listen(document, "leavepictureinpicture", () => addSignal("leavepictureinpicture", "PiP exited"));

    let raf = 0;
    let timer = 0;
    let lastTimer = performance.now();
    const tick = (now: number) => {
      if (lastFrame.current) {
        const gap = now - lastFrame.current;
        if (gap > 500) {
          setFrameStats((current) => ({ ...current, raf: `${Math.round(gap)}ms gap` }));
          addSignal("animation-frame stall", `${Math.round(gap)}ms`, 1);
        } else setFrameStats((current) => ({ ...current, raf: `${Math.round(gap)}ms` }));
      }
      lastFrame.current = now;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    timer = window.setInterval(() => {
      const now = performance.now();
      const drift = Math.max(0, now - lastTimer - 1000);
      lastTimer = now;
      setFrameStats((current) => ({ ...current, timerDrift: Math.round(drift) }));
      if (drift > 300) addSignal("timer drift", `${Math.round(drift)}ms`, 1);
    }, 1000);
    const decay = window.setInterval(() => {
      scoreRef.current = Math.max(0, scoreRef.current - 1);
      setScore(scoreRef.current);
    }, 5000);
    return () => {
      listeners.forEach(([target, type, handler]) => target.removeEventListener(type, handler));
      cancelAnimationFrame(raf);
      clearInterval(timer);
      clearInterval(decay);
    };
  }, [addSignal]);

  const startPageCapture = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      addSignal("getDisplayMedia", "not available");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      captureStream.current = stream;
      setCaptureActive(true);
      addSignal("page-initiated capture", "permission granted", 10);
      stream.getVideoTracks().forEach((track) => track.addEventListener("ended", () => {
        setCaptureActive(false);
        captureStream.current = null;
        addSignal("capture track ended", "permission revoked or stopped");
      }));
    } catch (error) {
      addSignal("getDisplayMedia", error instanceof DOMException ? error.name : "permission denied");
    }
  };

  const stopPageCapture = () => {
    captureStream.current?.getTracks().forEach((track) => track.stop());
    captureStream.current = null;
    setCaptureActive(false);
    addSignal("page-initiated capture", "stopped by admin");
  };

  const reset = () => {
    scoreRef.current = 0;
    setScore(0);
    setBlackout(false);
    setSignals([]);
  };

  const mediaNote = useMemo(() => mediaCount === 0
    ? "No same-origin <video> element is visible; Bunny playback is cross-origin inside the iframe."
    : "Same-origin media elements are visible to this page.", [mediaCount]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 text-foreground">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Admin diagnostic</p>
        <h1 className="mt-2 text-2xl font-semibold">Capture detection lab</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">Experimental signals only. OBS and OS recorders do not normally notify a webpage. The black cover affects this lab video only.</p>
      </header>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
        <div className="relative">
          <BunnyPlayer sessionId={sessionId} videoId={videoId} title={title} />
          {blackout && <div className="absolute inset-0 z-20 rounded-card bg-black" aria-label="Experimental capture blackout" />}
          <p className="mt-2 text-xs text-muted-foreground">Test video: {title}. Video ID is intentionally not displayed or sent by this lab.</p>
        </div>
        <div className="space-y-4 rounded-card border border-border-hairline bg-surface p-4 text-sm">
          <div className="flex items-center justify-between"><strong>Confidence</strong><span>{score}/20 (blackout ≥ {THRESHOLD})</span></div>
          <div className="h-2 overflow-hidden rounded bg-border-hairline"><div className="h-full bg-red-500 transition-all" style={{ width: `${Math.min(100, score * 5)}%` }} /></div>
          <p className="text-xs text-muted-foreground">A score is a heuristic, not proof of recording. Visibility and blur alone never trigger blackout.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded border px-3 py-2" onClick={captureActive ? stopPageCapture : startPageCapture}>{captureActive ? "Stop page capture" : "Start page capture"}</button>
            <button type="button" className="rounded border px-3 py-2" onClick={reset}>Reset</button>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs"><dt>getDisplayMedia</dt><dd>{captureSupport}</dd><dt>same-origin videos</dt><dd>{mediaCount ?? "checking"}</dd><dt>RAF</dt><dd>{frameStats.raf}</dd><dt>timer drift</dt><dd>{frameStats.timerDrift}ms</dd><dt>blackout</dt><dd>{blackout ? "active" : "inactive"}</dd></dl>
          <p className="text-xs text-muted-foreground">{mediaNote}</p>
        </div>
      </section>
      <section className="rounded-card border border-border-hairline bg-surface p-4">
        <h2 className="font-semibold">Signal log (local only)</h2>
        <p className="mt-1 text-xs text-muted-foreground">Nothing is transmitted. Frame callbacks and media stats inside Bunny’s cross-origin iframe are inaccessible to this page.</p>
        <div className="mt-3 max-h-80 overflow-auto rounded bg-black/20 p-3 font-mono text-xs">{signals.length === 0 ? <p className="text-muted-foreground">Waiting for events…</p> : signals.map((signal, index) => <p key={`${signal.at}-${index}`}><span className="text-muted-foreground">{signal.at}</span> {signal.name}: {signal.detail}{signal.weight ? ` (+${signal.weight})` : ""}</p>)}</div>
      </section>
    </main>
  );
}
