import { useNavigate } from 'react-router-dom'
import {
  Shield, Users, ScrollText, Gavel, BookOpen, Scale,
  MapPin, Phone, Mail, Globe, ExternalLink, ChevronRight,
  Landmark, FileText, ClipboardList, Star,
} from 'lucide-react'
import logo from '../assets/image/balilihan-logo-Large-1.png'
import styles from './Userdashboard.module.css'

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <div className={styles.innerPage}>

      {/* ── Hero ── */}
      <div className={styles.pageHero} style={{ background: 'linear-gradient(135deg, #1a365d 0%, #009439 100%)' }}>
        <Shield size={32} strokeWidth={1.2} style={{ color: 'rgba(255,255,255,0.7)' }} />
        <div>
          <h1 className={styles.pageHeroTitle}>About the Office</h1>
          <p className={styles.pageHeroSub}>Sangguniang Bayan ng Balilihan, Bohol</p>
        </div>
      </div>

      <div className={styles.pageBody}>

        {/* ── Overview ── */}
        <div className={styles.infoBlock}>
          <div className={styles.infoBlockIcon}>
            <img src={logo} alt="Balilihan Seal" style={{ width: 72, height: 72, objectFit: 'contain' }} />
          </div>
          <div>
            <h2 className={styles.infoBlockTitle}>Office of the Sangguniang Bayan</h2>
            <p className={styles.infoBlockText}>
              The Sangguniang Bayan of Balilihan, Bohol is the official legislative body of the local
              government of the municipality, vested with the authority to formulate, review, and enact
              laws, ordinances, and resolutions that promote the welfare and development of its people.
              It is committed to upholding effective, transparent, and peaceful governance in pursuit of
              the sustainable progress of Balilihan.
            </p>
            <div style={{ marginTop: 12, fontStyle: 'italic', color: '#009439', fontWeight: 600, fontSize: 14 }}>
              "Serbisyong tinuoray, alang sa malinawong Balilihan."
            </div>
          </div>
        </div>

        {/* ── Mission & Vision ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 36 }}>
          <div style={{
            background: 'linear-gradient(135deg, #f0fff4, #c6f6d5)',
            border: '1px solid #9ae6b4',
            borderRadius: 12,
            padding: '28px 24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ background: '#009439', borderRadius: 8, padding: 8, display: 'flex' }}>
                <Star size={18} color="white" strokeWidth={1.5} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#276749', margin: 0 }}>Mission</h3>
            </div>
            <p style={{ fontSize: 14, color: '#2d6a4f', lineHeight: 1.7, margin: 0 }}>
              To enact responsive, inclusive, and people-centered legislation that addresses the needs
              of every Balilinhanon, foster transparent and accountable governance, and actively engage
              the community in the legislative process for the common good.
            </p>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #ebf8ff, #bee3f8)',
            border: '1px solid #90cdf4',
            borderRadius: 12,
            padding: '28px 24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ background: '#1a365d', borderRadius: 8, padding: 8, display: 'flex' }}>
                <Landmark size={18} color="white" strokeWidth={1.5} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a365d', margin: 0 }}>Vision</h3>
            </div>
            <p style={{ fontSize: 14, color: '#2c5282', lineHeight: 1.7, margin: 0 }}>
              A progressive and harmonious Balilihan governed by a principled, capable, and servant-hearted
              legislative body that upholds the rule of law, champions social equity, and drives sustainable
              development for present and future generations.
            </p>
          </div>
        </div>

        {/* ── Powers & Functions ── */}
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a202c', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ClipboardList size={20} style={{ color: '#009439' }} /> Powers &amp; Functions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            {[
              { icon: <ScrollText size={18} />, title: 'Enact Ordinances', desc: 'Formulate and pass local laws governing the municipality of Balilihan.' },
              { icon: <Gavel size={18} />, title: 'Pass Resolutions', desc: 'Adopt formal expressions of policy, sentiments, or requests on matters of public concern.' },
              { icon: <BookOpen size={18} />, title: 'Hold Sessions', desc: 'Conduct regular and special sessions to deliberate on legislation and local governance matters.' },
              { icon: <Scale size={18} />, title: 'Appropriate Funds', desc: 'Authorize the annual budget and supplemental appropriations for municipal programs and services.' },
              { icon: <Users size={18} />, title: 'Represent Constituents', desc: 'Act as the voice of the people of Balilihan in shaping policies that affect their daily lives.' },
              { icon: <FileText size={18} />, title: 'Committee Oversight', desc: 'Review and investigate matters within its jurisdiction through standing and special committees.' },
            ].map(f => (
              <div key={f.title} style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '18px 20px',
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
              }}>
                <div style={{
                  background: '#f0fff4',
                  border: '1px solid #9ae6b4',
                  borderRadius: 8,
                  padding: 8,
                  color: '#009439',
                  flexShrink: 0,
                  display: 'flex',
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1a202c', marginBottom: 4 }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: '#718096', lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── History of Balilihan ── */}
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a202c', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Landmark size={20} style={{ color: '#009439' }} /> Background &amp; History
          </h2>
          <div style={{
            background: '#fffbeb',
            border: '1px solid #f6e05e',
            borderRadius: 12,
            padding: '24px 28px',
            lineHeight: 1.8,
            fontSize: 14,
            color: '#4a5568',
          }}>
            <p style={{ margin: '0 0 14px' }}>
              <strong style={{ color: '#1a202c' }}>Balilihan</strong> is a municipality in the province of Bohol,
              Philippines, located approximately 22 kilometres northeast of Tagbilaran City. It is said to have
              been named after the grass <em>"balili"</em> which once grew in abundance across its landscape —
              a panorama of verdant hills, rugged mountains, and green fields.
            </p>
            <p style={{ margin: '0 0 14px' }}>
              Before the 19th century, Balilihan was a barrio of Baclayon. On <strong>September 29, 1828</strong>,
              the Spanish government formally separated it from Baclayon and established it as an independent
              municipality — a milestone the town continues to celebrate every last week of September.
            </p>
            <p style={{ margin: 0 }}>
              The Sangguniang Bayan, as the legislative arm of the Local Government Unit, carries forward this
              legacy of community-driven governance — translating the needs and aspirations of Balilihan's
              <strong> 19,747 constituents</strong> (2024 census) into concrete legislative action under the
              Local Government Code of 1991 (RA 7160).
            </p>
          </div>
        </div>

        {/* ── Secretary ── */}
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a202c', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={20} style={{ color: '#009439' }} /> Office Personnel
          </h2>
          <div style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 18,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1a365d, #009439)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: 20, flexShrink: 0,
            }}>L</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1a202c' }}>Lita Lim</div>
              <div style={{ fontSize: 13, color: '#718096', marginTop: 2 }}>Secretary of the Sangguniang Bayan</div>
            </div>
          </div>
        </div>

        {/* ── Contact & Location ── */}
        <div style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a202c', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={20} style={{ color: '#009439' }} /> Contact &amp; Location
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {[
              { icon: <MapPin size={16} />, label: 'Address', value: 'Municipal Hall, Balilihan, Bohol, Philippines' },
              { icon: <Globe size={16} />, label: 'Website', value: 'www.balilihan.gov.ph', link: 'https://www.balilihan.gov.ph' },
              { icon: <Mail size={16} />, label: 'Email', value: 'info@balilihan.gov.ph' },
              { icon: <Phone size={16} />, label: 'Contact', value: 'Available at the Municipal Hall' },
            ].map(c => (
              <div key={c.label} style={{
                background: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '16px 18px',
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
              }}>
                <div style={{ color: '#009439', marginTop: 2, flexShrink: 0 }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: 11, color: '#a0aec0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{c.label}</div>
                  {c.link
                    ? <a href={c.link} target="_blank" rel="noreferrer"
                        style={{ fontSize: 13, color: '#009439', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {c.value} <ExternalLink size={11} />
                      </a>
                    : <div style={{ fontSize: 13, color: '#2d3748', fontWeight: 500 }}>{c.value}</div>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Quick Links ── */}
        <div style={{
          background: 'linear-gradient(135deg, #1a365d 0%, #009439 100%)',
          borderRadius: 14,
          padding: '28px 32px',
          color: 'white',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 18px', opacity: 0.95 }}>Explore Legislative Records</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {[
              { label: 'Ordinances',    path: '/dashboard/ordinances' },
              { label: 'Resolutions',   path: '/dashboard/resolutions' },
              { label: 'Session Minutes', path: '/dashboard/sessions' },
              { label: 'Council Members', path: '/dashboard/council' },
              { label: 'Announcements', path: '/dashboard/announcements' },
            ].map(l => (
              <button key={l.path} onClick={() => navigate(l.path)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 8,
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '8px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
              >
                {l.label} <ChevronRight size={13} />
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
