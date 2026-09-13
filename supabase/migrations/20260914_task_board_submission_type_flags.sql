-- Task Board Change 1: replace the single, mutually-exclusive
-- submission_format column with 5 independent per-type flags, matching
-- the requires_code/requires_screenshots pattern already shipped.
--
-- Storage model decision (confirmed with the user): option (A) -- separate
-- single-value column-triplets per file-based type (pdf/image/video),
-- reusing the existing submission_file_path/name/size triplet for the
-- generic "file" type. Not the task_board_submission_files table (that
-- stays screenshot-only).
--
-- Data safety: live-queried immediately before writing this migration --
-- 3 existing tasks (2x 'image', 1x 'link'), 73 existing submissions (20
-- with a link, 43 with a file, 0 with code/screenshots so far). The UPDATE
-- below maps every existing task's single value to the matching new flag
-- before the old column is dropped; existing submission content
-- (submission_link / submission_file_path) is untouched by this migration.

alter table public.task_board_tasks
  add column if not exists requires_link boolean not null default false;
alter table public.task_board_tasks
  add column if not exists requires_pdf boolean not null default false;
alter table public.task_board_tasks
  add column if not exists requires_image boolean not null default false;
alter table public.task_board_tasks
  add column if not exists requires_video boolean not null default false;
alter table public.task_board_tasks
  add column if not exists requires_file boolean not null default false;
alter table public.task_board_tasks
  add column if not exists submission_link_label text;

update public.task_board_tasks set requires_link = true where submission_format = 'link';
update public.task_board_tasks set requires_pdf = true where submission_format = 'pdf';
update public.task_board_tasks set requires_image = true where submission_format = 'image';
update public.task_board_tasks set requires_video = true where submission_format = 'video';
update public.task_board_tasks set requires_file = true where submission_format = 'file';

-- Verify before proceeding, e.g.:
--   select id, title, submission_format, requires_link, requires_pdf,
--          requires_image, requires_video, requires_file
--   from public.task_board_tasks order by order_index;

alter table public.task_board_tasks drop constraint task_board_tasks_submission_format_check;
alter table public.task_board_tasks drop column submission_format;

alter table public.task_board_tasks
  add constraint task_board_tasks_has_a_submission_type
  check (requires_link or requires_pdf or requires_image or requires_video or requires_file);

-- New single-value column-triplets for pdf/image/video, mirroring the
-- existing submission_file_path/name/size triplet (reused as-is for the
-- generic "file" type).
alter table public.task_board_submissions
  add column if not exists submission_pdf_path text;
alter table public.task_board_submissions
  add column if not exists submission_pdf_name text;
alter table public.task_board_submissions
  add column if not exists submission_pdf_size_bytes bigint;
alter table public.task_board_submissions
  add column if not exists submission_image_path text;
alter table public.task_board_submissions
  add column if not exists submission_image_name text;
alter table public.task_board_submissions
  add column if not exists submission_image_size_bytes bigint;
alter table public.task_board_submissions
  add column if not exists submission_video_path text;
alter table public.task_board_submissions
  add column if not exists submission_video_name text;
alter table public.task_board_submissions
  add column if not exists submission_video_size_bytes bigint;
