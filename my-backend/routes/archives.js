const express = require('express')
const router = express.Router()

const supabase = require('../config/supabase')
const { verifyToken, adminOnly } = require('../middleware/auth')
const { deleteFromStorage } = require('../helpers/storage')
const { logActivity } = require('../helpers/logger')

const CONTENT_TABLES = {
  ordinance: 'ordinances',
  resolution: 'resolutions',
  session_minutes: 'session_minutes',
}

const titleOf = (entityType, data) => {
  if (entityType === 'ordinance') return data.ordinance_number || data.title
  if (entityType === 'resolution') return data.resolution_number || data.title
  if (entityType === 'session_minutes') return data.session_number || data.session_date
  return data.title || null
}

// ─── GET /api/archives?module=all|ordinance|resolution|session_minutes|user|official ──
router.get('/', verifyToken, adminOnly, async (req, res) => {
  const module = req.query.module || 'all'
  try {
    const rows = []

    if (module === 'all' || CONTENT_TABLES[module]) {
      let query = supabase.from('archives').select('*').order('archived_at', { ascending: false })
      if (module !== 'all') query = query.eq('entity_type', module)
      const { data, error } = await query
      if (error) return res.status(500).json({ error: error.message })
      data.forEach(row => rows.push({
        id: row.id,
        source: 'content',
        entity_type: row.entity_type,
        original_id: row.original_id,
        title: titleOf(row.entity_type, row.data),
        archived_at: row.archived_at,
        archived_by: row.archived_by,
        data: row.data,
      }))
    }

    if (module === 'all' || module === 'user') {
      const { data, error } = await supabase
        .from('users').select('id, name, username, email, role, is_archived, archived_at, archived_by')
        .eq('is_archived', true)
      if (error) return res.status(500).json({ error: error.message })
      data.forEach(u => rows.push({
        id: u.id,
        source: 'user',
        entity_type: 'user',
        original_id: u.id,
        title: u.name,
        archived_at: u.archived_at,
        archived_by: u.archived_by,
        data: u,
      }))
    }

    if (module === 'all' || module === 'official') {
      const { data, error } = await supabase
        .from('sb_council_members').select('id, full_name, position, photo, is_archived, archived_at, archived_by')
        .eq('is_archived', true)
      if (error) return res.status(500).json({ error: error.message })
      data.forEach(o => rows.push({
        id: o.id,
        source: 'official',
        entity_type: 'official',
        original_id: o.id,
        title: o.full_name,
        archived_at: o.archived_at,
        archived_by: o.archived_by,
        data: o,
      }))
    }

    const archiverIds = [...new Set(rows.map(r => r.archived_by).filter(Boolean))]
    if (archiverIds.length > 0) {
      const { data: archivers } = await supabase.from('users').select('id, name').in('id', archiverIds)
      const nameById = new Map((archivers || []).map(u => [u.id, u.name]))
      rows.forEach(r => { r.archived_by_name = nameById.get(r.archived_by) || null })
    }

    rows.sort((a, b) => new Date(b.archived_at) - new Date(a.archived_at))
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PUT /api/archives/:id/restore ─────────────────────────────────────────────
// Restores a content row (ordinance/resolution/session_minutes) from its snapshot.
router.put('/:id/restore', verifyToken, adminOnly, async (req, res) => {
  try {
    const { data: archived, error: fetchErr } = await supabase
      .from('archives').select('*').eq('id', req.params.id).single()
    if (fetchErr || !archived) return res.status(404).json({ error: 'Archived record not found.' })

    const table = CONTENT_TABLES[archived.entity_type]
    if (!table) return res.status(400).json({ error: 'Unknown archived entity type.' })

    const { official_ids, ...record } = archived.data

    const { error: restoreErr } = await supabase.from(table).insert(record)
    if (restoreErr) return res.status(500).json({ error: restoreErr.message })

    if (archived.entity_type === 'ordinance' && official_ids?.length > 0) {
      await supabase.from('ordinance_officials').insert(
        official_ids.map(oid => ({ ordinance_id: archived.original_id, official_id: oid }))
      )
    }
    if (archived.entity_type === 'resolution' && official_ids?.length > 0) {
      await supabase.from('resolution_officials').insert(
        official_ids.map(oid => ({ resolution_id: archived.original_id, official_id: oid }))
      )
    }

    await supabase.from('archives').delete().eq('id', req.params.id)

    await logActivity(req, 'RESTORE', 'Archives', `Restored ${archived.entity_type}: ${titleOf(archived.entity_type, record)}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── DELETE /api/archives/:id ──────────────────────────────────────────────────
// Permanently deletes an archived content row (and its stored file, if any).
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
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
