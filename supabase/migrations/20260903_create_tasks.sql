-- Tasks: module-scoped curriculum checklist items, independent of sessions
-- and session_resources. Admin-authored, same read/write shape as
-- modules/sessions (public authenticated read, admin-gated writes).
--
-- A task with unlock_date null is always unlocked once its module renders;
-- one with a future unlock_date is locked until that date.

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  order_index integer not null,
  title text not null,
  title_ar text,
  unlock_date date,
  created_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

drop policy if exists "Authenticated users can read tasks" on public.tasks;
create policy "Authenticated users can read tasks"
  on public.tasks for select
  using (auth.role() = 'authenticated');

drop policy if exists "Admins can insert tasks" on public.tasks;
create policy "Admins can insert tasks"
  on public.tasks for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update tasks" on public.tasks;
create policy "Admins can update tasks"
  on public.tasks for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete tasks" on public.tasks;
create policy "Admins can delete tasks"
  on public.tasks for delete
  to authenticated
  using (public.is_admin());

-- Student task status: per-student, per-task. A student can only ever
-- read or write their own rows -- there is no admin-visibility policy
-- here by design, this table is student-private.

create table if not exists public.student_task_status (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('ready', 'done', 'problem')),
  updated_at timestamptz not null default now(),
  unique (task_id, student_id)
);

alter table public.student_task_status enable row level security;

drop policy if exists "Students can read their own task status" on public.student_task_status;
create policy "Students can read their own task status"
  on public.student_task_status for select
  to authenticated
  using (student_id = auth.uid());

drop policy if exists "Students can insert their own task status" on public.student_task_status;
create policy "Students can insert their own task status"
  on public.student_task_status for insert
  to authenticated
  with check (student_id = auth.uid());

drop policy if exists "Students can update their own task status" on public.student_task_status;
create policy "Students can update their own task status"
  on public.student_task_status for update
  to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

drop policy if exists "Students can delete their own task status" on public.student_task_status;
create policy "Students can delete their own task status"
  on public.student_task_status for delete
  to authenticated
  using (student_id = auth.uid());
