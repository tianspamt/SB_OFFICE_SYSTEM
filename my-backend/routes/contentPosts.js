const express = require('express')
const router = express.Router()

const supabase = require('../config/supabase')
const { verifyToken, adminOnly } = require('../middleware/auth')
const { upload, handleMulterError } = require('../middleware/multer')
const { uploadToStorage, deleteFromStorage } = require('../helpers/storage')
const { logActivity } = require('../helpers/logger')

const AUTHOR_SELECT = '*, author:users!author_id(name, photo)'

// category is a 2-state field (activity/announcement) — anything else
// collapses to "activity" rather than being rejected, matching the same
// normalize-don't-reject approach used for announcements.priority.
const normalizeCategory = (c) => (c === 'announcement' ? 'announcement' : 'activity')

const toBool = (v) => v === true || v === 'true'

// Uploads each new file to Storage and returns [{ url, path }, ...].
const uploadImages = async (files) => {
  if (!files?.length) return []
  const uploaded = []
  for (const file of files) {
    const { fileName, publicUrl } = await uploadToStorage(file, 'content-posts')
    uploaded.push({ url: publicUrl, path: fileName })
  }
  return uploaded
}

// GET /api/content-posts — internal admin view, sees drafts too.
router.get('/', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('content_posts').select(AUTHOR_SELECT)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── GET /api/content-posts/public ─────────────────────────────────────────────
// For the separate public-facing website. No auth, and — unlike ordinances'
// GET / (which only filters by status if the caller remembers to ask) —
// published=true is enforced here unconditionally, not caller-optional.
router.get('/public', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('content_posts').select(AUTHOR_SELECT)
      .eq('published', true)
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/content-posts
router.post('/', verifyToken, adminOnly, upload.array('images', 10), handleMulterError, async (req, res) => {
  try {
    const { title, body, category, published, pinned } = req.body
    if (!title || !body)
      return res.status(400).json({ error: 'Title and body are required.' })

    const images = await uploadImages(req.files)

    const { data, error } = await supabase
      .from('content_posts')
      .insert({
        title, body, category: normalizeCategory(category),
        published: published === undefined ? true : toBool(published),
        pinned: toBool(pinned),
        images, author_id: req.user.id,
      })
      .select(AUTHOR_SELECT).single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'CREATE', 'Content Management', `Posted content: ${title}`)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PUT /api/content-posts/:id ─────────────────────────────────────────────────
// Full edit. `existingImages` (JSON string of [{url,path}, ...]) lists which
// already-uploaded images to keep — anything the client dropped from that
// list gets deleted from Storage. New files in the request are uploaded and
// appended after the kept ones.
router.put('/:id', verifyToken, adminOnly, upload.array('images', 10), handleMulterError, async (req, res) => {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('content_posts').select('images').eq('id', req.params.id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Post not found.' })

    const { title, body, category, published, pinned } = req.body
    if (!title || !body)
      return res.status(400).json({ error: 'Title and body are required.' })

    let keptImages = []
    try {
      keptImages = req.body.existingImages ? JSON.parse(req.body.existingImages) : []
    } catch {
      return res.status(400).json({ error: 'existingImages must be valid JSON.' })
    }

    const keptPaths = new Set(keptImages.map((img) => img.path))
    const removed = (existing.images || []).filter((img) => !keptPaths.has(img.path))
    for (const img of removed) await deleteFromStorage(img.path)

    const newImages = await uploadImages(req.files)
    const images = [...keptImages, ...newImages]

    const { data, error } = await supabase
      .from('content_posts')
      .update({
        title, body, category: normalizeCategory(category),
        published: published === undefined ? true : toBool(published),
        pinned: toBool(pinned),
        images,
      })
      .eq('id', req.params.id).select(AUTHOR_SELECT).single()
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'UPDATE', 'Content Management', `Updated content: ${title}`)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ─── PATCH /api/content-posts/:id ──────────────────────────────────────────────
// Partial update — just the publish/pin toggles, no title/body/images
// required (that's what PUT is for).
router.patch('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('content_posts').select('id, title').eq('id', req.params.id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Post not found.' })

    const updateData = {}
    if (req.body.published !== undefined) updateData.published = toBool(req.body.published)
    if (req.body.pinned !== undefined) updateData.pinned = toBool(req.body.pinned)
    if (Object.keys(updateData).length === 0)
      return res.status(400).json({ error: 'Nothing to update.' })

    const { data, error } = await supabase
      .from('content_posts').update(updateData).eq('id', req.params.id)
      .select(AUTHOR_SELECT).single()
    if (error) return res.status(500).json({ error: error.message })
    const action = updateData.published !== undefined
      ? (updateData.published ? 'Published' : 'Unpublished')
      : (updateData.pinned ? 'Pinned' : 'Unpinned')
    await logActivity(req, 'UPDATE', 'Content Management', `${action} content: ${existing.title}`)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/content-posts/:id
router.delete('/:id', verifyToken, adminOnly, async (req, res) => {
  try {
    const { data: existing, error: fetchErr } = await supabase
      .from('content_posts').select('title, images').eq('id', req.params.id).single()
    if (fetchErr || !existing) return res.status(404).json({ error: 'Post not found.' })

    for (const img of existing.images || []) await deleteFromStorage(img.path)

    const { error } = await supabase.from('content_posts').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })
    await logActivity(req, 'DELETE', 'Content Management', `Deleted content: ${existing.title}`)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
