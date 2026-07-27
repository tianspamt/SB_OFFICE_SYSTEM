/**
 * SessionsPage.jsx — Review, Approval, and Manual Publishing Workflow
 * Preserves existing props: sessionMinutes, setDeleteTarget, onEdit
 */

import { useState, useEffect } from "react";
import { Printer, Eye, Pencil, Archive, CalendarDays, X, Upload, Send } from "lucide-react";
import lStyles from "./LegislativeModule.module.css";
import { API, MONTHS, authFetch } from "./AdminContext";

import {
  TabNavigation,
  SearchBar,
  FilterPanel,
  UploadModal,
  EmptyState,
  StatsRow,
  StatusBadge,
} from "./LegislativeComponents";

// ─── SESSION CARD (Published) ─────────────────────────────────────────────────

function SessionPublishedCard({ session, onEdit, onDelete, onView, MONTHS, readOnly }) {
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
  setDeleteTarget,
  onEdit,
  readOnly = false,
  canPublish = false,
  isViceMayor = false,
  isSecretary = false,
  isClerk = false,
  onRefresh,
}) {
  const [activeTab, setActiveTab] = useState("published");
  const [search, setSearch] = useState("");
  const [minutesTypeFilter, setMinutesTypeFilter] = useState("all");
  const [minutesYearFilter, setMinutesYearFilter] = useState("all");
  const [pendingSessions, setPendingSessions] = useState([]);
  const [fetchingPending, setFetchingPending] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);

  // ── Review workflow ──────────────────────────────────────────────────────────
  const [reviewComments, setReviewComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [reviewCommentText, setReviewCommentText] = useState("");
  const [reviseAgenda, setReviseAgenda] = useState("");
  const [reviseMinutes, setReviseMinutes] = useState("");
  const [reviseFile, setReviseFile] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");

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
  }).filter((s) => s.status === "published" || !s.status);

  useEffect(() => {
    if (activeTab === "pending" && canPublish) {
      fetchPendingSessions();
    }
  }, [activeTab]);

  // Role-aware pending queue: each position only reviews the status it owns.
  const pendingStatusesForRole = () => {
    if (isSecretary) return "pending,approved";
    if (isViceMayor) return "ready_to_publish";
    if (isClerk) return "needs_revision";
    return "pending,needs_revision,ready_to_publish,approved";
  };

  const fetchPendingSessions = async () => {
    setFetchingPending(true);
    try {
      const res = await fetch(`${API}/api/session-minutes?status=${pendingStatusesForRole()}`);
      const data = await res.json();
      setPendingSessions(Array.isArray(data) ? data : []);
    } catch {
      setPendingSessions([]);
    } finally {
      setFetchingPending(false);
    }
  };

  const refreshAll = () => {
    fetchPendingSessions();
    onRefresh?.();
  };

  // ── Comment thread ───────────────────────────────────────────────────────────
  const fetchComments = async (sessionId) => {
    setLoadingComments(true);
    try {
      const res = await authFetch(`${API}/api/comments?entity_type=session_minutes&entity_id=${sessionId}`);
      const data = await res.json();
      setReviewComments(Array.isArray(data) ? data : []);
    } catch {
      setReviewComments([]);
    } finally {
      setLoadingComments(false);
    }
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
    if (!reviewCommentText.trim() || !viewTarget) return;
    setReviewSubmitting(true);
    try {
      const res = await authFetch(`${API}/api/comments`, {
        method: "POST",
        body: JSON.stringify({ entity_type: "session_minutes", entity_id: viewTarget.id, text: reviewCommentText.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReviewCommentText("");
        fetchComments(viewTarget.id);
      } else setReviewError(data.error || "Failed to add comment.");
    } catch {
      setReviewError("Server error.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  // ── Review workflow actions ──────────────────────────────────────────────────
  const runReviewAction = async (url, options, successUpdate) => {
    setReviewSubmitting(true);
    setReviewError("");
    try {
      const res = await authFetch(`${API}${url}`, options);
      const data = await res.json();
      if (res.ok && data.success) {
        setViewTarget((prev) => (prev ? { ...prev, ...successUpdate(data.data) } : prev));
        refreshAll();
        return true;
      }
      setReviewError(data.error || "Action failed.");
      return false;
    } catch {
      setReviewError("Server error.");
      return false;
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleAccept = (id) =>
    runReviewAction(`/api/session-minutes/${id}/accept`, { method: "PUT" }, (d) => ({ status: d.status }));

  const handleRequestChanges = async () => {
    if (!reviewCommentText.trim() || !viewTarget) return;
    const ok = await runReviewAction(
      `/api/session-minutes/${viewTarget.id}/request-changes`,
      { method: "PUT", body: JSON.stringify({ comment: reviewCommentText.trim() }) },
      (d) => ({ status: d.status })
    );
    if (ok) {
      setReviewCommentText("");
      fetchComments(viewTarget.id);
    }
  };

  const handleVMApprove = (id) =>
    runReviewAction(`/api/session-minutes/${id}/vm-approve`, { method: "PUT" }, (d) => ({ status: d.status }));

  const handlePublish = (id) =>
    runReviewAction(`/api/session-minutes/${id}/publish`, { method: "PUT" }, (d) => ({ status: d.status }));

  const handleReviseSession = async (id) => {
    let ok;
    if (reviseFile) {
      const fd = new FormData();
      fd.append("file", reviseFile);
      ok = await runReviewAction(`/api/session-minutes/${id}/revise`, { method: "PUT", body: fd }, (d) => ({
        filename: d.filename,
        filetype: d.filetype,
        minutes_text: d.minutes_text,
        revision_count: d.revision_count,
      }));
      if (ok) setReviseFile(null);
    } else {
      ok = await runReviewAction(
        `/api/session-minutes/${id}/revise`,
        { method: "PUT", body: JSON.stringify({ agenda: reviseAgenda, minutes_text: reviseMinutes }) },
        (d) => ({ agenda: d.agenda, minutes_text: d.minutes_text, revision_count: d.revision_count })
      );
    }
    return ok;
  };

  const handleResubmit = async (id) => {
    const revised = await handleReviseSession(id);
    if (!revised) return;
    runReviewAction(`/api/session-minutes/${id}/resubmit`, { method: "PUT" }, (d) => ({ status: d.status }));
  };

  const pendingFiltered = pendingSessions.filter((s) => {
    return !search ||
      (s.session_number || "").toLowerCase().includes(search.toLowerCase());
  });
  const pendingCount = pendingSessions.length;

  return (
    <>
      {/* STATS */}
      <StatsRow
  stats={[
    { value: filteredPublished.length, label: "Total Sessions" },
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
                : "Search by session number..."
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
  onView={handleOpenView}
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
  Showing {pendingFiltered.length} drafts
</div>
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
                      {item.session_number || new Date(item.session_date).toLocaleDateString("en-PH")}
                    </div>
                    <div className={lStyles.recordMeta}>
                      {item.venue && <span>{item.venue}</span>}
                      {item.revision_count > 0 && <span>Revision #{item.revision_count}</span>}
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
                  </div>
                </div>
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
            console.log("Publish session minutes:", formData);
            setShowUploadModal(false);
          }}
        />
      )}

      {/* ── VIEW SESSION MODAL ───────────────────────────────────────────────── */}
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
                      {new Date(viewTarget.session_date + "T00:00:00").toLocaleDateString("en-PH", {
                        year: "numeric", month: "short", day: "numeric",
                      })}
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
                {viewTarget.status && (
                  <div className={lStyles.viewModalMetaItem}>
                    <div className={`${lStyles.viewModalMetaIcon} ${lStyles.viewModalMetaIconAmber}`}>
                      <Eye size={16} />
                    </div>
                    <div>
                      <div className={lStyles.viewModalMetaLabel}>Status</div>
                      <div className={lStyles.viewModalMetaValue} style={{ textTransform: "capitalize" }}>
                        {viewTarget.status}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={lStyles.viewModalDivider} />

              {/* ── Agenda + minutes (editable while under review, read-only once published) ── */}
              {(() => {
                const isReviewer = (isSecretary || isClerk) && viewTarget.status && viewTarget.status !== "published";
                return (
                  <>
                    <div className={lStyles.viewModalCouncilTitle} style={{ marginBottom: 8 }}>Agenda</div>
                    {isReviewer ? (
                      <textarea
                        className={lStyles.viewModalOcrText}
                        rows={4}
                        value={reviseAgenda}
                        onChange={(e) => setReviseAgenda(e.target.value)}
                        placeholder="One agenda item per line..."
                      />
                    ) : (
                      <div style={{ fontSize: 13, whiteSpace: "pre-wrap", color: "var(--color-text-secondary)" }}>
                        {viewTarget.agenda || "No agenda recorded."}
                      </div>
                    )}

                    <div className={lStyles.viewModalCouncilTitle} style={{ margin: "16px 0 8px" }}>Minutes</div>
                    {isReviewer ? (
                      <textarea
                        className={lStyles.viewModalOcrText}
                        rows={8}
                        value={reviseMinutes}
                        onChange={(e) => setReviseMinutes(e.target.value)}
                        placeholder="Minutes of the session..."
                      />
                    ) : (
                      <div style={{ fontSize: 13, whiteSpace: "pre-wrap", color: "var(--color-text-secondary)" }}>
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

                  {(isSecretary || isClerk) && (
                    <div style={{ marginBottom: 16 }}>
                      <div className={lStyles.viewModalCouncilTitle} style={{ marginBottom: 8 }}>
                        Or Replace With a File (re-runs text extraction)
                      </div>
                      <div className={lStyles.uploadZone} onClick={() => document.getElementById("reviseFileInputSes")?.click()}>
                        <div className={lStyles.uploadIcon}>📎</div>
                        <div className={lStyles.uploadText}>
                          {reviseFile ? reviseFile.name : "Click to choose a replacement file"}
                        </div>
                        <input
                          id="reviseFileInputSes"
                          type="file"
                          accept=".pdf,.doc,.docx,image/*"
                          style={{ display: "none" }}
                          onChange={(e) => setReviseFile(e.target.files?.[0] || null)}
                        />
                      </div>
                      {viewTarget.status !== "needs_revision" && (
                        <button
                          className={`${lStyles.btn} ${lStyles.btnSm}`}
                          style={{ marginTop: 8 }}
                          disabled={reviewSubmitting}
                          onClick={() => handleReviseSession(viewTarget.id)}
                        >
                          <Upload size={13} /> Save Revision
                        </button>
                      )}
                    </div>
                  )}

                  <div className={lStyles.commentsLabel}>Comments</div>
                  <div className={lStyles.commentsThread}>
                    {loadingComments ? (
                      <div style={{ fontSize: 13, textAlign: "center", padding: "1rem", color: "var(--color-text-secondary)" }}>
                        Loading comments...
                      </div>
                    ) : reviewComments.length === 0 ? (
                      <div style={{ fontSize: 13, textAlign: "center", padding: "1rem", color: "var(--color-text-secondary)" }}>
                        No comments yet
                      </div>
                    ) : (
                      reviewComments.map((c) => (
                        <div key={c.id} className={lStyles.comment}>
                          <div className={lStyles.commentMeta}>
                            <span className={lStyles.commentAuthor}>{c.author?.name || c.author_role}</span>
                            <span>
                              {new Date(c.created_at).toLocaleString("en-PH", {
                                month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className={lStyles.commentText}>{c.text}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {(isSecretary || isClerk) && (
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
                        disabled={reviewSubmitting || !reviewCommentText.trim()}
                        onClick={handleSendComment}
                      >
                        <Send size={13} />
                      </button>
                    </div>
                  )}

                  {reviewError && (
                    <div style={{ color: "#c53030", fontSize: 12, marginTop: 8 }}>{reviewError}</div>
                  )}

                  <div className={lStyles.viewModalFileActions} style={{ marginTop: 16 }}>
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
                          disabled={reviewSubmitting || !reviewCommentText.trim()}
                          title={!reviewCommentText.trim() ? "Enter a comment above explaining the requested changes" : ""}
                          onClick={handleRequestChanges}
                        >
                          Request Changes
                        </button>
                      </>
                    )}

                    {isClerk && viewTarget.status === "needs_revision" && (
                      <button
                        className={`${lStyles.btn} ${lStyles.btnSuccess}`}
                        disabled={reviewSubmitting}
                        onClick={() => handleResubmit(viewTarget.id)}
                      >
                        <Upload size={13} /> Save &amp; Resubmit
                      </button>
                    )}

                    {isViceMayor && viewTarget.status === "ready_to_publish" && (
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
