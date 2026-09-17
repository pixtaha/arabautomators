"use client";

import { useEffect, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { SessionResourceRow } from "@/lib/data/courseSessions";

// Same mixed Arabic/English word-based detection as
// components/dashboard/TaskBoardClient.tsx, duplicated here rather than
// shared -- this codebase's established convention for small view-layer
// helpers (see that file's own comment on why character-count comparisons
// break down on prose mixed with English/API jargon).
const ARABIC_CHAR_RE = /[؀-ۿ]/;
const LATIN_CHAR_RE = /[A-Za-z]/;

function isArabicText(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  let arabicWords = 0;
  let latinWords = 0;
  for (const word of words) {
    if (ARABIC_CHAR_RE.test(word)) arabicWords++;
    else if (LATIN_CHAR_RE.test(word)) latinWords++;
  }
  return arabicWords >= latinWords;
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// No Tailwind Typography plugin in this project (checked package.json / the
// v4 @plugin directives in app/globals.css -- neither is registered), so
// markdown elements are styled explicitly here rather than via a `prose`
// class, keeping this component self-contained instead of adding a new
// global Tailwind plugin just for one modal.
const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="font-display text-lg font-bold text-text-strong">{children}</h1>,
  h2: ({ children }) => <h2 className="font-display text-base font-bold text-text-strong">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-bold text-text-strong">{children}</h3>,
  p: ({ children }) => <p className="text-sm leading-relaxed text-text-body">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 text-sm text-text-body">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 text-sm text-text-body">{children}</ol>,
  li: ({ children }) => <li className="mt-1">{children}</li>,
  strong: ({ children }) => <strong className="font-bold text-text-strong">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-text-accent underline">
      {children}
    </a>
  ),
  // Fenced code blocks carry a "language-xxx" className from remark; inline
  // `code` spans don't -- react-markdown v9+ dropped the old `inline` prop,
  // so this is the current recommended way to tell them apart.
  code({ className, children }) {
    const match = /language-(\w+)/.exec(className ?? "");
    if (!match) {
      return <code className="rounded bg-surface-sunken px-1 py-0.5 font-mono text-xs">{children}</code>;
    }
    return (
      <div dir="ltr" className="overflow-hidden rounded-card-inner border border-border-hairline text-xs">
        <SyntaxHighlighter language={match[1]} style={oneLight} customStyle={{ margin: 0, fontSize: "12px" }}>
          {String(children).replace(/\n$/, "")}
        </SyntaxHighlighter>
      </div>
    );
  },
};

export function TextNoteModal({ resource, onClose }: { resource: SessionResourceRow; onClose: () => void }) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!resource.file_url) {
      setError("This note has no content.");
      return;
    }
    let cancelled = false;
    fetch(resource.file_url)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error("fetch failed"))))
      .then((text) => {
        if (!cancelled) setContent(text);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load this note.");
      });
    return () => {
      cancelled = true;
    };
  }, [resource.file_url]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-surface-ink/[0.34] p-4 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-xl flex-col gap-4 overflow-y-auto rounded-[20px] border border-border-hairline bg-surface-card p-6 shadow-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            dir={isArabicText(resource.title) ? "rtl" : "ltr"}
            className="font-display text-xl font-bold tracking-tight text-text-strong"
          >
            {resource.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex-none text-text-faint hover:text-text-strong"
          >
            <CloseIcon />
          </button>
        </div>

        {error && <p className="text-sm text-aa-red-700">{error}</p>}
        {!error && content === null && <div className="h-24 animate-pulse rounded-card-inner bg-surface-sunken" />}
        {!error && content !== null && (
          <div dir={isArabicText(content) ? "rtl" : "ltr"} className="flex flex-col gap-2 [overflow-wrap:anywhere]">
            <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
