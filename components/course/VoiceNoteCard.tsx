"use client";

import { useRef, useState } from "react";

// Fixed bar heights (not real waveform data) so the visualization is stable
// across renders — only the played/unplayed color sweeps as playback advances.
const WAVE_HEIGHTS = [
  30, 55, 80, 42, 68, 92, 50, 74, 36, 60, 88, 46, 70, 34, 58, 96, 44, 66, 28, 54, 78, 40, 62, 86, 38, 52,
];

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="ml-0.5 h-3.5 w-3.5" aria-hidden="true">
      <path d="M4 2.5v11l9-5.5-9-5.5z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
      <rect x="3.5" y="2.5" width="3" height="11" rx="0.5" />
      <rect x="9.5" y="2.5" width="3" height="11" rx="0.5" />
    </svg>
  );
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function VoiceNoteCard({ title, fileUrl }: { title: string; fileUrl: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const progress = duration > 0 ? currentTime / duration : 0;
  const displayTime = playing ? currentTime : duration || currentTime;

  return (
    <div className="rounded-card-inner bg-surface-sunken p-3.5">
      <audio
        ref={audioRef}
        src={fileUrl}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        className="hidden"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={playing ? "Pause voice note" : "Play voice note"}
          onClick={() => {
            const audio = audioRef.current;
            if (!audio) return;
            if (playing) audio.pause();
            else audio.play();
          }}
          className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-surface-brand text-white transition-colors hover:bg-surface-brand-hover"
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>

        <div className="flex h-[26px] flex-1 items-end gap-[2px]">
          {WAVE_HEIGHTS.map((h, i) => (
            <span
              key={i}
              className={`flex-1 rounded-sm transition-colors duration-200 ease-[var(--ease-smooth)] ${
                i / WAVE_HEIGHTS.length < progress ? "bg-surface-brand" : "bg-aa-neutral-400"
              }`}
              style={{ height: `${Math.round(h * 0.26)}px` }}
            />
          ))}
        </div>

        <span className="font-mono text-[11px] text-text-muted tabular-nums">{formatTime(displayTime)}</span>
      </div>
      <div className="mt-2.5 text-sm text-text-body">{title}</div>
    </div>
  );
}
