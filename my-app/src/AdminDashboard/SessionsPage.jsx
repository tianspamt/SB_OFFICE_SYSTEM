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
  FileText,
  Download,
  Image,
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
import { MONTHS, downloadFile, openPdfInTab } from "./AdminContext";
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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const getFileUrl = (filepath) =>
  `${SUPABASE_URL}/storage/v1/object/public/assets/${filepath}`;

// ─── SESSION CARD ──────────────────────────────────────────────────────────────

function SessionCard({ session, onEdit, onDelete, onView, MONTHS, readOnly }) {
  const date = session.session_date
    ? new Date(session.session_date + "T00:00:00")
    : null;

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
      </div>
      <div className={lStyles.recordActions}>
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
  const [minutesDateFilter, setMinutesDateFilter] = useState("");
  const [presentTarget, setPresentTarget] = useState(null);
  // A record with a stored file (PDF/Word/image) is presented from the file;
  // presentTarget above is the typed-text version for records without one.
  const [presentRecord, setPresentRecord] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);

  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);
  useResetOnChange([debouncedSearch, minutesTypeFilter, minutesYearFilter, minutesDateFilter], setPage, 1);

  const params = {
    page: String(page),
    limit: String(PAGE_SIZE),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(minutesYearFilter !== "all" ? { year: minutesYearFilter } : {}),
    ...(minutesTypeFilter !== "all" ? { type: minutesTypeFilter } : {}),
    ...(minutesDateFilter ? { date: minutesDateFilter } : {}),
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

  // For a record with no stored file (typed in, or recorded before files were
  // kept — see migration 029), "Present" shows the typed minutes text in a
  // big-font view instead of an embedded file.
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
      minutes: session.minutes_text || "",
    });
  };

  const resetFilters = () => {
    setSearch("");
    setMinutesTypeFilter("all");
    setMinutesDateFilter("");
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
            placeholder="Search by session number, type, venue, or minutes..."
          />
        </div>
        <FilterPanel
          categoryLabel="Type"
          categoryValue={
            minutesTypeFilter === "all"
              ? "All"
              : minutesTypeFilter.charAt(0).toUpperCase() + minutesTypeFilter.slice(1)
          }
          onCategoryChange={(v) => setMinutesTypeFilter(v === "All" ? "all" : v.toLowerCase())}
          categories={["All", "Regular", "Special"]}
          dateValue={minutesDateFilter}
          onDateChange={setMinutesDateFilter}
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
                !search && minutesTypeFilter === "all" && minutesYearFilter === "all" && !minutesDateFilter
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

              {/* ── File actions — same as the other legislative records:
                  a PDF opens, a Word file downloads, an image previews ── */}
              {viewTarget.filepath && viewTarget.filetype === "application/pdf" && (
                <div className={lStyles.viewModalFileActions}>
                  <button
                    className={`${lStyles.viewModalFileBtn} ${lStyles.viewModalFileBtnPrimary}`}
                    onClick={() => openPdfInTab(getFileUrl(viewTarget.filepath), viewTarget.session_number || "Session Minutes")}
                  >
                    <FileText size={16} />
                    Open PDF Document
                  </button>
                  <button
                    className={`${lStyles.viewModalFileBtn} ${lStyles.viewModalFileBtnSecondary}`}
                    onClick={() => downloadFile(getFileUrl(viewTarget.filepath), viewTarget.filepath, viewTarget.session_number || "Session Minutes")}
                  >
                    <Download size={16} />
                    Download PDF
                  </button>
                  <button
                    className={`${lStyles.viewModalFileBtn} ${lStyles.viewModalFileBtnSecondary}`}
                    onClick={() => setPresentRecord(viewTarget)}
                  >
                    <Presentation size={16} />
                    Present
                  </button>
                </div>
              )}

              {viewTarget.filepath &&
                (viewTarget.filetype === "application/msword" ||
                  viewTarget.filetype ===
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document") && (
                  <div className={lStyles.viewModalFileActions}>
                    <button
                      className={`${lStyles.viewModalFileBtn} ${lStyles.viewModalFileBtnPrimary}`}
                      onClick={() => downloadFile(getFileUrl(viewTarget.filepath), viewTarget.filepath, viewTarget.session_number || "Session Minutes")}
                    >
                      <Download size={16} />
                      Download Word Document
                    </button>
                    <button
                      className={`${lStyles.viewModalFileBtn} ${lStyles.viewModalFileBtnSecondary}`}
                      onClick={() => setPresentRecord(viewTarget)}
                    >
                      <Presentation size={16} />
                      Present
                    </button>
                  </div>
                )}

              {viewTarget.filepath && viewTarget.filetype?.startsWith("image/") && (
                <div className={lStyles.viewModalOcrSection}>
                  <img
                    src={getFileUrl(viewTarget.filepath)}
                    alt={viewTarget.session_number || "Session minutes"}
                    className={lStyles.viewModalImagePreview}
                  />
                  <div className={lStyles.viewModalFileActions}>
                    <button
                      className={`${lStyles.viewModalFileBtn} ${lStyles.viewModalFileBtnSecondary}`}
                      onClick={() => setPresentRecord(viewTarget)}
                    >
                      <Presentation size={16} />
                      Present
                    </button>
                  </div>
                  <div className={lStyles.viewModalOcrLabel}>
                    <Image size={14} />
                    Extracted Text (OCR)
                  </div>
                  <textarea
                    className={lStyles.viewModalOcrText}
                    readOnly
                    rows={6}
                    value={viewTarget.minutes_text || "No text could be extracted from this image."}
                  />
                </div>
              )}

              {/* Records with no stored file (typed in, or recorded before
                  files were kept) show their text instead. */}
              {!viewTarget.filepath && (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {presentTarget && (
        <PresentOverlay textContent={presentTarget} onClose={() => setPresentTarget(null)} />
      )}
      {presentRecord && (
        <PresentOverlay record={presentRecord} onClose={() => setPresentRecord(null)} />
      )}
    </>
  );
}
