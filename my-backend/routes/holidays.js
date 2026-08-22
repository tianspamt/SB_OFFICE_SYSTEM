const express = require('express')
const router = express.Router()

const { verifyToken } = require('../middleware/auth')

// In-memory cache — PH public holidays for a given year are identical for
// every user and essentially never change once published, so there's no
// reason for every browser to hit the upstream API independently on every
// session. One fetch per year per server process is enough.
const cache = new Map() // year -> { data, fetchedAt }
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24h — cheap insurance in case
                                          // the upstream source corrects a
                                          // holiday after publishing it

// GET /api/holidays/:year
router.get('/:year', verifyToken, async (req, res) => {
  const { year } = req.params
  if (!/^\d{4}$/.test(year)) return res.status(400).json({ error: 'Invalid year.' })

  const cached = cache.get(year)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    // Same data for every user and barely ever changes — safe for the
    // browser to skip re-requesting this for a full day. Only set on
    // success paths; the 502 below must stay uncached.
    res.set('Cache-Control', 'public, max-age=86400')
    return res.json(cached.data)
  }

  try {
    const upstream = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/PH`)
    if (!upstream.ok) throw new Error(`Upstream returned ${upstream.status}`)
    const data = await upstream.json()
    cache.set(year, { data, fetchedAt: Date.now() })
    res.set('Cache-Control', 'public, max-age=86400')
    res.json(data)
  } catch (err) {
    // Upstream is slow/down — serve stale cache rather than fail outright;
    // holidays barely change, so day-old (or older) data is still correct.
    if (cached) {
      res.set('Cache-Control', 'public, max-age=86400')
      return res.json(cached.data)
    }
    console.error('PH holidays fetch error:', err.message)
    res.status(502).json({ error: 'Could not load holidays right now. Please try again later.' })
  }
})

module.exports = router
