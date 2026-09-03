-- Notification preferences: per-student boolean toggles for the Account
-- page, replacing the "Preview only" local-state-only UI. A default row is
-- created automatically on signup, same as profiles -- extends the
-- existing handle_new_user() trigger function rather than adding a second
-- AFTER INSERT trigger on auth.users for the same "set up per-user rows"
-- job.

create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  session_reminders boolean not null default true,
  weekly_digest boolean not null default true,
  workflow_replies boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "Users manage their own notification preferences" on public.notification_preferences;
create policy "Users manage their own notification preferences"
on public.notification_preferences
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');

  insert into public.notification_preferences (user_id)
  values (new.id);

  return new;
end;
$$;
