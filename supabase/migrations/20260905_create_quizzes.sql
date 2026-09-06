-- Live Quiz: instructor-uploaded JSON quizzes tied to a session, toggled
-- live/hidden in real time for students. quiz_json is stored as-is (quizId,
-- title, language, description, scoring, ui config, questions[]) and is the
-- single source of truth for scoring and UI behavior -- nothing about a
-- quiz's rules is hardcoded server-side beyond shape validation.

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  quiz_json jsonb not null,
  is_live boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quizzes_session_id_idx on public.quizzes (session_id);

-- Partial unique index rather than a trigger: at most one live quiz per
-- session at a time. The admin route also proactively stops sibling quizzes
-- before starting a new one, but this is the guarantee that survives a
-- concurrent double-click.
create unique index quizzes_one_live_per_session
  on public.quizzes (session_id)
  where is_live;

alter table public.quizzes enable row level security;

-- Realtime needs the full old row to evaluate whether a student who could
-- see a quiz before an UPDATE can still see it after -- without this, the
-- "is_live flips to false" transition can silently fail to notify a
-- subscribed student (the default replica identity only includes the
-- primary key in the old row).
alter table public.quizzes replica identity full;

-- Students only ever see the currently-live quiz for a session, and only
-- while they hold an authorized device session (same bar as every other
-- student-facing read in this schema).
drop policy if exists "Authorized students can read live quizzes" on public.quizzes;
create policy "Authorized students can read live quizzes"
  on public.quizzes for select
  to authenticated
  using (is_live and public.has_active_device_session());

drop policy if exists "Admins can read all quizzes" on public.quizzes;
create policy "Admins can read all quizzes"
  on public.quizzes for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can insert quizzes" on public.quizzes;
create policy "Admins can insert quizzes"
  on public.quizzes for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update quizzes" on public.quizzes;
create policy "Admins can update quizzes"
  on public.quizzes for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete quizzes" on public.quizzes;
create policy "Admins can delete quizzes"
  on public.quizzes for delete
  to authenticated
  using (public.is_admin());

-- Quiz attempts: one completed attempt per student per quiz. student_id
-- references auth.users directly, same as student_task_status -- this
-- schema has no separate students table.

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  score integer not null,
  answers jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now(),
  unique (quiz_id, student_id)
);

create index quiz_attempts_student_id_idx on public.quiz_attempts (student_id);

alter table public.quiz_attempts enable row level security;

drop policy if exists "Authorized students can read their own quiz attempts" on public.quiz_attempts;
create policy "Authorized students can read their own quiz attempts"
  on public.quiz_attempts for select
  to authenticated
  using (student_id = auth.uid() and public.has_active_device_session());

drop policy if exists "Authorized students can insert their own quiz attempts" on public.quiz_attempts;
create policy "Authorized students can insert their own quiz attempts"
  on public.quiz_attempts for insert
  to authenticated
  with check (student_id = auth.uid() and public.has_active_device_session());

drop policy if exists "Admins can read all quiz attempts" on public.quiz_attempts;
create policy "Admins can read all quiz attempts"
  on public.quiz_attempts for select
  to authenticated
  using (public.is_admin());

-- Realtime: the student-side live indicator and quiz page subscribe to
-- postgres_changes on quizzes instead of polling. Guarded for idempotency,
-- since "alter publication ... add table" errors if run twice.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'quizzes'
  ) then
    alter publication supabase_realtime add table public.quizzes;
  end if;
end;
$$;
