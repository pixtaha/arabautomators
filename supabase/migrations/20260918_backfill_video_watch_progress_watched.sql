-- Backfill for the "watched" threshold simplification: POST
-- /api/course/video-progress now marks a video_watch_progress row watched=true
-- on any valid progress report (opening/starting playback is enough) instead
-- of requiring furthest_position_seconds to reach 90% of duration_seconds.
--
-- The route only ever recomputes `watched` when it receives a new report for
-- that (student, session_video_part_id) pair -- it never revisits existing
-- rows on its own. Every row in this table exists only because that route
-- was POSTed to at least once, which under the new rule is itself sufficient
-- to mark it watched. So this is a one-time, unconditional flip of every
-- currently-false row, not a recomputation against stored position/duration.
update public.video_watch_progress
set watched = true
where watched = false;
