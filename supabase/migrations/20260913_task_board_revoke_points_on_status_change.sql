-- Applied directly by Claude Code via docker exec on supabase-db, per the
-- user's updated migration workflow (see auto-memory
-- applying-supabase-migrations.md).
--
-- Bug: reopening an approved task_board submission (approved -> reviewing,
-- app/api/admin/task-board/submissions/[id]/route.ts's "reopen" action) or
-- sending one back (submitted/reviewing -> progress, "send_back") left the
-- points_ledger row from the earlier approval untouched. award_task_board_points()
-- (20260911_create_task_board.sql) only ever inserts/upserts on a transition
-- INTO 'approved' -- it deliberately does nothing on the way out, matching
-- the "never claw back" philosophy that's correct for the older, simpler
-- award_task_points() trigger (a checklist task, once done, stays done). But
-- Task Board submissions are explicitly designed to be reopened and
-- re-reviewed, so a student could keep the points from a since-reopened
-- submission indefinitely. This migration adds the missing claw-back: the
-- instant a submission leaves 'approved' for ANY reason, its points_ledger
-- row is deleted. Points only return via a subsequent re-approval, which
-- already re-inserts/upserts through the existing trigger unchanged.
--
-- A separate BEFORE UPDATE trigger rather than folding this into
-- award_task_board_points() itself: that function already has a clear,
-- narrowly-scoped job (compute and upsert the payout for a NEW approval) and
-- its own detailed comment explaining the "never claw back" design that this
-- migration is intentionally overriding for Task Board specifically. Keeping
-- the claw-back as its own function makes that override explicit and
-- separately auditable instead of silently rewriting the older function's
-- documented behavior in place.
create or replace function public.revoke_task_board_points_on_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'approved' and new.status <> 'approved' then
    delete from public.points_ledger
    where student_id = old.student_id
      and source_type = 'task_board'
      and source_id = old.id;
  end if;

  return new;
end;
$$;

drop trigger if exists task_board_submissions_revoke_points on public.task_board_submissions;
create trigger task_board_submissions_revoke_points
  before update on public.task_board_submissions
  for each row execute function public.revoke_task_board_points_on_status_change();

-- Bug: the leaderboard realtime-broadcast trigger (20260906_leaderboard_broadcast.sql)
-- only fired AFTER INSERT on points_ledger, so a live client's leaderboard
-- never refreshed on a re-award (UPDATE, e.g. a Task Board regrade upsert)
-- or -- as of the revoke trigger just added above -- a DELETE. Widened to
-- fire on all three. INSERT/UPDATE both carry NEW; DELETE only carries OLD,
-- so the row to inspect is resolved into a local `record` first instead of
-- referencing NEW directly (which would be null on DELETE).
create or replace function public.broadcast_leaderboard_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  changed_row record;
begin
  if tg_op = 'DELETE' then
    changed_row := old;
  else
    changed_row := new;
  end if;

  perform realtime.send('{}'::jsonb, 'changed', 'leaderboard:points', true);

  if changed_row.source_type = 'task' then
    perform realtime.send('{}'::jsonb, 'changed', 'leaderboard:tasks', true);
  elsif changed_row.source_type = 'quiz' then
    perform realtime.send('{}'::jsonb, 'changed', 'leaderboard:quiz:' || changed_row.source_id::text, true);
  end if;

  if tg_op = 'DELETE' then
    return old;
  else
    return new;
  end if;
end;
$$;

drop trigger if exists points_ledger_broadcast_leaderboard on public.points_ledger;
create trigger points_ledger_broadcast_leaderboard
  after insert or update or delete on public.points_ledger
  for each row execute function public.broadcast_leaderboard_change();
