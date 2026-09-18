"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/Button";

// Verified against api-lab/app/security.py's APIKeyHeader declaration.
const HEADER_NAME = "X-API-Key";
const MASK = "••••••••••••••••••••";
type CredentialState =
  | { status: "loading" }
  | { status: "ready"; credential: string }
  | { status: "missing" }
  | { status: "error"; signIn: boolean };

export function CommerceCredentialDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // The reference runtime renders its own React root inside the static
    // fragment. Delegate only its credential trigger to this page component.
    function handleClick(event: MouseEvent) {
      if (event.target instanceof Element && event.target.closest(".api-lab-docs [data-commerce-credential]")) {
        setOpen(true);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Unmounting on close drops the credential and resets visibility every time.
  return open ? <CredentialDialog onClose={() => setOpen(false)} /> : null;
}

function CredentialDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<CredentialState>({ status: "loading" });
  const [visible, setVisible] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const dialog = dialogRef.current!;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    // Bound loading even when the connection stalls; closing aborts it too.
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    let disposed = false;
    async function load() {
      try {
        const response = await fetch("/api/api-lab/credential", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          if (!disposed) setState({ status: "error", signIn: response.status === 401 });
          return;
        }
        const data: unknown = await response.json();
        if (!data || typeof data !== "object" || !("credential" in data)) throw new Error();
        if (disposed) return;
        if (data.credential === null) {
          setState({ status: "missing" });
        } else if (typeof data.credential === "string" && data.credential.length > 0) {
          setState({ status: "ready", credential: data.credential });
        } else {
          throw new Error();
        }
      } catch {
        if (!disposed) setState({ status: "error", signIn: false });
      } finally {
        window.clearTimeout(timeout);
      }
    }
    void load();
    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [attempt]);

  // Chromium's native <dialog> focus trap doesn't wrap at either edge in
  // every build -- confirmed with a zero-React, zero-app-code repro (a bare
  // <dialog autofocus> with showModal(), no app code at all, still lets
  // Shift+Tab from the first element and Tab from the last one escape to
  // <body>). Everything else about the native trap (blocking escape via
  // mouse, inertness outside the dialog, movement within it) already works
  // and is left alone; this only patches the two broken edges.
  function handleTrapKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hasAttribute("disabled"));
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <dialog
      ref={dialogRef}
      id="commerce-credential-dialog"
      className="api-lab-docs lab-credential-dialog"
      aria-labelledby="commerce-credential-title"
      aria-describedby="commerce-credential-description"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onKeyDown={handleTrapKeyDown}
      onClick={(event) => {
        // Backdrop clicks target the dialog; clicks on its padding stay open.
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
    >
      <div className="lab-credential-heading">
        <div>
          <span className="lab-credential-eyebrow">API credential</span>
          <h2 id="commerce-credential-title">Commerce API Credential</h2>
        </div>
        <button type="button" className="lab-credential-close" aria-label="Close credential dialog" onClick={onClose} autoFocus>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <p id="commerce-credential-description" className="lab-credential-description">
        Use this credential when authenticating requests to the Commerce API Lab.
      </p>

      {state.status === "loading" && (
        <div className="lab-credential-message" role="status">
          <span className="lab-credential-spinner" aria-hidden="true" />
          Loading your credential…
        </div>
      )}
      {state.status === "missing" && (
        <div className="lab-credential-message" role="status">No Commerce API credential has been issued for your account yet.</div>
      )}
      {state.status === "error" && (
        <div className="lab-credential-error">
          <p role="alert">{state.signIn ? "Please sign in again to view your credential." : "Your credential is temporarily unavailable. Please try again."}</p>
          {state.signIn ? <a href="/login">Sign in</a> : (
            <Button variant="secondary" size="sm" onClick={() => { setState({ status: "loading" }); setAttempt((value) => value + 1); }}>Try again</Button>
          )}
        </div>
      )}
      {state.status === "ready" && (
        <div className="lab-credential-content">
          <div>
            <div className="lab-credential-field-heading">
              <label htmlFor="commerce-api-key" className="lab-credential-label">API key</label>
              <button type="button" className="lab-credential-toggle" aria-controls="commerce-api-key commerce-api-header" aria-pressed={visible} onClick={() => setVisible((value) => !value)}>
                {visible ? "Hide" : "Show"}
              </button>
            </div>
            <div className="lab-credential-field">
              <input id="commerce-api-key" type="text" readOnly spellCheck={false} autoComplete="off" value={visible ? state.credential : MASK} />
              <CopyButton value={state.credential} label="Copy API key" />
            </div>
          </div>
          <div>
            <span className="lab-credential-label" id="commerce-api-header-label">Request header</span>
            <div className="lab-credential-field lab-credential-header-field">
              <code id="commerce-api-header" aria-labelledby="commerce-api-header-label">{HEADER_NAME}: {visible ? state.credential : MASK}</code>
              <CopyButton value={`${HEADER_NAME}: ${state.credential}`} label="Copy request header" />
            </div>
          </div>
          <p className="lab-credential-note">In n8n, choose Header Auth and use <code>{HEADER_NAME}</code> as the name. Keep your API key private.</p>
        </div>
      )}
    </dialog>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      if (mounted.current) setStatus("copied");
    } catch {
      if (mounted.current) setStatus("error");
    }
    if (!mounted.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <span className="lab-credential-copy">
      <Button variant="ghost" size="sm" onClick={copy} aria-label={label} className={status === "copied" ? "lab-credential-copied" : ""}>
        {status === "copied" ? "Copied" : "Copy"}
      </Button>
      <span className="sr-only" role="status">{status === "copied" ? `${label}: copied to clipboard.` : ""}</span>
      {status === "error" && <span className="lab-credential-copy-error" role="alert">Copy failed. Show and select to copy.</span>}
    </span>
  );
}
