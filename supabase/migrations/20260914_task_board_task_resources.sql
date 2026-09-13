-- Task Board Change 2: admin-authored illustrative resources per task,
-- scoped per level, replacing the old single-value resource_* columns.
--
-- Confirmed live before writing this migration: all 3 existing tasks have
-- every one of resource_youtube_url/resource_link_url/resource_link_label/
-- resource_pdf_url/resource_image_url set to NULL, and there has never
-- been any admin UI or API to set them -- so dropping them is a clean
-- removal of dead columns, not a data migration (nothing to move first).
--
-- Video resources are URL-only (YouTube/Vimeo link etc.) per the user's
-- decision -- no upload path, no VdoCipher integration, matching the old
-- resource_youtube_url column's original link-only scope.
--
-- New dedicated public bucket (task-board-resources), separate from
-- session-resources per the user's decision, for the same underlying
-- reason session-resources is public: this is admin-authored reference
-- material, not private student data. Policy shape (separate select/
-- insert/update/delete policies) matches the existing session-resources
-- bucket policies in 20260830_role_based_admin_security.sql exactly.

create table public.task_board_task_resources (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.task_board_tasks(id) on delete cascade,
  type text not null check (type in ('image', 'video', 'pdf', 'code')),
  label text,
  scope text not null check (scope in ('general', 'levels')),
  levels text[],
  url text,
  code_content text,
  code_language text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint task_board_task_resources_levels_match_scope check (
    (scope = 'general' and (levels is null or levels = '{}'))
    or (scope = 'levels' and levels is not null and levels <> '{}' and levels <@ array['base', 'medium', 'hard'])
  ),
  constraint task_board_task_resources_content_matches_type check (
    (type = 'code' and code_content is not null and url is null)
    or (type in ('image', 'video', 'pdf') and url is not null and code_content is null)
  )
);

create index task_board_task_resources_task_id_idx on public.task_board_task_resources (task_id);

alter table public.task_board_task_resources enable row level security;

-- Read-only for regular authenticated access, matching task_board_tasks'
-- own "Authorized devices can read..." policy -- all writes go through the
-- admin task-creation API route using createAdminClient() (service role).
create policy "Authorized devices can read task resources"
  on public.task_board_task_resources for select
  to authenticated
  using (public.has_active_device_session());

create policy "Admins can write task resources"
  on public.task_board_task_resources for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Confirmed clean drop: all 3 existing tasks have these columns NULL.
alter table public.task_board_tasks
  drop column resource_youtube_url,
  drop column resource_link_url,
  drop column resource_link_label,
  drop column resource_pdf_url,
  drop column resource_image_url;

insert into storage.buckets (id, name, public)
values ('task-board-resources', 'task-board-resources', true)
on conflict (id) do update set public = true;

drop policy if exists "Task board resources are readable by authenticated users" on storage.objects;
create policy "Task board resources are readable by authenticated users"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'task-board-resources');

drop policy if exists "Admins can upload task board resource files" on storage.objects;
create policy "Admins can upload task board resource files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'task-board-resources' and public.is_admin());

drop policy if exists "Admins can update task board resource files" on storage.objects;
create policy "Admins can update task board resource files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'task-board-resources' and public.is_admin())
  with check (bucket_id = 'task-board-resources' and public.is_admin());

drop policy if exists "Admins can delete task board resource files" on storage.objects;
create policy "Admins can delete task board resource files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'task-board-resources' and public.is_admin());
