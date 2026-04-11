import { Search, X } from 'lucide-react'
import styles from './Userdashboard.module.css'

export default function SearchBar({ placeholder, years, search, setSearch, yearFilter, setYearFilter }) {
  return (
    <div className={styles.searchBar}>
      <div className={styles.searchWrap}>
        <Search size={16} className={styles.searchIco} />
        <input
          className={styles.searchInput}
          placeholder={placeholder}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className={styles.clearBtn} onClick={() => setSearch('')}>
            <X size={14} />
          </button>
        )}
      </div>
      {years && (
        <select
          className={styles.yearSel}
          value={yearFilter}
          onChange={e => setYearFilter(e.target.value)}
        >
          {years.map(y => (
            <option key={y} value={y}>{y === 'all' ? 'All Years' : y}</option>
          ))}
        </select>
      )}
    </div>
  )
}
