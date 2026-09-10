import "server-only";
import type { SessionResourceRow, SessionVideoPartRow } from "@/lib/data/courseSessions";
import { resolveVideoSource, type VideoSource } from "@/lib/video-provider";
import { getSessionVideoOverrides } from "@/lib/video-provider-config";

export interface SessionVideoPart {
  id: string;
  title: string;
  source: VideoSource | null;
}

type LecturePart = Pick<SessionVideoPartRow, "id" | "session_id" | "order_index" | "title" | "vdocipher_video_id">;
type Resource = Pick<SessionResourceRow, "id" | "session_id" | "title" | "type" | "order_index"> &
  Partial<Pick<SessionResourceRow, "video_provider" | "vdocipher_video_id">>;

/**
 * Ordered playback list for a session: the lecture's video parts (from
 * session_video_parts, in order_index order) followed by its video-type
 * resources (general videos, then credential videos).
 */
export function getSessionVideoParts(sessionId: string, lectureParts: LecturePart[], resources: Resource[]): SessionVideoPart[] {
  const videoResources = resources.filter((r) => r.session_id === sessionId &&
    (r.type === "video" || r.type === "credential_video"));
  const overrides = getSessionVideoOverrides(sessionId);

  const parts: SessionVideoPart[] = lectureParts
    .filter((p) => p.session_id === sessionId)
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map((p) => ({ id: p.id, title: p.title, source: resolveVideoSource("vdocipher", null, p.vdocipher_video_id) }));

  for (const type of ["video", "credential_video"]) {
    for (const resource of videoResources.filter((r) => r.type === type)
      .sort((a, b) => a.order_index - b.order_index)) {
      const source = resource.video_provider != null
        ? resolveVideoSource(resource.video_provider, null, resource.vdocipher_video_id)
        : overrides?.[resource.id] ?? null;
      parts.push({ id: resource.id, title: resource.title, source });
    }
  }
  return parts;
}
