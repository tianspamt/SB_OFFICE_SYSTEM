/**
 * LegislativeComponents.jsx
 * Shared presentational components used by OrdinancesPage/ResolutionsPage/
 * SessionsPage — those pages own the actual data-fetching and backend calls.
 */

import { useEffect, useRef } from "react";
import SectorSelect from "./SectorSelect";
import { Search, Filter, X, Download, UserPlus } from "lucide-react";
import styles from "./LegislativeModule.module.css";
// Shares its shimmer classes (.skeleton / .skeletonSolid) with the
// Users/Admins/Archives tables instead of redefining the animation here.
import dashStyles from "./AdminDashboard.module.css";
import { READING_STATUSES } from "./useLegislativeReview";

// ─── STATUS BADGE ────────────────────────────────────────────────────────────

const STATUS_MAP = {
  pending: { label: "● Pending Review", cls: styles.statusPending },
  needs_revision: { label: "Needs Revision", cls: styles.statusRejected },
  first_reading: { label: "First Reading", cls: styles.statusApproved },
  second_reading: { label: "Second Reading", cls: styles.statusApproved },
  third_reading: { label: "Third Reading", cls: styles.statusApproved },
  ready_to_publish: { label: "Ready to Publish", cls: styles.statusApproved },
  approved: { label: "VM Approved", cls: styles.statusApproved },
  rejected: { label: "Rejected", cls: styles.statusRejected },
  published: { label: "● Published", cls: styles.statusPublished },
};

export function StatusBadge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.pending;
  return <span className={`${styles.statusBadge} ${s.cls}`}>{s.label}</span>;
}

// Plain-text version of the same label (no pill/border) — for spots like the
// View modal's meta cards where Status needs to read like Year/Uploaded's
// plain bold text, not a colored badge.
export function statusLabel(status) {
  const s = STATUS_MAP[status] || STATUS_MAP.pending;
  return s.label.replace(/^●\s*/, "");
}

// Label for the Secretary's action button while an ordinance/resolution is
// mid-reading (see READING_STATUSES) — walks first_reading -> second_reading
// -> third_reading -> "send to the Vice-Mayor", matching what PUT
// /:id/advance-reading actually does at each step. Returns null for any
// other status, so callers can use it directly as a render guard.
export function nextReadingActionLabel(status) {
  const idx = READING_STATUSES.indexOf(status);
  if (idx === -1) return null;
  if (idx === READING_STATUSES.length - 1) return "Send for VM Approval";
  return `Mark ${statusLabel(READING_STATUSES[idx + 1])}`;
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
  // Label for the category dropdown — "Sector" for ordinances/resolutions,
  // "Type" for session minutes / order of business.
  categoryLabel = "Sector",
  categoryValue,
  onCategoryChange,
  dateValue,
  onDateChange,
  yearValue,
  onYearChange,
  years,
  // `statuses` is [{ value, label }], scoped to whatever's actually in the
  // currently active tab (e.g. Pending's own status query) rather than every
  // status that exists overall — an option for a status that can't appear in
  // the list you're looking at would just always filter to empty.
  statuses,
  statusValue,
  onStatusChange,
  onReset,
}) {
  return (
    <div className={styles.filterRow}>
      <Filter size={14} className={styles.filterIcon} />

      {categories && (
        <div className={styles.filterField}>
          <span className={styles.filterLabel}>{categoryLabel}:</span>
          <SectorSelect
            variant="filter"
            value={categoryValue}
            onChange={onCategoryChange}
            options={categories}
          />
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

      {statuses && (
        <div className={styles.filterField}>
          <span className={styles.filterLabel}>Status:</span>
          <select
            className={styles.filterSelect}
            value={statusValue || "all"}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="all">All Statuses</option>
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
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

// ─── PUBLISH NUMBER MODAL ────────────────────────────────────────────────────
// The official ordinance/resolution number used to be collected at draft-
// upload time, but nobody yet knows which draft the Vice-Mayor will approve
// first at that point, so numbers assigned then didn't line up with actual
// publish order and needed manual fixing. This collects it instead at the
// one point the order is actually known — Secretary's final Publish click —
// prefilled with a suggested next number that's still freely editable.
export function PublishNumberModal({
  label,
  placeholder,
  value,
  onChange,
  onConfirm,
  onCancel,
  submitting = false,
  error,
  // Optional second field — the record's approved date. Rendered only when
  // `onDateChange` is given.
  dateValue = "",
  onDateChange,
  // null | { status: "reading" | "done" | "error" } from
  // usePublishNumberDetection. Detected values are written straight into the
  // fields by the caller; this only drives the "reading…" placeholder while a
  // scanned document is still being read.
  detection = null,
  // Lets the user stop waiting on a slow scan and type the values themselves.
  onSkipDetection,
  // Force the number into capitals as it's typed (resolutions).
  uppercase = false,
}) {
  const reading = detection?.status === "reading";
  const found = detection?.status === "done" && (detection.data?.number || detection.data?.date);
  const notFound = detection && !reading && !found;
  // The fields are disabled while reading, which drops autoFocus — put the
  // cursor back in the number field once they're usable again.
  const numberRef = useRef(null);
  useEffect(() => {
    if (!reading) numberRef.current?.focus();
  }, [reading]);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && !submitting) onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel, submitting]);

  return (
    <>
      <style>{`
        .pnm-overlay {
          position: fixed; inset: 0;
          background: rgba(100, 100, 130, 0.25);
          backdrop-filter: blur(2px);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999;
          animation: pnmFadeIn 0.15s ease;
        }
        @keyframes pnmFadeIn { from { opacity: 0 } to { opacity: 1 } }
        .pnm-card {
          background: #fff;
          border-radius: 18px;
          padding: 28px;
          width: 100%;
          max-width: 380px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.12);
          font-family: 'Segoe UI', system-ui, sans-serif;
          animation: pnmSlideUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes pnmSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96) }
          to   { opacity: 1; transform: translateY(0)   scale(1)    }
        }
        .pnm-title { font-size: 18px; font-weight: 700; color: #1a1a2e; margin: 0 0 8px; }
        .pnm-message { font-size: 13.5px; color: #6b7280; margin: 0 0 16px; line-height: 1.5; }
        .pnm-label {
          display: block; font-size: 12px; font-weight: 600; color: #4b5563;
          margin: 10px 0 5px;
        }
        .pnm-input {
          width: 100%; box-sizing: border-box;
          padding: 11px 12px; border: 1px solid #d1d5db; border-radius: 8px;
          font-size: 14px; margin-bottom: 6px;
        }
        .pnm-input:focus { outline: none; border-color: #22c55e; }
        .pnm-input:disabled { background: #f9fafb; cursor: not-allowed; }
        .pnm-error { color: #ef4444; font-size: 12.5px; margin: 0 0 12px; }
        .pnm-status {
          display: flex; align-items: center; gap: 8px;
          font-size: 12.5px; line-height: 1.4; margin: 0 0 4px;
          padding: 9px 11px; border-radius: 8px;
        }
        .pnm-status-reading { background: #eff6ff; color: #1d4ed8; }
        .pnm-status-found { background: #f0fdf4; color: #15803d; }
        .pnm-status-none { background: #f9fafb; color: #6b7280; }
        .pnm-spinner {
          flex: none; width: 14px; height: 14px; border-radius: 50%;
          border: 2px solid #bfdbfe; border-top-color: #2563eb;
          animation: pnmSpin 0.7s linear infinite;
        }
        @keyframes pnmSpin { to { transform: rotate(360deg) } }
        .pnm-skip {
          margin-left: auto; flex: none; background: none; border: none;
          color: inherit; font-size: 12px; font-weight: 600; cursor: pointer;
          text-decoration: underline; padding: 0;
        }
        .pnm-input-reading {
          color: transparent; border-color: #e5e7eb;
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 200% 100%; animation: pnmShimmer 1.2s ease-in-out infinite;
        }
        .pnm-input-reading::-webkit-datetime-edit { color: transparent; }
        .pnm-input-reading::-webkit-calendar-picker-indicator { opacity: 0; }
        @keyframes pnmShimmer { from { background-position: 200% 0 } to { background-position: -200% 0 } }
        .pnm-actions { display: flex; gap: 10px; margin-top: 16px; }
        .pnm-btn {
          flex: 1; padding: 12px; border: none; border-radius: 10px;
          font-size: 14px; font-weight: 600; cursor: pointer;
        }
        .pnm-btn-cancel { background: #f3f4f6; color: #374151; }
        .pnm-btn-cancel:hover { background: #e5e7eb; }
        .pnm-btn-confirm { background: #22c55e; color: #fff; }
        .pnm-btn-confirm:hover { background: #16a34a; }
        .pnm-btn:disabled { opacity: 0.7; cursor: not-allowed; }
      `}</style>
      <div
        className="pnm-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget && !submitting) onCancel();
        }}
      >
        <div className="pnm-card">
          <p className="pnm-title">Publish {label}</p>
          <p className="pnm-message">
            Enter the official {label.toLowerCase()}
            {onDateChange ? " and approved date" : ""} for this record.
          </p>
          {reading && (
            <div className="pnm-status pnm-status-reading" role="status" aria-live="polite">
              <span className="pnm-spinner" aria-hidden="true" />
              <span>Reading the document to detect the number and date…</span>
              {onSkipDetection && (
                <button type="button" className="pnm-skip" onClick={onSkipDetection}>
                  Skip
                </button>
              )}
            </div>
          )}
          {found && (
            <div className="pnm-status pnm-status-found" role="status">
              Detected from the document. Please check before publishing.
            </div>
          )}
          {notFound && (
            <div className="pnm-status pnm-status-none" role="status">
              Couldn't detect a number or date in the document. Please enter them.
            </div>
          )}
          <label className="pnm-label">{label}</label>
          <input
            className={`pnm-input${reading ? " pnm-input-reading" : ""}`}
            ref={numberRef}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
            disabled={submitting || reading}
          />
          {onDateChange && (
            <>
              <label className="pnm-label">Approved date</label>
              <input
                className={`pnm-input${reading ? " pnm-input-reading" : ""}`}
                type="date"
                value={dateValue}
                onChange={(e) => onDateChange(e.target.value)}
                disabled={submitting || reading}
              />
            </>
          )}
          {error && <p className="pnm-error">{error}</p>}
          <div className="pnm-actions">
            <button
              className="pnm-btn pnm-btn-cancel"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="pnm-btn pnm-btn-confirm"
              onClick={onConfirm}
              disabled={submitting || reading}
            >
              {submitting ? "Publishing..." : "Publish"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── COUNCILOR ROLE SECTION ──────────────────────────────────────────────────
// Co-Author / Sponsor are new roles a council member can hold on an ordinance
// or resolution, alongside the existing (single) Author. Unlike Author, which
// is set at draft/upload time, these are only addable once the record has
// reached a reading stage — see helpers/officialRoleRoutes.js. Reuses the
// same viewModalCouncil* classes the Author section already renders with.
export function CouncilorRoleSection({
  title,
  members,
  canEdit,
  availableOfficials,
  selectedId,
  onSelectedIdChange,
  onAdd,
  onRemove,
  submitting,
  onAddAll,
  addingAll,
}) {
  return (
    <div className={styles.viewModalCouncilSection}>
      <div className={styles.viewModalCouncilHeader}>
        <div className={styles.viewModalCouncilTitle}>{title}</div>
        <div className={styles.viewModalCouncilCount}>
          {members.length} member{members.length !== 1 ? "s" : ""}
        </div>
      </div>
      {members.length === 0 ? (
        <p style={{ fontSize: 12, color: "#a0aec0", margin: "4px 0 8px" }}>
          None yet.
        </p>
      ) : (
        <div className={styles.viewModalCouncilGrid}>
          {members.map((m) => (
            <div key={m.id} className={styles.viewModalCouncilCard}>
              {m.photo ? (
                <img
                  src={m.photo}
                  alt={m.full_name}
                  className={styles.viewModalCouncilPhoto}
                />
              ) : (
                <div className={styles.viewModalCouncilAvatar}>
                  {m.full_name?.charAt(0)}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className={styles.viewModalCouncilName}>
                  {m.full_name}
                </div>
                <div className={styles.viewModalCouncilPosition}>
                  {m.position}
                </div>
              </div>
              {canEdit && (
                <button
                  onClick={() => onRemove(m.id)}
                  disabled={submitting}
                  title={`Remove ${m.full_name}`}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#dc2626",
                    flexShrink: 0,
                    padding: 4,
                    display: "flex",
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {canEdit && (
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <select
            value={selectedId}
            onChange={(e) => onSelectedIdChange(e.target.value)}
            style={{
              flex: 1,
              padding: "6px 8px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 12,
            }}
          >
            <option value="">Select a councilor…</option>
            {availableOfficials.map((o) => (
              <option key={o.id} value={o.id}>
                {o.full_name}
              </option>
            ))}
          </select>
          <button
            className={`${styles.btn} ${styles.btnSm} ${styles.btnSuccess}`}
            style={{ whiteSpace: "nowrap" }}
            disabled={!selectedId || submitting}
            onClick={onAdd}
          >
            <UserPlus size={13} /> Add Councilor
          </button>
        </div>
      )}
      {canEdit && onAddAll && availableOfficials.length > 0 && (
        <button
          onClick={onAddAll}
          disabled={submitting || addingAll}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#4338ca",
            fontSize: 11.5,
            fontWeight: 600,
            padding: "6px 0 0",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <UserPlus size={12} />
          {addingAll
            ? "Adding all…"
            : `Select all (${availableOfficials.length})`}
        </button>
      )}
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
  // Asked for once only, and only while the click that opened this still counts
  // as a user gesture. A browser allows one fullscreen request per click, and in
  // development React runs mount effects twice — the second request would be
  // refused with "API can only be initiated by a user gesture". Skipping it (and
  // swallowing any refusal) leaves the overlay covering the window instead.
  const askedFullscreen = useRef(false);
  useEffect(() => {
    const el = containerRef.current;
    if (!askedFullscreen.current) {
      askedFullscreen.current = true;
      const hasGesture = navigator.userActivation ? navigator.userActivation.isActive : true;
      if (hasGesture) {
        try {
          el?.requestFullscreen?.()?.catch(() => {});
        } catch {
          // Refused synchronously (older browsers) — same fallback as above.
        }
      }
    }
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
          {textContent.minutes && (
            <>
              <h2 style={{ fontSize: 24, color: "#1a365d", borderBottom: "2px solid #1a365d", paddingBottom: 8, marginBottom: 22 }}>
                Minutes
              </h2>
              <div style={{ fontSize: 20, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{textContent.minutes}</div>
            </>
          )}
          {!textContent.minutes && (
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
