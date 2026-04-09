import { useEffect, useState } from "react";
import styles from "./AdminDashboard.module.css";
import logo from "./assets/image/balilihan-logo-Large-1.png";
import {
<<<<<<< HEAD
  Users,
  ShieldCheck,
  ScrollText,
  Landmark,
  Search,
  X,
  Filter,
  Eye,
  Pencil,
  Trash2,
  FileText,
  Image,
  CalendarDays,
  LogOut,
  ClipboardList,
  Copy,
  Upload,
  CheckSquare,
  AlertCircle,
  BookOpen,
  Printer,
  FileEdit,
  Camera,
  Gavel,
  Megaphone,
  ChevronDown,
  ChevronRight,
  Calendar,
  ChevronLeft,
  Clock,
  MapPin,
  RefreshCw,
  PlusCircle,
} from "lucide-react";
import ConfirmModal from "./ConfirmModal";

=======
  Users, ShieldCheck, ScrollText, Landmark, Search, X, Filter,
  Eye, Pencil, Trash2, FileText, Image, CalendarDays, LogOut,
  ClipboardList, Copy, Upload, CheckSquare, AlertCircle, BookOpen,
  Printer, FileEdit, Camera, Gavel, Megaphone, ChevronDown,
  ChevronRight, Calendar, ChevronLeft, Clock, MapPin, PlusCircle,
  Activity, RefreshCw,
} from "lucide-react";
import ConfirmModal from "./ConfirmModal";

// ─── API Base URL ──────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
// ─── Auth helper ───────────────────────────────────────────────────────────────
const authFetch = (url, options = {}) => {
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
<<<<<<< HEAD
};   
=======
};
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d

// ─── Helpers ───────────────────────────────────────────────────────────────────
const toIsoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const toLocalIso = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return toIsoDate(d);
};

<<<<<<< HEAD
// ─── Static Local/Provincial Holidays (fixed, repeat yearly) ──────────────────
const getLocalHolidays = (year) => [
  { date: `${year}-03-16`, name: "Blood Compact Day",                       type: "special-working" },
  { date: `${year}-07-04`, name: "Francisco Dagohoy Day",                   type: "special-working" },
  { date: `${year}-07-15`, name: "Town Fiesta – Our Lady of Mount Carmel",  type: "local-fiesta"    },
  { date: `${year}-07-16`, name: "Town Fiesta – Our Lady of Mount Carmel",  type: "local-fiesta"    },
  { date: `${year}-07-22`, name: "Bohol Day",                               type: "special"         },
  { date: `${year}-09-29`, name: "Sumad Day (Founding Anniversary)",        type: "special"         },
  { date: `${year}-11-04`, name: "Carlos P. Garcia Day",                    type: "special"         },
];

// ─── Module-level constants ───────────────────────────────────────────────────
const COLOR_SWATCHES = ["#009439","#3b82f6","#eab308","#ec4899","#8b5cf6","#f97316","#14b8a6","#ef4444"];

// ─── EventFormFields defined outside component to prevent focus loss ──────────
=======
// ─── Static Local/Provincial Holidays ────────────────────────────────────────
const getLocalHolidays = (year) => [
  { date: `${year}-03-16`, name: "Blood Compact Day",                      type: "special-working" },
  { date: `${year}-07-04`, name: "Francisco Dagohoy Day",                  type: "special-working" },
  { date: `${year}-07-15`, name: "Town Fiesta – Our Lady of Mount Carmel", type: "local-fiesta"    },
  { date: `${year}-07-16`, name: "Town Fiesta – Our Lady of Mount Carmel", type: "local-fiesta"    },
  { date: `${year}-07-22`, name: "Bohol Day",                              type: "special"         },
  { date: `${year}-09-29`, name: "Sumad Day (Founding Anniversary)",       type: "special"         },
  { date: `${year}-11-04`, name: "Carlos P. Garcia Day",                   type: "special"         },
];

const COLOR_SWATCHES = ["#009439","#3b82f6","#eab308","#ec4899","#8b5cf6","#f97316","#14b8a6","#ef4444"];

// ─── Action colors for logs ───────────────────────────────────────────────────
const ACTION_COLORS = {
  LOGIN:    { bg: "#d1fae5", color: "#065f46" },
  LOGOUT:   { bg: "#f3f4f6", color: "#374151" },
  REGISTER: { bg: "#dbeafe", color: "#1e40af" },
  UPLOAD:   { bg: "#ede9fe", color: "#5b21b6" },
  CREATE:   { bg: "#fef9c3", color: "#854d0e" },
  UPDATE:   { bg: "#ffedd5", color: "#9a3412" },
  DELETE:   { bg: "#fee2e2", color: "#991b1b" },
}

// ─── EventFormFields ──────────────────────────────────────────────────────────
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
function EventFormFields({ form, setForm }) {
  return (
    <>
      <label className={styles.fieldLabel}>Title <span style={{ color: "#e53e3e" }}>*</span></label>
      <input className={styles.input} placeholder="Event title..." value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <label className={styles.fieldLabel} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", marginTop: 8 }}>
        <input type="checkbox" checked={form.all_day} onChange={(e) => setForm({ ...form, all_day: e.target.checked })} />
        {" "}All-day event
      </label>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <div style={{ flex: 1 }}>
          <label className={styles.fieldLabel}>Start Date <span style={{ color: "#e53e3e" }}>*</span></label>
          <input className={styles.input} type="date" value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
        </div>
        {!form.all_day && (
          <div style={{ flex: 1 }}>
            <label className={styles.fieldLabel}>Start Time</label>
            <input className={styles.input} type="time" value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <label className={styles.fieldLabel}>End Date</label>
          <input className={styles.input} type="date" value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
        </div>
        {!form.all_day && (
          <div style={{ flex: 1 }}>
            <label className={styles.fieldLabel}>End Time</label>
            <input className={styles.input} type="time" value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
          </div>
        )}
      </div>
      <label className={styles.fieldLabel}>Location</label>
      <input className={styles.input} placeholder="Location (optional)" value={form.location}
        onChange={(e) => setForm({ ...form, location: e.target.value })} />
      <label className={styles.fieldLabel}>Description</label>
      <textarea className={styles.textArea} placeholder="Description (optional)" rows={3}
        value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <label className={styles.fieldLabel}>Event Color</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        {COLOR_SWATCHES.map((c) => (
          <button key={c} onClick={() => setForm({ ...form, color: c })} style={{
            width: 28, height: 28, borderRadius: "50%", background: c, border: "none",
            cursor: "pointer", outline: form.color === c ? "3px solid #0f172a" : "none", outlineOffset: 2,
          }} />
        ))}
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  // ── core ──
  const [users, setUsers] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [modalMessage, setModalMessage] = useState("");
  const [modalMessageType, setModalMessageType] = useState("success");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMgmtOpen, setUserMgmtOpen] = useState(true);

<<<<<<< HEAD
  // ── PH Holidays (Nager.Date API) ──
=======
  // ── PH Holidays ──
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  const [phHolidays, setPhHolidays] = useState({});
  const [fetchingHolidays, setFetchingHolidays] = useState(false);

  // ── loading flags ──
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [fetchingOrdinances, setFetchingOrdinances] = useState(false);
  const [fetchingOfficials, setFetchingOfficials] = useState(false);
  const [fetchingMinutes, setFetchingMinutes] = useState(false);
  const [fetchingResolutions, setFetchingResolutions] = useState(false);
  const [fetchingAnnouncements, setFetchingAnnouncements] = useState(false);

<<<<<<< HEAD
=======
  // ── activity logs ──
  const [logs, setLogs] = useState([]);
  const [logStats, setLogStats] = useState(null);
  const [fetchingLogs, setFetchingLogs] = useState(false);
  const [logModuleFilter, setLogModuleFilter] = useState("all");
  const [logActionFilter, setLogActionFilter] = useState("all");

>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  // ── modals ──
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showOrdinanceModal, setShowOrdinanceModal] = useState(false);
  const [showEditOrdinanceModal, setShowEditOrdinanceModal] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [showEditResolutionModal, setShowEditResolutionModal] = useState(false);
  const [showOfficialModal, setShowOfficialModal] = useState(false);
  const [showOfficialProfile, setShowOfficialProfile] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showEditAnnouncementModal, setShowEditAnnouncementModal] = useState(false);
  const [showLocalEventModal, setShowLocalEventModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);

  // ── data ──
  const [newUser, setNewUser] = useState({ name: "", username: "", email: "", password: "" });
  const [newAdmin, setNewAdmin] = useState({ name: "", username: "", email: "", password: "" });

  // ordinances
  const [ordinances, setOrdinances] = useState([]);
  const [ordinanceNumber, setOrdinanceNumber] = useState("");
  const [ordinanceTitle, setOrdinanceTitle] = useState("");
  const [ordinanceYear, setOrdinanceYear] = useState("");
  const [ordinanceFile, setOrdinanceFile] = useState(null);
  const [uploadType, setUploadType] = useState("");
  const [selectedOfficials, setSelectedOfficials] = useState([]);
  const [extractedText, setExtractedText] = useState("");
  const [editingOrdinance, setEditingOrdinance] = useState(null);
  const [editOrdinanceNumber, setEditOrdinanceNumber] = useState("");
  const [editOrdinanceTitle, setEditOrdinanceTitle] = useState("");
  const [editOrdinanceYear, setEditOrdinanceYear] = useState("");
  const [editSelectedOfficials, setEditSelectedOfficials] = useState([]);
  const [editOrdinanceFile, setEditOrdinanceFile] = useState(null);
  const [ordinanceSearch, setOrdinanceSearch] = useState("");
  const [ordinanceTypeFilter, setOrdinanceTypeFilter] = useState("all");

  // resolutions
  const [resolutions, setResolutions] = useState([]);
  const [resolutionNumber, setResolutionNumber] = useState("");
  const [resolutionTitle, setResolutionTitle] = useState("");
  const [resolutionYear, setResolutionYear] = useState("");
  const [resolutionFile, setResolutionFile] = useState(null);
  const [resolutionUploadType, setResolutionUploadType] = useState("");
  const [selectedResolutionOfficials, setSelectedResolutionOfficials] = useState([]);
  const [editingResolution, setEditingResolution] = useState(null);
  const [editResolutionNumber, setEditResolutionNumber] = useState("");
  const [editResolutionTitle, setEditResolutionTitle] = useState("");
  const [editResolutionYear, setEditResolutionYear] = useState("");
  const [editResolutionSelectedOfficials, setEditResolutionSelectedOfficials] = useState([]);
  const [editResolutionFile, setEditResolutionFile] = useState(null);
  const [resolutionSearch, setResolutionSearch] = useState("");
  const [resolutionTypeFilter, setResolutionTypeFilter] = useState("all");

  // officials
  const [officials, setOfficials] = useState([]);
  const [newOfficial, setNewOfficial] = useState({ full_name: "", position: "", term_period: "" });
  const [officialPhoto, setOfficialPhoto] = useState(null);
  const [officialSearch, setOfficialSearch] = useState("");
  const [officialPositionFilter, setOfficialPositionFilter] = useState("all");
  const [selectedOfficialProfile, setSelectedOfficialProfile] = useState(null);

  // sessions
  const [sessionMinutes, setSessionMinutes] = useState([]);
  const [minutesSearch, setMinutesSearch] = useState("");
  const [minutesTypeFilter, setMinutesTypeFilter] = useState("all");
  const [minutesYearFilter, setMinutesYearFilter] = useState("all");
  const [sessionInputMode, setSessionInputMode] = useState("text");
  const [sessionForm, setSessionForm] = useState({
<<<<<<< HEAD
    session_number: "",
    session_date: "",
    session_type: "regular",
    venue: "",
    agenda: "",
    minutes_text: "",
=======
    session_number: "", session_date: "", session_type: "regular",
    venue: "", agenda: "", minutes_text: "",
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  });
  const [sessionFile, setSessionFile] = useState(null);
  const [sessionOcrTarget, setSessionOcrTarget] = useState("minutes");
  const [editingSession, setEditingSession] = useState(null);
  const [editSessionForm, setEditSessionForm] = useState({
<<<<<<< HEAD
    session_number: "",
    session_date: "",
    session_type: "regular",
    venue: "",
    agenda: "",
    minutes_text: "",
=======
    session_number: "", session_date: "", session_type: "regular",
    venue: "", agenda: "", minutes_text: "",
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  });

  // announcements
  const [announcements, setAnnouncements] = useState([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", body: "", priority: "normal", expires_at: "" });
  const [editAnnouncementForm, setEditAnnouncementForm] = useState({ title: "", body: "", priority: "normal", expires_at: "" });
  const [announcementSearch, setAnnouncementSearch] = useState("");
  const [announcementPriorityFilter, setAnnouncementPriorityFilter] = useState("all");

<<<<<<< HEAD
  // ── calendar (local DB only) ──
=======
  // calendar
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  const [localEvents, setLocalEvents] = useState([]);
  const [fetchingCalendar, setFetchingCalendar] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [selectedCalDay, setSelectedCalDay] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [savingLocalEvent, setSavingLocalEvent] = useState(false);
  const [showHolidays, setShowHolidays] = useState(true);

  const emptyEventForm = {
<<<<<<< HEAD
    title: "",
    description: "",
    location: "",
    start_date: "",
    start_time: "08:00",
    end_date: "",
    end_time: "09:00",
    all_day: false,
    color: "#009439",
=======
    title: "", description: "", location: "",
    start_date: "", start_time: "08:00",
    end_date: "", end_time: "09:00",
    all_day: false, color: "#009439",
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  };
  const [localEventForm, setLocalEventForm] = useState(emptyEventForm);
  const [editEventForm, setEditEventForm] = useState(emptyEventForm);

<<<<<<< HEAD
  // ─── Init ────────────────────────────────────────────────────────────────────
=======
  // ─── Init ─────────────────────────────────────────────────────────────────────
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!storedUser || !token) { window.location.replace("/"); return; }
    try {
      const u = JSON.parse(storedUser);
      if (u.role !== "admin") { window.location.replace("/"); return; }
      setAdmin(u);
    } catch { window.location.replace("/"); return; }
    fetchUsers();
    fetchOrdinances();
    fetchOfficials();
    fetchSessionMinutes();
    fetchResolutions();
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (activeTab === "calendar") {
      fetchLocalEvents();
      const year = calendarViewDate.getFullYear();
      fetchPHHolidays(year);
      fetchPHHolidays(year + 1);
    }
<<<<<<< HEAD
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "calendar") {
      fetchPHHolidays(calendarViewDate.getFullYear());
    }
  }, [calendarViewDate]);

  // ─── Message helpers ─────────────────────────────────────────────────────────
  const showMsg = (msg, type = "success") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3500);
  };
  const showModalMsg = (msg, type = "success") => {
    setModalMessage(msg);
    setModalMessageType(type);
=======
    if (activeTab === "logs") {
      fetchLogs();
      fetchLogStats();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "calendar") fetchPHHolidays(calendarViewDate.getFullYear());
  }, [calendarViewDate]);

  useEffect(() => {
    if (activeTab === "logs") fetchLogs();
  }, [logModuleFilter, logActionFilter]);

  // ─── Message helpers ──────────────────────────────────────────────────────────
  const showMsg = (msg, type = "success") => {
    setMessage(msg); setMessageType(type);
    setTimeout(() => setMessage(""), 3500);
  };
  const showModalMsg = (msg, type = "success") => {
    setModalMessage(msg); setModalMessageType(type);
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
    setTimeout(() => setModalMessage(""), 3500);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.replace("/");
  };
<<<<<<< HEAD
  const handleTabChange = (key) => {
    setActiveTab(key);
    setMobileOpen(false);
  };

  // ─── Fetch functions ─────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    setFetchingUsers(true);
    try {
      const res = await authFetch("http://localhost:5000/api/users");
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.replace("/");
        return;
=======
  const handleTabChange = (key) => { setActiveTab(key); setMobileOpen(false); };

  // ─── Fetch functions ──────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    setFetchingUsers(true);
    try {
      const res = await authFetch(`${API}/api/users`);
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token"); localStorage.removeItem("user");
        window.location.replace("/"); return;
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch { setUsers([]); }
    finally { setFetchingUsers(false); }
  };
  const fetchOrdinances = async () => {
    setFetchingOrdinances(true);
    try {
<<<<<<< HEAD
      const d = await (await fetch("http://localhost:5000/api/ordinances")).json();
=======
      const d = await (await fetch(`${API}/api/ordinances`)).json();
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      setOrdinances(Array.isArray(d) ? d : []);
    } catch { setOrdinances([]); }
    finally { setFetchingOrdinances(false); }
  };
  const fetchResolutions = async () => {
    setFetchingResolutions(true);
    try {
<<<<<<< HEAD
      const d = await (await fetch("http://localhost:5000/api/resolutions")).json();
=======
      const d = await (await fetch(`${API}/api/resolutions`)).json();
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      setResolutions(Array.isArray(d) ? d : []);
    } catch { setResolutions([]); }
    finally { setFetchingResolutions(false); }
  };
  const fetchOfficials = async () => {
    setFetchingOfficials(true);
    try {
<<<<<<< HEAD
      const d = await (await fetch("http://localhost:5000/api/sb-officials")).json();
=======
      const d = await (await fetch(`${API}/api/sb-officials`)).json();
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      setOfficials(Array.isArray(d) ? d : []);
    } catch { setOfficials([]); }
    finally { setFetchingOfficials(false); }
  };
  const fetchSessionMinutes = async () => {
    setFetchingMinutes(true);
    try {
<<<<<<< HEAD
      const d = await (await fetch("http://localhost:5000/api/session-minutes")).json();
=======
      const d = await (await fetch(`${API}/api/session-minutes`)).json();
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      setSessionMinutes(Array.isArray(d) ? d : []);
    } catch { setSessionMinutes([]); }
    finally { setFetchingMinutes(false); }
  };
  const fetchAnnouncements = async () => {
    setFetchingAnnouncements(true);
    try {
<<<<<<< HEAD
      const d = await (await fetch("http://localhost:5000/api/announcements")).json();
=======
      const d = await (await fetch(`${API}/api/announcements`)).json();
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      setAnnouncements(Array.isArray(d) ? d : []);
    } catch { setAnnouncements([]); }
    finally { setFetchingAnnouncements(false); }
  };
  const fetchLocalEvents = async () => {
    setFetchingCalendar(true);
    try {
<<<<<<< HEAD
      const d = await (await fetch("http://localhost:5000/api/calendar-events")).json();
=======
      const d = await (await fetch(`${API}/api/calendar-events`)).json();
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      setLocalEvents(Array.isArray(d) ? d : []);
    } catch { setLocalEvents([]); }
    finally { setFetchingCalendar(false); }
  };

<<<<<<< HEAD
  // ─── Fetch PH Holidays from Nager.Date API ───────────────────────────────────
=======
  // ─── Fetch Logs ───────────────────────────────────────────────────────────────
  const fetchLogs = async () => {
    setFetchingLogs(true);
    try {
      let url = `${API}/api/activity-logs?limit=100`;
      if (logModuleFilter !== "all") url += `&module=${logModuleFilter}`;
      if (logActionFilter !== "all") url += `&action=${logActionFilter}`;
      const d = await (await authFetch(url)).json();
      setLogs(Array.isArray(d) ? d : []);
    } catch { setLogs([]); }
    finally { setFetchingLogs(false); }
  };

  const fetchLogStats = async () => {
    try {
      const d = await (await authFetch(`${API}/api/activity-logs/stats`)).json();
      setLogStats(d);
    } catch {}
  };

  // ─── PH Holidays ─────────────────────────────────────────────────────────────
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  const fetchPHHolidays = async (year) => {
    if (phHolidays[year]) return;
    setFetchingHolidays(true);
    try {
      const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/PH`);
      const data = await res.json();
      setPhHolidays((prev) => ({
        ...prev,
        [year]: data.map((h) => ({
<<<<<<< HEAD
          date: h.date,
          name: h.localName || h.name,
=======
          date: h.date, name: h.localName || h.name,
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
          type: h.types?.includes("Public") ? "national" : "special",
        })),
      }));
    } catch {
      setPhHolidays((prev) => ({ ...prev, [year]: [] }));
    } finally {
      setFetchingHolidays(false);
    }
  };

  // ─── Calendar helpers ─────────────────────────────────────────────────────────
  const getEventsForDay = (date) => {
    const iso = toIsoDate(date);
    const year = date.getFullYear();
    const yearHolidays = phHolidays[year] || [];
    const localHols = getLocalHolidays(year);
<<<<<<< HEAD

=======
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
    const allHolsForDay = [
      ...yearHolidays.filter((h) => h.date === iso),
      ...localHols.filter((h) => h.date === iso),
    ];
<<<<<<< HEAD

    const holidays = showHolidays
      ? allHolsForDay.map((h) => ({
          id: `hol-${h.date}-${h.name}`,
          summary: h.name,
          isHoliday: true,
          holidayType: h.type,
          start: { date: h.date },
          end: { date: h.date },
        }))
      : [];

=======
    const holidays = showHolidays
      ? allHolsForDay.map((h) => ({
          id: `hol-${h.date}-${h.name}`, summary: h.name,
          isHoliday: true, holidayType: h.type,
          start: { date: h.date }, end: { date: h.date },
        }))
      : [];
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
    const dbEvs = localEvents
      .filter((ev) => {
        const start = toLocalIso(ev.start_date);
        const end = toLocalIso(ev.end_date || ev.start_date) || start;
        return start <= iso && iso <= end;
      })
      .map((ev) => {
        const startIso = toLocalIso(ev.start_date);
        const endIso = toLocalIso(ev.end_date || ev.start_date);
        return {
<<<<<<< HEAD
          id: `local-${ev.id}`,
          dbId: ev.id,
          summary: ev.title,
          location: ev.location,
          description: ev.description,
          color: ev.color || "#009439",
          isLocal: true,
          all_day: ev.all_day,
          start: {
            date: startIso,
            dateTime: ev.all_day ? null : `${startIso}T${ev.start_time || "00:00"}`,
          },
          end: {
            date: endIso,
            dateTime: ev.all_day ? null : `${endIso}T${ev.end_time || "00:00"}`,
          },
          raw: ev,
        };
      });

=======
          id: `local-${ev.id}`, dbId: ev.id, summary: ev.title,
          location: ev.location, description: ev.description,
          color: ev.color || "#009439", isLocal: true, all_day: ev.all_day,
          start: { date: startIso, dateTime: ev.all_day ? null : `${startIso}T${ev.start_time || "00:00"}` },
          end: { date: endIso, dateTime: ev.all_day ? null : `${endIso}T${ev.end_time || "00:00"}` },
          raw: ev,
        };
      });
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
    return [...holidays, ...dbEvs];
  };

  const getUpcomingEvents = () => {
    const todayIso = toIsoDate(new Date());
    const year = new Date().getFullYear();
<<<<<<< HEAD
    const allHolidays = [
      ...(phHolidays[year] || []),
      ...(phHolidays[year + 1] || []),
    ];

    const localHolsUpcoming = [
      ...getLocalHolidays(year),
      ...getLocalHolidays(year + 1),
    ];

=======
    const allHolidays = [...(phHolidays[year] || []), ...(phHolidays[year + 1] || [])];
    const localHolsUpcoming = [...getLocalHolidays(year), ...getLocalHolidays(year + 1)];
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
    const holidays = showHolidays
      ? [...allHolidays, ...localHolsUpcoming]
          .filter((h) => h.date >= todayIso)
          .map((h) => ({
<<<<<<< HEAD
            id: `hol-${h.date}-${h.name}`,
            summary: h.name,
            isHoliday: true,
            holidayType: h.type,
            start: { date: h.date },
            end: { date: h.date },
          }))
      : [];

=======
            id: `hol-${h.date}-${h.name}`, summary: h.name,
            isHoliday: true, holidayType: h.type,
            start: { date: h.date }, end: { date: h.date },
          }))
      : [];
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
    const dbEvs = localEvents
      .filter((ev) => (toLocalIso(ev.start_date) || "") >= todayIso)
      .map((ev) => {
        const startIso = toLocalIso(ev.start_date);
        const endIso = toLocalIso(ev.end_date || ev.start_date);
        return {
<<<<<<< HEAD
          id: `local-${ev.id}`,
          dbId: ev.id,
          summary: ev.title,
          location: ev.location,
          description: ev.description,
          color: ev.color || "#009439",
          isLocal: true,
          all_day: ev.all_day,
          start: {
            date: startIso,
            dateTime: ev.all_day ? null : `${startIso}T${ev.start_time}`,
          },
          end: {
            date: endIso,
            dateTime: ev.all_day ? null : `${endIso}T${ev.end_time}`,
          },
          raw: ev,
        };
      });

=======
          id: `local-${ev.id}`, dbId: ev.id, summary: ev.title,
          location: ev.location, description: ev.description,
          color: ev.color || "#009439", isLocal: true, all_day: ev.all_day,
          start: { date: startIso, dateTime: ev.all_day ? null : `${startIso}T${ev.start_time}` },
          end: { date: endIso, dateTime: ev.all_day ? null : `${endIso}T${ev.end_time}` },
          raw: ev,
        };
      });
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
    return [...holidays, ...dbEvs]
      .sort((a, b) => (a.start?.date || "").localeCompare(b.start?.date || ""))
      .slice(0, 15);
  };

  const chipStyle = (ev) => {
    if (ev.isHoliday) {
<<<<<<< HEAD
      if (ev.holidayType === "national")
        return { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" };
      if (ev.holidayType === "special-working")
        return { bg: "#dcfce7", color: "#166534", dot: "#22c55e" };
      if (ev.holidayType === "local-fiesta")
        return { bg: "#fce7f3", color: "#9d174d", dot: "#ec4899" };
      if (ev.holidayType === "special")
        return { bg: "#fef9c3", color: "#854d0e", dot: "#eab308" };
=======
      if (ev.holidayType === "national")        return { bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" };
      if (ev.holidayType === "special-working") return { bg: "#dcfce7", color: "#166534", dot: "#22c55e" };
      if (ev.holidayType === "local-fiesta")    return { bg: "#fce7f3", color: "#9d174d", dot: "#ec4899" };
      if (ev.holidayType === "special")         return { bg: "#fef9c3", color: "#854d0e", dot: "#eab308" };
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      return { bg: "#ede9fe", color: "#5b21b6", dot: "#8b5cf6" };
    }
    const c = ev.color || "#009439";
    return { bg: c + "28", color: c, dot: c };
  };

  // ─── Local event CRUD ─────────────────────────────────────────────────────────
  const handleSaveLocalEvent = async () => {
    if (!localEventForm.title || !localEventForm.start_date) {
      showModalMsg("Title and start date are required!", "error"); return;
    }
    setSavingLocalEvent(true);
    try {
<<<<<<< HEAD
      const res = await authFetch("http://localhost:5000/api/calendar-events", {
        method: "POST",
        body: JSON.stringify(localEventForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Event saved!");
        setShowLocalEventModal(false);
        setLocalEventForm(emptyEventForm);
        fetchLocalEvents();
=======
      const res = await authFetch(`${API}/api/calendar-events`, { method: "POST", body: JSON.stringify(localEventForm) });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Event saved!"); setShowLocalEventModal(false);
        setLocalEventForm(emptyEventForm); fetchLocalEvents();
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      } else showModalMsg(data.error || "Failed to save event!", "error");
    } catch { showModalMsg("Server error!", "error"); }
    finally { setSavingLocalEvent(false); }
  };

  const handleOpenEditEvent = (ev) => {
    const r = ev.raw;
    setEditingEvent(ev);
    setEditEventForm({
<<<<<<< HEAD
      title: r.title || "",
      description: r.description || "",
      location: r.location || "",
      start_date: toLocalIso(r.start_date) || "",
      start_time: r.start_time || "08:00",
      end_date: toLocalIso(r.end_date) || "",
      end_time: r.end_time || "09:00",
      all_day: !!r.all_day,
      color: r.color || "#009439",
    });
    setShowEventDetailModal(false);
    setShowEditEventModal(true);
=======
      title: r.title || "", description: r.description || "",
      location: r.location || "", start_date: toLocalIso(r.start_date) || "",
      start_time: r.start_time || "08:00", end_date: toLocalIso(r.end_date) || "",
      end_time: r.end_time || "09:00", all_day: !!r.all_day, color: r.color || "#009439",
    });
    setShowEventDetailModal(false); setShowEditEventModal(true);
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  };

  const handleUpdateEvent = async () => {
    if (!editEventForm.title || !editEventForm.start_date) {
      showModalMsg("Title and start date are required!", "error"); return;
    }
    setSavingLocalEvent(true);
    try {
<<<<<<< HEAD
      const res = await authFetch(
        `http://localhost:5000/api/calendar-events/${editingEvent.dbId}`,
        { method: "PUT", body: JSON.stringify(editEventForm) },
      );
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Event updated!");
        setShowEditEventModal(false);
        setEditingEvent(null);
        fetchLocalEvents();
=======
      const res = await authFetch(`${API}/api/calendar-events/${editingEvent.dbId}`, { method: "PUT", body: JSON.stringify(editEventForm) });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Event updated!"); setShowEditEventModal(false);
        setEditingEvent(null); fetchLocalEvents();
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      } else showModalMsg(data.error || "Update failed!", "error");
    } catch { showModalMsg("Server error!", "error"); }
    finally { setSavingLocalEvent(false); }
  };

  const handleDeleteEvent = async (dbId) => {
    try {
<<<<<<< HEAD
      const res = await authFetch(`http://localhost:5000/api/calendar-events/${dbId}`, { method: "DELETE" });
=======
      const res = await authFetch(`${API}/api/calendar-events/${dbId}`, { method: "DELETE" });
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      const data = await res.json();
      if (data.success) { showMsg("Event deleted!"); setShowEventDetailModal(false); fetchLocalEvents(); }
      else showMsg(data.error || "Error!", "error");
    } catch { showMsg("Error!", "error"); }
  };

  // ─── Users / Admins ───────────────────────────────────────────────────────────
  const handleAddAdmin = async () => {
    if (!newAdmin.name || !newAdmin.username || !newAdmin.email || !newAdmin.password) {
      showModalMsg("All fields required!", "error"); return;
    }
    setSubmitting(true);
    try {
<<<<<<< HEAD
      const res = await authFetch("http://localhost:5000/api/admin/add", {
        method: "POST", body: JSON.stringify(newAdmin),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Admin added!");
        setNewAdmin({ name: "", username: "", email: "", password: "" });
        setShowAddAdminModal(false);
        fetchUsers();
=======
      const res = await authFetch(`${API}/api/admin/add`, { method: "POST", body: JSON.stringify(newAdmin) });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Admin added!"); setNewAdmin({ name: "", username: "", email: "", password: "" });
        setShowAddAdminModal(false); fetchUsers();
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      } else showModalMsg(data.error || "Failed!", "error");
    } catch { showModalMsg("Server error!", "error"); }
    finally { setSubmitting(false); }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.username || !newUser.email || !newUser.password) {
      showModalMsg("All fields required!", "error"); return;
    }
    setSubmitting(true);
    try {
<<<<<<< HEAD
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("User added!");
        setNewUser({ name: "", username: "", email: "", password: "" });
        setShowAddUserModal(false);
        fetchUsers();
=======
      const res = await fetch(`${API}/api/register`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newUser),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("User added!"); setNewUser({ name: "", username: "", email: "", password: "" });
        setShowAddUserModal(false); fetchUsers();
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      } else showModalMsg(data.error || "Failed!", "error");
    } catch { showModalMsg("Server error!", "error"); }
    finally { setSubmitting(false); }
  };

  const handleDeleteUser = async (id) => {
    try {
<<<<<<< HEAD
      const res = await authFetch(`http://localhost:5000/api/users/${id}`, { method: "DELETE" });
=======
      const res = await authFetch(`${API}/api/users/${id}`, { method: "DELETE" });
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      const data = await res.json();
      if (data.success) { showMsg("User deleted!"); fetchUsers(); }
      else showMsg(data.error || "Error!", "error");
    } catch { showMsg("Error!", "error"); }
  };

  // ─── Ordinances ──────────────────────────────────────────────────────────────
  const handleUploadOrdinance = async () => {
    if (!ordinanceNumber || !ordinanceTitle || !ordinanceYear || !ordinanceFile || !uploadType) {
      showModalMsg("Please fill all fields and choose upload type!", "error"); return;
    }
    setSubmitting(true);
    const fd = new FormData();
<<<<<<< HEAD
    fd.append("ordinance_number", ordinanceNumber);
    fd.append("title", ordinanceTitle);
    fd.append("year", ordinanceYear);
    fd.append("file", ordinanceFile);
    fd.append("officials", JSON.stringify(selectedOfficials));
    fd.append("uploadType", uploadType);
    try {
      const ep = uploadType === "image-to-text"
        ? "http://localhost:5000/api/ordinances/upload-image-text"
        : "http://localhost:5000/api/ordinances/upload";
=======
    fd.append("ordinance_number", ordinanceNumber); fd.append("title", ordinanceTitle);
    fd.append("year", ordinanceYear); fd.append("file", ordinanceFile);
    fd.append("officials", JSON.stringify(selectedOfficials)); fd.append("uploadType", uploadType);
    try {
      const ep = uploadType === "image-to-text" ? `${API}/api/ordinances/upload-image-text` : `${API}/api/ordinances/upload`;
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      const res = await authFetch(ep, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Ordinance uploaded!");
        if (uploadType === "image-to-text" && data.text) { setExtractedText(data.text); setShowTextModal(true); }
        setOrdinanceNumber(""); setOrdinanceTitle(""); setOrdinanceYear("");
        setOrdinanceFile(null); setSelectedOfficials([]); setUploadType("");
        setShowOrdinanceModal(false); fetchOrdinances();
      } else showModalMsg(data.error || "Upload failed!", "error");
    } catch { showModalMsg("Server error!", "error"); }
    finally { setSubmitting(false); }
  };

  const handleOpenEditOrdinance = (o) => {
<<<<<<< HEAD
    setEditingOrdinance(o);
    setEditOrdinanceNumber(o.ordinance_number || "");
    setEditOrdinanceTitle(o.title);
    setEditOrdinanceYear(o.year || "");
    setEditSelectedOfficials(o.officials ? o.officials.map((x) => x.id) : []);
    setEditOrdinanceFile(null);
    setModalMessage("");
    setShowEditOrdinanceModal(true);
  };
  const toggleEditOfficial = (id) =>
    setEditSelectedOfficials((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
=======
    setEditingOrdinance(o); setEditOrdinanceNumber(o.ordinance_number || "");
    setEditOrdinanceTitle(o.title); setEditOrdinanceYear(o.year || "");
    setEditSelectedOfficials(o.officials ? o.officials.map((x) => x.id) : []);
    setEditOrdinanceFile(null); setModalMessage(""); setShowEditOrdinanceModal(true);
  };
  const toggleEditOfficial = (id) =>
    setEditSelectedOfficials((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  const handleUpdateOrdinance = async () => {
    if (!editOrdinanceNumber || !editOrdinanceTitle || !editOrdinanceYear) {
      showModalMsg("All fields required!", "error"); return;
    }
    setSubmitting(true);
    const fd = new FormData();
<<<<<<< HEAD
    fd.append("ordinance_number", editOrdinanceNumber);
    fd.append("title", editOrdinanceTitle);
    fd.append("year", editOrdinanceYear);
    fd.append("officials", JSON.stringify(editSelectedOfficials));
    if (editOrdinanceFile) fd.append("file", editOrdinanceFile);
    try {
      const res = await authFetch(`http://localhost:5000/api/ordinances/${editingOrdinance.id}`, { method: "PUT", body: fd });
=======
    fd.append("ordinance_number", editOrdinanceNumber); fd.append("title", editOrdinanceTitle);
    fd.append("year", editOrdinanceYear); fd.append("officials", JSON.stringify(editSelectedOfficials));
    if (editOrdinanceFile) fd.append("file", editOrdinanceFile);
    try {
      const res = await authFetch(`${API}/api/ordinances/${editingOrdinance.id}`, { method: "PUT", body: fd });
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Ordinance updated!"); setShowEditOrdinanceModal(false); setEditingOrdinance(null); fetchOrdinances();
      } else showModalMsg(data.error || "Update failed!", "error");
    } catch { showModalMsg("Server error!", "error"); }
    finally { setSubmitting(false); }
  };
<<<<<<< HEAD
  const handleDeleteOrdinance = async (id) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/ordinances/${id}`, { method: "DELETE" });
=======

  const handleDeleteOrdinance = async (id) => {
    try {
      const res = await authFetch(`${API}/api/ordinances/${id}`, { method: "DELETE" });
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      const data = await res.json();
      if (data.success) { showMsg("Deleted!"); fetchOrdinances(); }
      else showMsg(data.error || "Error!", "error");
    } catch { showMsg("Error!", "error"); }
  };

  // ─── Resolutions ─────────────────────────────────────────────────────────────
  const handleUploadResolution = async () => {
    if (!resolutionNumber || !resolutionTitle || !resolutionYear || !resolutionFile || !resolutionUploadType) {
      showModalMsg("Please fill all fields and choose upload type!", "error"); return;
    }
    setSubmitting(true);
    const fd = new FormData();
<<<<<<< HEAD
    fd.append("resolution_number", resolutionNumber);
    fd.append("title", resolutionTitle);
    fd.append("year", resolutionYear);
    fd.append("file", resolutionFile);
    fd.append("officials", JSON.stringify(selectedResolutionOfficials));
    fd.append("uploadType", resolutionUploadType);
    try {
      const ep = resolutionUploadType === "image-to-text"
        ? "http://localhost:5000/api/resolutions/upload-image-text"
        : "http://localhost:5000/api/resolutions/upload";
=======
    fd.append("resolution_number", resolutionNumber); fd.append("title", resolutionTitle);
    fd.append("year", resolutionYear); fd.append("file", resolutionFile);
    fd.append("officials", JSON.stringify(selectedResolutionOfficials)); fd.append("uploadType", resolutionUploadType);
    try {
      const ep = resolutionUploadType === "image-to-text" ? `${API}/api/resolutions/upload-image-text` : `${API}/api/resolutions/upload`;
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      const res = await authFetch(ep, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Resolution uploaded!");
        if (resolutionUploadType === "image-to-text" && data.text) { setExtractedText(data.text); setShowTextModal(true); }
        setResolutionNumber(""); setResolutionTitle(""); setResolutionYear("");
        setResolutionFile(null); setSelectedResolutionOfficials([]); setResolutionUploadType("");
        setShowResolutionModal(false); fetchResolutions();
      } else showModalMsg(data.error || "Upload failed!", "error");
    } catch { showModalMsg("Server error!", "error"); }
    finally { setSubmitting(false); }
  };
<<<<<<< HEAD
  const handleOpenEditResolution = (r) => {
    setEditingResolution(r);
    setEditResolutionNumber(r.resolution_number || "");
    setEditResolutionTitle(r.title);
    setEditResolutionYear(r.year || "");
    setEditResolutionSelectedOfficials(r.officials ? r.officials.map((x) => x.id) : []);
    setEditResolutionFile(null);
    setModalMessage("");
    setShowEditResolutionModal(true);
  };
  const toggleEditResolutionOfficial = (id) =>
    setEditResolutionSelectedOfficials((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
=======

  const handleOpenEditResolution = (r) => {
    setEditingResolution(r); setEditResolutionNumber(r.resolution_number || "");
    setEditResolutionTitle(r.title); setEditResolutionYear(r.year || "");
    setEditResolutionSelectedOfficials(r.officials ? r.officials.map((x) => x.id) : []);
    setEditResolutionFile(null); setModalMessage(""); setShowEditResolutionModal(true);
  };
  const toggleEditResolutionOfficial = (id) =>
    setEditResolutionSelectedOfficials((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  const handleUpdateResolution = async () => {
    if (!editResolutionNumber || !editResolutionTitle || !editResolutionYear) {
      showModalMsg("All fields required!", "error"); return;
    }
    setSubmitting(true);
    const fd = new FormData();
<<<<<<< HEAD
    fd.append("resolution_number", editResolutionNumber);
    fd.append("title", editResolutionTitle);
    fd.append("year", editResolutionYear);
    fd.append("officials", JSON.stringify(editResolutionSelectedOfficials));
    if (editResolutionFile) fd.append("file", editResolutionFile);
    try {
      const res = await authFetch(`http://localhost:5000/api/resolutions/${editingResolution.id}`, { method: "PUT", body: fd });
=======
    fd.append("resolution_number", editResolutionNumber); fd.append("title", editResolutionTitle);
    fd.append("year", editResolutionYear); fd.append("officials", JSON.stringify(editResolutionSelectedOfficials));
    if (editResolutionFile) fd.append("file", editResolutionFile);
    try {
      const res = await authFetch(`${API}/api/resolutions/${editingResolution.id}`, { method: "PUT", body: fd });
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Resolution updated!"); setShowEditResolutionModal(false); setEditingResolution(null); fetchResolutions();
      } else showModalMsg(data.error || "Update failed!", "error");
    } catch { showModalMsg("Server error!", "error"); }
    finally { setSubmitting(false); }
  };
<<<<<<< HEAD
  const handleDeleteResolution = async (id) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/resolutions/${id}`, { method: "DELETE" });
=======

  const handleDeleteResolution = async (id) => {
    try {
      const res = await authFetch(`${API}/api/resolutions/${id}`, { method: "DELETE" });
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      const data = await res.json();
      if (data.success) { showMsg("Resolution deleted!"); fetchResolutions(); }
      else showMsg(data.error || "Error!", "error");
    } catch { showMsg("Error!", "error"); }
  };
  const toggleResolutionOfficial = (id) =>
    setSelectedResolutionOfficials((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  // ─── Officials ────────────────────────────────────────────────────────────────
  const handleAddOfficial = async () => {
    if (!newOfficial.full_name || !newOfficial.position || !newOfficial.term_period) {
      showModalMsg("All fields required!", "error"); return;
    }
    setSubmitting(true);
    const fd = new FormData();
<<<<<<< HEAD
    fd.append("full_name", newOfficial.full_name);
    fd.append("position", newOfficial.position);
    fd.append("term_period", newOfficial.term_period);
    if (officialPhoto) fd.append("photo", officialPhoto);
    try {
      const res = await authFetch("http://localhost:5000/api/sb-officials/add", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Official added!");
        setNewOfficial({ full_name: "", position: "", term_period: "" });
=======
    fd.append("full_name", newOfficial.full_name); fd.append("position", newOfficial.position);
    fd.append("term_period", newOfficial.term_period);
    if (officialPhoto) fd.append("photo", officialPhoto);
    try {
      const res = await authFetch(`${API}/api/sb-officials/add`, { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Official added!"); setNewOfficial({ full_name: "", position: "", term_period: "" });
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
        setOfficialPhoto(null); setShowOfficialModal(false); fetchOfficials();
      } else showModalMsg(data.error || "Failed!", "error");
    } catch { showModalMsg("Server error!", "error"); }
    finally { setSubmitting(false); }
  };
<<<<<<< HEAD
  const handleDeleteOfficial = async (id) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/sb-officials/${id}`, { method: "DELETE" });
=======

  const handleDeleteOfficial = async (id) => {
    try {
      const res = await authFetch(`${API}/api/sb-officials/${id}`, { method: "DELETE" });
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      const data = await res.json();
      if (data.success) { showMsg("Official deleted!"); fetchOfficials(); }
      else showMsg(data.error || "Error!", "error");
    } catch { showMsg("Error!", "error"); }
  };
  const toggleOfficial = (id) =>
    setSelectedOfficials((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const getOfficialOrdinances = (id) =>
    ordinances.filter((o) => o.officials && o.officials.some((x) => x.id === id));

  // ─── Sessions ─────────────────────────────────────────────────────────────────
  const resetSessionForm = () => {
    setSessionForm({ session_number: "", session_date: "", session_type: "regular", venue: "", agenda: "", minutes_text: "" });
    setSessionFile(null); setSessionInputMode("text"); setSessionOcrTarget("minutes");
  };
<<<<<<< HEAD
=======

>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  const handleAddSession = async () => {
    if (!sessionForm.session_date) { showModalMsg("Session date is required!", "error"); return; }
    setSubmitting(true);
    try {
      if (sessionInputMode === "ocr") {
        if (!sessionFile) { showModalMsg("Please upload an image file!", "error"); setSubmitting(false); return; }
        const fd = new FormData();
        Object.entries(sessionForm).forEach(([k, v]) => fd.append(k, v));
<<<<<<< HEAD
        fd.append("file", sessionFile);
        fd.append("ocr_target", sessionOcrTarget);
        const res = await authFetch("http://localhost:5000/api/session-minutes/upload-image", { method: "POST", body: fd });
=======
        fd.append("file", sessionFile); fd.append("ocr_target", sessionOcrTarget);
        const res = await authFetch(`${API}/api/session-minutes/upload-image`, { method: "POST", body: fd });
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
        const data = await res.json();
        if (res.ok && data.success) {
          showMsg(`Session added! OCR extracted text from ${data.ocr_target}.`);
          resetSessionForm(); setShowSessionModal(false); fetchSessionMinutes();
        } else showModalMsg(data.error || "Upload failed!", "error");
      } else {
<<<<<<< HEAD
        const res = await authFetch("http://localhost:5000/api/session-minutes", {
          method: "POST", body: JSON.stringify(sessionForm),
        });
=======
        const res = await authFetch(`${API}/api/session-minutes`, { method: "POST", body: JSON.stringify(sessionForm) });
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
        const data = await res.json();
        if (res.ok && data.success) {
          showMsg("Session minutes saved!"); resetSessionForm(); setShowSessionModal(false); fetchSessionMinutes();
        } else showModalMsg(data.error || "Save failed!", "error");
      }
    } catch { showModalMsg("Server error!", "error"); }
    finally { setSubmitting(false); }
  };
<<<<<<< HEAD
=======

>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  const handleOpenEditSession = (s) => {
    setEditingSession(s);
    setEditSessionForm({
      session_number: s.session_number || "",
      session_date: s.session_date ? s.session_date.split("T")[0] : "",
      session_type: s.session_type || "regular",
<<<<<<< HEAD
      venue: s.venue || "",
      agenda: s.agenda || "",
      minutes_text: s.minutes_text || "",
    });
    setModalMessage(""); setShowEditSessionModal(true);
  };
=======
      venue: s.venue || "", agenda: s.agenda || "", minutes_text: s.minutes_text || "",
    });
    setModalMessage(""); setShowEditSessionModal(true);
  };

>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  const handleUpdateSession = async () => {
    if (!editSessionForm.session_date) { showModalMsg("Session date is required!", "error"); return; }
    setSubmitting(true);
    try {
<<<<<<< HEAD
      const res = await authFetch(`http://localhost:5000/api/session-minutes/${editingSession.id}`, {
        method: "PUT", body: JSON.stringify(editSessionForm),
      });
=======
      const res = await authFetch(`${API}/api/session-minutes/${editingSession.id}`, { method: "PUT", body: JSON.stringify(editSessionForm) });
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Session minutes updated!"); setShowEditSessionModal(false); setEditingSession(null); fetchSessionMinutes();
      } else showModalMsg(data.error || "Update failed!", "error");
    } catch { showModalMsg("Server error!", "error"); }
    finally { setSubmitting(false); }
  };
<<<<<<< HEAD
  const handleDeleteSession = async (id) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/session-minutes/${id}`, { method: "DELETE" });
=======

  const handleDeleteSession = async (id) => {
    try {
      const res = await authFetch(`${API}/api/session-minutes/${id}`, { method: "DELETE" });
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      const data = await res.json();
      if (data.success) { showMsg("Session deleted!"); fetchSessionMinutes(); }
      else showMsg(data.error || "Error!", "error");
    } catch { showMsg("Error!", "error"); }
  };

  // ─── Announcements ────────────────────────────────────────────────────────────
  const resetAnnouncementForm = () =>
    setAnnouncementForm({ title: "", body: "", priority: "normal", expires_at: "" });
<<<<<<< HEAD
=======

>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  const handleAddAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.body) {
      showModalMsg("Title and body are required!", "error"); return;
    }
    setSubmitting(true);
    try {
<<<<<<< HEAD
      const res = await authFetch("http://localhost:5000/api/announcements", {
        method: "POST", body: JSON.stringify(announcementForm),
      });
=======
      const res = await authFetch(`${API}/api/announcements`, { method: "POST", body: JSON.stringify(announcementForm) });
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Announcement posted!"); resetAnnouncementForm(); setShowAnnouncementModal(false); fetchAnnouncements();
      } else showModalMsg(data.error || "Failed!", "error");
    } catch { showModalMsg("Server error!", "error"); }
    finally { setSubmitting(false); }
  };
<<<<<<< HEAD
  const handleOpenEditAnnouncement = (a) => {
    setEditingAnnouncement(a);
    setEditAnnouncementForm({
      title: a.title || "", body: a.body || "",
      priority: a.priority || "normal",
=======

  const handleOpenEditAnnouncement = (a) => {
    setEditingAnnouncement(a);
    setEditAnnouncementForm({
      title: a.title || "", body: a.body || "", priority: a.priority || "normal",
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      expires_at: a.expires_at ? a.expires_at.split("T")[0] : "",
    });
    setModalMessage(""); setShowEditAnnouncementModal(true);
  };
<<<<<<< HEAD
=======

>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  const handleUpdateAnnouncement = async () => {
    if (!editAnnouncementForm.title || !editAnnouncementForm.body) {
      showModalMsg("Title and body are required!", "error"); return;
    }
    setSubmitting(true);
    try {
<<<<<<< HEAD
      const res = await authFetch(`http://localhost:5000/api/announcements/${editingAnnouncement.id}`, {
        method: "PUT", body: JSON.stringify(editAnnouncementForm),
      });
=======
      const res = await authFetch(`${API}/api/announcements/${editingAnnouncement.id}`, { method: "PUT", body: JSON.stringify(editAnnouncementForm) });
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Announcement updated!"); setShowEditAnnouncementModal(false); setEditingAnnouncement(null); fetchAnnouncements();
      } else showModalMsg(data.error || "Update failed!", "error");
    } catch { showModalMsg("Server error!", "error"); }
    finally { setSubmitting(false); }
  };
<<<<<<< HEAD
  const handleDeleteAnnouncement = async (id) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/announcements/${id}`, { method: "DELETE" });
=======

  const handleDeleteAnnouncement = async (id) => {
    try {
      const res = await authFetch(`${API}/api/announcements/${id}`, { method: "DELETE" });
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      const data = await res.json();
      if (data.success) { showMsg("Announcement deleted!"); fetchAnnouncements(); }
      else showMsg(data.error || "Error!", "error");
    } catch { showMsg("Error!", "error"); }
  };

  // ─── Computed / filtered lists ────────────────────────────────────────────────
  const totalUsers = users.filter((u) => u.role === "user").length;
  const totalAdmins = users.filter((u) => u.role === "admin").length;

  const filteredOrdinances = ordinances.filter((o) => {
    const s = (o.title || "").toLowerCase().includes(ordinanceSearch.toLowerCase()) ||
      (o.ordinance_number || "").toLowerCase().includes(ordinanceSearch.toLowerCase());
    const t = ordinanceTypeFilter === "all" ? true : ordinanceTypeFilter === "pdf"
      ? o.filetype === "application/pdf" : o.filetype?.startsWith("image");
    return s && t;
  });
  const filteredResolutions = resolutions.filter((r) => {
    const s = (r.title || "").toLowerCase().includes(resolutionSearch.toLowerCase()) ||
      (r.resolution_number || "").toLowerCase().includes(resolutionSearch.toLowerCase());
    const t = resolutionTypeFilter === "all" ? true : resolutionTypeFilter === "pdf"
      ? r.filetype === "application/pdf" : r.filetype?.startsWith("image");
    return s && t;
  });
  const uniquePositions = ["all", ...new Set(officials.map((o) => o.position).filter(Boolean))];
  const filteredOfficials = officials.filter((o) => {
    const s = o.full_name.toLowerCase().includes(officialSearch.toLowerCase()) ||
      o.position.toLowerCase().includes(officialSearch.toLowerCase());
    const p = officialPositionFilter === "all" ? true : o.position === officialPositionFilter;
    return s && p;
  });
  const minutesYears = ["all", ...new Set(
    sessionMinutes.map((s) => s.session_date ? new Date(s.session_date).getFullYear().toString() : null).filter(Boolean),
  )].sort((a, b) => b - a);
  const filteredMinutes = sessionMinutes.filter((s) => {
    const ms = (s.session_number || "").toLowerCase().includes(minutesSearch.toLowerCase()) ||
      (s.venue || "").toLowerCase().includes(minutesSearch.toLowerCase()) ||
      (s.agenda || "").toLowerCase().includes(minutesSearch.toLowerCase());
    const t = minutesTypeFilter === "all" ? true : s.session_type === minutesTypeFilter;
    const y = minutesYearFilter === "all" ? true :
      s.session_date && new Date(s.session_date).getFullYear().toString() === minutesYearFilter;
    return ms && t && y;
  });
  const filteredAnnouncements = announcements.filter((a) => {
    const s = (a.title || "").toLowerCase().includes(announcementSearch.toLowerCase()) ||
      (a.body || "").toLowerCase().includes(announcementSearch.toLowerCase());
    const p = announcementPriorityFilter === "all" ? true : a.priority === announcementPriorityFilter;
    return s && p;
  });

  const pageLoading = fetchingUsers || fetchingOrdinances || fetchingOfficials ||
    fetchingMinutes || fetchingResolutions || fetchingAnnouncements;

  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
<<<<<<< HEAD

=======
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  const priorityConfig = {
    urgent: { label: "Urgent", color: "#c53030", bg: "#fff5f5", border: "#feb2b2" },
    high:   { label: "High",   color: "#975a16", bg: "#fffbeb", border: "#f6e05e" },
    normal: { label: "Normal", color: "#276749", bg: "#f0fff4", border: "#9ae6b4" },
    low:    { label: "Low",    color: "#4a5568", bg: "#f7fafc", border: "#cbd5e0" },
  };
  const tabTitles = {
<<<<<<< HEAD
    users:         "Manage Users",
    admins:        "Manage Admins",
    calendar:      "Calendar & Schedule",
    announcements: "Announcements",
    sessions:      "Session Minutes & Agenda",
    ordinances:    "Ordinances",
    resolutions:   "Resolutions",
    officials:     "Sangguniang Bayan Officials",
  };

  // ─── Reusable sub-components ─────────────────────────────────────────────────
=======
    users: "Manage Users", admins: "Manage Admins", calendar: "Calendar & Schedule",
    announcements: "Announcements", sessions: "Session Minutes & Agenda",
    ordinances: "Ordinances", resolutions: "Resolutions",
    officials: "Sangguniang Bayan Officials",
    logs: "Activity Logs",
  };

  // ─── Reusable sub-components ──────────────────────────────────────────────────
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
  const OfficialsCheckList = ({ selected, onToggle }) => (
    <div className={styles.officialsCheckList}>
      {officials.length === 0 && <p className={styles.fileHint}>No officials yet.</p>}
      {officials.map((o) => (
        <label key={o.id} className={`${styles.checkItem} ${selected.includes(o.id) ? styles.checkItemSelected : ""}`}>
          <input type="checkbox" checked={selected.includes(o.id)} onChange={() => onToggle(o.id)} />
          {o.photo
<<<<<<< HEAD
            ? <img src={`http://localhost:5000/uploads/${o.photo}`} alt={o.full_name} className={styles.checkPhoto} />
=======
            ? <img src={o.photo} alt={o.full_name} className={styles.checkPhoto} />
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
            : <div className={styles.checkAvatar}>{o.full_name.charAt(0)}</div>}
          <div>
            <div style={{ fontWeight: "600", fontSize: "13px" }}>{o.full_name}</div>
            <div style={{ fontSize: "11px", color: "#718096" }}>{o.position}</div>
          </div>
        </label>
      ))}
    </div>
  );

<<<<<<< HEAD
  const ModalAlert = () =>
    modalMessage ? (
      <div style={{
        display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
        borderRadius: 8, marginBottom: 14, fontSize: 13,
        background: modalMessageType === "error" ? "#fff5f5" : "#f0fff4",
        border: `1px solid ${modalMessageType === "error" ? "#feb2b2" : "#9ae6b4"}`,
        color: modalMessageType === "error" ? "#c53030" : "#276749",
      }}>
        <AlertCircle size={14} />{modalMessage}
      </div>
    ) : null;


=======
  const ModalAlert = () => modalMessage ? (
    <div style={{
      display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
      borderRadius: 8, marginBottom: 14, fontSize: 13,
      background: modalMessageType === "error" ? "#fff5f5" : "#f0fff4",
      border: `1px solid ${modalMessageType === "error" ? "#feb2b2" : "#9ae6b4"}`,
      color: modalMessageType === "error" ? "#c53030" : "#276749",
    }}>
      <AlertCircle size={14} />{modalMessage}
    </div>
  ) : null;
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d

  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className={styles.container}>
<<<<<<< HEAD
      {/* Mobile backdrop */}
=======
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      <div className={`${styles.mobileBackdrop} ${mobileOpen ? styles.visible : ""}`} onClick={() => setMobileOpen(false)} />

      {/* Mobile topbar */}
      <div className={styles.mobileTopbar}>
        <button className={`${styles.hamburgerBtn} ${mobileOpen ? styles.open : ""}`}
          onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
        </button>
        <span className={styles.mobileTopTitle}>{tabTitles[activeTab]}</span>
        <div style={{ width: 34 }} />
      </div>

      {/* ── SIDEBAR ── */}
      <div className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ""} ${mobileOpen ? styles.mobileOpen : ""}`}>
        <button className={styles.sidebarToggle} onClick={() => setSidebarCollapsed((v) => !v)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
            style={{ transform: sidebarCollapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>
            <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className={styles.sidebarHeader}>
          <img src={logo} alt="Balilihan Seal" className={styles.logoCircle} />
          <div className={styles.logoTextWrap}>
            <div className={styles.logoText}>SANGGUNIANG BAYAN OFFICE</div>
            <div className={styles.logoSub}>Admin Portal</div>
          </div>
        </div>
        <nav className={styles.nav}>
          <div className={styles.navSection}>
<<<<<<< HEAD
            <button className={styles.navSectionHeader}
              onClick={() => !sidebarCollapsed && setUserMgmtOpen((v) => !v)}>
=======
            <button className={styles.navSectionHeader} onClick={() => !sidebarCollapsed && setUserMgmtOpen((v) => !v)}>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
              <span className={styles.navSectionIcon}><Users size={14} strokeWidth={1.8} /></span>
              <span className={styles.navSectionLabel}>User Management</span>
              {!sidebarCollapsed && (
                <span className={styles.navSectionChevron}>
                  {userMgmtOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </span>
              )}
            </button>
            <div className={`${styles.navSectionItems} ${userMgmtOpen && !sidebarCollapsed ? styles.navSectionItemsOpen : ""}`}>
              {[
                { key: "users",  icon: <Users size={17} strokeWidth={1.5} />,       label: "Manage Users" },
                { key: "admins", icon: <ShieldCheck size={17} strokeWidth={1.5} />, label: "Manage Admins" },
              ].map((t) => (
                <button key={t.key}
                  className={`${styles.navBtn} ${styles.navBtnIndented} ${activeTab === t.key ? styles.navBtnActive : ""}`}
                  onClick={() => handleTabChange(t.key)}>
                  <span className={styles.navIcon}>{t.icon}</span>
                  <span className={styles.navLabel}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className={styles.navDivider} />
          {[
<<<<<<< HEAD
            { key: "sessions",      icon: <BookOpen size={18} strokeWidth={1.5} />,  label: "Session Minutes" },
            { key: "calendar",      icon: <Calendar size={18} strokeWidth={1.5} />,  label: "Calendar" },
            { key: "announcements", icon: <Megaphone size={18} strokeWidth={1.5} />, label: "Announcements" },
            { key: "ordinances",    icon: <ScrollText size={18} strokeWidth={1.5} />,label: "Ordinances" },
            { key: "resolutions",   icon: <Gavel size={18} strokeWidth={1.5} />,     label: "Resolutions" },
            { key: "officials",     icon: <Landmark size={18} strokeWidth={1.5} />,  label: "SB Officials" },
=======
            { key: "sessions",      icon: <BookOpen size={18} strokeWidth={1.5} />,   label: "Session Minutes" },
            { key: "calendar",      icon: <Calendar size={18} strokeWidth={1.5} />,   label: "Calendar" },
            { key: "announcements", icon: <Megaphone size={18} strokeWidth={1.5} />,  label: "Announcements" },
            { key: "ordinances",    icon: <ScrollText size={18} strokeWidth={1.5} />, label: "Ordinances" },
            { key: "resolutions",   icon: <Gavel size={18} strokeWidth={1.5} />,      label: "Resolutions" },
            { key: "officials",     icon: <Landmark size={18} strokeWidth={1.5} />,   label: "SB Officials" },
            // ── Activity Logs below SB Officials ──
            { key: "logs",          icon: <Activity size={18} strokeWidth={1.5} />,   label: "Activity Logs" },
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
          ].map((t) => (
            <button key={t.key}
              className={`${styles.navBtn} ${activeTab === t.key ? styles.navBtnActive : ""}`}
              onClick={() => handleTabChange(t.key)}>
              <span className={styles.navIcon}>{t.icon}</span>
              <span className={styles.navLabel}>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.adminInfo}>
            <div className={styles.adminAvatar}>{admin?.name?.charAt(0)}</div>
            <div className={styles.adminTextWrap}>
              <div className={styles.adminName}>{admin?.name}</div>
              <div className={styles.adminRole}>Administrator</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={14} strokeWidth={1.5} />
            <span className={styles.logoutLabel}>Log out</span>
          </button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>{tabTitles[activeTab]}</h1>
            <p className={styles.headerSub}>LGU Administration Dashboard</p>
          </div>
          <div className={styles.headerActions}>
<<<<<<< HEAD
            {activeTab === "users" && (
              <button className={styles.addBtn} onClick={() => { setModalMessage(""); setShowAddUserModal(true); }}>+ Add User</button>
            )}
            {activeTab === "admins" && (
              <button className={styles.addBtn} onClick={() => { setModalMessage(""); setShowAddAdminModal(true); }}>+ Add Admin</button>
            )}
            {activeTab === "ordinances" && (
              <button className={styles.addBtn} onClick={() => { setModalMessage(""); setShowOrdinanceModal(true); }}>+ Upload Ordinance</button>
            )}
            {activeTab === "resolutions" && (
              <button className={styles.addBtn} onClick={() => {
                setModalMessage(""); setResolutionNumber(""); setResolutionTitle("");
                setResolutionYear(""); setResolutionFile(null);
                setSelectedResolutionOfficials([]); setResolutionUploadType("");
                setShowResolutionModal(true);
              }}>+ Upload Resolution</button>
            )}
            {activeTab === "officials" && (
              <button className={styles.addBtn} onClick={() => { setModalMessage(""); setShowOfficialModal(true); }}>+ Add Official</button>
            )}
            {activeTab === "sessions" && (
              <button className={styles.addBtn} onClick={() => { setModalMessage(""); resetSessionForm(); setShowSessionModal(true); }}>+ Add Session</button>
            )}
            {activeTab === "announcements" && (
              <button className={styles.addBtn} onClick={() => { setModalMessage(""); resetAnnouncementForm(); setShowAnnouncementModal(true); }}>+ New Announcement</button>
=======
            {activeTab === "users"         && <button className={styles.addBtn} onClick={() => { setModalMessage(""); setShowAddUserModal(true); }}>+ Add User</button>}
            {activeTab === "admins"        && <button className={styles.addBtn} onClick={() => { setModalMessage(""); setShowAddAdminModal(true); }}>+ Add Admin</button>}
            {activeTab === "ordinances"    && <button className={styles.addBtn} onClick={() => { setModalMessage(""); setShowOrdinanceModal(true); }}>+ Upload Ordinance</button>}
            {activeTab === "resolutions"   && <button className={styles.addBtn} onClick={() => { setModalMessage(""); setResolutionNumber(""); setResolutionTitle(""); setResolutionYear(""); setResolutionFile(null); setSelectedResolutionOfficials([]); setResolutionUploadType(""); setShowResolutionModal(true); }}>+ Upload Resolution</button>}
            {activeTab === "officials"     && <button className={styles.addBtn} onClick={() => { setModalMessage(""); setShowOfficialModal(true); }}>+ Add Official</button>}
            {activeTab === "sessions"      && <button className={styles.addBtn} onClick={() => { setModalMessage(""); resetSessionForm(); setShowSessionModal(true); }}>+ Add Session</button>}
            {activeTab === "announcements" && <button className={styles.addBtn} onClick={() => { setModalMessage(""); resetAnnouncementForm(); setShowAnnouncementModal(true); }}>+ New Announcement</button>}
            {activeTab === "logs"          && (
              <button className={styles.addBtn} onClick={() => { fetchLogs(); fetchLogStats(); }}
                style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <RefreshCw size={14} /> Refresh
              </button>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
            )}
          </div>
        </div>

        {message && (
          <div className={`${styles.message} ${messageType === "error" ? styles.messageError : ""}`}>
            <AlertCircle size={14} /> {message}
            <button className={styles.closeMsg} onClick={() => setMessage("")}><X size={13} /></button>
          </div>
        )}
        {pageLoading && <div className={styles.loadingBar}>Loading data...</div>}

        {/* ── USERS ── */}
        {activeTab === "users" && !fetchingUsers && (
          <>
            <div className={styles.statsRow}>
<<<<<<< HEAD
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{users.length}</div>
                <div className={styles.statLabel}>Total Accounts</div>
              </div>
              <div className={`${styles.statCard} ${styles.statCardGreen}`}>
                <div className={styles.statNumber}>{totalUsers}</div>
                <div className={styles.statLabel}>Total Users</div>
              </div>
              <div className={`${styles.statCard} ${styles.statCardOrange}`}>
                <div className={styles.statNumber}>{totalAdmins}</div>
                <div className={styles.statLabel}>Total Admins</div>
              </div>
            </div>
            <div className={styles.tableCard}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>ID</th>
                    <th className={styles.th}>Name</th>
                    <th className={styles.th}>Username</th>
                    <th className={styles.th}>Email</th>
                    <th className={styles.th}>Role</th>
                    <th className={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter((u) => u.role === "user").map((u, i) => (
                    <tr key={u.id} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td className={styles.td}>{u.id}</td>
                      <td className={styles.td}>{u.name}</td>
                      <td className={styles.td}>{u.username}</td>
                      <td className={styles.td}>{u.email}</td>
=======
              <div className={styles.statCard}><div className={styles.statNumber}>{users.length}</div><div className={styles.statLabel}>Total Accounts</div></div>
              <div className={`${styles.statCard} ${styles.statCardGreen}`}><div className={styles.statNumber}>{totalUsers}</div><div className={styles.statLabel}>Total Users</div></div>
              <div className={`${styles.statCard} ${styles.statCardOrange}`}><div className={styles.statNumber}>{totalAdmins}</div><div className={styles.statLabel}>Total Admins</div></div>
            </div>
            <div className={styles.tableCard}>
              <table className={styles.table}>
                <thead><tr>
                  <th className={styles.th}>ID</th><th className={styles.th}>Name</th>
                  <th className={styles.th}>Username</th><th className={styles.th}>Email</th>
                  <th className={styles.th}>Role</th><th className={styles.th}>Action</th>
                </tr></thead>
                <tbody>
                  {users.filter((u) => u.role === "user").map((u, i) => (
                    <tr key={u.id} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td className={styles.td}>{u.id}</td><td className={styles.td}>{u.name}</td>
                      <td className={styles.td}>{u.username}</td><td className={styles.td}>{u.email}</td>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                      <td className={styles.td}><span className={`${styles.badge} ${styles.badgeUser}`}>user</span></td>
                      <td className={styles.td}>
                        <button className={styles.deleteBtn} onClick={() => setDeleteTarget({ id: u.id, type: "user", name: u.name })}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.filter((u) => u.role === "user").length === 0 && <div className={styles.empty}>No users found.</div>}
            </div>
          </>
        )}

        {/* ── ADMINS ── */}
        {activeTab === "admins" && !fetchingUsers && (
          <>
            <div className={styles.statsRow}>
<<<<<<< HEAD
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{totalAdmins}</div>
                <div className={styles.statLabel}>Total Admins</div>
              </div>
            </div>
            <div className={styles.tableCard}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>ID</th>
                    <th className={styles.th}>Name</th>
                    <th className={styles.th}>Username</th>
                    <th className={styles.th}>Email</th>
                    <th className={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter((u) => u.role === "admin").map((u, i) => (
                    <tr key={u.id} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td className={styles.td}>{u.id}</td>
                      <td className={styles.td}>{u.name}</td>
                      <td className={styles.td}>{u.username}</td>
                      <td className={styles.td}>{u.email}</td>
=======
              <div className={styles.statCard}><div className={styles.statNumber}>{totalAdmins}</div><div className={styles.statLabel}>Total Admins</div></div>
            </div>
            <div className={styles.tableCard}>
              <table className={styles.table}>
                <thead><tr>
                  <th className={styles.th}>ID</th><th className={styles.th}>Name</th>
                  <th className={styles.th}>Username</th><th className={styles.th}>Email</th>
                  <th className={styles.th}>Action</th>
                </tr></thead>
                <tbody>
                  {users.filter((u) => u.role === "admin").map((u, i) => (
                    <tr key={u.id} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td className={styles.td}>{u.id}</td><td className={styles.td}>{u.name}</td>
                      <td className={styles.td}>{u.username}</td><td className={styles.td}>{u.email}</td>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                      <td className={styles.td}>
                        <button className={styles.deleteBtn} onClick={() => setDeleteTarget({ id: u.id, type: "user", name: u.name })}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.filter((u) => u.role === "admin").length === 0 && <div className={styles.empty}>No admins found.</div>}
            </div>
          </>
        )}

        {/* ── CALENDAR ── */}
        {activeTab === "calendar" && (() => {
          const year = calendarViewDate.getFullYear(), month = calendarViewDate.getMonth();
          const firstDay = new Date(year, month, 1).getDay(), daysInMonth = new Date(year, month + 1, 0).getDate();
          const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
          const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
          const today = new Date();
          const cells = [];
          for (let i = 0; i < firstDay; i++) cells.push(null);
          for (let d = 1; d <= daysInMonth; d++) cells.push(d);
          const upcoming = getUpcomingEvents();
<<<<<<< HEAD

          return (
            <div className={styles.calendarWrapper}>
              {/* Top bar */}
              <div className={styles.calendarTopBar}>
                <div className={styles.calendarNav}>
                  <button className={styles.calNavBtn} onClick={() => setCalendarViewDate(new Date(year, month - 1, 1))}>
                    <ChevronLeft size={16} />
                  </button>
                  <span className={styles.calMonthLabel}>{MONTH_NAMES[month]} {year}</span>
                  <button className={styles.calNavBtn} onClick={() => setCalendarViewDate(new Date(year, month + 1, 1))}>
                    <ChevronRight size={16} />
                  </button>
                  <button className={styles.calTodayBtn} onClick={() => { setCalendarViewDate(new Date()); setSelectedCalDay(null); }}>
                    Today
                  </button>
=======
          return (
            <div className={styles.calendarWrapper}>
              <div className={styles.calendarTopBar}>
                <div className={styles.calendarNav}>
                  <button className={styles.calNavBtn} onClick={() => setCalendarViewDate(new Date(year, month - 1, 1))}><ChevronLeft size={16} /></button>
                  <span className={styles.calMonthLabel}>{MONTH_NAMES[month]} {year}</span>
                  <button className={styles.calNavBtn} onClick={() => setCalendarViewDate(new Date(year, month + 1, 1))}><ChevronRight size={16} /></button>
                  <button className={styles.calTodayBtn} onClick={() => { setCalendarViewDate(new Date()); setSelectedCalDay(null); }}>Today</button>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                </div>
                <div className={styles.calendarTopActions}>
                  <button onClick={() => setShowHolidays((v) => !v)} style={{
                    display: "flex", alignItems: "center", gap: 5, padding: "6px 11px",
                    borderRadius: 8, border: "1px solid", fontSize: 12, fontWeight: 500, cursor: "pointer",
                    background: showHolidays ? "#fee2e2" : "#f1f5f9",
                    borderColor: showHolidays ? "#fca5a5" : "#cbd5e0",
                    color: showHolidays ? "#991b1b" : "#64748b",
<<<<<<< HEAD
                  }}>
                    {showHolidays ? "Hide" : "Show"} Holidays
                  </button>
                  <button className={styles.calAddBtn} onClick={() => {
                    setLocalEventForm({
                      ...emptyEventForm,
                      start_date: selectedCalDay ? toIsoDate(selectedCalDay) : "",
                      end_date: selectedCalDay ? toIsoDate(selectedCalDay) : "",
                    });
                    setModalMessage(""); setShowLocalEventModal(true);
                  }}>
                    <PlusCircle size={14} /> Add Event
                  </button>
                </div>
              </div>

              {/* Holiday legend */}
=======
                  }}>{showHolidays ? "Hide" : "Show"} Holidays</button>
                  <button className={styles.calAddBtn} onClick={() => {
                    setLocalEventForm({ ...emptyEventForm, start_date: selectedCalDay ? toIsoDate(selectedCalDay) : "", end_date: selectedCalDay ? toIsoDate(selectedCalDay) : "" });
                    setModalMessage(""); setShowLocalEventModal(true);
                  }}><PlusCircle size={14} /> Add Event</button>
                </div>
              </div>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
              {showHolidays && (
                <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10, fontSize: 11, alignItems: "center", padding: "6px 0" }}>
                  <span style={{ fontWeight: 600, color: "#64748b" }}>Holidays:</span>
                  {[
                    { label: "National Regular",    bg: "#fee2e2", color: "#991b1b" },
                    { label: "Special Non-Working", bg: "#fef9c3", color: "#854d0e" },
                    { label: "Special Working",     bg: "#dcfce7", color: "#166534" },
                    { label: "Local / Fiesta",      bg: "#fce7f3", color: "#9d174d" },
                  ].map((l) => (
                    <span key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: l.bg, border: `1px solid ${l.color}`, display: "inline-block" }} />
                      <span style={{ color: l.color }}>{l.label}</span>
                    </span>
                  ))}
                  {fetchingHolidays && <span style={{ color: "#94a3b8", fontSize: 11 }}>Loading holidays...</span>}
                </div>
              )}
<<<<<<< HEAD

              {/* Grid */}
              <div className={styles.calCard}>
                <div className={styles.calDayHeaders}>
                  {DAY_NAMES.map((d) => <div key={d} className={styles.calDayHeader}>{d}</div>)}
                </div>
=======
              <div className={styles.calCard}>
                <div className={styles.calDayHeaders}>{DAY_NAMES.map((d) => <div key={d} className={styles.calDayHeader}>{d}</div>)}</div>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                <div className={styles.calCells}>
                  {cells.map((day, idx) => {
                    if (day === null || day === undefined || isNaN(Number(day))) return <div key={`e-${idx}`} className={styles.calCellEmpty} />;
                    const d = Number(day);
                    const cellDate = new Date(year, month, d);
                    const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
                    const isSelected = selectedCalDay?.getDate() === d && selectedCalDay?.getMonth() === month && selectedCalDay?.getFullYear() === year;
                    const evs = getEventsForDay(cellDate);
                    const hasHoliday = evs.some((e) => e.isHoliday);
                    return (
                      <div key={`day-${idx}`}
                        className={`${styles.calCell} ${isToday ? styles.calCellToday : ""} ${isSelected ? styles.calCellSelected : ""}`}
                        style={hasHoliday && !isToday && !isSelected ? { background: "#fffbf0" } : {}}
                        onClick={() => setSelectedCalDay(isSelected ? null : cellDate)}>
                        <span className={styles.calDayNum}>{d}</span>
                        {evs.slice(0, 3).map((ev) => {
                          const c = chipStyle(ev);
                          return (
                            <button key={ev.id} className={styles.calEventChip}
                              style={{ background: c.bg, color: c.color, fontSize: 10 }}
                              onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); setShowEventDetailModal(true); }}>
                              {ev.isHoliday ? "🇵🇭 " : ""}{ev.summary}
                            </button>
                          );
                        })}
                        {evs.length > 3 && <span className={styles.calEventChipMore}>+{String(evs.length - 3)} more</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
<<<<<<< HEAD

              {/* Events panel */}
              <div className={styles.calEventsPanel}>
                <div className={styles.calEventsPanelHeader}>
                  <span className={styles.calEventsPanelTitle}>
                    {selectedCalDay
                      ? `Events — ${selectedCalDay.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}`
                      : "Upcoming Events"}
=======
              <div className={styles.calEventsPanel}>
                <div className={styles.calEventsPanelHeader}>
                  <span className={styles.calEventsPanelTitle}>
                    {selectedCalDay ? `Events — ${selectedCalDay.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}` : "Upcoming Events"}
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                  </span>
                  <span className={styles.calEventsPanelCount}>
                    {String((selectedCalDay ? getEventsForDay(selectedCalDay) : upcoming).length)} event
                    {(selectedCalDay ? getEventsForDay(selectedCalDay) : upcoming).length !== 1 ? "s" : ""}
                  </span>
                </div>
                <table className={styles.calEventsTable}>
<<<<<<< HEAD
                  <thead className={styles.calEventsTableHead}>
                    <tr>
                      <th>Event</th><th>Date</th><th>Time</th><th>Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const list = selectedCalDay ? getEventsForDay(selectedCalDay) : upcoming;
                      if (list.length === 0)
                        return (
                          <tr>
                            <td colSpan={4} className={styles.calEvTableEmpty}>
                              {selectedCalDay ? "No events on this day." : "No upcoming events."}
                            </td>
                          </tr>
                        );
                      return list.map((ev) => {
                        const c = chipStyle(ev);
                        const evDate = ev.start?.date
                          ? new Date(ev.start.date + "T00:00:00")
                          : new Date(ev.start?.dateTime);
                        const hasTime = !ev.isHoliday && !ev.all_day && !!ev.start?.dateTime;
                        return (
                          <tr key={ev.id} className={styles.calEventsTableRow}
                            onClick={() => { setSelectedEvent(ev); setShowEventDetailModal(true); }}>
=======
                  <thead className={styles.calEventsTableHead}><tr><th>Event</th><th>Date</th><th>Time</th><th>Location</th></tr></thead>
                  <tbody>
                    {(() => {
                      const list = selectedCalDay ? getEventsForDay(selectedCalDay) : upcoming;
                      if (list.length === 0) return <tr><td colSpan={4} className={styles.calEvTableEmpty}>{selectedCalDay ? "No events on this day." : "No upcoming events."}</td></tr>;
                      return list.map((ev) => {
                        const c = chipStyle(ev);
                        const evDate = ev.start?.date ? new Date(ev.start.date + "T00:00:00") : new Date(ev.start?.dateTime);
                        const hasTime = !ev.isHoliday && !ev.all_day && !!ev.start?.dateTime;
                        return (
                          <tr key={ev.id} className={styles.calEventsTableRow} onClick={() => { setSelectedEvent(ev); setShowEventDetailModal(true); }}>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                            <td>
                              <span className={styles.calEvTableChip}>
                                <span className={styles.calEvTableDot} style={{ background: c.dot }} />
                                {ev.isHoliday ? "🇵🇭 " : ""}{ev.summary}
                                {ev.isHoliday && (
                                  <span style={{ marginLeft: 4, fontSize: 10, padding: "1px 5px", borderRadius: 4, background: c.bg, color: c.color, border: `1px solid ${c.dot}` }}>
<<<<<<< HEAD
                                    {ev.holidayType === "national" ? "National" :
                                      ev.holidayType === "special-working" ? "Special Working" :
                                      ev.holidayType === "local-fiesta" ? "Local Fiesta" : "Special"}
=======
                                    {ev.holidayType === "national" ? "National" : ev.holidayType === "special-working" ? "Special Working" : ev.holidayType === "local-fiesta" ? "Local Fiesta" : "Special"}
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                                  </span>
                                )}
                              </span>
                            </td>
<<<<<<< HEAD
                            <td className={styles.calEvTableDate}>
                              {evDate.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                            </td>
                            <td className={styles.calEvTableTime}>
                              {hasTime
                                ? `${new Date(ev.start.dateTime).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })} – ${new Date(ev.end.dateTime).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}`
                                : "All day"}
                            </td>
                            <td className={styles.calEvTableLocation}>
                              {ev.location || <span style={{ color: "#cbd5e0" }}>—</span>}
                            </td>
=======
                            <td className={styles.calEvTableDate}>{evDate.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}</td>
                            <td className={styles.calEvTableTime}>{hasTime ? `${new Date(ev.start.dateTime).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })} – ${new Date(ev.end.dateTime).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}` : "All day"}</td>
                            <td className={styles.calEvTableLocation}>{ev.location || <span style={{ color: "#cbd5e0" }}>—</span>}</td>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* ── ORDINANCES ── */}
        {activeTab === "ordinances" && !fetchingOrdinances && (
          <>
            <div className={styles.statsRow}>
<<<<<<< HEAD
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{ordinances.length}</div>
                <div className={styles.statLabel}>Total Ordinances</div>
              </div>
              <div className={`${styles.statCard} ${styles.statCardGreen}`}>
                <div className={styles.statNumber}>{ordinances.filter((o) => o.filetype === "application/pdf").length}</div>
                <div className={styles.statLabel}>PDF Files</div>
              </div>
              <div className={`${styles.statCard} ${styles.statCardOrange}`}>
                <div className={styles.statNumber}>{ordinances.filter((o) => o.filetype?.startsWith("image")).length}</div>
                <div className={styles.statLabel}>Image / OCR</div>
              </div>
=======
              <div className={styles.statCard}><div className={styles.statNumber}>{ordinances.length}</div><div className={styles.statLabel}>Total Ordinances</div></div>
              <div className={`${styles.statCard} ${styles.statCardGreen}`}><div className={styles.statNumber}>{ordinances.filter((o) => o.filetype === "application/pdf").length}</div><div className={styles.statLabel}>PDF Files</div></div>
              <div className={`${styles.statCard} ${styles.statCardOrange}`}><div className={styles.statNumber}>{ordinances.filter((o) => o.filetype?.startsWith("image")).length}</div><div className={styles.statLabel}>Image / OCR</div></div>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
            </div>
            <div className={styles.searchFilterBar}>
              <div className={styles.searchInputWrapper}>
                <Search size={16} className={styles.searchIcon} />
<<<<<<< HEAD
                <input className={styles.searchInput} placeholder="Search by title or number..."
                  value={ordinanceSearch} onChange={(e) => setOrdinanceSearch(e.target.value)} />
=======
                <input className={styles.searchInput} placeholder="Search by title or number..." value={ordinanceSearch} onChange={(e) => setOrdinanceSearch(e.target.value)} />
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                {ordinanceSearch && <button className={styles.clearSearch} onClick={() => setOrdinanceSearch("")}><X size={14} /></button>}
              </div>
              <div className={styles.filterGroup}>
                <Filter size={15} className={styles.filterIcon} />
                {["all", "pdf", "image"].map((t) => (
<<<<<<< HEAD
                  <button key={t} className={`${styles.filterBtn} ${ordinanceTypeFilter === t ? styles.filterBtnActive : ""}`}
                    onClick={() => setOrdinanceTypeFilter(t)}>
=======
                  <button key={t} className={`${styles.filterBtn} ${ordinanceTypeFilter === t ? styles.filterBtnActive : ""}`} onClick={() => setOrdinanceTypeFilter(t)}>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                    {t === "all" ? "All" : t === "pdf" ? "PDF" : "Image / OCR"}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.searchResultCount}>Showing {filteredOrdinances.length} of {ordinances.length} ordinances</div>
            <div className={styles.ordinanceList}>
              {filteredOrdinances.map((o) => (
                <div key={o.id} className={styles.ordinanceCard}>
                  <div className={styles.ordinancePreview}>
                    {o.filetype === "application/pdf"
                      ? <div className={styles.pdfIcon}><FileText size={28} strokeWidth={1.2} /></div>
<<<<<<< HEAD
                      : <img src={`http://localhost:5000/uploads/${o.filename}`} alt={o.title} className={styles.ordinanceThumb} />}
=======
                      : <img src={o.filepath} alt={o.title} className={styles.ordinanceThumb} />}
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                  </div>
                  <div className={styles.ordinanceInfo}>
                    <div className={styles.ordinanceNumber}>{o.ordinance_number || "—"}</div>
                    <div className={styles.ordinanceTitle}>{o.title}</div>
                    {o.year && <div className={styles.ordinanceYear}><CalendarDays size={13} strokeWidth={1.5} /> {o.year}</div>}
                    <div className={styles.ordinanceFileType}>
<<<<<<< HEAD
                      {o.filetype === "application/pdf"
                        ? <><FileText size={12} strokeWidth={1.5} /> PDF</>
                        : <><Image size={12} strokeWidth={1.5} /> Image to Text</>}
=======
                      {o.filetype === "application/pdf" ? <><FileText size={12} strokeWidth={1.5} /> PDF</> : <><Image size={12} strokeWidth={1.5} /> Image to Text</>}
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                    </div>
                    <div className={styles.ordinanceOfficialsList}>
                      <span className={styles.officialsPassedLabel}>Officials who passed:</span>
                      <div className={styles.officialAvatarRow}>
<<<<<<< HEAD
                        {o.officials && o.officials.length > 0 ? (
                          o.officials.map((off) => (
                            <div key={off.id} className={styles.officialChip}>
                              {off.photo
                                ? <img src={`http://localhost:5000/uploads/${off.photo}`} alt={off.full_name} className={styles.chipPhoto} />
                                : <div className={styles.chipAvatar}>{off.full_name.charAt(0)}</div>}
                              <span className={styles.chipName}>{off.full_name}</span>
                            </div>
                          ))
                        ) : <span className={styles.noOfficials}>No officials tagged</span>}
=======
                        {o.officials && o.officials.length > 0 ? o.officials.map((off) => (
                          <div key={off.id} className={styles.officialChip}>
                            {off.photo ? <img src={off.photo} alt={off.full_name} className={styles.chipPhoto} /> : <div className={styles.chipAvatar}>{off.full_name.charAt(0)}</div>}
                            <span className={styles.chipName}>{off.full_name}</span>
                          </div>
                        )) : <span className={styles.noOfficials}>No officials tagged</span>}
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                      </div>
                    </div>
                  </div>
                  <div className={styles.ordinanceActions}>
<<<<<<< HEAD
                    <a href={o.extracted_text ? `http://localhost:5000/api/ordinances/${o.id}/print` : `http://localhost:5000/uploads/${o.filename}`}
                      target="_blank" rel="noreferrer" className={styles.viewBtn}>
                      <Eye size={13} /> View
                    </a>
                    <button className={styles.editBtn} onClick={() => handleOpenEditOrdinance(o)}><Pencil size={13} /> Edit</button>
                    <button className={styles.deleteBtn} onClick={() => setDeleteTarget({ id: o.id, type: "ordinance", name: o.title })}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              ))}
              {filteredOrdinances.length === 0 && (
                <div className={styles.empty}>
                  {ordinanceSearch || ordinanceTypeFilter !== "all" ? "No ordinances match your search." : "No ordinances uploaded yet."}
                </div>
              )}
=======
                    <a href={o.extracted_text ? `${API}/api/ordinances/${o.id}/print` : o.filepath} target="_blank" rel="noreferrer" className={styles.viewBtn}><Eye size={13} /> View</a>
                    <button className={styles.editBtn} onClick={() => handleOpenEditOrdinance(o)}><Pencil size={13} /> Edit</button>
                    <button className={styles.deleteBtn} onClick={() => setDeleteTarget({ id: o.id, type: "ordinance", name: o.title })}><Trash2 size={13} /> Delete</button>
                  </div>
                </div>
              ))}
              {filteredOrdinances.length === 0 && <div className={styles.empty}>{ordinanceSearch || ordinanceTypeFilter !== "all" ? "No ordinances match your search." : "No ordinances uploaded yet."}</div>}
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
            </div>
          </>
        )}

        {/* ── RESOLUTIONS ── */}
        {activeTab === "resolutions" && !fetchingResolutions && (
          <>
            <div className={styles.statsRow}>
<<<<<<< HEAD
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{resolutions.length}</div>
                <div className={styles.statLabel}>Total Resolutions</div>
              </div>
              <div className={`${styles.statCard} ${styles.statCardGreen}`}>
                <div className={styles.statNumber}>{resolutions.filter((r) => r.filetype === "application/pdf").length}</div>
                <div className={styles.statLabel}>PDF Files</div>
              </div>
              <div className={`${styles.statCard} ${styles.statCardOrange}`}>
                <div className={styles.statNumber}>{resolutions.filter((r) => r.filetype?.startsWith("image")).length}</div>
                <div className={styles.statLabel}>Image / OCR</div>
              </div>
=======
              <div className={styles.statCard}><div className={styles.statNumber}>{resolutions.length}</div><div className={styles.statLabel}>Total Resolutions</div></div>
              <div className={`${styles.statCard} ${styles.statCardGreen}`}><div className={styles.statNumber}>{resolutions.filter((r) => r.filetype === "application/pdf").length}</div><div className={styles.statLabel}>PDF Files</div></div>
              <div className={`${styles.statCard} ${styles.statCardOrange}`}><div className={styles.statNumber}>{resolutions.filter((r) => r.filetype?.startsWith("image")).length}</div><div className={styles.statLabel}>Image / OCR</div></div>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
            </div>
            <div className={styles.searchFilterBar}>
              <div className={styles.searchInputWrapper}>
                <Search size={16} className={styles.searchIcon} />
<<<<<<< HEAD
                <input className={styles.searchInput} placeholder="Search by title or resolution number..."
                  value={resolutionSearch} onChange={(e) => setResolutionSearch(e.target.value)} />
=======
                <input className={styles.searchInput} placeholder="Search by title or resolution number..." value={resolutionSearch} onChange={(e) => setResolutionSearch(e.target.value)} />
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                {resolutionSearch && <button className={styles.clearSearch} onClick={() => setResolutionSearch("")}><X size={14} /></button>}
              </div>
              <div className={styles.filterGroup}>
                <Filter size={15} className={styles.filterIcon} />
                {["all", "pdf", "image"].map((t) => (
<<<<<<< HEAD
                  <button key={t} className={`${styles.filterBtn} ${resolutionTypeFilter === t ? styles.filterBtnActive : ""}`}
                    onClick={() => setResolutionTypeFilter(t)}>
=======
                  <button key={t} className={`${styles.filterBtn} ${resolutionTypeFilter === t ? styles.filterBtnActive : ""}`} onClick={() => setResolutionTypeFilter(t)}>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                    {t === "all" ? "All" : t === "pdf" ? "PDF" : "Image / OCR"}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.searchResultCount}>Showing {filteredResolutions.length} of {resolutions.length} resolutions</div>
            <div className={styles.ordinanceList}>
              {filteredResolutions.map((r) => (
                <div key={r.id} className={styles.ordinanceCard}>
                  <div className={styles.ordinancePreview}>
                    {r.filetype === "application/pdf"
                      ? <div className={styles.pdfIcon}><FileText size={28} strokeWidth={1.2} /></div>
<<<<<<< HEAD
                      : <img src={`http://localhost:5000/uploads/${r.filename}`} alt={r.title} className={styles.ordinanceThumb} />}
=======
                      : <img src={r.filepath} alt={r.title} className={styles.ordinanceThumb} />}
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                  </div>
                  <div className={styles.ordinanceInfo}>
                    <div className={styles.ordinanceNumber}>{r.resolution_number || "—"}</div>
                    <div className={styles.ordinanceTitle}>{r.title}</div>
                    {r.year && <div className={styles.ordinanceYear}><CalendarDays size={13} strokeWidth={1.5} /> {r.year}</div>}
                    <div className={styles.ordinanceFileType}>
<<<<<<< HEAD
                      {r.filetype === "application/pdf"
                        ? <><FileText size={12} strokeWidth={1.5} /> PDF</>
                        : <><Image size={12} strokeWidth={1.5} /> Image to Text</>}
=======
                      {r.filetype === "application/pdf" ? <><FileText size={12} strokeWidth={1.5} /> PDF</> : <><Image size={12} strokeWidth={1.5} /> Image to Text</>}
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                    </div>
                    <div className={styles.ordinanceOfficialsList}>
                      <span className={styles.officialsPassedLabel}>Officials who passed:</span>
                      <div className={styles.officialAvatarRow}>
<<<<<<< HEAD
                        {r.officials && r.officials.length > 0 ? (
                          r.officials.map((off) => (
                            <div key={off.id} className={styles.officialChip}>
                              {off.photo
                                ? <img src={`http://localhost:5000/uploads/${off.photo}`} alt={off.full_name} className={styles.chipPhoto} />
                                : <div className={styles.chipAvatar}>{off.full_name.charAt(0)}</div>}
                              <span className={styles.chipName}>{off.full_name}</span>
                            </div>
                          ))
                        ) : <span className={styles.noOfficials}>No officials tagged</span>}
=======
                        {r.officials && r.officials.length > 0 ? r.officials.map((off) => (
                          <div key={off.id} className={styles.officialChip}>
                            {off.photo ? <img src={off.photo} alt={off.full_name} className={styles.chipPhoto} /> : <div className={styles.chipAvatar}>{off.full_name.charAt(0)}</div>}
                            <span className={styles.chipName}>{off.full_name}</span>
                          </div>
                        )) : <span className={styles.noOfficials}>No officials tagged</span>}
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                      </div>
                    </div>
                  </div>
                  <div className={styles.ordinanceActions}>
<<<<<<< HEAD
                    <a href={r.extracted_text ? `http://localhost:5000/api/resolutions/${r.id}/print` : `http://localhost:5000/uploads/${r.filename}`}
                      target="_blank" rel="noreferrer" className={styles.viewBtn}>
                      <Eye size={13} /> View
                    </a>
                    <button className={styles.editBtn} onClick={() => handleOpenEditResolution(r)}><Pencil size={13} /> Edit</button>
                    <button className={styles.deleteBtn} onClick={() => setDeleteTarget({ id: r.id, type: "resolution", name: r.title })}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              ))}
              {filteredResolutions.length === 0 && (
                <div className={styles.empty}>
                  {resolutionSearch || resolutionTypeFilter !== "all" ? "No resolutions match your search." : "No resolutions uploaded yet."}
                </div>
              )}
=======
                    <a href={r.extracted_text ? `${API}/api/resolutions/${r.id}/print` : r.filepath} target="_blank" rel="noreferrer" className={styles.viewBtn}><Eye size={13} /> View</a>
                    <button className={styles.editBtn} onClick={() => handleOpenEditResolution(r)}><Pencil size={13} /> Edit</button>
                    <button className={styles.deleteBtn} onClick={() => setDeleteTarget({ id: r.id, type: "resolution", name: r.title })}><Trash2 size={13} /> Delete</button>
                  </div>
                </div>
              ))}
              {filteredResolutions.length === 0 && <div className={styles.empty}>{resolutionSearch || resolutionTypeFilter !== "all" ? "No resolutions match your search." : "No resolutions uploaded yet."}</div>}
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
            </div>
          </>
        )}

        {/* ── OFFICIALS ── */}
        {activeTab === "officials" && !fetchingOfficials && (
          <>
            <div className={styles.statsRow}>
<<<<<<< HEAD
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{officials.length}</div>
                <div className={styles.statLabel}>Total SB Officials</div>
              </div>
=======
              <div className={styles.statCard}><div className={styles.statNumber}>{officials.length}</div><div className={styles.statLabel}>Total SB Officials</div></div>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
            </div>
            <div className={styles.searchFilterBar}>
              <div className={styles.searchInputWrapper}>
                <Search size={16} className={styles.searchIcon} />
<<<<<<< HEAD
                <input className={styles.searchInput} placeholder="Search by name or position..."
                  value={officialSearch} onChange={(e) => setOfficialSearch(e.target.value)} />
=======
                <input className={styles.searchInput} placeholder="Search by name or position..." value={officialSearch} onChange={(e) => setOfficialSearch(e.target.value)} />
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                {officialSearch && <button className={styles.clearSearch} onClick={() => setOfficialSearch("")}><X size={14} /></button>}
              </div>
              <div className={styles.filterGroup}>
                <Filter size={15} className={styles.filterIcon} />
<<<<<<< HEAD
                <select className={styles.filterSelect} value={officialPositionFilter}
                  onChange={(e) => setOfficialPositionFilter(e.target.value)}>
                  {uniquePositions.map((p) => (
                    <option key={p} value={p}>{p === "all" ? "All Positions" : p}</option>
                  ))}
=======
                <select className={styles.filterSelect} value={officialPositionFilter} onChange={(e) => setOfficialPositionFilter(e.target.value)}>
                  {uniquePositions.map((p) => <option key={p} value={p}>{p === "all" ? "All Positions" : p}</option>)}
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                </select>
              </div>
            </div>
            <div className={styles.searchResultCount}>Showing {filteredOfficials.length} of {officials.length} officials</div>
            <div className={styles.officialsGrid}>
              {filteredOfficials.map((o) => (
                <div key={o.id} className={styles.officialCard}>
<<<<<<< HEAD
                  <button className={styles.officialCardInner}
                    onClick={() => { setSelectedOfficialProfile(o); setShowOfficialProfile(true); }}>
                    {o.photo
                      ? <img src={`http://localhost:5000/uploads/${o.photo}`} alt={o.full_name} className={styles.officialImg} />
                      : <div className={styles.officialAvatar}>{o.full_name.charAt(0)}</div>}
                    <div className={styles.officialName}>{o.full_name}</div>
                    <div className={styles.officialPosition}>{o.position}</div>
                    <div className={styles.officialTerm}><CalendarDays size={12} strokeWidth={1.5} /> {o.term_period}</div>
                    <div className={styles.ordinanceCount}>
                      <ClipboardList size={12} strokeWidth={1.5} />{" "}
                      {getOfficialOrdinances(o.id).length} ordinance{getOfficialOrdinances(o.id).length !== 1 ? "s" : ""} passed
                    </div>
                  </button>
                  <button className={styles.deleteBtn} onClick={() => setDeleteTarget({ id: o.id, type: "official", name: o.full_name })}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              ))}
              {filteredOfficials.length === 0 && (
                <div className={styles.empty}>
                  {officialSearch || officialPositionFilter !== "all" ? "No officials match your search." : "No SB Officials added yet."}
                </div>
              )}
=======
                  <button className={styles.officialCardInner} onClick={() => { setSelectedOfficialProfile(o); setShowOfficialProfile(true); }}>
                    {o.photo ? <img src={o.photo} alt={o.full_name} className={styles.officialImg} /> : <div className={styles.officialAvatar}>{o.full_name.charAt(0)}</div>}
                    <div className={styles.officialName}>{o.full_name}</div>
                    <div className={styles.officialPosition}>{o.position}</div>
                    <div className={styles.officialTerm}><CalendarDays size={12} strokeWidth={1.5} /> {o.term_period}</div>
                    <div className={styles.ordinanceCount}><ClipboardList size={12} strokeWidth={1.5} /> {getOfficialOrdinances(o.id).length} ordinance{getOfficialOrdinances(o.id).length !== 1 ? "s" : ""} passed</div>
                  </button>
                  <button className={styles.deleteBtn} onClick={() => setDeleteTarget({ id: o.id, type: "official", name: o.full_name })}><Trash2 size={13} /> Delete</button>
                </div>
              ))}
              {filteredOfficials.length === 0 && <div className={styles.empty}>{officialSearch || officialPositionFilter !== "all" ? "No officials match your search." : "No SB Officials added yet."}</div>}
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
            </div>
          </>
        )}

<<<<<<< HEAD
=======
        {/* ── ACTIVITY LOGS ── */}
        {activeTab === "logs" && (
          <>
            {/* Stats */}
            {logStats && (
              <div className={styles.statsRow}>
                {[
                  { label: "Total Logs",  value: logStats.total,   color: "#1a365d", cls: styles.statCard },
                  { label: "Logins",      value: logStats.logins,  color: "#065f46", cls: `${styles.statCard} ${styles.statCardGreen}` },
                  { label: "Uploads",     value: logStats.uploads, color: "#5b21b6", cls: styles.statCard },
                  { label: "Creates",     value: logStats.creates, color: "#854d0e", cls: `${styles.statCard} ${styles.statCardOrange}` },
                  { label: "Deletes",     value: logStats.deletes, color: "#991b1b", cls: styles.statCard },
                  { label: "Failed",      value: logStats.failed,  color: "#c53030", cls: styles.statCard },
                ].map((s) => (
                  <div key={s.label} className={s.cls}>
                    <div className={styles.statNumber} style={{ color: s.color }}>{s.value}</div>
                    <div className={styles.statLabel}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Filters */}
            <div className={styles.searchFilterBar}>
              <div className={styles.filterGroup}>
                <Filter size={15} className={styles.filterIcon} />
                <select className={styles.filterSelect} value={logModuleFilter} onChange={(e) => setLogModuleFilter(e.target.value)}>
                  {["all","Auth","Ordinances","Resolutions","Officials","Announcements","Sessions","Users","Calendar"].map((m) => (
                    <option key={m} value={m}>{m === "all" ? "All Modules" : m}</option>
                  ))}
                </select>
                <select className={styles.filterSelect} value={logActionFilter} onChange={(e) => setLogActionFilter(e.target.value)}>
                  {["all","LOGIN","LOGOUT","REGISTER","UPLOAD","CREATE","UPDATE","DELETE"].map((a) => (
                    <option key={a} value={a}>{a === "all" ? "All Actions" : a}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.searchResultCount}>Showing {logs.length} logs</div>

            {/* Table */}
            {fetchingLogs ? (
              <div className={styles.loadingBar}>Loading logs...</div>
            ) : (
              <div className={styles.tableCard}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {["Date & Time","User","Role","Action","Module","Description","IP","Status"].map((h) => (
                        <th key={h} className={styles.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 && (
                      <tr><td colSpan={8} className={styles.empty}>No logs found.</td></tr>
                    )}
                    {logs.map((log, i) => {
                      const ac = ACTION_COLORS[log.action] || { bg: "#f3f4f6", color: "#374151" };
                      return (
                        <tr key={log.id} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                          <td className={styles.td} style={{ whiteSpace: "nowrap", color: "#64748b", fontSize: 12 }}>
                            {new Date(log.created_at).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className={styles.td} style={{ fontWeight: 600 }}>{log.user_name || "—"}</td>
                          <td className={styles.td}>
                            <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: log.user_role === "admin" ? "#dbeafe" : "#f0fdf4", color: log.user_role === "admin" ? "#1e40af" : "#166534" }}>
                              {log.user_role || "—"}
                            </span>
                          </td>
                          <td className={styles.td}>
                            <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: ac.bg, color: ac.color }}>
                              {log.action}
                            </span>
                          </td>
                          <td className={styles.td} style={{ color: "#64748b" }}>{log.module || "—"}</td>
                          <td className={styles.td} style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>{log.description || "—"}</td>
                          <td className={styles.td} style={{ color: "#94a3b8", fontSize: 11 }}>{log.ip_address || "—"}</td>
                          <td className={styles.td}>
                            <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: log.status === "success" ? "#d1fae5" : "#fee2e2", color: log.status === "success" ? "#065f46" : "#991b1b" }}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
        {/* ── SESSIONS ── */}
        {activeTab === "sessions" && !fetchingMinutes && (
          <>
            <div className={styles.statsRow}>
<<<<<<< HEAD
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{sessionMinutes.length}</div>
                <div className={styles.statLabel}>Total Sessions</div>
              </div>
              <div className={`${styles.statCard} ${styles.statCardGreen}`}>
                <div className={styles.statNumber}>{sessionMinutes.filter((s) => s.session_type === "regular").length}</div>
                <div className={styles.statLabel}>Regular Sessions</div>
              </div>
              <div className={`${styles.statCard} ${styles.statCardOrange}`}>
                <div className={styles.statNumber}>{sessionMinutes.filter((s) => s.session_type === "special").length}</div>
                <div className={styles.statLabel}>Special Sessions</div>
              </div>
=======
              <div className={styles.statCard}><div className={styles.statNumber}>{sessionMinutes.length}</div><div className={styles.statLabel}>Total Sessions</div></div>
              <div className={`${styles.statCard} ${styles.statCardGreen}`}><div className={styles.statNumber}>{sessionMinutes.filter((s) => s.session_type === "regular").length}</div><div className={styles.statLabel}>Regular Sessions</div></div>
              <div className={`${styles.statCard} ${styles.statCardOrange}`}><div className={styles.statNumber}>{sessionMinutes.filter((s) => s.session_type === "special").length}</div><div className={styles.statLabel}>Special Sessions</div></div>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
            </div>
            <div className={styles.searchFilterBar}>
              <div className={styles.searchInputWrapper}>
                <Search size={16} className={styles.searchIcon} />
<<<<<<< HEAD
                <input className={styles.searchInput} placeholder="Search by session number, venue, or agenda..."
                  value={minutesSearch} onChange={(e) => setMinutesSearch(e.target.value)} />
=======
                <input className={styles.searchInput} placeholder="Search by session number, venue, or agenda..." value={minutesSearch} onChange={(e) => setMinutesSearch(e.target.value)} />
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                {minutesSearch && <button className={styles.clearSearch} onClick={() => setMinutesSearch("")}><X size={14} /></button>}
              </div>
              <div className={styles.filterGroup}>
                <Filter size={15} className={styles.filterIcon} />
                {["all", "regular", "special"].map((t) => (
<<<<<<< HEAD
                  <button key={t} className={`${styles.filterBtn} ${minutesTypeFilter === t ? styles.filterBtnActive : ""}`}
                    onClick={() => setMinutesTypeFilter(t)}>
                    {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
                <select className={styles.filterSelect} value={minutesYearFilter}
                  onChange={(e) => setMinutesYearFilter(e.target.value)}>
                  {minutesYears.map((y) => (
                    <option key={y} value={y}>{y === "all" ? "All Years" : y}</option>
                  ))}
=======
                  <button key={t} className={`${styles.filterBtn} ${minutesTypeFilter === t ? styles.filterBtnActive : ""}`} onClick={() => setMinutesTypeFilter(t)}>
                    {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
                <select className={styles.filterSelect} value={minutesYearFilter} onChange={(e) => setMinutesYearFilter(e.target.value)}>
                  {minutesYears.map((y) => <option key={y} value={y}>{y === "all" ? "All Years" : y}</option>)}
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                </select>
              </div>
            </div>
            <div className={styles.searchResultCount}>Showing {filteredMinutes.length} of {sessionMinutes.length} sessions</div>
            <div className={styles.sessionList}>
              {filteredMinutes.map((s) => {
                const date = s.session_date ? new Date(s.session_date + "T00:00:00") : null;
                const agendaPreview = s.agenda ? s.agenda.split("\n").filter(Boolean).slice(0, 3) : [];
                return (
                  <div key={s.id} className={styles.sessionCard}>
                    <div className={styles.sessionDateBlock}>
                      {date && !isNaN(date.getTime()) ? (
<<<<<<< HEAD
                        <>
                          <div className={styles.sessionMonth}>{MONTHS[date.getMonth()]}</div>
                          <div className={styles.sessionDay}>{String(date.getDate())}</div>
                          <div className={styles.sessionYear}>{String(date.getFullYear())}</div>
                        </>
=======
                        <><div className={styles.sessionMonth}>{MONTHS[date.getMonth()]}</div><div className={styles.sessionDay}>{String(date.getDate())}</div><div className={styles.sessionYear}>{String(date.getFullYear())}</div></>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                      ) : <div className={styles.sessionDay}>—</div>}
                    </div>
                    <div className={styles.sessionInfo}>
                      <div className={styles.sessionTop}>
                        <span className={`${styles.sessionTypeBadge} ${s.session_type === "special" ? styles.sessionTypeSpecial : styles.sessionTypeRegular}`}>
                          {s.session_type === "special" ? "Special Session" : "Regular Session"}
                        </span>
                        {s.session_number && <span className={styles.sessionNumber}>{s.session_number}</span>}
                      </div>
                      {s.venue && <div className={styles.sessionVenue}><CalendarDays size={12} strokeWidth={1.5} /> {s.venue}</div>}
                      {agendaPreview.length > 0 && (
                        <div className={styles.sessionAgendaPreview}>
                          <div className={styles.sessionAgendaLabel}>Agenda:</div>
                          <ol className={styles.sessionAgendaList}>
                            {agendaPreview.map((item, i) => <li key={i}>{item}</li>)}
<<<<<<< HEAD
                            {s.agenda.split("\n").filter(Boolean).length > 3 && (
                              <li className={styles.sessionAgendaMore}>
                                +{String(s.agenda.split("\n").filter(Boolean).length - 3)} more items
                              </li>
                            )}
                          </ol>
                        </div>
                      )}
                      {s.minutes_text && (
                        <div className={styles.sessionMinutesPreview}>
                          {s.minutes_text.length > 120 ? s.minutes_text.slice(0, 120) + "…" : s.minutes_text}
                        </div>
                      )}
                    </div>
                    <div className={styles.sessionActions}>
                      <a href={`http://localhost:5000/api/session-minutes/${s.id}/print`} target="_blank" rel="noreferrer" className={styles.printBtn}>
                        <Printer size={13} /> Print
                      </a>
                      <a href={`http://localhost:5000/api/session-minutes/${s.id}/print`} target="_blank" rel="noreferrer" className={styles.viewBtn}>
                        <Eye size={13} /> View
                      </a>
                      <button className={styles.editBtn} onClick={() => handleOpenEditSession(s)}><Pencil size={13} /> Edit</button>
                      <button className={styles.deleteBtn} onClick={() => setDeleteTarget({ id: s.id, type: "session", name: s.session_number || "this session" })}>
                        <Trash2 size={13} /> Delete
                      </button>
=======
                            {s.agenda.split("\n").filter(Boolean).length > 3 && <li className={styles.sessionAgendaMore}>+{String(s.agenda.split("\n").filter(Boolean).length - 3)} more items</li>}
                          </ol>
                        </div>
                      )}
                      {s.minutes_text && <div className={styles.sessionMinutesPreview}>{s.minutes_text.length > 120 ? s.minutes_text.slice(0, 120) + "…" : s.minutes_text}</div>}
                    </div>
                    <div className={styles.sessionActions}>
                      <a href={`${API}/api/session-minutes/${s.id}/print`} target="_blank" rel="noreferrer" className={styles.printBtn}><Printer size={13} /> Print</a>
                      <a href={`${API}/api/session-minutes/${s.id}/print`} target="_blank" rel="noreferrer" className={styles.viewBtn}><Eye size={13} /> View</a>
                      <button className={styles.editBtn} onClick={() => handleOpenEditSession(s)}><Pencil size={13} /> Edit</button>
                      <button className={styles.deleteBtn} onClick={() => setDeleteTarget({ id: s.id, type: "session", name: s.session_number || "this session" })}><Trash2 size={13} /> Delete</button>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                    </div>
                  </div>
                );
              })}
<<<<<<< HEAD
              {filteredMinutes.length === 0 && (
                <div className={styles.empty}>
                  {minutesSearch || minutesTypeFilter !== "all" || minutesYearFilter !== "all"
                    ? "No session records match your search."
                    : 'No session minutes recorded yet. Click "+ Add Session" to get started.'}
                </div>
              )}
=======
              {filteredMinutes.length === 0 && <div className={styles.empty}>{minutesSearch || minutesTypeFilter !== "all" || minutesYearFilter !== "all" ? "No session records match your search." : 'No session minutes recorded yet. Click "+ Add Session" to get started.'}</div>}
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
            </div>
          </>
        )}

        {/* ── ANNOUNCEMENTS ── */}
        {activeTab === "announcements" && !fetchingAnnouncements && (
          <>
            <div className={styles.statsRow}>
<<<<<<< HEAD
              <div className={styles.statCard}>
                <div className={styles.statNumber}>{announcements.length}</div>
                <div className={styles.statLabel}>Total Announcements</div>
              </div>
              <div className={`${styles.statCard} ${styles.statCardOrange}`}>
                <div className={styles.statNumber}>{announcements.filter((a) => a.priority === "urgent").length}</div>
                <div className={styles.statLabel}>Urgent</div>
              </div>
              <div className={`${styles.statCard} ${styles.statCardGreen}`}>
                <div className={styles.statNumber}>{announcements.filter((a) => !a.expires_at || new Date(a.expires_at) >= new Date()).length}</div>
                <div className={styles.statLabel}>Active</div>
              </div>
=======
              <div className={styles.statCard}><div className={styles.statNumber}>{announcements.length}</div><div className={styles.statLabel}>Total Announcements</div></div>
              <div className={`${styles.statCard} ${styles.statCardOrange}`}><div className={styles.statNumber}>{announcements.filter((a) => a.priority === "urgent").length}</div><div className={styles.statLabel}>Urgent</div></div>
              <div className={`${styles.statCard} ${styles.statCardGreen}`}><div className={styles.statNumber}>{announcements.filter((a) => !a.expires_at || new Date(a.expires_at) >= new Date()).length}</div><div className={styles.statLabel}>Active</div></div>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
            </div>
            <div className={styles.searchFilterBar}>
              <div className={styles.searchInputWrapper}>
                <Search size={16} className={styles.searchIcon} />
<<<<<<< HEAD
                <input className={styles.searchInput} placeholder="Search announcements..."
                  value={announcementSearch} onChange={(e) => setAnnouncementSearch(e.target.value)} />
=======
                <input className={styles.searchInput} placeholder="Search announcements..." value={announcementSearch} onChange={(e) => setAnnouncementSearch(e.target.value)} />
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                {announcementSearch && <button className={styles.clearSearch} onClick={() => setAnnouncementSearch("")}><X size={14} /></button>}
              </div>
              <div className={styles.filterGroup}>
                <Filter size={15} className={styles.filterIcon} />
                {["all", "urgent", "high", "normal", "low"].map((p) => (
<<<<<<< HEAD
                  <button key={p} className={`${styles.filterBtn} ${announcementPriorityFilter === p ? styles.filterBtnActive : ""}`}
                    onClick={() => setAnnouncementPriorityFilter(p)}>
=======
                  <button key={p} className={`${styles.filterBtn} ${announcementPriorityFilter === p ? styles.filterBtnActive : ""}`} onClick={() => setAnnouncementPriorityFilter(p)}>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                    {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.searchResultCount}>Showing {filteredAnnouncements.length} of {announcements.length} announcements</div>
            <div className={styles.announcementList}>
              {filteredAnnouncements.map((a) => {
                const cfg = priorityConfig[a.priority] || priorityConfig.normal;
                const isExpired = a.expires_at && new Date(a.expires_at) < new Date();
                return (
                  <div key={a.id} className={`${styles.announcementCard} ${isExpired ? styles.announcementExpired : ""}`}>
                    <div className={styles.announcementLeft}>
                      <div className={styles.announcementIconWrap} style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                        <Megaphone size={20} strokeWidth={1.5} style={{ color: cfg.color }} />
                      </div>
                    </div>
                    <div className={styles.announcementBody}>
                      <div className={styles.announcementTop}>
<<<<<<< HEAD
                        <span className={styles.announcementPriorityBadge} style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                          {cfg.label}
                        </span>
                        {isExpired && <span className={styles.expiredBadge}>Expired</span>}
                        <span className={styles.announcementDate}>
                          <CalendarDays size={11} strokeWidth={1.5} />
                          {new Date(a.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                        </span>
=======
                        <span className={styles.announcementPriorityBadge} style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>{cfg.label}</span>
                        {isExpired && <span className={styles.expiredBadge}>Expired</span>}
                        <span className={styles.announcementDate}><CalendarDays size={11} strokeWidth={1.5} />{new Date(a.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}</span>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                      </div>
                      <div className={styles.announcementTitle}>{a.title}</div>
                      <div className={styles.announcementText}>{a.body.length > 200 ? a.body.slice(0, 200) + "…" : a.body}</div>
                      {a.expires_at && (
                        <div className={styles.announcementExpiry} style={{ color: isExpired ? "#c53030" : "#718096" }}>
<<<<<<< HEAD
                          {isExpired ? "⚠ Expired" : "⏱ Expires"}:{" "}
                          {new Date(a.expires_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
=======
                          {isExpired ? "⚠ Expired" : "⏱ Expires"}: {new Date(a.expires_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                        </div>
                      )}
                    </div>
                    <div className={styles.announcementActions}>
                      <button className={styles.editBtn} onClick={() => handleOpenEditAnnouncement(a)}><Pencil size={13} /> Edit</button>
<<<<<<< HEAD
                      <button className={styles.deleteBtn} onClick={() => setDeleteTarget({ id: a.id, type: "announcement", name: a.title })}>
                        <Trash2 size={13} /> Delete
                      </button>
=======
                      <button className={styles.deleteBtn} onClick={() => setDeleteTarget({ id: a.id, type: "announcement", name: a.title })}><Trash2 size={13} /> Delete</button>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
                    </div>
                  </div>
                );
              })}
<<<<<<< HEAD
              {filteredAnnouncements.length === 0 && (
                <div className={styles.empty}>
                  {announcementSearch || announcementPriorityFilter !== "all"
                    ? "No announcements match your search."
                    : 'No announcements yet. Click "+ New Announcement" to post one.'}
                </div>
              )}
=======
              {filteredAnnouncements.length === 0 && <div className={styles.empty}>{announcementSearch || announcementPriorityFilter !== "all" ? "No announcements match your search." : 'No announcements yet. Click "+ New Announcement" to post one.'}</div>}
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
            </div>
          </>
        )}
      </div>

      {/* ══════════════════ MODALS ══════════════════ */}

      {/* Add Admin */}
      {showAddAdminModal && (
<<<<<<< HEAD
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Add New Admin</h2>
            <input className={styles.input} placeholder="Full Name" value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} />
            <input className={styles.input} placeholder="Username" value={newAdmin.username} onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })} />
            <input className={styles.input} type="email" placeholder="Email Address" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} />
            <input className={styles.input} type="password" placeholder="Password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} />
            <ModalAlert />
            <div className={styles.modalBtns}>
              <button className={styles.cancelBtn} onClick={() => { setShowAddAdminModal(false); setModalMessage(""); }}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleAddAdmin} disabled={submitting}>{submitting ? "Adding..." : "Add Admin"}</button>
            </div>
          </div>
        </div>
=======
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <h2 className={styles.modalTitle}>Add New Admin</h2>
          <input className={styles.input} placeholder="Full Name" value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} />
          <input className={styles.input} placeholder="Username" value={newAdmin.username} onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })} />
          <input className={styles.input} type="email" placeholder="Email Address" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} />
          <input className={styles.input} type="password" placeholder="Password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} />
          <ModalAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowAddAdminModal(false); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleAddAdmin} disabled={submitting}>{submitting ? "Adding..." : "Add Admin"}</button>
          </div>
        </div></div>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      )}

      {/* Add User */}
      {showAddUserModal && (
<<<<<<< HEAD
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Add New User</h2>
            <input className={styles.input} placeholder="Full Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
            <input className={styles.input} placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
            <input className={styles.input} type="email" placeholder="Email Address" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            <input className={styles.input} type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
            <ModalAlert />
            <div className={styles.modalBtns}>
              <button className={styles.cancelBtn} onClick={() => { setShowAddUserModal(false); setModalMessage(""); }}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleAddUser} disabled={submitting}>{submitting ? "Adding..." : "Add User"}</button>
            </div>
          </div>
        </div>
=======
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <h2 className={styles.modalTitle}>Add New User</h2>
          <input className={styles.input} placeholder="Full Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
          <input className={styles.input} placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
          <input className={styles.input} type="email" placeholder="Email Address" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
          <input className={styles.input} type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
          <ModalAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowAddUserModal(false); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleAddUser} disabled={submitting}>{submitting ? "Adding..." : "Add User"}</button>
          </div>
        </div></div>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      )}

      {/* Upload Ordinance */}
      {showOrdinanceModal && (
<<<<<<< HEAD
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Upload Ordinance</h2>
            <input className={styles.input} placeholder="Ordinance Number (e.g. Ordinance No. 2024-001)" value={ordinanceNumber} onChange={(e) => setOrdinanceNumber(e.target.value)} />
            <input className={styles.input} placeholder="Ordinance Title" value={ordinanceTitle} onChange={(e) => setOrdinanceTitle(e.target.value)} />
            <input className={styles.input} placeholder="Year (e.g. 2024)" type="number" min="1900" max="2100" value={ordinanceYear} onChange={(e) => setOrdinanceYear(e.target.value)} />
            <p className={styles.officialsSelectLabel}>Choose upload type:</p>
            <div className={styles.uploadTypeRow}>
              <button className={`${styles.uploadTypeBtn} ${uploadType === "pdf" ? styles.uploadTypeBtnActive : ""}`}
                onClick={() => { setUploadType("pdf"); setOrdinanceFile(null); }}>
                <FileText size={16} strokeWidth={1.5} /> Upload as PDF
                <span className={styles.uploadTypeDesc}>Store and view the PDF file</span>
              </button>
              <button className={`${styles.uploadTypeBtn} ${uploadType === "image-to-text" ? styles.uploadTypeBtnActive : ""}`}
                onClick={() => { setUploadType("image-to-text"); setOrdinanceFile(null); }}>
                <Image size={16} strokeWidth={1.5} /> Image to Text (OCR)
                <span className={styles.uploadTypeDesc}>Upload image and extract text</span>
              </button>
            </div>
            {uploadType && (
              <div className={styles.fileUploadBox}>
                <input type="file" accept={uploadType === "pdf" ? ".pdf" : "image/*"} id="fileInput" style={{ display: "none" }}
                  onChange={(e) => setOrdinanceFile(e.target.files[0])} />
                <label htmlFor="fileInput" className={styles.fileLabel}>
                  {ordinanceFile
                    ? <><CheckSquare size={14} strokeWidth={1.5} /> {ordinanceFile.name}</>
                    : <><Upload size={14} strokeWidth={1.5} /> {uploadType === "pdf" ? "Click to choose PDF file" : "Click to choose Image (JPG, PNG)"}</>}
                </label>
                <p className={styles.fileHint}>{uploadType === "pdf" ? "Accepted: PDF only" : "Accepted: JPG, PNG — text will be extracted automatically"}</p>
              </div>
            )}
            <div className={styles.officialsSelectSection}>
              <p className={styles.officialsSelectLabel}>Tag SB Officials who passed this ordinance:</p>
              <OfficialsCheckList selected={selectedOfficials} onToggle={toggleOfficial} />
            </div>
            <ModalAlert />
            <div className={styles.modalBtns}>
              <button className={styles.cancelBtn} onClick={() => {
                setShowOrdinanceModal(false); setOrdinanceFile(null); setOrdinanceNumber(""); setOrdinanceTitle("");
                setOrdinanceYear(""); setSelectedOfficials([]); setUploadType(""); setModalMessage("");
              }}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleUploadOrdinance} disabled={submitting || !uploadType}>
                {submitting ? (uploadType === "image-to-text" ? "Extracting text..." : "Uploading...") : "Upload"}
              </button>
            </div>
          </div>
        </div>
=======
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <h2 className={styles.modalTitle}>Upload Ordinance</h2>
          <input className={styles.input} placeholder="Ordinance Number (e.g. Ordinance No. 2024-001)" value={ordinanceNumber} onChange={(e) => setOrdinanceNumber(e.target.value)} />
          <input className={styles.input} placeholder="Ordinance Title" value={ordinanceTitle} onChange={(e) => setOrdinanceTitle(e.target.value)} />
          <input className={styles.input} placeholder="Year (e.g. 2024)" type="number" min="1900" max="2100" value={ordinanceYear} onChange={(e) => setOrdinanceYear(e.target.value)} />
          <p className={styles.officialsSelectLabel}>Choose upload type:</p>
          <div className={styles.uploadTypeRow}>
            <button className={`${styles.uploadTypeBtn} ${uploadType === "pdf" ? styles.uploadTypeBtnActive : ""}`} onClick={() => { setUploadType("pdf"); setOrdinanceFile(null); }}>
              <FileText size={16} strokeWidth={1.5} /> Upload as PDF<span className={styles.uploadTypeDesc}>Store and view the PDF file</span>
            </button>
            <button className={`${styles.uploadTypeBtn} ${uploadType === "image-to-text" ? styles.uploadTypeBtnActive : ""}`} onClick={() => { setUploadType("image-to-text"); setOrdinanceFile(null); }}>
              <Image size={16} strokeWidth={1.5} /> Image to Text (OCR)<span className={styles.uploadTypeDesc}>Upload image and extract text</span>
            </button>
          </div>
          {uploadType && (
            <div className={styles.fileUploadBox}>
              <input type="file" accept={uploadType === "pdf" ? ".pdf" : "image/*"} id="fileInput" style={{ display: "none" }} onChange={(e) => setOrdinanceFile(e.target.files[0])} />
              <label htmlFor="fileInput" className={styles.fileLabel}>
                {ordinanceFile ? <><CheckSquare size={14} strokeWidth={1.5} /> {ordinanceFile.name}</> : <><Upload size={14} strokeWidth={1.5} /> {uploadType === "pdf" ? "Click to choose PDF file" : "Click to choose Image (JPG, PNG)"}</>}
              </label>
              <p className={styles.fileHint}>{uploadType === "pdf" ? "Accepted: PDF only" : "Accepted: JPG, PNG — text will be extracted automatically"}</p>
            </div>
          )}
          <div className={styles.officialsSelectSection}>
            <p className={styles.officialsSelectLabel}>Tag SB Officials who passed this ordinance:</p>
            <OfficialsCheckList selected={selectedOfficials} onToggle={toggleOfficial} />
          </div>
          <ModalAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowOrdinanceModal(false); setOrdinanceFile(null); setOrdinanceNumber(""); setOrdinanceTitle(""); setOrdinanceYear(""); setSelectedOfficials([]); setUploadType(""); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleUploadOrdinance} disabled={submitting || !uploadType}>{submitting ? (uploadType === "image-to-text" ? "Extracting text..." : "Uploading...") : "Upload"}</button>
          </div>
        </div></div>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      )}

      {/* Edit Ordinance */}
      {showEditOrdinanceModal && editingOrdinance && (
<<<<<<< HEAD
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Edit Ordinance</h2>
            <input className={styles.input} placeholder="Ordinance Number" value={editOrdinanceNumber} onChange={(e) => setEditOrdinanceNumber(e.target.value)} />
            <input className={styles.input} placeholder="Ordinance Title" value={editOrdinanceTitle} onChange={(e) => setEditOrdinanceTitle(e.target.value)} />
            <input className={styles.input} placeholder="Year (e.g. 2024)" type="number" min="1900" max="2100" value={editOrdinanceYear} onChange={(e) => setEditOrdinanceYear(e.target.value)} />
            <p className={styles.officialsSelectLabel}>Replace file (optional):</p>
            <div className={styles.fileUploadBox}>
              <input type="file" accept={editingOrdinance.filetype === "application/pdf" ? ".pdf" : "image/*"} id="editFileInput" style={{ display: "none" }}
                onChange={(e) => setEditOrdinanceFile(e.target.files[0])} />
              <label htmlFor="editFileInput" className={styles.fileLabel}>
                {editOrdinanceFile
                  ? <><CheckSquare size={14} strokeWidth={1.5} /> {editOrdinanceFile.name}</>
                  : <><Upload size={14} strokeWidth={1.5} /> {editingOrdinance.filetype === "application/pdf" ? "Click to replace PDF" : "Click to replace Image"}</>}
              </label>
              <p className={styles.fileHint}>Current file: {editingOrdinance.filename}</p>
            </div>
            <div className={styles.officialsSelectSection}>
              <p className={styles.officialsSelectLabel}>Tag SB Officials who passed this ordinance:</p>
              <OfficialsCheckList selected={editSelectedOfficials} onToggle={toggleEditOfficial} />
            </div>
            <ModalAlert />
            <div className={styles.modalBtns}>
              <button className={styles.cancelBtn} onClick={() => { setShowEditOrdinanceModal(false); setEditingOrdinance(null); setModalMessage(""); }}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleUpdateOrdinance} disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
=======
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <h2 className={styles.modalTitle}>Edit Ordinance</h2>
          <input className={styles.input} placeholder="Ordinance Number" value={editOrdinanceNumber} onChange={(e) => setEditOrdinanceNumber(e.target.value)} />
          <input className={styles.input} placeholder="Ordinance Title" value={editOrdinanceTitle} onChange={(e) => setEditOrdinanceTitle(e.target.value)} />
          <input className={styles.input} placeholder="Year (e.g. 2024)" type="number" min="1900" max="2100" value={editOrdinanceYear} onChange={(e) => setEditOrdinanceYear(e.target.value)} />
          <p className={styles.officialsSelectLabel}>Replace file (optional):</p>
          <div className={styles.fileUploadBox}>
            <input type="file" accept={editingOrdinance.filetype === "application/pdf" ? ".pdf" : "image/*"} id="editFileInput" style={{ display: "none" }} onChange={(e) => setEditOrdinanceFile(e.target.files[0])} />
            <label htmlFor="editFileInput" className={styles.fileLabel}>
              {editOrdinanceFile ? <><CheckSquare size={14} strokeWidth={1.5} /> {editOrdinanceFile.name}</> : <><Upload size={14} strokeWidth={1.5} /> {editingOrdinance.filetype === "application/pdf" ? "Click to replace PDF" : "Click to replace Image"}</>}
            </label>
            <p className={styles.fileHint}>Current file: {editingOrdinance.filename}</p>
          </div>
          <div className={styles.officialsSelectSection}>
            <p className={styles.officialsSelectLabel}>Tag SB Officials who passed this ordinance:</p>
            <OfficialsCheckList selected={editSelectedOfficials} onToggle={toggleEditOfficial} />
          </div>
          <ModalAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowEditOrdinanceModal(false); setEditingOrdinance(null); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleUpdateOrdinance} disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</button>
          </div>
        </div></div>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      )}

      {/* Upload Resolution */}
      {showResolutionModal && (
<<<<<<< HEAD
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}><Gavel size={18} strokeWidth={1.5} /> Upload Resolution</h2>
            <input className={styles.input} placeholder="Resolution Number (e.g. Resolution No. 2024-001)" value={resolutionNumber} onChange={(e) => setResolutionNumber(e.target.value)} />
            <input className={styles.input} placeholder="Resolution Title" value={resolutionTitle} onChange={(e) => setResolutionTitle(e.target.value)} />
            <input className={styles.input} placeholder="Year (e.g. 2024)" type="number" min="1900" max="2100" value={resolutionYear} onChange={(e) => setResolutionYear(e.target.value)} />
            <p className={styles.officialsSelectLabel}>Choose upload type:</p>
            <div className={styles.uploadTypeRow}>
              <button className={`${styles.uploadTypeBtn} ${resolutionUploadType === "pdf" ? styles.uploadTypeBtnActive : ""}`}
                onClick={() => { setResolutionUploadType("pdf"); setResolutionFile(null); }}>
                <FileText size={16} strokeWidth={1.5} /> Upload as PDF
                <span className={styles.uploadTypeDesc}>Store and view the PDF file</span>
              </button>
              <button className={`${styles.uploadTypeBtn} ${resolutionUploadType === "image-to-text" ? styles.uploadTypeBtnActive : ""}`}
                onClick={() => { setResolutionUploadType("image-to-text"); setResolutionFile(null); }}>
                <Image size={16} strokeWidth={1.5} /> Image to Text (OCR)
                <span className={styles.uploadTypeDesc}>Upload image and extract text</span>
              </button>
            </div>
            {resolutionUploadType && (
              <div className={styles.fileUploadBox}>
                <input type="file" accept={resolutionUploadType === "pdf" ? ".pdf" : "image/*"} id="resFileInput" style={{ display: "none" }}
                  onChange={(e) => setResolutionFile(e.target.files[0])} />
                <label htmlFor="resFileInput" className={styles.fileLabel}>
                  {resolutionFile
                    ? <><CheckSquare size={14} strokeWidth={1.5} /> {resolutionFile.name}</>
                    : <><Upload size={14} strokeWidth={1.5} /> {resolutionUploadType === "pdf" ? "Click to choose PDF file" : "Click to choose Image (JPG, PNG)"}</>}
                </label>
                <p className={styles.fileHint}>{resolutionUploadType === "pdf" ? "Accepted: PDF only" : "Accepted: JPG, PNG — text will be extracted automatically"}</p>
              </div>
            )}
            <div className={styles.officialsSelectSection}>
              <p className={styles.officialsSelectLabel}>Tag SB Officials who passed this resolution:</p>
              <OfficialsCheckList selected={selectedResolutionOfficials} onToggle={toggleResolutionOfficial} />
            </div>
            <ModalAlert />
            <div className={styles.modalBtns}>
              <button className={styles.cancelBtn} onClick={() => {
                setShowResolutionModal(false); setResolutionFile(null); setResolutionNumber(""); setResolutionTitle("");
                setResolutionYear(""); setSelectedResolutionOfficials([]); setResolutionUploadType(""); setModalMessage("");
              }}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleUploadResolution} disabled={submitting || !resolutionUploadType}>
                {submitting ? (resolutionUploadType === "image-to-text" ? "Extracting text..." : "Uploading...") : "Upload"}
              </button>
            </div>
          </div>
        </div>
=======
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <h2 className={styles.modalTitle}><Gavel size={18} strokeWidth={1.5} /> Upload Resolution</h2>
          <input className={styles.input} placeholder="Resolution Number (e.g. Resolution No. 2024-001)" value={resolutionNumber} onChange={(e) => setResolutionNumber(e.target.value)} />
          <input className={styles.input} placeholder="Resolution Title" value={resolutionTitle} onChange={(e) => setResolutionTitle(e.target.value)} />
          <input className={styles.input} placeholder="Year (e.g. 2024)" type="number" min="1900" max="2100" value={resolutionYear} onChange={(e) => setResolutionYear(e.target.value)} />
          <p className={styles.officialsSelectLabel}>Choose upload type:</p>
          <div className={styles.uploadTypeRow}>
            <button className={`${styles.uploadTypeBtn} ${resolutionUploadType === "pdf" ? styles.uploadTypeBtnActive : ""}`} onClick={() => { setResolutionUploadType("pdf"); setResolutionFile(null); }}>
              <FileText size={16} strokeWidth={1.5} /> Upload as PDF<span className={styles.uploadTypeDesc}>Store and view the PDF file</span>
            </button>
            <button className={`${styles.uploadTypeBtn} ${resolutionUploadType === "image-to-text" ? styles.uploadTypeBtnActive : ""}`} onClick={() => { setResolutionUploadType("image-to-text"); setResolutionFile(null); }}>
              <Image size={16} strokeWidth={1.5} /> Image to Text (OCR)<span className={styles.uploadTypeDesc}>Upload image and extract text</span>
            </button>
          </div>
          {resolutionUploadType && (
            <div className={styles.fileUploadBox}>
              <input type="file" accept={resolutionUploadType === "pdf" ? ".pdf" : "image/*"} id="resFileInput" style={{ display: "none" }} onChange={(e) => setResolutionFile(e.target.files[0])} />
              <label htmlFor="resFileInput" className={styles.fileLabel}>
                {resolutionFile ? <><CheckSquare size={14} strokeWidth={1.5} /> {resolutionFile.name}</> : <><Upload size={14} strokeWidth={1.5} /> {resolutionUploadType === "pdf" ? "Click to choose PDF file" : "Click to choose Image (JPG, PNG)"}</>}
              </label>
              <p className={styles.fileHint}>{resolutionUploadType === "pdf" ? "Accepted: PDF only" : "Accepted: JPG, PNG — text will be extracted automatically"}</p>
            </div>
          )}
          <div className={styles.officialsSelectSection}>
            <p className={styles.officialsSelectLabel}>Tag SB Officials who passed this resolution:</p>
            <OfficialsCheckList selected={selectedResolutionOfficials} onToggle={toggleResolutionOfficial} />
          </div>
          <ModalAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowResolutionModal(false); setResolutionFile(null); setResolutionNumber(""); setResolutionTitle(""); setResolutionYear(""); setSelectedResolutionOfficials([]); setResolutionUploadType(""); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleUploadResolution} disabled={submitting || !resolutionUploadType}>{submitting ? (resolutionUploadType === "image-to-text" ? "Extracting text..." : "Uploading...") : "Upload"}</button>
          </div>
        </div></div>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      )}

      {/* Edit Resolution */}
      {showEditResolutionModal && editingResolution && (
<<<<<<< HEAD
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}><Pencil size={16} strokeWidth={1.5} /> Edit Resolution</h2>
            <input className={styles.input} placeholder="Resolution Number" value={editResolutionNumber} onChange={(e) => setEditResolutionNumber(e.target.value)} />
            <input className={styles.input} placeholder="Resolution Title" value={editResolutionTitle} onChange={(e) => setEditResolutionTitle(e.target.value)} />
            <input className={styles.input} placeholder="Year (e.g. 2024)" type="number" min="1900" max="2100" value={editResolutionYear} onChange={(e) => setEditResolutionYear(e.target.value)} />
            <p className={styles.officialsSelectLabel}>Replace file (optional):</p>
            <div className={styles.fileUploadBox}>
              <input type="file" accept={editingResolution.filetype === "application/pdf" ? ".pdf" : "image/*"} id="editResFileInput" style={{ display: "none" }}
                onChange={(e) => setEditResolutionFile(e.target.files[0])} />
              <label htmlFor="editResFileInput" className={styles.fileLabel}>
                {editResolutionFile
                  ? <><CheckSquare size={14} strokeWidth={1.5} /> {editResolutionFile.name}</>
                  : <><Upload size={14} strokeWidth={1.5} /> {editingResolution.filetype === "application/pdf" ? "Click to replace PDF" : "Click to replace Image"}</>}
              </label>
              <p className={styles.fileHint}>Current file: {editingResolution.filename}</p>
            </div>
            <div className={styles.officialsSelectSection}>
              <p className={styles.officialsSelectLabel}>Tag SB Officials who passed this resolution:</p>
              <OfficialsCheckList selected={editResolutionSelectedOfficials} onToggle={toggleEditResolutionOfficial} />
            </div>
            <ModalAlert />
            <div className={styles.modalBtns}>
              <button className={styles.cancelBtn} onClick={() => { setShowEditResolutionModal(false); setEditingResolution(null); setModalMessage(""); }}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleUpdateResolution} disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
=======
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <h2 className={styles.modalTitle}><Pencil size={16} strokeWidth={1.5} /> Edit Resolution</h2>
          <input className={styles.input} placeholder="Resolution Number" value={editResolutionNumber} onChange={(e) => setEditResolutionNumber(e.target.value)} />
          <input className={styles.input} placeholder="Resolution Title" value={editResolutionTitle} onChange={(e) => setEditResolutionTitle(e.target.value)} />
          <input className={styles.input} placeholder="Year (e.g. 2024)" type="number" min="1900" max="2100" value={editResolutionYear} onChange={(e) => setEditResolutionYear(e.target.value)} />
          <p className={styles.officialsSelectLabel}>Replace file (optional):</p>
          <div className={styles.fileUploadBox}>
            <input type="file" accept={editingResolution.filetype === "application/pdf" ? ".pdf" : "image/*"} id="editResFileInput" style={{ display: "none" }} onChange={(e) => setEditResolutionFile(e.target.files[0])} />
            <label htmlFor="editResFileInput" className={styles.fileLabel}>
              {editResolutionFile ? <><CheckSquare size={14} strokeWidth={1.5} /> {editResolutionFile.name}</> : <><Upload size={14} strokeWidth={1.5} /> {editingResolution.filetype === "application/pdf" ? "Click to replace PDF" : "Click to replace Image"}</>}
            </label>
            <p className={styles.fileHint}>Current file: {editingResolution.filename}</p>
          </div>
          <div className={styles.officialsSelectSection}>
            <p className={styles.officialsSelectLabel}>Tag SB Officials who passed this resolution:</p>
            <OfficialsCheckList selected={editResolutionSelectedOfficials} onToggle={toggleEditResolutionOfficial} />
          </div>
          <ModalAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowEditResolutionModal(false); setEditingResolution(null); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleUpdateResolution} disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</button>
          </div>
        </div></div>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      )}

      {/* Add Official */}
      {showOfficialModal && (
<<<<<<< HEAD
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Add SB Official</h2>
            <input className={styles.input} placeholder="Full Name" value={newOfficial.full_name} onChange={(e) => setNewOfficial({ ...newOfficial, full_name: e.target.value })} />
            <input className={styles.input} placeholder="Position (e.g. Councilor, Vice Mayor)" value={newOfficial.position} onChange={(e) => setNewOfficial({ ...newOfficial, position: e.target.value })} />
            <input className={styles.input} placeholder="Term Period (e.g. 2022-2025)" value={newOfficial.term_period} onChange={(e) => setNewOfficial({ ...newOfficial, term_period: e.target.value })} />
            <div className={styles.fileUploadBox}>
              <input type="file" accept="image/*" id="photoInput" style={{ display: "none" }} onChange={(e) => setOfficialPhoto(e.target.files[0])} />
              <label htmlFor="photoInput" className={styles.fileLabel}>
                {officialPhoto
                  ? <><CheckSquare size={14} strokeWidth={1.5} /> {officialPhoto.name}</>
                  : <><Upload size={14} strokeWidth={1.5} /> Click to upload photo (optional)</>}
              </label>
            </div>
            <ModalAlert />
            <div className={styles.modalBtns}>
              <button className={styles.cancelBtn} onClick={() => { setShowOfficialModal(false); setModalMessage(""); }}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleAddOfficial} disabled={submitting}>{submitting ? "Adding..." : "Add Official"}</button>
            </div>
          </div>
        </div>
=======
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <h2 className={styles.modalTitle}>Add SB Official</h2>
          <input className={styles.input} placeholder="Full Name" value={newOfficial.full_name} onChange={(e) => setNewOfficial({ ...newOfficial, full_name: e.target.value })} />
          <input className={styles.input} placeholder="Position (e.g. Councilor, Vice Mayor)" value={newOfficial.position} onChange={(e) => setNewOfficial({ ...newOfficial, position: e.target.value })} />
          <input className={styles.input} placeholder="Term Period (e.g. 2022-2025)" value={newOfficial.term_period} onChange={(e) => setNewOfficial({ ...newOfficial, term_period: e.target.value })} />
          <div className={styles.fileUploadBox}>
            <input type="file" accept="image/*" id="photoInput" style={{ display: "none" }} onChange={(e) => setOfficialPhoto(e.target.files[0])} />
            <label htmlFor="photoInput" className={styles.fileLabel}>
              {officialPhoto ? <><CheckSquare size={14} strokeWidth={1.5} /> {officialPhoto.name}</> : <><Upload size={14} strokeWidth={1.5} /> Click to upload photo (optional)</>}
            </label>
          </div>
          <ModalAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowOfficialModal(false); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleAddOfficial} disabled={submitting}>{submitting ? "Adding..." : "Add Official"}</button>
          </div>
        </div></div>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      )}

      {/* Official Profile */}
      {showOfficialProfile && selectedOfficialProfile && (
<<<<<<< HEAD
        <div className={styles.modalOverlay}>
          <div className={styles.profileModal}>
            <div className={styles.profileHeader}>
              {selectedOfficialProfile.photo
                ? <img src={`http://localhost:5000/uploads/${selectedOfficialProfile.photo}`} alt={selectedOfficialProfile.full_name} className={styles.profilePhoto} />
                : <div className={styles.profileAvatar}>{selectedOfficialProfile.full_name.charAt(0)}</div>}
              <div>
                <div className={styles.profileName}>{selectedOfficialProfile.full_name}</div>
                <div className={styles.profilePosition}>{selectedOfficialProfile.position}</div>
                <div className={styles.profileTerm}><CalendarDays size={13} strokeWidth={1.5} /> Term: {selectedOfficialProfile.term_period}</div>
              </div>
            </div>
            <div className={styles.profileOrdinances}>
              <h3 className={styles.profileOrdinancesTitle}>
                <ClipboardList size={15} strokeWidth={1.5} /> Ordinances Passed ({getOfficialOrdinances(selectedOfficialProfile.id).length})
              </h3>
              {getOfficialOrdinances(selectedOfficialProfile.id).length === 0 ? (
                <p className={styles.empty}>No ordinances passed yet.</p>
              ) : (
                getOfficialOrdinances(selectedOfficialProfile.id).map((o) => (
                  <div key={o.id} className={styles.profileOrdinanceItem}>
                    <div className={styles.profileOrdinanceLeft}>
                      <span className={`${styles.badge} ${o.filetype === "application/pdf" ? styles.badgeAdmin : styles.badgeGray}`}>
                        {o.filetype === "application/pdf" ? "PDF" : "OCR"}
                      </span>
                      <div>
                        <div className={styles.profileOrdinanceName}>{o.title}</div>
                        <div className={styles.profileOrdinanceDate}>
                          {new Date(o.uploaded_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                        </div>
                      </div>
                    </div>
                    <a href={`http://localhost:5000/uploads/${o.filename}`} target="_blank" rel="noreferrer" className={styles.viewBtn}>
                      <Eye size={13} /> View
                    </a>
                  </div>
                ))
              )}
            </div>
            <div className={styles.modalBtns}>
              <button className={styles.confirmBtn} onClick={() => setShowOfficialProfile(false)}>Close</button>
            </div>
          </div>
        </div>
=======
        <div className={styles.modalOverlay}><div className={styles.profileModal}>
          <div className={styles.profileHeader}>
            {selectedOfficialProfile.photo
              ? <img src={selectedOfficialProfile.photo} alt={selectedOfficialProfile.full_name} className={styles.profilePhoto} />
              : <div className={styles.profileAvatar}>{selectedOfficialProfile.full_name.charAt(0)}</div>}
            <div>
              <div className={styles.profileName}>{selectedOfficialProfile.full_name}</div>
              <div className={styles.profilePosition}>{selectedOfficialProfile.position}</div>
              <div className={styles.profileTerm}><CalendarDays size={13} strokeWidth={1.5} /> Term: {selectedOfficialProfile.term_period}</div>
            </div>
          </div>
          <div className={styles.profileOrdinances}>
            <h3 className={styles.profileOrdinancesTitle}><ClipboardList size={15} strokeWidth={1.5} /> Ordinances Passed ({getOfficialOrdinances(selectedOfficialProfile.id).length})</h3>
            {getOfficialOrdinances(selectedOfficialProfile.id).length === 0
              ? <p className={styles.empty}>No ordinances passed yet.</p>
              : getOfficialOrdinances(selectedOfficialProfile.id).map((o) => (
                <div key={o.id} className={styles.profileOrdinanceItem}>
                  <div className={styles.profileOrdinanceLeft}>
                    <span className={`${styles.badge} ${o.filetype === "application/pdf" ? styles.badgeAdmin : styles.badgeGray}`}>{o.filetype === "application/pdf" ? "PDF" : "OCR"}</span>
                    <div>
                      <div className={styles.profileOrdinanceName}>{o.title}</div>
                      <div className={styles.profileOrdinanceDate}>{new Date(o.uploaded_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</div>
                    </div>
                  </div>
                  <a href={o.filepath} target="_blank" rel="noreferrer" className={styles.viewBtn}><Eye size={13} /> View</a>
                </div>
              ))}
          </div>
          <div className={styles.modalBtns}>
            <button className={styles.confirmBtn} onClick={() => setShowOfficialProfile(false)}>Close</button>
          </div>
        </div></div>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      )}

      {/* Extracted text */}
      {showTextModal && (
<<<<<<< HEAD
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>Extracted Text (OCR)</h2>
            <textarea className={styles.textArea} value={extractedText} readOnly />
            <div className={styles.modalBtns}>
              <button className={styles.cancelBtn} onClick={() => { navigator.clipboard.writeText(extractedText); showMsg("Copied to clipboard!"); }}>
                <Copy size={13} /> Copy Text
              </button>
              <button className={styles.confirmBtn} onClick={() => setShowTextModal(false)}>Close</button>
            </div>
          </div>
        </div>
=======
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <h2 className={styles.modalTitle}>Extracted Text (OCR)</h2>
          <textarea className={styles.textArea} value={extractedText} readOnly />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { navigator.clipboard.writeText(extractedText); showMsg("Copied to clipboard!"); }}><Copy size={13} /> Copy Text</button>
            <button className={styles.confirmBtn} onClick={() => setShowTextModal(false)}>Close</button>
          </div>
        </div></div>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      )}

      {/* Add Session */}
      {showSessionModal && (
<<<<<<< HEAD
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} ${styles.sessionModal}`}>
            <h2 className={styles.modalTitle}><BookOpen size={18} strokeWidth={1.5} /> Add Session Minutes &amp; Agenda</h2>
            <div className={styles.uploadTypeRow}>
              <button className={`${styles.uploadTypeBtn} ${sessionInputMode === "text" ? styles.uploadTypeBtnActive : ""}`}
                onClick={() => setSessionInputMode("text")}>
                <FileEdit size={16} strokeWidth={1.5} /> Direct Input
                <span className={styles.uploadTypeDesc}>Type or paste session minutes directly</span>
              </button>
              <button className={`${styles.uploadTypeBtn} ${sessionInputMode === "ocr" ? styles.uploadTypeBtnActive : ""}`}
                onClick={() => setSessionInputMode("ocr")}>
                <Camera size={16} strokeWidth={1.5} /> Upload Image (OCR)
                <span className={styles.uploadTypeDesc}>Scan handwritten or printed paper</span>
              </button>
            </div>
            <div className={styles.sessionFormGrid}>
              <div className={styles.sessionFormCol}>
                <label className={styles.fieldLabel}>Session Number</label>
                <input className={styles.input} placeholder="e.g. 12th Regular Session" value={sessionForm.session_number}
                  onChange={(e) => setSessionForm({ ...sessionForm, session_number: e.target.value })} />
              </div>
              <div className={styles.sessionFormCol}>
                <label className={styles.fieldLabel}>Session Date <span style={{ color: "#e53e3e" }}>*</span></label>
                <input className={styles.input} type="date" value={sessionForm.session_date}
                  onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })} />
              </div>
              <div className={styles.sessionFormCol}>
                <label className={styles.fieldLabel}>Session Type</label>
                <select className={styles.input} value={sessionForm.session_type}
                  onChange={(e) => setSessionForm({ ...sessionForm, session_type: e.target.value })}>
                  <option value="regular">Regular Session</option>
                  <option value="special">Special Session</option>
                </select>
              </div>
              <div className={styles.sessionFormCol}>
                <label className={styles.fieldLabel}>Venue</label>
                <input className={styles.input} placeholder="e.g. Session Hall, Balilihan Municipal Building" value={sessionForm.venue}
                  onChange={(e) => setSessionForm({ ...sessionForm, venue: e.target.value })} />
              </div>
            </div>
            {sessionInputMode === "text" ? (
              <>
                <label className={styles.fieldLabel}>Agenda Items <span className={styles.fieldHint}>(one item per line)</span></label>
                <textarea className={styles.textArea} placeholder={"1. Call to order\n2. Roll call\n3. Reading of minutes\n..."}
                  value={sessionForm.agenda} onChange={(e) => setSessionForm({ ...sessionForm, agenda: e.target.value })} rows={5} />
                <label className={styles.fieldLabel} style={{ marginTop: "10px" }}>Minutes of the Session</label>
                <textarea className={styles.textArea} placeholder="Type the full session minutes here..."
                  value={sessionForm.minutes_text} onChange={(e) => setSessionForm({ ...sessionForm, minutes_text: e.target.value })} rows={8} />
              </>
            ) : (
              <>
                <label className={styles.fieldLabel}>OCR will extract text for:</label>
                <div className={styles.uploadTypeRow} style={{ marginBottom: "10px" }}>
                  <button className={`${styles.uploadTypeBtn} ${sessionOcrTarget === "minutes" ? styles.uploadTypeBtnActive : ""}`}
                    onClick={() => setSessionOcrTarget("minutes")} style={{ flex: 1 }}>
                    <FileText size={14} /> Minutes Text
                    <span className={styles.uploadTypeDesc}>OCR text becomes session minutes</span>
                  </button>
                  <button className={`${styles.uploadTypeBtn} ${sessionOcrTarget === "agenda" ? styles.uploadTypeBtnActive : ""}`}
                    onClick={() => setSessionOcrTarget("agenda")} style={{ flex: 1 }}>
                    <ClipboardList size={14} /> Agenda
                    <span className={styles.uploadTypeDesc}>OCR text becomes agenda items</span>
                  </button>
                </div>
                <div className={styles.fileUploadBox}>
                  <input type="file" accept="image/*" id="sessionFileInput" style={{ display: "none" }}
                    onChange={(e) => setSessionFile(e.target.files[0])} />
                  <label htmlFor="sessionFileInput" className={styles.fileLabel}>
                    {sessionFile
                      ? <><CheckSquare size={14} strokeWidth={1.5} /> {sessionFile.name}</>
                      : <><Upload size={14} strokeWidth={1.5} /> Click to choose image (JPG, PNG)</>}
                  </label>
                  <p className={styles.fileHint}>Accepted: JPG, PNG — handwritten or printed document</p>
                </div>
                {sessionOcrTarget === "minutes" && (
                  <>
                    <label className={styles.fieldLabel}>Agenda Items <span className={styles.fieldHint}>(optional, one per line)</span></label>
                    <textarea className={styles.textArea} placeholder={"1. Call to order\n2. Roll call\n..."}
                      value={sessionForm.agenda} onChange={(e) => setSessionForm({ ...sessionForm, agenda: e.target.value })} rows={4} />
                  </>
                )}
                {sessionOcrTarget === "agenda" && (
                  <>
                    <label className={styles.fieldLabel}>Minutes Text <span className={styles.fieldHint}>(optional)</span></label>
                    <textarea className={styles.textArea} placeholder="Type session minutes or leave blank..."
                      value={sessionForm.minutes_text} onChange={(e) => setSessionForm({ ...sessionForm, minutes_text: e.target.value })} rows={4} />
                  </>
                )}
              </>
            )}
            <ModalAlert />
            <div className={styles.modalBtns}>
              <button className={styles.cancelBtn} onClick={() => { setShowSessionModal(false); resetSessionForm(); setModalMessage(""); }}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleAddSession} disabled={submitting}>
                {submitting ? (sessionInputMode === "ocr" ? "Extracting & Saving..." : "Saving...") : "Save Session"}
              </button>
            </div>
          </div>
        </div>
=======
        <div className={styles.modalOverlay}><div className={`${styles.modal} ${styles.sessionModal}`}>
          <h2 className={styles.modalTitle}><BookOpen size={18} strokeWidth={1.5} /> Add Session Minutes &amp; Agenda</h2>
          <div className={styles.uploadTypeRow}>
            <button className={`${styles.uploadTypeBtn} ${sessionInputMode === "text" ? styles.uploadTypeBtnActive : ""}`} onClick={() => setSessionInputMode("text")}>
              <FileEdit size={16} strokeWidth={1.5} /> Direct Input<span className={styles.uploadTypeDesc}>Type or paste session minutes directly</span>
            </button>
            <button className={`${styles.uploadTypeBtn} ${sessionInputMode === "ocr" ? styles.uploadTypeBtnActive : ""}`} onClick={() => setSessionInputMode("ocr")}>
              <Camera size={16} strokeWidth={1.5} /> Upload Image (OCR)<span className={styles.uploadTypeDesc}>Scan handwritten or printed paper</span>
            </button>
          </div>
          <div className={styles.sessionFormGrid}>
            <div className={styles.sessionFormCol}>
              <label className={styles.fieldLabel}>Session Number</label>
              <input className={styles.input} placeholder="e.g. 12th Regular Session" value={sessionForm.session_number} onChange={(e) => setSessionForm({ ...sessionForm, session_number: e.target.value })} />
            </div>
            <div className={styles.sessionFormCol}>
              <label className={styles.fieldLabel}>Session Date <span style={{ color: "#e53e3e" }}>*</span></label>
              <input className={styles.input} type="date" value={sessionForm.session_date} onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })} />
            </div>
            <div className={styles.sessionFormCol}>
              <label className={styles.fieldLabel}>Session Type</label>
              <select className={styles.input} value={sessionForm.session_type} onChange={(e) => setSessionForm({ ...sessionForm, session_type: e.target.value })}>
                <option value="regular">Regular Session</option>
                <option value="special">Special Session</option>
              </select>
            </div>
            <div className={styles.sessionFormCol}>
              <label className={styles.fieldLabel}>Venue</label>
              <input className={styles.input} placeholder="e.g. Session Hall, Balilihan Municipal Building" value={sessionForm.venue} onChange={(e) => setSessionForm({ ...sessionForm, venue: e.target.value })} />
            </div>
          </div>
          {sessionInputMode === "text" ? (
            <>
              <label className={styles.fieldLabel}>Agenda Items <span className={styles.fieldHint}>(one item per line)</span></label>
              <textarea className={styles.textArea} placeholder={"1. Call to order\n2. Roll call\n3. Reading of minutes\n..."} value={sessionForm.agenda} onChange={(e) => setSessionForm({ ...sessionForm, agenda: e.target.value })} rows={5} />
              <label className={styles.fieldLabel} style={{ marginTop: "10px" }}>Minutes of the Session</label>
              <textarea className={styles.textArea} placeholder="Type the full session minutes here..." value={sessionForm.minutes_text} onChange={(e) => setSessionForm({ ...sessionForm, minutes_text: e.target.value })} rows={8} />
            </>
          ) : (
            <>
              <label className={styles.fieldLabel}>OCR will extract text for:</label>
              <div className={styles.uploadTypeRow} style={{ marginBottom: "10px" }}>
                <button className={`${styles.uploadTypeBtn} ${sessionOcrTarget === "minutes" ? styles.uploadTypeBtnActive : ""}`} onClick={() => setSessionOcrTarget("minutes")} style={{ flex: 1 }}>
                  <FileText size={14} /> Minutes Text<span className={styles.uploadTypeDesc}>OCR text becomes session minutes</span>
                </button>
                <button className={`${styles.uploadTypeBtn} ${sessionOcrTarget === "agenda" ? styles.uploadTypeBtnActive : ""}`} onClick={() => setSessionOcrTarget("agenda")} style={{ flex: 1 }}>
                  <ClipboardList size={14} /> Agenda<span className={styles.uploadTypeDesc}>OCR text becomes agenda items</span>
                </button>
              </div>
              <div className={styles.fileUploadBox}>
                <input type="file" accept="image/*" id="sessionFileInput" style={{ display: "none" }} onChange={(e) => setSessionFile(e.target.files[0])} />
                <label htmlFor="sessionFileInput" className={styles.fileLabel}>
                  {sessionFile ? <><CheckSquare size={14} strokeWidth={1.5} /> {sessionFile.name}</> : <><Upload size={14} strokeWidth={1.5} /> Click to choose image (JPG, PNG)</>}
                </label>
                <p className={styles.fileHint}>Accepted: JPG, PNG — handwritten or printed document</p>
              </div>
              {sessionOcrTarget === "minutes" && (
                <>
                  <label className={styles.fieldLabel}>Agenda Items <span className={styles.fieldHint}>(optional, one per line)</span></label>
                  <textarea className={styles.textArea} placeholder={"1. Call to order\n2. Roll call\n..."} value={sessionForm.agenda} onChange={(e) => setSessionForm({ ...sessionForm, agenda: e.target.value })} rows={4} />
                </>
              )}
              {sessionOcrTarget === "agenda" && (
                <>
                  <label className={styles.fieldLabel}>Minutes Text <span className={styles.fieldHint}>(optional)</span></label>
                  <textarea className={styles.textArea} placeholder="Type session minutes or leave blank..." value={sessionForm.minutes_text} onChange={(e) => setSessionForm({ ...sessionForm, minutes_text: e.target.value })} rows={4} />
                </>
              )}
            </>
          )}
          <ModalAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowSessionModal(false); resetSessionForm(); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleAddSession} disabled={submitting}>{submitting ? (sessionInputMode === "ocr" ? "Extracting & Saving..." : "Saving...") : "Save Session"}</button>
          </div>
        </div></div>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      )}

      {/* Edit Session */}
      {showEditSessionModal && editingSession && (
<<<<<<< HEAD
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} ${styles.sessionModal}`}>
            <h2 className={styles.modalTitle}><Pencil size={16} strokeWidth={1.5} /> Edit Session Minutes</h2>
            <div className={styles.sessionFormGrid}>
              <div className={styles.sessionFormCol}>
                <label className={styles.fieldLabel}>Session Number</label>
                <input className={styles.input} placeholder="e.g. 12th Regular Session" value={editSessionForm.session_number}
                  onChange={(e) => setEditSessionForm({ ...editSessionForm, session_number: e.target.value })} />
              </div>
              <div className={styles.sessionFormCol}>
                <label className={styles.fieldLabel}>Session Date <span style={{ color: "#e53e3e" }}>*</span></label>
                <input className={styles.input} type="date" value={editSessionForm.session_date}
                  onChange={(e) => setEditSessionForm({ ...editSessionForm, session_date: e.target.value })} />
              </div>
              <div className={styles.sessionFormCol}>
                <label className={styles.fieldLabel}>Session Type</label>
                <select className={styles.input} value={editSessionForm.session_type}
                  onChange={(e) => setEditSessionForm({ ...editSessionForm, session_type: e.target.value })}>
                  <option value="regular">Regular Session</option>
                  <option value="special">Special Session</option>
                </select>
              </div>
              <div className={styles.sessionFormCol}>
                <label className={styles.fieldLabel}>Venue</label>
                <input className={styles.input} placeholder="Venue" value={editSessionForm.venue}
                  onChange={(e) => setEditSessionForm({ ...editSessionForm, venue: e.target.value })} />
              </div>
            </div>
            <label className={styles.fieldLabel}>Agenda Items <span className={styles.fieldHint}>(one item per line)</span></label>
            <textarea className={styles.textArea} value={editSessionForm.agenda}
              onChange={(e) => setEditSessionForm({ ...editSessionForm, agenda: e.target.value })} rows={5} />
            <label className={styles.fieldLabel} style={{ marginTop: "10px" }}>Minutes of the Session</label>
            <textarea className={styles.textArea} value={editSessionForm.minutes_text}
              onChange={(e) => setEditSessionForm({ ...editSessionForm, minutes_text: e.target.value })} rows={8} />
            <ModalAlert />
            <div className={styles.modalBtns}>
              <button className={styles.cancelBtn} onClick={() => { setShowEditSessionModal(false); setEditingSession(null); setModalMessage(""); }}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleUpdateSession} disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
=======
        <div className={styles.modalOverlay}><div className={`${styles.modal} ${styles.sessionModal}`}>
          <h2 className={styles.modalTitle}><Pencil size={16} strokeWidth={1.5} /> Edit Session Minutes</h2>
          <div className={styles.sessionFormGrid}>
            <div className={styles.sessionFormCol}>
              <label className={styles.fieldLabel}>Session Number</label>
              <input className={styles.input} placeholder="e.g. 12th Regular Session" value={editSessionForm.session_number} onChange={(e) => setEditSessionForm({ ...editSessionForm, session_number: e.target.value })} />
            </div>
            <div className={styles.sessionFormCol}>
              <label className={styles.fieldLabel}>Session Date <span style={{ color: "#e53e3e" }}>*</span></label>
              <input className={styles.input} type="date" value={editSessionForm.session_date} onChange={(e) => setEditSessionForm({ ...editSessionForm, session_date: e.target.value })} />
            </div>
            <div className={styles.sessionFormCol}>
              <label className={styles.fieldLabel}>Session Type</label>
              <select className={styles.input} value={editSessionForm.session_type} onChange={(e) => setEditSessionForm({ ...editSessionForm, session_type: e.target.value })}>
                <option value="regular">Regular Session</option>
                <option value="special">Special Session</option>
              </select>
            </div>
            <div className={styles.sessionFormCol}>
              <label className={styles.fieldLabel}>Venue</label>
              <input className={styles.input} placeholder="Venue" value={editSessionForm.venue} onChange={(e) => setEditSessionForm({ ...editSessionForm, venue: e.target.value })} />
            </div>
          </div>
          <label className={styles.fieldLabel}>Agenda Items <span className={styles.fieldHint}>(one item per line)</span></label>
          <textarea className={styles.textArea} value={editSessionForm.agenda} onChange={(e) => setEditSessionForm({ ...editSessionForm, agenda: e.target.value })} rows={5} />
          <label className={styles.fieldLabel} style={{ marginTop: "10px" }}>Minutes of the Session</label>
          <textarea className={styles.textArea} value={editSessionForm.minutes_text} onChange={(e) => setEditSessionForm({ ...editSessionForm, minutes_text: e.target.value })} rows={8} />
          <ModalAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowEditSessionModal(false); setEditingSession(null); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleUpdateSession} disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</button>
          </div>
        </div></div>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      )}

      {/* Add Announcement */}
      {showAnnouncementModal && (
<<<<<<< HEAD
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} ${styles.sessionModal}`}>
            <h2 className={styles.modalTitle}><Megaphone size={18} strokeWidth={1.5} /> New Announcement</h2>
            <label className={styles.fieldLabel}>Title <span style={{ color: "#e53e3e" }}>*</span></label>
            <input className={styles.input} placeholder="Announcement title..." value={announcementForm.title}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} />
            <label className={styles.fieldLabel}>Priority Level</label>
            <div className={styles.priorityRow}>
              {["urgent", "high", "normal", "low"].map((p) => {
                const cfg = priorityConfig[p];
                return (
                  <button key={p} className={`${styles.priorityBtn} ${announcementForm.priority === p ? styles.priorityBtnActive : ""}`}
                    style={announcementForm.priority === p ? { background: cfg.bg, borderColor: cfg.border, color: cfg.color } : {}}
                    onClick={() => setAnnouncementForm({ ...announcementForm, priority: p })}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
            <label className={styles.fieldLabel}>Announcement Body <span style={{ color: "#e53e3e" }}>*</span></label>
            <textarea className={styles.textArea} placeholder="Write your announcement here..." value={announcementForm.body}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, body: e.target.value })} rows={7} style={{ height: "auto" }} />
            <label className={styles.fieldLabel}>Expiry Date <span className={styles.fieldHint}>(optional — leave blank for no expiry)</span></label>
            <input className={styles.input} type="date" value={announcementForm.expires_at}
              onChange={(e) => setAnnouncementForm({ ...announcementForm, expires_at: e.target.value })} />
            <ModalAlert />
            <div className={styles.modalBtns}>
              <button className={styles.cancelBtn} onClick={() => { setShowAnnouncementModal(false); resetAnnouncementForm(); setModalMessage(""); }}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleAddAnnouncement} disabled={submitting}>{submitting ? "Posting..." : "Post Announcement"}</button>
            </div>
          </div>
        </div>
=======
        <div className={styles.modalOverlay}><div className={`${styles.modal} ${styles.sessionModal}`}>
          <h2 className={styles.modalTitle}><Megaphone size={18} strokeWidth={1.5} /> New Announcement</h2>
          <label className={styles.fieldLabel}>Title <span style={{ color: "#e53e3e" }}>*</span></label>
          <input className={styles.input} placeholder="Announcement title..." value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} />
          <label className={styles.fieldLabel}>Priority Level</label>
          <div className={styles.priorityRow}>
            {["urgent", "high", "normal", "low"].map((p) => {
              const cfg = priorityConfig[p];
              return (
                <button key={p} className={`${styles.priorityBtn} ${announcementForm.priority === p ? styles.priorityBtnActive : ""}`}
                  style={announcementForm.priority === p ? { background: cfg.bg, borderColor: cfg.border, color: cfg.color } : {}}
                  onClick={() => setAnnouncementForm({ ...announcementForm, priority: p })}>{cfg.label}</button>
              );
            })}
          </div>
          <label className={styles.fieldLabel}>Announcement Body <span style={{ color: "#e53e3e" }}>*</span></label>
          <textarea className={styles.textArea} placeholder="Write your announcement here..." value={announcementForm.body} onChange={(e) => setAnnouncementForm({ ...announcementForm, body: e.target.value })} rows={7} style={{ height: "auto" }} />
          <label className={styles.fieldLabel}>Expiry Date <span className={styles.fieldHint}>(optional — leave blank for no expiry)</span></label>
          <input className={styles.input} type="date" value={announcementForm.expires_at} onChange={(e) => setAnnouncementForm({ ...announcementForm, expires_at: e.target.value })} />
          <ModalAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowAnnouncementModal(false); resetAnnouncementForm(); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleAddAnnouncement} disabled={submitting}>{submitting ? "Posting..." : "Post Announcement"}</button>
          </div>
        </div></div>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      )}

      {/* Edit Announcement */}
      {showEditAnnouncementModal && editingAnnouncement && (
<<<<<<< HEAD
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} ${styles.sessionModal}`}>
            <h2 className={styles.modalTitle}><Pencil size={16} strokeWidth={1.5} /> Edit Announcement</h2>
            <label className={styles.fieldLabel}>Title <span style={{ color: "#e53e3e" }}>*</span></label>
            <input className={styles.input} placeholder="Announcement title..." value={editAnnouncementForm.title}
              onChange={(e) => setEditAnnouncementForm({ ...editAnnouncementForm, title: e.target.value })} />
            <label className={styles.fieldLabel}>Priority Level</label>
            <div className={styles.priorityRow}>
              {["urgent", "high", "normal", "low"].map((p) => {
                const cfg = priorityConfig[p];
                return (
                  <button key={p} className={`${styles.priorityBtn} ${editAnnouncementForm.priority === p ? styles.priorityBtnActive : ""}`}
                    style={editAnnouncementForm.priority === p ? { background: cfg.bg, borderColor: cfg.border, color: cfg.color } : {}}
                    onClick={() => setEditAnnouncementForm({ ...editAnnouncementForm, priority: p })}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
            <label className={styles.fieldLabel}>Announcement Body <span style={{ color: "#e53e3e" }}>*</span></label>
            <textarea className={styles.textArea} value={editAnnouncementForm.body}
              onChange={(e) => setEditAnnouncementForm({ ...editAnnouncementForm, body: e.target.value })} rows={7} style={{ height: "auto" }} />
            <label className={styles.fieldLabel}>Expiry Date <span className={styles.fieldHint}>(optional)</span></label>
            <input className={styles.input} type="date" value={editAnnouncementForm.expires_at}
              onChange={(e) => setEditAnnouncementForm({ ...editAnnouncementForm, expires_at: e.target.value })} />
            <ModalAlert />
            <div className={styles.modalBtns}>
              <button className={styles.cancelBtn} onClick={() => { setShowEditAnnouncementModal(false); setEditingAnnouncement(null); setModalMessage(""); }}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleUpdateAnnouncement} disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</button>
            </div>
          </div>
        </div>
=======
        <div className={styles.modalOverlay}><div className={`${styles.modal} ${styles.sessionModal}`}>
          <h2 className={styles.modalTitle}><Pencil size={16} strokeWidth={1.5} /> Edit Announcement</h2>
          <label className={styles.fieldLabel}>Title <span style={{ color: "#e53e3e" }}>*</span></label>
          <input className={styles.input} placeholder="Announcement title..." value={editAnnouncementForm.title} onChange={(e) => setEditAnnouncementForm({ ...editAnnouncementForm, title: e.target.value })} />
          <label className={styles.fieldLabel}>Priority Level</label>
          <div className={styles.priorityRow}>
            {["urgent", "high", "normal", "low"].map((p) => {
              const cfg = priorityConfig[p];
              return (
                <button key={p} className={`${styles.priorityBtn} ${editAnnouncementForm.priority === p ? styles.priorityBtnActive : ""}`}
                  style={editAnnouncementForm.priority === p ? { background: cfg.bg, borderColor: cfg.border, color: cfg.color } : {}}
                  onClick={() => setEditAnnouncementForm({ ...editAnnouncementForm, priority: p })}>{cfg.label}</button>
              );
            })}
          </div>
          <label className={styles.fieldLabel}>Announcement Body <span style={{ color: "#e53e3e" }}>*</span></label>
          <textarea className={styles.textArea} value={editAnnouncementForm.body} onChange={(e) => setEditAnnouncementForm({ ...editAnnouncementForm, body: e.target.value })} rows={7} style={{ height: "auto" }} />
          <label className={styles.fieldLabel}>Expiry Date <span className={styles.fieldHint}>(optional)</span></label>
          <input className={styles.input} type="date" value={editAnnouncementForm.expires_at} onChange={(e) => setEditAnnouncementForm({ ...editAnnouncementForm, expires_at: e.target.value })} />
          <ModalAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowEditAnnouncementModal(false); setEditingAnnouncement(null); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleUpdateAnnouncement} disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</button>
          </div>
        </div></div>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      )}

      {/* Add Local Event */}
      {showLocalEventModal && (
<<<<<<< HEAD
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}><PlusCircle size={16} /> Add Event</h2>
            <EventFormFields form={localEventForm} setForm={setLocalEventForm} />
            <ModalAlert />
            <div className={styles.modalBtns}>
              <button className={styles.cancelBtn} onClick={() => { setShowLocalEventModal(false); setModalMessage(""); }}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleSaveLocalEvent} disabled={savingLocalEvent}>
                {savingLocalEvent ? "Saving..." : "Save Event"}
              </button>
            </div>
          </div>
        </div>
=======
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <h2 className={styles.modalTitle}><PlusCircle size={16} /> Add Event</h2>
          <EventFormFields form={localEventForm} setForm={setLocalEventForm} />
          <ModalAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowLocalEventModal(false); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleSaveLocalEvent} disabled={savingLocalEvent}>{savingLocalEvent ? "Saving..." : "Save Event"}</button>
          </div>
        </div></div>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      )}

      {/* Edit Local Event */}
      {showEditEventModal && editingEvent && (
<<<<<<< HEAD
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}><Pencil size={16} /> Edit Event</h2>
            <EventFormFields form={editEventForm} setForm={setEditEventForm} />
            <ModalAlert />
            <div className={styles.modalBtns}>
              <button className={styles.cancelBtn} onClick={() => { setShowEditEventModal(false); setEditingEvent(null); setModalMessage(""); }}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleUpdateEvent} disabled={savingLocalEvent}>
                {savingLocalEvent ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
=======
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <h2 className={styles.modalTitle}><Pencil size={16} /> Edit Event</h2>
          <EventFormFields form={editEventForm} setForm={setEditEventForm} />
          <ModalAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowEditEventModal(false); setEditingEvent(null); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleUpdateEvent} disabled={savingLocalEvent}>{savingLocalEvent ? "Saving..." : "Save Changes"}</button>
          </div>
        </div></div>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
      )}

      {/* Event Detail Modal */}
      {showEventDetailModal && selectedEvent && (() => {
        const ev = selectedEvent;
<<<<<<< HEAD
        const start = ev.start?.dateTime
          ? new Date(ev.start.dateTime)
          : ev.start?.date ? new Date(ev.start.date + "T00:00:00") : null;
        const end = ev.end?.dateTime
          ? new Date(ev.end.dateTime)
          : ev.end?.date ? new Date(ev.end.date + "T00:00:00") : null;
        const c = chipStyle(ev);
        return (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: c.dot, flexShrink: 0, display: "inline-block" }} />
                <h2 className={styles.modalTitle} style={{ margin: 0 }}>{ev.isHoliday ? "🇵🇭 " : ""}{ev.summary}</h2>
              </div>
              {ev.isHoliday && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6,
                  fontSize: 12, fontWeight: 600, background: c.bg, color: c.color, border: `1px solid ${c.dot}`, marginBottom: 10 }}>
                  {ev.holidayType === "national" ? "🇵🇭 National Regular Holiday" :
                    ev.holidayType === "special-working" ? "✅ Special Working Holiday" :
                    ev.holidayType === "local-fiesta" ? "🎉 Local Fiesta / Founding Anniversary" :
                    "📅 Special Non-Working Day"}
                </div>
              )}
              {start && (
                <div style={{ fontSize: 13, color: "#4a5568", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                  <Clock size={13} />
                  {start.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                  {!ev.isHoliday && !ev.all_day && ev.start?.dateTime &&
                    ` • ${start.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })} – ${end?.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}`}
                </div>
              )}
              {ev.location && (
                <div style={{ fontSize: 13, color: "#4a5568", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                  <MapPin size={13} />{ev.location}
                </div>
              )}
              {ev.description && <div className={styles.calEventDetailDesc}>{ev.description}</div>}
              <div className={styles.modalBtns}>
                {ev.isLocal && (
                  <>
                    <button className={styles.editBtn} onClick={() => handleOpenEditEvent(ev)}><Pencil size={13} /> Edit</button>
                    <button className={styles.deleteBtn} onClick={() => { if (window.confirm("Delete this event?")) handleDeleteEvent(ev.dbId); }}>
                      <Trash2 size={13} /> Delete
                    </button>
                  </>
                )}
                <button className={styles.confirmBtn} onClick={() => setShowEventDetailModal(false)}>Close</button>
              </div>
            </div>
          </div>
=======
        const start = ev.start?.dateTime ? new Date(ev.start.dateTime) : ev.start?.date ? new Date(ev.start.date + "T00:00:00") : null;
        const end = ev.end?.dateTime ? new Date(ev.end.dateTime) : ev.end?.date ? new Date(ev.end.date + "T00:00:00") : null;
        const c = chipStyle(ev);
        return (
          <div className={styles.modalOverlay}><div className={styles.modal}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: c.dot, flexShrink: 0, display: "inline-block" }} />
              <h2 className={styles.modalTitle} style={{ margin: 0 }}>{ev.isHoliday ? "🇵🇭 " : ""}{ev.summary}</h2>
            </div>
            {ev.isHoliday && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: c.bg, color: c.color, border: `1px solid ${c.dot}`, marginBottom: 10 }}>
                {ev.holidayType === "national" ? "🇵🇭 National Regular Holiday" : ev.holidayType === "special-working" ? "✅ Special Working Holiday" : ev.holidayType === "local-fiesta" ? "🎉 Local Fiesta / Founding Anniversary" : "📅 Special Non-Working Day"}
              </div>
            )}
            {start && (
              <div style={{ fontSize: 13, color: "#4a5568", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                <Clock size={13} />
                {start.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                {!ev.isHoliday && !ev.all_day && ev.start?.dateTime && ` • ${start.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })} – ${end?.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}`}
              </div>
            )}
            {ev.location && <div style={{ fontSize: 13, color: "#4a5568", marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}><MapPin size={13} />{ev.location}</div>}
            {ev.description && <div className={styles.calEventDetailDesc}>{ev.description}</div>}
            <div className={styles.modalBtns}>
              {ev.isLocal && (
                <>
                  <button className={styles.editBtn} onClick={() => handleOpenEditEvent(ev)}><Pencil size={13} /> Edit</button>
                  <button className={styles.deleteBtn} onClick={() => { if (window.confirm("Delete this event?")) handleDeleteEvent(ev.dbId); }}><Trash2 size={13} /> Delete</button>
                </>
              )}
              <button className={styles.confirmBtn} onClick={() => setShowEventDetailModal(false)}>Close</button>
            </div>
          </div></div>
>>>>>>> 721b5466ff4543314d0b40489b54e4521ac3f38d
        );
      })()}

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmModal
          type="delete"
          title={`Delete this ${deleteTarget.type}?`}
          message={`"${deleteTarget.name}" will be permanently removed. This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => {
            if (deleteTarget.type === "user")              handleDeleteUser(deleteTarget.id);
            else if (deleteTarget.type === "ordinance")    handleDeleteOrdinance(deleteTarget.id);
            else if (deleteTarget.type === "resolution")   handleDeleteResolution(deleteTarget.id);
            else if (deleteTarget.type === "official")     handleDeleteOfficial(deleteTarget.id);
            else if (deleteTarget.type === "session")      handleDeleteSession(deleteTarget.id);
            else if (deleteTarget.type === "announcement") handleDeleteAnnouncement(deleteTarget.id);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}