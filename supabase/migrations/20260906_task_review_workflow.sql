-- Applied manually via docker exec on supabase-db, same as every other
-- migration in this project.
--
-- Adds the "needs admin review" task workflow: a task can require an admin
-- to sign off on a student's submission before points are awarded, instead
-- of awarding immediately on marking done.
--
-- No trigger changes needed. award_task_points() (20260905_points_ledger.sql)
-- already only fires on a transition *into* 'done' -- setting status to the
-- new 'pending_review' value never matches that condition, so it never
-- awards. When an admin later updates the row to 'done', that update IS such
-- a transition (old.status = 'pending_review' <> 'done'), so the existing
-- trigger fires and pays out through points_ledger exactly as it does for
-- any other task completion.

alter table public.tasks add column if not exists requires_review boolean not null default false;

-- Widen the status check constraint to allow 'pending_review'. Looked up by
-- introspection rather than a hardcoded constraint name, since the original
-- constraint in 20260903_create_tasks.sql was declared inline (unnamed) and
-- Postgres' auto-generated name, while predictable, isn't worth depending on.
do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'public.student_task_status'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.student_task_status drop constraint %I', con.conname);
  end loop;
end;
$$;

alter table public.student_task_status
  add constraint student_task_status_status_check
  check (status in ('ready', 'done', 'problem', 'pending_review'));
