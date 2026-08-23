const express = require('express')
const router = express.Router()

const supabase = require('../config/supabase')
const { verifyToken, adminOnly } = require('../middleware/auth')
const { logActivity } = require('../helpers/logger')
const { sendEmail } = require('../helpers/email')
const { emailShell, BRAND_GREEN_DARK } = require('../helpers/notify')
const { escapeHtml } = require('../helpers/utils')

const AUTHOR_SELECT = '*, author:users!created_by(name, photo, position, role), announcement_reactions(emoji, user_id), announcement_reads(user_id, reader:users!user_id(name))'

// priority is a 2-state field now (normal/urgent) — anything else collapses
// to "normal" rather than being rejected, so stray/legacy values never 400.
const normalizePriority = (p) => (p === 'urgent' ? 'urgent' : 'normal')

// Caps pin-inflation — past this, "pinned" stops meaning anything.
const PIN_LIMIT = 3

// Throws when pinning would exceed the cap — catch it and use err.message
// as the client-facing error text.
const assertPinAllowed = async () => {
  const { count, error } = await supabase
    .from('announcements')
    .select('id', { count: 'exact', head: true })
    .eq('pinned', true)
  if (error) throw new Error(error.message)
  if ((count || 0) >= PIN_LIMIT)
    throw new Error(`Only ${PIN_LIMIT} announcements can be pinned at once. Unpin one first.`)
}

// Emails every other active user about a new announcement — urgent or not,
// unlike the old urgent-only version. Respects each recipient's
// email_notifications opt-out, same as every other trigger in the app (the
// old version BCC'd every active user regardless, which was an inconsistency
// rather than a deliberate "urgent bypasses opt-out" design). Urgent posts
// get a bold dark-green "URGENT" pill above the title instead of the old red
// badge — kept off red so it stays on-brand with the rest of the system's
// green, but still visually distinct from a normal announcement. Fire-and-
// forget from the route handlers below — a slow/failed email should never
// block or fail the announcement itself.
const notifyAnnouncement = async (announcement) => {
  try {
    const { data: recipients, error } = await supabase
      .from('users')
      .select('email')
      .eq('is_archived', false)
      .eq('email_notifications', true)
      .neq('id', announcement.created_by ?? -1)
    if (error) throw new Error(error.message)
    const emails = (recipients || []).map((r) => r.email).filter(Boolean)
    if (!emails.length) return

    const isUrgent = announcement.priority === 'urgent'
    const bodyHtml = `
      ${isUrgent ? `
        <div style="text-align:center;margin-bottom:16px;">
          <span style="display:inline-block;background:${BRAND_GREEN_DARK};color:#fff;font-weight:bold;font-size:11px;letter-spacing:1px;padding:5px 14px;border-radius:20px;">URGENT ANNOUNCEMENT</span>
        </div>
      ` : ''}
      <span style="white-space:pre-wrap;">${escapeHtml(announcement.body)}</span>
    `
    await sendEmail({
      to: [{ email: process.env.BREVO_SENDER_EMAIL, name: 'Sangguniang Bayan Balilihan' }],
      bcc: emails.map((email) => ({ email })),
      subject: isUrgent ? `URGENT: ${announcement.title}` : `New Announcement: ${announcement.title}`,
      htmlContent: emailShell({
        icon: isUrgent ? '⚠️' : '📰',
        heading: announcement.title,
        bodyHtml,
      }),
    })
  } catch (err) {
    console.error('Announcement email error:', err.message)
  }
}

// GET /api/announcements
// Auth-gated: the response now embeds per-reader names (announcement_reads),
// so this can no longer be a public/unauthenticated endpoint — that would
// leak who-read-what to anyone on the internet.
router.get('/', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('announcements').select(AUTHOR_SELECT)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/announcements/active-staff-count ─────────────────────────────────
// Total active users — the denominator for "N/M seen" on each post. A plain
// user-role account can't call GET /api/users (adminOnly), so this exists as
// a narrow, non-privileged way to get just the headcount.
// Must be registered before GET /:id.
router.get('/active-staff-count', verifyToken, async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('users').select('id', { count: 'exact', head: true }).eq('is_archived', false)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ count: count || 0 })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/announcements/unread-count ───────────────────────────────────────
// Must be registered before GET /:id — otherwise Express would match this
// path as an :id lookup instead.
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const { data: allRows, error: allErr } = await supabase.from('announcements').select('id')
    if (allErr) return res.status(500).json({ error: allErr.message })
    const { data: readRows, error: readErr } = await supabase
      .from('announcement_reads').select('announcement_id').eq('user_id', req.user.id)
    if (readErr) return res.status(500).json({ error: readErr.message })
    const readIds = new Set((readRows || []).map((r) => r.announcement_id))
    const count = (allRows || []).filter((a) => !readIds.has(a.id)).length
    res.json({ count })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/announcements/:id
router.get('/:id', verifyToken, async (req, res) => {
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
    const { title, body, priority, expires_at, pinned } = req.body
    if (!title || !body)
      return res.status(400).json({ error: 'Title and body are required.' })
    if (pinned) {
      try {
        await assertPinAllowed()
      } catch (err) {
        return res.status(400).json({ error: err.message })
      }
    }
    const safePriority = normalizePriority(priority)
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title, body, priority: safePriority, pinned: !!pinned,
        expires_at: expires_at || null, created_by: req.user.id,
      })
      .select(AUTHOR_SELECT).single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'CREATE', 'Announcements', `Posted announcement: ${title}`)
    notifyAnnouncement(data)
    res.json({ success: true, id: data.id, data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── POST /api/announcements/mark-all-read ─────────────────────────────────────
// Records a read receipt for every announcement this user hasn't already
// read — called when they open the Announcements tab, and after they post
// or edit one themselves. Idempotent (unique constraint + ignoreDuplicates).
router.post('/mark-all-read', verifyToken, async (req, res) => {
  try {
    const { data: allRows, error: allErr } = await supabase.from('announcements').select('id')
    if (allErr) return res.status(500).json({ error: allErr.message })
    if (!allRows?.length) return res.json({ success: true })

    const rows = allRows.map((a) => ({ announcement_id: a.id, user_id: req.user.id }))
    const { error } = await supabase
      .from('announcement_reads')
      .upsert(rows, { onConflict: 'announcement_id,user_id', ignoreDuplicates: true })
    if (error) return res.status(500).json({ error: error.message })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/announcements/:id
router.put('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { data: existing } = await supabase
      .from('announcements').select('id, priority, pinned').eq('id', req.params.id).single()
    if (!existing) return res.status(404).json({ error: 'Announcement not found.' })
    const { title, body, priority, expires_at, pinned } = req.body
    if (!title || !body)
      return res.status(400).json({ error: 'Title and body are required.' })
    if (pinned && !existing.pinned) {
      try {
        await assertPinAllowed()
      } catch (err) {
        return res.status(400).json({ error: err.message })
      }
    }
    const safePriority = normalizePriority(priority)
    const { data, error } = await supabase
      .from('announcements')
      .update({ title, body, priority: safePriority, pinned: !!pinned, expires_at: expires_at || null })
      .eq('id', req.params.id).select(AUTHOR_SELECT).single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'UPDATE', 'Announcements', `Updated announcement: ${title}`)
    // Only notify on the transition into urgent — re-saving an already-urgent
    // post (e.g. fixing a typo) shouldn't re-email the whole office. Edits
    // that stay/become normal priority never re-notify either — the email
    // already went out once, at creation.
    if (safePriority === 'urgent' && existing.priority !== 'urgent') notifyAnnouncement(data)
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
