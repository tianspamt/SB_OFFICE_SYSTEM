-- 030_archive_order_of_business.sql
--
-- Order of business (`session_agendas`) used to be a plain hard delete — see
-- 018's note on why it skipped the `archives` table. It's now archived like
-- ordinances, resolutions and session minutes: the row is snapshotted into
-- `archives` and removed from the live table, and the Secretary can restore it
-- (or delete it for good) from the Archives page. Its stored file is kept while
-- it sits in the archive, so a restore brings the file back too.
--
-- Three things change:
--   1. archive_session_agenda(): snapshot-then-delete, same shape as
--      archive_session_minutes() in 007.
--   2. restore_archive() learns the 'session_agenda' type. This is 007's
--      function verbatim plus one new branch — nothing else about restoring
--      ordinances / resolutions / session minutes changes.
--   3. get_archives() shows a title for the new type (its session number).
--      This is 009's function verbatim plus one new WHEN. Same argument list,
--      so CREATE OR REPLACE replaces it (no second overload — see 010).

BEGIN;

CREATE OR REPLACE FUNCTION archive_session_agenda(p_id bigint, p_archived_by bigint)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_row session_agendas;
  v_snapshot jsonb;
BEGIN
  SELECT * INTO v_row FROM session_agendas WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order of business % not found', p_id USING ERRCODE = 'P0002';
  END IF;

  v_snapshot := to_jsonb(v_row);

  INSERT INTO archives (original_id, entity_type, data, archived_by)
  VALUES (p_id, 'session_agenda', v_snapshot, p_archived_by);

  DELETE FROM session_agendas WHERE id = p_id;

  RETURN v_snapshot;
END;
$$;

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

  ELSIF v_archive.entity_type = 'session_agenda' THEN
    INSERT INTO session_agendas SELECT * FROM jsonb_populate_record(null::session_agendas, v_record);

  ELSE
    RAISE EXCEPTION 'Unknown archived entity type: %', v_archive.entity_type;
  END IF;

  DELETE FROM archives WHERE id = p_archive_id;

  RETURN jsonb_build_object('entity_type', v_archive.entity_type, 'record', v_record);
END;
$$;

CREATE OR REPLACE FUNCTION get_archives(
  p_module text DEFAULT 'all',
  p_search text DEFAULT NULL,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0,
  p_sort text DEFAULT 'desc'
)
RETURNS TABLE (
  id bigint,
  source text,
  entity_type text,
  original_id bigint,
  title text,
  archived_at timestamptz,
  archived_by bigint,
  archived_by_name text,
  data jsonb,
  total_count bigint
)
LANGUAGE sql
STABLE
AS $$
  WITH combined AS (
    SELECT
      a.id,
      'content'::text AS source,
      a.entity_type,
      a.original_id,
      CASE a.entity_type
        WHEN 'ordinance' THEN COALESCE(a.data->>'ordinance_number', a.data->>'title')
        WHEN 'resolution' THEN COALESCE(a.data->>'resolution_number', a.data->>'title')
        WHEN 'session_minutes' THEN COALESCE(a.data->>'session_number', a.data->>'session_date')
        WHEN 'session_agenda' THEN COALESCE(a.data->>'session_number', a.data->>'session_date')
        ELSE a.data->>'title'
      END AS title,
      a.archived_at,
      a.archived_by,
      a.data
    FROM archives a
    WHERE p_module = 'all' OR a.entity_type = p_module

    UNION ALL

    SELECT
      u.id,
      'user'::text,
      'user'::text,
      u.id,
      u.name,
      u.archived_at,
      u.archived_by,
      jsonb_build_object(
        'id', u.id, 'name', u.name, 'username', u.username, 'email', u.email,
        'role', u.role, 'is_archived', u.is_archived,
        'archived_at', u.archived_at, 'archived_by', u.archived_by
      )
    FROM users u
    WHERE u.is_archived = true AND (p_module = 'all' OR p_module = 'user')

    UNION ALL

    SELECT
      m.id,
      'official'::text,
      'official'::text,
      m.id,
      m.full_name,
      m.archived_at,
      m.archived_by,
      jsonb_build_object(
        'id', m.id, 'full_name', m.full_name, 'photo', m.photo,
        'is_archived', m.is_archived, 'archived_at', m.archived_at, 'archived_by', m.archived_by,
        'position', (
          SELECT t.position FROM sb_council_member_terms t
          WHERE t.council_member_id = m.id
          ORDER BY (t.status = 'active') DESC, t.term_start DESC
          LIMIT 1
        )
      )
    FROM sb_council_members m
    WHERE m.is_archived = true AND (p_module = 'all' OR p_module = 'official')
  ),
  filtered AS (
    SELECT c.*, ab.name AS archived_by_name
    FROM combined c
    LEFT JOIN users ab ON ab.id = c.archived_by
    WHERE p_search IS NULL OR btrim(p_search) = '' OR c.title ILIKE '%' || p_search || '%'
  )
  SELECT
    f.id, f.source, f.entity_type, f.original_id, f.title, f.archived_at,
    f.archived_by, f.archived_by_name, f.data,
    count(*) OVER() AS total_count
  FROM filtered f
  ORDER BY
    CASE WHEN lower(p_sort) = 'asc' THEN f.archived_at END ASC,
    CASE WHEN lower(p_sort) <> 'asc' THEN f.archived_at END DESC
  LIMIT p_limit OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION archive_session_agenda(bigint, bigint) TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION restore_archive(bigint) TO postgres, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_archives(text, text, int, int, text) TO postgres, anon, authenticated, service_role;

COMMIT;
