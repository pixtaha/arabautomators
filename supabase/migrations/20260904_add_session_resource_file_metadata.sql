-- Adds file metadata for the redesigned document resource cards.
-- file_size_bytes is captured automatically from the real upload for every
-- resource type. page_count is admin-entered and only meaningful for pdf.
-- Both nullable: older rows show no metadata line rather than fake data.

alter table public.session_resources add column if not exists file_size_bytes bigint;
alter table public.session_resources add column if not exists page_count integer;
