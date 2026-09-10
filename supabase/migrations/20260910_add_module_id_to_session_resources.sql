-- Resources move from per-session to per-module scope.
-- session_id is left untouched (still NOT dropped, still nullable) so nothing
-- breaks if this needs to be rolled back. module_id is nullable for now too;
-- it only becomes required once app code is updated and verified (future migration).

ALTER TABLE session_resources
  ADD COLUMN module_id uuid REFERENCES modules(id) ON DELETE RESTRICT;

CREATE INDEX session_resources_module_id_idx ON session_resources (module_id);

-- Backfill: every existing resource inherits the module_id of the session it
-- currently belongs to.
UPDATE session_resources sr
SET module_id = s.module_id
FROM sessions s
WHERE sr.session_id = s.id;
