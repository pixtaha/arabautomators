import { getActiveDeviceSession } from "@/lib/auth/device-session";
import { createAdminClient } from "@/lib/supabase/admin";

// A module counts as "completed" once at least half of its sessions are
// "watched". ceil, not floor, so an odd session count rounds the threshold
// up -- 3 sessions needs 2 watched, not 1.
const COMPLETION_RATIO = 0.5;

interface SessionRow {
  id: string;
  module_id: string | null;
}

interface VideoPartRow {
  id: string;
  session_id: string;
  order_index: number;
}

// getActiveDeviceSession (not requireDeviceSession) deliberately -- the
// latter calls redirect(), which is wrong for a JSON API route (see the same
// note on app/api/quizzes/[id]/leaderboard/route.ts).
//
// This has to run server-side with the service-role client: session_video_parts
// has RLS enabled with zero policies (confirmed via pg_policies), so it is
// completely unreadable by the anon/authenticated PostgREST role no matter
// what -- ProfileStats.tsx's usual pattern of querying tables directly from
// the browser client is not an option for this piece.
export async function GET() {
  const session = await getActiveDeviceSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();

  const [{ data: modules, error: modulesError }, { data: sessions, error: sessionsError }, { data: lectureParts, error: partsError }, { data: watchedRows, error: watchedError }] =
    await Promise.all([
      supabase.from("modules").select("id"),
      supabase.from("sessions").select("id, module_id"),
      supabase.from("session_video_parts").select("id, session_id, order_index"),
      supabase
        .from("video_watch_progress")
        .select("session_video_part_id")
        .eq("student_id", session.user.id)
        .eq("watched", true),
    ]);

  if (modulesError || sessionsError || partsError || watchedError) {
    return Response.json({ error: "Could not load module progress." }, { status: 500 });
  }

  // A session's "main video" is its session_video_parts row with the lowest
  // order_index -- session_video_parts are a lecture's own recorded
  // segments (Part 1, Part 2, ...), scoped one-to-one to a session.
  // session_resources rows (credential_video / secondary resource videos)
  // are module-scoped and shared, and are deliberately excluded here (see
  // lib/session-video-parts.ts) -- watching one never counts toward that
  // session being "watched".
  const mainPartBySession = new Map<string, { id: string; orderIndex: number }>();
  for (const part of (lectureParts ?? []) as VideoPartRow[]) {
    const current = mainPartBySession.get(part.session_id);
    if (!current || part.order_index < current.orderIndex) {
      mainPartBySession.set(part.session_id, { id: part.id, orderIndex: part.order_index });
    }
  }

  const watchedPartIds = new Set((watchedRows ?? []).map((row) => row.session_video_part_id as string));

  const totalSessionsByModule = new Map<string, number>();
  const watchedSessionsByModule = new Map<string, number>();

  for (const s of (sessions ?? []) as SessionRow[]) {
    if (!s.module_id) continue;
    totalSessionsByModule.set(s.module_id, (totalSessionsByModule.get(s.module_id) ?? 0) + 1);

    const mainPart = mainPartBySession.get(s.id);
    if (mainPart && watchedPartIds.has(mainPart.id)) {
      watchedSessionsByModule.set(s.module_id, (watchedSessionsByModule.get(s.module_id) ?? 0) + 1);
    }
  }

  let modulesCompleted = 0;
  for (const courseModule of modules ?? []) {
    const total = totalSessionsByModule.get(courseModule.id) ?? 0;
    if (total === 0) continue; // avoid vacuous completion on a module with no sessions yet
    const watched = watchedSessionsByModule.get(courseModule.id) ?? 0;
    if (watched >= Math.ceil(total * COMPLETION_RATIO)) modulesCompleted += 1;
  }

  return Response.json({ modulesCompleted });
}
