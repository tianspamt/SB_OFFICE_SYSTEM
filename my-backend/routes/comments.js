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
      .select('*, author:users!author_id(name, photo, position, role)')
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
      .select('*, author:users!author_id(name, photo, position, role)')
      .single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'COMMENT', MODULE_LABELS[entity_type] || 'Comments', `Commented on ${entity_type} #${entity_id}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PUT /api/comments/:id   { text } ──────────────────────────────────────────
// Only the comment's own author may edit it.
router.put('/:id', verifyToken, async (req, res) => {
  const { text } = req.body
  if (!text?.trim())
    return res.status(400).json({ error: 'text is required.' })
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('comments').select('id, author_id').eq('id', req.params.id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Comment not found.' })
    if (existing.author_id !== req.user.id)
      return res.status(403).json({ error: 'You can only edit your own comments.' })

    const { data, error } = await supabase
      .from('comments')
      .update({ text: text.trim() })
      .eq('id', req.params.id)
      .select('*, author:users!author_id(name, photo, position, role)')
      .single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'UPDATE', MODULE_LABELS[data.entity_type] || 'Comments', `Edited a comment on ${data.entity_type} #${data.entity_id}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── DELETE /api/comments/:id ──────────────────────────────────────────────────
// Only the comment's own author may delete it.
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('comments').select('id, author_id, entity_type, entity_id').eq('id', req.params.id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Comment not found.' })
    if (existing.author_id !== req.user.id)
      return res.status(403).json({ error: 'You can only delete your own comments.' })

    const { error } = await supabase.from('comments').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'DELETE', MODULE_LABELS[existing.entity_type] || 'Comments', `Deleted a comment on ${existing.entity_type} #${existing.entity_id}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
