/**
 * MyAccountTab.jsx
 * My Profile → Account tab: account details at a glance, the display name
 * (the one account field a user edits themselves — PUT /api/users/:id/name),
 * and Password & Security, which emails a reset link to the account's own
 * address (POST /api/users/me/reset-password). The data and handlers stay in
 * AdminDashboard.jsx; this only lays them out.
 */

import { AtSign, Mail, ShieldCheck, UserRound, KeyRound, Send, CheckCircle2, IdCard } from "lucide-react";
import s from "./MyAccountTab.module.css";

const POSITION_LABELS = {
  secretary: "Secretary",
  clerk: "Clerk",
  vice_mayor: "Vice Mayor",
  councilor: "Councilor",
  liga_ng_mga_barangay: "Liga ng mga Barangay",
  sk_federated: "SK Federated",
};

function Detail({ icon: Icon, label, value }) {
  return (
    <div className={s.detail}>
      <Icon size={16} className={s.detailIcon} />
      <div style={{ minWidth: 0 }}>
        <div className={s.detailLabel}>{label}</div>
        <div className={s.detailValue} title={value}>
          {value || "—"}
        </div>
      </div>
    </div>
  );
}

export default function MyAccountTab({
  admin,
  name,
  onNameChange,
  onSaveName,
  onSendResetLink,
  submitting,
  resetSentTo,
  notice,
}) {
  const nameUnchanged = name.trim() === (admin.name || "").trim();

  return (
    <div className={s.wrap}>
      {notice}

      {/* ── Account details ── */}
      <section className={s.card}>
        <div className={s.cardHead}>
          <div className={s.cardIcon}>
            <IdCard size={18} />
          </div>
          <div>
            <h3 className={s.cardTitle}>Account details</h3>
            <p className={s.cardSub}>Only the Secretary can change your username, email, or position.</p>
          </div>
        </div>
        <div className={s.details}>
          <Detail icon={AtSign} label="Username" value={admin.username} />
          <Detail icon={Mail} label="Email" value={admin.email} />
          <Detail
            icon={ShieldCheck}
            label="Position"
            value={POSITION_LABELS[admin.position] || (admin.role === "admin" ? "Administrator" : "User")}
          />
          <Detail icon={UserRound} label="Account type" value={admin.role === "admin" ? "Staff (admin)" : "Official"} />
        </div>
      </section>

      {/* ── Display name ── */}
      <section className={s.card}>
        <div className={s.cardHead}>
          <div className={s.cardIcon}>
            <UserRound size={18} />
          </div>
          <div>
            <h3 className={s.cardTitle}>Display name</h3>
            <p className={s.cardSub}>How your name appears across the system.</p>
          </div>
        </div>
        <label className={s.fieldLabel} htmlFor="my-profile-name">
          Full name
        </label>
        <div className={s.inlineRow}>
          <input
            id="my-profile-name"
            className={s.input}
            value={name}
            onChange={(e) => onNameChange(e.target.value.replace(/[^A-Za-zÑñ.\s]/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !nameUnchanged && !submitting) onSaveName();
            }}
          />
          <button className={s.btn} onClick={onSaveName} disabled={submitting || nameUnchanged || !name.trim()}>
            Save
          </button>
        </div>
        <p className={s.hint}>Letters, spaces, periods, and ñ only.</p>
      </section>

      {/* ── Password & security ── */}
      <section className={s.card}>
        <div className={s.cardHead}>
          <div className={s.cardIcon}>
            <KeyRound size={18} />
          </div>
          <div>
            <h3 className={s.cardTitle}>Password &amp; security</h3>
            <p className={s.cardSub}>Change your password through a secure link sent to your email.</p>
          </div>
        </div>
        <div className={s.securityRow}>
          <div className={s.securityText}>
            We'll email a reset link to <strong>{admin.email || "your account's email"}</strong>. It works once and
            expires in 1 hour.
          </div>
          <button className={s.btnGhost} onClick={onSendResetLink} disabled={submitting}>
            <Send size={14} />
            {submitting ? "Sending…" : resetSentTo ? "Resend link" : "Send reset link"}
          </button>
        </div>
        {resetSentTo && (
          <div className={s.sent} role="status">
            <CheckCircle2 size={16} style={{ flex: "none", marginTop: 1 }} />
            <span>
              Reset link sent to <strong>{resetSentTo}</strong>. Check your inbox (and spam folder).
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
