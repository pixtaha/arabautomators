"use client";

import { useSessionVideo } from "@/components/course/SessionVideoContext";
import { VoiceNoteCard } from "@/components/course/VoiceNoteCard";
import { WorkflowResourceCard } from "@/components/course/WorkflowResourceCard";
import type { SessionResourceRow } from "@/lib/data/courseSessions";
import { formatFileSize, isVideoResource } from "@/lib/sessionResources";

function DownloadIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <path
        d="M8 2v8m0 0l-3-3m3 3l3-3M3 13h10"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4" aria-hidden="true">
      <path d="M4 2h5l3 3v9H4V2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M9 2v3h3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className="ml-0.5 h-3.5 w-3.5" aria-hidden="true">
      <path d="M4 2.5v11l9-5.5-9-5.5z" />
    </svg>
  );
}

function DocumentItem({ resource }: { resource: SessionResourceRow }) {
  const meta = [
    "PDF",
    resource.file_size_bytes ? formatFileSize(resource.file_size_bytes) : null,
    resource.page_count ? `${resource.page_count} pages` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex items-center gap-3 rounded-card-inner bg-surface-sunken p-3">
      <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-lg border border-border-hairline bg-white text-text-strong">
        <FileIcon />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-text-strong">{resource.title}</span>
        <span className="mt-0.5 block font-mono text-[11px] text-text-muted">{meta}</span>
      </span>
      {resource.file_url && (
        <a
          href={resource.file_url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Download ${resource.title}`}
          className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-border-hairline bg-white text-text-body transition-colors hover:bg-surface-hover"
        >
          <DownloadIcon />
        </a>
      )}
    </div>
  );
}

function NoteItem({ resource, index }: { resource: SessionResourceRow; index: number }) {
  const badge = (
    <span
      className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-lg border border-border-hairline bg-white text-xs font-bold text-text-strong"
      aria-hidden="true"
    >
      {index}
    </span>
  );

  if (resource.file_url) {
    return (
      <a
        href={resource.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-card-inner bg-surface-sunken p-3 text-sm text-text-body transition-colors hover:bg-surface-hover"
      >
        {badge}
        <span className="min-w-0 flex-1 truncate">{resource.title}</span>
      </a>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-card-inner bg-surface-sunken p-3 text-sm text-text-body">
      {badge}
      <span className="min-w-0 flex-1 truncate">{resource.title}</span>
    </div>
  );
}

function VideoItem({ resource }: { resource: SessionResourceRow }) {
  const { selectedPart, selectPart } = useSessionVideo();
  const isPlaying = selectedPart?.id === resource.id;

  return (
    <button
      type="button"
      onClick={() => selectPart(resource.id)}
      aria-pressed={isPlaying}
      className={`flex w-full cursor-pointer items-center gap-3 rounded-card-inner border p-3 text-left transition-colors ${
        isPlaying
          ? "border-surface-brand bg-surface-brand-soft"
          : "border-transparent bg-surface-sunken hover:bg-surface-hover"
      }`}
    >
      <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-lg border border-border-hairline bg-white text-text-accent">
        <PlayIcon />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-text-strong">{resource.title}</span>
        <span className="mt-0.5 block font-mono text-[11px] tracking-widest text-text-muted uppercase">
          {isPlaying ? "Now playing" : "Video"}
        </span>
      </span>
    </button>
  );
}

export function SessionResourcesPanel({ resources }: { resources: SessionResourceRow[] }) {
  if (resources.length === 0) return null;

  const noteIndexById = new Map<string, number>();
  for (const resource of resources) {
    if (resource.type === "text") noteIndexById.set(resource.id, noteIndexById.size + 1);
  }

  return (
    <div className="flex flex-col gap-5 rounded-card border border-border-hairline bg-surface-card p-5 shadow-card">
      <div>
        <div className="mb-2.5 h-[3px] w-10 bg-surface-ink" />
        <h2 className="font-display text-lg font-bold tracking-tight text-text-strong">Session resources</h2>
        <p className="mt-1 text-xs text-text-muted">
          {resources.length} file{resources.length === 1 ? "" : "s"}. Download the workflow before the next session.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {resources.map((resource) => {
          if (resource.type === "pdf") return <DocumentItem key={resource.id} resource={resource} />;
          if (resource.type === "text") {
            return <NoteItem key={resource.id} resource={resource} index={noteIndexById.get(resource.id) ?? 1} />;
          }
          if (resource.type === "voice_note") {
            return resource.file_url ? (
              <VoiceNoteCard key={resource.id} title={resource.title} fileUrl={resource.file_url} />
            ) : null;
          }
          if (resource.type === "workflow_file") {
            return <WorkflowResourceCard key={resource.id} title={resource.title} fileUrl={resource.file_url} />;
          }
          if (isVideoResource(resource.type)) return <VideoItem key={resource.id} resource={resource} />;
          return null;
        })}
      </div>
    </div>
  );
}
