-- One-time backfill/cleanup, applied directly by Claude Code (see auto-memory
-- applying-supabase-migrations.md).
--
-- 20260913_task_board_revoke_points_on_status_change.sql added a trigger that
-- deletes a task_board_submissions row's points_ledger entry the instant the
-- submission leaves 'approved'. That trigger only fires on future UPDATEs --
-- it does nothing for submissions that had already transitioned out of
-- 'approved' before the trigger existed. This migration performs the
-- equivalent cleanup for that pre-existing state: any points_ledger row for
-- a task_board submission that is not currently 'approved' is deleted,
-- exactly what the trigger would have done had it existed at the time.
-- Approved submissions are untouched -- those points are legitimately earned.
delete from public.points_ledger pl
using public.task_board_submissions tbs
where pl.source_type = 'task_board'
  and pl.source_id = tbs.id
  and pl.student_id = tbs.student_id
  and tbs.status <> 'approved';
