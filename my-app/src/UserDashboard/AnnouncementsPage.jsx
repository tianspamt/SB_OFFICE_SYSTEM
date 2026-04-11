import { useState } from 'react'
import { Megaphone, CalendarDays, Clock } from 'lucide-react'
import { useDashboard, PRIORITY } from './DashboardContext'
import SearchBar from './SearchBar'
import styles from './Userdashboard.module.css'

export default function AnnouncementsPage() {
  const { announcements, activeAnn } = useDashboard()
  const [search, setSearch] = useState('')

  const filtered = announcements.filter(a =>
    (a.title + a.body).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.innerPage}>
      <div className={styles.pageHero} style={{ background: 'linear-gradient(135deg, #c05621 0%, #dd6b20 100%)' }}>
        <Megaphone size={32} strokeWidth={1.2} style={{ color: 'rgba(255,255,255,0.7)' }} />
        <div>
          <h1 className={styles.pageHeroTitle}>Announcements</h1>
          <p className={styles.pageHeroSub}>
            {activeAnn.length} active announcement{activeAnn.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div className={styles.pageBody}>
        <SearchBar
          placeholder="Search announcements…"
          search={search}
          setSearch={setSearch}
        />
        <div className={styles.annList}>
          {filtered.map(a => {
            const cfg = PRIORITY[a.priority] || PRIORITY.normal
            const expired = a.expires_at && new Date(a.expires_at) < new Date()
            return (
              <div key={a.id} className={`${styles.annFullCard} ${expired ? styles.annExpired : ''}`}>
                <div className={styles.annFullLeft}
                  style={{
                    background: `linear-gradient(180deg, ${cfg.color}22 0%, ${cfg.color}08 100%)`,
                    borderRight: `3px solid ${cfg.color}`,
                  }}>
                  <span className={styles.annBadge}
                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                    {cfg.label}
                  </span>
                  {expired && <span className={styles.expBadge}>Expired</span>}
                  <div className={styles.annFullDate}>
                    <CalendarDays size={12} />
                    {new Date(a.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                  {a.expires_at && (
                    <div className={styles.annFullExpiry} style={{ color: expired ? '#c53030' : '#718096' }}>
                      <Clock size={11} /> {expired ? 'Expired' : 'Until'}{' '}
                      {new Date(a.expires_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </div>
                <div className={styles.annFullRight}>
                  <h3 className={styles.annFullTitle}>{a.title}</h3>
                  <p className={styles.annFullBody}>{a.body}</p>
                </div>
              </div>
            )
          })}
          {announcements.length === 0 && <div className={styles.empty}>No announcements at this time.</div>}
        </div>
      </div>
    </div>
  )
}
