const express = require('express')
const router = express.Router()

const supabase = require('../config/supabase')
const { verifyToken, adminOnly } = require('../middleware/auth')

// GET /api/activity-logs
router.get('/', verifyToken, adminOnly, async (req, res) => {
  const { module, action, limit = 100, page = 1 } = req.query
  const limitNum = Math.min(parseInt(limit) || 100, 500)
  const pageNum  = Math.max(parseInt(page) || 1, 1)
  let query = supabase
    .from('activity_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .range((pageNum - 1) * limitNum, pageNum * limitNum - 1)
  if (module && module !== 'all') query = query.eq('module', module)
  if (action && action !== 'all') query = query.eq('action', action)
  const { data, error } = await query
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// GET /api/activity-logs/stats
router.get('/stats', verifyToken, adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from('activity_logs').select('action, module, status')
  if (error) return res.status(500).json({ error: error.message })
  res.json({
    total:   data.length,
    logins:  data.filter(l => l.action === 'LOGIN').length,
    uploads: data.filter(l => l.action === 'UPLOAD').length,
    deletes: data.filter(l => l.action === 'DELETE').length,
    creates: data.filter(l => l.action === 'CREATE').length,
    failed:  data.filter(l => l.status === 'failed').length,
  })
})

module.exports = router
