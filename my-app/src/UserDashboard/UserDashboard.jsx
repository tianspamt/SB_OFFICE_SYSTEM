import { useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  ScrollText, Gavel, BookOpen, Scale, ClipboardList,
  Users, Search, X, CalendarDays, ClipboardList as ClipList,
  Megaphone, LogOut, ChevronDown, Menu, Eye, ExternalLink,
} from 'lucide-react'
import { DashboardProvider, useDashboard } from './DashboardContext'
import styles from './Userdashboard.module.css'
import logo from '../assets/image/balilihan-logo-Large-1.png'

// ─── Inner layout (has access to context) ────────────────────────────────────
function DashboardLayout() {
  const { user, activeAnn, handleLogout, ordinances, selectedOfficial, setSelectedOfficial } = useDashboard()
  const navigate  = useNavigate()
  const location  = useLocation()
  const navRef    = useRef(null)

  const [scrolled,        setScrolled]        = useState(false)
  const [dropdownOpen,    setDropdownOpen]     = useState(null)  // 'legislative' | null
  const [mobileMenuOpen,  setMobileMenuOpen]   = useState(false)

  const path = location.pathname

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const close = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setDropdownOpen(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  // Close mobile menu & dropdown on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setDropdownOpen(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [path])

  const isLegislative = ['/dashboard/ordinances','/dashboard/resolutions','/dashboard/sessions','/dashboard/localcode','/dashboard/rules'].includes(path)

  const go = (to) => {
    navigate(to)
  }

  return (
    <div className={styles.root}>

      {/* ── NAVBAR ── */}
      <header className={`${styles.navbar} ${scrolled ? styles.navScrolled : ''}`} ref={navRef}>
        <div className={styles.navInner}>

          {/* Logo */}
          <button className={styles.navBrand} onClick={() => go('/dashboard/home')}>
            <img src={logo} alt="seal" className={styles.navSeal} />
            <div className={styles.navBrandText}>
              <span className={styles.navBrandMain}>Sangguniang Bayan</span>
              <span className={styles.navBrandSub}>Balilihan, Bohol</span>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className={styles.navLinks}>
            <button
              className={`${styles.navLink} ${path === '/dashboard/home' || path === '/dashboard' ? styles.navLinkActive : ''}`}
              onClick={() => go('/dashboard/home')}>
              Home
            </button>

            {/* Legislative dropdown */}
            <div className={styles.navDropWrapper}>
              <button
                className={`${styles.navLink} ${styles.navLinkDrop} ${isLegislative ? styles.navLinkActive : ''}`}
                onClick={() => setDropdownOpen(v => v === 'legislative' ? null : 'legislative')}>
                Legislative <ChevronDown size={13} strokeWidth={2}
                  style={{ transform: dropdownOpen === 'legislative' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              {dropdownOpen === 'legislative' && (
                <div className={styles.dropdown}>
                  {[
                    { path: '/dashboard/ordinances', icon: <ScrollText size={15} />, label: 'Ordinances',           desc: 'Enacted local laws' },
                    { path: '/dashboard/resolutions', icon: <Gavel size={15} />,    label: 'Resolutions',           desc: 'Formal expressions of policy' },
                    { path: '/dashboard/sessions',   icon: <BookOpen size={15} />,  label: 'Session Minutes',       desc: 'Records of proceedings' },
                    { path: '/dashboard/localcode',  icon: <Scale size={15} />,     label: 'Local Government Code', desc: 'RA 7160 reference' },
                    { path: '/dashboard/rules',      icon: <ClipboardList size={15} />, label: 'Internal Rules',    desc: 'Rules of procedure' },
                  ].map(item => (
                    <button key={item.path} className={styles.dropItem} onClick={() => go(item.path)}>
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

            {/* Council Members */}
            <button
              className={`${styles.navLink} ${path === '/dashboard/council' ? styles.navLinkActive : ''}`}
              onClick={() => go('/dashboard/council')}>
              Council Members
            </button>

            {/* Announcements */}
            <button
              className={`${styles.navLink} ${path === '/dashboard/announcements' ? styles.navLinkActive : ''}`}
              onClick={() => go('/dashboard/announcements')}>
              Announcements
              {activeAnn.length > 0 && <span className={styles.navBadge}>{activeAnn.length}</span>}
            </button>
          </nav>

          {/* Right side */}
          <div className={styles.navRight}>
            <button className={styles.navSearchBtn} onClick={() => go('/dashboard/search')}>
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
              { path: '/dashboard/home',          label: 'Home' },
              { path: '/dashboard/ordinances',    label: 'Ordinances' },
              { path: '/dashboard/resolutions',   label: 'Resolutions' },
              { path: '/dashboard/sessions',      label: 'Session Minutes' },
              { path: '/dashboard/localcode',     label: 'Local Government Code' },
              { path: '/dashboard/rules',         label: 'Internal Rules' },
              { path: '/dashboard/council',       label: 'Council Members' },
              { path: '/dashboard/announcements', label: `Announcements${activeAnn.length > 0 ? ` (${activeAnn.length})` : ''}` },
              { path: '/dashboard/search',        label: 'Search' },
            ].map(item => (
              <button
                key={item.path}
                className={`${styles.mobileMenuItem} ${path === item.path ? styles.mobileMenuActive : ''}`}
                onClick={() => go(item.path)}>
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

      {/* ── PAGE CONTENT (child routes render here) ── */}
      <main className={styles.pageContent}>
        <Outlet />
      </main>

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
              { label: 'Ordinances',     path: '/dashboard/ordinances' },
              { label: 'Resolutions',    path: '/dashboard/resolutions' },
              { label: 'Session Minutes', path: '/dashboard/sessions' },
              { label: 'Council Members', path: '/dashboard/council' },
              { label: 'Announcements',  path: '/dashboard/announcements' },
            ].map(l => (
              <button key={l.path} className={styles.footerLink} onClick={() => go(l.path)}>{l.label}</button>
            ))}
          </div>
          <div className={styles.footerCopy}>
            © {new Date().getFullYear()} Sangguniang Bayan ng Balilihan. All rights reserved.
          </div>
        </div>
      </footer>

      {/* ── Official profile modal ── */}
      {selectedOfficial && (() => {
        const o = selectedOfficial
        const passed = ordinances.filter(ord => ord.officials?.some(x => x.id === o.id))
        return (
          <div
            className={styles.modalOverlay}
            onClick={e => { if (e.target === e.currentTarget) setSelectedOfficial(null) }}>
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
                    <ClipList size={14} /> Ordinances Passed ({passed.length})
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

// ─── Default export wraps everything in the provider ─────────────────────────
export default function UserDashboard() {
  return (
    <DashboardProvider>
      <DashboardLayout />
    </DashboardProvider>
  )
}
