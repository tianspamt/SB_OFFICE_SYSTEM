import { useEffect, useState } from "react";
import styles from "./AdminDashboard.module.css";
import logo from '../assets/image/balilihan-logo-Large-1.png'
import {
  Users, ShieldCheck, ScrollText, Landmark, X, LogOut,
  AlertCircle, BookOpen, Gavel, Megaphone, ChevronDown,
  ChevronRight, Calendar, PlusCircle, Activity, RefreshCw, History,
  FileText, Image, Upload, CheckSquare, FileEdit, Camera,
  ClipboardList, Copy, Eye, Pencil, Trash2,
} from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import { API, authFetch, toIsoDate, toLocalIso, formatDate, priorityConfig, tabTitles } from "./AdminContext";
import { TermStatusBadge, ModalAlert, TermFormFields, OfficialsCheckList, EventFormFields } from "./AdminComponents";
import UsersPage from "./UsersPage";
import AdminsPage from "./AdminsPage";
import OrdinancesPage from "./OrdinancesPage";
import ResolutionsPage from "./ResolutionsPage";
import OfficialsPage from "./OfficialsPage";
import SessionsPage from "./SessionsPage";
import AnnouncementsPage from "./AnnouncementsPage";
import CalendarPage from "./CalendarPage";
import LogsPage from "./LogsPage";

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

  // ── PH Holidays ──
  const [phHolidays, setPhHolidays] = useState({});
  const [fetchingHolidays, setFetchingHolidays] = useState(false);
  const [showHolidays, setShowHolidays] = useState(true);

  // ── loading flags ──
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [fetchingOrdinances, setFetchingOrdinances] = useState(false);
  const [fetchingOfficials, setFetchingOfficials] = useState(false);
  const [fetchingMinutes, setFetchingMinutes] = useState(false);
  const [fetchingResolutions, setFetchingResolutions] = useState(false);
  const [fetchingAnnouncements, setFetchingAnnouncements] = useState(false);

  // ── activity logs ──
  const [logs, setLogs] = useState([]);
  const [logStats, setLogStats] = useState(null);
  const [fetchingLogs, setFetchingLogs] = useState(false);
  const [logModuleFilter, setLogModuleFilter] = useState("all");
  const [logActionFilter, setLogActionFilter] = useState("all");

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
  const [showAddTermModal, setShowAddTermModal] = useState(false);
  const [showEditTermModal, setShowEditTermModal] = useState(false);
  const [termTarget, setTermTarget] = useState(null);

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

  // officials
  const [officials, setOfficials] = useState([]);
  const [newOfficial, setNewOfficial] = useState({ full_name: "", position: "", term_period: "", term_start: "", term_end: "", is_reelected: false, notes: "" });
  const [officialPhoto, setOfficialPhoto] = useState(null);
  const [selectedOfficialProfile, setSelectedOfficialProfile] = useState(null);
  const emptyTermForm = { term_period: "", term_start: "", term_end: "", status: "active", is_reelected: false, notes: "" };
  const [termForm, setTermForm] = useState(emptyTermForm);

  // sessions
  const [sessionMinutes, setSessionMinutes] = useState([]);
  const [sessionInputMode, setSessionInputMode] = useState("text");
  const [sessionForm, setSessionForm] = useState({ session_number: "", session_date: "", session_type: "regular", venue: "", agenda: "", minutes_text: "" });
  const [sessionFile, setSessionFile] = useState(null);
  const [sessionOcrTarget, setSessionOcrTarget] = useState("minutes");
  const [editingSession, setEditingSession] = useState(null);
  const [editSessionForm, setEditSessionForm] = useState({ session_number: "", session_date: "", session_type: "regular", venue: "", agenda: "", minutes_text: "" });

  // announcements
  const [announcements, setAnnouncements] = useState([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", body: "", priority: "normal", expires_at: "" });
  const [editAnnouncementForm, setEditAnnouncementForm] = useState({ title: "", body: "", priority: "normal", expires_at: "" });

  // calendar
  const [localEvents, setLocalEvents] = useState([]);
  const [fetchingCalendar, setFetchingCalendar] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [savingLocalEvent, setSavingLocalEvent] = useState(false);
  const [pendingEventDate, setPendingEventDate] = useState("");

  const emptyEventForm = { title: "", description: "", location: "", start_date: "", start_time: "08:00", end_date: "", end_time: "09:00", all_day: false, color: "#009439" };
  const [localEventForm, setLocalEventForm] = useState(emptyEventForm);
  const [editEventForm, setEditEventForm] = useState(emptyEventForm);

  // ─── Init ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!storedUser || !token) { window.location.replace("/"); return; }
    try {
      const u = JSON.parse(storedUser);
      if (u.role !== "admin") { window.location.replace("/"); return; }
      setAdmin(u);
    } catch { window.location.replace("/"); return; }
    fetchUsers(); fetchOrdinances(); fetchOfficials();
    fetchSessionMinutes(); fetchResolutions(); fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (activeTab === "calendar") {
      fetchLocalEvents();
      const year = new Date().getFullYear();
      fetchPHHolidays(year); fetchPHHolidays(year + 1);
    }
    if (activeTab === "logs") { fetchLogs(); fetchLogStats(); }
  }, [activeTab]);

  useEffect(() => { if (activeTab === "logs") fetchLogs(); }, [logModuleFilter, logActionFilter]);

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  const showMsg = (msg, type = "success") => { setMessage(msg); setMessageType(type); setTimeout(() => setMessage(""), 3500); };
  const showModalMsg = (msg, type = "success") => { setModalMessage(msg); setModalMessageType(type); setTimeout(() => setModalMessage(""), 3500); };
  const handleLogout = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.replace("/"); };
  const handleTabChange = (key) => { setActiveTab(key); setMobileOpen(false); };

  // ─── Fetches ──────────────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    setFetchingUsers(true);
    try {
      const res = await authFetch(`${API}/api/users`);
      if (res.status === 401 || res.status === 403) { localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.replace("/"); return; }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch { setUsers([]); } finally { setFetchingUsers(false); }
  };
  const fetchOrdinances = async () => { setFetchingOrdinances(true); try { const d = await (await fetch(`${API}/api/ordinances`)).json(); setOrdinances(Array.isArray(d) ? d : []); } catch { setOrdinances([]); } finally { setFetchingOrdinances(false); } };
  const fetchResolutions = async () => { setFetchingResolutions(true); try { const d = await (await fetch(`${API}/api/resolutions`)).json(); setResolutions(Array.isArray(d) ? d : []); } catch { setResolutions([]); } finally { setFetchingResolutions(false); } };
  const fetchOfficials = async () => { setFetchingOfficials(true); try { const d = await (await fetch(`${API}/api/sb-council-members`)).json(); setOfficials(Array.isArray(d) ? d : []); } catch { setOfficials([]); } finally { setFetchingOfficials(false); } };
  const fetchSessionMinutes = async () => { setFetchingMinutes(true); try { const d = await (await fetch(`${API}/api/session-minutes`)).json(); setSessionMinutes(Array.isArray(d) ? d : []); } catch { setSessionMinutes([]); } finally { setFetchingMinutes(false); } };
  const fetchAnnouncements = async () => { setFetchingAnnouncements(true); try { const d = await (await fetch(`${API}/api/announcements`)).json(); setAnnouncements(Array.isArray(d) ? d : []); } catch { setAnnouncements([]); } finally { setFetchingAnnouncements(false); } };
  const fetchLocalEvents = async () => { setFetchingCalendar(true); try { const d = await (await fetch(`${API}/api/calendar-events`)).json(); setLocalEvents(Array.isArray(d) ? d : []); } catch { setLocalEvents([]); } finally { setFetchingCalendar(false); } };
  const fetchLogs = async () => { setFetchingLogs(true); try { let url = `${API}/api/activity-logs?limit=100`; if (logModuleFilter !== "all") url += `&module=${logModuleFilter}`; if (logActionFilter !== "all") url += `&action=${logActionFilter}`; const d = await (await authFetch(url)).json(); setLogs(Array.isArray(d) ? d : []); } catch { setLogs([]); } finally { setFetchingLogs(false); } };
  const fetchLogStats = async () => { try { const d = await (await authFetch(`${API}/api/activity-logs/stats`)).json(); setLogStats(d); } catch {} };
  const fetchPHHolidays = async (year) => {
    if (phHolidays[year]) return;
    setFetchingHolidays(true);
    try {
      const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/PH`);
      const data = await res.json();
      setPhHolidays((prev) => ({ ...prev, [year]: data.map((h) => ({ date: h.date, name: h.localName || h.name, type: h.types?.includes("Public") ? "national" : "special" })) }));
    } catch { setPhHolidays((prev) => ({ ...prev, [year]: [] })); }
    finally { setFetchingHolidays(false); }
  };

  // ─── Users / Admins ───────────────────────────────────────────────────────────
  const handleAddAdmin = async () => {
    if (!newAdmin.name || !newAdmin.username || !newAdmin.email || !newAdmin.password) { showModalMsg("All fields required!", "error"); return; }
    setSubmitting(true);
    try { const res = await authFetch(`${API}/api/admin/add`, { method: "POST", body: JSON.stringify(newAdmin) }); const data = await res.json(); if (res.ok && data.success) { showMsg("Admin added!"); setNewAdmin({ name: "", username: "", email: "", password: "" }); setShowAddAdminModal(false); fetchUsers(); } else showModalMsg(data.error || "Failed!", "error"); } catch { showModalMsg("Server error!", "error"); } finally { setSubmitting(false); }
  };
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.username || !newUser.email || !newUser.password) { showModalMsg("All fields required!", "error"); return; }
    setSubmitting(true);
    try { const res = await fetch(`${API}/api/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newUser) }); const data = await res.json(); if (res.ok && data.success) { showMsg("User added!"); setNewUser({ name: "", username: "", email: "", password: "" }); setShowAddUserModal(false); fetchUsers(); } else showModalMsg(data.error || "Failed!", "error"); } catch { showModalMsg("Server error!", "error"); } finally { setSubmitting(false); }
  };
  const handleDeleteUser = async (id) => { try { const res = await authFetch(`${API}/api/users/${id}`, { method: "DELETE" }); const data = await res.json(); if (data.success) { showMsg("User deleted!"); fetchUsers(); } else showMsg(data.error || "Error!", "error"); } catch { showMsg("Error!", "error"); } };

  // ─── Ordinances ──────────────────────────────────────────────────────────────
  const handleUploadOrdinance = async () => {
    if (!ordinanceNumber || !ordinanceTitle || !ordinanceYear || !ordinanceFile || !uploadType) { showModalMsg("Please fill all fields and choose upload type!", "error"); return; }
    setSubmitting(true);
    const fd = new FormData(); fd.append("ordinance_number", ordinanceNumber); fd.append("title", ordinanceTitle); fd.append("year", ordinanceYear); fd.append("file", ordinanceFile); fd.append("officials", JSON.stringify(selectedOfficials)); fd.append("uploadType", uploadType);
    try { const ep = uploadType === "image-to-text" ? `${API}/api/ordinances/upload-image-text` : `${API}/api/ordinances/upload`; const res = await authFetch(ep, { method: "POST", body: fd }); const data = await res.json(); if (res.ok && data.success) { showMsg("Ordinance uploaded!"); if (uploadType === "image-to-text" && data.text) { setExtractedText(data.text); setShowTextModal(true); } setOrdinanceNumber(""); setOrdinanceTitle(""); setOrdinanceYear(""); setOrdinanceFile(null); setSelectedOfficials([]); setUploadType(""); setShowOrdinanceModal(false); fetchOrdinances(); } else showModalMsg(data.error || "Upload failed!", "error"); } catch { showModalMsg("Server error!", "error"); } finally { setSubmitting(false); }
  };
  const handleOpenEditOrdinance = (o) => { setEditingOrdinance(o); setEditOrdinanceNumber(o.ordinance_number || ""); setEditOrdinanceTitle(o.title); setEditOrdinanceYear(o.year || ""); setEditSelectedOfficials(o.officials ? o.officials.map((x) => x.id) : []); setEditOrdinanceFile(null); setModalMessage(""); setShowEditOrdinanceModal(true); };
  const toggleEditOfficial = (id) => setEditSelectedOfficials((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const handleUpdateOrdinance = async () => {
    if (!editOrdinanceNumber || !editOrdinanceTitle || !editOrdinanceYear) { showModalMsg("All fields required!", "error"); return; }
    setSubmitting(true);
    const fd = new FormData(); fd.append("ordinance_number", editOrdinanceNumber); fd.append("title", editOrdinanceTitle); fd.append("year", editOrdinanceYear); fd.append("officials", JSON.stringify(editSelectedOfficials)); if (editOrdinanceFile) fd.append("file", editOrdinanceFile);
    try { const res = await authFetch(`${API}/api/ordinances/${editingOrdinance.id}`, { method: "PUT", body: fd }); const data = await res.json(); if (res.ok && data.success) { showMsg("Ordinance updated!"); setShowEditOrdinanceModal(false); setEditingOrdinance(null); fetchOrdinances(); } else showModalMsg(data.error || "Update failed!", "error"); } catch { showModalMsg("Server error!", "error"); } finally { setSubmitting(false); }
  };
  const handleDeleteOrdinance = async (id) => { try { const res = await authFetch(`${API}/api/ordinances/${id}`, { method: "DELETE" }); const data = await res.json(); if (data.success) { showMsg("Deleted!"); fetchOrdinances(); } else showMsg(data.error || "Error!", "error"); } catch { showMsg("Error!", "error"); } };
  const toggleOfficial = (id) => setSelectedOfficials((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  // ─── Resolutions ─────────────────────────────────────────────────────────────
  const handleUploadResolution = async () => {
    if (!resolutionNumber || !resolutionTitle || !resolutionYear || !resolutionFile || !resolutionUploadType) { showModalMsg("Please fill all fields and choose upload type!", "error"); return; }
    setSubmitting(true);
    const fd = new FormData(); fd.append("resolution_number", resolutionNumber); fd.append("title", resolutionTitle); fd.append("year", resolutionYear); fd.append("file", resolutionFile); fd.append("officials", JSON.stringify(selectedResolutionOfficials)); fd.append("uploadType", resolutionUploadType);
    try { const ep = resolutionUploadType === "image-to-text" ? `${API}/api/resolutions/upload-image-text` : `${API}/api/resolutions/upload`; const res = await authFetch(ep, { method: "POST", body: fd }); const data = await res.json(); if (res.ok && data.success) { showMsg("Resolution uploaded!"); if (resolutionUploadType === "image-to-text" && data.text) { setExtractedText(data.text); setShowTextModal(true); } setResolutionNumber(""); setResolutionTitle(""); setResolutionYear(""); setResolutionFile(null); setSelectedResolutionOfficials([]); setResolutionUploadType(""); setShowResolutionModal(false); fetchResolutions(); } else showModalMsg(data.error || "Upload failed!", "error"); } catch { showModalMsg("Server error!", "error"); } finally { setSubmitting(false); }
  };
  const handleOpenEditResolution = (r) => { setEditingResolution(r); setEditResolutionNumber(r.resolution_number || ""); setEditResolutionTitle(r.title); setEditResolutionYear(r.year || ""); setEditResolutionSelectedOfficials(r.officials ? r.officials.map((x) => x.id) : []); setEditResolutionFile(null); setModalMessage(""); setShowEditResolutionModal(true); };
  const toggleEditResolutionOfficial = (id) => setEditResolutionSelectedOfficials((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  const handleUpdateResolution = async () => {
    if (!editResolutionNumber || !editResolutionTitle || !editResolutionYear) { showModalMsg("All fields required!", "error"); return; }
    setSubmitting(true);
    const fd = new FormData(); fd.append("resolution_number", editResolutionNumber); fd.append("title", editResolutionTitle); fd.append("year", editResolutionYear); fd.append("officials", JSON.stringify(editResolutionSelectedOfficials)); if (editResolutionFile) fd.append("file", editResolutionFile);
    try { const res = await authFetch(`${API}/api/resolutions/${editingResolution.id}`, { method: "PUT", body: fd }); const data = await res.json(); if (res.ok && data.success) { showMsg("Resolution updated!"); setShowEditResolutionModal(false); setEditingResolution(null); fetchResolutions(); } else showModalMsg(data.error || "Update failed!", "error"); } catch { showModalMsg("Server error!", "error"); } finally { setSubmitting(false); }
  };
  const handleDeleteResolution = async (id) => { try { const res = await authFetch(`${API}/api/resolutions/${id}`, { method: "DELETE" }); const data = await res.json(); if (data.success) { showMsg("Resolution deleted!"); fetchResolutions(); } else showMsg(data.error || "Error!", "error"); } catch { showMsg("Error!", "error"); } };
  const toggleResolutionOfficial = (id) => setSelectedResolutionOfficials((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  // ─── Officials ────────────────────────────────────────────────────────────────
  const handleAddOfficial = async () => {
    if (!newOfficial.full_name || !newOfficial.position) { showModalMsg("Full name and position are required!", "error"); return; }
    setSubmitting(true);
    const fd = new FormData(); fd.append("full_name", newOfficial.full_name); fd.append("position", newOfficial.position); if (newOfficial.term_period) fd.append("term_period", newOfficial.term_period); if (newOfficial.term_start) fd.append("term_start", newOfficial.term_start); if (newOfficial.term_end) fd.append("term_end", newOfficial.term_end); fd.append("is_reelected", newOfficial.is_reelected); if (newOfficial.notes) fd.append("notes", newOfficial.notes); if (officialPhoto) fd.append("photo", officialPhoto);
    try { const res = await authFetch(`${API}/api/sb-council-members/add`, { method: "POST", body: fd }); const data = await res.json(); if (res.ok && data.success) { showMsg("Council member added!"); setNewOfficial({ full_name: "", position: "", term_period: "", term_start: "", term_end: "", is_reelected: false, notes: "" }); setOfficialPhoto(null); setShowOfficialModal(false); fetchOfficials(); } else showModalMsg(data.error || "Failed!", "error"); } catch { showModalMsg("Server error!", "error"); } finally { setSubmitting(false); }
  };
  const handleDeleteOfficial = async (id) => { try { const res = await authFetch(`${API}/api/sb-council-members/${id}`, { method: "DELETE" }); const data = await res.json(); if (data.success) { showMsg("Council member deleted!"); fetchOfficials(); } else showMsg(data.error || "Error!", "error"); } catch { showMsg("Error!", "error"); } };
  const getOfficialOrdinances = (id) => ordinances.filter((o) => o.officials && o.officials.some((x) => x.id === id));

  // ─── Terms ────────────────────────────────────────────────────────────────────
  const handleOpenAddTerm = (memberId) => { setTermTarget({ memberId }); setTermForm(emptyTermForm); setModalMessage(""); setShowAddTermModal(true); };
  const handleSaveTerm = async () => {
    if (!termForm.term_period || !termForm.term_start) { showModalMsg("Term period and start date are required!", "error"); return; }
    setSubmitting(true);
    try { const res = await authFetch(`${API}/api/sb-council-members/${termTarget.memberId}/terms`, { method: "POST", body: JSON.stringify(termForm) }); const data = await res.json(); if (res.ok && data.success) { showMsg("Term added!"); setShowAddTermModal(false); fetchOfficials(); if (selectedOfficialProfile?.id === termTarget.memberId) { const updated = await (await fetch(`${API}/api/sb-council-members/${termTarget.memberId}`)).json(); setSelectedOfficialProfile(updated); } } else showModalMsg(data.error || "Failed!", "error"); } catch { showModalMsg("Server error!", "error"); } finally { setSubmitting(false); }
  };
  const handleOpenEditTerm = (memberId, term) => { setTermTarget({ memberId, term }); setTermForm({ term_period: term.term_period || "", term_start: term.term_start ? term.term_start.split("T")[0] : "", term_end: term.term_end ? term.term_end.split("T")[0] : "", status: term.status || "active", is_reelected: !!term.is_reelected, notes: term.notes || "" }); setModalMessage(""); setShowEditTermModal(true); };
  const handleUpdateTerm = async () => {
    if (!termForm.term_period || !termForm.term_start) { showModalMsg("Term period and start date are required!", "error"); return; }
    setSubmitting(true);
    try { const res = await authFetch(`${API}/api/sb-council-members/${termTarget.memberId}/terms/${termTarget.term.id}`, { method: "PUT", body: JSON.stringify(termForm) }); const data = await res.json(); if (res.ok && data.success) { showMsg("Term updated!"); setShowEditTermModal(false); fetchOfficials(); if (selectedOfficialProfile?.id === termTarget.memberId) { const updated = await (await fetch(`${API}/api/sb-council-members/${termTarget.memberId}`)).json(); setSelectedOfficialProfile(updated); } } else showModalMsg(data.error || "Failed!", "error"); } catch { showModalMsg("Server error!", "error"); } finally { setSubmitting(false); }
  };
  const handleDeleteTerm = async (memberId, termId) => { try { const res = await authFetch(`${API}/api/sb-council-members/${memberId}/terms/${termId}`, { method: "DELETE" }); const data = await res.json(); if (data.success) { showMsg("Term deleted!"); fetchOfficials(); if (selectedOfficialProfile?.id === memberId) { const updated = await (await fetch(`${API}/api/sb-council-members/${memberId}`)).json(); setSelectedOfficialProfile(updated); } } else showMsg(data.error || "Error!", "error"); } catch { showMsg("Error!", "error"); } };

  // ─── Sessions ─────────────────────────────────────────────────────────────────
  const resetSessionForm = () => { setSessionForm({ session_number: "", session_date: "", session_type: "regular", venue: "", agenda: "", minutes_text: "" }); setSessionFile(null); setSessionInputMode("text"); setSessionOcrTarget("minutes"); };
  const handleAddSession = async () => {
    if (!sessionForm.session_date) { showModalMsg("Session date is required!", "error"); return; }
    setSubmitting(true);
    try {
      if (sessionInputMode === "ocr") {
        if (!sessionFile) { showModalMsg("Please upload an image file!", "error"); setSubmitting(false); return; }
        const fd = new FormData(); Object.entries(sessionForm).forEach(([k, v]) => fd.append(k, v)); fd.append("file", sessionFile); fd.append("ocr_target", sessionOcrTarget);
        const res = await authFetch(`${API}/api/session-minutes/upload-image`, { method: "POST", body: fd }); const data = await res.json(); if (res.ok && data.success) { showMsg(`Session added! OCR extracted text from ${data.ocr_target}.`); resetSessionForm(); setShowSessionModal(false); fetchSessionMinutes(); } else showModalMsg(data.error || "Upload failed!", "error");
      } else {
        const res = await authFetch(`${API}/api/session-minutes`, { method: "POST", body: JSON.stringify(sessionForm) }); const data = await res.json(); if (res.ok && data.success) { showMsg("Session minutes saved!"); resetSessionForm(); setShowSessionModal(false); fetchSessionMinutes(); } else showModalMsg(data.error || "Save failed!", "error");
      }
    } catch { showModalMsg("Server error!", "error"); } finally { setSubmitting(false); }
  };
  const handleOpenEditSession = (s) => { setEditingSession(s); setEditSessionForm({ session_number: s.session_number || "", session_date: s.session_date ? s.session_date.split("T")[0] : "", session_type: s.session_type || "regular", venue: s.venue || "", agenda: s.agenda || "", minutes_text: s.minutes_text || "" }); setModalMessage(""); setShowEditSessionModal(true); };
  const handleUpdateSession = async () => {
    if (!editSessionForm.session_date) { showModalMsg("Session date is required!", "error"); return; }
    setSubmitting(true);
    try { const res = await authFetch(`${API}/api/session-minutes/${editingSession.id}`, { method: "PUT", body: JSON.stringify(editSessionForm) }); const data = await res.json(); if (res.ok && data.success) { showMsg("Session minutes updated!"); setShowEditSessionModal(false); setEditingSession(null); fetchSessionMinutes(); } else showModalMsg(data.error || "Update failed!", "error"); } catch { showModalMsg("Server error!", "error"); } finally { setSubmitting(false); }
  };
  const handleDeleteSession = async (id) => { try { const res = await authFetch(`${API}/api/session-minutes/${id}`, { method: "DELETE" }); const data = await res.json(); if (data.success) { showMsg("Session deleted!"); fetchSessionMinutes(); } else showMsg(data.error || "Error!", "error"); } catch { showMsg("Error!", "error"); } };

  // ─── Announcements ────────────────────────────────────────────────────────────
  const resetAnnouncementForm = () => setAnnouncementForm({ title: "", body: "", priority: "normal", expires_at: "" });
  const handleAddAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.body) { showModalMsg("Title and body are required!", "error"); return; }
    setSubmitting(true);
    try { const res = await authFetch(`${API}/api/announcements`, { method: "POST", body: JSON.stringify(announcementForm) }); const data = await res.json(); if (res.ok && data.success) { showMsg("Announcement posted!"); resetAnnouncementForm(); setShowAnnouncementModal(false); fetchAnnouncements(); } else showModalMsg(data.error || "Failed!", "error"); } catch { showModalMsg("Server error!", "error"); } finally { setSubmitting(false); }
  };
  const handleOpenEditAnnouncement = (a) => { setEditingAnnouncement(a); setEditAnnouncementForm({ title: a.title || "", body: a.body || "", priority: a.priority || "normal", expires_at: a.expires_at ? a.expires_at.split("T")[0] : "" }); setModalMessage(""); setShowEditAnnouncementModal(true); };
  const handleUpdateAnnouncement = async () => {
    if (!editAnnouncementForm.title || !editAnnouncementForm.body) { showModalMsg("Title and body are required!", "error"); return; }
    setSubmitting(true);
    try { const res = await authFetch(`${API}/api/announcements/${editingAnnouncement.id}`, { method: "PUT", body: JSON.stringify(editAnnouncementForm) }); const data = await res.json(); if (res.ok && data.success) { showMsg("Announcement updated!"); setShowEditAnnouncementModal(false); setEditingAnnouncement(null); fetchAnnouncements(); } else showModalMsg(data.error || "Update failed!", "error"); } catch { showModalMsg("Server error!", "error"); } finally { setSubmitting(false); }
  };
  const handleDeleteAnnouncement = async (id) => { try { const res = await authFetch(`${API}/api/announcements/${id}`, { method: "DELETE" }); const data = await res.json(); if (data.success) { showMsg("Announcement deleted!"); fetchAnnouncements(); } else showMsg(data.error || "Error!", "error"); } catch { showMsg("Error!", "error"); } };

  // ─── Calendar ─────────────────────────────────────────────────────────────────
  const handleSaveLocalEvent = async () => {
    if (!localEventForm.title || !localEventForm.start_date) { showModalMsg("Title and start date are required!", "error"); return; }
    setSavingLocalEvent(true);
    try { const res = await authFetch(`${API}/api/calendar-events`, { method: "POST", body: JSON.stringify(localEventForm) }); const data = await res.json(); if (res.ok && data.success) { showMsg("Event saved!"); setShowLocalEventModal(false); setLocalEventForm(emptyEventForm); fetchLocalEvents(); } else showModalMsg(data.error || "Failed to save event!", "error"); } catch { showModalMsg("Server error!", "error"); } finally { setSavingLocalEvent(false); }
  };
  const handleOpenEditEvent = (ev) => {
    const r = ev.raw; setEditingEvent(ev);
    setEditEventForm({ title: r.title || "", description: r.description || "", location: r.location || "", start_date: toLocalIso(r.start_date) || "", start_time: r.start_time || "08:00", end_date: toLocalIso(r.end_date) || "", end_time: r.end_time || "09:00", all_day: !!r.all_day, color: r.color || "#009439" });
    setShowEditEventModal(true);
  };
  const handleUpdateEvent = async () => {
    if (!editEventForm.title || !editEventForm.start_date) { showModalMsg("Title and start date are required!", "error"); return; }
    setSavingLocalEvent(true);
    try { const res = await authFetch(`${API}/api/calendar-events/${editingEvent.dbId}`, { method: "PUT", body: JSON.stringify(editEventForm) }); const data = await res.json(); if (res.ok && data.success) { showMsg("Event updated!"); setShowEditEventModal(false); setEditingEvent(null); fetchLocalEvents(); } else showModalMsg(data.error || "Update failed!", "error"); } catch { showModalMsg("Server error!", "error"); } finally { setSavingLocalEvent(false); }
  };
  const handleDeleteEvent = async (dbId) => { try { const res = await authFetch(`${API}/api/calendar-events/${dbId}`, { method: "DELETE" }); const data = await res.json(); if (data.success) { showMsg("Event deleted!"); fetchLocalEvents(); } else showMsg(data.error || "Error!", "error"); } catch { showMsg("Error!", "error"); } };

  const pageLoading = fetchingUsers || fetchingOrdinances || fetchingOfficials || fetchingMinutes || fetchingResolutions || fetchingAnnouncements;

  const MAlert = () => <ModalAlert message={modalMessage} type={modalMessageType} />;

  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className={styles.container}>
      <div className={`${styles.mobileBackdrop} ${mobileOpen ? styles.visible : ""}`} onClick={() => setMobileOpen(false)} />

      {/* Mobile topbar */}
      <div className={styles.mobileTopbar}>
        <button className={`${styles.hamburgerBtn} ${mobileOpen ? styles.open : ""}`} onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
          <span className={styles.hamburgerLine} /><span className={styles.hamburgerLine} /><span className={styles.hamburgerLine} />
        </button>
        <span className={styles.mobileTopTitle}>{tabTitles[activeTab]}</span>
        <div style={{ width: 34 }} />
      </div>

      {/* ── SIDEBAR ── */}
      <div className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ""} ${mobileOpen ? styles.mobileOpen : ""}`}>
        <button className={styles.sidebarToggle} onClick={() => setSidebarCollapsed((v) => !v)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: sidebarCollapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}>
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
            <button className={styles.navSectionHeader} onClick={() => !sidebarCollapsed && setUserMgmtOpen((v) => !v)}>
              <span className={styles.navSectionIcon}><Users size={14} strokeWidth={1.8} /></span>
              <span className={styles.navSectionLabel}>User Management</span>
              {!sidebarCollapsed && (<span className={styles.navSectionChevron}>{userMgmtOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</span>)}
            </button>
            <div className={`${styles.navSectionItems} ${userMgmtOpen && !sidebarCollapsed ? styles.navSectionItemsOpen : ""}`}>
              {[
                { key: "users",  icon: <Users size={17} strokeWidth={1.5} />,       label: "Manage Users" },
                { key: "admins", icon: <ShieldCheck size={17} strokeWidth={1.5} />, label: "Manage Admins" },
              ].map((t) => (
                <button key={t.key} className={`${styles.navBtn} ${styles.navBtnIndented} ${activeTab === t.key ? styles.navBtnActive : ""}`} onClick={() => handleTabChange(t.key)}>
                  <span className={styles.navIcon}>{t.icon}</span><span className={styles.navLabel}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className={styles.navDivider} />
          {[
            { key: "sessions",      icon: <BookOpen size={18} strokeWidth={1.5} />,   label: "Session Minutes" },
            { key: "calendar",      icon: <Calendar size={18} strokeWidth={1.5} />,   label: "Calendar" },
            { key: "announcements", icon: <Megaphone size={18} strokeWidth={1.5} />,  label: "Announcements" },
            { key: "ordinances",    icon: <ScrollText size={18} strokeWidth={1.5} />, label: "Ordinances" },
            { key: "resolutions",   icon: <Gavel size={18} strokeWidth={1.5} />,      label: "Resolutions" },
            { key: "officials",     icon: <Landmark size={18} strokeWidth={1.5} />,   label: "Council Members" },
            { key: "logs",          icon: <Activity size={18} strokeWidth={1.5} />,   label: "Activity Logs" },
          ].map((t) => (
            <button key={t.key} className={`${styles.navBtn} ${activeTab === t.key ? styles.navBtnActive : ""}`} onClick={() => handleTabChange(t.key)}>
              <span className={styles.navIcon}>{t.icon}</span><span className={styles.navLabel}>{t.label}</span>
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
            <LogOut size={14} strokeWidth={1.5} /><span className={styles.logoutLabel}>Log out</span>
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
            {activeTab === "users"         && <button className={styles.addBtn} onClick={() => { setModalMessage(""); setShowAddUserModal(true); }}>+ Add User</button>}
            {activeTab === "admins"        && <button className={styles.addBtn} onClick={() => { setModalMessage(""); setShowAddAdminModal(true); }}>+ Add Admin</button>}
            {activeTab === "ordinances"    && <button className={styles.addBtn} onClick={() => { setModalMessage(""); setShowOrdinanceModal(true); }}>+ Upload Ordinance</button>}
            {activeTab === "resolutions"   && <button className={styles.addBtn} onClick={() => { setModalMessage(""); setResolutionNumber(""); setResolutionTitle(""); setResolutionYear(""); setResolutionFile(null); setSelectedResolutionOfficials([]); setResolutionUploadType(""); setShowResolutionModal(true); }}>+ Upload Resolution</button>}
            {activeTab === "officials"     && <button className={styles.addBtn} onClick={() => { setModalMessage(""); setShowOfficialModal(true); }}>+ Add Member</button>}
            {activeTab === "sessions"      && <button className={styles.addBtn} onClick={() => { setModalMessage(""); resetSessionForm(); setShowSessionModal(true); }}>+ Add Session</button>}
            {activeTab === "announcements" && <button className={styles.addBtn} onClick={() => { setModalMessage(""); resetAnnouncementForm(); setShowAnnouncementModal(true); }}>+ New Announcement</button>}
            {activeTab === "logs"          && <button className={styles.addBtn} onClick={() => { fetchLogs(); fetchLogStats(); }} style={{ display: "flex", alignItems: "center", gap: 6 }}><RefreshCw size={14} /> Refresh</button>}
          </div>
        </div>

        {message && (
          <div className={`${styles.message} ${messageType === "error" ? styles.messageError : ""}`}>
            <AlertCircle size={14} /> {message}
            <button className={styles.closeMsg} onClick={() => setMessage("")}><X size={13} /></button>
          </div>
        )}
        {pageLoading && <div className={styles.loadingBar}>Loading data...</div>}

        {/* ── PAGE COMPONENTS ── */}
        {activeTab === "users"         && !fetchingUsers         && <UsersPage users={users} setDeleteTarget={setDeleteTarget} />}
        {activeTab === "admins"        && !fetchingUsers         && <AdminsPage users={users} setDeleteTarget={setDeleteTarget} />}
        {activeTab === "ordinances"    && !fetchingOrdinances    && <OrdinancesPage ordinances={ordinances} setDeleteTarget={setDeleteTarget} onEdit={handleOpenEditOrdinance} />}
        {activeTab === "resolutions"   && !fetchingResolutions   && <ResolutionsPage resolutions={resolutions} setDeleteTarget={setDeleteTarget} onEdit={handleOpenEditResolution} />}
        {activeTab === "officials"     && !fetchingOfficials     && <OfficialsPage officials={officials} ordinances={ordinances} setDeleteTarget={setDeleteTarget} onViewProfile={(o) => { setSelectedOfficialProfile(o); setShowOfficialProfile(true); }} />}
        {activeTab === "sessions"      && !fetchingMinutes       && <SessionsPage sessionMinutes={sessionMinutes} setDeleteTarget={setDeleteTarget} onEdit={handleOpenEditSession} />}
        {activeTab === "announcements" && !fetchingAnnouncements && <AnnouncementsPage announcements={announcements} setDeleteTarget={setDeleteTarget} onEdit={handleOpenEditAnnouncement} />}
        {activeTab === "calendar"      && <CalendarPage localEvents={localEvents} phHolidays={phHolidays} fetchingHolidays={fetchingHolidays} showHolidays={showHolidays} setShowHolidays={setShowHolidays} onAddEvent={(dateStr) => { setLocalEventForm({ ...emptyEventForm, start_date: dateStr, end_date: dateStr }); setModalMessage(""); setShowLocalEventModal(true); }} onEditEvent={handleOpenEditEvent} onDeleteEvent={handleDeleteEvent} />}
        {activeTab === "logs"          && <LogsPage logs={logs} logStats={logStats} fetchingLogs={fetchingLogs} logModuleFilter={logModuleFilter} setLogModuleFilter={setLogModuleFilter} logActionFilter={logActionFilter} setLogActionFilter={setLogActionFilter} onRefresh={() => { fetchLogs(); fetchLogStats(); }} />}
      </div>

      {/* ══════════════════ MODALS ══════════════════ */}

      {/* Add Admin */}
      {showAddAdminModal && (
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <h2 className={styles.modalTitle}>Add New Admin</h2>
          <input className={styles.input} placeholder="Full Name" value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} />
          <input className={styles.input} placeholder="Username" value={newAdmin.username} onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })} />
          <input className={styles.input} type="email" placeholder="Email Address" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} />
          <input className={styles.input} type="password" placeholder="Password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} />
          <MAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowAddAdminModal(false); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleAddAdmin} disabled={submitting}>{submitting ? "Adding..." : "Add Admin"}</button>
          </div>
        </div></div>
      )}

      {/* Add User */}
      {showAddUserModal && (
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <h2 className={styles.modalTitle}>Add New User</h2>
          <input className={styles.input} placeholder="Full Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
          <input className={styles.input} placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
          <input className={styles.input} type="email" placeholder="Email Address" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
          <input className={styles.input} type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
          <MAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowAddUserModal(false); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleAddUser} disabled={submitting}>{submitting ? "Adding..." : "Add User"}</button>
          </div>
        </div></div>
      )}

      {/* Add Council Member */}
      {showOfficialModal && (
        <div className={styles.modalOverlay}><div className={`${styles.modal} ${styles.sessionModal}`}>
          <h2 className={styles.modalTitle}>Add Council Member</h2>
          <label className={styles.fieldLabel}>Full Name <span style={{ color: "#e53e3e" }}>*</span></label>
          <input className={styles.input} placeholder="Full Name" value={newOfficial.full_name} onChange={(e) => setNewOfficial({ ...newOfficial, full_name: e.target.value })} />
          <label className={styles.fieldLabel}>Position <span style={{ color: "#e53e3e" }}>*</span></label>
          <input className={styles.input} placeholder="Position (e.g. Councilor, Vice Mayor)" value={newOfficial.position} onChange={(e) => setNewOfficial({ ...newOfficial, position: e.target.value })} />
          <div className={styles.fileUploadBox}>
            <input type="file" accept="image/*" id="photoInput" style={{ display: "none" }} onChange={(e) => setOfficialPhoto(e.target.files[0])} />
            <label htmlFor="photoInput" className={styles.fileLabel}>
              {officialPhoto ? <><CheckSquare size={14} strokeWidth={1.5} /> {officialPhoto.name}</> : <><Upload size={14} strokeWidth={1.5} /> Click to upload photo (optional)</>}
            </label>
          </div>
          <div style={{ marginTop: 12, padding: "12px 14px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1a365d", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <History size={13} /> Initial Term <span style={{ fontWeight: 400, color: "#718096" }}>(optional)</span>
            </div>
            <TermFormFields form={newOfficial} setForm={setNewOfficial} styles={styles} />
          </div>
          <MAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowOfficialModal(false); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleAddOfficial} disabled={submitting}>{submitting ? "Adding..." : "Add Member"}</button>
          </div>
        </div></div>
      )}

      {/* Official Profile */}
      {showOfficialProfile && selectedOfficialProfile && (
        <div className={styles.modalOverlay}><div className={styles.profileModal}>
          <div className={styles.profileHeader}>
            {selectedOfficialProfile.photo ? <img src={selectedOfficialProfile.photo} alt={selectedOfficialProfile.full_name} className={styles.profilePhoto} /> : <div className={styles.profileAvatar}>{selectedOfficialProfile.full_name.charAt(0)}</div>}
            <div>
              <div className={styles.profileName}>{selectedOfficialProfile.full_name}</div>
              <div className={styles.profilePosition}>{selectedOfficialProfile.position}</div>
              {selectedOfficialProfile.active_term && (
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <TermStatusBadge status={selectedOfficialProfile.active_term.status} />
                  <span style={{ fontSize: 12, color: "#4a5568" }}>{selectedOfficialProfile.active_term.term_period}</span>
                </div>
              )}
            </div>
          </div>
          <div style={{ margin: "16px 0" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "#1a365d", display: "flex", alignItems: "center", gap: 6 }}>
                <History size={14} strokeWidth={1.5} /> Term History ({(selectedOfficialProfile.terms || []).length})
              </h3>
              <button className={styles.addBtn} style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => handleOpenAddTerm(selectedOfficialProfile.id)}>+ Add Term</button>
            </div>
            {(selectedOfficialProfile.terms || []).length === 0 ? (
              <p style={{ fontSize: 13, color: "#a0aec0", textAlign: "center", padding: "12px 0" }}>No term records yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(selectedOfficialProfile.terms || []).map((term) => (
                  <div key={term.id} style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: term.status === "active" ? "#f0fff4" : "#f8fafc", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 3 }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{term.term_period}</span>
                        <TermStatusBadge status={term.status} />
                        {term.is_reelected && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 10, background: "#dbeafe", color: "#1e40af", fontWeight: 600 }}>Re-elected</span>}
                      </div>
                      <div style={{ fontSize: 11, color: "#718096" }}>{formatDate(term.term_start)} → {term.term_end ? formatDate(term.term_end) : <em>Present</em>}</div>
                      {term.notes && <div style={{ fontSize: 11, color: "#a0aec0", marginTop: 3 }}>{term.notes}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button className={styles.editBtn} style={{ fontSize: 11, padding: "3px 8px" }} onClick={() => handleOpenEditTerm(selectedOfficialProfile.id, term)}><Pencil size={11} /> Edit</button>
                      <button className={styles.deleteBtn} style={{ fontSize: 11, padding: "3px 8px" }} onClick={() => setDeleteTarget({ id: term.id, type: "term", name: term.term_period, memberId: selectedOfficialProfile.id })}><Trash2 size={11} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className={styles.profileOrdinances}>
            <h3 className={styles.profileOrdinancesTitle}><ClipboardList size={15} strokeWidth={1.5} /> Ordinances Passed ({getOfficialOrdinances(selectedOfficialProfile.id).length})</h3>
            {getOfficialOrdinances(selectedOfficialProfile.id).length === 0 ? <p className={styles.empty}>No ordinances passed yet.</p> : getOfficialOrdinances(selectedOfficialProfile.id).map((o) => (
              <div key={o.id} className={styles.profileOrdinanceItem}>
                <div className={styles.profileOrdinanceLeft}>
                  <span className={`${styles.badge} ${o.filetype === "application/pdf" ? styles.badgeAdmin : styles.badgeGray}`}>{o.filetype === "application/pdf" ? "PDF" : "OCR"}</span>
                  <div><div className={styles.profileOrdinanceName}>{o.title}</div><div className={styles.profileOrdinanceDate}>{new Date(o.uploaded_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}</div></div>
                </div>
                <a href={o.filepath} target="_blank" rel="noreferrer" className={styles.viewBtn}><Eye size={13} /> View</a>
              </div>
            ))}
          </div>
          <div className={styles.modalBtns}><button className={styles.confirmBtn} onClick={() => setShowOfficialProfile(false)}>Close</button></div>
        </div></div>
      )}

      {/* Add Term */}
      {showAddTermModal && termTarget && (
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <h2 className={styles.modalTitle}><History size={16} /> Add Term Record</h2>
          <TermFormFields form={termForm} setForm={setTermForm} styles={styles} />
          <MAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowAddTermModal(false); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleSaveTerm} disabled={submitting}>{submitting ? "Saving..." : "Save Term"}</button>
          </div>
        </div></div>
      )}

      {/* Edit Term */}
      {showEditTermModal && termTarget && (
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <h2 className={styles.modalTitle}><Pencil size={16} /> Edit Term Record</h2>
          <TermFormFields form={termForm} setForm={setTermForm} styles={styles} />
          <MAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowEditTermModal(false); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleUpdateTerm} disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</button>
          </div>
        </div></div>
      )}

      {/* Upload Ordinance */}
      {showOrdinanceModal && (
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <h2 className={styles.modalTitle}>Upload Ordinance</h2>
          <input className={styles.input} placeholder="Ordinance Number (e.g. Ordinance No. 2024-001)" value={ordinanceNumber} onChange={(e) => setOrdinanceNumber(e.target.value)} />
          <input className={styles.input} placeholder="Ordinance Title" value={ordinanceTitle} onChange={(e) => setOrdinanceTitle(e.target.value)} />
          <input className={styles.input} placeholder="Year (e.g. 2024)" type="number" min="1900" max="2100" value={ordinanceYear} onChange={(e) => setOrdinanceYear(e.target.value)} />
          <p className={styles.officialsSelectLabel}>Choose upload type:</p>
          <div className={styles.uploadTypeRow}>
            <button className={`${styles.uploadTypeBtn} ${uploadType === "pdf" ? styles.uploadTypeBtnActive : ""}`} onClick={() => { setUploadType("pdf"); setOrdinanceFile(null); }}><FileText size={16} strokeWidth={1.5} /> Upload as PDF<span className={styles.uploadTypeDesc}>Store and view the PDF file</span></button>
            <button className={`${styles.uploadTypeBtn} ${uploadType === "image-to-text" ? styles.uploadTypeBtnActive : ""}`} onClick={() => { setUploadType("image-to-text"); setOrdinanceFile(null); }}><Image size={16} strokeWidth={1.5} /> Image to Text (OCR)<span className={styles.uploadTypeDesc}>Upload image and extract text</span></button>
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
            <p className={styles.officialsSelectLabel}>Tag Council Members who passed this ordinance:</p>
            <OfficialsCheckList officials={officials} selected={selectedOfficials} onToggle={toggleOfficial} styles={styles} />
          </div>
          <MAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowOrdinanceModal(false); setOrdinanceFile(null); setOrdinanceNumber(""); setOrdinanceTitle(""); setOrdinanceYear(""); setSelectedOfficials([]); setUploadType(""); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleUploadOrdinance} disabled={submitting || !uploadType}>{submitting ? (uploadType === "image-to-text" ? "Extracting text..." : "Uploading...") : "Upload"}</button>
          </div>
        </div></div>
      )}

      {/* Edit Ordinance */}
      {showEditOrdinanceModal && editingOrdinance && (
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
            <p className={styles.officialsSelectLabel}>Tag Council Members who passed this ordinance:</p>
            <OfficialsCheckList officials={officials} selected={editSelectedOfficials} onToggle={toggleEditOfficial} styles={styles} />
          </div>
          <MAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowEditOrdinanceModal(false); setEditingOrdinance(null); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleUpdateOrdinance} disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</button>
          </div>
        </div></div>
      )}

      {/* Upload Resolution */}
      {showResolutionModal && (
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <h2 className={styles.modalTitle}><Gavel size={18} strokeWidth={1.5} /> Upload Resolution</h2>
          <input className={styles.input} placeholder="Resolution Number (e.g. Resolution No. 2024-001)" value={resolutionNumber} onChange={(e) => setResolutionNumber(e.target.value)} />
          <input className={styles.input} placeholder="Resolution Title" value={resolutionTitle} onChange={(e) => setResolutionTitle(e.target.value)} />
          <input className={styles.input} placeholder="Year (e.g. 2024)" type="number" min="1900" max="2100" value={resolutionYear} onChange={(e) => setResolutionYear(e.target.value)} />
          <p className={styles.officialsSelectLabel}>Choose upload type:</p>
          <div className={styles.uploadTypeRow}>
            <button className={`${styles.uploadTypeBtn} ${resolutionUploadType === "pdf" ? styles.uploadTypeBtnActive : ""}`} onClick={() => { setResolutionUploadType("pdf"); setResolutionFile(null); }}><FileText size={16} strokeWidth={1.5} /> Upload as PDF<span className={styles.uploadTypeDesc}>Store and view the PDF file</span></button>
            <button className={`${styles.uploadTypeBtn} ${resolutionUploadType === "image-to-text" ? styles.uploadTypeBtnActive : ""}`} onClick={() => { setResolutionUploadType("image-to-text"); setResolutionFile(null); }}><Image size={16} strokeWidth={1.5} /> Image to Text (OCR)<span className={styles.uploadTypeDesc}>Upload image and extract text</span></button>
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
            <p className={styles.officialsSelectLabel}>Tag Council Members who passed this resolution:</p>
            <OfficialsCheckList officials={officials} selected={selectedResolutionOfficials} onToggle={toggleResolutionOfficial} styles={styles} />
          </div>
          <MAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowResolutionModal(false); setResolutionFile(null); setResolutionNumber(""); setResolutionTitle(""); setResolutionYear(""); setSelectedResolutionOfficials([]); setResolutionUploadType(""); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleUploadResolution} disabled={submitting || !resolutionUploadType}>{submitting ? (resolutionUploadType === "image-to-text" ? "Extracting text..." : "Uploading...") : "Upload"}</button>
          </div>
        </div></div>
      )}

      {/* Edit Resolution */}
      {showEditResolutionModal && editingResolution && (
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
            <p className={styles.officialsSelectLabel}>Tag Council Members who passed this resolution:</p>
            <OfficialsCheckList officials={officials} selected={editResolutionSelectedOfficials} onToggle={toggleEditResolutionOfficial} styles={styles} />
          </div>
          <MAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowEditResolutionModal(false); setEditingResolution(null); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleUpdateResolution} disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</button>
          </div>
        </div></div>
      )}

      {/* Extracted Text */}
      {showTextModal && (
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <h2 className={styles.modalTitle}>Extracted Text (OCR)</h2>
          <textarea className={styles.textArea} value={extractedText} readOnly />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { navigator.clipboard.writeText(extractedText); showMsg("Copied to clipboard!"); }}><Copy size={13} /> Copy Text</button>
            <button className={styles.confirmBtn} onClick={() => setShowTextModal(false)}>Close</button>
          </div>
        </div></div>
      )}

      {/* Add Session */}
      {showSessionModal && (
        <div className={styles.modalOverlay}><div className={`${styles.modal} ${styles.sessionModal}`}>
          <h2 className={styles.modalTitle}><BookOpen size={18} strokeWidth={1.5} /> Add Session Minutes &amp; Agenda</h2>
          <div className={styles.uploadTypeRow}>
            <button className={`${styles.uploadTypeBtn} ${sessionInputMode === "text" ? styles.uploadTypeBtnActive : ""}`} onClick={() => setSessionInputMode("text")}><FileEdit size={16} strokeWidth={1.5} /> Direct Input<span className={styles.uploadTypeDesc}>Type or paste session minutes directly</span></button>
            <button className={`${styles.uploadTypeBtn} ${sessionInputMode === "ocr" ? styles.uploadTypeBtnActive : ""}`} onClick={() => setSessionInputMode("ocr")}><Camera size={16} strokeWidth={1.5} /> Upload Image (OCR)<span className={styles.uploadTypeDesc}>Scan handwritten or printed paper</span></button>
          </div>
          <div className={styles.sessionFormGrid}>
            <div className={styles.sessionFormCol}><label className={styles.fieldLabel}>Session Number</label><input className={styles.input} placeholder="e.g. 12th Regular Session" value={sessionForm.session_number} onChange={(e) => setSessionForm({ ...sessionForm, session_number: e.target.value })} /></div>
            <div className={styles.sessionFormCol}><label className={styles.fieldLabel}>Session Date <span style={{ color: "#e53e3e" }}>*</span></label><input className={styles.input} type="date" value={sessionForm.session_date} onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })} /></div>
            <div className={styles.sessionFormCol}><label className={styles.fieldLabel}>Session Type</label><select className={styles.input} value={sessionForm.session_type} onChange={(e) => setSessionForm({ ...sessionForm, session_type: e.target.value })}><option value="regular">Regular Session</option><option value="special">Special Session</option></select></div>
            <div className={styles.sessionFormCol}><label className={styles.fieldLabel}>Venue</label><input className={styles.input} placeholder="e.g. Session Hall" value={sessionForm.venue} onChange={(e) => setSessionForm({ ...sessionForm, venue: e.target.value })} /></div>
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
                <button className={`${styles.uploadTypeBtn} ${sessionOcrTarget === "minutes" ? styles.uploadTypeBtnActive : ""}`} onClick={() => setSessionOcrTarget("minutes")} style={{ flex: 1 }}><FileText size={14} /> Minutes Text<span className={styles.uploadTypeDesc}>OCR text becomes session minutes</span></button>
                <button className={`${styles.uploadTypeBtn} ${sessionOcrTarget === "agenda" ? styles.uploadTypeBtnActive : ""}`} onClick={() => setSessionOcrTarget("agenda")} style={{ flex: 1 }}><ClipboardList size={14} /> Agenda<span className={styles.uploadTypeDesc}>OCR text becomes agenda items</span></button>
              </div>
              <div className={styles.fileUploadBox}>
                <input type="file" accept="image/*" id="sessionFileInput" style={{ display: "none" }} onChange={(e) => setSessionFile(e.target.files[0])} />
                <label htmlFor="sessionFileInput" className={styles.fileLabel}>{sessionFile ? <><CheckSquare size={14} strokeWidth={1.5} /> {sessionFile.name}</> : <><Upload size={14} strokeWidth={1.5} /> Click to choose image (JPG, PNG)</>}</label>
                <p className={styles.fileHint}>Accepted: JPG, PNG — handwritten or printed document</p>
              </div>
              {sessionOcrTarget === "minutes" && (<><label className={styles.fieldLabel}>Agenda Items <span className={styles.fieldHint}>(optional, one per line)</span></label><textarea className={styles.textArea} placeholder={"1. Call to order\n2. Roll call\n..."} value={sessionForm.agenda} onChange={(e) => setSessionForm({ ...sessionForm, agenda: e.target.value })} rows={4} /></>)}
              {sessionOcrTarget === "agenda" && (<><label className={styles.fieldLabel}>Minutes Text <span className={styles.fieldHint}>(optional)</span></label><textarea className={styles.textArea} placeholder="Type session minutes or leave blank..." value={sessionForm.minutes_text} onChange={(e) => setSessionForm({ ...sessionForm, minutes_text: e.target.value })} rows={4} /></>)}
            </>
          )}
          <MAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowSessionModal(false); resetSessionForm(); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleAddSession} disabled={submitting}>{submitting ? (sessionInputMode === "ocr" ? "Extracting & Saving..." : "Saving...") : "Save Session"}</button>
          </div>
        </div></div>
      )}

      {/* Edit Session */}
      {showEditSessionModal && editingSession && (
        <div className={styles.modalOverlay}><div className={`${styles.modal} ${styles.sessionModal}`}>
          <h2 className={styles.modalTitle}><Pencil size={16} strokeWidth={1.5} /> Edit Session Minutes</h2>
          <div className={styles.sessionFormGrid}>
            <div className={styles.sessionFormCol}><label className={styles.fieldLabel}>Session Number</label><input className={styles.input} placeholder="e.g. 12th Regular Session" value={editSessionForm.session_number} onChange={(e) => setEditSessionForm({ ...editSessionForm, session_number: e.target.value })} /></div>
            <div className={styles.sessionFormCol}><label className={styles.fieldLabel}>Session Date <span style={{ color: "#e53e3e" }}>*</span></label><input className={styles.input} type="date" value={editSessionForm.session_date} onChange={(e) => setEditSessionForm({ ...editSessionForm, session_date: e.target.value })} /></div>
            <div className={styles.sessionFormCol}><label className={styles.fieldLabel}>Session Type</label><select className={styles.input} value={editSessionForm.session_type} onChange={(e) => setEditSessionForm({ ...editSessionForm, session_type: e.target.value })}><option value="regular">Regular Session</option><option value="special">Special Session</option></select></div>
            <div className={styles.sessionFormCol}><label className={styles.fieldLabel}>Venue</label><input className={styles.input} placeholder="Venue" value={editSessionForm.venue} onChange={(e) => setEditSessionForm({ ...editSessionForm, venue: e.target.value })} /></div>
          </div>
          <label className={styles.fieldLabel}>Agenda Items <span className={styles.fieldHint}>(one item per line)</span></label>
          <textarea className={styles.textArea} value={editSessionForm.agenda} onChange={(e) => setEditSessionForm({ ...editSessionForm, agenda: e.target.value })} rows={5} />
          <label className={styles.fieldLabel} style={{ marginTop: "10px" }}>Minutes of the Session</label>
          <textarea className={styles.textArea} value={editSessionForm.minutes_text} onChange={(e) => setEditSessionForm({ ...editSessionForm, minutes_text: e.target.value })} rows={8} />
          <MAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowEditSessionModal(false); setEditingSession(null); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleUpdateSession} disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</button>
          </div>
        </div></div>
      )}

      {/* Add Announcement */}
      {showAnnouncementModal && (
        <div className={styles.modalOverlay}><div className={`${styles.modal} ${styles.sessionModal}`}>
          <h2 className={styles.modalTitle}><Megaphone size={18} strokeWidth={1.5} /> New Announcement</h2>
          <label className={styles.fieldLabel}>Title <span style={{ color: "#e53e3e" }}>*</span></label>
          <input className={styles.input} placeholder="Announcement title..." value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} />
          <label className={styles.fieldLabel}>Priority Level</label>
          <div className={styles.priorityRow}>
            {["urgent", "high", "normal", "low"].map((p) => { const cfg = priorityConfig[p]; return (<button key={p} className={`${styles.priorityBtn} ${announcementForm.priority === p ? styles.priorityBtnActive : ""}`} style={announcementForm.priority === p ? { background: cfg.bg, borderColor: cfg.border, color: cfg.color } : {}} onClick={() => setAnnouncementForm({ ...announcementForm, priority: p })}>{cfg.label}</button>); })}
          </div>
          <label className={styles.fieldLabel}>Announcement Body <span style={{ color: "#e53e3e" }}>*</span></label>
          <textarea className={styles.textArea} placeholder="Write your announcement here..." value={announcementForm.body} onChange={(e) => setAnnouncementForm({ ...announcementForm, body: e.target.value })} rows={7} style={{ height: "auto" }} />
          <label className={styles.fieldLabel}>Expiry Date <span className={styles.fieldHint}>(optional — leave blank for no expiry)</span></label>
          <input className={styles.input} type="date" value={announcementForm.expires_at} onChange={(e) => setAnnouncementForm({ ...announcementForm, expires_at: e.target.value })} />
          <MAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowAnnouncementModal(false); resetAnnouncementForm(); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleAddAnnouncement} disabled={submitting}>{submitting ? "Posting..." : "Post Announcement"}</button>
          </div>
        </div></div>
      )}

      {/* Edit Announcement */}
      {showEditAnnouncementModal && editingAnnouncement && (
        <div className={styles.modalOverlay}><div className={`${styles.modal} ${styles.sessionModal}`}>
          <h2 className={styles.modalTitle}><Pencil size={16} strokeWidth={1.5} /> Edit Announcement</h2>
          <label className={styles.fieldLabel}>Title <span style={{ color: "#e53e3e" }}>*</span></label>
          <input className={styles.input} placeholder="Announcement title..." value={editAnnouncementForm.title} onChange={(e) => setEditAnnouncementForm({ ...editAnnouncementForm, title: e.target.value })} />
          <label className={styles.fieldLabel}>Priority Level</label>
          <div className={styles.priorityRow}>
            {["urgent", "high", "normal", "low"].map((p) => { const cfg = priorityConfig[p]; return (<button key={p} className={`${styles.priorityBtn} ${editAnnouncementForm.priority === p ? styles.priorityBtnActive : ""}`} style={editAnnouncementForm.priority === p ? { background: cfg.bg, borderColor: cfg.border, color: cfg.color } : {}} onClick={() => setEditAnnouncementForm({ ...editAnnouncementForm, priority: p })}>{cfg.label}</button>); })}
          </div>
          <label className={styles.fieldLabel}>Announcement Body <span style={{ color: "#e53e3e" }}>*</span></label>
          <textarea className={styles.textArea} value={editAnnouncementForm.body} onChange={(e) => setEditAnnouncementForm({ ...editAnnouncementForm, body: e.target.value })} rows={7} style={{ height: "auto" }} />
          <label className={styles.fieldLabel}>Expiry Date <span className={styles.fieldHint}>(optional)</span></label>
          <input className={styles.input} type="date" value={editAnnouncementForm.expires_at} onChange={(e) => setEditAnnouncementForm({ ...editAnnouncementForm, expires_at: e.target.value })} />
          <MAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowEditAnnouncementModal(false); setEditingAnnouncement(null); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleUpdateAnnouncement} disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</button>
          </div>
        </div></div>
      )}

      {/* Add Local Event */}
      {showLocalEventModal && (
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <h2 className={styles.modalTitle}><PlusCircle size={16} /> Add Event</h2>
          <EventFormFields form={localEventForm} setForm={setLocalEventForm} styles={styles} />
          <MAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowLocalEventModal(false); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleSaveLocalEvent} disabled={savingLocalEvent}>{savingLocalEvent ? "Saving..." : "Save Event"}</button>
          </div>
        </div></div>
      )}

      {/* Edit Local Event */}
      {showEditEventModal && editingEvent && (
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <h2 className={styles.modalTitle}><Pencil size={16} /> Edit Event</h2>
          <EventFormFields form={editEventForm} setForm={setEditEventForm} styles={styles} />
          <MAlert />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowEditEventModal(false); setEditingEvent(null); setModalMessage(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleUpdateEvent} disabled={savingLocalEvent}>{savingLocalEvent ? "Saving..." : "Save Changes"}</button>
          </div>
        </div></div>
      )}

      {/* Delete Confirm */}
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
            else if (deleteTarget.type === "term")         handleDeleteTerm(deleteTarget.memberId, deleteTarget.id);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
