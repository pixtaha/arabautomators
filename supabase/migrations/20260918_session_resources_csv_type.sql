-- session_resources: additive support for a new "csv" resource type.
--
-- CSV is a plain file-upload type, same as pdf/voice_note/workflow_file: the
-- file goes to the session-resources storage bucket and its public URL is
-- stored in the existing file_url column. No new columns needed -- this only
-- widens the type CHECK constraint (same drop/re-add pattern as the "link"
-- migration, 20260917_session_resources_link_type_and_display_order.sql).
--
-- Apply this BEFORE deploying the code that lets an admin pick "CSV":
-- until the constraint allows it, a CSV insert is rejected by the database
-- (the upload route cleans up the stored file and returns "Could not save
-- resource."). Existing resource types are unaffected either way.
alter table public.session_resources
  drop constraint session_resources_type_check;
alter table public.session_resources
  add constraint session_resources_type_check
  check (type = any (array['pdf','voice_note','workflow_file','text','credential_video','video','link','csv']));
