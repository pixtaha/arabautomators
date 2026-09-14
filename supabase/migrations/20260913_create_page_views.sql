CREATE TABLE IF NOT EXISTS public.page_views (
  id bigint generated always as identity primary key,
  path text not null,
  visitor_id text,
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON public.page_views (created_at);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON public.page_views
  FOR ALL TO service_role USING (true) WITH CHECK (true);
