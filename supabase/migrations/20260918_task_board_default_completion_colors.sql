-- Task Board: default "completed" card colors for Base/Medium levels.
-- completed_color_base/completed_color_medium (added in
-- 20260916_task_board_custom_labels_and_completion_colors.sql) used to mean
-- "null = no color, plain card background" -- that's being retired in favor
-- of a level-specific default (Base: #eff6ff, Medium: #fef3c7) that renders
-- whenever an admin hasn't picked a custom color. The API routes now write
-- that default directly into these columns for new/edited tasks instead of
-- leaving them null (see app/api/admin/task-board/tasks/route.ts and
-- .../[taskId]/route.ts), so this is a one-time backfill for tasks created
-- before that change.
--
-- Scoped to points_base/points_medium is not null (i.e. the level is
-- actually offered) -- matches the API's own enabled-gating, which always
-- forces the color column to null when a level is disabled. Tasks that
-- already have a custom color set are untouched (the "is null" filter
-- already excludes them).
update public.task_board_tasks
set completed_color_base = '#eff6ff'
where completed_color_base is null
  and points_base is not null;

update public.task_board_tasks
set completed_color_medium = '#fef3c7'
where completed_color_medium is null
  and points_medium is not null;
