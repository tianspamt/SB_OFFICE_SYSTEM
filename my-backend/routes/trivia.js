const express = require('express')
const router = express.Router()

const supabase = require('../config/supabase')
const { verifyToken, adminOnly } = require('../middleware/auth')
const { logActivity } = require('../helpers/logger')

// ─── GET /api/trivia ────────────────────────────────────────────────────────────
// Public, for the separate public-facing website — active facts only,
// enforced unconditionally (same "safe by default" approach as
// content-posts/public, not caller-optional like ordinances' GET /).
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('legislative_trivia').select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/trivia/all ────────────────────────────────────────────────────────
// Internal admin view — sees inactive facts too, so they can be reactivated.
// Must be registered before any GET /:id (there isn't one here, but kept for
// the same reason it mattered in announcements/content-posts).
router.get('/all', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('legislative_trivia').select('*')
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/trivia
router.post('/', verifyToken, adminOnly, async (req, res) => {
  try {
    const { fact_text, is_active } = req.body
    if (!fact_text?.trim())
      return res.status(400).json({ error: 'fact_text is required.' })
    const { data, error } = await supabase
      .from('legislative_trivia')
      .insert({ fact_text: fact_text.trim(), is_active: is_active === undefined ? true : !!is_active })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'CREATE', 'Content Management', 'Added a trivia fact')
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/trivia/:id
router.put('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('legislative_trivia').select('id').eq('id', req.params.id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Trivia fact not found.' })

    const { fact_text, is_active } = req.body
    if (!fact_text?.trim())
      return res.status(400).json({ error: 'fact_text is required.' })

    const { data, error } = await supabase
      .from('legislative_trivia')
      .update({ fact_text: fact_text.trim(), is_active: is_active === undefined ? true : !!is_active })
      .eq('id', req.params.id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'UPDATE', 'Content Management', 'Edited a trivia fact')
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/trivia/:id
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('legislative_trivia').select('id').eq('id', req.params.id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Trivia fact not found.' })

    const { error } = await supabase.from('legislative_trivia').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'DELETE', 'Content Management', 'Deleted a trivia fact')
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
