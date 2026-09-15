/**
 * SessionAgendaPage.jsx — Secretary/Clerk upload the agenda (PDF or Word
 * only) for an upcoming session. Unlike Ordinances/Resolutions/Session
 * Minutes, there is no pending/review workflow here: an upload is
 * immediately visible, so this page has no tabs, no comment thread, and no
 * accept/vm-approve/publish actions — just a searchable, paginated list plus
 * Edit/Delete for whoever's allowed to manage it.
 */

import { useState, useEffect } from "react";
import {
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
  FileText,
  FileType,
  Download,
  Presentation,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import lStyles from "./LegislativeModule.module.css";
import { MONTHS } from "./AdminContext";
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

export default function SessionAgendaPage({
  agendas,
  loading = false,
  setDeleteTarget,
  onEdit,
  readOnly = false,
}) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [presentTarget, setPresentTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null);

  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);
  useResetOnChange([debouncedSearch, typeFilter, yearFilter], setPage, 1);

  const params = {
    page: String(page),
    limit: String(PAGE_SIZE),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(yearFilter !== "all" ? { year: yearFilter } : {}),
    ...(typeFilter !== "all" ? { type: typeFilter } : {}),
  };
  const {
    publishedList: list,
    publishedTotal: total,
    publishedTotalPages: totalPages,
    fetchingPublished: fetching,
  } = useLegislativePublished("session-agendas", params, agendas);

  const availableYears = [
    ...new Set(
      agendas
        .map((a) => (a.session_date ? new Date(a.session_date).getFullYear().toString() : null))
        .filter(Boolean)
    ),
  ].sort((a, b) => b - a);

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setYearFilter("all");
  };

  return (
    <>
      <StatsRow
        loading={loading || (fetching && total === 0)}
        stats={[{ value: total, label: "Total Orders of Business" }]}
      />

      <div className={lStyles.searchFilterBar}>
        <div className={lStyles.searchRow}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by session number or venue..."
          />
        </div>
        <FilterPanel
          categoryValue={typeFilter === "all" ? "All" : typeFilter}
          onCategoryChange={(v) => setTypeFilter(v === "All" ? "all" : v)}
          categories={["All", "regular", "special"]}
          dateValue=""
          onDateChange={() => {}}
          yearValue={yearFilter}
          onYearChange={setYearFilter}
          years={availableYears}
          onReset={resetFilters}
        />
      </div>

      <div className={lStyles.resultCount}>
        Showing {list.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
        {list.length > 0 ? `-${(page - 1) * PAGE_SIZE + list.length}` : ""} of {total} orders of business
      </div>

      {loading || fetching ? (
        <RecordListSkeleton count={4} />
      ) : (
        <div className={lStyles.recordList}>
          {list.length === 0 ? (
            <EmptyState
              title="No orders of business match your search"
              text={
                !search && typeFilter === "all" && yearFilter === "all"
                  ? "No orders of business have been posted yet."
                  : "Try adjusting your filters."
              }
            />
          ) : (
            list.map((a) => {
              const date = a.session_date ? new Date(a.session_date + "T00:00:00") : null;
              const isWord = a.filekind === "word";
              return (
                <div key={a.id} className={lStyles.recordCard}>
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
                        <span style={{ fontSize: 9, fontWeight: 500, opacity: 0.7, textTransform: "uppercase" }}>
                          {MONTHS[date.getMonth()]}
                        </span>
                        <span style={{ fontSize: 18, fontWeight: 500, lineHeight: 1 }}>
                          {date.getDate()}
                        </span>
                      </>
                    ) : (
                      <CalendarDays size={20} strokeWidth={1.2} />
                    )}
                  </div>
                  <div className={lStyles.recordBody}>
                    <div
                      style={{ display: "flex", gap: 6, marginBottom: 4, flexWrap: "wrap", alignItems: "center" }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: "2px 8px",
                          borderRadius: 10,
                          background: a.session_type === "special" ? "var(--purple-50)" : "var(--blue-50)",
                          color: a.session_type === "special" ? "var(--purple-600)" : "var(--blue-600)",
                          border: "0.5px solid rgba(0,0,0,0.08)",
                        }}
                      >
                        {a.session_type === "special" ? "Special Session" : "Regular Session"}
                      </span>
                      {a.session_number && (
                        <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                          {a.session_number}
                        </span>
                      )}
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 3,
                          fontSize: 11,
                          fontWeight: 500,
                          padding: "2px 8px",
                          borderRadius: 10,
                          background: isWord ? "var(--blue-50)" : "#fef2f2",
                          color: isWord ? "var(--blue-600)" : "#c53030",
                          border: "0.5px solid rgba(0,0,0,0.08)",
                        }}
                      >
                        {isWord ? <FileType size={11} /> : <FileText size={11} />}
                        {isWord ? "Word" : "PDF"}
                      </span>
                    </div>
                    {a.venue && (
                      <div
                        style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--color-text-secondary)", marginBottom: 4 }}
                      >
                        <CalendarDays size={12} /> {a.venue}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                      {a.filename}
                    </div>
                  </div>
                  <div className={lStyles.recordActions}>
                    <button
                      className={`${lStyles.btn} ${lStyles.btnSm} ${lStyles.btnInfo}`}
                      onClick={() => setViewTarget(a)}
                    >
                      <Eye size={13} /> View
                    </button>
                    {!readOnly && (
                      <>
                        <button className={`${lStyles.btn} ${lStyles.btnSm}`} onClick={() => onEdit(a)}>
                          <Pencil size={13} /> Edit
                        </button>
                        <button
                          className={`${lStyles.btn} ${lStyles.btnSm} ${lStyles.btnDanger}`}
                          onClick={() =>
                            setDeleteTarget({
                              id: a.id,
                              type: "session_agenda",
                              name: a.session_number || "this order of business",
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
            })
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

      {viewTarget && (
        <div className={lStyles.viewModalOverlay} onClick={() => setViewTarget(null)}>
          <div className={lStyles.viewModal} onClick={(e) => e.stopPropagation()}>
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
                    {viewTarget.session_type === "special" ? "Special Session" : "Regular Session"}
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
                  <div className={`${lStyles.viewModalMetaIcon} ${lStyles.viewModalMetaIconBlue}`}>
                    <CalendarDays size={16} />
                  </div>
                  <div>
                    <div className={lStyles.viewModalMetaLabel}>Date</div>
                    <div className={lStyles.viewModalMetaValue}>
                      {viewTarget.session_date
                        ? new Date(viewTarget.session_date + "T00:00:00").toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </div>
                  </div>
                </div>
                {viewTarget.venue && (
                  <div className={lStyles.viewModalMetaItem}>
                    <div className={`${lStyles.viewModalMetaIcon} ${lStyles.viewModalMetaIconGreen}`}>
                      <CalendarDays size={16} />
                    </div>
                    <div>
                      <div className={lStyles.viewModalMetaLabel}>Venue</div>
                      <div className={lStyles.viewModalMetaValue}>{viewTarget.venue}</div>
                    </div>
                  </div>
                )}
                <div className={lStyles.viewModalMetaItem}>
                  <div className={`${lStyles.viewModalMetaIcon} ${lStyles.viewModalMetaIconPurple}`}>
                    {viewTarget.filekind === "word" ? <FileType size={16} /> : <FileText size={16} />}
                  </div>
                  <div>
                    <div className={lStyles.viewModalMetaLabel}>File</div>
                    <div className={lStyles.viewModalMetaValue}>
                      {viewTarget.filekind === "word" ? "Word Document" : "PDF Document"}
                    </div>
                  </div>
                </div>
              </div>

              <div className={lStyles.viewModalDivider} />

              <div className={lStyles.viewModalFileActions}>
                {viewTarget.filekind === "word" ? (
                  <a
                    href={getFileUrl(viewTarget.filepath)}
                    download={viewTarget.filename}
                    className={`${lStyles.viewModalFileBtn} ${lStyles.viewModalFileBtnPrimary}`}
                  >
                    <Download size={16} />
                    Download Word Document
                  </a>
                ) : (
                  <a
                    href={getFileUrl(viewTarget.filepath)}
                    target="_blank"
                    rel="noreferrer"
                    className={`${lStyles.viewModalFileBtn} ${lStyles.viewModalFileBtnPrimary}`}
                  >
                    <FileText size={16} />
                    Open PDF Document
                  </a>
                )}
                <button
                  className={`${lStyles.viewModalFileBtn} ${lStyles.viewModalFileBtnSecondary}`}
                  onClick={() => setPresentTarget(viewTarget)}
                >
                  <Presentation size={16} />
                  Present
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {presentTarget && (
        <PresentOverlay record={presentTarget} onClose={() => setPresentTarget(null)} />
      )}
    </>
  );
}
