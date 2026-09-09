import { BunnyPlayer } from "@/components/course/BunnyPlayer";
import { ExpandableVideoCard } from "@/components/course/ExpandableVideoCard";
import type { SessionResourceRow } from "@/lib/data/courseSessions";

export function SessionVideoResourcesRow({ resources }: { resources: SessionResourceRow[] }) {
  const videos = resources.filter((r) => r.type === "video");
  const credentialVideos = resources.filter((r) => r.type === "credential_video");
  const items = [...videos, ...credentialVideos.map((v) => ({ ...v, credential: true }))];

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((v) => (
        <div key={v.id} className="w-full sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]">
          <ExpandableVideoCard
            title={v.title}
            subtitle={"credential" in v ? "Credential setup" : null}
            player={
              v.bunny_video_id && v.session_id ? (
                <BunnyPlayer sessionId={v.session_id} videoId={v.bunny_video_id} title={v.title} />
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-lg bg-surface-ink p-4 text-center text-sm text-white">
                  This video is temporarily unavailable.
                </div>
              )
            }
          />
        </div>
      ))}
    </div>
  );
}
