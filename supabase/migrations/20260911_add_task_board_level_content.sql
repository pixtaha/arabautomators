-- Applied manually via docker exec on supabase-db, same as every other
-- migration in this project.
--
-- Per-level description/checklist for task_board_tasks: levels represent
-- genuinely different scope, not just a point multiplier on identical
-- work, so each enabled level needs its own content. Nullable with no
-- default, same pattern as points_base/points_medium/points_hard -- a
-- task can offer Base only, Base+Medium, etc., and a level with no
-- points_<level> set is simply not offered regardless of whether
-- description_<level>/checklist_<level> happen to be filled in.
--
-- Purely additive: existing rows (including any inserted for manual
-- testing before this migration) are untouched -- these new columns are
-- NULL on those rows until explicitly filled in. The app falls back to
-- the general description/checklist columns when a level-specific one is
-- null, so an existing row keeps rendering sensibly without a backfill.

alter table public.task_board_tasks
  add column if not exists description_base text,
  add column if not exists description_medium text,
  add column if not exists description_hard text,
  add column if not exists checklist_base text[],
  add column if not exists checklist_medium text[],
  add column if not exists checklist_hard text[];
