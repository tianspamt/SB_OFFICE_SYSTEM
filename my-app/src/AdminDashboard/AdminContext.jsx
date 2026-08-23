// ─── API Base URL ──────────────────────────────────────────────────────────────
export const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─── Error helper ──────────────────────────────────────────────────────────────
// The backend responds with { error: "..." } for most failures, but
// express-validator's `validate` middleware (used by register, admin/add,
// and the users PUT routes) responds with { errors: [{ msg, ... }, ...] }
// instead. Without this, those validation messages never reach the UI.
export const extractErrorMsg = (data, fallback = "Something went wrong.") => {
  if (data?.error) return data.error;
  if (Array.isArray(data?.errors) && data.errors.length)
    return data.errors.map((e) => e.msg).join(" ");
  return fallback;
};

// ─── Auth helper ───────────────────────────────────────────────────────────────
// A 401 here always means the session itself is invalid — no token, or
// verifyToken rejected it (expired past its 8h lifetime, malformed, or the
// account was archived) — never a per-request permission problem, since
// every authFetch call site is already an authenticated endpoint. Only one
// call site (fetchUsers, in AdminDashboard.jsx) used to handle this; every
// other page just let the 401 fall through and silently rendered empty
// state, which is what showed up as "no data" with an "invalid token"
// message buried somewhere and no clear next step. Centralizing it here
// means an expired token now bounces every page straight back to a login
// screen that explains why, instead of a confusing half-blank dashboard.
let sessionExpiryHandled = false;
export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  const isFormData = options.body instanceof FormData;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(!isFormData && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
  // Several requests typically fire in parallel on mount — guard so a
  // flood of simultaneous 401s doesn't redirect more than once.
  if (res.status === 401 && !sessionExpiryHandled) {
    sessionExpiryHandled = true;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.replace("/?sessionExpired=1");
  }
  return res;
};

// ─── React Query: council members ──────────────────────────────────────────────
// First module migrated off the hand-rolled fetch/useState/loading-flag pattern
// used elsewhere in AdminDashboard. Query key + fetcher live here so any future
// consumer (not just AdminDashboard) can share the same cache entry instead of
// re-fetching independently.
export const OFFICIALS_QUERY_KEY = ["officials"];

export const fetchOfficialsList = async () => {
  const d = await (await fetch(`${API}/api/sb-council-members`)).json();
  return Array.isArray(d) ? d : [];
};

// ─── React Query: PH holidays ──────────────────────────────────────────────────
// Same for every user and barely ever changes — routes/holidays.js caches the
// upstream response for 24h and now sends a matching Cache-Control header, so
// staleTime here just means React Query won't even re-issue the request
// (let alone hit the network) until a day has passed.
export const HOLIDAYS_STALE_TIME_MS = 24 * 60 * 60 * 1000;

export const holidaysQueryKey = (year) => ["holidays", year];

export const fetchHolidaysForYear = async (year) => {
  const res = await authFetch(`${API}/api/holidays/${year}`);
  const data = await res.json();
  if (!res.ok) throw new Error(extractErrorMsg(data, "Failed to load holidays."));
  return data.map((h) => ({
    date: h.date,
    name: h.localName || h.name,
    type: h.types?.includes("Public") ? "national" : "special",
  }));
};

// ─── React Query: councils ──────────────────────────────────────────────────────
// Councils are now a real entity (see migrations/001_create_councils_table.sql)
// instead of an implicit grouping of term_period strings — this is the
// canonical list, independent of which members happen to have terms in them.
export const COUNCILS_QUERY_KEY = ["councils"];

export const fetchCouncilsList = async () => {
  const d = await (await fetch(`${API}/api/councils`)).json();
  return Array.isArray(d) ? d : [];
};

// ─── React Query: pending legislative records ───────────────────────────────────
// Shared cache key for the role-scoped pending queue on ordinances/resolutions/
// session-minutes. Both the Dashboard's "Needs your review" widget and each
// module's own Pending tab ask for the exact same slice (see
// pendingStatusesForRole in useLegislativeReview.js) — keying on it means they
// share one cache entry instead of independently re-fetching, and a single
// invalidateQueries call after an accept/reject/publish action refreshes both
// places at once.
export const pendingQueryKey = (route, statusQ) => ["pending", route, statusQ];

export const fetchPendingList = async (route, statusQ) => {
  const res = await authFetch(`${API}/api/${route}?status=${statusQ}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
};

// ─── Legislative categories ───────────────────────────────────────────────────
// Shared between each module's own filter UI (OrdinancesPage/ResolutionsPage)
// and AdminDashboard.jsx's upload/edit modals (the dropdown you pick a
// category from when creating/editing a record) — both need the exact same
// list, or a value you could pick at upload time could quietly fall outside
// what the filter dropdown offers to search for it. "All" is the filter-only
// sentinel meaning "no category filter applied"; upload/edit forms slice it
// off since a record's actual category can't itself be "All".
export const ORDINANCE_CATEGORIES = [
  "All", "Tax", "Education", "Agriculture", "Environment",
  "Public Works", "Health", "Infrastructure",
];

export const RESOLUTION_CATEGORIES = [
  "All", "Finance", "Health", "Infrastructure", "Education",
  "Environment", "Public Safety", "Agriculture",
];

// ─── React Query: published legislative records ─────────────────────────────────
// Server-paginated, so the key includes page/search/year(/type) — each
// page+filter combo caches independently, meaning flipping back to a page
// you've already seen (or a filter you've already used) serves from cache
// instead of re-hitting the server. `params` should only contain the keys
// that are actually set (mirrors the old URLSearchParams construction) so
// e.g. clearing a filter produces a genuinely different, correctly-cached key.
export const publishedQueryKey = (route, params) => ["published", route, params];

export const fetchPublishedList = async (route, params) => {
  const qs = new URLSearchParams({ status: "published", ...params });
  const res = await authFetch(`${API}/api/${route}?${qs.toString()}`);
  const body = await res.json();
  return {
    data: Array.isArray(body?.data) ? body.data : [],
    total: body?.total || 0,
    totalPages: body?.totalPages || 1,
  };
};

// ─── Fixed set of valid Sangguniang Bayan council positions ────────────────────
// Kept as a constant, not free text, since these map to the real, legally
// fixed composition of a Sangguniang Bayan under RA 7160: one Vice Mayor
// (presiding officer), regular Councilors, and two ex-officio members (the
// Liga ng mga Barangay and SK Federation presidents). Lives on the *term*
// (sb_council_member_terms.position), not the person — a councilor's seat
// can change between terms.
export const OFFICIAL_POSITIONS = [
  "Vice Mayor",
  "Councilor",
  "Liga ng mga Barangay President",
  "SK Federated President",
];

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
  RESET_PASSWORD: { bg: "#fce7f3", color: "#9d174d" },
  ACCEPT: { bg: "#d1fae5", color: "#065f46" },
  REQUEST_CHANGES: { bg: "#fee2e2", color: "#991b1b" },
  VM_APPROVE: { bg: "#dbeafe", color: "#1e40af" },
  PUBLISH: { bg: "#ede9fe", color: "#5b21b6" },
  RESUBMIT: { bg: "#fef9c3", color: "#854d0e" },
  REPLACE_FILE: { bg: "#ffedd5", color: "#9a3412" },
  COMMENT: { bg: "#f3f4f6", color: "#374151" },
};

// Two states only: "urgent" is the one tier that does something (it emails
// every other active user — see notifyUrgent in the backend's announcements
// route), so there's no value in extra severity labels nobody acts on.
export const priorityConfig = {
  urgent: {
    label: "Urgent",
    color: "#c53030",
    bg: "#fff5f5",
    border: "#feb2b2",
  },
  normal: {
    label: "Normal",
    color: "#276749",
    bg: "#f0fff4",
    border: "#9ae6b4",
  },
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
