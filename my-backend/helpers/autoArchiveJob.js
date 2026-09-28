const cron = require('node-cron')
const supabase = require('../config/supabase')
const { logActivity } = require('./logger')

// Session minutes and order of business are archived automatically once their
// session date is more than 3 years old. They go through the same archive
// functions as the Archive button (archive_session_minutes in migrations/007,
// archive_session_agenda in 030), so they land in Archives and can be
// restored from there like anything archived by hand. Nothing is ever deleted
// permanently by this job.
//
// Only finished session minutes are moved (status 'published') — a record
// still in review stays where it is, whatever its date. Order of business has
// no review workflow, so every one past the cutoff is moved.

const RETENTION_YEARS = 3

const TYPES = [
  { table: 'session_minutes', rpc: 'archive_session_minutes', label: 'session minutes', module: 'Sessions', publishedOnly: true },
  { table: 'session_agendas', rpc: 'archive_session_agenda', label: 'order of business', module: 'Session Agendas', publishedOnly: false },
]

// Activity-log entries for this job show "System" as the user.
const systemReq = { headers: {}, socket: {}, user: null }
const systemLog = (action, module, description, status = 'success') =>
  logActivity(systemReq, action, module, description, status, { userName: 'System', userRole: 'system' })

// Today's date minus RETENTION_YEARS, as YYYY-MM-DD in Philippine time —
// a session held on 2023-09-28 is archived from 2026-09-29 onward.
function cutoffDate(now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(now) // YYYY-MM-DD
  const [y, m, d] = today.split('-').map(Number)
  const cutoff = new Date(Date.UTC(y - RETENTION_YEARS, m - 1, d))
  // Feb 29 in a non-leap year rolls to Mar 1 — close enough for a retention rule.
  return cutoff.toISOString().slice(0, 10)
}

async function autoArchiveOldSessions() {
  const cutoff = cutoffDate()
  for (const t of TYPES) {
    let query = supabase
      .from(t.table).select('id, session_number, session_date')
      .lt('session_date', cutoff)
      .order('session_date', { ascending: true })
    if (t.publishedOnly) query = query.eq('status', 'published')
    const { data: rows, error } = await query
    if (error) {
      console.error(`Auto-archive lookup failed for ${t.table}:`, error.message)
      continue
    }

    for (const row of rows || []) {
      const name = row.session_number || row.session_date
      // One at a time: a failure on one record is logged and skipped, and the
      // rest still get archived. p_archived_by is null — archived by the system.
      const { error: rpcErr } = await supabase.rpc(t.rpc, { p_id: row.id, p_archived_by: null })
      if (rpcErr) {
        console.error(`Auto-archive failed for ${t.table} #${row.id}:`, rpcErr.message)
        await systemLog('ARCHIVE', t.module, `Auto-archive failed for ${t.label}: ${name} — ${rpcErr.message}`, 'failed')
        continue
      }
      await systemLog('ARCHIVE', t.module, `Auto-archived ${t.label} older than ${RETENTION_YEARS} years: ${name} (session date ${row.session_date})`)
    }
  }
}

// Every day at 1:00 AM server time…
cron.schedule('0 1 * * *', () => {
  autoArchiveOldSessions().catch((err) => console.error('Auto-archive job failed:', err.message))
})
// …and once shortly after the server starts, so records that passed the
// cutoff while the server was off don't wait until the next night.
setTimeout(() => {
  autoArchiveOldSessions().catch((err) => console.error('Auto-archive job failed:', err.message))
}, 30 * 1000)

module.exports = { autoArchiveOldSessions, cutoffDate, RETENTION_YEARS }
