-- 007_archives_table_and_atomic_restore.sql
--
-- The `archives` table has been in use since the Archives module shipped but
-- was created ad hoc directly in the Supabase dashboard, so (like the schema
-- this migrations/ folder was created to stop happening) it was never
-- reviewable or reproducible from git. This file codifies it — CREATE TABLE
-- IF NOT EXISTS so running this against the existing production table with
-- real rows in it is a safe no-op on the table itself.
--
-- It also replaces the archive-on-delete / restore logic that used to live
-- as several sequential Supabase JS calls (snapshot insert, then delete
-- child rows, then delete the parent row — or, on restore, insert the
-- parent row, then re-insert child link rows, then delete the archive row)
-- with single Postgres functions. Each function body runs as one implicit
-- transaction: if any statement inside fails (including the officials
-- re-link insert on restore, whose error used to be silently swallowed),
-- Postgres rolls back everything else the function did instead of leaving a
-- half-restored/half-archived row behind.

BEGIN;

CREATE TABLE IF NOT EXISTS archives (
  id bigserial PRIMARY KEY,
  entity_type text NOT NULL,
  original_id bigint,
  data jsonb NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now(),
  archived_by bigint REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_archives_entity_type ON archives(entity_type);
CREATE INDEX IF NOT EXISTS idx_archives_archived_at ON archives(archived_at DESC);

-- Snapshots an ordinance (+ its ordinance_officials links) into `archives`
-- as JSON, then deletes the live rows. official_ids is stored alongside the
-- ordinance's own columns in the snapshot (not a real ordinances column) so
-- restore_archive() can recreate the links without a second lookup.
CREATE OR REPLACE FUNCTION archive_ordinance(p_id bigint, p_archived_by bigint)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_row ordinances;
  v_officials jsonb;
  v_snapshot jsonb;
BEGIN
  SELECT * INTO v_row FROM ordinances WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ordinance % not found', p_id USING ERRCODE = 'P0002';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('official_id', official_id, 'term_id', term_id)), '[]'::jsonb)
  INTO v_officials
  FROM ordinance_officials WHERE ordinance_id = p_id;

  v_snapshot := to_jsonb(v_row) || jsonb_build_object('official_ids', v_officials);

  INSERT INTO archives (original_id, entity_type, data, archived_by)
  VALUES (p_id, 'ordinance', v_snapshot, p_archived_by);

  DELETE FROM ordinance_officials WHERE ordinance_id = p_id;
  DELETE FROM ordinances WHERE id = p_id;

  RETURN v_snapshot;
END;
$$;

CREATE OR REPLACE FUNCTION archive_resolution(p_id bigint, p_archived_by bigint)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_row resolutions;
  v_officials jsonb;
  v_snapshot jsonb;
BEGIN
  SELECT * INTO v_row FROM resolutions WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Resolution % not found', p_id USING ERRCODE = 'P0002';
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object('official_id', official_id, 'term_id', term_id)), '[]'::jsonb)
  INTO v_officials
  FROM resolution_officials WHERE resolution_id = p_id;

  v_snapshot := to_jsonb(v_row) || jsonb_build_object('official_ids', v_officials);

  INSERT INTO archives (original_id, entity_type, data, archived_by)
  VALUES (p_id, 'resolution', v_snapshot, p_archived_by);

  DELETE FROM resolution_officials WHERE resolution_id = p_id;
  DELETE FROM resolutions WHERE id = p_id;

  RETURN v_snapshot;
END;
$$;

-- session_minutes has no officials join table, so this is a plain
-- snapshot-then-delete — still wrapped in a function for consistency and so
-- callers use the same rpc()-based pattern as the other two entity types.
CREATE OR REPLACE FUNCTION archive_session_minutes(p_id bigint, p_archived_by bigint)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_row session_minutes;
  v_snapshot jsonb;
BEGIN
  SELECT * INTO v_row FROM session_minutes WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session minutes % not found', p_id USING ERRCODE = 'P0002';
  END IF;

  v_snapshot := to_jsonb(v_row);

  INSERT INTO archives (original_id, entity_type, data, archived_by)
  VALUES (p_id, 'session_minutes', v_snapshot, p_archived_by);

  DELETE FROM session_minutes WHERE id = p_id;

  RETURN v_snapshot;
END;
$$;

-- Restores a content archive (ordinance/resolution/session_minutes) from its
-- JSON snapshot. jsonb_populate_record() maps the snapshot's keys back onto
-- the live table's columns generically, the same way the old JS code did a
-- plain `.insert(record)` of the whole blob — so this doesn't need updating
-- if a column is added/removed later, same as before.
--
-- official_ids entries are either the old flat-array-of-person-id shape
-- (pre migrations/004) or the current { official_id, term_id } shape;
-- jsonb_typeof() picks which one it's looking at per-element, same
-- fallback-to-null-term_id behavior the old toLinkRows() JS helper had.
--
-- Because this all runs inside one function body, a failure re-linking
-- officials (e.g. a bad id) rolls back the row insert too and returns an
-- error to the caller — the archive row is only deleted at the very end,
-- once every prior statement has already succeeded.
CREATE OR REPLACE FUNCTION restore_archive(p_archive_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_archive archives;
  v_record jsonb;
  v_officials jsonb;
  v_official jsonb;
  v_official_id bigint;
  v_term_id bigint;
BEGIN
  SELECT * INTO v_archive FROM archives WHERE id = p_archive_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Archived record % not found', p_archive_id USING ERRCODE = 'P0002';
  END IF;

  v_officials := COALESCE(v_archive.data->'official_ids', '[]'::jsonb);
  v_record := v_archive.data - 'official_ids';

  IF v_archive.entity_type = 'ordinance' THEN
    INSERT INTO ordinances SELECT * FROM jsonb_populate_record(null::ordinances, v_record);

    FOR v_official IN SELECT * FROM jsonb_array_elements(v_officials) LOOP
      IF jsonb_typeof(v_official) = 'object' THEN
        v_official_id := (v_official->>'official_id')::bigint;
        v_term_id := (v_official->>'term_id')::bigint;
      ELSE
        v_official_id := (v_official #>> '{}')::bigint;
        v_term_id := NULL;
      END IF;
      INSERT INTO ordinance_officials (ordinance_id, official_id, term_id)
      VALUES (v_archive.original_id, v_official_id, v_term_id);
    END LOOP;

  ELSIF v_archive.entity_type = 'resolution' THEN
    INSERT INTO resolutions SELECT * FROM jsonb_populate_record(null::resolutions, v_record);

    FOR v_official IN SELECT * FROM jsonb_array_elements(v_officials) LOOP
      IF jsonb_typeof(v_official) = 'object' THEN
        v_official_id := (v_official->>'official_id')::bigint;
        v_term_id := (v_official->>'term_id')::bigint;
      ELSE
        v_official_id := (v_official #>> '{}')::bigint;
        v_term_id := NULL;
      END IF;
      INSERT INTO resolution_officials (resolution_id, official_id, term_id)
      VALUES (v_archive.original_id, v_official_id, v_term_id);
    END LOOP;

  ELSIF v_archive.entity_type = 'session_minutes' THEN
    INSERT INTO session_minutes SELECT * FROM jsonb_populate_record(null::session_minutes, v_record);

  ELSE
    RAISE EXCEPTION 'Unknown archived entity type: %', v_archive.entity_type;
  END IF;

  DELETE FROM archives WHERE id = p_archive_id;

  RETURN jsonb_build_object('entity_type', v_archive.entity_type, 'record', v_record);
END;
$$;

-- Same defensive grants as the councils table in 001 — objects created via
-- the SQL Editor don't always inherit what the Table Editor UI would apply.
GRANT ALL ON archives TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE archives_id_seq TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION archive_ordinance(bigint, bigint) TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION archive_resolution(bigint, bigint) TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION archive_session_minutes(bigint, bigint) TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION restore_archive(bigint) TO postgres, anon, authenticated, service_role;

COMMIT;
