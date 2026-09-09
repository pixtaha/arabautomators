import "server-only";
import type { CourseSessionRow, SessionResourceRow } from "@/lib/data/courseSessions";
import { resolveVideoSource, type VideoSource } from "@/lib/video-provider";
import { getSessionVideoOverrides } from "@/lib/video-provider-config";

export interface SessionVideoPart {
  id: string;
  title: string;
  source: VideoSource | null;
}

type Session = Pick<CourseSessionRow, "id" | "title" | "main_video_bunny_id"> &
  Partial<Pick<CourseSessionRow, "main_video_provider" | "main_video_vdocipher_id">>;
type Resource = Pick<SessionResourceRow, "id" | "session_id" | "title" | "type" | "order_index" | "bunny_video_id"> &
  Partial<Pick<SessionResourceRow, "video_provider" | "vdocipher_video_id">>;

/** Resolve only parts that still belong to the requested session in the database. */
export function getSessionVideoParts(session: Session, resources: Resource[]): SessionVideoPart[] | null {
  const videoResources = resources.filter((r) => r.session_id === session.id &&
    (r.type === "video" || r.type === "credential_video"));
  const overrides = getSessionVideoOverrides(session.id);
  // Keep the established Bunny-only layout for entirely legacy sessions.
  if (session.main_video_provider == null && videoResources.every((r) => r.video_provider == null) && !overrides) return null;

  const sourceFor = (partId: string, provider: string | null | undefined, bunnyId: string | null, vdocipherId?: string | null) =>
    (provider != null
      ? resolveVideoSource(provider, bunnyId, vdocipherId)
      : overrides?.[partId] ?? resolveVideoSource(null, bunnyId, vdocipherId)) ?? null;

  const parts: SessionVideoPart[] = [];
  if (session.main_video_bunny_id || session.main_video_provider != null) {
    parts.push({ id: "main", title: session.title, source: sourceFor("main", session.main_video_provider, session.main_video_bunny_id, session.main_video_vdocipher_id) });
  }
  // Preserve the existing UI's order: main, video resources, credential videos.
  for (const type of ["video", "credential_video"]) {
    for (const resource of videoResources.filter((r) => r.type === type)
      .sort((a, b) => a.order_index - b.order_index)) {
      parts.push({ id: resource.id, title: resource.title, source: sourceFor(resource.id, resource.video_provider, resource.bunny_video_id, resource.vdocipher_video_id) });
    }
  }
  return parts;
}
