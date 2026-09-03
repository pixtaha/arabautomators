-- Task descriptions: optional longer-form instructions shown when a
-- student expands a task, separate from the short title already shown
-- collapsed. Nullable -- older tasks may not have one yet.

alter table public.tasks add column if not exists description text;
alter table public.tasks add column if not exists description_ar text;
