// ─── API Base URL ──────────────────────────────────────────────────────────────
export const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─── Auth helper ───────────────────────────────────────────────────────────────
export const authFetch = (url, options = {}) => {
  const token = localStorage.getItem("token");
  const isFormData = options.body instanceof FormData;
  return fetch(url, {
    ...options,
    headers: {
      ...(!isFormData && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
export const toIsoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

export const toLocalIso = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return toIsoDate(d);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// ─── Static Local/Provincial Holidays ────────────────────────────────────────
export const getLocalHolidays = (year) => [
  { date: `${year}-03-16`, name: "Blood Compact Day", type: "special-working" },
  {
    date: `${year}-07-04`,
    name: "Francisco Dagohoy Day",
    type: "special-working",
  },
  {
    date: `${year}-07-15`,
    name: "Town Fiesta – Our Lady of Mount Carmel",
    type: "local-fiesta",
  },
  {
    date: `${year}-07-16`,
    name: "Town Fiesta – Our Lady of Mount Carmel",
    type: "local-fiesta",
  },
  { date: `${year}-07-22`, name: "Bohol Day", type: "special" },
  {
    date: `${year}-09-29`,
    name: "Sumad Day (Founding Anniversary)",
    type: "special",
  },
  { date: `${year}-11-04`, name: "Carlos P. Garcia Day", type: "special" },
];

export const COLOR_SWATCHES = [
  "#009439",
  "#3b82f6",
  "#eab308",
  "#ec4899",
  "#8b5cf6",
  "#f97316",
  "#14b8a6",
  "#ef4444",
];

export const ACTION_COLORS = {
  LOGIN: { bg: "#d1fae5", color: "#065f46" },
  LOGOUT: { bg: "#f3f4f6", color: "#374151" },
  REGISTER: { bg: "#dbeafe", color: "#1e40af" },
  UPLOAD: { bg: "#ede9fe", color: "#5b21b6" },
  CREATE: { bg: "#fef9c3", color: "#854d0e" },
  UPDATE: { bg: "#ffedd5", color: "#9a3412" },
  DELETE: { bg: "#fee2e2", color: "#991b1b" },
  ARCHIVE: { bg: "#fef3c7", color: "#92400e" },
  RESTORE: { bg: "#e0f2fe", color: "#075985" },
  ACCEPT: { bg: "#d1fae5", color: "#065f46" },
  REQUEST_CHANGES: { bg: "#fee2e2", color: "#991b1b" },
  VM_APPROVE: { bg: "#dbeafe", color: "#1e40af" },
  PUBLISH: { bg: "#ede9fe", color: "#5b21b6" },
  RESUBMIT: { bg: "#fef9c3", color: "#854d0e" },
  REPLACE_FILE: { bg: "#ffedd5", color: "#9a3412" },
  COMMENT: { bg: "#f3f4f6", color: "#374151" },
};

export const priorityConfig = {
  urgent: {
    label: "Urgent",
    color: "#c53030",
    bg: "#fff5f5",
    border: "#feb2b2",
  },
  high: { label: "High", color: "#975a16", bg: "#fffbeb", border: "#f6e05e" },
  normal: {
    label: "Normal",
    color: "#276749",
    bg: "#f0fff4",
    border: "#9ae6b4",
  },
  low: { label: "Low", color: "#4a5568", bg: "#f7fafc", border: "#cbd5e0" },
};

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

// ─── Legislative Record Numbering ──────────────────────────────────────────
// Implements the "Legislative Record Numbering" functional requirement:
//  - suggest the next sequential number for a record type + year
//  - allow the suggestion to be edited by the user (plain string state, so
//    this is already possible wherever these helpers are used)
//  - detect duplicate numbers before a record is saved
//  - (retention of the assigned number through the document lifecycle is
//    handled by simply not re-suggesting a number once a record exists —
//    edit forms should always prefill from the saved record, never from
//    these suggestion helpers)

export const getCurrentYear = () => new Date().getFullYear();

const ordinalSuffix = (n) => {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
};

// Pulls the trailing numeric sequence out of a record number string, e.g.
// "Ordinance No. 2026-007" -> 7
const extractSequence = (numberStr) => {
  if (!numberStr) return 0;
  const match = String(numberStr).match(/(\d+)\s*$/);
  return match ? parseInt(match[1], 10) : 0;
};

const nextSequenceForYear = (records, numberField, yearField, year) => {
  const y = String(year || getCurrentYear());
  const seqs = records
    .filter((r) => String(r[yearField] ?? "") === y)
    .map((r) => extractSequence(r[numberField]));
  const max = seqs.length ? Math.max(...seqs) : 0;
  return max + 1;
};

// Suggests the next ordinance number for the given year, following the
// office's "Ordinance No. {year}-{sequence}" convention.
export const suggestOrdinanceNumber = (ordinances = [], year) => {
  const y = String(year || getCurrentYear());
  const next = nextSequenceForYear(ordinances, "ordinance_number", "year", y);
  return `Ordinance No. ${y}-${String(next).padStart(3, "0")}`;
};

// Suggests the next resolution number for the given year, following the
// office's "Resolution No. {year}-{sequence}" convention.
export const suggestResolutionNumber = (resolutions = [], year) => {
  const y = String(year || getCurrentYear());
  const next = nextSequenceForYear(resolutions, "resolution_number", "year", y);
  return `Resolution No. ${y}-${String(next).padStart(3, "0")}`;
};

// Suggests the next session number for the given year + session type,
// following the office's "{ordinal} Regular/Special Session, {year}"
// convention. Sequence resets every year, per session type.
export const suggestSessionNumber = (
  sessionMinutes = [],
  year,
  sessionType = "regular"
) => {
  const y = String(year || getCurrentYear());
  const label =
    sessionType === "special" ? "Special Session" : "Regular Session";
  const count = sessionMinutes.filter((s) => {
    const sy = s.session_date
      ? new Date(s.session_date).getFullYear().toString()
      : "";
    return sy === y && (s.session_type || "regular") === sessionType;
  }).length;
  return `${ordinalSuffix(count + 1)} ${label}, ${y}`;
};

// Case-insensitive, whitespace-trimmed duplicate check across a list of
// records for a given field (e.g. "ordinance_number"). Pass excludeId when
// validating an edit so a record isn't flagged as a duplicate of itself.
export const isDuplicateRecordNumber = (
  records = [],
  field,
  value,
  excludeId = null
) => {
  const v = (value || "").trim().toLowerCase();
  if (!v) return false;
  return records.some(
    (r) => r.id !== excludeId && (r[field] || "").trim().toLowerCase() === v
  );
};

export const tabTitles = {
  users: "Manage Users",
  admins: "Manage Admins",
  calendar: "Calendar & Schedule",
  announcements: "Announcements",
  sessions: "Session Minutes & Agenda",
  ordinances: "Ordinances",
  resolutions: "Resolutions",
  officials: "Sangguniang Bayan Council Members",
  logs: "Activity Logs",
  content: "Content Management",
  archives: "Archives",
};
