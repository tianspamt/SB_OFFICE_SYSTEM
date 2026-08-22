const express = require('express')
const router = express.Router()

const supabase = require('../config/supabase')
const { verifyToken, adminOnly } = require('../middleware/auth')
const { logActivity } = require('../helpers/logger')
const { normalizeTermLabel, autoUpdateCouncilStatuses } = require('../helpers/councils')

// GET /api/councils
router.get('/', async (req, res) => {
  try {
    await autoUpdateCouncilStatuses()
    const { data, error } = await supabase
      .from('councils')
      .select('*')
      .order('term_start', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/councils
// Explicit "Add Council" entry point — most councils actually get created
// implicitly the first time someone types a new term_period into Add/Edit
// Term (see helpers/councils.js resolveCouncilId), but this lets an admin
// stand up an empty council ahead of adding its first member.
router.post('/', verifyToken, adminOnly, async (req, res) => {
  const { term_label, term_start, term_end, status } = req.body
  const label = normalizeTermLabel(term_label)
  if (!label) return res.status(400).json({ error: 'Term label is required.' })
  if (status && !['upcoming', 'active', 'concluded'].includes(status))
    return res.status(400).json({ error: 'status must be upcoming, active, or concluded.' })
  try {
    const { data, error } = await supabase
      .from('councils')
      .insert({
        term_label: label,
        term_start: term_start || null,
        term_end: term_end || null,
        status: status || 'active',
      })
      .select().single()
    if (error) {
      if (error.code === '23505')
        return res.status(409).json({ error: 'A council with this term label already exists.' })
      return res.status(500).json({ error: error.message })
    }
    await logActivity(req, 'CREATE', 'Officials', `Added council: ${label}`)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
