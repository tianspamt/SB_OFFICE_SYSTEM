import { useState } from "react";
import { Search, X, Filter, Trash2, CalendarDays, ClipboardList, History } from "lucide-react";
import styles from "./AdminDashboard.module.css";
import { TermStatusBadge } from "./AdminComponents";

export default function OfficialsPage({ officials, ordinances, setDeleteTarget, onViewProfile }) {
  const [officialSearch, setOfficialSearch] = useState("");
  const [officialPositionFilter, setOfficialPositionFilter] = useState("all");

  const uniquePositions = ["all", ...new Set(officials.map((o) => o.position).filter(Boolean))];

  const filteredOfficials = officials.filter((o) => {
    const s = o.full_name.toLowerCase().includes(officialSearch.toLowerCase()) ||
      o.position.toLowerCase().includes(officialSearch.toLowerCase());
    const p = officialPositionFilter === "all" ? true : o.position === officialPositionFilter;
    return s && p;
  });

  const getOfficialOrdinances = (id) =>
    ordinances.filter((o) => o.officials && o.officials.some((x) => x.id === id));

  return (
    <>
      <div className={styles.statsRow}>
        <div className={styles.statCard}><div className={styles.statNumber}>{officials.length}</div><div className={styles.statLabel}>Total Members</div></div>
        <div className={`${styles.statCard} ${styles.statCardGreen}`}><div className={styles.statNumber}>{officials.filter((o) => o.term_status === "active").length}</div><div className={styles.statLabel}>Active Terms</div></div>
        <div className={`${styles.statCard} ${styles.statCardOrange}`}><div className={styles.statNumber}>{officials.filter((o) => o.term_status === "terms_ended").length}</div><div className={styles.statLabel}>Terms Ended</div></div>
      </div>
      <div className={styles.searchFilterBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input className={styles.searchInput} placeholder="Search by name or position..." value={officialSearch} onChange={(e) => setOfficialSearch(e.target.value)} />
          {officialSearch && <button className={styles.clearSearch} onClick={() => setOfficialSearch("")}><X size={14} /></button>}
        </div>
        <div className={styles.filterGroup}>
          <Filter size={15} className={styles.filterIcon} />
          <select className={styles.filterSelect} value={officialPositionFilter} onChange={(e) => setOfficialPositionFilter(e.target.value)}>
            {uniquePositions.map((p) => <option key={p} value={p}>{p === "all" ? "All Positions" : p}</option>)}
          </select>
        </div>
      </div>
      <div className={styles.searchResultCount}>Showing {filteredOfficials.length} of {officials.length} council members</div>
      <div className={styles.officialsGrid}>
        {filteredOfficials.map((o) => (
          <div key={o.id} className={styles.officialCard}>
            <button className={styles.officialCardInner} onClick={() => onViewProfile(o)}>
              {o.photo ? <img src={o.photo} alt={o.full_name} className={styles.officialImg} /> : <div className={styles.officialAvatar}>{o.full_name.charAt(0)}</div>}
              <div className={styles.officialName}>{o.full_name}</div>
              <div className={styles.officialPosition}>{o.position}</div>
              <div style={{ margin: "4px 0" }}>
                <TermStatusBadge status={o.term_status} />
              </div>
              {o.term_period && (
                <div className={styles.officialTerm}><CalendarDays size={12} strokeWidth={1.5} /> {o.term_period}</div>
              )}
              <div className={styles.ordinanceCount}><ClipboardList size={12} strokeWidth={1.5} /> {getOfficialOrdinances(o.id).length} ordinance{getOfficialOrdinances(o.id).length !== 1 ? "s" : ""} passed</div>
              <div style={{ fontSize: 11, color: "#718096", marginTop: 2 }}>
                <History size={11} strokeWidth={1.5} style={{ display: "inline", marginRight: 3 }} />
                {(o.terms || []).length} term record{(o.terms || []).length !== 1 ? "s" : ""}
              </div>
            </button>
            <button className={styles.deleteBtn} onClick={() => setDeleteTarget({ id: o.id, type: "official", name: o.full_name })}><Trash2 size={13} /> Delete</button>
          </div>
        ))}
        {filteredOfficials.length === 0 && <div className={styles.empty}>{officialSearch || officialPositionFilter !== "all" ? "No council members match your search." : "No council members added yet."}</div>}
      </div>
    </>
  );
}
