-- Short session description shown under the title, above the video, on the
-- redesigned session page. Nullable and populated by hand like the other
-- session content columns (summary_ar, notes, homework) -- there is no
-- admin UI for session content yet, this matches that existing pattern.

alter table public.sessions add column if not exists description text;
