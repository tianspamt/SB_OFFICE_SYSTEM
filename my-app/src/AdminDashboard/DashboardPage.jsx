import { useState } from "react";
import {
  ScrollText,
  FileText,
  ClipboardList,
  ChevronRight,
  ExternalLink,
  Calendar,
  Megaphone,
  TrendingUp,
  BookOpen,
  ArrowUpRight,
  Clock,
  Hash,
  Plus,
  Gavel,
} from "lucide-react";
import styles from "./AdminDashboard.module.css";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// ─── Empty State ──────────────────────────────────────────────────────────────
const EmptyState = ({ icon: Icon, label }) => (
  <div className={styles.dashEmptyState}>
    <Icon size={32} strokeWidth={1.2} className={styles.dashEmptyIcon} />
    <p>No {label} yet</p>
  </div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, color, count, onViewAll }) => (
  <div className={styles.dashSectionHeader}>
    <div className={styles.dashSectionLeft}>
      <span
        className={styles.dashSectionIconWrap}
        style={{ background: color + "18", color }}
      >
        <Icon size={17} strokeWidth={2} />
      </span>
      <h3 className={styles.dashSectionTitle}>{title}</h3>
      {count > 0 && <span className={styles.dashSectionCount}>{count}</span>}
    </div>
    {onViewAll && (
      <button className={styles.dashViewAllBtn} onClick={onViewAll}>
        View all <ArrowUpRight size={13} />
      </button>
    )}
  </div>
);

// ─── Ordinance Card ───────────────────────────────────────────────────────────
const OrdinanceCard = ({ item }) => (
  <div className={styles.dashItemCard}>
    <div className={styles.dashCardTop}>
      <span className={styles.dashApprovedBadge}>Approved</span>
      <span className={styles.dashCardMeta}>
        <Hash size={11} />
        {item.ordinance_no}
      </span>
    </div>
    <h4 className={styles.dashCardTitle}>{item.title}</h4>
    {item.description && (
      <p className={styles.dashCardDesc}>
        {item.description.length > 100
          ? item.description.substring(0, 100) + "…"
          : item.description}
      </p>
    )}
    <div className={styles.dashCardFooter}>
      <span className={styles.dashCardDate}>
        <Calendar size={11} />
        {formatDate(item.date_approved)}
      </span>
      <button className={styles.dashCardBtn}>
        View <ChevronRight size={12} />
      </button>
    </div>
  </div>
);

// ─── Resolution Card ──────────────────────────────────────────────────────────
const ResolutionCard = ({ item }) => (
  <div className={styles.dashItemCard}>
    <div className={styles.dashCardTop}>
      <span className={styles.dashApprovedBadge}>Approved</span>
      <span className={styles.dashCardMeta}>
        <Hash size={11} />
        {item.resolution_no}
      </span>
    </div>
    <h4 className={styles.dashCardTitle}>{item.title}</h4>
    {item.description && (
      <p className={styles.dashCardDesc}>
        {item.description.length > 100
          ? item.description.substring(0, 100) + "…"
          : item.description}
      </p>
    )}
    {item.linked_ordinance && (
      <div className={styles.dashLinkedBadge}>
        <ExternalLink size={11} />
        Based on Ordinance No. {item.linked_ordinance}
      </div>
    )}
    <div className={styles.dashCardFooter}>
      <span className={styles.dashCardDate}>
        <Calendar size={11} />
        {formatDate(item.date_approved)}
      </span>
      <button className={styles.dashCardBtn}>
        View <ChevronRight size={12} />
      </button>
    </div>
  </div>
);

// ─── Session Card ─────────────────────────────────────────────────────────────
const SessionCard = ({ item }) => (
  <div className={styles.dashItemCard}>
    <div className={styles.dashCardTop}>
      <span className={styles.dashSessionBadge}>
        {item.session_type || "Regular Session"}
      </span>
      <span className={styles.dashCardMeta}>
        <Clock size={11} />
        {item.session_no ? `No. ${item.session_no}` : "—"}
      </span>
    </div>
    <h4 className={styles.dashCardTitle}>{item.title}</h4>
    {item.agenda && (
      <p className={styles.dashCardDesc}>
        {item.agenda.length > 100
          ? item.agenda.substring(0, 100) + "…"
          : item.agenda}
      </p>
    )}
    <div className={styles.dashCardFooter}>
      <span className={styles.dashCardDate}>
        <Calendar size={11} />
        {formatDate(item.session_date)}
      </span>
      <button className={styles.dashCardBtn}>
        View <ChevronRight size={12} />
      </button>
    </div>
  </div>
);

// ─── Announcement Card (full — used elsewhere if needed) ──────────────────────
const AnnouncementCard = ({ post }) => (
  <div className={styles.dashPostCard}>
    {post.image_url && (
      <img
        src={post.image_url}
        alt={post.title}
        className={styles.dashPostThumb}
      />
    )}
    <div className={styles.dashPostBody}>
      <div className={styles.dashPostMeta}>
        <span className={styles.dashPostTag}>
          <Megaphone size={10} /> Announcement
        </span>
        <span className={styles.dashCardDate}>
          <Calendar size={11} />
          {formatDate(post.date_published)}
        </span>
      </div>
      <h4 className={styles.dashPostTitle}>{post.title}</h4>
      {post.content && (
        <p className={styles.dashPostPreview}>
          {post.content.length > 130
            ? post.content.substring(0, 130) + "…"
            : post.content}
        </p>
      )}
      <button className={styles.dashReadMoreBtn}>
        Read More <ArrowUpRight size={12} />
      </button>
    </div>
  </div>
);

// ─── Sidebar widget shell ──────────────────────────────────────────────────────
const DashWidget = ({ icon: Icon, title, children }) => (
  <div className={styles.dashWidget}>
    <div className={styles.dashWidgetHeader}>
      <Icon size={14} strokeWidth={2} />
      <span className={styles.dashWidgetTitle}>{title}</span>
    </div>
    {children}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const DashboardPage = ({
  ordinances = [],
  resolutions = [],
  sessionMinutes = [],
  announcements = [],
  onNavigate,
  canQuickAdd = false,
  onAddOrdinance,
  onAddResolution,
  onAddSession,
  onAddAnnouncement,
}) => {
  const [activityTab, setActivityTab] = useState("ordinances");

  const latestOrdinances = ordinances.slice(0, 6);
  const latestResolutions = resolutions.slice(0, 6);
  const latestSessions = sessionMinutes.slice(0, 6);
  const latestAnnouncements = announcements.slice(0, 3);

  // Upcoming sessions: soonest future session first; if none are upcoming,
  // fall back to the most recently held ones so the widget isn't empty.
  const today = new Date().toISOString().split("T")[0];
  const upcomingSessions = [...sessionMinutes]
    .filter((s) => s.session_date && s.session_date >= today)
    .sort((a, b) => (a.session_date < b.session_date ? -1 : 1))
    .slice(0, 3);
  const recentSessionsFallback =
    upcomingSessions.length > 0
      ? upcomingSessions
      : [...sessionMinutes]
          .filter((s) => s.session_date)
          .sort((a, b) => (a.session_date > b.session_date ? -1 : 1))
          .slice(0, 3);

  const stats = [
    {
      label: "Total Ordinances",
      value: ordinances.length,
      icon: ScrollText,
      iconBg: "#e3f2fd",
      iconColor: "#1976d2",
      trend: "+2 this month",
    },
    {
      label: "Total Resolutions",
      value: resolutions.length,
      icon: FileText,
      iconBg: "#e8f5e9",
      iconColor: "#388e3c",
      trend: "+1 this month",
    },
    {
      label: "Session Minutes",
      value: sessionMinutes.length,
      icon: ClipboardList,
      iconBg: "#fff3e0",
      iconColor: "#f57c00",
      trend: "Latest on record",
    },
    {
      label: "Announcements",
      value: announcements.length,
      icon: Megaphone,
      iconBg: "#fce4ec",
      iconColor: "#c2185b",
      trend: "Active posts",
    },
  ];

  const ACTIVITY_TABS = [
    {
      id: "ordinances",
      label: "Ordinances",
      icon: ScrollText,
      color: "#1976d2",
      count: ordinances.length,
      items: latestOrdinances,
      emptyIcon: ScrollText,
      emptyLabel: "ordinances",
      renderItem: (item) => <OrdinanceCard key={item.id} item={item} />,
    },
    {
      id: "resolutions",
      label: "Resolutions",
      icon: FileText,
      color: "#388e3c",
      count: resolutions.length,
      items: latestResolutions,
      emptyIcon: FileText,
      emptyLabel: "resolutions",
      renderItem: (item) => <ResolutionCard key={item.id} item={item} />,
    },
    {
      id: "sessions",
      label: "Sessions",
      icon: BookOpen,
      color: "#f57c00",
      count: sessionMinutes.length,
      items: latestSessions,
      emptyIcon: ClipboardList,
      emptyLabel: "session minutes",
      renderItem: (item) => <SessionCard key={item.id} item={item} />,
    },
  ];

  const activeTabConfig =
    ACTIVITY_TABS.find((t) => t.id === activityTab) || ACTIVITY_TABS[0];

  return (
    <div className={styles.dashboardContainer}>
      {/* ── Welcome Banner ── */}
      <div className={styles.dashWelcomeBanner}>
        <div className={styles.dashWelcomeText}>
          <h2 className={styles.dashWelcomeTitle}>Welcome back 👋</h2>
          <p className={styles.dashWelcomeSub}>
            Here's what's happening in the Sangguniang Bayan Office today.
          </p>
        </div>
        <div className={styles.dashWelcomeDate}>
          <Calendar size={14} />
          {new Date().toLocaleDateString("en-PH", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className={styles.dashStatsRow}>
        {stats.map((s) => (
          <div key={s.label} className={styles.dashStatCard}>
            <div className={styles.dashStatTop}>
              <div
                className={styles.dashStatIconWrap}
                style={{ background: s.iconBg }}
              >
                <s.icon size={22} color={s.iconColor} strokeWidth={1.8} />
              </div>
              <div className={styles.dashStatBody}>
                <span className={styles.dashStatValue}>{s.value}</span>
                <span className={styles.dashStatLabel}>{s.label}</span>
              </div>
            </div>
            <div className={styles.dashStatTrend}>
              <TrendingUp size={10} />
              {s.trend}
            </div>
          </div>
        ))}
      </div>

      {/* ── Body: main activity feed + sidebar ── */}
      <div className={styles.dashBody}>
        {/* Main — tabbed recent activity */}
        <div className={styles.dashMainPanel}>
          <div className={styles.dashTabRow}>
            {ACTIVITY_TABS.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.dashTabBtn} ${
                  activityTab === tab.id ? styles.dashTabBtnActive : ""
                }`}
                onClick={() => setActivityTab(tab.id)}
              >
                <tab.icon size={14} strokeWidth={2} />
                {tab.label}
                {tab.count > 0 && (
                  <span className={styles.dashSectionCount}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          <SectionHeader
            icon={activeTabConfig.icon}
            title={`Latest ${activeTabConfig.label}`}
            color={activeTabConfig.color}
            count={0}
            onViewAll={onNavigate ? () => onNavigate(activeTabConfig.id) : null}
          />

          {activeTabConfig.items.length === 0 ? (
            <EmptyState
              icon={activeTabConfig.emptyIcon}
              label={activeTabConfig.emptyLabel}
            />
          ) : (
            <div className={styles.dashCardGrid}>
              {activeTabConfig.items.map(activeTabConfig.renderItem)}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className={styles.dashSidebar}>
          {canQuickAdd && (
            <DashWidget icon={Plus} title="Quick actions">
              <div className={styles.dashQuickActions}>
                <button
                  className={styles.quickActionBtn}
                  onClick={onAddOrdinance}
                >
                  <ScrollText size={14} /> Upload ordinance
                </button>
                <button
                  className={styles.quickActionBtn}
                  onClick={onAddResolution}
                >
                  <Gavel size={14} /> Upload resolution
                </button>
                <button
                  className={styles.quickActionBtn}
                  onClick={onAddSession}
                >
                  <BookOpen size={14} /> Add session
                </button>
                <button
                  className={styles.quickActionBtn}
                  onClick={onAddAnnouncement}
                >
                  <Megaphone size={14} /> Post announcement
                </button>
              </div>
            </DashWidget>
          )}

          <DashWidget icon={Clock} title="Upcoming sessions">
            {recentSessionsFallback.length === 0 ? (
              <p className={styles.dashWidgetEmpty}>No sessions on record.</p>
            ) : (
              <div className={styles.dashUpcomingList}>
                {recentSessionsFallback.map((s) => (
                  <div key={s.id} className={styles.dashUpcomingItem}>
                    <div className={styles.dashUpcomingDate}>
                      {formatDate(s.session_date)}
                    </div>
                    <div className={styles.dashUpcomingTitle}>
                      {s.title || s.session_type || "Session"}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {onNavigate && (
              <button
                className={styles.dashWidgetViewAll}
                onClick={() => onNavigate("sessions")}
              >
                View all sessions <ArrowUpRight size={12} />
              </button>
            )}
          </DashWidget>

          <DashWidget icon={Megaphone} title="Announcements">
            {latestAnnouncements.length === 0 ? (
              <p className={styles.dashWidgetEmpty}>No announcements yet.</p>
            ) : (
              <div className={styles.dashMiniAnnList}>
                {latestAnnouncements.map((post) => (
                  <div key={post.id} className={styles.dashMiniAnn}>
                    <div className={styles.dashMiniAnnTitle}>{post.title}</div>
                    <div className={styles.dashMiniAnnDate}>
                      <Calendar size={10} />
                      {formatDate(post.date_published)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {onNavigate && (
              <button
                className={styles.dashWidgetViewAll}
                onClick={() => onNavigate("announcements")}
              >
                View all announcements <ArrowUpRight size={12} />
              </button>
            )}
          </DashWidget>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
