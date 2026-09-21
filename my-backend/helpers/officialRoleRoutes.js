const express = require('express')
const supabase = require('../config/supabase')
const { verifyToken, secretaryOnly } = require('../middleware/auth')
const { resolveCurrentTermId } = require('./officials')
const { logActivity } = require('./logger')

// Co-Author and Sponsor are new roles a council member can hold on an
// ordinance/resolution, alongside the existing (single) Author — Author is
// set at draft/upload time (see routes/ordinances.js's own POST/PUT), these
// two are only ever added later, once the Secretary has accepted the draft
// into a reading. RA 7160's three-reading process is where co-authorship/
// sponsorship actually gets recorded, not at drafting time, so both routes
// below require the record to currently be in one of the three reading
// statuses — same gate PUT /:id/reject uses in legislativeReviewRoutes.js.
const READING_STATUSES = ['first_reading', 'second_reading', 'third_reading']
const ROLE_LABELS = { co_author: 'co-author', sponsor: 'sponsor' }

// Builds PUT (add) / DELETE (remove) routes for tagging a councilor onto
// one ordinance/resolution as a co-author or sponsor. Shared across both
// record types the same way createLegislativeReviewRoutes is — only the
// join table name, its foreign key column, and the labels actually differ.
function createOfficialRoleRoutes({ table, parentTable, idColumn, activityModule, singularLabel }) {
  const router = express.Router()

  const loadInReadingStage = async (id) => {
    const { data, error } = await supabase.from(parentTable).select('status').eq('id', id).single()
    if (error || !data) return { notFound: true }
    if (!READING_STATUSES.includes(data.status)) return { wrongStatus: true }
    return { data }
  }

  // POST /:id/officials — { official_id, role: 'co_author' | 'sponsor' }
  router.post('/:id/officials', verifyToken, secretaryOnly, async (req, res) => {
    const { id } = req.params
    const { official_id, role } = req.body
    if (!official_id) return res.status(400).json({ error: 'A councilor is required.' })
    if (!['co_author', 'sponsor'].includes(role)) {
      return res.status(400).json({ error: 'role must be co_author or sponsor.' })
    }
    const { notFound, wrongStatus } = await loadInReadingStage(id)
    if (notFound) return res.status(404).json({ error: `${singularLabel} not found.` })
    if (wrongStatus) {
      return res.status(400).json({
        error: `${singularLabel} must be in a reading stage to add a ${ROLE_LABELS[role]}.`,
      })
    }

    try {
      const term_id = await resolveCurrentTermId(official_id)
      const { data, error } = await supabase
        .from(table)
        .insert({ [idColumn]: id, official_id, term_id, role })
        .select(`official_id, role,
          sb_council_members ( id, full_name, photo ),
          term:sb_council_member_terms ( id, position, term_period )
        `)
        .single()
      if (error) {
        if (error.code === '23505') {
          return res.status(409).json({ error: `This councilor is already tagged as a ${ROLE_LABELS[role]}.` })
        }
        return res.status(500).json({ error: error.message })
      }
      await logActivity(req, 'UPDATE', activityModule, `Added ${ROLE_LABELS[role]}: ${data.sb_council_members?.full_name}`)
      res.json({
        success: true,
        data: {
          id: data.official_id,
          role: data.role,
          full_name: data.sb_council_members?.full_name || null,
          photo: data.sb_council_members?.photo || null,
          position: data.term?.position || null,
        },
      })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // DELETE /:id/officials/:officialId?role=co_author|sponsor
  router.delete('/:id/officials/:officialId', verifyToken, secretaryOnly, async (req, res) => {
    const { id, officialId } = req.params
    const { role } = req.query
    if (!['co_author', 'sponsor'].includes(role)) {
      return res.status(400).json({ error: 'role must be co_author or sponsor.' })
    }
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq(idColumn, id)
        .eq('official_id', officialId)
        .eq('role', role)
      if (error) return res.status(500).json({ error: error.message })
      await logActivity(req, 'UPDATE', activityModule, `Removed ${ROLE_LABELS[role]}`)
      res.json({ success: true })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  return router
}

// Makes one role's tagged officials on a record match `ids` — the edit form's
// way of setting Author / Co-Author / Sponsor. Diffs against what's stored so
// an official who stays tagged keeps their row (and its historical term_id
// snapshot); only real removals and additions touch the DB. Scoped to one
// `role`, so syncing co-authors can never disturb the author or sponsors.
async function syncRoleLinks({ table, idColumn, id, role, ids }) {
  const wanted = new Set((Array.isArray(ids) ? ids : []).map(Number).filter(Number.isFinite))
  const { data: existing, error } = await supabase
    .from(table).select('official_id').eq(idColumn, id).eq('role', role)
  if (error) throw new Error(error.message)
  const have = new Set((existing || []).map((l) => l.official_id))
  const toRemove = [...have].filter((oid) => !wanted.has(oid))
  const toAdd = [...wanted].filter((oid) => !have.has(oid))

  if (toRemove.length > 0) {
    const { error: delErr } = await supabase
      .from(table).delete().eq(idColumn, id).eq('role', role).in('official_id', toRemove)
    if (delErr) throw new Error(delErr.message)
  }
  if (toAdd.length > 0) {
    const rows = await Promise.all(toAdd.map(async (oid) => ({
      [idColumn]: id, official_id: oid, term_id: await resolveCurrentTermId(oid), role,
    })))
    const { error: insErr } = await supabase.from(table).insert(rows)
    if (insErr) throw new Error(insErr.message)
  }
}

module.exports = { createOfficialRoleRoutes, syncRoleLinks }
