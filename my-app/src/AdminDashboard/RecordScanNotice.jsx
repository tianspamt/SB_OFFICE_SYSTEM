// RecordScanNotice.jsx
// Status line under the upload form's file picker for the "detect the date
// from the file" prefill (see detectRecordMeta in AdminDashboard.jsx and
// POST /api/{ordinances,resolutions}/extract-meta). It only ever *reports*
// what was suggested — the values themselves land in the ordinary form
// fields, where the user checks and edits them before uploading.
//
// scan: null
//     | { status: "reading" }
//     | { status: "error", message }
//     | { status: "done", data, applied: { date } }

import { Loader2, FileSearch, AlertTriangle, Info } from "lucide-react";

const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const BOX = {
  display: "flex",
  gap: 8,
  alignItems: "flex-start",
  fontSize: 12.5,
  lineHeight: 1.5,
  borderRadius: 10,
  padding: "10px 12px",
  margin: "10px 0 14px",
};
const TONES = {
  info: { background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e3a8a" },
  ok: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#14532d" },
  warn: { background: "#fffbeb", border: "1px solid #fde68a", color: "#78350f" },
  muted: { background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569" },
};

function Row({ label, value, applied, confidence }) {
  return (
    <div>
      <strong>{label}:</strong> {value}
      <span style={{ opacity: 0.75 }}>
        {" "}
        — {applied ? "filled in below" : "kept what you entered"}
        {confidence === "low" ? " · low confidence, double-check" : ""}
      </span>
    </div>
  );
}

// variant "session" (session minutes / order of business): reports the
// session's title, date and type instead of just a date (the venue is always
// the session hall, so it isn't read from the file).
export default function RecordScanNotice({ scan, variant = "record" }) {
  if (!scan) return null;
  const isSession = variant === "session";
  const wording = isSession ? "its title, date and type" : "its date";

  if (scan.status === "reading") {
    return (
      <div style={{ ...BOX, ...TONES.info }}>
        <style>{`@keyframes rsnSpin { to { transform: rotate(360deg) } }`}</style>
        <Loader2 size={15} style={{ flexShrink: 0, marginTop: 2, animation: "rsnSpin 0.8s linear infinite" }} />
        <span>
          Reading the file to detect {wording}… scanned documents can
          take up to a minute. You can keep filling in the form meanwhile.
        </span>
      </div>
    );
  }

  if (scan.status === "error") {
    return (
      <div style={{ ...BOX, ...TONES.muted }}>
        <Info size={15} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>{scan.message || "Couldn't read this file automatically."} Enter the details manually.</span>
      </div>
    );
  }

  const { data, applied } = scan;

  if (isSession) {
    const typeLabel = data.sessionType === "special" ? "Special Session" : "Regular Session";
    if (!data.number && !data.date && !data.sessionType) {
      return (
        <div style={{ ...BOX, ...TONES.muted }}>
          <FileSearch size={15} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>Couldn't find a session title or date in this file. Enter them manually.</span>
        </div>
      );
    }
    const care = data.numberConfidence === "low" || data.dateConfidence === "low";
    return (
      <div style={{ ...BOX, ...(care ? TONES.warn : TONES.ok), flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}>
          {care ? <AlertTriangle size={15} /> : <FileSearch size={15} />}
          Detected from the file — please check before saving
        </div>
        {data.number && (
          <Row label="Title" value={data.number} applied={applied.number} confidence={data.numberConfidence} />
        )}
        {data.date && (
          <Row label="Date" value={formatDate(data.date)} applied={applied.date} confidence={data.dateConfidence} />
        )}
        {data.sessionType && <Row label="Type" value={typeLabel} applied={applied.type} />}
      </div>
    );
  }

  if (!data.date) {
    return (
      <div style={{ ...BOX, ...TONES.muted }}>
        <FileSearch size={15} style={{ flexShrink: 0, marginTop: 2 }} />
        <span>
          Couldn't find a date in this file. Enter it manually.
        </span>
      </div>
    );
  }

  const needsCare = data.yearMismatch || data.dateConfidence === "low";
  return (
    <div style={{ ...BOX, ...(needsCare ? TONES.warn : TONES.ok), flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}>
        {needsCare ? <AlertTriangle size={15} /> : <FileSearch size={15} />}
        Detected from the file — please check before saving
      </div>
      <Row label="Date" value={formatDate(data.date)} applied={applied.date} confidence={data.dateConfidence} />
      {data.yearMismatch && (
        <div>
          The date's year doesn't match the year printed in the document's
          number — one of them may have been misread from the scan.
        </div>
      )}
    </div>
  );
}
