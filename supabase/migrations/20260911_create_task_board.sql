-- Applied manually via docker exec on supabase-db, same as every other
-- migration in this project.
--
-- Task Board: a new, additive task system (levels, bonus points, link/file
-- submissions, admin review with regrade) alongside the existing simple
-- checklist-style tasks/student_task_status. Deliberately separate tables
-- rather than widening the existing ones -- those are read directly by
-- app/dashboard/tasks/page.tsx and components/dashboard/TasksClient.tsx,
-- which this feature must not change, and their award_task_points()
-- trigger assumes a single fixed points value with no levels/bonus.
--
-- Points still flow through the existing points_ledger (new
-- source_type = 'task_board'), so leaderboards pick it up for free. The
-- only touch to an existing shared table is the additive check-constraint
-- widen below; points_ledger's own realtime broadcast trigger (fires on
-- INSERT only) is intentionally left untouched -- see award_task_board_points()
-- below for why a regrade's upsert doesn't need it.

create table public.task_board_tasks (
  id uuid primary key default gen_random_uuid(),
  order_index integer not null default 0,
  title text not null,
  title_ar text,
  description text,
  description_ar text,
  checklist text[] not null default '{}',
  due_at timestamptz,
  -- one column per level offered; null = task does not offer that level
  points_base integer,
  points_medium integer,
  points_hard integer,
  -- what the student submits, and how the review-modal icon/label reads it
  submission_format text not null check (submission_format in ('link','pdf','image','video','file')),
  -- optional admin-attached reference material -- reuses the existing
  -- PUBLIC session-resources bucket + admin API pattern, since these are
  -- admin-authored, not student-private
  resource_youtube_url text,
  resource_link_url text,
  resource_link_label text,
  resource_pdf_url text,
  resource_image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_board_tasks_has_a_level check (
    points_base is not null or points_medium is not null or points_hard is not null
  )
);

alter table public.task_board_tasks enable row level security;

create policy "Authorized devices can read task board tasks"
  on public.task_board_tasks for select
  to authenticated
  using (public.has_active_device_session());

create policy "Admins can write task board tasks"
  on public.task_board_tasks for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create table public.task_board_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.task_board_tasks(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'todo'
    check (status in ('todo','progress','submitted','reviewing','approved')),
  level text check (level in ('base','medium','hard')),
  bonus_points integer not null default 0 check (bonus_points in (0,5,10)),
  submission_link text,
  submission_file_path text,      -- object path inside the private bucket, not a public URL
  submission_file_name text,
  submission_file_size_bytes bigint,
  submission_note text,
  points_awarded integer,         -- mirrors points_ledger for this row; null unless status = 'approved'
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (task_id, student_id)
);

create index task_board_submissions_status_idx on public.task_board_submissions (status);
create index task_board_submissions_student_id_idx on public.task_board_submissions (student_id);

alter table public.task_board_submissions enable row level security;

-- Students can only ever READ their own rows via RLS. All writes (status
-- moves, level pick, link/file submission, admin review) go through an API
-- route using createAdminClient(), same as every other file-touching write
-- path in this app -- matches lib/adminAuth.ts's own reasoning for why
-- routes, not RLS, are the authorization boundary once a file is involved.
create policy "Students can read their own task board submissions"
  on public.task_board_submissions for select
  to authenticated
  using (student_id = auth.uid() and public.has_active_device_session());

create policy "Admins can read all task board submissions"
  on public.task_board_submissions for select
  to authenticated
  using (public.is_admin());

-- Points integration ---------------------------------------------------------

-- Additive: widen points_ledger's existing (unnamed, inline) source_type
-- check to allow 'task_board', same introspection technique
-- 20260906_task_review_workflow.sql used for student_task_status. Existing
-- 'task'/'quiz' rows and their check behavior are unaffected.
do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'public.points_ledger'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%source_type%'
  loop
    execute format('alter table public.points_ledger drop constraint %I', con.conname);
  end loop;
end;
$$;

alter table public.points_ledger
  add constraint points_ledger_source_type_check
  check (source_type in ('task', 'quiz', 'task_board'));

-- Fires on every insert AND update (unlike award_task_points, which only
-- fires on the first transition into 'done') so a regrade after approval
-- recalculates and upserts the same points_ledger row instead of being a
-- one-time-only award. source_id = submission.id (already unique per
-- task+student via the table's own unique constraint), not task_id, so
-- there's no collision with points_ledger's one-award-per-source index.
--
-- BEFORE trigger, not AFTER: it needs to set NEW.points_awarded. Doing that
-- as a plain UPDATE statement from inside an AFTER trigger would itself
-- fire this same AFTER trigger again (Postgres re-fires row triggers on any
-- UPDATE statement, whether or not values actually changed), recursing
-- forever. A BEFORE trigger can just mutate NEW directly -- no extra
-- statement, so nothing to recurse on. The points_ledger insert/upsert
-- below is a different table, so it's unaffected either way.
--
-- Reopening an approved submission (status moved away from 'approved') does
-- NOT delete or zero out the points_ledger row -- matches the existing
-- award_task_points()/student_task_status philosophy of never clawing back
-- points once paid. Only a subsequent re-approval (regrade) changes the
-- payout, via the on-conflict upsert below.
create or replace function public.award_task_board_points()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  task_row public.task_board_tasks%rowtype;
  level_points integer;
  total_points integer;
begin
  if new.status <> 'approved' or new.level is null then
    new.points_awarded := null;
    return new;
  end if;

  select * into task_row from public.task_board_tasks where id = new.task_id;
  level_points := case new.level
    when 'base' then task_row.points_base
    when 'medium' then task_row.points_medium
    when 'hard' then task_row.points_hard
  end;
  total_points := greatest(coalesce(level_points, 0), 0) + greatest(new.bonus_points, 0);

  -- Relies on the pre-existing points_ledger_one_award_per_source unique
  -- INDEX (20260905_points_ledger.sql) for conflict inference -- it's a
  -- bare `create unique index`, never declared as a table constraint, so
  -- it won't show up in a `pg_constraint where contype = 'u'` check. It
  -- already backs award_task_points()'s and award_quiz_points()'s own
  -- identical `on conflict (student_id, source_type, source_id)` clauses.
  insert into public.points_ledger (student_id, source_type, source_id, points, reason)
  values (new.student_id, 'task_board', new.id, total_points, coalesce(task_row.title, 'Task'))
  on conflict (student_id, source_type, source_id)
  do update set points = excluded.points, reason = excluded.reason;

  new.points_awarded := total_points;
  return new;
end;
$$;

drop trigger if exists task_board_submissions_award_points on public.task_board_submissions;
create trigger task_board_submissions_award_points
  before insert or update on public.task_board_submissions
  for each row execute function public.award_task_board_points();

-- Storage --------------------------------------------------------------------

-- Private, unlike avatars/session-resources: these are individual students'
-- submitted work, not shared course content. No blanket authenticated-read
-- policy -- access is via short-lived createSignedUrl() calls from API
-- routes (requireAdmin() for the admin route, owner check for the student
-- route), not a public URL stored on the row.
insert into storage.buckets (id, name, public)
values ('task-board-submissions', 'task-board-submissions', false)
on conflict (id) do update set public = false;

-- Object paths are namespaced <task_id>/<student_id>/<file>, enforced by
-- the upload API route (not by this policy) -- storage.foldername() splits
-- the object name on '/' into its directory components, so index 2 is the
-- student_id segment of that convention.
create policy "Students can manage their own task board submission files"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'task-board-submissions' and (storage.foldername(name))[2] = auth.uid()::text)
  with check (bucket_id = 'task-board-submissions' and (storage.foldername(name))[2] = auth.uid()::text);

create policy "Admins can manage all task board submission files"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'task-board-submissions' and public.is_admin())
  with check (bucket_id = 'task-board-submissions' and public.is_admin());
