-- Apply during the DRM rollout, before relinking legacy video resources.
-- Non-video resources and storage objects are untouched. Existing video cards
-- retain their IDs, type, titles, and order; source locations are archived privately.
begin;

create table if not exists public.session_video_source_archive (
  resource_id uuid primary key,
  source_url text not null,
  archived_at timestamptz not null default now()
);
alter table public.session_video_source_archive enable row level security;
revoke all on public.session_video_source_archive from public, anon, authenticated;
grant select, insert, update, delete on public.session_video_source_archive to service_role;

insert into public.session_video_source_archive (resource_id, source_url)
select id, file_url from public.session_resources
where type in ('video', 'credential_video') and file_url is not null
on conflict (resource_id) do nothing;

update public.session_resources set file_url = null
where type in ('video', 'credential_video') and file_url is not null;

alter table public.session_resources
  add constraint session_resources_no_clear_video_url
  check (type not in ('video', 'credential_video') or file_url is null);

-- NOT VALID preserves unlinked legacy rows until each has been migrated.
-- New/updated video rows must use a Bunny GUID, including direct database writes.
alter table public.session_resources
  add constraint session_resources_video_requires_bunny
  check (type not in ('video', 'credential_video') or
    (bunny_video_id is not null and bunny_video_id::text ~*
     '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')) not valid;

commit;

-- After relinking all legacy video rows, VALIDATE the second constraint.
-- Archiving URLs is NOT storage access revocation. Quarantine the two legacy
-- video objects privately and invalidate their public caches during cutover.
