/**
 * MyProfileRecords.jsx
 * "My Profile"'s record tabs for Councilor / Vice-Mayor / Liga / SK accounts
 * (Author_Approval_Workflow_v2.docx, Section 6). Backed by
 * GET /api/users/me/records, which finds the caller's council member through
 * the account link — not by name, which broke whenever either name was
 * edited — and returns complete lists rather than whatever page of records
 * the dashboard happened to have loaded.
 *   Needs My Approval   approvals waiting on this author, answered inline
 *   Authored            In Progress / Published / Rejected
 *   Co-Authored / Sponsored
 *   Rejected            with the Secretary's reason, to revise and resubmit
 */

import { useState } from "react";
import { ClipboardList, Eye, XCircle, CheckCircle2, UserCheck } from "lucide-react";
import { statusLabel } from "./legislativeStatus";
import { STAGE_LABELS, decideAuthorApproval, decisionSuccess } from "./authorWorkflow";
import ConfirmModal from "./ConfirmModal";
import BusySpinner from "./BusySpinner";

const TYPE_LABEL = { ordinance: "Ordinance", resolution: "Resolution" };
const ROUTE = { ordinance: "ordinances", resolution: "resolutions" };
const IN_PROGRESS = ["pending", "needs_revision", "accepted", "first_reading", "second_reading", "third_reading", "ready_to_publish", "approved"];

const groupLabel = {
  fontSize: 12,
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  margin: "14px 0 8px",
};
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "";

function RecordRow({ item, styles, onPreview }) {
  return (
    <div className={styles.officialRecordItem}>
      <div className={styles.officialRecordIcon}>
        <ClipboardList size={16} strokeWidth={1.5} />
      </div>
      <div className={styles.officialRecordBody}>
        <div className={styles.officialRecordTitle}>{item.title}</div>
        <div className={styles.officialRecordMeta}>
          {TYPE_LABEL[item.entity_type]}
          {item.number ? ` · ${item.number}` : ""}
          {" · "}
          {statusLabel(item.status)}
          {item.term_period ? ` · ${item.term_period} term` : ""}
          {" · "}
          {fmtDate(item.approved_on || item.uploaded_at)}
        </div>
      </div>
      {item.filepath && (
        <button onClick={() => onPreview(item)} className={styles.officialViewLink} title="View">
          <Eye size={14} />
        </button>
      )}
    </div>
  );
}

function RejectedRow({ item, styles }) {
  return (
    <div className={styles.officialRecordItem}>
      <div className={`${styles.officialRecordIcon} ${styles.officialRecordIconRejected}`}>
        <XCircle size={16} strokeWidth={1.5} />
      </div>
      <div className={styles.officialRecordBody}>
        <div className={styles.officialRecordTitle}>{item.title}</div>
        <div className={styles.officialRecordMeta}>Rejected {fmtDate(item.reviewed_at || item.uploaded_at)}</div>
        {item.rejection_reason && (
          <div className={styles.officialRecordMeta} style={{ fontStyle: "italic", marginTop: 2 }}>
            Reason: "{item.rejection_reason}"
          </div>
        )}
      </div>
      <span className={styles.officialTypeTag}>{TYPE_LABEL[item.entity_type]}</span>
    </div>
  );
}

// One approval request, answered right here — the author doesn't need access
// to the Secretary's review queues to approve their own record.
function ApprovalRow({ item, record, styles, onPreview, onDone }) {
  const [comment, setComment] = useState("");
  // 'approved' | 'declined' while that request is in flight, else null.
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const decide = async (decision) => {
    setBusy(decision);
    setError("");
    const result = await decideAuthorApproval(ROUTE[item.entity_type], item.entity_id, decision, comment.trim());
    setBusy(null);
    if (result.ok) onDone(decisionSuccess(decision, item.stage, item.title));
    else setError(result.error);
  };

  return (
    <div className={styles.officialRecordItem} style={{ flexWrap: "wrap", alignItems: "flex-start" }}>
      <div className={styles.officialRecordIcon}>
        <UserCheck size={16} strokeWidth={1.5} />
      </div>
      <div className={styles.officialRecordBody} style={{ minWidth: 200 }}>
        <div className={styles.officialRecordTitle}>{item.title || `${TYPE_LABEL[item.entity_type]} #${item.entity_id}`}</div>
        <div className={styles.officialRecordMeta}>
          {TYPE_LABEL[item.entity_type]} · {STAGE_LABELS[item.stage]} · requested {fmtDate(item.requested_at)}
        </div>
        <textarea
          placeholder="Comment (optional)"
          disabled={!!busy}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            marginTop: 8,
            border: "1px solid #cbd5e0",
            borderRadius: 8,
            padding: "6px 8px",
            fontFamily: "inherit",
            fontSize: 13,
            minHeight: 44,
            resize: "vertical",
          }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
          <button
            disabled={!!busy}
            onClick={() => decide("declined")}
            style={{ border: "none", borderRadius: 999, padding: "6px 12px", background: "#fed7d7", color: "#c53030", fontWeight: 600, cursor: busy ? "wait" : "pointer", opacity: busy && busy !== "declined" ? 0.5 : 1, display: "inline-flex", gap: 5, alignItems: "center" }}
          >
            {busy === "declined" ? <><BusySpinner /> Declining…</> : <><XCircle size={13} /> Decline</>}
          </button>
          <button
            disabled={!!busy}
            onClick={() => decide("approved")}
            style={{ border: "none", borderRadius: 999, padding: "6px 12px", background: "#2f855a", color: "#fff", fontWeight: 600, cursor: busy ? "wait" : "pointer", opacity: busy && busy !== "approved" ? 0.5 : 1, display: "inline-flex", gap: 5, alignItems: "center" }}
          >
            {busy === "approved" ? <><BusySpinner /> Approving…</> : <><CheckCircle2 size={13} /> Approve</>}
          </button>
        </div>
        {busy && (
          <div style={{ color: "#4a5568", fontSize: 12, marginTop: 6 }}>
            Saving your decision and notifying the Secretary…
          </div>
        )}
        {error && <div style={{ color: "#c53030", fontSize: 12, fontWeight: 600, marginTop: 6 }}>{error}</div>}
      </div>
      {record?.filepath && (
        <button onClick={() => onPreview(record)} className={styles.officialViewLink} title="View document">
          <Eye size={14} />
        </button>
      )}
    </div>
  );
}

// The Needs My Approval list. Owns the success modal (not each row): once a
// request is answered its row drops out of the list on the next refresh, and
// that must not take the modal with it. The list refreshes when it's closed.
function ApprovalList({ data, styles, onPreview, onChanged }) {
  const [done, setDone] = useState(null); // { title, message }
  const closeDone = () => {
    setDone(null);
    onChanged?.();
  };
  const byKey = new Map(data.authored.map((r) => [`${r.entity_type}:${r.id}`, r]));
  return (
    <>
      {data.awaiting_my_approval.length === 0 ? (
        <p className={styles.officialEmptyState}>Nothing is waiting for your approval.</p>
      ) : (
        data.awaiting_my_approval.map((a) => (
          <ApprovalRow
            key={a.id}
            item={a}
            record={byKey.get(`${a.entity_type}:${a.entity_id}`)}
            styles={styles}
            onPreview={onPreview}
            onDone={setDone}
          />
        ))
      )}
      {done && (
        <ConfirmModal
          type="success"
          title={done.title}
          message={done.message}
          confirmLabel="OK"
          cancelLabel={false}
          onConfirm={closeDone}
          onCancel={closeDone}
        />
      )}
    </>
  );
}

// Explains an empty profile instead of showing one: accounts for an SB seat
// that auto-linking couldn't place yet.
export function NotLinkedNotice({ data }) {
  if (!data || data.member || !data.linkable) return null;
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 8,
        background: "#fffaf0",
        border: "1px solid #fbd38d",
        color: "#7b341e",
        fontSize: 13,
        marginBottom: 14,
      }}
    >
      Your account isn't linked to a council member record yet, so your authored records and approval requests can't
      be shown. Please contact the Secretary.
    </div>
  );
}

export default function MyProfileRecords({ tab, data, loading, styles, onPreview, onChanged }) {
  if (loading && !data) return <p className={styles.officialEmptyState}>Loading your records…</p>;
  if (!data?.member) return null;
  const empty = (text) => <p className={styles.officialEmptyState}>{text}</p>;
  const row = (item) => (
    <RecordRow key={`${item.entity_type}-${item.id}`} item={item} styles={styles} onPreview={onPreview} />
  );

  if (tab === "approvals") {
    return <ApprovalList data={data} styles={styles} onPreview={onPreview} onChanged={onChanged} />;
  }

  if (tab === "authored") {
    const inProgress = data.authored.filter((r) => IN_PROGRESS.includes(r.status));
    const published = data.authored.filter((r) => r.status === "published");
    const rejected = data.authored.filter((r) => r.status === "rejected");
    return (
      <>
        <div style={groupLabel}>In Progress</div>
        {inProgress.length === 0 ? empty("Nothing in progress.") : inProgress.map(row)}
        <div style={groupLabel}>Published</div>
        {published.length === 0 ? empty("No published records yet.") : published.map(row)}
        <div style={groupLabel}>Rejected</div>
        {rejected.length === 0 ? empty("No rejected records.") : rejected.map(row)}
      </>
    );
  }

  if (tab === "involved") {
    return (
      <>
        <div style={groupLabel}>Co-Authored</div>
        {data.co_authored.length === 0 ? empty("No co-authored records yet.") : data.co_authored.map(row)}
        <div style={groupLabel}>Sponsored</div>
        {data.sponsored.length === 0 ? empty("No sponsored records yet.") : data.sponsored.map(row)}
      </>
    );
  }

  if (tab === "rejected") {
    const rejected = data.authored.filter((r) => r.status === "rejected");
    if (rejected.length === 0) return empty("No rejected records.");
    return rejected.map((r) => <RejectedRow key={`${r.entity_type}-${r.id}`} item={r} styles={styles} />);
  }

  return null;
}
