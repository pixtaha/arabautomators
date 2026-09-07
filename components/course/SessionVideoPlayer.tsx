import { BunnyPlayer } from "@/components/course/BunnyPlayer";
import type { CourseSessionRow } from "@/lib/data/courseSessions";

export function SessionVideoPlayer({ session }: { session: CourseSessionRow }) {
  return (
    <div className="rounded-card border border-border-hairline bg-surface-card p-6 shadow-card">
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
    </div>
  );
}
