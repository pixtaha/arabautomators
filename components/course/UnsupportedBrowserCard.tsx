"use client";

import { useId, useState } from "react";

export function UnsupportedBrowserCard() {
  const titleId = useId();
  const linkId = useId();
  const [copyState, setCopyState] = useState<"idle" | "copied" | "manual">("idle");
  const [pageLink, setPageLink] = useState("");

  async function copyPageLink() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
    } catch {
      setPageLink(url);
      setCopyState("manual");
    }
  }

  return (
    <section
      aria-labelledby={titleId}
      className="flex min-h-72 w-full flex-col items-center justify-center rounded-card border border-border-hairline bg-surface-card px-5 py-8 text-center shadow-card sm:min-h-96 sm:px-10 sm:py-10"
    >
      <span className="rounded-full bg-surface-brand-soft px-3 py-1.5 font-mono text-[11px] font-medium tracking-wide text-text-accent">
        Protected course video
      </span>
      <h2 id={titleId} className="mt-5 max-w-md font-display text-xl leading-snug font-bold text-text-strong sm:text-2xl">
        Protected playback requires a supported browser
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-text-body sm:text-base">
        For the best and most secure viewing experience, please open Arab Automators using <strong className="font-semibold">Google Chrome</strong> or <strong className="font-semibold">Brave</strong>.
      </p>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-text-muted">
        Safari is not currently supported for protected course videos.
      </p>
      <button
        type="button"
        onClick={() => void copyPageLink()}
        className="mt-6 min-h-11 w-full cursor-pointer rounded-control border border-border-hairline-strong bg-surface-card px-5 py-2.5 text-sm font-semibold text-text-body transition-colors hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface-brand sm:w-auto"
      >
        Copy page link
      </button>
      <p role="status" aria-live="polite" className="mt-2 min-h-5 max-w-md text-xs leading-relaxed text-text-accent">
        {copyState === "copied" && "Link copied. Paste it into Google Chrome or Brave."}
        {copyState === "manual" && "Automatic copying is unavailable. Select and copy the link below."}
      </p>
      {copyState === "manual" && (
        <div className="mt-3 w-full max-w-md text-left">
          <label htmlFor={linkId} className="text-xs font-medium text-text-body">Page link</label>
          <input
            id={linkId}
            type="text"
            readOnly
            value={pageLink}
            onFocus={(event) => event.currentTarget.select()}
            className="mt-1 min-h-11 w-full min-w-0 rounded-control border border-border-hairline bg-surface-sunken px-3 py-2 text-base text-text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-surface-brand"
          />
        </div>
      )}
    </section>
  );
}
