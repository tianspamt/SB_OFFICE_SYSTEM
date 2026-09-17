/**
 * SessionsPage.jsx — Secretary/Clerk/Councilor/Vice-Mayor record a session's
 * minutes. Like SessionAgendaPage, there is no pending/review workflow here
 * anymore: recording a session is immediately visible, so this page has no
 * tabs, no comment thread, and no accept/vm-approve/publish actions — just a
 * searchable, paginated list plus Edit/Archive for whoever's allowed to
 * manage it.
 */

import { useState, useEffect } from "react";
import {
  Printer,
  Eye,
  Pencil,
  Archive,
  CalendarDays,
  X,
  Presentation,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import lStyles from "./LegislativeModule.module.css";
import { API, MONTHS, authFetch } from "./AdminContext";
import { useLegislativePublished, useResetOnChange } from "./useLegislativeReview";
import {
  SearchBar,
  FilterPanel,
  EmptyState,
  StatsRow,
  RecordListSkeleton,
  PresentOverlay,
} from "./LegislativeComponents";

const PAGE_SIZE = 20;

// The print view requires auth (see backend lockdown of GET .../print), so a
// plain <a href> can't carry it — the browser's own navigation has no way to
// attach an Authorization header. Open the tab synchronously (before the
// await) so browsers don't treat it as an unrequested popup, then fill it in
// once the authenticated fetch resolves.
const handlePrintSession = async (id) => {
  const win = window.open("", "_blank");
  try {
    const res = await authFetch(`${API}/api/session-minutes/${id}/print`);
    const html = await res.text();
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
  } catch {
    win?.close();
  }
};

// ─── SESSION CARD ──────────────────────────────────────────────────────────────

function SessionCard({ session, onEdit, onDelete, onView, MONTHS, readOnly }) {
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
        <button
          className={`${lStyles.btn} ${lStyles.btnSm}`}
          onClick={() => handlePrintSession(session.id)}
        >
          <Printer size={13} /> Print
        </button>
        <button
          className={`${lStyles.btn} ${lStyles.btnSm} ${lStyles.btnInfo}`}
          onClick={() => onView(session)}
        >
          <Eye size={13} /> View
        </button>
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
              <Archive size={13} /> Archive
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function SessionsPage({
  sessionMinutes,
  loading = false,
  setDeleteTarget,
  onEdit,
  readOnly = false,
}) {
  const [search, setSearch] = useState("");
  const [minutesTypeFilter, setMinutesTypeFilter] = useState("all");
  const [minutesYearFilter, setMinutesYearFilter] = useState("all");
  const [presentTarget, setPresentTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);

  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);
  useResetOnChange([debouncedSearch, minutesTypeFilter, minutesYearFilter], setPage, 1);

  const params = {
    page: String(page),
    limit: String(PAGE_SIZE),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(minutesYearFilter !== "all" ? { year: minutesYearFilter } : {}),
    ...(minutesTypeFilter !== "all" ? { type: minutesTypeFilter } : {}),
  };
  const {
    publishedList: list,
    publishedTotal: total,
    publishedTotalPages: totalPages,
    fetchingPublished: fetching,
  } = useLegislativePublished("session-minutes", params, sessionMinutes);

  const minutesYears = [
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

  // Session minutes never keep the originally uploaded file (see
  // routes/sessionMinutes.js — an upload only ever extracts text, it's
  // never persisted to storage), so "Present" here always shows the typed
  // agenda/minutes text in a big-font view rather than an embedded file.
  const handleOpenPresent = (session) => {
    setPresentTarget({
      eyebrow: session.session_type === "special" ? "Special Session" : "Regular Session",
      title:
        session.session_number ||
        (session.session_date
          ? new Date(session.session_date + "T00:00:00").toLocaleDateString("en-PH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "Session"),
      meta: [
        session.session_date
          ? new Date(session.session_date + "T00:00:00").toLocaleDateString("en-PH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : null,
        session.venue,
      ]
        .filter(Boolean)
        .join(" • "),
      agenda: session.agenda ? session.agenda.split("\n").filter(Boolean) : [],
      minutes: session.minutes_text || "",
    });
  };

  const resetFilters = () => {
    setSearch("");
    setMinutesTypeFilter("all");
    setMinutesYearFilter("all");
  };

  return (
    <>
      <StatsRow
        loading={loading || (fetching && total === 0)}
        stats={[{ value: total, label: "Total Sessions" }]}
      />

      <div className={lStyles.searchFilterBar}>
        <div className={lStyles.searchRow}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by session number, venue, or agenda..."
          />
        </div>
        <FilterPanel
          categoryValue={minutesTypeFilter === "all" ? "All" : minutesTypeFilter}
          onCategoryChange={(v) => setMinutesTypeFilter(v === "All" ? "all" : v)}
          categories={["All", "regular", "special"]}
          dateValue=""
          onDateChange={() => {}}
          yearValue={minutesYearFilter}
          onYearChange={setMinutesYearFilter}
          years={minutesYears}
          onReset={resetFilters}
        />
      </div>

      <div className={lStyles.resultCount}>
        Showing {list.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
        {list.length > 0 ? `-${(page - 1) * PAGE_SIZE + list.length}` : ""} of {total} sessions
      </div>

      {loading || fetching ? (
        <RecordListSkeleton count={4} />
      ) : (
        <div className={lStyles.recordList}>
          {list.length === 0 ? (
            <EmptyState
              title="No session records match your search"
              text={
                !search && minutesTypeFilter === "all" && minutesYearFilter === "all"
                  ? "No session minutes recorded yet."
                  : "Try adjusting your filters."
              }
            />
          ) : (
            list.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onEdit={onEdit}
                onDelete={setDeleteTarget}
                onView={setViewTarget}
                MONTHS={MONTHS}
                readOnly={readOnly}
              />
            ))
          )}
        </div>
      )}

      {!fetching && totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "14px 0" }}>
          <button
            className={`${lStyles.btn} ${lStyles.btnSm}`}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
          >
            <ChevronLeft size={13} /> Prev
          </button>
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            className={`${lStyles.btn} ${lStyles.btnSm}`}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          >
            Next <ChevronRight size={13} />
          </button>
        </div>
      )}

      {/* ── VIEW SESSION MODAL ───────────────────────────────────────────────── */}
      {viewTarget && (
        <div
          className={lStyles.viewModalOverlay}
          onClick={() => setViewTarget(null)}
        >
          <div
            className={lStyles.viewModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={lStyles.viewModalHeader}>
              <div className={lStyles.viewModalHeaderTop}>
                <div className={lStyles.viewModalHeaderInfo}>
                  {viewTarget.session_number && (
                    <div className={lStyles.viewModalOrdNumber}>
                      <CalendarDays size={12} />
                      {viewTarget.session_number}
                    </div>
                  )}
                  <h2 className={lStyles.viewModalTitle}>
                    {viewTarget.session_type === "special"
                      ? "Special Session"
                      : "Regular Session"}
                  </h2>
                </div>
                <button
                  className={lStyles.viewModalCloseBtn}
                  onClick={() => setViewTarget(null)}
                  aria-label="Close modal"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className={lStyles.viewModalBody}>
              <div className={lStyles.viewModalMeta}>
                <div className={lStyles.viewModalMetaItem}>
                  <div
                    className={`${lStyles.viewModalMetaIcon} ${lStyles.viewModalMetaIconBlue}`}
                  >
                    <CalendarDays size={16} />
                  </div>
                  <div>
                    <div className={lStyles.viewModalMetaLabel}>Date</div>
                    <div className={lStyles.viewModalMetaValue}>
                      {new Date(
                        viewTarget.session_date + "T00:00:00"
                      ).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>
                {viewTarget.venue && (
                  <div className={lStyles.viewModalMetaItem}>
                    <div
                      className={`${lStyles.viewModalMetaIcon} ${lStyles.viewModalMetaIconGreen}`}
                    >
                      <CalendarDays size={16} />
                    </div>
                    <div>
                      <div className={lStyles.viewModalMetaLabel}>Venue</div>
                      <div className={lStyles.viewModalMetaValue}>
                        {viewTarget.venue}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={lStyles.viewModalDivider} />

              <div className={lStyles.viewModalFileActions}>
                <button
                  className={`${lStyles.viewModalFileBtn} ${lStyles.viewModalFileBtnSecondary}`}
                  onClick={() => handleOpenPresent(viewTarget)}
                >
                  <Presentation size={16} />
                  Present
                </button>
              </div>

              <div className={lStyles.viewModalDivider} />

              <div
                className={lStyles.viewModalCouncilTitle}
                style={{ marginBottom: 8 }}
              >
                Agenda
              </div>
              <div
                style={{
                  fontSize: 13,
                  whiteSpace: "pre-wrap",
                  color: "var(--color-text-secondary)",
                }}
              >
                {viewTarget.agenda || "No agenda recorded."}
              </div>

              <div
                className={lStyles.viewModalCouncilTitle}
                style={{ margin: "16px 0 8px" }}
              >
                Minutes
              </div>
              <div
                style={{
                  fontSize: 13,
                  whiteSpace: "pre-wrap",
                  color: "var(--color-text-secondary)",
                }}
              >
                {viewTarget.minutes_text || "No minutes recorded."}
              </div>
            </div>
          </div>
        </div>
      )}

      {presentTarget && (
        <PresentOverlay textContent={presentTarget} onClose={() => setPresentTarget(null)} />
      )}
    </>
  );
}
