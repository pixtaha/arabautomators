-- Role-based admin security, replacing the hardcoded-email admin check.
--
-- Assumes profiles.role (enum: student | admin | moderator, default
-- student) already exists and is populated. Existing SELECT ("authenticated
-- users can read") policies on modules/sessions/session_resources are left
-- untouched -- this migration only adds write (insert/update/delete)
-- policies gated to admins, plus a matching set of Storage policies for the
-- session-resources bucket.

-- Reusable helper: is the current request's authenticated user an admin?
-- security definer + search_path pin so it can read profiles regardless of
-- who's calling, and can't be hijacked by a search_path trick.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- modules ---------------------------------------------------------------
alter table public.modules enable row level security;

drop policy if exists "Admins can insert modules" on public.modules;
create policy "Admins can insert modules"
  on public.modules for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update modules" on public.modules;
create policy "Admins can update modules"
  on public.modules for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete modules" on public.modules;
create policy "Admins can delete modules"
  on public.modules for delete
  to authenticated
  using (public.is_admin());

-- sessions ----------------------------------------------------------------
alter table public.sessions enable row level security;

drop policy if exists "Admins can insert sessions" on public.sessions;
create policy "Admins can insert sessions"
  on public.sessions for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update sessions" on public.sessions;
create policy "Admins can update sessions"
  on public.sessions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete sessions" on public.sessions;
create policy "Admins can delete sessions"
  on public.sessions for delete
  to authenticated
  using (public.is_admin());

-- session_resources -------------------------------------------------------
alter table public.session_resources enable row level security;

drop policy if exists "Admins can insert session resources" on public.session_resources;
create policy "Admins can insert session resources"
  on public.session_resources for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update session resources" on public.session_resources;
create policy "Admins can update session resources"
  on public.session_resources for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete session resources" on public.session_resources;
create policy "Admins can delete session resources"
  on public.session_resources for delete
  to authenticated
  using (public.is_admin());

-- storage: session-resources bucket ----------------------------------------
-- Bucket itself is public (so getPublicUrl() links work for anyone), but
-- authenticated-role access through the Storage API is governed by these
-- policies same as any other table.

drop policy if exists "Session resources are readable by authenticated users" on storage.objects;
create policy "Session resources are readable by authenticated users"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'session-resources');

drop policy if exists "Admins can upload session resource files" on storage.objects;
create policy "Admins can upload session resource files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'session-resources' and public.is_admin());

drop policy if exists "Admins can update session resource files" on storage.objects;
create policy "Admins can update session resource files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'session-resources' and public.is_admin())
  with check (bucket_id = 'session-resources' and public.is_admin());

drop policy if exists "Admins can delete session resource files" on storage.objects;
create policy "Admins can delete session resource files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'session-resources' and public.is_admin());
