-- session-resources bucket: the storage.objects RLS policies in
-- 20260830_role_based_admin_security.sql assume this bucket already
-- exists, but no migration ever created it -- it was apparently created
-- by hand in the Cloud dashboard and never captured here.
--
-- Public read, same as avatars: app/api/admin/session-resources uses
-- getPublicUrl() to build session_resources.file_url, and the DELETE
-- route parses the object path back out of the public URL prefix. There
-- is no signed-URL usage anywhere for this bucket, so it must be public
-- for those links to resolve. Writes are already gated to admins via the
-- existing storage.objects policies (bucket_id = 'session-resources' and
-- public.is_admin()).

insert into storage.buckets (id, name, public)
values ('session-resources', 'session-resources', true)
on conflict (id) do update set public = true;
