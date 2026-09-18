import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireDeviceSession } from "@/lib/auth/device-session";
import { withoutVideoFileUrl } from "@/lib/sessionResources";

export interface CourseModuleRow {
  id: string;
  order_index: number;
  title: string;
  description: string | null;
  available_date: string | null;
}

export interface CourseSessionRow {
  id: string;
  module_id: string | null;
  order_index: number;
  title: string;
  description: string | null;
  live_date: string | null;
  status: string;
  summary_ar: string | null;
  notes: string | null;
  notes_title: string | null;
  covered_topics: string[] | null;
  homework: string | null;
  tags: string[] | null;
  warning_title: string | null;
  warning_body: string | null;
}

export interface SessionResourceRow {
  id: string;
  session_id: string | null;
  module_id: string | null;
  type: string;
  title: string;
  file_url: string | null;
  video_provider: "vdocipher" | null;
  vdocipher_video_id: string | null;
  order_index: number;
  display_order: number | null;
  file_size_bytes: number | null;
  page_count: number | null;
}

export interface SessionVideoPartRow {
  id: string;
  session_id: string;
  order_index: number;
  title: string;
  vdocipher_video_id: string;
}

export interface CourseSessionData {
  session: CourseSessionRow;
  module: CourseModuleRow | null;
  moduleSessions: CourseSessionRow[];
  resources: SessionResourceRow[];
  lectureParts: SessionVideoPartRow[];
  // Sibling sessions (in moduleSessions) whose main video part -- the
  // session_video_parts row with the lowest order_index, same convention as
  // app/api/profile/modules-progress/route.ts -- has watched=true in
  // video_watch_progress for the current student. Drives the watched
  // indicator in SessionPartsSection.
  watchedSessionIds: string[];
}

export async function getCourseSessionData(sessionId: string): Promise<CourseSessionData | null> {
  const deviceSession = await requireDeviceSession();
  const supabase = createAdminClient();

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError || !session) return null;

  const [{ data: module }, { data: moduleSessions }, { data: resources }] = await Promise.all([
    session.module_id
      ? supabase.from("modules").select("*").eq("id", session.module_id).maybeSingle()
      : Promise.resolve({ data: null }),
    session.module_id
      ? supabase.from("sessions").select("*").eq("module_id", session.module_id).order("order_index")
      : Promise.resolve({ data: [] }),
    session.module_id
      ? supabase
          .from("session_resources")
          .select("*")
          .eq("module_id", session.module_id)
          // Same ordering as the admin list (app/api/admin/session-resources/route.ts)
          // so the admin can preview the order students will actually see.
          .order("display_order", { nullsFirst: false })
          .order("order_index")
      : Promise.resolve({ data: [] }),
  ]);

  // Widened to every sibling session in the module (not just sessionId) so a
  // per-session watched indicator can be computed below. getSessionVideoParts
  // (called on the returned `lectureParts`, already filtered back down to
  // sessionId) still only ever sees this session's own parts.
  const sessionIdsInModule = (moduleSessions ?? []).length > 0 ? (moduleSessions ?? []).map((s) => s.id) : [sessionId];
  const { data: allLectureParts } = await supabase
    .from("session_video_parts")
    .select("*")
    .in("session_id", sessionIdsInModule)
    .order("order_index");

  const mainPartBySession = new Map<string, { id: string; orderIndex: number }>();
  for (const part of allLectureParts ?? []) {
    const current = mainPartBySession.get(part.session_id);
    if (!current || part.order_index < current.orderIndex) {
      mainPartBySession.set(part.session_id, { id: part.id, orderIndex: part.order_index });
    }
  }

  const mainPartIds = [...mainPartBySession.values()].map((p) => p.id);
  const { data: watchedRows } =
    mainPartIds.length > 0
      ? await supabase
          .from("video_watch_progress")
          .select("session_video_part_id")
          .eq("student_id", deviceSession.user.id)
          .eq("watched", true)
          .in("session_video_part_id", mainPartIds)
      : { data: [] };

  const watchedPartIds = new Set((watchedRows ?? []).map((r) => r.session_video_part_id as string));
  const watchedSessionIds = [...mainPartBySession.entries()]
    .filter(([, part]) => watchedPartIds.has(part.id))
    .map(([sid]) => sid);

  return {
    session,
    module: module ?? null,
    moduleSessions: moduleSessions ?? [],
    resources: (resources ?? []).map(withoutVideoFileUrl),
    lectureParts: (allLectureParts ?? []).filter((p) => p.session_id === sessionId),
    watchedSessionIds,
  };
}

export function getAdjacentSessions(moduleSessions: CourseSessionRow[], currentId: string) {
  const index = moduleSessions.findIndex((s) => s.id === currentId);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? moduleSessions[index - 1] : null,
    next: index < moduleSessions.length - 1 ? moduleSessions[index + 1] : null,
  };
}
