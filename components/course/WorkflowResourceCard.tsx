"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function WorkflowResourceCard({ title, fileUrl }: { title: string; fileUrl: string | null }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="flex items-start gap-3 rounded-card-inner border border-border-hairline border-l-4 border-l-surface-brand bg-white p-3.5">
      <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-lg bg-surface-brand-soft text-text-accent">
        <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
          <path
            d="M2 8h3l1.5-3L9 11l1.5-3H14"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-text-strong">{title}</span>
        <span className="mt-2 flex gap-2">
          {fileUrl && (
            <Button
              size="sm"
              onClick={() => window.open(fileUrl, "_blank", "noopener,noreferrer")}
            >
              Download JSON
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              if (!fileUrl) return;
              await navigator.clipboard.writeText(fileUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1600);
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </Button>
        </span>
      </div>
    </div>
  );
}
