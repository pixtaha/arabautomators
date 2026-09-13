-- Task Board: flexible submissions (optional pasted code + multi-screenshot
-- galleries, independently required per task) and start/end date
-- scheduling. Reviewed and approved by the user before being applied
-- manually via `docker compose exec db psql -U supabase_admin` -- not run
-- by Claude Code.
--
-- All additive / backward compatible:
--   - requires_code / requires_screenshots default false, so all 7 existing
--     tasks keep exactly their current link/file-only submission flow.
--   - submission_code is nullable; none of the 28 existing submissions are
--     touched.
--   - task_board_submission_files starts empty.
--   - due_at is renamed to end_at (values carry over unchanged); start_at
--     is a new nullable column, so every existing task keeps behaving
--     exactly as it does today (always available) -- null start_at means
--     "no start restriction," matching how null end_at already means "no
--     deadline."

alter table public.task_board_tasks
  add column if not exists requires_code boolean not null default false;
alter table public.task_board_tasks
  add column if not exists requires_screenshots boolean not null default false;

alter table public.task_board_submissions
  add column if not exists submission_code text;

create table public.task_board_submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.task_board_submissions(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  file_size_bytes bigint,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index task_board_submission_files_submission_id_idx
  on public.task_board_submission_files (submission_id);

alter table public.task_board_submission_files enable row level security;

-- Read-only policies, matching task_board_submissions itself: every write
-- (upload, delete-then-replace on resubmit) goes through an API route
-- using createAdminClient() (service role, bypasses RLS), so there are no
-- insert/update/delete policies here -- RLS is defense-in-depth for direct
-- reads only.
create policy "Students can read their own submission files"
  on public.task_board_submission_files for select
  to authenticated
  using (
    exists (
      select 1 from public.task_board_submissions s
      where s.id = submission_id and s.student_id = auth.uid()
    )
    and public.has_active_device_session()
  );

create policy "Admins can read all submission files"
  on public.task_board_submission_files for select
  to authenticated
  using (public.is_admin());

-- Scheduling: start_at (new) / end_at (renamed from due_at).
alter table public.task_board_tasks
  add column if not exists start_at timestamptz;

alter table public.task_board_tasks
  rename column due_at to end_at;

alter table public.task_board_tasks
  add constraint task_board_tasks_start_before_end
  check (start_at is null or end_at is null or start_at <= end_at);
