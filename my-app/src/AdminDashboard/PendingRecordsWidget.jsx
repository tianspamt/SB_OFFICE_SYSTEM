// PendingRecordsWidget.jsx
// "Needs your review" dashboard widget — shows the oldest-waiting pending
// legislative records (ordinances, resolutions, session minutes) scoped to
// the logged-in admin's role, and lets them act on a record without leaving
// the dashboard. The full backlog is one click away on each record's own
// module (Ordinances / Resolutions / Sessions), landing directly on that
// module's Pending tab.

import { useEffect, useState } from "react";
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
import { API, authFetch } from "./AdminContext";
import { StatusBadge } from "./LegislativeComponents";

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
  onNavigate,
  showMsg,
  style,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);

  // ── Role-aware status scope — mirrors the queue logic already used on
  // the Ordinances / Resolutions / Sessions pages, so this widget only ever
  // surfaces what the viewer is actually responsible for acting on.
  const pendingStatusesForRole = () => {
    if (isSecretary) return "pending,approved";
    if (isViceMayor) return "ready_to_publish";
    if (isClerk) return "needs_revision";
    return "pending,needs_revision,ready_to_publish,approved";
  };

  // Title reflects what this specific role is being asked to do, not just
  // a generic "pending" label — a Secretary is reviewing new drafts, a Vice
  // Mayor is approving finished ones, a Clerk is fixing flagged ones.
  const widgetTitle = () => {
    if (isSecretary) return "Pending your review";
    if (isViceMayor) return "Awaiting your approval";
    if (isClerk) return "Needs revision";
    return "Needs your review";
  };

  const fetchAllPending = async () => {
    setLoading(true);
    const statusQ = pendingStatusesForRole();
    const safeFetch = async (route) => {
      try {
        const res = await fetch(`${API}/api/${route}?status=${statusQ}`);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    };
    try {
      const [ordinances, resolutions, sessions] = await Promise.all([
        safeFetch("ordinances"),
        safeFetch("resolutions"),
        safeFetch("session-minutes"),
      ]);
      const tag = (list, type) =>
        list.map((item) => ({ ...item, record_type: type }));
      const merged = [
        ...tag(ordinances, "ordinance"),
        ...tag(resolutions, "resolution"),
        ...tag(sessions, "session_minutes"),
      ];
      // Oldest-waiting first — the items that have been sitting longest are
      // the ones most likely to stall the workflow, so they surface first
      // rather than being buried under newer submissions.
      merged.sort(
        (a, b) => new Date(getItemDate(a)) - new Date(getItemDate(b))
      );
      setItems(merged);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isViceMayor, isSecretary, isClerk]);

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
          <p className={styles.dashWidgetEmpty}>Loading pending records...</p>
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
          showMsg={showMsg}
          onClose={() => setReviewTarget(null)}
          onActionComplete={() => {
            setReviewTarget(null);
            fetchAllPending();
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
  showMsg,
  onClose,
  onActionComplete,
  onOpenFullRecord,
}) {
  const cfg = TYPE_CONFIG[item.record_type];
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [resubmitFile, setResubmitFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        const res = await authFetch(
          `${API}/api/comments?entity_type=${cfg.entityType}&entity_id=${item.id}`
        );
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      } catch {
        setComments([]);
      } finally {
        setLoadingComments(false);
      }
    };
    fetchComments();
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
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await authFetch(`${API}/api/comments`, {
        method: "POST",
        body: JSON.stringify({
          entity_type: cfg.entityType,
          entity_id: item.id,
          text: commentText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments((prev) => [...prev, data]);
        setCommentText("");
      } else setError(data.error || "Couldn't post comment.");
    } catch {
      setError("Server error.");
    } finally {
      setSubmitting(false);
    }
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

  const handleResubmit = async () => {
    if (!resubmitFile) {
      setError("Choose a replacement file before resubmitting.");
      return;
    }
    const fd = new FormData();
    fd.append("file", resubmitFile);
    if (item.record_type === "session_minutes") {
      await runAction(
        `/api/${cfg.route}/${item.id}/revise`,
        { method: "PUT", body: fd },
        `${cfg.label} resubmitted!`
      );
      return;
    }
    const replaced = await runAction(
      `/api/${cfg.route}/${item.id}/replace-file`,
      {
        method: "PUT",
        body: fd,
      }
    );
    if (replaced)
      runAction(
        `/api/${cfg.route}/${item.id}/resubmit`,
        { method: "PUT" },
        `${cfg.label} resubmitted!`
      );
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

          {isClerk && item.status === "needs_revision" && (
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
                  document.getElementById("widgetResubmitFile")?.click()
                }
              >
                <div className={lStyles.uploadIcon}>📎</div>
                <div className={lStyles.uploadText}>
                  {resubmitFile
                    ? resubmitFile.name
                    : "Click to choose a replacement file"}
                </div>
                <input
                  id="widgetResubmitFile"
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  style={{ display: "none" }}
                  onChange={(e) => setResubmitFile(e.target.files?.[0] || null)}
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

          {(isSecretary || isClerk) && (
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
                disabled={submitting || !commentText.trim()}
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

            {isClerk && item.status === "needs_revision" && (
              <button
                className={`${lStyles.btn} ${lStyles.btnSuccess}`}
                disabled={submitting}
                onClick={handleResubmit}
              >
                <Upload size={13} /> Replace File &amp; Resubmit
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
