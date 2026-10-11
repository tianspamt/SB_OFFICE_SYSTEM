/**
 * RecordHistory.jsx
 * The full trail of an ordinance/resolution — upload to publish (or reject) —
 * shown in its details: every step, who did it and when, and every time the
 * author declined (with their comment) until they approved. Backed by
 * GET /api/{route}/:id/history (my-backend/helpers/recordHistory.js), which
 * only answers for staff positions (Secretary, Clerk, Vice-Mayor, Councilor,
 * SK Federated, Liga ng mga Barangay); anyone else gets a 403 and this
 * renders nothing.
 */

import { useEffect, useState } from "react";
import {
  History,
  Upload,
  CheckCircle2,
  XCircle,
  Send,
  UserCheck,
  BookOpen,
  FileEdit,
  Globe,
  MessageSquareWarning,
} from "lucide-react";
import { API, authFetch } from "./AdminContext";
import { STAGE_LABELS } from "./authorWorkflow";

const POSITION_LABELS = {
  secretary: "Secretary",
  clerk: "Clerk",
  vice_mayor: "Vice-Mayor",
  councilor: "Councilor",
  sk_federated: "SK Federated",
  liga_ng_mga_barangay: "Liga ng mga Barangay",
};

const READING_LABELS = {
  first_reading: "Proceeded to First Reading",
  second_reading: "First Reading done — proceeded to Second Reading",
  third_reading: "Second Reading done — proceeded to Third Reading",
  ready_to_publish: "Third Reading completed — sent for Vice-Mayor approval",
};

const GREEN = "#2c7a7b";
const RED = "#c53030";
const BLUE = "#1a365d";
const ORANGE = "#c05621";

// action → { icon, color, text(entry) }
const ACTIONS = {
  uploaded: { icon: Upload, color: BLUE, text: () => "Draft uploaded" },
  updated: { icon: FileEdit, color: BLUE, text: () => "Details edited" },
  file_replaced: { icon: FileEdit, color: BLUE, text: () => "File replaced" },
  resubmitted: { icon: FileEdit, color: BLUE, text: () => "Revised and resubmitted" },
  changes_requested: { icon: MessageSquareWarning, color: ORANGE, text: () => "Changes requested" },
  accepted: { icon: CheckCircle2, color: GREEN, text: () => "Draft accepted" },
  advanced: { icon: BookOpen, color: BLUE, text: (e) => READING_LABELS[e.stage] || "Moved to the next stage" },
  author_approval_requested: {
    icon: Send,
    color: ORANGE,
    text: (e) => `Author's approval requested — ${STAGE_LABELS[e.stage] || e.stage}`,
  },
  author_approved: {
    icon: CheckCircle2,
    color: GREEN,
    text: (e) => `Author approved — ${STAGE_LABELS[e.stage] || e.stage}`,
  },
  author_declined: {
    icon: XCircle,
    color: RED,
    text: (e) => `Declined by the author — ${STAGE_LABELS[e.stage] || e.stage}`,
  },
  author_approved_on_behalf: {
    icon: UserCheck,
    color: GREEN,
    text: (e) => `Author's approval recorded on their behalf — ${STAGE_LABELS[e.stage] || e.stage}`,
  },
  vm_approved: { icon: CheckCircle2, color: GREEN, text: () => "Approved by the Vice-Mayor" },
  published: { icon: Globe, color: GREEN, text: (e) => (e.comment ? `Published as ${e.comment}` : "Published") },
  rejected: { icon: XCircle, color: RED, text: () => "Rejected" },
};

// Published's comment is the number, already shown in its text.
const showsComment = (e) => e.comment && e.action !== "published";

const fmt = (d) =>
  new Date(d).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default function RecordHistory({ route, recordId, status }) {
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState("");
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authFetch(`${API}/api/${route}/${recordId}/history`);
        if (cancelled) return;
        if (res.status === 403) return setHidden(true);
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.success) setEntries(data.data || []);
        else setError(data.error || "Couldn't load the record history.");
      } catch {
        if (!cancelled) setError("Couldn't load the record history.");
      }
    })();
    return () => {
      cancelled = true;
    };
    // status: reload when the record moves on while the details are open.
  }, [route, recordId, status]);

  if (hidden) return null;

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
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <History size={15} color={BLUE} />
        <strong style={{ fontSize: 13, color: BLUE }}>Record History</strong>
      </div>

      {error ? (
        <p style={{ fontSize: 12, color: RED, margin: 0 }}>{error}</p>
      ) : entries === null ? (
        <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Loading history…</p>
      ) : entries.length === 0 ? (
        <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>No history recorded for this record.</p>
      ) : (
        <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {entries.map((e, i) => {
            const meta = ACTIONS[e.action] || { icon: History, color: BLUE, text: () => e.action };
            const Icon = meta.icon;
            const last = i === entries.length - 1;
            return (
              <li key={e.id} style={{ display: "flex", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Icon size={16} color={meta.color} style={{ flexShrink: 0, marginTop: 1 }} />
                  {!last && <div style={{ flex: 1, width: 2, background: "#e2e8f0", margin: "3px 0" }} />}
                </div>
                <div style={{ paddingBottom: last ? 0 : 12, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: meta.color }}>{meta.text(e)}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {fmt(e.created_at)}
                    {e.actor_name && ` · ${e.actor_name}`}
                    {e.actor_position && POSITION_LABELS[e.actor_position] && ` (${POSITION_LABELS[e.actor_position]})`}
                  </div>
                  {e.action === "author_declined" && !e.comment && e.backfilled && (
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>
                      No comment saved (declined before record history was tracked).
                    </div>
                  )}
                  {showsComment(e) && (
                    <div
                      style={{
                        fontSize: 13,
                        fontStyle: "italic",
                        color: "#2d3748",
                        marginTop: 3,
                        overflowWrap: "anywhere",
                      }}
                    >
                      "{e.comment}"
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
