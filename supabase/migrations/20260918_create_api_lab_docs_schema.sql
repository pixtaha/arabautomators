-- Applied manually via docker exec on supabase-db, same as every other
-- migration in this project.
--
-- Data layer for the Commerce API docs rebuild (app/dashboard/api-lab-docs-v2).
-- The existing /dashboard/api-lab-docs page hardcodes all doc content (Getting
-- Started steps, endpoint tables, etc.) as a static HTML/CSS string in
-- app/dashboard/api-lab-docs/fragment.ts -- editing any content there requires
-- a code change and redeploy. This schema replaces that with three tables so
-- content can be edited as data. Unlike student_api_credentials/
-- student_n8n_credentials (created directly against the database with no
-- migration), this is a real, tracked migration from the start.
--
-- Sections are the page's top-level anchored blocks (Getting Started,
-- Endpoint reference, ...) in display order. Each section owns an ordered
-- sequence of typed content blocks -- paragraph/code/table/etc -- rather than
-- one raw-HTML column, so rendering never needs dangerouslySetInnerHTML: each
-- block kind maps to one trusted React component, and inline rich text is a
-- small markdown-lite string (`code`, **bold**, [text](url)) parsed into
-- real nodes, not raw markup.
--
-- The endpoint reference table is the one genuinely structured, queryable
-- piece of content on the page (method/path/key requirement/purpose for ~30
-- rows), so it gets its own relational table instead of living in generic
-- block JSON -- a block of kind 'endpoint_table' is just a positional marker
-- telling the renderer where in a section's block sequence to render this
-- section's rows from api_lab_endpoints.
--
-- The three static info boxes (Base URL / Interactive explorer / OpenAPI)
-- and the credential trigger are NOT modeled here -- those are genuinely
-- static config values, not content, and stay as constants in the page's
-- source per the agreed plan.

create table public.api_lab_doc_sections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nav_label text not null,
  title text not null,
  eyebrow text,
  display_order integer not null,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index api_lab_doc_sections_display_order_idx
  on public.api_lab_doc_sections (display_order);

alter table public.api_lab_doc_sections enable row level security;

create policy "Authorized devices can read published api lab doc sections"
  on public.api_lab_doc_sections for select
  to authenticated
  using (is_published and public.has_active_device_session());

-- No admin editing UI exists yet, but the policy is set up alongside the
-- schema now (same order as task_board_tasks' own read/write pair), not
-- bolted on later when that UI is built.
create policy "Admins can write api lab doc sections"
  on public.api_lab_doc_sections for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create table public.api_lab_doc_blocks (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.api_lab_doc_sections(id) on delete cascade,
  display_order integer not null,
  kind text not null check (kind in (
    'paragraph',
    'numbered_steps',
    'ordered_list',
    'code',
    'callout',
    'table',
    'endpoint_table',
    'badge_sequence'
  )),
  -- Shape depends on kind, e.g. paragraph: {"text": "markdown-lite string"};
  -- code: {"language": "bash"|"json"|"text", "code": "..."}; callout:
  -- {"accent": "brand"|"accent"|"ink", "text": "..."}; table (the two small
  -- one-off reference tables, not the endpoint table): {"columns": [...],
  -- "rows": [...]}; endpoint_table: {} (marker only, see above);
  -- badge_sequence: {"label": "...", "badges": [...]}.
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index api_lab_doc_blocks_section_id_display_order_idx
  on public.api_lab_doc_blocks (section_id, display_order);

alter table public.api_lab_doc_blocks enable row level security;

create policy "Authorized devices can read published api lab doc blocks"
  on public.api_lab_doc_blocks for select
  to authenticated
  using (
    public.has_active_device_session()
    and exists (
      select 1 from public.api_lab_doc_sections s
      where s.id = section_id and s.is_published
    )
  );

create policy "Admins can write api lab doc blocks"
  on public.api_lab_doc_blocks for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create table public.api_lab_endpoints (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.api_lab_doc_sections(id) on delete cascade,
  method text not null check (method in ('GET','POST','PATCH','PUT','DELETE')),
  path text not null,
  requires_key boolean not null default false,
  is_write boolean not null default false,
  purpose text not null,
  display_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index api_lab_endpoints_section_id_display_order_idx
  on public.api_lab_endpoints (section_id, display_order);

alter table public.api_lab_endpoints enable row level security;

create policy "Authorized devices can read published api lab endpoints"
  on public.api_lab_endpoints for select
  to authenticated
  using (
    public.has_active_device_session()
    and exists (
      select 1 from public.api_lab_doc_sections s
      where s.id = section_id and s.is_published
    )
  );

create policy "Admins can write api lab endpoints"
  on public.api_lab_endpoints for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
