-- Adds the free-form content columns the Course Session page needs on top of
-- the existing sessions table (module_id, order_index, title, live_date,
-- main_video_bunny_id, status already exist). All nullable: a session with
-- none of this filled in just renders without a notes card.

alter table public.sessions add column if not exists summary_ar text;
alter table public.sessions add column if not exists notes text;
alter table public.sessions add column if not exists covered_topics text[];
alter table public.sessions add column if not exists homework text;
alter table public.sessions add column if not exists tags text[];
