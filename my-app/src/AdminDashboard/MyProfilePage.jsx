/**
 * MyProfilePage.jsx
 * "My Profile" as a full page inside the dashboard (?tab=profile), opened by
 * clicking your own avatar in the sidebar — replaces the old pop-up modal.
 * Banner with photo, name, position and record stats; then the Account tab
 * (MyAccountTab.jsx) and, for accounts linked to a council member, the record
 * tabs (MyProfileRecords.jsx). Data and handlers stay in AdminDashboard.jsx.
 */

import { AtSign, Mail } from "lucide-react";
import s from "./MyProfilePage.module.css";
import { TabNavigation } from "./LegislativeComponents";
import MyAccountTab from "./MyAccountTab";
import MyProfileRecords, { NotLinkedNotice } from "./MyProfileRecords";
import { myRecordTabs, myRecordStats } from "./authorWorkflow";

export default function MyProfilePage({
  admin,
  positionLabel,
  tab,
  onTabChange,
  // Account tab
  name,
  onNameChange,
  onSaveName,
  onSendResetLink,
  submitting,
  resetSentTo,
  // Record tabs
  records,
  recordsLoading,
  dashStyles,
  onPreview,
  onRecordsChanged,
}) {
  const stats = myRecordStats(records);

  return (
    <div className={s.page}>
      {/* ── Banner ── */}
      <section className={s.hero}>
        <div className={s.heroRow}>
          <div className={s.avatar}>
            {admin.photo ? <img src={admin.photo} alt={admin.name} /> : (admin.name || "?").charAt(0)}
          </div>
          <div className={s.identity}>
            <h1 className={s.name}>{admin.name}</h1>
            <div className={s.metaRow}>
              <span className={s.badge}>{positionLabel}</span>
              {admin.username && (
                <span className={s.metaItem}>
                  <AtSign size={14} /> {admin.username}
                </span>
              )}
              {admin.email && (
                <span className={s.metaItem}>
                  <Mail size={14} /> {admin.email}
                </span>
              )}
            </div>
          </div>
          {stats.length > 0 && (
            <div className={s.stats}>
              {stats.map((stat) => (
                <div key={stat.label} className={s.stat}>
                  <div className={s.statValue}>{stat.value}</div>
                  <div className={s.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Tabs ── */}
      <div className={s.tabsCard}>
        <TabNavigation
          tabs={[{ id: "account", label: "Account" }, ...myRecordTabs(records)]}
          activeTab={tab}
          onTabChange={onTabChange}
        />
      </div>

      {/* ── Content ── */}
      {tab === "account" ? (
        <div className={s.contentPlain}>
          <MyAccountTab
            admin={admin}
            name={name}
            onNameChange={onNameChange}
            onSaveName={onSaveName}
            onSendResetLink={onSendResetLink}
            submitting={submitting}
            resetSentTo={resetSentTo}
            notice={<NotLinkedNotice data={records} />}
          />
        </div>
      ) : (
        <div className={s.content}>
          <MyProfileRecords
            tab={tab}
            data={records}
            loading={recordsLoading}
            styles={dashStyles}
            onPreview={onPreview}
            onChanged={onRecordsChanged}
          />
        </div>
      )}
    </div>
  );
}
