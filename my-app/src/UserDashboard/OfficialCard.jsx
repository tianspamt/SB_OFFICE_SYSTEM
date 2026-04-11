import { CalendarDays } from 'lucide-react'
import { useDashboard } from './DashboardContext'
import styles from './Userdashboard.module.css'

export default function OfficialCard({ o }) {
  const { setSelectedOfficial } = useDashboard()
  return (
    <button className={styles.officialCard} onClick={() => setSelectedOfficial(o)}>
      {o.photo
        ? <img src={o.photo} alt={o.full_name} className={styles.offImg} />
        : <div className={styles.offAva}>{o.full_name.charAt(0)}</div>}
      <div className={styles.offName}>{o.full_name}</div>
      <div className={styles.offPos}>{o.position}</div>
      <div className={styles.offTerm}><CalendarDays size={10} /> {o.term_period}</div>
    </button>
  )
}
