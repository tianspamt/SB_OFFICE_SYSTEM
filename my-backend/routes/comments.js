const express = require('express')
const router = express.Router()

const supabase = require('../config/supabase')
const { verifyToken } = require('../middleware/auth')
const { logActivity } = require('../helpers/logger')

const MODULE_LABELS = {
  ordinance: 'Ordinances',
  resolution: 'Resolutions',
  session_minutes: 'Sessions',
  announcement: 'Announcements',
}

// ─── GET /api/comments?entity_type=ordinance&entity_id=123 ────────────────────
router.get('/', verifyToken, async (req, res) => {
  const { entity_type, entity_id } = req.query
  if (!entity_type || !entity_id)
    return res.status(400).json({ error: 'entity_type and entity_id are required.' })
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*, author:users!author_id(name, photo)')
      .eq('entity_type', entity_type)
      .eq('entity_id', entity_id)
      .order('created_at', { ascending: true })
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── POST /api/comments   { entity_type, entity_id, text } ────────────────────
router.post('/', verifyToken, async (req, res) => {
  const { entity_type, entity_id, text } = req.body
  if (!entity_type || !entity_id || !text?.trim())
    return res.status(400).json({ error: 'entity_type, entity_id, and text are required.' })
  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        entity_type,
        entity_id,
        author_id: req.user.id,
        author_role: req.user.position || req.user.role,
        text: text.trim(),
      })
      .select('*, author:users!author_id(name, photo)')
      .single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'COMMENT', MODULE_LABELS[entity_type] || 'Comments', `Commented on ${entity_type} #${entity_id}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
