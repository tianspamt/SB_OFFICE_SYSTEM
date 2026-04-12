import { useState } from "react";
import { Search, X, Filter, Pencil, Trash2, CalendarDays, Megaphone } from "lucide-react";
import styles from "./AdminDashboard.module.css";
import { priorityConfig } from "./AdminContext";

export default function AnnouncementsPage({ announcements, setDeleteTarget, onEdit }) {
  const [announcementSearch, setAnnouncementSearch] = useState("");
  const [announcementPriorityFilter, setAnnouncementPriorityFilter] = useState("all");

  const filteredAnnouncements = announcements.filter((a) => {
    const s = (a.title || "").toLowerCase().includes(announcementSearch.toLowerCase()) ||
      (a.body || "").toLowerCase().includes(announcementSearch.toLowerCase());
    const p = announcementPriorityFilter === "all" ? true : a.priority === announcementPriorityFilter;
    return s && p;
  });

  return (
    <>
      <div className={styles.statsRow}>
        <div className={styles.statCard}><div className={styles.statNumber}>{announcements.length}</div><div className={styles.statLabel}>Total Announcements</div></div>
        <div className={`${styles.statCard} ${styles.statCardOrange}`}><div className={styles.statNumber}>{announcements.filter((a) => a.priority === "urgent").length}</div><div className={styles.statLabel}>Urgent</div></div>
        <div className={`${styles.statCard} ${styles.statCardGreen}`}><div className={styles.statNumber}>{announcements.filter((a) => !a.expires_at || new Date(a.expires_at) >= new Date()).length}</div><div className={styles.statLabel}>Active</div></div>
      </div>
      <div className={styles.searchFilterBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input className={styles.searchInput} placeholder="Search announcements..." value={announcementSearch} onChange={(e) => setAnnouncementSearch(e.target.value)} />
          {announcementSearch && <button className={styles.clearSearch} onClick={() => setAnnouncementSearch("")}><X size={14} /></button>}
        </div>
        <div className={styles.filterGroup}>
          <Filter size={15} className={styles.filterIcon} />
          {["all", "urgent", "high", "normal", "low"].map((p) => (
            <button key={p} className={`${styles.filterBtn} ${announcementPriorityFilter === p ? styles.filterBtnActive : ""}`} onClick={() => setAnnouncementPriorityFilter(p)}>
              {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.searchResultCount}>Showing {filteredAnnouncements.length} of {announcements.length} announcements</div>
      <div className={styles.announcementList}>
        {filteredAnnouncements.map((a) => {
          const cfg = priorityConfig[a.priority] || priorityConfig.normal;
          const isExpired = a.expires_at && new Date(a.expires_at) < new Date();
          return (
            <div key={a.id} className={`${styles.announcementCard} ${isExpired ? styles.announcementExpired : ""}`}>
              <div className={styles.announcementLeft}>
                <div className={styles.announcementIconWrap} style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                  <Megaphone size={20} strokeWidth={1.5} style={{ color: cfg.color }} />
                </div>
              </div>
              <div className={styles.announcementBody}>
                <div className={styles.announcementTop}>
                  <span className={styles.announcementPriorityBadge} style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                  {isExpired && <span className={styles.expiredBadge}>Expired</span>}
                  <span className={styles.announcementDate}><CalendarDays size={11} strokeWidth={1.5} />{new Date(a.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</span>
                </div>
                <div className={styles.announcementTitle}>{a.title}</div>
                <div className={styles.announcementText}>{a.body.length > 200 ? a.body.slice(0, 200) + "…" : a.body}</div>
                {a.expires_at && (
                  <div className={styles.announcementExpiry} style={{ color: isExpired ? "#c53030" : "#718096" }}>
                    {isExpired ? "⚠ Expired" : "⏱ Expires"}: {new Date(a.expires_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                  </div>
                )}
              </div>
              <div className={styles.announcementActions}>
                <button className={styles.editBtn} onClick={() => onEdit(a)}><Pencil size={13} /> Edit</button>
                <button className={styles.deleteBtn} onClick={() => setDeleteTarget({ id: a.id, type: "announcement", name: a.title })}><Trash2 size={13} /> Delete</button>
              </div>
            </div>
          );
        })}
        {filteredAnnouncements.length === 0 && <div className={styles.empty}>{announcementSearch || announcementPriorityFilter !== "all" ? "No announcements match your search." : "No announcements yet."}</div>}
      </div>
    </>
  );
}
