-- Adds the fields the redesigned Session Notes card and the sidebar warning
-- callout need on top of the existing sessions columns (summary_ar, notes,
-- covered_topics, homework already exist). All nullable: a session with none
-- of this filled in just renders without a title/warning.

alter table public.sessions add column if not exists notes_title text;
alter table public.sessions add column if not exists warning_title text;
alter table public.sessions add column if not exists warning_body text;
