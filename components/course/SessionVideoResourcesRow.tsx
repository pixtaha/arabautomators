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
              v.bunny_video_id ? (
                <BunnyPlayer videoId={v.bunny_video_id} />
              ) : v.file_url ? (
                <video controls src={v.file_url} className="w-full rounded-lg" />
              ) : null
            }
          />
        </div>
      ))}
    </div>
  );
}
