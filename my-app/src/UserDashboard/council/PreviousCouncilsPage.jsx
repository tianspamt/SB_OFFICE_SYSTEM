// Route: /dashboard/council/previous
import { useState, useEffect } from 'react'
import { History, ChevronRight, Users } from 'lucide-react'
import styles from './Previouscouncilspage.module.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function getOrdinal(n) {
  if (!n) return ''
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function MemberCard({ member }) {
  const [imgErr, setImgErr] = useState(false)
  const showPhoto = member.photo_url && !imgErr
  const initials = (member.full_name || '')
    .split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className={styles.card}>
      <div className={styles.photoWrap}>
        {showPhoto
          ? <img src={member.photo_url} alt={member.full_name} className={styles.photo} onError={() => setImgErr(true)} />
          : <div className={styles.avatar}><span className={styles.initials}>{initials}</span></div>
        }
      </div>
      <div className={styles.cardInfo}>
        <p className={styles.position}>{member.position || 'Member'}</p>
        <h3 className={styles.name}>{member.full_name}</h3>
        {member.committee && <p className={styles.meta}>{member.committee}</p>}
        {member.party     && <p className={styles.party}>{member.party}</p>}
      </div>
    </div>
  )
}

export default function PreviousCouncilsPage() {
  const [terms,        setTerms]        = useState([])
  const [selected,     setSelected]     = useState(null)
  const [members,      setMembers]      = useState([])
  const [loadingTerms, setLoadingTerms] = useState(true)
  const [loadingMem,   setLoadingMem]   = useState(false)
  const [error,        setError]        = useState(null)

  // Load all previous terms once
  useEffect(() => {
    async function loadTerms() {
      setLoadingTerms(true)
      try {
        const res = await fetch(`${API}/api/council/previous`)
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to fetch previous terms.')
        }
        const data = await res.json()
        setTerms(data.terms || [])
        if (data.terms?.length > 0) setSelected(data.terms[0])
      } catch (e) {
        setError(e.message)
      } finally {
        setLoadingTerms(false)
      }
    }
    loadTerms()
  }, [])

  // Load members when selected term changes
  useEffect(() => {
    if (!selected) return
    async function loadMembers() {
      setLoadingMem(true)
      try {
        const res = await fetch(`${API}/api/council/previous/${selected.id}/members`)
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to fetch members.')
        }
        const data = await res.json()
        setMembers(data.members || [])
      } catch (e) {
        setError(e.message)
      } finally {
        setLoadingMem(false)
      }
    }
    loadMembers()
  }, [selected])

  if (loadingTerms) return <div className={styles.state}>Loading past terms…</div>
  if (error)        return <div className={styles.stateErr}>Could not load data: {error}</div>

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <History size={34} strokeWidth={1.2} className={styles.heroIcon} />
        <div>
          <h1 className={styles.heroTitle}>Previous Councils</h1>
          <p className={styles.heroSub}>Sangguniang Bayan ng Balilihan, Bohol</p>
        </div>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <p className={styles.sidebarLabel}>Legislatures</p>
          {terms.length === 0 && <p className={styles.empty}>No previous terms found.</p>}
          {terms.map(t => (
            <button
              key={t.id}
              className={`${styles.termBtn} ${selected?.id === t.id ? styles.termBtnActive : ''}`}
              onClick={() => setSelected(t)}>
              <span>{getOrdinal(t.term_number)} Council</span>
              <ChevronRight size={13} className={styles.chev} />
            </button>
          ))}
        </aside>

        <main className={styles.main}>
          {selected && (
            <>
              <div className={styles.mainHeader}>
                <h2 className={styles.mainTitle}>
                  {getOrdinal(selected.term_number)} Sangguniang Bayan
                </h2>
                <p className={styles.mainSub}>
                  Council members · {selected.start_year}–{selected.end_year}
                </p>
              </div>

              {loadingMem
                ? <div className={styles.state}>Loading members…</div>
                : members.length === 0
                  ? <div className={styles.empty}>No records available for this term.</div>
                  : <div className={styles.grid}>
                      {members.map(m => <MemberCard key={m.id} member={m} />)}
                    </div>
              }
            </>
          )}
        </main>
      </div>
    </div>
  )
}