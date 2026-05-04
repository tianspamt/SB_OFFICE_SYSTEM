import React, { useState } from "react";
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

// ─── Announcement Card ────────────────────────────────────────────────────────
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

// ─── Main Component ───────────────────────────────────────────────────────────
const DashboardPage = ({
  ordinances = [],
  resolutions = [],
  sessionMinutes = [],
  announcements = [],
  onNavigate,
}) => {
  const latestOrdinances = ordinances.slice(0, 3);
  const latestResolutions = resolutions.slice(0, 3);
  const latestSessions = sessionMinutes.slice(0, 3);
  const latestAnnouncements = announcements.slice(0, 3);

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

      {/* ── Main Feed ── */}
      <div className={styles.dashMainFeed}>
        {/* Ordinances */}
        <section className={styles.dashFeedSection}>
          <SectionHeader
            icon={ScrollText}
            title="Latest Approved Ordinances"
            color="#1976d2"
            count={ordinances.length}
            onViewAll={onNavigate ? () => onNavigate("ordinances") : null}
          />
          {latestOrdinances.length === 0 ? (
            <EmptyState icon={ScrollText} label="ordinances" />
          ) : (
            <div className={styles.dashCardGrid}>
              {latestOrdinances.map((item) => (
                <OrdinanceCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        {/* Resolutions */}
        <section className={styles.dashFeedSection}>
          <SectionHeader
            icon={FileText}
            title="Latest Approved Resolutions"
            color="#388e3c"
            count={resolutions.length}
            onViewAll={onNavigate ? () => onNavigate("resolutions") : null}
          />
          {latestResolutions.length === 0 ? (
            <EmptyState icon={FileText} label="resolutions" />
          ) : (
            <div className={styles.dashCardGrid}>
              {latestResolutions.map((item) => (
                <ResolutionCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        {/* Session Minutes */}
        <section className={styles.dashFeedSection}>
          <SectionHeader
            icon={BookOpen}
            title="Recent Session Minutes"
            color="#f57c00"
            count={sessionMinutes.length}
            onViewAll={onNavigate ? () => onNavigate("sessions") : null}
          />
          {latestSessions.length === 0 ? (
            <EmptyState icon={ClipboardList} label="session minutes" />
          ) : (
            <div className={styles.dashCardGrid}>
              {latestSessions.map((item) => (
                <SessionCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        {/* Announcements */}
        <section className={styles.dashFeedSection}>
          <SectionHeader
            icon={Megaphone}
            title="Recent Announcements"
            color="#c2185b"
            count={announcements.length}
            onViewAll={onNavigate ? () => onNavigate("announcements") : null}
          />
          {latestAnnouncements.length === 0 ? (
            <EmptyState icon={Megaphone} label="announcements" />
          ) : (
            <div className={styles.dashPostFeed}>
              {latestAnnouncements.map((post) => (
                <AnnouncementCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
