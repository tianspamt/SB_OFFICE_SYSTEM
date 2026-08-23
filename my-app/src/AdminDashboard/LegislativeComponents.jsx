/**
 * LegislativeComponents.jsx
 * Shared presentational components used by OrdinancesPage/ResolutionsPage/
 * SessionsPage — those pages own the actual data-fetching and backend calls.
 */

import { Search, Filter, X } from "lucide-react";
import styles from "./LegislativeModule.module.css";
// Shares its shimmer classes (.skeleton / .skeletonSolid) with the
// Users/Admins/Archives tables instead of redefining the animation here.
import dashStyles from "./AdminDashboard.module.css";

// ─── STATUS BADGE ────────────────────────────────────────────────────────────

export function StatusBadge({ status }) {
  const map = {
    pending: { label: "● Pending Review", cls: styles.statusPending },
    needs_revision: { label: "Needs Revision", cls: styles.statusRejected },
    ready_to_publish: { label: "Ready to Publish", cls: styles.statusApproved },
    approved: { label: "VM Approved", cls: styles.statusApproved },
    published: { label: "● Published", cls: styles.statusPublished },
  };
  const s = map[status] || map.pending;
  return <span className={`${styles.statusBadge} ${s.cls}`}>{s.label}</span>;
}

// ─── TAB NAVIGATION ──────────────────────────────────────────────────────────

export function TabNavigation({ tabs, activeTab, onTabChange }) {
  return (
    <div className={styles.tabRow}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.tabBtn} ${
            activeTab === tab.id ? styles.tabBtnActive : ""
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
          {tab.badge > 0 && (
            <span className={styles.tabBadge}>{tab.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── SEARCH BAR ──────────────────────────────────────────────────────────────

export function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className={styles.searchInputWrap}>
      <Search size={14} className={styles.searchIcon} />
      <input
        className={styles.searchInput}
        type="text"
        placeholder={placeholder || "Search..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button className={styles.searchClear} onClick={() => onChange("")}>
          <X size={13} />
        </button>
      )}
    </div>
  );
}

// ─── FILTER PANEL ────────────────────────────────────────────────────────────

export function FilterPanel({
  categories,
  categoryValue,
  onCategoryChange,
  dateValue,
  onDateChange,
  authorValue,
  onAuthorChange,
  yearValue,
  onYearChange,
  years,
  onReset,
}) {
  return (
    <div className={styles.filterRow}>
      <Filter size={14} className={styles.filterIcon} />

      {categories && (
        <>
          <span className={styles.filterLabel}>Category:</span>
          <select
            className={styles.filterSelect}
            value={categoryValue}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </>
      )}

      {onYearChange && (
        <>
          <span className={styles.filterLabel}>Year:</span>
          <select
            className={styles.filterSelect}
            value={yearValue || "all"}
            onChange={(e) => onYearChange(e.target.value)}
          >
            <option value="all">All Years</option>
            {(years || []).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </>
      )}

      <span className={styles.filterLabel}>Date:</span>
      <input
        className={styles.filterDate}
        type="date"
        value={dateValue}
        onChange={(e) => onDateChange(e.target.value)}
      />

      {onAuthorChange && (
        <>
          <span className={styles.filterLabel}>Author:</span>
          <input
            className={styles.filterDate}
            type="text"
            placeholder="Search author..."
            value={authorValue}
            onChange={(e) => onAuthorChange(e.target.value)}
            style={{ width: 140 }}
          />
        </>
      )}

      <div className={styles.filterActions}>
        <button className={`${styles.btn} ${styles.btnSm}`} onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

export function EmptyState({ icon = "📭", title, text }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>{icon}</div>
      <div className={styles.emptyTitle}>{title}</div>
      {text && <div className={styles.emptyText}>{text}</div>}
    </div>
  );
}

// ─── STATS ROW ────────────────────────────────────────────────────────────────

export function StatsRow({ stats, loading = false }) {
  return (
    <div className={styles.statsRow}>
      {stats.map((s, i) => (
        <div key={i} className={`${styles.statCard} ${s.colorClass || ""}`}>
          <div className={styles.statNum}>
            {loading ? (
              <span
                className={dashStyles.skeletonSolid}
                style={{ display: "inline-block", height: 28, width: 44 }}
              />
            ) : (
              s.value
            )}
          </div>
          <div className={styles.statLbl}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── RECORD LIST SKELETON ───────────────────────────────────────────────────
// Placeholder cards shaped exactly like .recordCard (icon + code/title/meta
// + actions) so the list doesn't jump around once real data replaces it.
// Used for both the Published tab's initial load and the Pending tab's own
// fetch, in Ordinances/Resolutions/Sessions.
export function RecordListSkeleton({ count = 4 }) {
  return (
    <div className={styles.recordList}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={styles.recordCard}>
          <div className={styles.recordIcon}>
            <div className={dashStyles.skeleton} style={{ width: 20, height: 20, borderRadius: 5 }} />
          </div>
          <div className={styles.recordBody}>
            <div className={dashStyles.skeleton} style={{ height: 10, width: 80, borderRadius: 4, marginBottom: 7 }} />
            <div className={dashStyles.skeleton} style={{ height: 14, width: "55%", borderRadius: 4, marginBottom: 9 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <div className={dashStyles.skeleton} style={{ height: 11, width: 72, borderRadius: 4 }} />
              <div className={dashStyles.skeleton} style={{ height: 11, width: 96, borderRadius: 4 }} />
            </div>
          </div>
          <div className={styles.recordActions}>
            <div className={dashStyles.skeleton} style={{ height: 26, width: 76, borderRadius: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
