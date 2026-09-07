-- Allow up to two concurrent active device sessions per user: one desktop
-- and one mobile. The old guard was a single partial unique index on
-- (user_id) where is_active, enforcing exactly one active session per user
-- regardless of device. This replaces it with an expression index scoped by
-- a normalized device-type bucket, and changes register_user_device_session
-- so that a new login for a bucket that's already active revokes the prior
-- session in that same bucket and takes its place, instead of being
-- rejected. A session in the other bucket is never touched.
--
-- Bucketing: device_type values of 'mobile' or 'tablet' (case-insensitive)
-- map to 'mobile'; everything else -- including null/unrecognized values,
-- 'desktop', and rarer ua-parser-js device types like 'console', 'smarttv',
-- 'embedded', 'wearable' -- maps to 'desktop'. This matches the existing
-- `parsedAgent.device.type || "desktop"` fallback already used when a
-- session is registered (app/api/auth/otp/verify/route.ts).

create or replace function public.device_session_bucket(p_device_type text)
returns text
language sql
immutable
as $$
  select case
    when lower(coalesce(p_device_type, '')) in ('mobile', 'tablet') then 'mobile'
    else 'desktop'
  end;
$$;

drop index if exists public.user_device_sessions_one_active_per_user;

create unique index user_device_sessions_one_active_per_user_type
  on public.user_device_sessions (user_id, public.device_session_bucket(device_type))
  where is_active;

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
  v_bucket text := public.device_session_bucket(p_device_type);
begin
  -- Serialize attempts for the same user (across both buckets -- simpler
  -- than a per-bucket lock key and the contention cost is negligible). The
  -- partial unique index remains a second, independent guard.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  update public.user_device_sessions
  set status = 'expired', is_active = false
  where user_id = p_user_id
    and is_active
    and last_seen_at < now() - interval '30 days';

  select * into active_session
  from public.user_device_sessions
  where user_id = p_user_id
    and is_active
    and public.device_session_bucket(device_type) = v_bucket
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

    -- A different device in the same bucket (desktop or mobile) is logging
    -- in. Revoke the previous session in that bucket rather than rejecting
    -- the new login; the other bucket's active session, if any, is untouched.
    update public.user_device_sessions
    set status = 'revoked',
        is_active = false,
        revoked_at = now()
    where id = active_session.id;
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
