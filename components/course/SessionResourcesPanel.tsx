import { BunnyPlayer } from "@/components/course/BunnyPlayer";
import { ExpandableVideoCard } from "@/components/course/ExpandableVideoCard";
import { WorkflowResourceCard } from "@/components/course/WorkflowResourceCard";
import type { SessionResourceRow } from "@/lib/data/courseSessions";

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
      <path
        d="M4 2h5l3 3v9H4V2z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M9 2v3h3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="font-mono text-[11px] tracking-widest text-text-faint uppercase">{label}</div>
      {children}
    </div>
  );
}

export function SessionResourcesPanel({ resources }: { resources: SessionResourceRow[] }) {
  const documents = resources.filter((r) => r.type === "pdf");
  const notes = resources.filter((r) => r.type === "text");
  const audio = resources.filter((r) => r.type === "voice_note");
  const workflows = resources.filter((r) => r.type === "workflow_file");
  const videos = resources.filter((r) => r.type === "credential_video");

  if (resources.length === 0) return null;

  return (
    <div className="flex flex-col gap-5 rounded-card border border-border-hairline bg-surface-card p-5 shadow-card">
      <div>
        <div className="mb-2.5 h-[3px] w-10 bg-surface-ink" />
        <h2 className="font-display text-lg font-bold tracking-tight text-text-strong">Session resources</h2>
        <p className="mt-1 text-xs text-text-muted">Download the files before the next session.</p>
      </div>

      {documents.length > 0 && (
        <Section label="Documents">
          <div className="flex flex-col gap-2">
            {documents.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-card-inner bg-surface-sunken p-3">
                <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-lg border border-border-hairline bg-white text-text-strong">
                  <FileIcon />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-text-strong">{d.title}</span>
                {d.file_url && (
                  <a
                    href={d.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Download ${d.title}`}
                    className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-border-hairline bg-white text-text-body transition-colors hover:bg-surface-hover"
                  >
                    <DownloadIcon />
                  </a>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {notes.length > 0 && (
        <Section label="Notes">
          <div className="flex flex-col gap-2">
            {notes.map((n) =>
              n.file_url ? (
                <a
                  key={n.id}
                  href={n.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-card-inner bg-surface-sunken p-3 text-sm text-text-body transition-colors hover:bg-surface-hover"
                >
                  {n.title}
                </a>
              ) : (
                <div key={n.id} className="rounded-card-inner bg-surface-sunken p-3 text-sm text-text-body">
                  {n.title}
                </div>
              ),
            )}
          </div>
        </Section>
      )}

      {audio.length > 0 && (
        <Section label="Voice note">
          <div className="flex flex-col gap-3">
            {audio.map((a) => (
              <div key={a.id} className="rounded-card-inner bg-surface-sunken p-3.5">
                <div className="mb-2 text-sm text-text-body">{a.title}</div>
                {a.file_url && <audio controls src={a.file_url} className="w-full" />}
              </div>
            ))}
          </div>
        </Section>
      )}

      {workflows.length > 0 && (
        <Section label="Workflow file">
          <div className="flex flex-col gap-2">
            {workflows.map((w) => (
              <WorkflowResourceCard key={w.id} title={w.title} fileUrl={w.file_url} />
            ))}
          </div>
        </Section>
      )}

      {videos.length > 0 && (
        <Section label="Credential setup">
          <div className="flex flex-col gap-2">
            {videos.map((v) => (
              <ExpandableVideoCard
                key={v.id}
                title={v.title}
                player={v.bunny_video_id ? <BunnyPlayer videoId={v.bunny_video_id} /> : null}
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
