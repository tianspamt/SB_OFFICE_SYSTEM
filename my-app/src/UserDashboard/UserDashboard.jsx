import { useEffect, useState, useRef } from 'react'
import styles from './Userdashboard.module.css'
import logo from '../assets/image/balilihan-logo-Large-1.png'
import {
  ScrollText, Gavel, BookOpen, Scale, ClipboardList,
  Users, Search, X, Eye, FileText, Image as ImageIcon,
  CalendarDays, Megaphone, LogOut, ChevronDown, Menu,
  MapPin, Clock, ExternalLink, ArrowRight, FileSearch,
  Shield, Phone, Mail, Globe, ChevronRight
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const PRIORITY = {
  urgent: { label: 'Urgent', color: '#c53030', bg: '#fff5f5', border: '#feb2b2' },
  high:   { label: 'High',   color: '#975a16', bg: '#fffbeb', border: '#f6e05e' },
  normal: { label: 'Normal', color: '#276749', bg: '#f0fff4', border: '#9ae6b4' },
  low:    { label: 'Low',    color: '#4a5568', bg: '#f7fafc', border: '#cbd5e0' },
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function SBWebsite() {
  const [user, setUser] = useState(null)
  const [page, setPage] = useState('home')
  const [subPage, setSubPage] = useState(null)   // for legislative sub-pages
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(null)  // 'legislative' | 'council' | null
  const [scrolled, setScrolled] = useState(false)

  // Data
  const [ordinances, setOrdinances] = useState([])
  const [resolutions, setResolutions] = useState([])
  const [officials, setOfficials] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [sessionMinutes, setSessionMinutes] = useState([])
  const [loading, setLoading] = useState(true)

  // Search
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('all')
  const [selectedOfficial, setSelectedOfficial] = useState(null)

  const navRef = useRef(null)

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    // Check if we are already at the root to avoid a loop
    const isAtRoot = window.location.pathname === '/';
  
    if (!stored || !token) {
      if (!isAtRoot) window.location.replace('/'); 
      return;
    }
  
    try {
      const u = JSON.parse(stored);
      if (u.role !== 'user') {
        if (!isAtRoot) window.location.replace('/');
        return;
      }
      setUser(u);
    } catch {
      if (!isAtRoot) window.location.replace('/');
    }
    fetchAll();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const close = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setDropdownOpen(null)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [ord, res, off, ann, ses] = await Promise.all([
        fetch(`${API}/api/ordinances`).then(r => r.json()),
        fetch(`${API}/api/resolutions`).then(r => r.json()),
        fetch(`${API}/api/sb-officials`).then(r => r.json()),
        fetch(`${API}/api/announcements`).then(r => r.json()),
        fetch(`${API}/api/session-minutes`).then(r => r.json()),
      ])
      setOrdinances(Array.isArray(ord) ? ord : [])
      setResolutions(Array.isArray(res) ? res : [])
      setOfficials(Array.isArray(off) ? off : [])
      setAnnouncements(Array.isArray(ann) ? ann : [])
      setSessionMinutes(Array.isArray(ses) ? ses : [])
    } catch {}
    setLoading(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.replace('/')
  }

  const navigate = (pg, sub = null) => {
    setPage(pg)
    setSubPage(sub)
    setSearch('')
    setYearFilter('all')
    setDropdownOpen(null)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Data helpers ───────────────────────────────────────────────────────────
  const activeAnn = announcements.filter(a => !a.expires_at || new Date(a.expires_at) >= new Date())

  const getYears = (items) =>
    ['all', ...[...new Set(items.map(i => i.year).filter(Boolean))].sort((a, b) => b - a)]

  const filteredOrdinances = ordinances.filter(o => {
    const q = search.toLowerCase()
    return ((o.title || '').toLowerCase().includes(q) || (o.ordinance_number || '').toLowerCase().includes(q))
      && (yearFilter === 'all' || String(o.year) === yearFilter)
  })

  const filteredResolutions = resolutions.filter(r => {
    const q = search.toLowerCase()
    return ((r.title || '').toLowerCase().includes(q) || (r.resolution_number || '').toLowerCase().includes(q))
      && (yearFilter === 'all' || String(r.year) === yearFilter)
  })

  const filteredSessions = sessionMinutes.filter(s => {
    const q = search.toLowerCase()
    return (s.session_number || '').toLowerCase().includes(q)
      || (s.venue || '').toLowerCase().includes(q)
      || (s.agenda || '').toLowerCase().includes(q)
  })

  const filteredOfficials = officials.filter(o => {
    const q = search.toLowerCase()
    return (o.full_name || '').toLowerCase().includes(q) || (o.position || '').toLowerCase().includes(q)
  })

  // ── Sub-components ─────────────────────────────────────────────────────────
  const SearchBar = ({ placeholder, years }) => (
    <div className={styles.searchBar}>
      <div className={styles.searchWrap}>
        <Search size={16} className={styles.searchIco} />
        <input className={styles.searchInput} placeholder={placeholder}
          value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button className={styles.clearBtn} onClick={() => setSearch('')}><X size={14} /></button>}
      </div>
      {years && (
        <select className={styles.yearSel} value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
          {years.map(y => <option key={y} value={y}>{y === 'all' ? 'All Years' : y}</option>)}
        </select>
      )}
    </div>
  )

  const DocCard = ({ item, numberKey, type }) => {
    const isPdf = item.filetype === 'application/pdf'
    const url = item.extracted_text ? `${API}/api/${type}/${item.id}/print` : item.filepath
    return (
      <div className={styles.docCard}>
        <div className={styles.docFileIcon} style={{ background: isPdf ? '#fff5eb' : '#ebf8ff' }}>
          {isPdf
            ? <FileText size={22} strokeWidth={1.2} style={{ color: '#d97706' }} />
            : <ImageIcon size={22} strokeWidth={1.2} style={{ color: '#3b82f6' }} />}
        </div>
        <div className={styles.docBody}>
          {item[numberKey] && <div className={styles.docNum}>{item[numberKey]}</div>}
          <div className={styles.docTitle}>{item.title}</div>
          <div className={styles.docMeta}>
            {item.year && <span><CalendarDays size={11} strokeWidth={1.5} /> {item.year}</span>}
            <span style={{ color: isPdf ? '#d97706' : '#3b82f6', fontWeight: 600 }}>
              {isPdf ? 'PDF' : 'Document'}
            </span>
          </div>
          {item.officials?.length > 0 && (
            <div className={styles.officialChips}>
              {item.officials.slice(0, 4).map(o => (
                <span key={o.id} className={styles.chip}>
                  {o.photo
                    ? <img src={o.photo} alt={o.full_name} className={styles.chipImg} />
                    : <span className={styles.chipAva}>{o.full_name.charAt(0)}</span>}
                  {o.full_name}
                </span>
              ))}
              {item.officials.length > 4 && (
                <span className={styles.chip}>+{item.officials.length - 4} more</span>
              )}
            </div>
          )}
        </div>
        <a href={url} target="_blank" rel="noreferrer" className={styles.viewBtn}>
          <Eye size={14} /> View
        </a>
      </div>
    )
  }

  const OfficialCard = ({ o }) => (
    <button className={styles.officialCard} onClick={() => setSelectedOfficial(o)}>
      {o.photo
        ? <img src={o.photo} alt={o.full_name} className={styles.offImg} />
        : <div className={styles.offAva}>{o.full_name.charAt(0)}</div>}
      <div className={styles.offName}>{o.full_name}</div>
      <div className={styles.offPos}>{o.position}</div>
      <div className={styles.offTerm}><CalendarDays size={10} /> {o.term_period}</div>
    </button>
  )

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className={styles.root}>

      {/* ── NAVBAR ── */}
      <header className={`${styles.navbar} ${scrolled ? styles.navScrolled : ''}`} ref={navRef}>
        <div className={styles.navInner}>

          {/* Logo */}
          <button className={styles.navBrand} onClick={() => navigate('home')}>
            <img src={logo} alt="seal" className={styles.navSeal} />
            <div className={styles.navBrandText}>
              <span className={styles.navBrandMain}>Sangguniang Bayan</span>
              <span className={styles.navBrandSub}>Balilihan, Bohol</span>
            </div>
          </button>

          {/* Desktop nav links */}
          <nav className={styles.navLinks}>
            <button className={`${styles.navLink} ${page === 'home' ? styles.navLinkActive : ''}`}
              onClick={() => navigate('home')}>Home</button>

            {/* Legislative dropdown */}
            <div className={styles.navDropWrapper}>
              <button
                className={`${styles.navLink} ${styles.navLinkDrop} ${['ordinances','resolutions','sessions','localcode','rules'].includes(page) ? styles.navLinkActive : ''}`}
                onClick={() => setDropdownOpen(v => v === 'legislative' ? null : 'legislative')}>
                Legislative <ChevronDown size={13} strokeWidth={2}
                  style={{ transform: dropdownOpen === 'legislative' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {dropdownOpen === 'legislative' && (
                <div className={styles.dropdown}>
                  {[
                    { pg: 'ordinances', icon: <ScrollText size={15} />, label: 'Ordinances', desc: 'Enacted local laws' },
                    { pg: 'resolutions', icon: <Gavel size={15} />, label: 'Resolutions', desc: 'Formal expressions of policy' },
                    { pg: 'sessions', icon: <BookOpen size={15} />, label: 'Session Minutes', desc: 'Records of proceedings' },
                    { pg: 'localcode', icon: <Scale size={15} />, label: 'Local Government Code', desc: 'RA 7160 reference' },
                    { pg: 'rules', icon: <ClipboardList size={15} />, label: 'Internal Rules', desc: 'Rules of procedure' },
                  ].map(item => (
                    <button key={item.pg} className={styles.dropItem} onClick={() => navigate(item.pg)}>
                      <span className={styles.dropItemIcon}>{item.icon}</span>
                      <span>
                        <span className={styles.dropItemLabel}>{item.label}</span>
                        <span className={styles.dropItemDesc}>{item.desc}</span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Council dropdown */}
            <div className={styles.navDropWrapper}>
              <button
                className={`${styles.navLink} ${styles.navLinkDrop} ${page === 'council' ? styles.navLinkActive : ''}`}
                onClick={() => navigate('council')}>
                Council Members <ChevronDown size={13} strokeWidth={2} />
              </button>
            </div>

            <button className={`${styles.navLink} ${page === 'announcements' ? styles.navLinkActive : ''}`}
              onClick={() => navigate('announcements')}>
              Announcements
              {activeAnn.length > 0 && <span className={styles.navBadge}>{activeAnn.length}</span>}
            </button>
          </nav>

          {/* Right side */}
          <div className={styles.navRight}>
            <button className={styles.navSearchBtn} onClick={() => navigate('search')}>
              <Search size={16} />
            </button>
            <div className={styles.navUser}>
              <div className={styles.navUserAva}>{user?.name?.charAt(0)}</div>
              <span className={styles.navUserName}>{user?.name}</span>
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout} title="Log out">
              <LogOut size={15} />
            </button>
            <button className={styles.mobileMenuBtn} onClick={() => setMobileMenuOpen(v => !v)}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className={styles.mobileMenu}>
            {[
              { pg: 'home', label: 'Home' },
              { pg: 'ordinances', label: 'Ordinances' },
              { pg: 'resolutions', label: 'Resolutions' },
              { pg: 'sessions', label: 'Session Minutes' },
              { pg: 'localcode', label: 'Local Government Code' },
              { pg: 'rules', label: 'Internal Rules' },
              { pg: 'council', label: 'Council Members' },
              { pg: 'announcements', label: `Announcements ${activeAnn.length > 0 ? `(${activeAnn.length})` : ''}` },
              { pg: 'search', label: 'Search' },
            ].map(item => (
              <button key={item.pg} className={`${styles.mobileMenuItem} ${page === item.pg ? styles.mobileMenuActive : ''}`}
                onClick={() => navigate(item.pg)}>
                {item.label}
              </button>
            ))}
            <div className={styles.mobileMenuDivider} />
            <button className={styles.mobileMenuLogout} onClick={handleLogout}>
              <LogOut size={14} /> Log out
            </button>
          </div>
        )}
      </header>

      {/* ── PAGE CONTENT ── */}
      <main className={styles.pageContent}>

        {/* ═══════════════════ HOME ═══════════════════ */}
        {page === 'home' && (
          <>
            {/* Hero */}
            <section className={styles.hero}>
              <div className={styles.heroPattern} />
              <div className={styles.heroInner}>
                <img src={logo} alt="seal" className={styles.heroSeal} />
                <div className={styles.heroText}>
                  <h1 className={styles.heroH1}>Sangguniang Bayan ng Balilihan</h1>
                  <p className={styles.heroP}>
                    Official Legislative Information Portal · Balilihan, Bohol, Philippines
                  </p>
                  <div className={styles.heroBtns}>
                    <button className={styles.heroBtnPrimary} onClick={() => navigate('ordinances')}>
                      <ScrollText size={16} /> Browse Ordinances
                    </button>
                    <button className={styles.heroBtnSecondary} onClick={() => navigate('search')}>
                      <Search size={16} /> Search Records
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Stats bar */}
            <section className={styles.statsBar}>
              <div className={styles.statsBarInner}>
                {[
                  { n: ordinances.length,     label: 'Ordinances',    icon: <ScrollText size={18} />, pg: 'ordinances' },
                  { n: resolutions.length,    label: 'Resolutions',   icon: <Gavel size={18} />,      pg: 'resolutions' },
                  { n: sessionMinutes.length, label: 'Sessions',      icon: <BookOpen size={18} />,   pg: 'sessions' },
                  { n: officials.length,      label: 'Council Members', icon: <Users size={18} />,    pg: 'council' },
                ].map(s => (
                  <button key={s.label} className={styles.statItem} onClick={() => navigate(s.pg)}>
                    <span className={styles.statIcon}>{s.icon}</span>
                    <span className={styles.statNum}>{s.n}</span>
                    <span className={styles.statLabel}>{s.label}</span>
                    <ChevronRight size={14} className={styles.statArrow} />
                  </button>
                ))}
              </div>
            </section>

            <div className={styles.homeBody}>

              {/* Announcements highlight */}
              {activeAnn.length > 0 && (
                <section className={styles.homeSection}>
                  <div className={styles.homeSectionHead}>
                    <Megaphone size={18} strokeWidth={1.5} />
                    <h2 className={styles.homeSectionTitle}>Latest Announcements</h2>
                    <button className={styles.seeAllBtn} onClick={() => navigate('announcements')}>
                      View all <ArrowRight size={13} />
                    </button>
                  </div>
                  <div className={styles.annGrid}>
                    {activeAnn.slice(0, 3).map(a => {
                      const cfg = PRIORITY[a.priority] || PRIORITY.normal
                      return (
                        <div key={a.id} className={styles.annGridCard}
                          style={{ borderTop: `3px solid ${cfg.color}` }}>
                          <span className={styles.annBadge}
                            style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                            {cfg.label}
                          </span>
                          <div className={styles.annGridTitle}>{a.title}</div>
                          <div className={styles.annGridBody}>
                            {a.body.slice(0, 100)}{a.body.length > 100 ? '…' : ''}
                          </div>
                          <div className={styles.annGridDate}>
                            <CalendarDays size={11} />
                            {new Date(a.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Recent ordinances */}
              <section className={styles.homeSection}>
                <div className={styles.homeSectionHead}>
                  <ScrollText size={18} strokeWidth={1.5} />
                  <h2 className={styles.homeSectionTitle}>Recent Ordinances</h2>
                  <button className={styles.seeAllBtn} onClick={() => navigate('ordinances')}>
                    View all <ArrowRight size={13} />
                  </button>
                </div>
                <div className={styles.recentList}>
                  {ordinances.slice(0, 5).map(o => (
                    <DocCard key={o.id} item={o} numberKey="ordinance_number" type="ordinances" />
                  ))}
                  {ordinances.length === 0 && <div className={styles.empty}>No ordinances yet.</div>}
                </div>
              </section>

              {/* Quick links */}
              <section className={styles.quickLinks}>
                <h2 className={styles.quickLinksTitle}>Legislative Resources</h2>
                <div className={styles.quickLinksGrid}>
                  {[
                    { icon: <ScrollText size={24} />, label: 'Ordinances', desc: 'Browse enacted local laws', pg: 'ordinances' },
                    { icon: <Gavel size={24} />, label: 'Resolutions', desc: 'Formal policy expressions', pg: 'resolutions' },
                    { icon: <BookOpen size={24} />, label: 'Session Minutes', desc: 'Records of legislative sessions', pg: 'sessions' },
                    { icon: <Scale size={24} />, label: 'Local Gov. Code', desc: 'RA 7160 reference guide', pg: 'localcode' },
                    { icon: <ClipboardList size={24} />, label: 'Internal Rules', desc: 'Rules of procedure', pg: 'rules' },
                    { icon: <Users size={24} />, label: 'Council Members', desc: 'Meet your representatives', pg: 'council' },
                  ].map(q => (
                    <button key={q.pg} className={styles.quickCard} onClick={() => navigate(q.pg)}>
                      <div className={styles.quickIcon}>{q.icon}</div>
                      <div className={styles.quickLabel}>{q.label}</div>
                      <div className={styles.quickDesc}>{q.desc}</div>
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </>
        )}

        {/* ═══════════════════ ORDINANCES ═══════════════════ */}
        {page === 'ordinances' && (
          <div className={styles.innerPage}>
            <div className={styles.pageHero} style={{ background: 'linear-gradient(135deg, #009439 0%, #005822 100%)' }}>
              <ScrollText size={32} strokeWidth={1.2} style={{ color: 'rgba(255,255,255,0.7)' }} />
              <div>
                <h1 className={styles.pageHeroTitle}>Ordinances</h1>
                <p className={styles.pageHeroSub}>{ordinances.length} ordinances on record</p>
              </div>
            </div>
            <div className={styles.pageBody}>
              <SearchBar placeholder="Search by title or ordinance number…" years={getYears(ordinances)} />
              <div className={styles.resultInfo}>
                Showing <strong>{filteredOrdinances.length}</strong> of {ordinances.length} ordinances
              </div>
              <div className={styles.docList}>
                {filteredOrdinances.map(o => <DocCard key={o.id} item={o} numberKey="ordinance_number" type="ordinances" />)}
                {filteredOrdinances.length === 0 && <div className={styles.empty}>No ordinances match your search.</div>}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ RESOLUTIONS ═══════════════════ */}
        {page === 'resolutions' && (
          <div className={styles.innerPage}>
            <div className={styles.pageHero} style={{ background: 'linear-gradient(135deg, #1a365d 0%, #2a4a8a 100%)' }}>
              <Gavel size={32} strokeWidth={1.2} style={{ color: 'rgba(255,255,255,0.7)' }} />
              <div>
                <h1 className={styles.pageHeroTitle}>Resolutions</h1>
                <p className={styles.pageHeroSub}>{resolutions.length} resolutions on record</p>
              </div>
            </div>
            <div className={styles.pageBody}>
              <SearchBar placeholder="Search by title or resolution number…" years={getYears(resolutions)} />
              <div className={styles.resultInfo}>
                Showing <strong>{filteredResolutions.length}</strong> of {resolutions.length} resolutions
              </div>
              <div className={styles.docList}>
                {filteredResolutions.map(r => <DocCard key={r.id} item={r} numberKey="resolution_number" type="resolutions" />)}
                {filteredResolutions.length === 0 && <div className={styles.empty}>No resolutions match your search.</div>}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ SESSION MINUTES ═══════════════════ */}
        {page === 'sessions' && (
          <div className={styles.innerPage}>
            <div className={styles.pageHero} style={{ background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)' }}>
              <BookOpen size={32} strokeWidth={1.2} style={{ color: 'rgba(255,255,255,0.7)' }} />
              <div>
                <h1 className={styles.pageHeroTitle}>Session Minutes</h1>
                <p className={styles.pageHeroSub}>{sessionMinutes.length} sessions on record</p>
              </div>
            </div>
            <div className={styles.pageBody}>
              <SearchBar placeholder="Search by session number, venue, or agenda…" />
              <div className={styles.resultInfo}>
                Showing <strong>{filteredSessions.length}</strong> of {sessionMinutes.length} sessions
              </div>
              <div className={styles.sessionList}>
                {filteredSessions.map(s => {
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
                {filteredSessions.length === 0 && <div className={styles.empty}>No sessions found.</div>}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ LOCAL GOV CODE ═══════════════════ */}
        {page === 'localcode' && (
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
                  { num: 'Book I',   title: 'General Provisions',       desc: 'Policy and guiding principles, definition of terms, and fundamental provisions governing local autonomy.' },
                  { num: 'Book II',  title: 'Local Taxation & Fiscal',  desc: 'Local taxing powers, revenue generation, expenditure, and fiscal administration of LGUs.' },
                  { num: 'Book III', title: 'Local Government Units',   desc: 'Specific powers, duties, and structure of Barangays, Municipalities, Cities, and Provinces.' },
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
        )}

        {/* ═══════════════════ INTERNAL RULES ═══════════════════ */}
        {page === 'rules' && (
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
        )}

        {/* ═══════════════════ COUNCIL MEMBERS ═══════════════════ */}
        {page === 'council' && (
          <div className={styles.innerPage}>
            <div className={styles.pageHero} style={{ background: 'linear-gradient(135deg, #1a365d 0%, #009439 100%)' }}>
              <Users size={32} strokeWidth={1.2} style={{ color: 'rgba(255,255,255,0.7)' }} />
              <div>
                <h1 className={styles.pageHeroTitle}>Members of the Council</h1>
                <p className={styles.pageHeroSub}>Sangguniang Bayan ng Balilihan, Bohol</p>
              </div>
            </div>
            <div className={styles.pageBody}>
              <SearchBar placeholder="Search by name or position…" />
              <div className={styles.resultInfo}>
                {filteredOfficials.length} member{filteredOfficials.length !== 1 ? 's' : ''} found
              </div>
              <div className={styles.councilGrid}>
                {filteredOfficials.map(o => <OfficialCard key={o.id} o={o} />)}
                {filteredOfficials.length === 0 && <div className={styles.empty}>No council members found.</div>}
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════ ANNOUNCEMENTS ═══════════════════ */}
        {page === 'announcements' && (
          <div className={styles.innerPage}>
            <div className={styles.pageHero} style={{ background: 'linear-gradient(135deg, #c05621 0%, #dd6b20 100%)' }}>
              <Megaphone size={32} strokeWidth={1.2} style={{ color: 'rgba(255,255,255,0.7)' }} />
              <div>
                <h1 className={styles.pageHeroTitle}>Announcements</h1>
                <p className={styles.pageHeroSub}>{activeAnn.length} active announcement{activeAnn.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className={styles.pageBody}>
              <SearchBar placeholder="Search announcements…" />
              <div className={styles.annList}>
                {announcements
                  .filter(a => (a.title + a.body).toLowerCase().includes(search.toLowerCase()))
                  .map(a => {
                    const cfg = PRIORITY[a.priority] || PRIORITY.normal
                    const expired = a.expires_at && new Date(a.expires_at) < new Date()
                    return (
                      <div key={a.id} className={`${styles.annFullCard} ${expired ? styles.annExpired : ''}`}>
                        <div className={styles.annFullLeft}
                          style={{ background: `linear-gradient(180deg, ${cfg.color}22 0%, ${cfg.color}08 100%)`, borderRight: `3px solid ${cfg.color}` }}>
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
                              <Clock size={11} /> {expired ? 'Expired' : 'Until'} {new Date(a.expires_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
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
        )}

        {/* ═══════════════════ SEARCH ═══════════════════ */}
        {page === 'search' && (
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
                  <input className={styles.globalSearchInput}
                    placeholder="Search ordinances, resolutions, sessions…"
                    value={search} onChange={e => setSearch(e.target.value)}
                    autoFocus />
                  {search && <button className={styles.clearBtn} onClick={() => setSearch('')}><X size={16} /></button>}
                </div>
              </div>

              {search && (() => {
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
                  <div className={styles.searchResults}>
                    <div className={styles.resultInfo}>
                      Found <strong>{total}</strong> result{total !== 1 ? 's' : ''} for "<em>{search}</em>"
                    </div>

                    {matchOrd.length > 0 && (
                      <div className={styles.searchGroup}>
                        <div className={styles.searchGroupHead}><ScrollText size={15} /> Ordinances ({matchOrd.length})</div>
                        {matchOrd.slice(0, 5).map(o => <DocCard key={o.id} item={o} numberKey="ordinance_number" type="ordinances" />)}
                        {matchOrd.length > 5 && (
                          <button className={styles.showMoreBtn} onClick={() => navigate('ordinances')}>
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
                          <button className={styles.showMoreBtn} onClick={() => navigate('resolutions')}>
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
                )
              })()}

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
        )}

        {/* ── FOOTER ── */}
        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div className={styles.footerLeft}>
              <img src={logo} alt="seal" className={styles.footerSeal} />
              <div>
                <div className={styles.footerName}>Sangguniang Bayan ng Balilihan</div>
                <div className={styles.footerSub}>Balilihan, Bohol, Philippines</div>
              </div>
            </div>
            <div className={styles.footerLinks}>
              {[
                { label: 'Ordinances', pg: 'ordinances' },
                { label: 'Resolutions', pg: 'resolutions' },
                { label: 'Session Minutes', pg: 'sessions' },
                { label: 'Council Members', pg: 'council' },
                { label: 'Announcements', pg: 'announcements' },
              ].map(l => (
                <button key={l.pg} className={styles.footerLink} onClick={() => navigate(l.pg)}>{l.label}</button>
              ))}
            </div>
            <div className={styles.footerCopy}>
              © {new Date().getFullYear()} Sangguniang Bayan ng Balilihan. All rights reserved.
            </div>
          </div>
        </footer>

      </main>

      {/* ── Official profile modal ── */}
      {selectedOfficial && (() => {
        const o = selectedOfficial
        const passed = ordinances.filter(ord => ord.officials?.some(x => x.id === o.id))
        return (
          <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) setSelectedOfficial(null) }}>
            <div className={styles.modal}>
              <button className={styles.modalClose} onClick={() => setSelectedOfficial(null)}><X size={16} /></button>
              <div className={styles.modalHead}>
                {o.photo
                  ? <img src={o.photo} alt={o.full_name} className={styles.modalPhoto} />
                  : <div className={styles.modalAva}>{o.full_name.charAt(0)}</div>}
                <div>
                  <div className={styles.modalName}>{o.full_name}</div>
                  <div className={styles.modalPos}>{o.position}</div>
                  <div className={styles.modalTerm}><CalendarDays size={12} /> {o.term_period}</div>
                </div>
              </div>
              {passed.length > 0 && (
                <div className={styles.modalBody}>
                  <div className={styles.modalSectionTitle}>
                    <ClipboardList size={14} /> Ordinances Passed ({passed.length})
                  </div>
                  {passed.map(ord => (
                    <div key={ord.id} className={styles.modalOrdItem}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{ord.title}</div>
                        <div style={{ fontSize: 11, color: '#718096' }}>{ord.ordinance_number} · {ord.year}</div>
                      </div>
                      <a href={ord.filepath} target="_blank" rel="noreferrer" className={styles.viewBtnSm}>
                        <Eye size={11} /> View
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })()}

    </div>
  )
}
