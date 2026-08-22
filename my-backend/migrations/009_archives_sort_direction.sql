-- 009_archives_sort_direction.sql
--
-- Adds a sort-direction parameter to get_archives() (migrations/008) so the
-- Archives page's "Archived" column header can toggle asc/desc. Sorting has
-- to happen in the same function that does the pagination — flipping the
-- order client-side would only reorder whichever 20 rows happened to load
-- for the current page, not the true oldest/newest across the whole
-- filtered set.
--
-- p_sort is added as a new trailing parameter with a default, which Postgres
-- allows for CREATE OR REPLACE FUNCTION without changing the function's
-- identity — existing callers that don't pass it keep working unchanged.

BEGIN;

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
  -- p_sort is a single scalar, not per-row, so for any given call exactly
  -- one of these two CASE expressions is non-null for every row — the other
  -- is NULL for the whole result set and so never affects the ordering.
  ORDER BY
    CASE WHEN lower(p_sort) = 'asc' THEN f.archived_at END ASC,
    CASE WHEN lower(p_sort) <> 'asc' THEN f.archived_at END DESC
  LIMIT p_limit OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION get_archives(text, text, int, int, text) TO postgres, anon, authenticated, service_role;

COMMIT;
