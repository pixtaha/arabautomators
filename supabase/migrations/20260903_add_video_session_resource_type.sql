-- session_resources.type is text constrained to the supported resource
-- categories. Add a distinct general-purpose video value without changing
-- the existing credential_video category or any stored rows.

alter table public.session_resources
  drop constraint if exists session_resources_type_check;

alter table public.session_resources
  add constraint session_resources_type_check
  check (
    type = any (
      array[
        'pdf'::text,
        'voice_note'::text,
        'workflow_file'::text,
        'text'::text,
        'credential_video'::text,
        'video'::text
      ]
    )
  );
