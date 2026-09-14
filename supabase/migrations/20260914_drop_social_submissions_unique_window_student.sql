-- Students can now submit any number of separate posts per social window
-- (previously capped at one per window/student). Applied directly against
-- the live database on 2026-09-14; this file just records that change so
-- the migration history matches the live schema.
ALTER TABLE public.social_submissions DROP CONSTRAINT social_submissions_window_id_student_id_key;
