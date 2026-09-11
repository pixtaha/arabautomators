-- Applied manually via docker exec on supabase-db, same as every other
-- migration in this project.
--
-- Stage 3 admin review additions for the Task Board.

-- Required note when an admin sends a submission back for changes
-- (status -> 'progress'). Nullable -- most rows never get sent back, and
-- this is also how the student board distinguishes "sent back" from
-- "never touched": status = 'progress' AND admin_note is not null.
alter table public.task_board_submissions
  add column if not exists admin_note text;

-- Widen the bonus tiers to include 20 (Stage 3 admin review UI adds a
-- fourth bonus option: 0/5/10/20).
alter table public.task_board_submissions
  drop constraint if exists task_board_submissions_bonus_points_check;
alter table public.task_board_submissions
  add constraint task_board_submissions_bonus_points_check
  check (bonus_points = any (array[0, 5, 10, 20]));

-- Simplified: the API route (not this trigger) now computes the final
-- points_awarded (level preset + bonus, or an admin's override) and writes
-- it directly as part of the approve UPDATE. This trigger just pushes
-- whatever points_awarded already says into points_ledger on approval --
-- it no longer recomputes from level/bonus itself, and no longer nulls
-- points_awarded on non-approved transitions, so "Reopen" (approved ->
-- reviewing) leaves the historical points_awarded value untouched, exactly
-- like points_ledger already is (reopen never touches points_ledger --
-- see award_task_board_points's ON CONFLICT: it only ever runs when a row
-- transitions back into 'approved', i.e. a subsequent re-approval).
create or replace function public.award_task_board_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status <> 'approved' then
    return new;
  end if;

  -- Relies on the pre-existing points_ledger_one_award_per_source unique
  -- INDEX (20260905_points_ledger.sql), not a table constraint -- see the
  -- matching note in 20260911_create_task_board.sql.
  insert into public.points_ledger (student_id, source_type, source_id, points, reason)
  values (
    new.student_id,
    'task_board',
    new.id,
    greatest(coalesce(new.points_awarded, 0), 0),
    coalesce((select title from public.task_board_tasks where id = new.task_id), 'Task')
  )
  on conflict (student_id, source_type, source_id)
  do update set points = excluded.points, reason = excluded.reason;

  return new;
end;
$$;
