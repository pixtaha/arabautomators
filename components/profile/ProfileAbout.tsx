"use client";

import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { MailIcon, CheckIcon } from "@/components/profile/icons";

const DEFAULT_BIO = "No bio yet — tell the cohort what you're building.";

export function ProfileAbout({ user }: { user: User }) {
  const [bio, setBio] = useState(DEFAULT_BIO);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(bio);

  const verified = Boolean(user.email_confirmed_at);

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-4 w-[3px] bg-black" />
          <span className="font-mono text-[11px] tracking-widest text-text-strong uppercase">About</span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (editing) {
              setBio(draft.trim() || DEFAULT_BIO);
              setEditing(false);
            } else {
              setDraft(bio === DEFAULT_BIO ? "" : bio);
              setEditing(true);
            }
          }}
          className="cursor-pointer font-mono text-[11px] font-semibold tracking-widest text-text-accent uppercase transition-colors hover:text-surface-brand-hover"
        >
          {editing ? "Save" : "Edit"}
        </button>
      </div>

      {editing ? (
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={3}
          placeholder="Tell the cohort what you're building…"
          className="w-full resize-y rounded-control border-2 border-border-brand bg-surface-card p-3 text-sm text-text-body outline-none placeholder:text-text-faint"
        />
      ) : (
        <p className="max-w-[68ch] text-sm leading-relaxed text-text-body text-pretty">{bio}</p>
      )}

      <p className="text-xs text-text-muted">
        Preview only — bio editing saves for real once this feature ships.
      </p>

      <div className="flex flex-wrap items-center gap-2.5 border-t border-border-hairline pt-4">
        <span className="inline-flex items-center gap-2 text-text-muted">
          <MailIcon className="h-4 w-4" />
          <span className="font-mono text-sm text-text-body">{user.email}</span>
        </span>
        {verified && (
          <span className="inline-flex h-5 items-center gap-1.5 rounded-full bg-surface-brand-soft px-2.5 font-body text-xs font-semibold text-aa-green-800">
            <CheckIcon className="h-3 w-3" />
            Verified
          </span>
        )}
      </div>
    </div>
  );
}
