/**
 * LegislativeComponents.jsx
 * Shared presentational components used by OrdinancesPage/ResolutionsPage/
 * SessionsPage — those pages own the actual data-fetching and backend calls.
 */

import { useEffect, useRef } from "react";
import { Search, Filter, X, Download } from "lucide-react";
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
        <div className={styles.filterField}>
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
        </div>
      )}

      {onYearChange && (
        <div className={styles.filterField}>
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
        </div>
      )}

      <div className={styles.filterField}>
        <span className={styles.filterLabel}>Date:</span>
        <input
          className={styles.filterDate}
          type="date"
          value={dateValue}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>

      {onAuthorChange && (
        <div className={styles.filterField}>
          <span className={styles.filterLabel}>Author:</span>
          <input
            className={styles.filterDate}
            type="text"
            placeholder="Search author..."
            value={authorValue}
            onChange={(e) => onAuthorChange(e.target.value)}
          />
        </div>
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

// ─── PRESENT OVERLAY ─────────────────────────────────────────────────────────
// Full-screen, projector-friendly display for one record — shared by
// Ordinances/Resolutions/SessionsPage/SessionAgendaPage's "Present" buttons.
// Pass `record` (needs filetype + filepath, e.g. a straight ordinance/
// resolution/agenda row) for a file-based record, or `textContent` for a
// Session Minutes row that has no uploaded file, only typed agenda/minutes
// text — exactly one of the two should be given.
//
// PDFs and images render natively in an iframe/img; Word docs can't be
// rendered by the browser at all, so those go through Microsoft's public
// Office Online viewer, which needs the file's (already publicly-reachable,
// since it lives in the public Supabase bucket) URL and an internet
// connection at presentation time — worth knowing before relying on it in a
// room with no signal.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const presentFileUrl = (filepath) =>
  `${SUPABASE_URL}/storage/v1/object/public/assets/${filepath}`;

export function PresentOverlay({ record, textContent, onClose }) {
  const containerRef = useRef(null);

  // Fullscreen is requested on mount rather than by the triggering "Present"
  // button's own click handler — Firefox and Safari require the call to
  // happen synchronously within a user-gesture handler, but React's render
  // cycle means the overlay element doesn't exist yet at click time, only a
  // tick later once this effect runs. In practice that tick is still inside
  // the same gesture window in every browser tested; if a browser ever
  // rejects it, the catch below just leaves the overlay maximized-but-not-
  // truly-fullscreen instead of throwing.
  useEffect(() => {
    const el = containerRef.current;
    el?.requestFullscreen?.().catch(() => {});
    const handleFsChange = () => {
      if (!document.fullscreenElement) onClose();
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExit = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    onClose();
  };

  const filetype = record?.filetype || "";
  const isPdf = filetype === "application/pdf";
  const isWord =
    filetype === "application/msword" ||
    filetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const isImage = filetype.startsWith("image/");
  const fileUrl = record?.filepath ? presentFileUrl(record.filepath) : null;

  const exitBtnStyle = {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "10px 16px",
    background: "rgba(17,24,39,0.85)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    fontSize: 13,
    cursor: "pointer",
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        background: "#111827",
        zIndex: 10000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <button onClick={handleExit} style={exitBtnStyle}>
        <X size={14} /> Exit Presentation
      </button>

      {fileUrl && isPdf && (
        <iframe
          title="Present PDF"
          src={`${fileUrl}#toolbar=0&navpanes=0`}
          style={{ flex: 1, border: "none", background: "#fff" }}
        />
      )}

      {fileUrl && isWord && (
        <>
          <iframe
            title="Present Word Document"
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
            style={{ flex: 1, border: "none", background: "#fff" }}
          />
          <a
            href={fileUrl}
            download
            style={{
              position: "absolute",
              bottom: 16,
              right: 16,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              background: "rgba(17,24,39,0.85)",
              color: "#fff",
              borderRadius: 8,
              fontSize: 12,
              textDecoration: "none",
            }}
          >
            <Download size={12} /> Trouble viewing? Download instead
          </a>
        </>
      )}

      {fileUrl && isImage && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <img
            src={fileUrl}
            alt="Presented document"
            style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
          />
        </div>
      )}

      {!fileUrl && textContent && (
        <div style={{ flex: 1, overflowY: "auto", background: "#fff", padding: "60px 100px", color: "#111" }}>
          {textContent.eyebrow && (
            <div style={{ fontSize: 15, letterSpacing: 2, textTransform: "uppercase", color: "#64748b", marginBottom: 10 }}>
              {textContent.eyebrow}
            </div>
          )}
          <h1 style={{ fontSize: 40, margin: "0 0 20px", color: "#1a365d" }}>{textContent.title}</h1>
          {textContent.meta && (
            <div style={{ fontSize: 20, color: "#4a5568", marginBottom: 44, paddingBottom: 24, borderBottom: "2px solid #e2e8f0" }}>
              {textContent.meta}
            </div>
          )}
          {textContent.agenda?.length > 0 && (
            <>
              <h2 style={{ fontSize: 24, color: "#1a365d", borderBottom: "2px solid #1a365d", paddingBottom: 8, marginBottom: 22 }}>
                Agenda
              </h2>
              <ol style={{ fontSize: 24, lineHeight: 2, paddingLeft: 32, marginBottom: 44 }}>
                {textContent.agenda.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            </>
          )}
          {textContent.minutes && (
            <>
              <h2 style={{ fontSize: 24, color: "#1a365d", borderBottom: "2px solid #1a365d", paddingBottom: 8, marginBottom: 22 }}>
                Minutes
              </h2>
              <div style={{ fontSize: 20, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{textContent.minutes}</div>
            </>
          )}
          {!textContent.agenda?.length && !textContent.minutes && (
            <div style={{ fontSize: 18, color: "#94a3b8" }}>Nothing recorded yet for this session.</div>
          )}
        </div>
      )}

      {!fileUrl && !textContent && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18 }}>
          Nothing to present for this record.
        </div>
      )}
    </div>
  );
}
