const cron = require('node-cron')
const supabase = require('../config/supabase')
const { deleteFromStorage } = require('./storage')
const { logActivity } = require('./logger')

// Archived session minutes and order of business are permanently deleted (the
// archive entry and its stored file) once they have been in Archives for more
// than 3 years. Records are no longer archived automatically — only the
// Archive button moves anything into Archives.
//
// The 3 years count from `archived_at`, the day the record entered Archives.
// Restoring a record removes its archive entry (restore_archive, latest
// version in migrations/030), and archiving it again creates a new entry
// dated that day — so the count starts over.
//
// Ordinances and resolutions are never deleted by this job: they are
// permanent legislative records, so removing them from Archives stays a
// manual, Secretary-only action (DELETE /api/archives/:id).

const RETENTION_YEARS = 3

const TYPES = [
  { entityType: 'session_minutes', label: 'session minutes' },
  { entityType: 'session_agenda', label: 'order of business' },
]

// Activity-log entries for this job show "System" as the user.
const systemReq = { headers: {}, socket: {}, user: null }
const systemLog = (action, module, description, status = 'success') =>
  logActivity(systemReq, action, module, description, status, { userName: 'System', userRole: 'system' })

// Anything archived before this moment has been in Archives over 3 years —
// archived 2023-10-07 09:00 is deleted from 2026-10-07 09:00 onward.
function cutoffTimestamp(now = new Date()) {
  const cutoff = new Date(now)
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - RETENTION_YEARS)
  return cutoff.toISOString()
}

async function purgeOldArchives() {
  const cutoff = cutoffTimestamp()
  for (const t of TYPES) {
    const { data: rows, error } = await supabase
      .from('archives').select('id, data, archived_at')
      .eq('entity_type', t.entityType)
      .lt('archived_at', cutoff)
      .order('archived_at', { ascending: true })
    if (error) {
      console.error(`Archive purge lookup failed for ${t.entityType}:`, error.message)
      continue
    }

    for (const row of rows || []) {
      const name = row.data?.session_number || row.data?.session_date || `#${row.id}`
      // One at a time: a failure on one record is logged and skipped, and the
      // rest still get deleted. The archived_at condition is repeated so a
      // record restored (and re-archived) since the lookup is left alone.
      const { data: deleted, error: delErr } = await supabase
        .from('archives').delete()
        .eq('id', row.id).lt('archived_at', cutoff)
        .select('id')
      if (delErr) {
        console.error(`Archive purge failed for archive #${row.id}:`, delErr.message)
        await systemLog('DELETE', 'Archives', `Auto-delete failed for archived ${t.label}: ${name} — ${delErr.message}`, 'failed')
        continue
      }
      if (!deleted?.length) continue
      // File after the row: if this fails, all that's left is an unused file,
      // never an archive entry pointing at a missing one.
      if (row.data?.filepath) await deleteFromStorage(row.data.filepath)
      await systemLog('DELETE', 'Archives',
        `Permanently deleted ${t.label} archived over ${RETENTION_YEARS} years ago: ${name} (archived ${row.archived_at.slice(0, 10)})`)
    }
  }
}

// Every day at 1:00 AM Philippine time (hosts like Render run on UTC)…
cron.schedule('0 1 * * *', () => {
  purgeOldArchives().catch((err) => console.error('Archive purge job failed:', err.message))
}, { timezone: 'Asia/Manila' })
// …and once shortly after the server starts, so records that passed the
// cutoff while the server was off don't wait until the next night.
setTimeout(() => {
  purgeOldArchives().catch((err) => console.error('Archive purge job failed:', err.message))
}, 30 * 1000)

module.exports = { purgeOldArchives, cutoffTimestamp, RETENTION_YEARS }
