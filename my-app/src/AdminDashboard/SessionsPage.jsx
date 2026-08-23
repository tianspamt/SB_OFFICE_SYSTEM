/**
 * SessionsPage.jsx — Review, Approval, and Manual Publishing Workflow
 * Preserves existing props: sessionMinutes, setDeleteTarget, onEdit
 */

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Printer,
  Eye,
  Pencil,
  Archive,
  CalendarDays,
  X,
  Upload,
  Send,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import lStyles from "./LegislativeModule.module.css";
import { API, MONTHS, authFetch, pendingQueryKey, fetchPendingList } from "./AdminContext";
import {
  pendingStatusesForRole,
  useReviewWorkflow,
  useCommentThread,
  useLegislativePublished,
  useResetOnChange,
  useDeepLinkedTab,
} from "./useLegislativeReview";

import {
  TabNavigation,
  SearchBar,
  FilterPanel,
  EmptyState,
  StatsRow,
  StatusBadge,
  RecordListSkeleton,
} from "./LegislativeComponents";

// Published records are paginated server-side (see GET /api/session-minutes'
// opt-in page/limit) instead of fetching every session ever recorded — this
// stays independent of the `sessionMinutes` prop, which the dashboard still
// fetches in full for its own stats.
const PAGE_SIZE = 20;

// The print view now requires auth (see backend lockdown of GET .../print),
// so a plain <a href> can no longer carry it — the browser's own navigation
// has no way to attach an Authorization header. Open the tab synchronously
// (before the await) so browsers don't treat it as an unrequested popup,
// then fill it in once the authenticated fetch resolves.
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

// ─── SESSION CARD (Published) ─────────────────────────────────────────────────

function SessionPublishedCard({
  session,
  onEdit,
  onDelete,
  onView,
  MONTHS,
  readOnly,
}) {
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
  canPublish = false,
  canManagePending = false,
  isViceMayor = false,
  isSecretary = false,
  isClerk = false,
  isCouncilor = false,
  onRefresh,
  initialSubTab = null,
}) {
  // Lets the dashboard's "Needs your review" widget deep-link straight into
  // the Pending tab instead of landing on the default Published tab.
  const [activeTab, setActiveTab] = useDeepLinkedTab("published", initialSubTab);
  const [search, setSearch] = useState("");
  const [minutesTypeFilter, setMinutesTypeFilter] = useState("all");
  const [minutesYearFilter, setMinutesYearFilter] = useState("all");
  const queryClient = useQueryClient();
  const pendingStatusQ = pendingStatusesForRole({ isSecretary, isViceMayor });
  const { data: pendingSessions = [], isLoading: fetchingPending } = useQuery({
    queryKey: pendingQueryKey("session-minutes", pendingStatusQ),
    queryFn: () => fetchPendingList("session-minutes", pendingStatusQ),
    enabled: activeTab === "pending" && canPublish,
    staleTime: 15000,
  });

  // ── Published tab: server-paginated ─────────────────────────────────────────
  const [publishedPage, setPublishedPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);
  useResetOnChange([debouncedSearch, minutesTypeFilter, minutesYearFilter], setPublishedPage, 1);

  const publishedParams = {
    page: String(publishedPage),
    limit: String(PAGE_SIZE),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(minutesYearFilter !== "all" ? { year: minutesYearFilter } : {}),
    ...(minutesTypeFilter !== "all" ? { type: minutesTypeFilter } : {}),
  };
  const {
    publishedList,
    publishedTotal,
    publishedTotalPages,
    fetchingPublished,
    refreshPublished: fetchPublishedSessions,
  } = useLegislativePublished("session-minutes", publishedParams, sessionMinutes);

  // ── Review workflow ──────────────────────────────────────────────────────────
  // reviewCommentText/revise* stay local — page-specific glue (the textarea
  // doubles as comment box + reject-reason input; revise* feed
  // handleReviseSession below).
  const [reviewCommentText, setReviewCommentText] = useState("");
  const [reviseAgenda, setReviseAgenda] = useState("");
  const [reviseMinutes, setReviseMinutes] = useState("");
  const [reviseFile, setReviseFile] = useState(null);
  const {
    viewTarget, setViewTarget,
    submitting: reviewSubmitting, error: reviewError, setError: setReviewError,
    runAction: runReviewAction,
  } = useReviewWorkflow({ onRefresh: () => refreshAll() });
  const {
    comments: reviewComments, loadingComments, commentSubmitting,
    fetchComments: fetchCommentsForId, sendComment,
  } = useCommentThread();
  const fetchComments = (id) => fetchCommentsForId("session_minutes", id);

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

  // Old call sites just call fetchPendingSessions() to refresh — keeping
  // the name means refreshAll() below doesn't need to change.
  const fetchPendingSessions = () =>
    queryClient.invalidateQueries({ queryKey: pendingQueryKey("session-minutes", pendingStatusQ) });

  const refreshAll = () => {
    fetchPendingSessions();
    fetchPublishedSessions();
    onRefresh?.();
  };

  const handleOpenView = (item) => {
    setReviewError("");
    setReviewCommentText("");
    setReviseAgenda(item.agenda || "");
    setReviseMinutes(item.minutes_text || "");
    setReviseFile(null);
    setViewTarget(item);
    if (item.status && item.status !== "published") fetchComments(item.id);
  };

  const handleSendComment = async () => {
    if (!viewTarget) return;
    const result = await sendComment("session_minutes", viewTarget.id, reviewCommentText);
    if (result.ok) setReviewCommentText("");
    else if (result.error) setReviewError(result.error);
  };

  const handleAccept = (id) =>
    runReviewAction(
      `/api/session-minutes/${id}/accept`,
      { method: "PUT" },
      (d) => ({ status: d.status })
    );

  const handleRequestChanges = async () => {
    if (!reviewCommentText.trim() || !viewTarget) return;
    const ok = await runReviewAction(
      `/api/session-minutes/${viewTarget.id}/request-changes`,
      {
        method: "PUT",
        body: JSON.stringify({ comment: reviewCommentText.trim() }),
      },
      (d) => ({ status: d.status })
    );
    if (ok) {
      setReviewCommentText("");
      fetchComments(viewTarget.id);
    }
  };

  const handleVMApprove = (id) =>
    runReviewAction(
      `/api/session-minutes/${id}/vm-approve`,
      { method: "PUT" },
      (d) => ({ status: d.status })
    );

  const handlePublish = (id) =>
    runReviewAction(
      `/api/session-minutes/${id}/publish`,
      { method: "PUT" },
      (d) => ({ status: d.status })
    );

  const handleReviseSession = async (id) => {
    let ok;
    if (reviseFile) {
      const fd = new FormData();
      fd.append("file", reviseFile);
      ok = await runReviewAction(
        `/api/session-minutes/${id}/revise`,
        { method: "PUT", body: fd },
        (d) => ({
          filename: d.filename,
          filetype: d.filetype,
          minutes_text: d.minutes_text,
          revision_count: d.revision_count,
        })
      );
      if (ok) setReviseFile(null);
    } else {
      ok = await runReviewAction(
        `/api/session-minutes/${id}/revise`,
        {
          method: "PUT",
          body: JSON.stringify({
            agenda: reviseAgenda,
            minutes_text: reviseMinutes,
          }),
        },
        (d) => ({
          agenda: d.agenda,
          minutes_text: d.minutes_text,
          revision_count: d.revision_count,
        })
      );
    }
    return ok;
  };

  const pendingFiltered = pendingSessions.filter((s) => {
    const matchesSearch =
      !search ||
      (s.session_number || "").toLowerCase().includes(search.toLowerCase());
    const matchesType =
      minutesTypeFilter === "all" || s.session_type === minutesTypeFilter;
    const matchesYear =
      minutesYearFilter === "all" ||
      (s.session_date || "").slice(0, 4) === minutesYearFilter;
    return matchesSearch && matchesType && matchesYear;
  });
  const pendingCount = pendingSessions.length;

  return (
    <>
      {/* STATS */}
      <StatsRow
        loading={loading || (fetchingPublished && publishedTotal === 0)}
        stats={[
          { value: publishedTotal, label: "Total Sessions" },
          {
            value: pendingCount,
            label: "Pending Review",
            colorClass: lStyles.statCardAmber,
          },
        ]}
      />

      {/* TABS */}
      <TabNavigation
        tabs={[
          { id: "published", label: "Published" },
          ...(canPublish
            ? [{ id: "pending", label: "Pending", badge: pendingCount }]
            : []),
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
                : "Search by session number..."
            }
          />
        </div>
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
      </div>

      {/* ── PUBLISHED TAB ────────────────────────────────────────────────────── */}
      {activeTab === "published" && (
        <>
          <div className={lStyles.resultCount}>
            Showing {publishedList.length === 0 ? 0 : (publishedPage - 1) * PAGE_SIZE + 1}
            {publishedList.length > 0 ? `-${(publishedPage - 1) * PAGE_SIZE + publishedList.length}` : ""} of {publishedTotal} sessions
          </div>
          {loading || fetchingPublished ? (
            <RecordListSkeleton count={4} />
          ) : (
          <div className={lStyles.recordList}>
            {publishedList.length === 0 ? (
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
              publishedList.map((s) => (
                <SessionPublishedCard
                  key={s.id}
                  session={s}
                  onEdit={onEdit}
                  onDelete={setDeleteTarget}
                  onView={handleOpenView}
                  MONTHS={MONTHS}
                  readOnly={readOnly}
                />
              ))
            )}
          </div>
          )}
          {!fetchingPublished && publishedTotalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "14px 0" }}>
              <button
                className={`${lStyles.btn} ${lStyles.btnSm}`}
                disabled={publishedPage <= 1}
                onClick={() => setPublishedPage((p) => Math.max(p - 1, 1))}
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                Page {publishedPage} of {publishedTotalPages}
              </span>
              <button
                className={`${lStyles.btn} ${lStyles.btnSm}`}
                disabled={publishedPage >= publishedTotalPages}
                onClick={() => setPublishedPage((p) => Math.min(p + 1, publishedTotalPages))}
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          )}
        </>
      )}

      {/* ── PENDING TAB ──────────────────────────────────────────────────────── */}
      {activeTab === "pending" && (
        <>
          <div className={lStyles.resultCount}>
            Showing {pendingFiltered.length} drafts
          </div>
          {fetchingPending ? (
            <RecordListSkeleton count={3} />
          ) : (
          <div className={lStyles.recordList}>
            {pendingFiltered.length === 0 ? (
              <EmptyState
                title="No pending drafts"
                text="All session minute drafts have been reviewed."
              />
            ) : (
              pendingFiltered.map((item) => (
                <div key={item.id} className={lStyles.recordCard}>
                  <div
                    className={lStyles.recordIcon}
                    style={{ background: "var(--gray-50)" }}
                  >
                    📝
                  </div>
                  <div className={lStyles.recordBody}>
                    <div className={lStyles.recordTitle}>
                      {item.session_number ||
                        new Date(item.session_date).toLocaleDateString("en-PH")}
                    </div>
                    <div className={lStyles.recordMeta}>
                      {item.venue && <span>{item.venue}</span>}
                      {item.revision_count > 0 && (
                        <span>Revision #{item.revision_count}</span>
                      )}
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                  <div className={lStyles.recordActions}>
                    <button
                      className={`${lStyles.btn} ${lStyles.btnSm} ${lStyles.btnInfo}`}
                      onClick={() => handleOpenView(item)}
                    >
                      <Eye size={13} /> View Draft
                    </button>
                    {canManagePending && (
                      <button
                        className={`${lStyles.btn} ${lStyles.btnSm} ${lStyles.btnDanger}`}
                        onClick={() =>
                          setDeleteTarget({
                            id: item.id,
                            type: "session",
                            name:
                              item.session_number ||
                              new Date(item.session_date).toLocaleDateString("en-PH"),
                          })
                        }
                      >
                        <Archive size={13} /> Archive
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          )}
        </>
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
                {viewTarget.status && (
                  <div className={lStyles.viewModalMetaItem}>
                    <div
                      className={`${lStyles.viewModalMetaIcon} ${lStyles.viewModalMetaIconAmber}`}
                    >
                      <Eye size={16} />
                    </div>
                    <div>
                      <div className={lStyles.viewModalMetaLabel}>Status</div>
                      <div
                        className={lStyles.viewModalMetaValue}
                        style={{ textTransform: "capitalize" }}
                      >
                        {viewTarget.status}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={lStyles.viewModalDivider} />

              {/* ── Agenda + minutes (editable while under review, read-only once published) ── */}
              {(() => {
                const isReviewer =
                  (isSecretary || isClerk || isCouncilor) &&
                  viewTarget.status &&
                  viewTarget.status !== "published";
                return (
                  <>
                    <div
                      className={lStyles.viewModalCouncilTitle}
                      style={{ marginBottom: 8 }}
                    >
                      Agenda
                    </div>
                    {isReviewer ? (
                      <textarea
                        className={lStyles.viewModalOcrText}
                        rows={4}
                        value={reviseAgenda}
                        onChange={(e) => setReviseAgenda(e.target.value)}
                        placeholder="One agenda item per line..."
                      />
                    ) : (
                      <div
                        style={{
                          fontSize: 13,
                          whiteSpace: "pre-wrap",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {viewTarget.agenda || "No agenda recorded."}
                      </div>
                    )}

                    <div
                      className={lStyles.viewModalCouncilTitle}
                      style={{ margin: "16px 0 8px" }}
                    >
                      Minutes
                    </div>
                    {isReviewer ? (
                      <textarea
                        className={lStyles.viewModalOcrText}
                        rows={8}
                        value={reviseMinutes}
                        onChange={(e) => setReviseMinutes(e.target.value)}
                        placeholder="Minutes of the session..."
                      />
                    ) : (
                      <div
                        style={{
                          fontSize: 13,
                          whiteSpace: "pre-wrap",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {viewTarget.minutes_text || "No minutes recorded."}
                      </div>
                    )}
                  </>
                );
              })()}

              {/* ── Review workflow (hidden once published) ── */}
              {viewTarget.status && viewTarget.status !== "published" && (
                <>
                  <div className={lStyles.viewModalDivider} />

                  {(isSecretary || isClerk || isCouncilor) && (
                    <div style={{ marginBottom: 16 }}>
                      <div
                        className={lStyles.viewModalCouncilTitle}
                        style={{ marginBottom: 8 }}
                      >
                        Or Replace With a File (re-runs text extraction)
                      </div>
                      <div
                        className={lStyles.uploadZone}
                        onClick={() =>
                          document.getElementById("reviseFileInputSes")?.click()
                        }
                      >
                        <div className={lStyles.uploadIcon}>📎</div>
                        <div className={lStyles.uploadText}>
                          {reviseFile
                            ? reviseFile.name
                            : "Click to choose a replacement file"}
                        </div>
                        <input
                          id="reviseFileInputSes"
                          type="file"
                          accept=".pdf,.doc,.docx,image/*"
                          style={{ display: "none" }}
                          onChange={(e) =>
                            setReviseFile(e.target.files?.[0] || null)
                          }
                        />
                      </div>
                      <button
                        className={`${lStyles.btn} ${lStyles.btnSm}`}
                        style={{ marginTop: 8 }}
                        disabled={reviewSubmitting}
                        onClick={() => handleReviseSession(viewTarget.id)}
                      >
                        <Upload size={13} />{" "}
                        {viewTarget.status === "needs_revision"
                          ? "Save & Resubmit"
                          : "Save Revision"}
                      </button>
                    </div>
                  )}

                  <div className={lStyles.commentsLabel}>Comments</div>
                  <div className={lStyles.commentsThread}>
                    {loadingComments ? (
                      <div
                        style={{
                          fontSize: 13,
                          textAlign: "center",
                          padding: "1rem",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        Loading comments...
                      </div>
                    ) : reviewComments.length === 0 ? (
                      <div
                        style={{
                          fontSize: 13,
                          textAlign: "center",
                          padding: "1rem",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        No comments yet
                      </div>
                    ) : (
                      reviewComments.map((c) => (
                        <div key={c.id} className={lStyles.comment}>
                          <div className={lStyles.commentMeta}>
                            <span className={lStyles.commentAuthor}>
                              {c.author?.name || c.author_role}
                            </span>
                            <span>
                              {new Date(c.created_at).toLocaleString("en-PH", {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className={lStyles.commentText}>{c.text}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {(isSecretary || isClerk || isCouncilor || isViceMayor) && (
                    <div className={lStyles.commentInputRow}>
                      <textarea
                        className={lStyles.commentInput}
                        rows={2}
                        placeholder="Add a comment..."
                        value={reviewCommentText}
                        onChange={(e) => setReviewCommentText(e.target.value)}
                      />
                      <button
                        className={`${lStyles.btn} ${lStyles.btnSm}`}
                        disabled={commentSubmitting || !reviewCommentText.trim()}
                        onClick={handleSendComment}
                      >
                        <Send size={13} />
                      </button>
                    </div>
                  )}

                  {reviewError && (
                    <div
                      style={{ color: "#c53030", fontSize: 12, marginTop: 8 }}
                    >
                      {reviewError}
                    </div>
                  )}

                  <div
                    className={lStyles.viewModalFileActions}
                    style={{ marginTop: 16 }}
                  >
                    {isSecretary && viewTarget.status === "pending" && (
                      <>
                        <button
                          className={`${lStyles.btn} ${lStyles.btnSuccess}`}
                          disabled={reviewSubmitting}
                          onClick={() => handleAccept(viewTarget.id)}
                        >
                          ✅ Accept
                        </button>
                        <button
                          className={`${lStyles.btn} ${lStyles.btnDanger}`}
                          disabled={
                            reviewSubmitting || !reviewCommentText.trim()
                          }
                          title={
                            !reviewCommentText.trim()
                              ? "Enter a comment above explaining the requested changes"
                              : ""
                          }
                          onClick={handleRequestChanges}
                        >
                          Request Changes
                        </button>
                      </>
                    )}

                    {isViceMayor &&
                      viewTarget.status === "ready_to_publish" && (
                        <button
                          className={`${lStyles.btn} ${lStyles.btnSuccess}`}
                          disabled={reviewSubmitting}
                          onClick={() => handleVMApprove(viewTarget.id)}
                        >
                          ✅ Approve
                        </button>
                      )}

                    {isSecretary && viewTarget.status === "approved" && (
                      <button
                        className={`${lStyles.btn} ${lStyles.btnSuccess}`}
                        disabled={reviewSubmitting}
                        onClick={() => handlePublish(viewTarget.id)}
                      >
                        ✅ Publish
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className={lStyles.viewModalFooter}>
              <button
                className={`${lStyles.viewModalFooterBtn} ${lStyles.viewModalFooterBtnClose}`}
                onClick={() => setViewTarget(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
