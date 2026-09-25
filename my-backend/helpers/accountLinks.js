const supabase = require('../config/supabase')

// Links between a council member (sb_council_members — who gets tagged as an
// ordinance/resolution Author) and the login account (users) that person
// signs in with, via sb_council_members.user_id (migrations/031). See
// Author_Approval_Workflow_v2.docx, Section 3:
//   Option A (main)        — "Create login account" while adding a member
//                            creates the account already linked
//                            (routes/councilMembers.js POST /add).
//   Option B (safety net)  — autoLinkUser / autoLinkMember below link
//                            automatically, but ONLY on a certain match.
//   Manual                 — Edit member → Login Account, and the one-time
//                            "Suggest matches" cleanup (suggestLinks).

// A term's position (sb_council_member_terms.position) ↔ the account
// position (users.position, see helpers/roles.js) of the same seat.
const TERM_TO_USER_POSITION = {
  'Councilor': 'councilor',
  'Vice Mayor': 'vice_mayor',
  'Liga ng mga Barangay President': 'liga_ng_mga_barangay',
  'SK Federated President': 'sk_federated',
}
const LINKABLE_USER_POSITIONS = Object.values(TERM_TO_USER_POSITION)

// Stricter than helpers/councils.js's normalizePersonName: also folds
// accents (Paña = Pana) and drops honorifics, since the official record is
// often typed "Hon. Juan D. Cruz" while the account just says "Juan D. Cruz".
const HONORIFICS = new Set(['hon', 'honorable', 'atty', 'engr', 'dr', 'mr', 'mrs', 'ms'])
const normalizeName = (s) =>
  (s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !HONORIFICS.has(w))
    .join(' ')

// Looser comparison, used only for *suggestions* the Admin confirms by hand:
// every multi-letter word of the shorter name appears in the longer one, so
// "Juan Cruz" ~ "Juan Dela Cruz". Never used to link automatically.
const isSimilarName = (a, b) => {
  const words = (s) => normalizeName(s).split(' ').filter((w) => w.length > 1)
  const [x, y] = [words(a), words(b)].sort((p, q) => p.length - q.length)
  if (x.length === 0) return false
  const set = new Set(y)
  return x.every((w) => set.has(w))
}

// Active-term position of each member, keyed by member id.
async function activePositionsByMember() {
  const { data, error } = await supabase
    .from('sb_council_member_terms')
    .select('council_member_id, position')
    .eq('status', 'active')
  if (error) throw new Error(error.message)
  const map = new Map()
  for (const t of data || []) if (t.position) map.set(t.council_member_id, t.position)
  return map
}

// Sets the link only if the member is still unlinked — the WHERE on user_id
// plus the unique index keep two simultaneous links from both succeeding.
async function setLink(memberId, userId) {
  const { data, error } = await supabase
    .from('sb_council_members')
    .update({ user_id: userId })
    .eq('id', memberId)
    .is('user_id', null)
    .select('id, full_name')
  if (error) {
    if (error.code === '23505') return null // that account is already linked elsewhere
    throw new Error(error.message)
  }
  return data?.[0] || null
}

// Option B, user side: called right after an account is created. Links only
// when EXACTLY ONE unlinked, non-archived member has an active term in the
// matching seat and the same (normalized) name. Anything less certain returns
// null and the account is shown as "Not linked" — the system never guesses.
async function autoLinkUser(user) {
  if (!user || !LINKABLE_USER_POSITIONS.includes(user.position)) return null
  const wanted = normalizeName(user.name)
  if (!wanted) return null

  const { data: members, error } = await supabase
    .from('sb_council_members')
    .select('id, full_name')
    .is('user_id', null)
    .eq('is_archived', false)
  if (error) throw new Error(error.message)
  const positions = await activePositionsByMember()
  const matches = (members || []).filter((m) =>
    TERM_TO_USER_POSITION[positions.get(m.id)] === user.position &&
    normalizeName(m.full_name) === wanted)
  if (matches.length !== 1) return null
  return setLink(matches[0].id, user.id)
}

// Option B, member side: called after a member is added WITHOUT creating an
// account, in case the office registered the account first. Same rule —
// exactly one unlinked account in the matching position with the same name.
async function autoLinkMember({ memberId, fullName, termPosition }) {
  const userPosition = TERM_TO_USER_POSITION[termPosition]
  const wanted = normalizeName(fullName)
  if (!userPosition || !wanted) return null

  const [{ data: users, error: uErr }, { data: linked, error: lErr }] = await Promise.all([
    supabase.from('users').select('id, name, username')
      .eq('role', 'user').eq('position', userPosition).eq('is_archived', false),
    supabase.from('sb_council_members').select('user_id').not('user_id', 'is', null),
  ])
  if (uErr) throw new Error(uErr.message)
  if (lErr) throw new Error(lErr.message)
  const taken = new Set((linked || []).map((r) => r.user_id))
  const matches = (users || []).filter((u) => !taken.has(u.id) && normalizeName(u.name) === wanted)
  if (matches.length !== 1) return null
  const member = await setLink(memberId, matches[0].id)
  return member ? matches[0] : null
}

// One-time cleanup ("Suggest matches"): every unlinked member paired with
// the unlinked accounts whose names look similar. Nothing is linked here —
// the Admin confirms each pair through PUT /sb-council-members/:id/account.
// `exact` marks pairs that would also pass the automatic rule.
async function suggestLinks() {
  const [{ data: members, error: mErr }, { data: users, error: uErr }] = await Promise.all([
    supabase.from('sb_council_members').select('id, full_name, user_id').eq('is_archived', false),
    supabase.from('users').select('id, name, username, position')
      .eq('role', 'user').eq('is_archived', false).in('position', LINKABLE_USER_POSITIONS),
  ])
  if (mErr) throw new Error(mErr.message)
  if (uErr) throw new Error(uErr.message)
  const positions = await activePositionsByMember()
  const taken = new Set((members || []).map((m) => m.user_id).filter(Boolean))
  const freeUsers = (users || []).filter((u) => !taken.has(u.id))

  return (members || [])
    .filter((m) => !m.user_id)
    .map((m) => {
      const seat = TERM_TO_USER_POSITION[positions.get(m.id)] || null
      const candidates = freeUsers
        .filter((u) => isSimilarName(m.full_name, u.name))
        .map((u) => ({
          ...u,
          exact: normalizeName(u.name) === normalizeName(m.full_name) && (!seat || seat === u.position),
        }))
        .sort((a, b) => Number(b.exact) - Number(a.exact))
      return { member_id: m.id, full_name: m.full_name, position: positions.get(m.id) || null, candidates }
    })
    .filter((s) => s.candidates.length > 0)
}

// The council member linked to this account (null for Secretary/Clerk or an
// account not linked yet).
async function memberForUser(userId) {
  const { data, error } = await supabase
    .from('sb_council_members').select('id, full_name, photo').eq('user_id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  return data || null
}

// The account linked to this council member, if any — used to address
// author-approval requests. Archived accounts count as "no account", so their
// approvals fall back to the Secretary's on-behalf option.
async function userForMember(memberId) {
  if (!memberId) return null
  const { data, error } = await supabase
    .from('sb_council_members')
    .select('user_id, users:users!sb_council_members_user_id_fkey ( id, name, email, is_archived )')
    .eq('id', memberId).maybeSingle()
  if (error) throw new Error(error.message)
  const u = data?.users
  return u && !u.is_archived ? u : null
}

module.exports = {
  TERM_TO_USER_POSITION,
  LINKABLE_USER_POSITIONS,
  normalizeName,
  isSimilarName,
  autoLinkUser,
  autoLinkMember,
  suggestLinks,
  memberForUser,
  userForMember,
}
