import { useState } from 'react'
import { Users } from 'lucide-react'
import { useDashboard } from './DashboardContext'
import OfficialCard from './OfficialCard'
import SearchBar from './SearchBar'
import styles from './Userdashboard.module.css'

export default function CouncilPage() {
  const { officials } = useDashboard()
  const [search, setSearch] = useState('')

  const filtered = officials.filter(o => {
    const q = search.toLowerCase()
    return (o.full_name || '').toLowerCase().includes(q) || (o.position || '').toLowerCase().includes(q)
  })

  return (
    <div className={styles.innerPage}>
      <div className={styles.pageHero} style={{ background: 'linear-gradient(135deg, #1a365d 0%, #009439 100%)' }}>
        <Users size={32} strokeWidth={1.2} style={{ color: 'rgba(255,255,255,0.7)' }} />
        <div>
          <h1 className={styles.pageHeroTitle}>Members of the Council</h1>
          <p className={styles.pageHeroSub}>Sangguniang Bayan ng Balilihan, Bohol</p>
        </div>
      </div>
      <div className={styles.pageBody}>
        <SearchBar
          placeholder="Search by name or position…"
          search={search}
          setSearch={setSearch}
        />
        <div className={styles.resultInfo}>
          {filtered.length} member{filtered.length !== 1 ? 's' : ''} found
        </div>
        <div className={styles.councilGrid}>
          {filtered.map(o => <OfficialCard key={o.id} o={o} />)}
          {filtered.length === 0 && <div className={styles.empty}>No council members found.</div>}
        </div>
      </div>
    </div>
  )
}
