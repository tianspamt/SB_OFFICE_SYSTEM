import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ScrollText, Gavel, BookOpen, Scale, ClipboardList,
  Eye, MapPin, ExternalLink,
} from 'lucide-react'
import { useDashboard, MONTHS } from './DashboardContext'
import DocCard from './DocCard'
import SearchBar from './SearchBar'
import styles from './Userdashboard.module.css'

// ─── Ordinances ───────────────────────────────────────────────────────────────
export function OrdinancesPage() {
  const { ordinances } = useDashboard()
  const [search, setSearch]         = useState('')
  const [yearFilter, setYearFilter] = useState('all')

  const getYears = items =>
    ['all', ...[...new Set(items.map(i => i.year).filter(Boolean))].sort((a, b) => b - a)]

  const filtered = ordinances.filter(o => {
    const q = search.toLowerCase()
    return (
      ((o.title || '').toLowerCase().includes(q) || (o.ordinance_number || '').toLowerCase().includes(q)) &&
      (yearFilter === 'all' || String(o.year) === yearFilter)
    )
  })

  return (
    <div className={styles.innerPage}>
      <div className={styles.pageHero} style={{ background: 'linear-gradient(135deg, #009439 0%, #005822 100%)' }}>
        <ScrollText size={32} strokeWidth={1.2} style={{ color: 'rgba(255,255,255,0.7)' }} />
        <div>
          <h1 className={styles.pageHeroTitle}>Ordinances</h1>
          <p className={styles.pageHeroSub}>{ordinances.length} ordinances on record</p>
        </div>
      </div>
      <div className={styles.pageBody}>
        <SearchBar
          placeholder="Search by title or ordinance number…"
          years={getYears(ordinances)}
          search={search} setSearch={setSearch}
          yearFilter={yearFilter} setYearFilter={setYearFilter}
        />
        <div className={styles.resultInfo}>
          Showing <strong>{filtered.length}</strong> of {ordinances.length} ordinances
        </div>
        <div className={styles.docList}>
          {filtered.map(o => <DocCard key={o.id} item={o} numberKey="ordinance_number" type="ordinances" />)}
          {filtered.length === 0 && <div className={styles.empty}>No ordinances match your search.</div>}
        </div>
      </div>
    </div>
  )
}

// ─── Resolutions ──────────────────────────────────────────────────────────────
export function ResolutionsPage() {
  const { resolutions } = useDashboard()
  const [search, setSearch]         = useState('')
  const [yearFilter, setYearFilter] = useState('all')

  const getYears = items =>
    ['all', ...[...new Set(items.map(i => i.year).filter(Boolean))].sort((a, b) => b - a)]

  const filtered = resolutions.filter(r => {
    const q = search.toLowerCase()
    return (
      ((r.title || '').toLowerCase().includes(q) || (r.resolution_number || '').toLowerCase().includes(q)) &&
      (yearFilter === 'all' || String(r.year) === yearFilter)
    )
  })

  return (
    <div className={styles.innerPage}>
      <div className={styles.pageHero} style={{ background: 'linear-gradient(135deg, #1a365d 0%, #2a4a8a 100%)' }}>
        <Gavel size={32} strokeWidth={1.2} style={{ color: 'rgba(255,255,255,0.7)' }} />
        <div>
          <h1 className={styles.pageHeroTitle}>Resolutions</h1>
          <p className={styles.pageHeroSub}>{resolutions.length} resolutions on record</p>
        </div>
      </div>
      <div className={styles.pageBody}>
        <SearchBar
          placeholder="Search by title or resolution number…"
          years={getYears(resolutions)}
          search={search} setSearch={setSearch}
          yearFilter={yearFilter} setYearFilter={setYearFilter}
        />
        <div className={styles.resultInfo}>
          Showing <strong>{filtered.length}</strong> of {resolutions.length} resolutions
        </div>
        <div className={styles.docList}>
          {filtered.map(r => <DocCard key={r.id} item={r} numberKey="resolution_number" type="resolutions" />)}
          {filtered.length === 0 && <div className={styles.empty}>No resolutions match your search.</div>}
        </div>
      </div>
    </div>
  )
}

// ─── Session Minutes ──────────────────────────────────────────────────────────
export function SessionsPage() {
  const { API, sessionMinutes } = useDashboard()
  const [search, setSearch] = useState('')

  const filtered = sessionMinutes.filter(s => {
    const q = search.toLowerCase()
    return (
      (s.session_number || '').toLowerCase().includes(q) ||
      (s.venue || '').toLowerCase().includes(q) ||
      (s.agenda || '').toLowerCase().includes(q)
    )
  })

  return (
    <div className={styles.innerPage}>
      <div className={styles.pageHero} style={{ background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)' }}>
        <BookOpen size={32} strokeWidth={1.2} style={{ color: 'rgba(255,255,255,0.7)' }} />
        <div>
          <h1 className={styles.pageHeroTitle}>Session Minutes</h1>
          <p className={styles.pageHeroSub}>{sessionMinutes.length} sessions on record</p>
        </div>
      </div>
      <div className={styles.pageBody}>
        <SearchBar
          placeholder="Search by session number, venue, or agenda…"
          search={search} setSearch={setSearch}
        />
        <div className={styles.resultInfo}>
          Showing <strong>{filtered.length}</strong> of {sessionMinutes.length} sessions
        </div>
        <div className={styles.sessionList}>
          {filtered.map(s => {
            const d = s.session_date ? new Date(s.session_date + 'T00:00:00') : null
            const agenda = s.agenda ? s.agenda.split('\n').filter(Boolean) : []
            return (
              <div key={s.id} className={styles.sessionCard}>
                <div className={styles.sesDateBlock}>
                  {d && !isNaN(d) ? (
                    <>
                      <div className={styles.sesMonth}>{MONTHS[d.getMonth()]}</div>
                      <div className={styles.sesDay}>{d.getDate()}</div>
                      <div className={styles.sesYear}>{d.getFullYear()}</div>
                    </>
                  ) : <div className={styles.sesDay}>—</div>}
                </div>
                <div className={styles.sesBody}>
                  <div className={styles.sesTop}>
                    <span className={`${styles.sesType} ${s.session_type === 'special' ? styles.sesSpecial : styles.sesRegular}`}>
                      {s.session_type === 'special' ? 'Special Session' : 'Regular Session'}
                    </span>
                    {s.session_number && <span className={styles.sesNum}>{s.session_number}</span>}
                  </div>
                  {s.venue && <div className={styles.sesVenue}><MapPin size={12} /> {s.venue}</div>}
                  {agenda.length > 0 && (
                    <ol className={styles.sesAgenda}>
                      {agenda.slice(0, 3).map((item, i) => <li key={i}>{item}</li>)}
                      {agenda.length > 3 && <li className={styles.sesMore}>+{agenda.length - 3} more…</li>}
                    </ol>
                  )}
                  {s.minutes_text && (
                    <p className={styles.sesPreview}>
                      {s.minutes_text.slice(0, 150)}{s.minutes_text.length > 150 ? '…' : ''}
                    </p>
                  )}
                </div>
                <a href={`${API}/api/session-minutes/${s.id}/print`} target="_blank"
                  rel="noreferrer" className={styles.viewBtn}>
                  <Eye size={14} /> View
                </a>
              </div>
            )
          })}
          {filtered.length === 0 && <div className={styles.empty}>No sessions found.</div>}
        </div>
      </div>
    </div>
  )
}

// ─── Local Government Code ────────────────────────────────────────────────────
export function LocalCodePage() {
  return (
    <div className={styles.innerPage}>
      <div className={styles.pageHero} style={{ background: 'linear-gradient(135deg, #744210 0%, #975a16 100%)' }}>
        <Scale size={32} strokeWidth={1.2} style={{ color: 'rgba(255,255,255,0.7)' }} />
        <div>
          <h1 className={styles.pageHeroTitle}>Local Government Code</h1>
          <p className={styles.pageHeroSub}>Republic Act No. 7160</p>
        </div>
      </div>
      <div className={styles.pageBody}>
        <div className={styles.infoBlock}>
          <div className={styles.infoBlockIcon}><Scale size={40} strokeWidth={1} style={{ color: '#009439' }} /></div>
          <div>
            <h2 className={styles.infoBlockTitle}>Republic Act No. 7160</h2>
            <p className={styles.infoBlockText}>
              An Act providing for a Local Government Code of 1991, which decentralizes governance
              and empowers local government units — Barangays, Municipalities, Cities, and Provinces —
              to respond more effectively to the needs of their constituents through greater autonomy,
              broader tax base, and increased share in national revenues.
            </p>
            <a href="https://www.officialgazette.gov.ph/1991/10/10/republic-act-no-7160/"
              target="_blank" rel="noreferrer" className={styles.extBtn}>
              <ExternalLink size={14} /> View on Official Gazette
            </a>
          </div>
        </div>
        <div className={styles.booksGrid}>
          {[
            { num: 'Book I',   title: 'General Provisions',      desc: 'Policy and guiding principles, definition of terms, and fundamental provisions governing local autonomy.' },
            { num: 'Book II',  title: 'Local Taxation & Fiscal', desc: 'Local taxing powers, revenue generation, expenditure, and fiscal administration of LGUs.' },
            { num: 'Book III', title: 'Local Government Units',  desc: 'Specific powers, duties, and structure of Barangays, Municipalities, Cities, and Provinces.' },
            { num: 'Book IV',  title: 'Miscellaneous Provisions', desc: 'Transitory and final provisions, including repealing clauses and effectivity.' },
          ].map(b => (
            <div key={b.num} className={styles.bookCard}>
              <div className={styles.bookNum}>{b.num}</div>
              <div className={styles.bookTitle}>{b.title}</div>
              <div className={styles.bookDesc}>{b.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Internal Rules ───────────────────────────────────────────────────────────
export function RulesPage() {
  return (
    <div className={styles.innerPage}>
      <div className={styles.pageHero} style={{ background: 'linear-gradient(135deg, #276749 0%, #009439 100%)' }}>
        <ClipboardList size={32} strokeWidth={1.2} style={{ color: 'rgba(255,255,255,0.7)' }} />
        <div>
          <h1 className={styles.pageHeroTitle}>Internal Rules of Procedure</h1>
          <p className={styles.pageHeroSub}>Governing guidelines for SB operations</p>
        </div>
      </div>
      <div className={styles.pageBody}>
        <div className={styles.rulesList}>
          {[
            { n: 'Rule I',    t: 'Name, Composition and Seal',        d: 'Establishment of the Sangguniang Bayan as the legislative body of the municipality of Balilihan.' },
            { n: 'Rule II',   t: 'Officers of the Sangguniang Bayan', d: 'Election, duties, and responsibilities of the Vice Mayor, Floor Leader, and Committee Chairpersons.' },
            { n: 'Rule III',  t: 'Sessions',                          d: 'Regular and special sessions — schedule, quorum requirements, and proper conduct of proceedings.' },
            { n: 'Rule IV',   t: 'Order of Business',                 d: 'The sequence of business transacted during sessions, including reading of minutes and taking up of agenda items.' },
            { n: 'Rule V',    t: 'Committees',                        d: 'Standing and special committees: composition, jurisdiction, reporting, and committee hearings.' },
            { n: 'Rule VI',   t: 'Ordinances and Resolutions',        d: 'The process of filing, referral, deliberation, voting, and passage of legislative measures.' },
            { n: 'Rule VII',  t: 'Discipline of Members',             d: 'Grounds and procedures for censure, suspension, or expulsion of a member of the Sanggunian.' },
            { n: 'Rule VIII', t: 'Amendments to the Internal Rules',  d: 'Procedure for amending, revising, or repealing provisions of these Internal Rules of Procedure.' },
          ].map((r, i) => (
            <div key={r.n} className={styles.ruleItem}>
              <div className={styles.ruleItemNum}>{i + 1}</div>
              <div className={styles.ruleItemBody}>
                <div className={styles.ruleItemTag}>{r.n}</div>
                <div className={styles.ruleItemTitle}>{r.t}</div>
                <div className={styles.ruleItemDesc}>{r.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
