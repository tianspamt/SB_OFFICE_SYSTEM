import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, ScrollText, Gavel, BookOpen, Users, FileSearch, Eye } from 'lucide-react'
import { useDashboard, MONTHS } from './DashboardContext'
import DocCard from './DocCard'
import OfficialCard from './OfficialCard'
import styles from './Userdashboard.module.css'

export default function SearchPage() {
  const { API, ordinances, resolutions, sessionMinutes, officials } = useDashboard()
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const q = search.toLowerCase()
  const matchOrd = ordinances.filter(o =>
    (o.title || '').toLowerCase().includes(q) || (o.ordinance_number || '').toLowerCase().includes(q))
  const matchRes = resolutions.filter(r =>
    (r.title || '').toLowerCase().includes(q) || (r.resolution_number || '').toLowerCase().includes(q))
  const matchSes = sessionMinutes.filter(s =>
    (s.session_number || '').toLowerCase().includes(q) || (s.venue || '').toLowerCase().includes(q))
  const matchOff = officials.filter(o =>
    (o.full_name || '').toLowerCase().includes(q) || (o.position || '').toLowerCase().includes(q))
  const total = matchOrd.length + matchRes.length + matchSes.length + matchOff.length

  return (
    <div className={styles.innerPage}>
      <div className={styles.pageHero} style={{ background: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)' }}>
        <FileSearch size={32} strokeWidth={1.2} style={{ color: 'rgba(255,255,255,0.7)' }} />
        <div>
          <h1 className={styles.pageHeroTitle}>Search Records</h1>
          <p className={styles.pageHeroSub}>Search across all legislative documents</p>
        </div>
      </div>
      <div className={styles.pageBody}>
        <div className={styles.globalSearch}>
          <div className={styles.globalSearchWrap}>
            <Search size={20} className={styles.globalSearchIco} />
            <input
              className={styles.globalSearchInput}
              placeholder="Search ordinances, resolutions, sessions…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            {search && (
              <button className={styles.clearBtn} onClick={() => setSearch('')}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {search && (
          <div className={styles.searchResults}>
            <div className={styles.resultInfo}>
              Found <strong>{total}</strong> result{total !== 1 ? 's' : ''} for "<em>{search}</em>"
            </div>

            {matchOrd.length > 0 && (
              <div className={styles.searchGroup}>
                <div className={styles.searchGroupHead}><ScrollText size={15} /> Ordinances ({matchOrd.length})</div>
                {matchOrd.slice(0, 5).map(o => <DocCard key={o.id} item={o} numberKey="ordinance_number" type="ordinances" />)}
                {matchOrd.length > 5 && (
                  <button className={styles.showMoreBtn} onClick={() => navigate('/dashboard/ordinances')}>
                    See all {matchOrd.length} ordinances →
                  </button>
                )}
              </div>
            )}

            {matchRes.length > 0 && (
              <div className={styles.searchGroup}>
                <div className={styles.searchGroupHead}><Gavel size={15} /> Resolutions ({matchRes.length})</div>
                {matchRes.slice(0, 5).map(r => <DocCard key={r.id} item={r} numberKey="resolution_number" type="resolutions" />)}
                {matchRes.length > 5 && (
                  <button className={styles.showMoreBtn} onClick={() => navigate('/dashboard/resolutions')}>
                    See all {matchRes.length} resolutions →
                  </button>
                )}
              </div>
            )}

            {matchSes.length > 0 && (
              <div className={styles.searchGroup}>
                <div className={styles.searchGroupHead}><BookOpen size={15} /> Sessions ({matchSes.length})</div>
                {matchSes.slice(0, 3).map(s => {
                  const d = s.session_date ? new Date(s.session_date + 'T00:00:00') : null
                  return (
                    <div key={s.id} className={styles.searchSessionItem}>
                      <div className={styles.searchSesDate}>
                        {d && !isNaN(d) ? `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : '—'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{s.session_number || 'Session'}</div>
                        <div style={{ fontSize: 12, color: '#718096' }}>{s.venue}</div>
                      </div>
                      <a href={`${API}/api/session-minutes/${s.id}/print`} target="_blank"
                        rel="noreferrer" className={styles.viewBtnSm}><Eye size={12} /> View</a>
                    </div>
                  )
                })}
              </div>
            )}

            {matchOff.length > 0 && (
              <div className={styles.searchGroup}>
                <div className={styles.searchGroupHead}><Users size={15} /> Council Members ({matchOff.length})</div>
                <div className={styles.councilGrid} style={{ marginTop: 12 }}>
                  {matchOff.map(o => <OfficialCard key={o.id} o={o} />)}
                </div>
              </div>
            )}

            {total === 0 && (
              <div className={styles.noResults}>
                <Search size={40} strokeWidth={1} style={{ color: '#cbd5e0' }} />
                <div>No results found for "<strong>{search}</strong>"</div>
                <div style={{ fontSize: 13, color: '#a0aec0' }}>Try different keywords</div>
              </div>
            )}
          </div>
        )}

        {!search && (
          <div className={styles.searchPrompt}>
            <FileSearch size={48} strokeWidth={1} style={{ color: '#cbd5e0' }} />
            <p>Type a keyword to search across all records</p>
            <div className={styles.searchHints}>
              {['Ordinance No.', 'Resolution', 'Regular Session', 'Councilor'].map(h => (
                <button key={h} className={styles.searchHintBtn} onClick={() => setSearch(h)}>{h}</button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
