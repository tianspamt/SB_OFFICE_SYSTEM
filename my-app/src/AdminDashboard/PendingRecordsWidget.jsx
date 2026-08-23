// PendingRecordsWidget.jsx
// "Needs your review" dashboard widget — shows the oldest-waiting pending
// legislative records (ordinances, resolutions, session minutes) scoped to
// the logged-in admin's role, and lets them act on a record without leaving
// the dashboard. The full backlog is one click away on each record's own
// module (Ordinances / Resolutions / Sessions), landing directly on that
// module's Pending tab.

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ScrollText,
  FileText,
  BookOpen,
  ArrowUpRight,
  X,
  Check,
  Send,
  Upload,
} from "lucide-react";
import styles from "./AdminDashboard.module.css";
import lStyles from "./LegislativeModule.module.css";
import { API, authFetch, pendingQueryKey, fetchPendingList } from "./AdminContext";
import { StatusBadge } from "./LegislativeComponents";
import { pendingStatusesForRole, useCommentThread } from "./useLegislativeReview";

// ─── Per-record-type wiring ───────────────────────────────────────────────
// Keeps this widget generic across the three legislative record types
// instead of duplicating three near-identical components.
const TYPE_CONFIG = {
  ordinance: {
    label: "Ordinance",
    route: "ordinances",
    tabKey: "ordinances",
    entityType: "ordinance",
    numberField: "ordinance_number",
    icon: ScrollText,
    iconBg: "#e3f2fd",
    iconColor: "#1976d2",
  },
  resolution: {
    label: "Resolution",
    route: "resolutions",
    tabKey: "resolutions",
    entityType: "resolution",
    numberField: "resolution_number",
    icon: FileText,
    iconBg: "#e8f5e9",
    iconColor: "#388e3c",
  },
  session_minutes: {
    label: "Session",
    route: "session-minutes",
    tabKey: "sessions",
    entityType: "session_minutes",
    numberField: "session_number",
    icon: BookOpen,
    iconBg: "#fff3e0",
    iconColor: "#f57c00",
  },
};

const MAX_ITEMS_SHOWN = 6;

const getItemDate = (item) =>
  item.uploaded_at || item.session_date || item.created_at || null;

const getItemTitle = (item) =>
  item.title ||
  item.session_number ||
  (item.session_date
    ? new Date(item.session_date).toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Untitled record");

const timeAgo = (dateStr) => {
  if (!dateStr) return "—";
  const days = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 86400000
  );
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months <= 1 ? "1 month ago" : `${months} months ago`;
};

export default function PendingRecordsWidget({
  isViceMayor = false,
  isSecretary = false,
  isClerk = false,
  isCouncilor = false,
  onNavigate,
  showMsg,
  style,
}) {
  const [reviewTarget, setReviewTarget] = useState(null);
  const queryClient = useQueryClient();
  const statusQ = pendingStatusesForRole({ isSecretary, isViceMayor });

  // Same query key + fetcher as each module's own Pending tab
  // (OrdinancesPage/ResolutionsPage/SessionsPage) — sharing the cache entry
  // is what stops this widget and that tab from independently re-fetching
  // the identical list when both get visited in the same session.
  const ordinancesQuery = useQuery({
    queryKey: pendingQueryKey("ordinances", statusQ),
    queryFn: () => fetchPendingList("ordinances", statusQ),
    staleTime: 15000,
  });
  const resolutionsQuery = useQuery({
    queryKey: pendingQueryKey("resolutions", statusQ),
    queryFn: () => fetchPendingList("resolutions", statusQ),
    staleTime: 15000,
  });
  const sessionsQuery = useQuery({
    queryKey: pendingQueryKey("session-minutes", statusQ),
    queryFn: () => fetchPendingList("session-minutes", statusQ),
    staleTime: 15000,
  });
  const loading =
    ordinancesQuery.isLoading || resolutionsQuery.isLoading || sessionsQuery.isLoading;

  // Title reflects what this specific role is being asked to do, not just
  // a generic "pending" label — a Secretary is reviewing new drafts, a Vice
  // Mayor is approving finished ones, a Clerk/Councilor is drafting/fixing.
  const widgetTitle = () => {
    if (isSecretary) return "Pending your review";
    if (isViceMayor) return "Awaiting your approval";
    if (isClerk || isCouncilor) return "Drafts in progress";
    return "Needs your review";
  };

  // Oldest-waiting first — the items that have been sitting longest are the
  // ones most likely to stall the workflow, so they surface first rather
  // than being buried under newer submissions.
  const items = useMemo(() => {
    const tag = (list, type) =>
      (list || []).map((item) => ({ ...item, record_type: type }));
    const merged = [
      ...tag(ordinancesQuery.data, "ordinance"),
      ...tag(resolutionsQuery.data, "resolution"),
      ...tag(sessionsQuery.data, "session_minutes"),
    ];
    merged.sort((a, b) => new Date(getItemDate(a)) - new Date(getItemDate(b)));
    return merged;
  }, [ordinancesQuery.data, resolutionsQuery.data, sessionsQuery.data]);

  const visibleItems = items.slice(0, MAX_ITEMS_SHOWN);

  return (
    <>
      <div
        className={styles.dashWidget}
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          ...style,
        }}
      >
        <div className={styles.dashWidgetHeader}>
          <AlertCircle size={14} strokeWidth={2} />
          <span className={styles.dashWidgetTitle}>{widgetTitle()}</span>
          {items.length > 0 && (
            <span className={styles.dashSectionCount}>{items.length}</span>
          )}
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                style={{ border: "1px solid #f1f5f9", borderRadius: 10, padding: 10 }}
              >
                <div className={styles.skeleton} style={{ height: 16, width: 90, borderRadius: 10, marginBottom: 8 }} />
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div className={styles.skeleton} style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className={styles.skeleton} style={{ height: 12.5, width: "75%", borderRadius: 4, marginBottom: 6 }} />
                    <div className={styles.skeleton} style={{ height: 11, width: "50%", borderRadius: 4 }} />
                  </div>
                </div>
                <div className={styles.skeleton} style={{ height: 26, width: "100%", borderRadius: 8, marginTop: 8 }} />
              </div>
            ))}
          </div>
        ) : visibleItems.length === 0 ? (
          <p className={styles.dashWidgetEmpty}>
            Nothing waiting on you right now.
          </p>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              flex: 1,
              minHeight: 0,
              maxHeight: 480,
              overflowY: "auto",
              paddingRight: 4,
              marginRight: -4,
            }}
          >
            {visibleItems.map((item) => {
              const cfg = TYPE_CONFIG[item.record_type];
              const Icon = cfg.icon;
              return (
                <div
                  key={`${item.record_type}-${item.id}`}
                  style={{
                    border: "1px solid #f1f5f9",
                    borderRadius: 10,
                    padding: 10,
                  }}
                >
                  <StatusBadge status={item.status} />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      marginTop: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        flexShrink: 0,
                        marginTop: 1,
                        background: cfg.iconBg,
                        color: cfg.iconColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon size={12} />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          fontWeight: 700,
                          color: "#1e293b",
                          lineHeight: 1.3,
                        }}
                      >
                        {getItemTitle(item)}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}
                      >
                        {cfg.label}
                        {item.author ? ` · ${item.author}` : ""} ·{" "}
                        {timeAgo(getItemDate(item))}
                      </div>
                    </div>
                  </div>
                  <button
                    style={{
                      marginTop: 8,
                      width: "100%",
                      fontSize: 11.5,
                      fontWeight: 700,
                      color: "#009439",
                      background: "#f0fdf4",
                      border: "1px solid #9ae6b4",
                      borderRadius: 8,
                      padding: "6px 0",
                      cursor: "pointer",
                    }}
                    onClick={() => setReviewTarget(item)}
                  >
                    Review
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {reviewTarget && (
        <ReviewModal
          item={reviewTarget}
          isViceMayor={isViceMayor}
          isSecretary={isSecretary}
          isClerk={isClerk}
          isCouncilor={isCouncilor}
          showMsg={showMsg}
          onClose={() => setReviewTarget(null)}
          onActionComplete={() => {
            const cfg = TYPE_CONFIG[reviewTarget.record_type];
            setReviewTarget(null);
            queryClient.invalidateQueries({ queryKey: pendingQueryKey(cfg.route, statusQ) });
          }}
          onOpenFullRecord={() => {
            const cfg = TYPE_CONFIG[reviewTarget.record_type];
            setReviewTarget(null);
            onNavigate?.(cfg.tabKey, "pending");
          }}
        />
      )}
    </>
  );
}

// ─── Inline review modal ────────────────────────────────────────────────────
// A compact version of the review workflow already built into the
// Ordinances / Resolutions / Sessions pages — comment thread + the one
// status-appropriate action for the viewer's role — so records can be acted
// on without navigating away from the dashboard.
function ReviewModal({
  item,
  isViceMayor,
  isSecretary,
  isClerk,
  isCouncilor,
  showMsg,
  onClose,
  onActionComplete,
  onOpenFullRecord,
}) {
  const cfg = TYPE_CONFIG[item.record_type];
  const [commentText, setCommentText] = useState("");
  const [replacementFile, setReplacementFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { comments, loadingComments, commentSubmitting, fetchComments, sendComment } = useCommentThread();

  useEffect(() => {
    fetchComments(cfg.entityType, item.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  const runAction = async (path, options = {}, successMsg) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await authFetch(`${API}${path}`, options);
      const data = await res.json();
      if (res.ok) {
        if (successMsg) showMsg?.(successMsg);
        onActionComplete();
        return true;
      }
      setError(data.error || "Action failed.");
      return false;
    } catch {
      setError("Server error.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendComment = async () => {
    const result = await sendComment(cfg.entityType, item.id, commentText);
    if (result.ok) setCommentText("");
    else if (result.error) setError(result.error);
  };

  const handleAccept = () =>
    runAction(
      `/api/${cfg.route}/${item.id}/accept`,
      { method: "PUT" },
      `${cfg.label} approved!`
    );

  const handleRequestChanges = () => {
    if (!commentText.trim()) {
      setError("Add a comment above explaining the requested changes.");
      return;
    }
    runAction(
      `/api/${cfg.route}/${item.id}/request-changes`,
      { method: "PUT" },
      "Changes requested."
    );
  };

  const handleVMApprove = () =>
    runAction(
      `/api/${cfg.route}/${item.id}/vm-approve`,
      { method: "PUT" },
      `${cfg.label} approved!`
    );

  const handlePublish = () =>
    runAction(
      `/api/${cfg.route}/${item.id}/publish`,
      { method: "PUT" },
      `${cfg.label} published!`
    );

  // Replacing the file is the whole action now — the backend auto-flips a
  // needs_revision record back to pending as part of the same request, so
  // there's no separate "resubmit" call to chain afterward.
  const handleReplaceFile = () => {
    if (!replacementFile) {
      setError("Choose a replacement file first.");
      return;
    }
    const fd = new FormData();
    fd.append("file", replacementFile);
    const action = item.record_type === "session_minutes" ? "revise" : "replace-file";
    const successMsg =
      item.status === "needs_revision"
        ? `${cfg.label} resubmitted!`
        : `${cfg.label} file updated!`;
    runAction(`/api/${cfg.route}/${item.id}/${action}`, { method: "PUT", body: fd }, successMsg);
  };

  return (
    <div className={lStyles.viewModalOverlay} onClick={onClose}>
      <div className={lStyles.viewModal} onClick={(e) => e.stopPropagation()}>
        <div className={lStyles.viewModalHeader}>
          <div className={lStyles.viewModalHeaderTop}>
            <div className={lStyles.viewModalHeaderInfo}>
              {item[cfg.numberField] && (
                <div className={lStyles.viewModalOrdNumber}>
                  <FileText size={12} />
                  {item[cfg.numberField]}
                </div>
              )}
              <h2 className={lStyles.viewModalTitle}>{getItemTitle(item)}</h2>
            </div>
            <button
              className={lStyles.viewModalCloseBtn}
              onClick={onClose}
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className={lStyles.viewModalBody}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <StatusBadge status={item.status} />
            <span
              style={{ fontSize: 12, color: "var(--color-text-secondary)" }}
            >
              {cfg.label} · submitted {timeAgo(getItemDate(item))}
              {item.author ? ` by ${item.author}` : ""}
            </span>
          </div>

          {item.description && (
            <p
              style={{
                fontSize: 13,
                color: "var(--color-text-secondary)",
                marginBottom: 14,
              }}
            >
              {item.description}
            </p>
          )}
          {item.agenda && (
            <p
              style={{
                fontSize: 13,
                color: "var(--color-text-secondary)",
                marginBottom: 14,
                whiteSpace: "pre-wrap",
              }}
            >
              {item.agenda}
            </p>
          )}

          <div className={lStyles.viewModalDivider} />

          {(isSecretary || isClerk || isCouncilor) && (
            <div style={{ marginBottom: 16 }}>
              <div
                className={lStyles.viewModalCouncilTitle}
                style={{ marginBottom: 8 }}
              >
                Replace Draft File
              </div>
              <div
                className={lStyles.uploadZone}
                onClick={() =>
                  document.getElementById("widgetReplacementFile")?.click()
                }
              >
                <div className={lStyles.uploadIcon}>📎</div>
                <div className={lStyles.uploadText}>
                  {replacementFile
                    ? replacementFile.name
                    : "Click to choose a replacement file"}
                </div>
                <input
                  id="widgetReplacementFile"
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  style={{ display: "none" }}
                  onChange={(e) => setReplacementFile(e.target.files?.[0] || null)}
                />
              </div>
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
            ) : comments.length === 0 ? (
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
              comments.map((c, i) => (
                <div key={c.id ?? i} className={lStyles.comment}>
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
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button
                className={`${lStyles.btn} ${lStyles.btnSm}`}
                disabled={commentSubmitting || !commentText.trim()}
                onClick={handleSendComment}
              >
                <Send size={13} />
              </button>
            </div>
          )}

          {error && (
            <div style={{ color: "#c53030", fontSize: 12, marginTop: 8 }}>
              {error}
            </div>
          )}

          <div
            className={lStyles.viewModalFileActions}
            style={{ marginTop: 16 }}
          >
            {isSecretary && item.status === "pending" && (
              <div className={lStyles.pendingActionsRow}>
                <button
                  className={`${lStyles.pillActionBtn} ${lStyles.pillReject}`}
                  disabled={submitting || !commentText.trim()}
                  title={
                    !commentText.trim()
                      ? "Enter a comment above explaining the requested changes"
                      : ""
                  }
                  onClick={handleRequestChanges}
                >
                  <X size={16} /> Request Changes
                </button>
                <button
                  className={`${lStyles.pillActionBtn} ${lStyles.pillAccept}`}
                  disabled={submitting}
                  onClick={handleAccept}
                >
                  <Check size={16} /> Accept
                </button>
              </div>
            )}

            {(isSecretary || isClerk || isCouncilor) && (
              <button
                className={`${lStyles.btn} ${lStyles.btnSuccess}`}
                disabled={submitting || !replacementFile}
                onClick={handleReplaceFile}
              >
                <Upload size={13} />{" "}
                {item.status === "needs_revision" ? "Replace File & Resubmit" : "Replace File"}
              </button>
            )}

            {isViceMayor && item.status === "ready_to_publish" && (
              <button
                className={`${lStyles.btn} ${lStyles.btnSuccess}`}
                disabled={submitting}
                onClick={handleVMApprove}
              >
                ✅ Approve
              </button>
            )}

            {isSecretary && item.status === "approved" && (
              <button
                className={`${lStyles.btn} ${lStyles.btnSuccess}`}
                disabled={submitting}
                onClick={handlePublish}
              >
                ✅ Publish
              </button>
            )}
          </div>
        </div>

        <div className={lStyles.viewModalFooter}>
          <button
            className={lStyles.viewModalFooterBtn}
            onClick={onOpenFullRecord}
          >
            Open full record <ArrowUpRight size={13} />
          </button>
          <button
            className={`${lStyles.viewModalFooterBtn} ${lStyles.viewModalFooterBtnClose}`}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
