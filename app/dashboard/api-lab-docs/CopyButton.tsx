"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

// Reusable copy-to-clipboard button. Replaces two separate hand-rolled
// implementations from the original page: the code-block "Copy" buttons and
// the Base URL icon button were driven by one shared vanilla-JS click
// handler in an embedded <script> tag (necessary there because that page's
// content was a dangerouslySetInnerHTML string, not real JSX). Here both are
// just this one component with a different `variant`.
interface CopyButtonProps {
  value: string;
  label: string;
  variant?: "label" | "icon";
}

const LABEL_BUTTON_STYLE: CSSProperties = {
  padding: "5px 10px",
  background: "#1E1E1E",
  border: "1px solid #303030",
  borderRadius: 8,
  font: "var(--fw-bold) 11px/1.2 var(--font-mono)",
  letterSpacing: ".08em",
  textTransform: "uppercase",
  cursor: "pointer",
  transition: "color 140ms var(--ease-smooth), background 140ms var(--ease-smooth)",
};

export function CopyButton({ value, label, variant = "label" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  async function copy() {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
      } catch {
        fallbackCopy(value);
      }
    } else {
      fallbackCopy(value);
    }
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        className={`lab-copy-btn${copied ? " is-copied" : ""}`}
        onClick={copy}
        aria-label={label}
        title={label}
      >
        <svg className="lab-copy-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
        </svg>
        <svg className="lab-copied-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      style={{ ...LABEL_BUTTON_STYLE, color: copied ? "var(--aa-green-300)" : "#A3A3A3" }}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function fallbackCopy(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand("copy");
  } catch {
    // Best-effort only -- same fallback the original page used.
  }
  document.body.removeChild(textarea);
}
