import { useState } from "react";
import {
  ScrollText,
  FileText,
  ClipboardList,
  ChevronRight,
  ExternalLink,
  Calendar,
  Megaphone,
  BookOpen,
  ArrowUpRight,
  Clock,
  Hash,
  Plus,
  Gavel,
  User,
  Tag,
  MapPin,
} from "lucide-react";
import styles from "./AdminDashboard.module.css";
import PendingRecordsWidget from "./PendingRecordsWidget";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// For full ISO timestamps (e.g. announcements.created_at) — unlike formatDate
// above, these already carry a real time/timezone, so appending "T00:00:00"
// would corrupt the string instead of protecting against a timezone shift.
const formatTimestamp = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PH", {
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
    {item.category && (
      <span className={styles.dashCardCategory}>
        <Tag size={10} />
        {item.category}
      </span>
    )}
    {item.description && (
      <p className={styles.dashCardDesc}>
        {item.description.length > 100
          ? item.description.substring(0, 100) + "…"
          : item.description}
      </p>
    )}
    {(item.author || item.officials?.length > 0) && (
      <span className={styles.dashCardAuthor}>
        <User size={11} />
        {item.author ||
          (item.officials.length === 1
            ? item.officials[0].full_name
            : `${item.officials.length} council members`)}
      </span>
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
    {item.category && (
      <span className={styles.dashCardCategory}>
        <Tag size={10} />
        {item.category}
      </span>
    )}
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
    {(item.author || item.officials?.length > 0) && (
      <span className={styles.dashCardAuthor}>
        <User size={11} />
        {item.author ||
          (item.officials.length === 1
            ? item.officials[0].full_name
            : `${item.officials.length} council members`)}
      </span>
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
    {item.venue && (
      <span className={styles.dashCardCategory}>
        <MapPin size={10} />
        {item.venue}
      </span>
    )}
    {item.agenda && (
      <span className={styles.dashCardAuthor}>
        <ClipboardList size={11} />
        {item.agenda.split("\n").filter(Boolean).length} agenda item
        {item.agenda.split("\n").filter(Boolean).length !== 1 ? "s" : ""}
      </span>
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
          {formatTimestamp(post.created_at)}
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
const DashWidget = ({ icon: Icon, title, badge, children }) => (
  <div className={styles.dashWidget}>
    <div className={styles.dashWidgetHeader}>
      <Icon size={14} strokeWidth={2} />
      <span className={styles.dashWidgetTitle}>{title}</span>
      {badge > 0 && (
        <span className={styles.dashWidgetBadge}>
          {badge} new
        </span>
      )}
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
  unreadAnnouncements = 0,
  onNavigate,
  canQuickAdd = false,
  onAddOrdinance,
  onAddResolution,
  onAddSession,
  onAddAnnouncement,
  isViceMayor = false,
  isSecretary = false,
  isClerk = false,
}) => {
  const [activityTab, setActivityTab] = useState("ordinances");

  const latestOrdinances = ordinances.slice(0, 6);
  const latestResolutions = resolutions.slice(0, 6);
  const latestSessions = sessionMinutes.slice(0, 6);
  const latestAnnouncements = announcements.slice(0, 2);

  // Upcoming sessions: soonest future session first; if none are upcoming,
  // fall back to the most recently held ones so the widget isn't empty.
  const today = new Date().toISOString().split("T")[0];
  const upcomingSessions = [...sessionMinutes]
    .filter((s) => s.session_date && s.session_date >= today)
    .sort((a, b) => (a.session_date < b.session_date ? -1 : 1))
    .slice(0, 2);
  const recentSessionsFallback =
    upcomingSessions.length > 0
      ? upcomingSessions
      : [...sessionMinutes]
          .filter((s) => s.session_date)
          .sort((a, b) => (a.session_date > b.session_date ? -1 : 1))
          .slice(0, 2);

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
      {/* ── Top bar: greeting + inline stat chips combined ── */}
      <div className={styles.dashTopBar}>
        <div className={styles.dashWelcomeText}>
          <h2 className={styles.dashWelcomeTitle}>Welcome back 👋</h2>
          <p className={styles.dashWelcomeSub}>
            Here's what's happening in the Sangguniang Bayan Office today.
          </p>
        </div>
        <div className={styles.dashTopBarStats}>
          {stats.map((s) => (
            <div key={s.label} className={styles.dashStatChip}>
              <s.icon size={14} strokeWidth={2} />
              <span className={styles.dashStatChipValue}>{s.value}</span>
              <span className={styles.dashStatChipLabel}>{s.label}</span>
            </div>
          ))}
        </div>
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

        {/* Sidebar: Quick actions on top, Pending Review fills the rest */}
        <div className={styles.dashSidebar}>
          {canQuickAdd && (
            <DashWidget icon={Plus} title="Quick actions">
              <div className={styles.dashQuickActionsGrid}>
                <button
                  className={styles.quickActionIconBtn}
                  onClick={onAddOrdinance}
                >
                  <ScrollText size={16} /> Ordinance
                </button>
                <button
                  className={styles.quickActionIconBtn}
                  onClick={onAddResolution}
                >
                  <Gavel size={16} /> Resolution
                </button>
                <button
                  className={styles.quickActionIconBtn}
                  onClick={onAddSession}
                >
                  <BookOpen size={16} /> Session
                </button>
                <button
                  className={styles.quickActionIconBtn}
                  onClick={onAddAnnouncement}
                >
                  <Megaphone size={16} /> Announce
                </button>
              </div>
            </DashWidget>
          )}

          {(isViceMayor || isSecretary || isClerk) && (
            <PendingRecordsWidget
              isViceMayor={isViceMayor}
              isSecretary={isSecretary}
              isClerk={isClerk}
              onNavigate={onNavigate}
              style={{ flex: 1, minHeight: 0 }}
            />
          )}
        </div>
      </div>

      {/* ── Bottom row: Announcements + Upcoming session, side by side ── */}
      <div className={styles.dashBottomRow}>
        <DashWidget icon={Megaphone} title="Latest announcements" badge={unreadAnnouncements}>
          {latestAnnouncements.length === 0 ? (
            <p className={styles.dashWidgetEmpty}>No announcements yet.</p>
          ) : (
            <div className={styles.dashMiniAnnList}>
              {latestAnnouncements.map((post) => (
                <div key={post.id} className={styles.dashMiniAnn}>
                  <div className={styles.dashMiniAnnTitle}>{post.title}</div>
                  <div className={styles.dashMiniAnnDate}>
                    <Calendar size={10} />
                    {formatTimestamp(post.created_at)}
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
      </div>
    </div>
  );
};

export default DashboardPage;
