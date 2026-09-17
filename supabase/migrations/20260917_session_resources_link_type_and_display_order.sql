-- session_resources: additive support for a new "link" resource type and an
-- optional admin-entered manual sort override.
--
-- Link stores its URL in the existing file_url column, not a new column --
-- every other file_url-bearing type (pdf/voice_note/workflow_file/text)
-- already uses it as "the URL this resource opens", and Link is exactly
-- that with no storage upload involved. video/credential_video are the
-- only types that deliberately leave file_url null (they use
-- vdocipher_video_id instead), so this doesn't collide with anything.
alter table public.session_resources
  drop constraint session_resources_type_check;
alter table public.session_resources
  add constraint session_resources_type_check
  check (type = any (array['pdf','voice_note','workflow_file','text','credential_video','video','link']));

-- display_order: nullable, admin-entered, independent of the existing
-- auto-assigned order_index (which has no form field and stays untouched).
-- Null = no manual override, falls back to order_index. Applied to both the
-- admin's own resource list and the student-facing view, so the admin can
-- preview the ordering they set.
alter table public.session_resources
  add column if not exists display_order integer;
