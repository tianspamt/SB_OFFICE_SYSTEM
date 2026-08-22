const express = require('express')
const router = express.Router()

const supabase = require('../config/supabase')
const { verifyToken, adminOnly, secretaryOnly } = require('../middleware/auth')
const { deleteFromStorage } = require('../helpers/storage')
const { logActivity } = require('../helpers/logger')

// ─── Retention policy ───────────────────────────────────────────────────────
// Archived records (ordinances, resolutions, session minutes, users,
// officials) are kept indefinitely — there is no background job that
// auto-purges old entries. This is a deliberate choice, not an oversight:
// ordinances/resolutions/session minutes are official legislative records,
// and archived users/officials are kept (rather than hard-deleted) so
// existing foreign keys — activity_logs.user_id, an ordinance's authorship
// links — keep resolving. Silently age-based-deleting any of that could
// destroy records the office is legally obligated to retain, and this route
// has no visibility into what retention period, if any, actually applies.
// Permanent deletion stays a manual, secretary-gated, per-record action
// (DELETE /:id below). If the office later adopts an explicit retention
// schedule, implement it as its own logged, admin-triggered batch endpoint —
// never as silent automatic deletion.

const titleOf = (entityType, data) => {
  if (entityType === 'ordinance') return data.ordinance_number || data.title
  if (entityType === 'resolution') return data.resolution_number || data.title
  if (entityType === 'session_minutes') return data.session_number || data.session_date
  return data.title || null
}

// ─── GET /api/archives?module=&search=&page=&limit=&sort= ──────────────────────
// secretaryOnly matches the frontend gate (canViewArchives = isSecretary) —
// restore/permanent-delete are destructive/state-changing enough that the
// UI hiding the tab from other admin positions isn't enough on its own.
//
// The union/filter/sort/pagination across the three archive sources happens
// in get_archives() (migrations/008, sort added in 009) since it isn't
// expressible as a single Supabase JS query. total_count comes back on every
// row (a window function's value is identical across the whole result set)
// so the frontend can render page controls without a second request.
router.get('/', verifyToken, adminOnly, secretaryOnly, async (req, res) => {
  const module = req.query.module || 'all'
  const search = req.query.search ? String(req.query.search).trim() : null
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100)
  const page = Math.max(parseInt(req.query.page) || 1, 1)
  const offset = (page - 1) * limit
  const sort = req.query.sort === 'asc' ? 'asc' : 'desc'

  try {
    const { data, error } = await supabase.rpc('get_archives', {
      p_module: module,
      p_search: search,
      p_limit: limit,
      p_offset: offset,
      p_sort: sort,
    })
    if (error) return res.status(500).json({ error: error.message })

    const total = data.length > 0 ? Number(data[0].total_count) : 0
    const rows = data.map(({ total_count, ...row }) => row)

    res.json({ rows, total, page, limit, totalPages: Math.max(Math.ceil(total / limit), 1) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PUT /api/archives/:id/restore ─────────────────────────────────────────────
// Restores a content row (ordinance/resolution/session_minutes) from its
// snapshot. The insert + officials re-link + archive-row delete all happen
// inside restore_archive() as one Postgres transaction (see migrations/007)
// so a failure partway through rolls back instead of silently dropping the
// officials links while still reporting success.
router.put('/:id/restore', verifyToken, adminOnly, secretaryOnly, async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('restore_archive', { p_archive_id: req.params.id })
    if (error) {
      if (error.code === 'P0002') return res.status(404).json({ error: 'Archived record not found.' })
      return res.status(500).json({ error: error.message })
    }

    await logActivity(req, 'RESTORE', 'Archives', `Restored ${data.entity_type}: ${titleOf(data.entity_type, data.record)}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── DELETE /api/archives/:id ──────────────────────────────────────────────────
// Permanently deletes an archived content row (and its stored file, if any).
router.delete('/:id', verifyToken, adminOnly, secretaryOnly, async (req, res) => {
  try {
    const { data: archived, error: fetchErr } = await supabase
      .from('archives').select('*').eq('id', req.params.id).single()
    if (fetchErr || !archived) return res.status(404).json({ error: 'Archived record not found.' })

    if (archived.data?.filepath) await deleteFromStorage(archived.data.filepath)

    const { error } = await supabase.from('archives').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })

    await logActivity(req, 'DELETE', 'Archives', `Permanently deleted ${archived.entity_type}: ${titleOf(archived.entity_type, archived.data)}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
