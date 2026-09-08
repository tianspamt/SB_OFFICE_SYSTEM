-- 018_create_session_agendas_table.sql
--
-- Adds the Session Agenda module: Secretary/Clerk upload the agenda for an
-- upcoming session (PDF or Word only — no OCR/image support, unlike
-- ordinances/resolutions/session_minutes, since an agenda is always a typed
-- document, never a scanned photo). Unlike the other three legislative
-- record types, this one has no review workflow (pending -> accept ->
-- vm-approve -> publish) and no archive-on-delete: an agenda is a
-- time-sensitive notice for a meeting that hasn't happened yet, not a
-- permanent legal record that must be retained, so a Secretary/Clerk upload
-- is immediately live and a delete is a plain hard delete (see
-- routes/sessionAgendas.js).

BEGIN;

CREATE TABLE IF NOT EXISTS session_agendas (
  id bigserial PRIMARY KEY,
  session_number text,
  session_date date NOT NULL,
  session_type text NOT NULL DEFAULT 'regular',
  venue text,
  filename text NOT NULL,
  filetype text NOT NULL,
  filepath text NOT NULL,
  created_by bigint REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_agendas_session_date ON session_agendas(session_date DESC);

-- Same defensive grants as every other table created via the SQL Editor
-- (see 001, 007) — it doesn't inherit what the Table Editor UI applies
-- automatically.
GRANT ALL ON session_agendas TO postgres, anon, authenticated, service_role;
GRANT USAGE, SELECT ON SEQUENCE session_agendas_id_seq TO postgres, anon, authenticated, service_role;

COMMIT;
