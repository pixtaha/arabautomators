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
  type: string;
  title: string;
  file_url: string | null;
  video_provider: "vdocipher" | null;
  vdocipher_video_id: string | null;
  order_index: number;
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
}

export async function getCourseSessionData(sessionId: string): Promise<CourseSessionData | null> {
  await requireDeviceSession();
  const supabase = createAdminClient();

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError || !session) return null;

  const [{ data: module }, { data: moduleSessions }, { data: resources }, { data: lectureParts }] = await Promise.all([
    session.module_id
      ? supabase.from("modules").select("*").eq("id", session.module_id).maybeSingle()
      : Promise.resolve({ data: null }),
    session.module_id
      ? supabase.from("sessions").select("*").eq("module_id", session.module_id).order("order_index")
      : Promise.resolve({ data: [] }),
    supabase.from("session_resources").select("*").eq("session_id", sessionId).order("order_index"),
    supabase.from("session_video_parts").select("*").eq("session_id", sessionId).order("order_index"),
  ]);

  return {
    session,
    module: module ?? null,
    moduleSessions: moduleSessions ?? [],
    resources: (resources ?? []).map(withoutVideoFileUrl),
    lectureParts: lectureParts ?? [],
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
