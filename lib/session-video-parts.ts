import "server-only";
import type { CourseSessionRow, SessionResourceRow } from "@/lib/data/courseSessions";
import { resolveVideoSource, type VideoSource } from "@/lib/video-provider";
import { getSessionVideoOverrides } from "@/lib/video-provider-config";

export interface SessionVideoPart {
  id: string;
  title: string;
  source: VideoSource | null;
}

type Session = Pick<CourseSessionRow, "id" | "title"> &
  Partial<Pick<CourseSessionRow, "main_video_provider" | "main_video_vdocipher_id">>;
type Resource = Pick<SessionResourceRow, "id" | "session_id" | "title" | "type" | "order_index"> &
  Partial<Pick<SessionResourceRow, "video_provider" | "vdocipher_video_id">>;

export function getSessionVideoParts(session: Session, resources: Resource[]): SessionVideoPart[] {
  const videoResources = resources.filter((r) => r.session_id === session.id &&
    (r.type === "video" || r.type === "credential_video"));
  const overrides = getSessionVideoOverrides(session.id);

  const sourceFor = (partId: string, provider: string | null | undefined, vdocipherId?: string | null) =>
    (provider != null
      ? resolveVideoSource(provider, null, vdocipherId)
      : overrides?.[partId] ?? null) ?? null;

  const parts: SessionVideoPart[] = [];
  if (session.main_video_provider != null) {
    parts.push({ id: "main", title: session.title, source: sourceFor("main", session.main_video_provider, session.main_video_vdocipher_id) });
  }
  for (const type of ["video", "credential_video"]) {
    for (const resource of videoResources.filter((r) => r.type === type)
      .sort((a, b) => a.order_index - b.order_index)) {
      parts.push({ id: resource.id, title: resource.title, source: sourceFor(resource.id, resource.video_provider, resource.vdocipher_video_id) });
    }
  }
  return parts;
}
