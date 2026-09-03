-- One authorized browser session per user.
--
-- Supabase Auth remains responsible for proving identity. This table binds the
-- resulting auth.sessions session_id to a second, server-issued device token.
-- Only the token hash is stored. All mutations are service-role-only and the
-- partial unique index is the final concurrency guard.

create table public.user_device_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  auth_session_id uuid not null,
  device_id uuid not null default gen_random_uuid(),
  device_token_hash text not null,
  device_name text,
  device_type text,
  browser text,
  os text,
  ip_address inet,
  user_agent text,
  status text not null default 'active'
    check (status in ('active', 'logged_out', 'revoked', 'expired')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  logged_out_at timestamptz,
  constraint user_device_sessions_token_hash_format
    check (device_token_hash ~ '^[0-9a-f]{64}$'),
  constraint user_device_sessions_active_status_consistent
    check ((is_active and status = 'active') or (not is_active and status <> 'active')),
  constraint user_device_sessions_revoked_at_consistent
    check (status <> 'revoked' or revoked_at is not null),
  constraint user_device_sessions_logged_out_at_consistent
    check (status <> 'logged_out' or logged_out_at is not null)
);

create unique index user_device_sessions_one_active_per_user
  on public.user_device_sessions (user_id)
  where is_active;

create unique index user_device_sessions_token_hash_key
  on public.user_device_sessions (device_token_hash);

create index user_device_sessions_user_history_idx
  on public.user_device_sessions (user_id, created_at desc);

create index user_device_sessions_status_last_seen_idx
  on public.user_device_sessions (status, last_seen_at desc);

alter table public.user_device_sessions enable row level security;

-- No anon/authenticated policies are intentional. Device rows contain audit
-- metadata and token hashes and are only accessed by the server service role.
revoke all on table public.user_device_sessions from anon, authenticated;

create or replace function public.has_active_device_session()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.user_device_sessions uds
    where uds.user_id = auth.uid()
      and uds.auth_session_id::text = auth.jwt() ->> 'session_id'
      and uds.status = 'active'
      and uds.is_active
  );
$$;

revoke all on function public.has_active_device_session() from public;
grant execute on function public.has_active_device_session() to authenticated, service_role;

create or replace function public.register_user_device_session(
  p_user_id uuid,
  p_auth_session_id uuid,
  p_device_token_hash text,
  p_device_name text default null,
  p_device_type text default null,
  p_browser text default null,
  p_os text default null,
  p_ip_address inet default null,
  p_user_agent text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  active_session public.user_device_sessions%rowtype;
begin
  -- Serialize attempts for the same user. The partial unique index remains a
  -- second, independent guard against concurrent active inserts.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  update public.user_device_sessions
  set status = 'expired', is_active = false
  where user_id = p_user_id
    and is_active
    and last_seen_at < now() - interval '30 days';

  select * into active_session
  from public.user_device_sessions
  where user_id = p_user_id and is_active
  for update;

  if found then
    -- The secure cookie proves this is the already-authorized browser. It may
    -- bind a fresh Supabase Auth session after token expiry or reauthentication.
    if active_session.device_token_hash = p_device_token_hash then
      update public.user_device_sessions
      set auth_session_id = p_auth_session_id,
          device_name = coalesce(p_device_name, device_name),
          device_type = coalesce(p_device_type, device_type),
          browser = coalesce(p_browser, browser),
          os = coalesce(p_os, os),
          ip_address = p_ip_address,
          user_agent = left(p_user_agent, 1024),
          last_seen_at = now()
      where id = active_session.id;
      return true;
    end if;

    return false;
  end if;

  insert into public.user_device_sessions (
    user_id,
    auth_session_id,
    device_token_hash,
    device_name,
    device_type,
    browser,
    os,
    ip_address,
    user_agent
  ) values (
    p_user_id,
    p_auth_session_id,
    p_device_token_hash,
    nullif(left(p_device_name, 120), ''),
    nullif(left(p_device_type, 80), ''),
    nullif(left(p_browser, 120), ''),
    nullif(left(p_os, 120), ''),
    p_ip_address,
    nullif(left(p_user_agent, 1024), '')
  );

  return true;
end;
$$;

revoke all on function public.register_user_device_session(
  uuid, uuid, text, text, text, text, text, inet, text
) from public, anon, authenticated;
grant execute on function public.register_user_device_session(
  uuid, uuid, text, text, text, text, text, inet, text
) to service_role;

create or replace function public.touch_user_device_session(
  p_user_id uuid,
  p_auth_session_id uuid,
  p_device_token_hash text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_device_sessions
  set last_seen_at = now()
  where user_id = p_user_id
    and auth_session_id = p_auth_session_id
    and device_token_hash = p_device_token_hash
    and status = 'active'
    and is_active
    and last_seen_at < now() - interval '5 minutes';

  return found;
end;
$$;

revoke all on function public.touch_user_device_session(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.touch_user_device_session(uuid, uuid, text)
  to service_role;

create or replace function public.logout_user_device_session(
  p_user_id uuid,
  p_auth_session_id uuid,
  p_device_token_hash text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_device_sessions
  set status = 'logged_out',
      is_active = false,
      logged_out_at = now(),
      last_seen_at = now()
  where user_id = p_user_id
    and auth_session_id = p_auth_session_id
    and device_token_hash = p_device_token_hash
    and status = 'active'
    and is_active;

  return found;
end;
$$;

revoke all on function public.logout_user_device_session(uuid, uuid, text)
  from public, anon, authenticated;
grant execute on function public.logout_user_device_session(uuid, uuid, text)
  to service_role;

-- Bind all browser-accessible authenticated data to the registered Supabase
-- Auth session. A valid JWT created outside the application is insufficient.
drop policy if exists "Authenticated users can read modules" on public.modules;
create policy "Authorized devices can read modules"
  on public.modules for select to authenticated
  using (public.has_active_device_session());

drop policy if exists "Authenticated users can read sessions" on public.sessions;
create policy "Authorized devices can read sessions"
  on public.sessions for select to authenticated
  using (public.has_active_device_session());

drop policy if exists "Authenticated users can read session resources" on public.session_resources;
create policy "Authorized devices can read session resources"
  on public.session_resources for select to authenticated
  using (public.has_active_device_session());

drop policy if exists "Authenticated users can read tasks" on public.tasks;
create policy "Authorized devices can read tasks"
  on public.tasks for select to authenticated
  using (public.has_active_device_session());

drop policy if exists "Users manage their own notification preferences" on public.notification_preferences;
create policy "Authorized users manage their own notification preferences"
  on public.notification_preferences for all to authenticated
  using (auth.uid() = user_id and public.has_active_device_session())
  with check (auth.uid() = user_id and public.has_active_device_session());

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Authorized users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id and public.has_active_device_session())
  with check (auth.uid() = id and public.has_active_device_session());

drop policy if exists "Students can read their own task status" on public.student_task_status;
create policy "Authorized students can read their own task status"
  on public.student_task_status for select to authenticated
  using (student_id = auth.uid() and public.has_active_device_session());

drop policy if exists "Students can insert their own task status" on public.student_task_status;
create policy "Authorized students can insert their own task status"
  on public.student_task_status for insert to authenticated
  with check (student_id = auth.uid() and public.has_active_device_session());

drop policy if exists "Students can update their own task status" on public.student_task_status;
create policy "Authorized students can update their own task status"
  on public.student_task_status for update to authenticated
  using (student_id = auth.uid() and public.has_active_device_session())
  with check (student_id = auth.uid() and public.has_active_device_session());

drop policy if exists "Students can delete their own task status" on public.student_task_status;
create policy "Authorized students can delete their own task status"
  on public.student_task_status for delete to authenticated
  using (student_id = auth.uid() and public.has_active_device_session());

-- is_admin() is used by all admin table/storage write policies.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.has_active_device_session() and exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "Session resources are readable by authenticated users" on storage.objects;
create policy "Session resources are readable by authorized devices"
  on storage.objects for select to authenticated
  using (bucket_id = 'session-resources' and public.has_active_device_session());
