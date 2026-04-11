import { useNavigate } from 'react-router-dom'
import {
  ScrollText, Gavel, BookOpen, Scale, ClipboardList,
  Users, Search, CalendarDays, Megaphone, ChevronRight, ArrowRight,
} from 'lucide-react'
import { useDashboard, PRIORITY } from './DashboardContext'
import DocCard from './DocCard'
import logo from '../assets/image/balilihan-logo-Large-1.png'
import styles from './Userdashboard.module.css'

export default function HomePage() {
  const { ordinances, resolutions, sessionMinutes, officials, activeAnn } = useDashboard()
  const navigate = useNavigate()

  return (
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
              <button className={styles.heroBtnPrimary} onClick={() => navigate('/dashboard/ordinances')}>
                <ScrollText size={16} /> Browse Ordinances
              </button>
              <button className={styles.heroBtnSecondary} onClick={() => navigate('/dashboard/search')}>
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
            { n: ordinances.length,     label: 'Ordinances',     icon: <ScrollText size={18} />, path: '/dashboard/ordinances' },
            { n: resolutions.length,    label: 'Resolutions',    icon: <Gavel size={18} />,      path: '/dashboard/resolutions' },
            { n: sessionMinutes.length, label: 'Sessions',       icon: <BookOpen size={18} />,   path: '/dashboard/sessions' },
            { n: officials.length,      label: 'Council Members', icon: <Users size={18} />,     path: '/dashboard/council' },
          ].map(s => (
            <button key={s.label} className={styles.statItem} onClick={() => navigate(s.path)}>
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
              <button className={styles.seeAllBtn} onClick={() => navigate('/dashboard/announcements')}>
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
            <button className={styles.seeAllBtn} onClick={() => navigate('/dashboard/ordinances')}>
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
              { icon: <ScrollText size={24} />, label: 'Ordinances',       desc: 'Browse enacted local laws',           path: '/dashboard/ordinances' },
              { icon: <Gavel size={24} />,      label: 'Resolutions',      desc: 'Formal policy expressions',           path: '/dashboard/resolutions' },
              { icon: <BookOpen size={24} />,   label: 'Session Minutes',  desc: 'Records of legislative sessions',     path: '/dashboard/sessions' },
              { icon: <Scale size={24} />,      label: 'Local Gov. Code',  desc: 'RA 7160 reference guide',             path: '/dashboard/localcode' },
              { icon: <ClipboardList size={24} />, label: 'Internal Rules', desc: 'Rules of procedure',                path: '/dashboard/rules' },
              { icon: <Users size={24} />,      label: 'Council Members',  desc: 'Meet your representatives',           path: '/dashboard/council' },
            ].map(q => (
              <button key={q.path} className={styles.quickCard} onClick={() => navigate(q.path)}>
                <div className={styles.quickIcon}>{q.icon}</div>
                <div className={styles.quickLabel}>{q.label}</div>
                <div className={styles.quickDesc}>{q.desc}</div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
