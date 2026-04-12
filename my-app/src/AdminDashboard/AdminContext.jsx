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
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const toLocalIso = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return toIsoDate(d);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-PH", {
    year: "numeric", month: "short", day: "numeric",
  });
};

// ─── Static Local/Provincial Holidays ────────────────────────────────────────
export const getLocalHolidays = (year) => [
  { date: `${year}-03-16`, name: "Blood Compact Day",                      type: "special-working" },
  { date: `${year}-07-04`, name: "Francisco Dagohoy Day",                  type: "special-working" },
  { date: `${year}-07-15`, name: "Town Fiesta – Our Lady of Mount Carmel", type: "local-fiesta"    },
  { date: `${year}-07-16`, name: "Town Fiesta – Our Lady of Mount Carmel", type: "local-fiesta"    },
  { date: `${year}-07-22`, name: "Bohol Day",                              type: "special"         },
  { date: `${year}-09-29`, name: "Sumad Day (Founding Anniversary)",       type: "special"         },
  { date: `${year}-11-04`, name: "Carlos P. Garcia Day",                   type: "special"         },
];

export const COLOR_SWATCHES = ["#009439","#3b82f6","#eab308","#ec4899","#8b5cf6","#f97316","#14b8a6","#ef4444"];

export const ACTION_COLORS = {
  LOGIN:    { bg: "#d1fae5", color: "#065f46" },
  LOGOUT:   { bg: "#f3f4f6", color: "#374151" },
  REGISTER: { bg: "#dbeafe", color: "#1e40af" },
  UPLOAD:   { bg: "#ede9fe", color: "#5b21b6" },
  CREATE:   { bg: "#fef9c3", color: "#854d0e" },
  UPDATE:   { bg: "#ffedd5", color: "#9a3412" },
  DELETE:   { bg: "#fee2e2", color: "#991b1b" },
};

export const priorityConfig = {
  urgent: { label: "Urgent", color: "#c53030", bg: "#fff5f5", border: "#feb2b2" },
  high:   { label: "High",   color: "#975a16", bg: "#fffbeb", border: "#f6e05e" },
  normal: { label: "Normal", color: "#276749", bg: "#f0fff4", border: "#9ae6b4" },
  low:    { label: "Low",    color: "#4a5568", bg: "#f7fafc", border: "#cbd5e0" },
};

export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export const tabTitles = {
  users: "Manage Users", admins: "Manage Admins", calendar: "Calendar & Schedule",
  announcements: "Announcements", sessions: "Session Minutes & Agenda",
  ordinances: "Ordinances", resolutions: "Resolutions",
  officials: "Sangguniang Bayan Council Members",
  logs: "Activity Logs",
};
