// PendingRecordsWidget.jsx
// "Needs your review" dashboard widget — shows the oldest-waiting pending
// legislative records (ordinances, resolutions) scoped to the logged-in
// admin's role. "Review" opens the record in its module's own View modal
// (onReview — AdminDashboard renders OrdinancesPage/ResolutionsPage in
// view-only mode), so acting on it from the dashboard is identical to acting
// on it inside Ordinances / Resolutions.

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ScrollText, FileText } from "lucide-react";
import styles from "./AdminDashboard.module.css";
import { pendingQueryKey, fetchPendingList } from "./AdminContext";
import { StatusBadge } from "./LegislativeComponents";
import { actionableStatusesForRole } from "./useLegislativeReview";

// ─── Per-record-type wiring ───────────────────────────────────────────────
// Keeps this widget generic across the legislative record types that still
// have a pending/review workflow. Session minutes used to be a third entry
// here, but recording one is now immediate (no pending/VM-approval step —
// see routes/sessionMinutes.js and SessionsPage.jsx), so it never has
// anything to surface in this widget and was dropped.
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
  // (item) => void — opens the record in its module's own View modal
  // (AdminDashboard renders OrdinancesPage/ResolutionsPage in view-only mode),
  // so reviewing from the dashboard is identical to reviewing in the module.
  onReview,
  style,
}) {
  const statusQ = actionableStatusesForRole({ isSecretary, isViceMayor });

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
  const loading = ordinancesQuery.isLoading || resolutionsQuery.isLoading;

  // Title reflects what this specific role is being asked to do, not just
  // a generic "pending" label — a Secretary is reviewing new drafts, a Vice
  // Mayor is approving finished ones. Clerk/Councilor just see "Pending":
  // their drafts plus records moving through the readings.
  const widgetTitle = () => {
    if (isSecretary) return "Pending your review";
    if (isViceMayor) return "Awaiting your approval";
    if (isClerk || isCouncilor) return "Pending";
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
    ];
    merged.sort((a, b) => new Date(getItemDate(a)) - new Date(getItemDate(b)));
    return merged;
  }, [ordinancesQuery.data, resolutionsQuery.data]);

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
                      color: "#090446",
                      background: "#eef2ff",
                      border: "1px solid #a5b4fc",
                      borderRadius: 8,
                      padding: "6px 0",
                      cursor: "pointer",
                    }}
                    onClick={() => onReview?.(item)}
                  >
                    Review
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </>
  );
}
