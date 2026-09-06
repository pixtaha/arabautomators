-- ============================================================================
-- PROPOSED — NOT APPLIED. Written by the overnight audit (2026-09-06).
--
-- Deliberately named with a PROPOSED_ prefix so it does NOT sort into the
-- normal migration sequence and cannot be picked up by an automated apply.
-- Review, then rename to 20260906_... and apply manually.
--
-- Revised 2026-09-06 after review: prevent_profile_role_change() switched from
-- SECURITY DEFINER to SECURITY INVOKER (as DEFINER its current_user check was
-- inert, so the trigger never fired for anyone), and
-- enforce_quiz_attempt_score() now treats an empty-string answer as
-- unanswered rather than wrong, matching lib/quizzes.ts scoreQuiz.
--
-- Fixes two confirmed vulnerabilities, both proven with rolled-back
-- transactions against the live database (nothing was committed):
--
--   1. CRITICAL — any logged-in student can promote themselves to admin.
--      public.profiles' UPDATE policy checks only "this is my row"; it does
--      not restrict which columns may change. profiles.role was added to the
--      same table later, so a student can run
--          update profiles set role = 'admin' where id = auth.uid()
--      through PostgREST with nothing but the public anon key and their own
--      session. is_admin() then returns true, which unlocks every admin RLS
--      policy AND lib/adminAuth.ts's requireAdmin() (it reads the same
--      column), i.e. the whole admin API surface including push-workflow and
--      the student_n8n_credentials table.
--
--   2. CRITICAL — any student can set their own quiz score to any integer.
--      quiz_attempts' INSERT policy checks only student_id = auth.uid();
--      `score` is whatever the client sends, and award_quiz_points() copies
--      it straight into points_ledger. Scoring lives entirely in the browser
--      (lib/quizzes.ts scoreQuiz), so the leaderboard is client-controlled.
-- ============================================================================


-- ---------------------------------------------------------------------------
-- FIX 1: freeze profiles.role against self-service changes.
--
-- A RESTRICTIVE policy ANDs with the existing permissive ones, so the current
-- "Authorized users can update their own profile" policy keeps working for
-- username/avatar_url while role becomes immutable from the client. The
-- service role still bypasses RLS entirely, so admin tooling is unaffected.
-- ---------------------------------------------------------------------------
drop policy if exists "Role cannot be changed from the client" on public.profiles;
create policy "Role cannot be changed from the client"
  on public.profiles
  as restrictive
  for update
  to authenticated
  using (true)
  with check (role is not distinct from (select p.role from public.profiles p where p.id = profiles.id));

-- Belt and braces: the same guarantee at the table level, so it holds even if
-- a future migration adds another permissive UPDATE policy on profiles.
create or replace function public.prevent_profile_role_change()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- SECURITY INVOKER is load-bearing here. Inside a SECURITY DEFINER function
  -- current_user is the function OWNER (postgres), which is in the allow-list
  -- below -- the check would never fire, for anyone. As INVOKER, current_user
  -- is the role actually running the UPDATE: 'authenticated' for a browser
  -- client, 'service_role' for the server's admin client, 'postgres' for a
  -- psql / SQL-editor session. The function reads only NEW/OLD and touches no
  -- table, so it needs no elevated rights.
  if new.role is distinct from old.role
     and current_user not in ('postgres', 'supabase_admin', 'service_role') then
    raise exception 'profiles.role cannot be changed from the client';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_prevent_role_change on public.profiles;
create trigger profiles_prevent_role_change
  before update on public.profiles
  for each row execute function public.prevent_profile_role_change();


-- ---------------------------------------------------------------------------
-- FIX 2: stop trusting the client-submitted quiz score.
--
-- Recomputes the score server-side from quizzes.quiz_json and the submitted
-- answers, using the same rules lib/quizzes.ts scoreQuiz applies
-- (pointsPerCorrect / pointsPerWrong, floored at minQuizScore), and
-- overwrites whatever the client sent. Also refuses attempts against a quiz
-- that is not currently live, which the RLS INSERT policy does not check.
--
-- NOTE: this makes the score authoritative but does NOT hide the answer key.
-- Students can still read correctOptionId out of quiz_json for the live quiz
-- (that is inherent to client-side rendering of the current design). Removing
-- that requires serving questions without the answers and scoring through a
-- server route -- a larger change, described in the audit report.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_quiz_attempt_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  q jsonb;
  is_live_now boolean;
  question jsonb;
  picked text;
  computed numeric := 0;
  per_correct numeric;
  per_wrong numeric;
  min_score numeric;
begin
  select quiz_json, is_live into q, is_live_now
  from public.quizzes where id = new.quiz_id;

  if q is null then
    raise exception 'quiz not found';
  end if;
  if not is_live_now then
    raise exception 'quiz is not live';
  end if;

  per_correct := coalesce((q -> 'scoring' ->> 'pointsPerCorrect')::numeric, 0);
  per_wrong   := coalesce((q -> 'scoring' ->> 'pointsPerWrong')::numeric, 0);
  min_score   := coalesce((q -> 'scoring' ->> 'minQuizScore')::numeric, 0);

  for question in select * from jsonb_array_elements(q -> 'questions')
  loop
    picked := new.answers ->> (question ->> 'id');
    -- Mirrors scoreQuiz's `if (!picked) continue`: an empty string is an
    -- unanswered question, not a wrong answer worth pointsPerWrong.
    if picked is null or picked = '' then
      continue;
    elsif picked = (question ->> 'correctOptionId') then
      computed := computed + per_correct;
    else
      computed := computed + per_wrong;
    end if;
  end loop;

  new.score := greatest(min_score, computed)::integer;
  new.completed_at := now();   -- also client-supplied today
  return new;
end;
$$;

drop trigger if exists quiz_attempts_enforce_score on public.quiz_attempts;
create trigger quiz_attempts_enforce_score
  before insert on public.quiz_attempts
  for each row execute function public.enforce_quiz_attempt_score();

-- The award trigger already runs AFTER INSERT, so it will read the corrected
-- score. No change needed there.
