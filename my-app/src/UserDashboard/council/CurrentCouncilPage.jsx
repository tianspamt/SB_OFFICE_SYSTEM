// Route: /dashboard/council/current
import { useState, useEffect } from 'react'
import { Users, Award, CalendarDays } from 'lucide-react'
import styles from './Currentcouncilpage.module.css'

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

export default function CurrentCouncilPage() {
  const [term,    setTerm]    = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null)
      try {
        const res = await fetch(`${API}/api/council/current`)
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to fetch current council.')
        }
        const data = await res.json()
        setTerm(data.term)
        setMembers(data.members || [])
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <div className={styles.state}>Loading council members…</div>
  if (error)   return <div className={styles.stateErr}>Could not load data: {error}</div>

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <Users size={34} strokeWidth={1.2} className={styles.heroIcon} />
        <div>
          <h1 className={styles.heroTitle}>
            {term ? `${getOrdinal(term.term_number)} Sangguniang Bayan` : 'Current Council'}
          </h1>
          <p className={styles.heroSub}>Balilihan, Bohol — Active Council Members</p>
        </div>
      </div>

      {term && (
        <div className={styles.chips}>
          <span className={styles.activePill}>● Active Term</span>
          <span className={styles.chip}><Award size={13} /> {getOrdinal(term.term_number)} Council</span>
          <span className={styles.chip}><Users size={13} /> {members.length} Members</span>
          <span className={styles.chip}><CalendarDays size={13} /> {term.start_year}–{term.end_year}</span>
        </div>
      )}

      <div className={styles.body}>
        {members.length === 0
          ? <p className={styles.empty}>No members found for the current term.</p>
          : <div className={styles.grid}>
              {members.map(m => <MemberCard key={m.id} member={m} />)}
            </div>
        }
      </div>
    </div>
  )
}