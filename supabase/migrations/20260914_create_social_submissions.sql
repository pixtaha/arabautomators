CREATE TABLE IF NOT EXISTS public.social_windows (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  platform text,
  opens_at timestamptz not null default now(),
  closes_at timestamptz,
  is_active boolean not null default true,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS public.social_submissions (
  id uuid primary key default gen_random_uuid(),
  window_id uuid not null references public.social_windows(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  post_url text not null,
  status text not null default 'pending' check (status = ANY (ARRAY['pending'::text, 'approved'::text, 'sent_back'::text])),
  admin_comment text,
  points_awarded integer,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (window_id, student_id)
);

CREATE INDEX IF NOT EXISTS social_submissions_status_idx ON public.social_submissions (status);
CREATE INDEX IF NOT EXISTS social_submissions_student_idx ON public.social_submissions (student_id);

ALTER TABLE public.social_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can read active windows" ON public.social_windows
  FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage windows" ON public.social_windows
  FOR ALL TO authenticated
  USING (is_admin());

CREATE POLICY "Students can read own submissions" ON public.social_submissions
  FOR SELECT TO authenticated
  USING (student_id = uid());

CREATE POLICY "Students can insert own submissions" ON public.social_submissions
  FOR INSERT TO authenticated
  WITH CHECK (student_id = uid());

CREATE POLICY "Admins can manage submissions" ON public.social_submissions
  FOR ALL TO authenticated
  USING (is_admin());

ALTER TABLE public.points_ledger DROP CONSTRAINT points_ledger_source_type_check;
ALTER TABLE public.points_ledger ADD CONSTRAINT points_ledger_source_type_check
  CHECK (source_type = ANY (ARRAY['task'::text, 'quiz'::text, 'task_board'::text, 'social'::text]));

CREATE OR REPLACE FUNCTION public.revoke_social_points_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status != 'approved') THEN
    DELETE FROM public.points_ledger
    WHERE source_type = 'social' AND source_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER social_submissions_revoke_points
  AFTER UPDATE ON public.social_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.revoke_social_points_on_status_change();
