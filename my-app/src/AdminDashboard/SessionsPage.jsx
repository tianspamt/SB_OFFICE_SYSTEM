import { useState } from "react";
import { Search, X, Filter, Eye, Pencil, Trash2, CalendarDays, Printer } from "lucide-react";
import styles from "./AdminDashboard.module.css";
import { API, MONTHS } from "./AdminContext";

export default function SessionsPage({ sessionMinutes, setDeleteTarget, onEdit }) {
  const [minutesSearch, setMinutesSearch] = useState("");
  const [minutesTypeFilter, setMinutesTypeFilter] = useState("all");
  const [minutesYearFilter, setMinutesYearFilter] = useState("all");

  const minutesYears = ["all", ...new Set(
    sessionMinutes.map((s) => s.session_date ? new Date(s.session_date).getFullYear().toString() : null).filter(Boolean),
  )].sort((a, b) => b - a);

  const filteredMinutes = sessionMinutes.filter((s) => {
    const ms = (s.session_number || "").toLowerCase().includes(minutesSearch.toLowerCase()) ||
      (s.venue || "").toLowerCase().includes(minutesSearch.toLowerCase()) ||
      (s.agenda || "").toLowerCase().includes(minutesSearch.toLowerCase());
    const t = minutesTypeFilter === "all" ? true : s.session_type === minutesTypeFilter;
    const y = minutesYearFilter === "all" ? true :
      s.session_date && new Date(s.session_date).getFullYear().toString() === minutesYearFilter;
    return ms && t && y;
  });

  return (
    <>
      <div className={styles.statsRow}>
        <div className={styles.statCard}><div className={styles.statNumber}>{sessionMinutes.length}</div><div className={styles.statLabel}>Total Sessions</div></div>
        <div className={`${styles.statCard} ${styles.statCardGreen}`}><div className={styles.statNumber}>{sessionMinutes.filter((s) => s.session_type === "regular").length}</div><div className={styles.statLabel}>Regular Sessions</div></div>
        <div className={`${styles.statCard} ${styles.statCardOrange}`}><div className={styles.statNumber}>{sessionMinutes.filter((s) => s.session_type === "special").length}</div><div className={styles.statLabel}>Special Sessions</div></div>
      </div>
      <div className={styles.searchFilterBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input className={styles.searchInput} placeholder="Search by session number, venue, or agenda..." value={minutesSearch} onChange={(e) => setMinutesSearch(e.target.value)} />
          {minutesSearch && <button className={styles.clearSearch} onClick={() => setMinutesSearch("")}><X size={14} /></button>}
        </div>
        <div className={styles.filterGroup}>
          <Filter size={15} className={styles.filterIcon} />
          {["all", "regular", "special"].map((t) => (
            <button key={t} className={`${styles.filterBtn} ${minutesTypeFilter === t ? styles.filterBtnActive : ""}`} onClick={() => setMinutesTypeFilter(t)}>
              {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <select className={styles.filterSelect} value={minutesYearFilter} onChange={(e) => setMinutesYearFilter(e.target.value)}>
            {minutesYears.map((y) => <option key={y} value={y}>{y === "all" ? "All Years" : y}</option>)}
          </select>
        </div>
      </div>
      <div className={styles.searchResultCount}>Showing {filteredMinutes.length} of {sessionMinutes.length} sessions</div>
      <div className={styles.sessionList}>
        {filteredMinutes.map((s) => {
          const date = s.session_date ? new Date(s.session_date + "T00:00:00") : null;
          const agendaPreview = s.agenda ? s.agenda.split("\n").filter(Boolean).slice(0, 3) : [];
          return (
            <div key={s.id} className={styles.sessionCard}>
              <div className={styles.sessionDateBlock}>
                {date && !isNaN(date.getTime()) ? (
                  <><div className={styles.sessionMonth}>{MONTHS[date.getMonth()]}</div><div className={styles.sessionDay}>{String(date.getDate())}</div><div className={styles.sessionYear}>{String(date.getFullYear())}</div></>
                ) : <div className={styles.sessionDay}>—</div>}
              </div>
              <div className={styles.sessionInfo}>
                <div className={styles.sessionTop}>
                  <span className={`${styles.sessionTypeBadge} ${s.session_type === "special" ? styles.sessionTypeSpecial : styles.sessionTypeRegular}`}>
                    {s.session_type === "special" ? "Special Session" : "Regular Session"}
                  </span>
                  {s.session_number && <span className={styles.sessionNumber}>{s.session_number}</span>}
                </div>
                {s.venue && <div className={styles.sessionVenue}><CalendarDays size={12} strokeWidth={1.5} /> {s.venue}</div>}
                {agendaPreview.length > 0 && (
                  <div className={styles.sessionAgendaPreview}>
                    <div className={styles.sessionAgendaLabel}>Agenda:</div>
                    <ol className={styles.sessionAgendaList}>
                      {agendaPreview.map((item, i) => <li key={i}>{item}</li>)}
                      {s.agenda.split("\n").filter(Boolean).length > 3 && <li className={styles.sessionAgendaMore}>+{String(s.agenda.split("\n").filter(Boolean).length - 3)} more items</li>}
                    </ol>
                  </div>
                )}
                {s.minutes_text && <div className={styles.sessionMinutesPreview}>{s.minutes_text.length > 120 ? s.minutes_text.slice(0, 120) + "…" : s.minutes_text}</div>}
              </div>
              <div className={styles.sessionActions}>
                <a href={`${API}/api/session-minutes/${s.id}/print`} target="_blank" rel="noreferrer" className={styles.printBtn}><Printer size={13} /> Print</a>
                <a href={`${API}/api/session-minutes/${s.id}/print`} target="_blank" rel="noreferrer" className={styles.viewBtn}><Eye size={13} /> View</a>
                <button className={styles.editBtn} onClick={() => onEdit(s)}><Pencil size={13} /> Edit</button>
                <button className={styles.deleteBtn} onClick={() => setDeleteTarget({ id: s.id, type: "session", name: s.session_number || "this session" })}><Trash2 size={13} /> Delete</button>
              </div>
            </div>
          );
        })}
        {filteredMinutes.length === 0 && <div className={styles.empty}>{minutesSearch || minutesTypeFilter !== "all" || minutesYearFilter !== "all" ? "No session records match your search." : "No session minutes recorded yet."}</div>}
      </div>
    </>
  );
}
