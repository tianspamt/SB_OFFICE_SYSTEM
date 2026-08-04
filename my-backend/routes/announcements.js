const express = require('express')
const router = express.Router()

const supabase = require('../config/supabase')
const { verifyToken, adminOnly } = require('../middleware/auth')
const { logActivity } = require('../helpers/logger')

const AUTHOR_SELECT = '*, author:users!created_by(name, photo, position, role), announcement_reactions(emoji, user_id)'

// GET /api/announcements
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('announcements').select(AUTHOR_SELECT).order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/announcements/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('announcements').select(AUTHOR_SELECT).eq('id', req.params.id).single()
    if (error) return res.status(500).json({ error: error.message })
    if (!data) return res.status(404).json({ error: 'Announcement not found.' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/announcements
router.post('/', verifyToken, adminOnly, async (req, res) => {
  try {
    const { title, body, priority, expires_at } = req.body
    if (!title || !body)
      return res.status(400).json({ error: 'Title and body are required.' })
    const { data, error } = await supabase
      .from('announcements')
      .insert({ title, body, priority: priority || 'normal', expires_at: expires_at || null, created_by: req.user.id })
      .select(AUTHOR_SELECT).single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'CREATE', 'Announcements', `Posted announcement: ${title}`)
    res.json({ success: true, id: data.id, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/announcements/:id
router.put('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('announcements').select('id').eq('id', req.params.id).single()
    if (!existing) return res.status(404).json({ error: 'Announcement not found.' })
    const { title, body, priority, expires_at } = req.body
    if (!title || !body)
      return res.status(400).json({ error: 'Title and body are required.' })
    const { data, error } = await supabase
      .from('announcements')
      .update({ title, body, priority: priority || 'normal', expires_at: expires_at || null })
      .eq('id', req.params.id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'UPDATE', 'Announcements', `Updated announcement: ${title}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/announcements/:id
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('announcements').select('title').eq('id', req.params.id).single()
    if (!existing) return res.status(404).json({ error: 'Announcement not found.' })
    const { error } = await supabase
      .from('announcements').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'DELETE', 'Announcements', `Deleted announcement: ${existing.title}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── POST /api/announcements/:id/reactions   { emoji } ────────────────────────
// Toggles the current user's reaction: inserts if absent, removes if already
// present. A user can hold multiple different emoji reactions on the same
// announcement at once (each toggled independently), matching the feed UI.
router.post('/:id/reactions', verifyToken, async (req, res) => {
  const { id } = req.params
  const { emoji } = req.body
  if (!emoji) return res.status(400).json({ error: 'emoji is required.' })
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('announcement_reactions')
      .select('id')
      .eq('announcement_id', id)
      .eq('user_id', req.user.id)
      .eq('emoji', emoji)
      .maybeSingle()
    if (fetchErr) return res.status(500).json({ error: fetchErr.message })

    if (existing) {
      const { error } = await supabase.from('announcement_reactions').delete().eq('id', existing.id)
      if (error) return res.status(500).json({ error: error.message })
      return res.json({ success: true, reacted: false })
    }

    const { error } = await supabase
      .from('announcement_reactions')
      .insert({ announcement_id: id, user_id: req.user.id, emoji })
    if (error) return res.status(500).json({ error: error.message })
    res.json({ success: true, reacted: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
