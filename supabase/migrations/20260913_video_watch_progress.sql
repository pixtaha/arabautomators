-- Applied directly by Claude Code via docker exec on supabase-db, per the
-- user's migration workflow (see auto-memory applying-supabase-migrations.md).
--
-- video_watch_progress: per-(student, video) watch tracking, replacing the
-- currently non-functional progress display. This migration only records
-- data -- furthest position reached, duration when known, and a `watched`
-- flag the API route sets explicitly once a threshold is crossed. `watched`
-- is stored, never recomputed from position on read, so the "counts as
-- watched" threshold (WATCHED_THRESHOLD_RATIO in
-- app/api/course/video-progress/route.ts) can change later without a schema
-- change or a backfill. No resume-playback logic reads this yet, but the
-- shape (furthest position + duration) is exactly what that would need.
--
-- session_video_part_id is deliberately NOT a foreign key, despite its name.
-- lib/session-video-parts.ts's getSessionVideoParts() builds one flat
-- SessionVideoPart[] list whose `id` is EITHER a session_video_parts.id (the
-- lecture's own recorded segments) OR a session_resources.id (video /
-- credential_video-type resources, e.g. per-tool credential walkthroughs) --
-- the player and the rest of the app already treat these as one
-- interchangeable id space, but they live in two separate tables with no
-- common parent a real FK could point at. This is the same situation, and
-- the same fix, as points_ledger.source_id (20260905_points_ledger.sql):
-- polymorphic by convention, with integrity enforced by the one trusted
-- write path (POST /api/course/video-progress, using createAdminClient())
-- rather than by a database constraint.
create table public.video_watch_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  session_video_part_id uuid not null,
  furthest_position_seconds integer not null default 0,
  duration_seconds integer,
  watched boolean not null default false,
  last_watched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (student_id, session_video_part_id)
);

create index video_watch_progress_student_id_idx on public.video_watch_progress (student_id);

alter table public.video_watch_progress enable row level security;

-- Students can only ever READ their own rows via RLS (same convention as
-- task_board_submissions/points_ledger). The one write path is POST
-- /api/course/video-progress, which uses createAdminClient() precisely so it
-- can enforce "furthest position never decreases" / the watched threshold
-- server-side -- a client-writable RLS policy couldn't express that.
create policy "Students can read their own video watch progress"
  on public.video_watch_progress for select
  to authenticated
  using (student_id = auth.uid() and public.has_active_device_session());

create policy "Admins can read all video watch progress"
  on public.video_watch_progress for select
  to authenticated
  using (public.is_admin());
