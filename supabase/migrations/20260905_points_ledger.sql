-- Points ledger: one row per point-earning event, never a running total.
-- A student's overall points are always sum(points_ledger.points) for
-- them -- this is what makes historical attribution ("what did I earn and
-- when") and the day/week/month leaderboard filters both fall out for free
-- from created_at, instead of needing a second mechanism to track history
-- on top of a stored total.
--
-- source_id is polymorphic (a tasks.id or a quizzes.id depending on
-- source_type) so it can't carry a real foreign key -- only the two
-- security definer trigger functions below ever write into this table, so
-- integrity is enforced there, not by a constraint.

alter table public.tasks add column if not exists points integer not null default 10;

create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  source_type text not null check (source_type in ('task', 'quiz')),
  source_id uuid not null,
  points integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

-- Each earnable thing (one task, one quiz) can only ever pay out once per
-- student. This is what lets both triggers below be simple, idempotent
-- "insert ... on conflict do nothing" statements instead of needing their
-- own separate bookkeeping to avoid double-awarding.
create unique index points_ledger_one_award_per_source
  on public.points_ledger (student_id, source_type, source_id);

create index points_ledger_student_id_idx on public.points_ledger (student_id);
create index points_ledger_created_at_idx on public.points_ledger (created_at desc);

alter table public.points_ledger enable row level security;

-- No insert/update/delete policy for authenticated at all -- students can
-- only ever read their own rows. The only two things that ever write to
-- this table are the security definer trigger functions below, which run
-- with the privileges of their owner and so bypass RLS entirely, the same
-- way is_admin() and has_active_device_session() do.
drop policy if exists "Authorized students can read their own points" on public.points_ledger;
create policy "Authorized students can read their own points"
  on public.points_ledger for select
  to authenticated
  using (student_id = auth.uid() and public.has_active_device_session());

drop policy if exists "Admins can read all points" on public.points_ledger;
create policy "Admins can read all points"
  on public.points_ledger for select
  to authenticated
  using (public.is_admin());

-- Quiz completion -> points ledger. Mirrors quiz_attempts.score, clamped to
-- non-negative *again* here at the database level -- this (not just the
-- quiz JSON's own minQuizScore clamp applied client-side before the
-- attempt is inserted) is the actual guarantee that a badly-authored quiz
-- JSON can never drag a student's overall points down.
create or replace function public.award_quiz_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  quiz_title text;
begin
  select quiz_json ->> 'title' into quiz_title
  from public.quizzes
  where id = new.quiz_id;

  insert into public.points_ledger (student_id, source_type, source_id, points, reason)
  values (new.student_id, 'quiz', new.quiz_id, greatest(new.score, 0), coalesce(quiz_title, 'Quiz'))
  on conflict (student_id, source_type, source_id) do nothing;

  return new;
end;
$$;

drop trigger if exists quiz_attempts_award_points on public.quiz_attempts;
create trigger quiz_attempts_award_points
  after insert on public.quiz_attempts
  for each row execute function public.award_quiz_points();

-- Task completion -> points ledger. student_task_status.status is a
-- mutable toggle (ready/done/problem, or the row can be deleted entirely),
-- unlike a quiz attempt -- so this only awards on the *first* transition
-- into 'done' (fired from either an insert whose initial status is
-- 'done', or an update whose old status wasn't 'done'), and never claws
-- points back if the student later toggles away from 'done'. The unique
-- index is still what actually prevents a double-award, not this check --
-- this check just avoids a wasted insert attempt on every no-op resave.
create or replace function public.award_task_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  task_row public.tasks%rowtype;
begin
  if new.status <> 'done' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = 'done' then
    return new;
  end if;

  select * into task_row from public.tasks where id = new.task_id;

  insert into public.points_ledger (student_id, source_type, source_id, points, reason)
  values (new.student_id, 'task', new.task_id, greatest(task_row.points, 0), coalesce(task_row.title, 'Task'))
  on conflict (student_id, source_type, source_id) do nothing;

  return new;
end;
$$;

drop trigger if exists student_task_status_award_points on public.student_task_status;
create trigger student_task_status_award_points
  after insert or update on public.student_task_status
  for each row execute function public.award_task_points();
