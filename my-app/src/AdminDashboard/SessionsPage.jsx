/**
 * SessionsPage.jsx — Updated with Review, Approval, and Manual Publishing Workflow
 * ADMIN ONLY — UI only, no backend logic
 * Preserves existing props: sessionMinutes, setDeleteTarget, onEdit
 */

import { useState } from "react";
import { Printer, Eye, Pencil, Trash2, CalendarDays } from "lucide-react";
import styles from "./AdminDashboard.module.css";
import lStyles from "./LegislativeModule.module.css";
import { API, MONTHS } from "./AdminContext";

import {
  TabNavigation,
  SearchBar,
  FilterPanel,
  CommentPanel,
  UploadModal,
  EmptyState,
  StatsRow,
  StatusBadge,
  ReadyTag,
  ActionButtons,
} from "./LegislativeComponents";

// ─── DUMMY DATA ───────────────────────────────────────────────────────────────


// ─── SESSION CARD (Published) ─────────────────────────────────────────────────

function SessionPublishedCard({ session, onEdit, onDelete, API, MONTHS, readOnly }) {
  const date = session.session_date
    ? new Date(session.session_date + "T00:00:00")
    : null;
  const agendaPreview = session.agenda
    ? session.agenda.split("\n").filter(Boolean).slice(0, 3)
    : [];

  return (
    <div className={lStyles.recordCard}>
      <div
        className={lStyles.recordIcon}
        style={{
          background: "var(--blue-50)",
          flexDirection: "column",
          fontSize: 11,
          gap: 0,
        }}
      >
        {date && !isNaN(date.getTime()) ? (
          <>
            <span
              style={{
                fontSize: 9,
                fontWeight: 500,
                opacity: 0.7,
                textTransform: "uppercase",
              }}
            >
              {MONTHS[date.getMonth()]}
            </span>
            <span style={{ fontSize: 18, fontWeight: 500, lineHeight: 1 }}>
              {date.getDate()}
            </span>
          </>
        ) : (
          "📋"
        )}
      </div>
      <div className={lStyles.recordBody}>
        <div
          style={{
            display: "flex",
            gap: 6,
            marginBottom: 4,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              padding: "2px 8px",
              borderRadius: 10,
              background:
                session.session_type === "special"
                  ? "var(--purple-50)"
                  : "var(--blue-50)",
              color:
                session.session_type === "special"
                  ? "var(--purple-600)"
                  : "var(--blue-600)",
              border: "0.5px solid rgba(0,0,0,0.08)",
            }}
          >
            {session.session_type === "special"
              ? "Special Session"
              : "Regular Session"}
          </span>
          {session.session_number && (
            <span
              style={{ fontSize: 12, color: "var(--color-text-secondary)" }}
            >
              {session.session_number}
            </span>
          )}
          <StatusBadge status="published" />
        </div>
        {session.venue && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: "var(--color-text-secondary)",
              marginBottom: 4,
            }}
          >
            <CalendarDays size={12} /> {session.venue}
          </div>
        )}
        {agendaPreview.length > 0 && (
          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
            <span style={{ fontWeight: 500 }}>Agenda: </span>
            {agendaPreview[0]}
            {agendaPreview.length > 1 && ` +${agendaPreview.length - 1} more`}
          </div>
        )}
      </div>
      <div className={lStyles.recordActions}>
        <a
          href={`${API}/api/session-minutes/${session.id}/print`}
          target="_blank"
          rel="noreferrer"
          className={`${lStyles.btn} ${lStyles.btnSm}`}
        >
          <Printer size={13} /> Print
        </a>
        <a
          href={`${API}/api/session-minutes/${session.id}/print`}
          target="_blank"
          rel="noreferrer"
          className={`${lStyles.btn} ${lStyles.btnSm} ${lStyles.btnInfo}`}
        >
          <Eye size={13} /> View
        </a>
        {!readOnly && (
  <>
    <button
      className={`${lStyles.btn} ${lStyles.btnSm}`}
      onClick={() => onEdit(session)}
    >
      <Pencil size={13} /> Edit
    </button>
    <button
      className={`${lStyles.btn} ${lStyles.btnSm} ${lStyles.btnDanger}`}
      onClick={() =>
        onDelete({
          id: session.id,
          type: "session",
          name: session.session_number || "this session",
        })
      }
    >
      <Trash2 size={13} /> Delete
    </button>
  </>
)}
      </div>
    </div>
  );
}

// ─── SESSION CARD (Pending) ───────────────────────────────────────────────────

function SessionPendingCard({
  item,
  status,
  onApprove,
  onReject,
  onViewDraft,
  onComment,
}) {
  const isApproved = status === "approved";
  return (
    <div
      className={`${lStyles.recordCard} ${
        isApproved ? lStyles.recordCardHighlight : ""
      }`}
    >
      <div
        className={lStyles.recordIcon}
        style={{ background: "var(--gray-50)" }}
      >
        {status === "approved" ? "📋" : status === "rejected" ? "📄" : "📝"}
      </div>
      <div className={lStyles.recordBody}>
        <div className={lStyles.recordTitle}>{item.title}</div>
        <div className={lStyles.recordMeta}>
          <span>{item.author}</span>
          <span>Submitted: {item.submitted}</span>
          <StatusBadge status={status} />
          {isApproved && <ReadyTag />}
        </div>
      </div>
      <ActionButtons
        status={status}
        onApprove={onApprove}
        onReject={onReject}
        onViewDraft={onViewDraft}
        onComment={onComment}
      />
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function SessionsPage({
  sessionMinutes,
  setDeleteTarget,
  onEdit,
  readOnly = false,
  canPublish = false,
  isViceMayor = false,
}) {
  const [activeTab, setActiveTab] = useState("published");
  const [search, setSearch] = useState("");
  const [minutesTypeFilter, setMinutesTypeFilter] = useState("all");
  const [minutesYearFilter, setMinutesYearFilter] = useState("all");
  const [pendingStatuses, setPendingStatuses] = useState({});
const [comments, setComments] = useState({});
const [panelItem, setPanelItem] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const minutesYears = [
    "all",
    ...new Set(
      sessionMinutes
        .map((s) =>
          s.session_date
            ? new Date(s.session_date).getFullYear().toString()
            : null
        )
        .filter(Boolean)
    ),
  ].sort((a, b) => b - a);

  const filteredPublished = sessionMinutes.filter((s) => {
    const ms =
      !search ||
      (s.session_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.venue || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.agenda || "").toLowerCase().includes(search.toLowerCase());
    const t =
      minutesTypeFilter === "all" || s.session_type === minutesTypeFilter;
    const y =
      minutesYearFilter === "all" ||
      (s.session_date &&
        new Date(s.session_date).getFullYear().toString() ===
          minutesYearFilter);
    return ms && t && y;
  });

  const filteredPending = [];

  const pendingCount = 0;

const handleApprove = (id) => {
  const current = pendingStatuses[id];
  if (isViceMayor && current === "pending") {
    setPendingStatuses((prev) => ({ ...prev, [id]: "ready_to_publish" }));
  } else if (!isViceMayor && current === "ready_to_publish") {
    setPendingStatuses((prev) => ({ ...prev, [id]: "published" }));
  }
};

  const handleAddComment = (itemId, text) => {
    const now = new Date();
    const time = now.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    setComments((prev) => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), { author: "Admin", text, time }],
    }));
  };

  return (
    <>
      {/* STATS */}
      <StatsRow
  stats={[
    { value: sessionMinutes.length, label: "Total Sessions" },
    { value: pendingCount, label: "Pending Review", colorClass: lStyles.statCardAmber },
  ]}
/>

      {/* TABS */}
      <TabNavigation
  tabs={[
    { id: "published", label: "Published" },
    ...(canPublish ? [{ id: "pending", label: "Pending", badge: pendingCount }] : []),
  ]}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSearch("");
        }}
      />

      {/* SEARCH & FILTER */}
      <div className={lStyles.searchFilterBar}>
        <div className={lStyles.searchRow}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder={
              activeTab === "published"
                ? "Search by session number, venue, or agenda..."
                : "Search by title or clerk..."
            }
          />
        </div>
        {activeTab === "published" && (
          <FilterPanel
            categoryValue={
              minutesTypeFilter === "all" ? "All" : minutesTypeFilter
            }
            onCategoryChange={(v) =>
              setMinutesTypeFilter(v === "All" ? "all" : v)
            }
            categories={["All", "regular", "special"]}
            dateValue=""
            onDateChange={() => {}}
            yearValue={minutesYearFilter}
            onYearChange={setMinutesYearFilter}
            years={minutesYears.filter((y) => y !== "all")}
            onReset={() => {
              setSearch("");
              setMinutesTypeFilter("all");
              setMinutesYearFilter("all");
            }}
          />
        )}
      </div>

      {/* ── PUBLISHED TAB ────────────────────────────────────────────────────── */}
      {activeTab === "published" && (
        <>
          <div className={lStyles.resultCount}>
            Showing {filteredPublished.length} of {sessionMinutes.length}{" "}
            sessions
          </div>
          <div className={lStyles.recordList}>
            {filteredPublished.length === 0 ? (
              <EmptyState
                title="No session records match your search"
                text={
                  !search &&
                  minutesTypeFilter === "all" &&
                  minutesYearFilter === "all"
                    ? "No session minutes recorded yet."
                    : "Try adjusting your filters."
                }
              />
            ) : (
              filteredPublished.map((s) => (
                <SessionPublishedCard
  key={s.id}
  session={s}
  onEdit={onEdit}
  onDelete={setDeleteTarget}
  API={API}
  MONTHS={MONTHS}
  readOnly={readOnly}
/>
              ))
            )}
          </div>
        </>
      )}

      {/* ── PENDING TAB ──────────────────────────────────────────────────────── */}
      {activeTab === "pending" && (
        <>
          <div className={lStyles.resultCount}>
  Showing {filteredPending.length} drafts
</div>
          <div className={lStyles.recordList}>
            {filteredPending.length === 0 ? (
              <EmptyState
                title="No pending drafts"
                text="All session minute drafts have been reviewed."
              />
            ) : (
              filteredPending.map((item) => (
  <SessionPendingCard
    key={item.id}
    item={item}
    status={pendingStatuses[item.id] || item.status}
    onApprove={() => handleApprove(item.id)}
    onViewDraft={() => setPanelItem(item)}
    onComment={() => setPanelItem(item)}
    isViceMayor={isViceMayor}
  />
))
            )}
          </div>
        </>
      )}

      {/* ── UPLOAD MODAL ─────────────────────────────────────────────────────── */}
      {showUploadModal && (
        <UploadModal
          title="Add Final Session Minutes"
          onClose={() => setShowUploadModal(false)}
          onSubmit={(formData) => {
            // TODO: connect to backend
            console.log("Publish session minutes:", formData);
            setShowUploadModal(false);
          }}
        />
      )}

      {/* ── COMMENT PANEL ────────────────────────────────────────────────────── */}
      {panelItem && (
        <CommentPanel
          item={panelItem}
          comments={comments[panelItem.id] || []}
          onClose={() => setPanelItem(null)}
          onAddComment={(text) => handleAddComment(panelItem.id, text)}
        />
      )}
    </>
  );
}
