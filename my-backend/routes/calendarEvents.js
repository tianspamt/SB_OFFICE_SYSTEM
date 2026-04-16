const express = require('express')
const router = express.Router()

const supabase = require('../config/supabase')
const { verifyToken, adminOnly } = require('../middleware/auth')
const { logActivity } = require('../helpers/logger')

// GET /api/calendar-events
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('calendar_events').select('*').order('start_date', { ascending: true })
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/calendar-events/:id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('calendar_events').select('*').eq('id', req.params.id).single()
    if (error) return res.status(500).json({ error: error.message })
    if (!data) return res.status(404).json({ error: 'Event not found.' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/calendar-events
router.post('/', verifyToken, adminOnly, async (req, res) => {
  try {
    const { title, description, location, start_date, start_time, end_date, end_time, all_day, color } = req.body
    if (!title || !start_date)
      return res.status(400).json({ error: 'Title and start date are required.' })
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        title,
        description: description || null,
        location: location || null,
        start_date,
        start_time: start_time || null,
        end_date: end_date || start_date,
        end_time: end_time || null,
        all_day: all_day || false,
        color: color || '#009439'
      })
      .select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'CREATE', 'Calendar', `Added event: ${title}`)
    res.json({ success: true, id: data.id, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/calendar-events/:id
router.put('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('calendar_events').select('id').eq('id', req.params.id).single()
    if (!existing) return res.status(404).json({ error: 'Event not found.' })
    const { title, description, location, start_date, start_time, end_date, end_time, all_day, color } = req.body
    if (!title || !start_date)
      return res.status(400).json({ error: 'Title and start date are required.' })
    const { data, error } = await supabase
      .from('calendar_events')
      .update({
        title,
        description: description || null,
        location: location || null,
        start_date,
        start_time: start_time || null,
        end_date: end_date || start_date,
        end_time: end_time || null,
        all_day: all_day || false,
        color: color || '#009439'
      })
      .eq('id', req.params.id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'UPDATE', 'Calendar', `Updated event: ${title}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/calendar-events/:id
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('calendar_events').select('id, title').eq('id', req.params.id).single()
    if (!existing) return res.status(404).json({ error: 'Event not found.' })
    const { error } = await supabase
      .from('calendar_events').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'DELETE', 'Calendar', `Deleted event: ${existing.title}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
