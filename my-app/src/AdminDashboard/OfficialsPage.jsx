import { useState, useMemo } from 'react'
import {
  Users, Plus, Search, Pencil, Archive, X, Eye,
  ChevronDown, ChevronRight, CalendarDays, UserPlus
} from 'lucide-react'
import styles from './OfficialsPage.module.css'

// ── helpers ───────────────────────────────────────────────────────────────────

function initials(name = '') {
  return name
    .split(' ')
    .filter(w => w.length > 1)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || '?'
}

/**
 * Build council groups from officials' terms array.
 *
 * Each official has: { id, full_name, position, photo, terms: [...] }
 * Each term has:     { id, council_member_id, term_period, term_start,
 *                      term_end, status, is_reelected, notes }
 *
 * A member who served in two councils appears in BOTH groups.
 * Members with no terms go into an 'Unknown' bucket.
 *
 * Returns: [{ termPeriod, entries: [{ member, term }] }]  newest-first.
 */
function buildCouncilGroups(officials) {
  const map = {}  // termPeriod → [{ member, term }]

  officials.forEach(member => {
    const terms = member.terms || []
    if (terms.length === 0) {
      if (!map['Unknown']) map['Unknown'] = []
      map['Unknown'].push({ member, term: null })
    } else {
      terms.forEach(term => {
        const key = term.term_period || 'Unknown'
        if (!map[key]) map[key] = []
        map[key].push({ member, term })
      })
    }
  })

  const getYear = s => parseInt((s.match(/\d{4}/) || ['0'])[0])

  return Object.entries(map)
    .sort(([a], [b]) => {
      if (a === 'Unknown') return 1
      if (b === 'Unknown') return -1
      return getYear(b) - getYear(a)
    })
    .map(([termPeriod, entries]) => ({ termPeriod, entries }))
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ member }) {
  return (
    <div className={styles.avatar}>
      {member.photo
        ? <img src={member.photo} alt={member.full_name} />
        : <span>{initials(member.full_name)}</span>}
    </div>
  )
}

// ── MemberCard ────────────────────────────────────────────────────────────────

function MemberCard({ member, term, onEdit, onDelete, onViewProfile, readOnly = false }) {
  const isActive = term?.status === 'active'

  return (
    <div className={styles.memberCard}>
      <Avatar member={member} />
      <div className={styles.memberName}>{member.full_name || '—'}</div>
      <div className={styles.memberPos}>{member.position || '—'}</div>

      {term ? (
        <span className={`${styles.badge} ${isActive ? styles.badgeActive : styles.badgeEnded}`}>
          {isActive ? 'Active' : 'Term ended'}
        </span>
      ) : (
        <span className={`${styles.badge} ${styles.badgeNoTerm}`}>No term</span>
      )}

      <div className={styles.cardActions}>
  <button className={styles.iconBtn} onClick={() => onViewProfile(member)}>
    <Eye size={13} /> View
  </button>
  {!readOnly && (
    <>
      <button className={styles.iconBtn} onClick={() => onEdit(member)}>
        <Pencil size={13} /> Edit
      </button>
      <button
        className={`${styles.iconBtn} ${styles.iconBtnDel}`}
        onClick={() => onDelete(member)}
        title="Archive"
      >
        <Archive size={13} />
      </button>
    </>
  )}
</div>
    </div>
  )
}

// ── AddCouncilModal ───────────────────────────────────────────────────────────

function AddCouncilModal({ onClose, onConfirm }) {
  const [termPeriod, setTermPeriod] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    const val = termPeriod.trim()
    if (!val) { setError('Please enter the term period.'); return }
    onConfirm(val)
  }

  return (
    <div className={styles.modalBg} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>
            <CalendarDays size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Add Council
          </h3>
          <button className={styles.closeBtn} onClick={onClose}><X size={16} /></button>
        </div>

        <div className={styles.formGroup}>
          <label>
            Term Period / Year <span style={{ color: '#e53e3e' }}>*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. 2022–2025 or 2022"
            value={termPeriod}
            onChange={e => { setTermPeriod(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
          {error && <p className={styles.fieldError}>{error}</p>}
          <p className={styles.fieldHint}>
            This becomes the council group label. Members whose term records
            use this exact term period will appear here automatically.
          </p>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.primaryBtn} onClick={handleSubmit}>
            <Plus size={14} /> Create Council
          </button>
        </div>
      </div>
    </div>
  )
}

// ── CouncilGroup ──────────────────────────────────────────────────────────────

function CouncilGroup({
  termPeriod,
  entries,
  isOpen,
  onToggle,
  search,
  onSearch,
  onAddMember,
  onEdit,
  onDelete,
  onViewProfile,
  readOnly = false,
}) {
  const activeCount = entries.filter(e => e.term?.status === 'active').length

  const filtered = useMemo(() => {
    if (!search.trim()) return entries
    const q = search.toLowerCase()
    return entries.filter(e =>
      (e.member.full_name || '').toLowerCase().includes(q) ||
      (e.member.position || '').toLowerCase().includes(q)
    )
  }, [entries, search])

  return (
    <div className={`${styles.councilGroup} ${isOpen ? styles.councilGroupOpen : ''}`}>

      {/* ── header row ── */}
      <div className={styles.councilHeaderWrapper}>
        {/* left side: toggle */}
        <button className={styles.councilHeader} onClick={onToggle}>
          <span className={styles.councilChevron}>
            {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </span>
          <div className={styles.councilAccent} />
          <div className={styles.councilInfo}>
            <div className={styles.councilTermLabel}>{termPeriod}</div>
            <div className={styles.councilMeta}>
              {entries.length} member{entries.length !== 1 ? 's' : ''}
              {activeCount > 0 && (
                <span className={styles.activeChip}>{activeCount} active</span>
              )}
            </div>
          </div>
        </button>

        {/* right side: add member — separate from the toggle button */}
        {!readOnly && (
  <button
    className={styles.addMemberInlineBtn}
    onClick={() => onAddMember(termPeriod)}
    title={`Add a member to the ${termPeriod} council`}
  >
    <UserPlus size={13} /> Add member
  </button>
)}
      </div>

      {/* ── expanded body ── */}
      {isOpen && (
        <div className={styles.councilBody}>
          {entries.length > 0 && (
            <div className={styles.searchBar}>
              <Search size={13} style={{ color: '#a0aec0', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search by name or position…"
                value={search}
                onChange={e => onSearch(e.target.value)}
              />
              {search && (
                <button className={styles.clearSearch} onClick={() => onSearch('')}>
                  <X size={12} />
                </button>
              )}
            </div>
          )}

          {filtered.length > 0 ? (
            <>
              <div className={styles.resultInfo}>
                {filtered.length} member{filtered.length !== 1 ? 's' : ''}
                {search ? ' found' : ''}
              </div>
              <div className={styles.memberGrid}>
                {filtered.map(({ member, term }) => (
                  <MemberCard
  key={`${member.id}-${term?.id ?? 'noterm'}`}
  member={member}
  term={term}
  onEdit={onEdit}
  onDelete={onDelete}
  onViewProfile={onViewProfile}
  readOnly={readOnly}
/>
                ))}
              </div>
            </>
          ) : (
            <div className={styles.empty}>
              {search
                ? 'No members match your search.'
                : 'No members in this council yet. Click "Add member" to add one.'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── OfficialsPage ─────────────────────────────────────────────────────────────

export default function OfficialsPage({
  officials = [],
  ordinances = [],
  setDeleteTarget,
  onViewProfile,
  onEditMember,
  onAddMember,
  readOnly = false,
}) {
  const [openGroups, setOpenGroups]   = useState({})
  const [groupSearch, setGroupSearch] = useState({})
  const [showAddCouncil, setShowAddCouncil] = useState(false)
  const [emptyCouncils, setEmptyCouncils]   = useState([])  // manually-added empty ones

  const grouped = useMemo(() => buildCouncilGroups(officials), [officials])

  // Merge empty councils that don't exist yet in grouped data
  const allGroups = useMemo(() => {
    const existing = new Set(grouped.map(g => g.termPeriod))
    const getYear  = s => parseInt((s.match(/\d{4}/) || ['0'])[0])
    const extras = emptyCouncils
      .filter(tp => !existing.has(tp))
      .map(tp => ({ termPeriod: tp, entries: [] }))
      .sort((a, b) => getYear(b.termPeriod) - getYear(a.termPeriod))
    return [...extras, ...grouped]
  }, [grouped, emptyCouncils])

  const toggleGroup = tp =>
    setOpenGroups(prev => ({ ...prev, [tp]: !prev[tp] }))

  const handleAddCouncilConfirm = tp => {
    setEmptyCouncils(prev => prev.includes(tp) ? prev : [tp, ...prev])
    setOpenGroups(prev => ({ ...prev, [tp]: true }))
    setShowAddCouncil(false)
  }

  const handleDelete = member =>
    setDeleteTarget({ id: member.id, type: 'official', name: member.full_name })

  // Stats
  const totalCouncils = allGroups.filter(g => g.termPeriod !== 'Unknown').length
  const totalMembers  = officials.length
  const activeMembers = officials.filter(o =>
    (o.terms || []).some(t => t.status === 'active')
  ).length

  return (
    <div className={styles.page}>

      {/* ── hero ── */}
      <div className={styles.hero}>
        <Users size={28} strokeWidth={1.2} style={{ color: 'rgba(255,255,255,0.7)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <h1 className={styles.heroTitle}>Members of the Council</h1>
          <p className={styles.heroSub}>Sangguniang Bayan ng Balilihan, Bohol</p>
        </div>
        <div className={styles.heroStats}>
          <div className={styles.heroStat}>
            <span className={styles.heroStatNum}>{totalCouncils}</span>
            <span className={styles.heroStatLabel}>Councils</span>
          </div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStat}>
            <span className={styles.heroStatNum}>{totalMembers}</span>
            <span className={styles.heroStatLabel}>Members</span>
          </div>
          <div className={styles.heroStatDivider} />
          <div className={styles.heroStat}>
            <span className={styles.heroStatNum}>{activeMembers}</span>
            <span className={styles.heroStatLabel}>Active</span>
          </div>
        </div>
      </div>

      {/* ── toolbar ── */}
      <div className={styles.toolbar}>
  <span className={styles.sectionLabel} style={{ marginBottom: 0 }}>
    {allGroups.length} council{allGroups.length !== 1 ? 's' : ''}
  </span>
  {!readOnly && (
    <button className={styles.primaryBtn} onClick={() => setShowAddCouncil(true)}>
      <Plus size={14} /> Add Council
    </button>
  )}
</div>

      {/* ── council group list ── */}
      {allGroups.length === 0 ? (
        <div className={styles.empty}>
          No councils yet. Click <strong>Add Council</strong> to create one,
          then add members to it.
        </div>
      ) : (
        <div className={styles.groupList}>
          {allGroups.map(({ termPeriod, entries }) => (
            <CouncilGroup
  key={termPeriod}
  termPeriod={termPeriod}
  entries={entries}
  isOpen={!!openGroups[termPeriod]}
  onToggle={() => toggleGroup(termPeriod)}
  search={groupSearch[termPeriod] || ''}
  onSearch={val => setGroupSearch(prev => ({ ...prev, [termPeriod]: val }))}
  onAddMember={tp => onAddMember && onAddMember(tp)}
  onEdit={onEditMember}
  onDelete={handleDelete}
  onViewProfile={onViewProfile}
  readOnly={readOnly}
/>
          ))}
        </div>
      )}

      {/* ── Add Council modal ── */}
      {showAddCouncil && (
        <AddCouncilModal
          onClose={() => setShowAddCouncil(false)}
          onConfirm={handleAddCouncilConfirm}
        />
      )}
    </div>
  )
}