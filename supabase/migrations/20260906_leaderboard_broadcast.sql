-- Leaderboard live-update broadcast: lets every authenticated student see a
-- leaderboard update the moment ANYONE earns points, without loosening RLS
-- on points_ledger/quiz_attempts themselves -- those stay locked to "read
-- your own rows only" (see 20260905_points_ledger.sql). Uses Supabase's
-- "Broadcast from Database": a trigger calls realtime.send() to drop a
-- message into realtime.messages, which Realtime relays to every client
-- subscribed to that topic over a private channel. The payload carries
-- nothing but "something changed"; the topic name alone says which
-- leaderboard, so no row data is ever exposed via this path.
--
-- Topic names are the actual pub/sub routing address here -- fixed and
-- shared between this trigger and every subscribing client, unlike a
-- postgres_changes channel's topic (which is just a local label; delivery
-- there is decided by the .on() filter, not the name). A random per-client
-- suffix -- the fix used for useLiveQuiz's unrelated channel-collision bug
-- -- would break this entirely, since the trigger's fixed topic would never
-- match a randomized client topic and nothing would ever be delivered.

-- realtime.messages has RLS enabled with zero policies today, meaning no
-- role can subscribe to any private broadcast topic yet. Scoped narrowly to
-- the 'leaderboard:' namespace so this grant can never expose some other,
-- unrelated future use of this table. realtime.topic() reads the topic the
-- connecting client is being authorized against (set by the Realtime
-- server itself), which is the documented way to gate a private channel --
-- not the same as filtering the table's own `topic` column.
drop policy if exists "Authorized students can receive leaderboard broadcasts" on realtime.messages;
create policy "Authorized students can receive leaderboard broadcasts"
  on realtime.messages for select
  to authenticated
  using (realtime.topic() like 'leaderboard:%' and public.has_active_device_session());

drop policy if exists "Admins can receive leaderboard broadcasts" on realtime.messages;
create policy "Admins can receive leaderboard broadcasts"
  on realtime.messages for select
  to authenticated
  using (realtime.topic() like 'leaderboard:%' and public.is_admin());

-- points_ledger is already the one common downstream event for both a quiz
-- completion and a task completion (including task-review approval -- see
-- award_task_points()'s own comment: it fires "whether immediately or after
-- admin approval of a reviewed task"), so one trigger here covers all three
-- leaderboards. Rides on points_ledger's own one-award-per-source unique
-- index, so this only ever fires once per real award, never on a duplicate.
create or replace function public.broadcast_leaderboard_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform realtime.send('{}'::jsonb, 'changed', 'leaderboard:points', true);

  if new.source_type = 'task' then
    perform realtime.send('{}'::jsonb, 'changed', 'leaderboard:tasks', true);
  elsif new.source_type = 'quiz' then
    perform realtime.send('{}'::jsonb, 'changed', 'leaderboard:quiz:' || new.source_id::text, true);
  end if;

  return new;
end;
$$;

drop trigger if exists points_ledger_broadcast_leaderboard on public.points_ledger;
create trigger points_ledger_broadcast_leaderboard
  after insert on public.points_ledger
  for each row execute function public.broadcast_leaderboard_change();
