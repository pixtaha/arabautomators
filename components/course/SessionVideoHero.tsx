import { BunnyPlayer } from "@/components/course/BunnyPlayer";
import { SessionActions } from "@/components/course/SessionActions";
import { getBunnyVideo } from "@/lib/bunny";
import type { CourseModuleRow, CourseSessionRow } from "@/lib/data/courseSessions";

function formatLiveDate(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Cairo",
  });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Cairo",
  });
  return `${date} · ${time} Cairo`;
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 5v3.2l2.1 1.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export async function SessionVideoHero({
  session,
  module,
}: {
  session: CourseSessionRow;
  module: CourseModuleRow | null;
}) {
  const bunnyVideo = session.main_video_bunny_id
    ? await getBunnyVideo(session.main_video_bunny_id).catch(() => null)
    : null;

  return (
    <div className="flex flex-col gap-6 rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
      {session.main_video_bunny_id ? (
        <BunnyPlayer videoId={session.main_video_bunny_id} />
      ) : (
        <div className="relative flex aspect-video w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-card border border-border-hairline bg-surface-ink bg-dots-ink text-center">
          <span className="font-mono text-[11px] tracking-widest text-aa-neutral-500 uppercase">
            Recording not posted yet
          </span>
          <span className="text-sm text-aa-neutral-600">Check back after the live session.</span>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <span className="font-mono text-[11px] tracking-widest text-text-muted uppercase">
          {module ? `Module ${module.order_index}: ${module.title}` : "Session"} › Session {session.order_index}
        </span>

        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="font-display text-[32px] leading-[1.05] font-extrabold tracking-[-0.03em] text-text-strong text-balance sm:text-4xl">
              {session.title}
            </h1>
            <div className="mt-3.5 flex flex-wrap items-center gap-4">
              {session.live_date && (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-text-muted">
                  <CalendarIcon />
                  Live {formatLiveDate(session.live_date)}
                </span>
              )}
              {bunnyVideo && bunnyVideo.length > 0 && (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-text-muted">
                  <ClockIcon />
                  {formatDuration(bunnyVideo.length)}
                </span>
              )}
            </div>
          </div>
          <SessionActions />
        </div>

        {session.tags && session.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {session.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex h-6 items-center rounded-lg border border-border-hairline bg-surface-card px-2.5 font-mono text-xs text-text-body"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
