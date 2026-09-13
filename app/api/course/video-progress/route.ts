import { getActiveDeviceSession } from "@/lib/auth/device-session";
import { createAdminClient } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Single clearly-named place for the "counts as watched" threshold. The
// video_watch_progress.watched flag is only ever set here, at write time --
// never recomputed from position on read -- so retuning this later is a
// one-line change, not a hunt through the app.
const WATCHED_THRESHOLD_RATIO = 0.9;

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

// getActiveDeviceSession (not requireDeviceSession) deliberately -- the
// latter calls redirect(), which is wrong for a JSON API route (see the
// same note on app/api/quizzes/[id]/leaderboard/route.ts).
export async function POST(request: Request) {
  const session = await getActiveDeviceSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { sessionVideoPartId, positionSeconds, durationSeconds } = body as Record<string, unknown>;
  if (typeof sessionVideoPartId !== "string" || !UUID_RE.test(sessionVideoPartId)) {
    return Response.json({ error: "Invalid sessionVideoPartId." }, { status: 400 });
  }
  if (!isFiniteNonNegative(positionSeconds)) {
    return Response.json({ error: "Invalid positionSeconds." }, { status: 400 });
  }
  if (durationSeconds !== undefined && durationSeconds !== null && !isFiniteNonNegative(durationSeconds)) {
    return Response.json({ error: "Invalid durationSeconds." }, { status: 400 });
  }

  const position = Math.floor(positionSeconds);
  const reportedDuration = isFiniteNonNegative(durationSeconds) ? Math.floor(durationSeconds) : null;

  const supabase = createAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("video_watch_progress")
    .select("furthest_position_seconds, duration_seconds, watched")
    .eq("student_id", session.user.id)
    .eq("session_video_part_id", sessionVideoPartId)
    .maybeSingle();

  if (fetchError) return Response.json({ error: "Could not load watch progress." }, { status: 500 });

  // Never let a rewind lower the recorded furthest position.
  const furthestPosition = Math.max(existing?.furthest_position_seconds ?? 0, position);
  // Duration is filled in once and never overwritten -- it shouldn't change
  // for the same video, and a later call with no/different value shouldn't
  // erase an already-known one.
  const duration = existing?.duration_seconds ?? reportedDuration;
  // Once watched, stays watched -- this never claws back on a later report
  // with a lower ratio (there isn't one, since position only grows, but this
  // also protects against duration being learned late and briefly changing
  // the ratio's denominator).
  const watched =
    existing?.watched === true || (duration != null && duration > 0 && furthestPosition >= WATCHED_THRESHOLD_RATIO * duration);

  const { error: upsertError } = await supabase.from("video_watch_progress").upsert(
    {
      student_id: session.user.id,
      session_video_part_id: sessionVideoPartId,
      furthest_position_seconds: furthestPosition,
      duration_seconds: duration,
      watched,
      last_watched_at: new Date().toISOString(),
    },
    { onConflict: "student_id,session_video_part_id" },
  );

  if (upsertError) return Response.json({ error: "Could not save watch progress." }, { status: 500 });

  return Response.json({ furthestPositionSeconds: furthestPosition, durationSeconds: duration, watched });
}
