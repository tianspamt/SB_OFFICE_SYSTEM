import { Eye, FileText, Image as ImageIcon, CalendarDays } from 'lucide-react'
import { useDashboard } from './DashboardContext'
import styles from './Userdashboard.module.css'

export default function DocCard({ item, numberKey, type }) {
  const { API, setSelectedOfficial } = useDashboard()
  const isPdf = item.filetype === 'application/pdf'
  const url = item.extracted_text
    ? `${API}/api/${type}/${item.id}/print`
    : item.filepath

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
