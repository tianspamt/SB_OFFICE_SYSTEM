/**
 * AuthorApprovalPanel.jsx
 * The author-approval step inside the Ordinance/Resolution View modal
 * (panel recommendation — see Author_Approval_Workflow_v2.docx, Section 4 and
 * my-backend/helpers/legislativeReviewRoutes.js). After each reading, and
 * again after the Vice-Mayor approves, the record's Author must approve
 * before the Secretary can advance / publish it.
 *   Secretary: Request Author Approval, or Record on Behalf (author has no
 *              linked account).
 *   Author:    Approve / Decline, with an optional comment.
 * Polls every 20s while open, so the Secretary's Advance button unlocks soon
 * after the author approves without a manual refresh.
 */

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock, XCircle, Send, UserCheck } from "lucide-react";
import { API, authFetch, extractErrorMsg } from "./AdminContext";
import { STAGE_LABELS, decideAuthorApproval } from "./authorWorkflow";

const POLL_MS = 20000;

const fmt = (d) =>
  d ? new Date(d).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "";

const pill = (bg, color) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  fontSize: 12,
  fontWeight: 700,
  padding: "3px 10px",
  borderRadius: 999,
  background: bg,
  color,
});
const btn = (bg, color = "#fff") => ({
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: "none",
  borderRadius: 999,
  padding: "7px 14px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  background: bg,
  color,
});
const textarea = {
  width: "100%",
  boxSizing: "border-box",
  border: "1px solid #cbd5e0",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 13,
  fontFamily: "inherit",
  resize: "vertical",
  minHeight: 56,
  marginTop: 8,
};

function DecisionPill({ approval }) {
  if (!approval) return <span style={pill("#f1f5f9", "#64748b")}>Not requested yet</span>;
  if (approval.decision === "approved")
    return (
      <span style={pill("#e6fffa", "#2c7a7b")}>
        <CheckCircle2 size={13} /> {approval.on_behalf ? "Approved (recorded on behalf)" : "Approved by author"}
      </span>
    );
  if (approval.decision === "declined")
    return (
      <span style={pill("#fff5f5", "#c53030")}>
        <XCircle size={13} /> Declined by author
      </span>
    );
  return (
    <span style={pill("#fffaf0", "#c05621")}>
      <Clock size={13} /> Waiting for author
    </span>
  );
}

export default function AuthorApprovalPanel({ route, record, isSecretary, onGateChange, onDecided }) {
  const [info, setInfo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await authFetch(`${API}/api/${route}/${record.id}/author-approval`);
      if (!res.ok) return;
      setInfo(await res.json());
    } catch {
      /* keep the last known state; the next poll retries */
    }
  }, [route, record.id]);

  // Reload whenever the record moves to another stage, and poll meanwhile.
  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load, record.status]);

  const stage = info?.current_stage || null;
  const current = stage ? (info?.approvals || []).find((a) => a.stage === stage) : null;
  const gateOpen = !info || !info.required || !stage || current?.decision === "approved";

  useEffect(() => {
    onGateChange?.(gateOpen);
  }, [gateOpen, onGateChange]);

  if (!info || !stage) return null;

  const run = async (url, body, after) => {
    setBusy(true);
    setError("");
    try {
      const res = await authFetch(`${API}/api/${route}/${record.id}/author-approval/${url}`, {
        method: url === "request" ? "POST" : "PUT",
        body: JSON.stringify(body || {}),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        after?.();
        await load();
      } else setError(extractErrorMsg(data, "Action failed."));
    } catch {
      setError("Server error.");
    } finally {
      setBusy(false);
    }
  };

  const decide = async (decision) => {
    setBusy(true);
    setError("");
    const result = await decideAuthorApproval(route, record.id, decision, comment.trim());
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setComment("");
    await load();
    onDecided?.();
  };

  const authorName = info.author?.full_name || "the author";
  const history = (info.approvals || []).filter((a) => a.stage !== stage && a.decision !== "pending");

  return (
    <div
      style={{
        marginTop: 16,
        padding: "12px 14px",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        background: "#f8fafc",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <UserCheck size={15} color="#1a365d" />
        <strong style={{ fontSize: 13, color: "#1a365d" }}>Author Approval — {STAGE_LABELS[stage]}</strong>
        {info.required && <DecisionPill approval={current} />}
      </div>

      {!info.required ? (
        <p style={{ fontSize: 12, color: "#64748b", margin: "6px 0 0" }}>
          This record was accepted before author approval was introduced, so it finishes under the previous rules.
        </p>
      ) : (
        <>
          <p style={{ fontSize: 12, color: "#64748b", margin: "6px 0 0" }}>
            Author: <strong>{authorName}</strong>
            {!info.author_has_account && info.author && " (no linked login account)"}
            {current?.decision === "pending" && ` · requested ${fmt(current.requested_at)}`}
            {current?.decided_at && current.decision !== "pending" && ` · ${fmt(current.decided_at)}`}
          </p>
          {current?.comment && current.decision !== "pending" && (
            <p style={{ fontSize: 13, margin: "6px 0 0", fontStyle: "italic", color: "#2d3748" }}>"{current.comment}"</p>
          )}

          {/* Author's own decision */}
          {info.is_author && current?.decision === "pending" && (
            <div style={{ marginTop: 8 }}>
              <textarea
                style={textarea}
                placeholder="Comment (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                <button style={btn("#fed7d7", "#c53030")} disabled={busy} onClick={() => decide("declined")}>
                  <XCircle size={14} /> Decline
                </button>
                <button style={btn("#2f855a")} disabled={busy} onClick={() => decide("approved")}>
                  <CheckCircle2 size={14} /> Approve
                </button>
              </div>
            </div>
          )}

          {/* Secretary's side */}
          {isSecretary && current?.decision !== "approved" && current?.decision !== "pending" && (
            <div style={{ marginTop: 8 }}>
              {info.author_has_account ? (
                <button style={btn("#090446")} disabled={busy} onClick={() => run("request")}>
                  <Send size={14} /> {current?.decision === "declined" ? "Request Approval Again" : "Request Author Approval"}
                </button>
              ) : (
                <>
                  <textarea
                    style={textarea}
                    placeholder='How did the author approve? e.g. "Approved verbally during the 3rd reading, session of Sept 22"'
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <button
                    style={{ ...btn("#090446"), marginTop: 8 }}
                    disabled={busy || !note.trim()}
                    onClick={() => run("on-behalf", { note: note.trim() }, () => setNote(""))}
                  >
                    <UserCheck size={14} /> Record Approval on Behalf
                  </button>
                </>
              )}
            </div>
          )}
          {isSecretary && current?.decision === "pending" && (
            <p style={{ fontSize: 12, color: "#c05621", margin: "8px 0 0" }}>
              {authorName} was emailed. Reminders go out daily until they respond.
            </p>
          )}
        </>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: 10, borderTop: "1px dashed #e2e8f0", paddingTop: 8 }}>
          {history.map((a) => (
            <div key={a.id} style={{ fontSize: 12, color: "#4a5568", display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span>{STAGE_LABELS[a.stage]}:</span>
              <strong style={{ color: a.decision === "approved" ? "#2c7a7b" : "#c53030" }}>
                {a.decision === "approved" ? (a.on_behalf ? "approved (on behalf)" : "approved") : "declined"}
              </strong>
              <span>{fmt(a.decided_at)}</span>
            </div>
          ))}
        </div>
      )}

      {error && <p style={{ fontSize: 12, color: "#c53030", fontWeight: 600, margin: "8px 0 0" }}>{error}</p>}
    </div>
  );
}
