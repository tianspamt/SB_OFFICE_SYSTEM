const express = require('express')
const router = express.Router()

const supabase = require('../config/supabase')
const { verifyToken, adminOnly } = require('../middleware/auth')
const { logActivity } = require('../helpers/logger')

const AUTHOR_SELECT = '*, author:users!created_by(name)'

// ─── GET /api/schedules ─────────────────────────────────────────────────────────
// Public, for the separate public-facing website — published only, enforced
// unconditionally. Ordered by event_date ascending (soonest first), unlike
// content-posts/trivia which are newest-first — a schedule is meant to be
// read chronologically, not as a feed.
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sb_schedules').select(AUTHOR_SELECT)
      .eq('published', true)
      .order('event_date', { ascending: true })
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/schedules/all ─────────────────────────────────────────────────────
// Internal admin view — sees drafts too. Must be registered before any
// GET /:id (there isn't one here, but kept for the same reason it mattered
// in announcements/content-posts/trivia).
router.get('/all', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('sb_schedules').select(AUTHOR_SELECT)
      .order('event_date', { ascending: true })
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/schedules
router.post('/', verifyToken, adminOnly, async (req, res) => {
  try {
    const { title, description, location, event_date, event_time, published } = req.body
    if (!title || !event_date)
      return res.status(400).json({ error: 'Title and event date are required.' })
    const { data, error } = await supabase
      .from('sb_schedules')
      .insert({
        title, description: description || null, location: location || null,
        event_date, event_time: event_time || null,
        published: published === undefined ? true : !!published,
        created_by: req.user.id,
      })
      .select(AUTHOR_SELECT).single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'CREATE', 'Content Management', `Added schedule: ${title}`)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/schedules/:id
router.put('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('sb_schedules').select('id').eq('id', req.params.id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Schedule not found.' })

    const { title, description, location, event_date, event_time, published } = req.body
    if (!title || !event_date)
      return res.status(400).json({ error: 'Title and event date are required.' })

    const { data, error } = await supabase
      .from('sb_schedules')
      .update({
        title, description: description || null, location: location || null,
        event_date, event_time: event_time || null,
        published: published === undefined ? true : !!published,
      })
      .eq('id', req.params.id).select(AUTHOR_SELECT).single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'UPDATE', 'Content Management', `Updated schedule: ${title}`)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/schedules/:id
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('sb_schedules').select('title').eq('id', req.params.id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Schedule not found.' })

    const { error } = await supabase.from('sb_schedules').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'DELETE', 'Content Management', `Deleted schedule: ${existing.title}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
