-- Task Board: per-task custom labels/placeholders for file and code
-- submissions, plus admin-choosable "completed" card colors for the
-- Base/Medium levels. All additive/nullable -- every existing task keeps
-- its current generic placeholder copy and plain card background until an
-- admin explicitly sets one of these.
--
-- Item 2 (file-upload labels): one column per file-type flag, not a single
-- shared column -- mirrors this table's existing independent-flags
-- philosophy (requires_link/pdf/image/video/file was itself a prior
-- migration replacing one shared submission_format column for exactly this
-- reason). A task can require more than one file type at once, and a
-- shared label couldn't distinguish "screen recording" from "exported
-- workflow JSON" if both were showing at the same time. Same fallback
-- pattern as the existing submission_link_label: null means "use today's
-- generic 'Choose a <kind> to upload' copy".
alter table public.task_board_tasks
  add column if not exists submission_pdf_label text;
alter table public.task_board_tasks
  add column if not exists submission_image_label text;
alter table public.task_board_tasks
  add column if not exists submission_video_label text;
alter table public.task_board_tasks
  add column if not exists submission_file_label text;

-- Item 3 (code placeholder): same fallback pattern, for the code
-- textarea's placeholder text.
alter table public.task_board_tasks
  add column if not exists submission_code_placeholder text;

-- Item 6 (completed-card colors): background color shown on a student's
-- own task card once their submission is approved ('locked') at that
-- level. Only Base and Medium are stored -- Hard's color (solid green,
-- white text) is fixed in the client rather than admin-configurable, so it
-- needs no column. Plain hex text (e.g. "#fde68a"), matching an
-- <input type="color">'s native output -- there's no design-token system
-- in this app that a DB-stored, admin-picked arbitrary color could
-- reference instead, so a raw hex string plus inline style on the client
-- is the only workable approach. Null means "no custom color set", card
-- keeps its current plain background.
alter table public.task_board_tasks
  add column if not exists completed_color_base text;
alter table public.task_board_tasks
  add column if not exists completed_color_medium text;
