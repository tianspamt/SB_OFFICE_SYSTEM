import { useEffect, useRef, useState } from "react";
import styles from "./AdminDashboard.module.css";
import logo from "../assets/image/balilihan-logo-Large-1.png";
import {
  Users,
  ShieldCheck,
  ScrollText,
  Landmark,
  X,
  LogOut,
  AlertCircle,
  BookOpen,
  Gavel,
  Megaphone,
  ChevronDown,
  ChevronRight,
  Calendar,
  PlusCircle,
  Activity,
  RefreshCw,
  History,
  FileText,
  Image,
  Upload,
  CheckSquare,
  FileEdit,
  Camera,
  ClipboardList,
  Copy,
  Eye,
  Pencil,
  Trash2,
  CalendarDays,
  Archive,
} from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import {
  API,
  authFetch,
  extractErrorMsg,
  toIsoDate,
  toLocalIso,
  formatDate,
  priorityConfig,
  tabTitles,
  getCurrentYear,
  suggestOrdinanceNumber,
  suggestResolutionNumber,
  suggestSessionNumber,
  isDuplicateRecordNumber,
} from "./AdminContext";
import {
  TermStatusBadge,
  ModalAlert,
  TermFormFields,
  OfficialsCheckList,
  EventFormFields,
  UserAvatar,
} from "./AdminComponents";
import UsersPage from "./UsersPage";
import AdminsPage from "./AdminsPage";
import OrdinancesPage from "./OrdinancesPage";
import ResolutionsPage from "./ResolutionsPage";
import OfficialsPage from "./OfficialsPage";
import SessionsPage from "./SessionsPage";
import AnnouncementsPage from "./AnnouncementsPage";
import CalendarPage from "./CalendarPage";
import LogsPage from "./LogsPage";
import DashboardPage from "./DashboardPage";
import ContentManagementPage from "./ContentManagementPage";
import ArchivesPage from "./ArchivesPage";

const ARCHIVABLE_TYPES = [
  "user",
  "ordinance",
  "resolution",
  "official",
  "session",
];

// Fixed set of valid Sangguniang Bayan council positions — kept as a
// dropdown (instead of free text) to prevent inconsistent/inaccurate entries.
const OFFICIAL_POSITIONS = [
  "Vice Mayor",
  "Councilor",
  "Liga ng mga Barangay President",
  "SK Federated President",
];

export default function AdminDashboard() {
  // ── core ──
  const [users, setUsers] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [modalMessage, setModalMessage] = useState("");
  const [modalMessageType, setModalMessageType] = useState("success");
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [legislativeOpen, setLegislativeOpen] = useState(false);
  const [userMgmtOpen, setUserMgmtOpen] = useState(false);
  // Set when navigating from the dashboard's "Needs your review" widget so
  // the destination module (Ordinances / Resolutions / Sessions) can open
  // directly on its Pending tab instead of the default Published tab.
  const [subTabRequest, setSubTabRequest] = useState(null);

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
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showOrdinanceModal, setShowOrdinanceModal] = useState(false);
  const [showEditOrdinanceModal, setShowEditOrdinanceModal] = useState(false);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [showEditResolutionModal, setShowEditResolutionModal] = useState(false);
  const [showOfficialModal, setShowOfficialModal] = useState(false);
  const [showEditOfficialModal, setShowEditOfficialModal] = useState(false);
  const [showOfficialProfile, setShowOfficialProfile] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showEditAnnouncementModal, setShowEditAnnouncementModal] =
    useState(false);
  const [showLocalEventModal, setShowLocalEventModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);
  const [showAddTermModal, setShowAddTermModal] = useState(false);
  const [showEditTermModal, setShowEditTermModal] = useState(false);
  const [termTarget, setTermTarget] = useState(null);

  // ── data ──
  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    position: "councilor",
  });
  const [newAdmin, setNewAdmin] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    position: "secretary",
  });
  const [newUserPhoto, setNewUserPhoto] = useState(null);
  const [newAdminPhoto, setNewAdminPhoto] = useState(null);

  // ── edit user/admin states ──
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({
    name: "",
    username: "",
    email: "",
    position: "",
  });
  const [editUserPhoto, setEditUserPhoto] = useState(null);

  // ── Legislative Record Numbering: tracks the last system-suggested
  // number per record type so we know whether the user has since edited
  // it manually (in which case we stop overwriting their input).
  const lastOrdinanceSuggestion = useRef("");
  const lastResolutionSuggestion = useRef("");
  const lastSessionSuggestion = useRef("");

  // ordinances
  const [ordinances, setOrdinances] = useState([]);
  const [ordinanceNumber, setOrdinanceNumber] = useState("");
  const [ordinanceTitle, setOrdinanceTitle] = useState("");
  const [ordinanceDate, setOrdinanceDate] = useState("");
  const [ordinanceFile, setOrdinanceFile] = useState(null);
  const [uploadType, setUploadType] = useState("");
  const [selectedOfficials, setSelectedOfficials] = useState([]);
  const [extractedText, setExtractedText] = useState("");
  const [editingOrdinance, setEditingOrdinance] = useState(null);
  const [editOrdinanceNumber, setEditOrdinanceNumber] = useState("");
  const [editOrdinanceTitle, setEditOrdinanceTitle] = useState("");
  const [editOrdinanceDate, setEditOrdinanceDate] = useState("");
  const [editSelectedOfficials, setEditSelectedOfficials] = useState([]);
  const [editOrdinanceFile, setEditOrdinanceFile] = useState(null);

  // resolutions
  const [resolutions, setResolutions] = useState([]);
  const [resolutionNumber, setResolutionNumber] = useState("");
  const [resolutionTitle, setResolutionTitle] = useState("");
  const [resolutionDate, setResolutionDate] = useState("");
  const [resolutionFile, setResolutionFile] = useState(null);
  const [selectedResolutionOfficials, setSelectedResolutionOfficials] =
    useState([]);
  const [editingResolution, setEditingResolution] = useState(null);
  const [editResolutionNumber, setEditResolutionNumber] = useState("");
  const [editResolutionTitle, setEditResolutionTitle] = useState("");
  const [editResolutionDate, setEditResolutionDate] = useState("");
  const [editResolutionSelectedOfficials, setEditResolutionSelectedOfficials] =
    useState([]);
  const [editResolutionFile, setEditResolutionFile] = useState(null);

  // officials
  const [officials, setOfficials] = useState([]);
  const [newOfficial, setNewOfficial] = useState({
    full_name: "",
    position: "",
    term_period: "",
    term_start: "",
    term_end: "",
    is_reelected: false,
    notes: "",
  });
  const [officialPhoto, setOfficialPhoto] = useState(null);
  const [selectedOfficialProfile, setSelectedOfficialProfile] = useState(null);

  // ── edit official states ──
  const [editingOfficial, setEditingOfficial] = useState(null);
  const [editOfficialName, setEditOfficialName] = useState("");
  const [editOfficialPosition, setEditOfficialPosition] = useState("");
  const [editOfficialPhoto, setEditOfficialPhoto] = useState(null);

  const emptyTermForm = {
    term_period: "",
    term_start: "",
    term_end: "",
    status: "active",
    is_reelected: false,
    notes: "",
  };
  const [termForm, setTermForm] = useState(emptyTermForm);

  // sessions
  const [sessionMinutes, setSessionMinutes] = useState([]);
  const [sessionInputMode, setSessionInputMode] = useState("text");
  const [sessionForm, setSessionForm] = useState({
    session_number: "",
    session_date: "",
    session_type: "regular",
    venue: "",
    agenda: "",
    minutes_text: "",
  });
  const [sessionFile, setSessionFile] = useState(null);
  const [sessionOcrTarget, setSessionOcrTarget] = useState("minutes");
  const [editingSession, setEditingSession] = useState(null);
  const [editSessionForm, setEditSessionForm] = useState({
    session_number: "",
    session_date: "",
    session_type: "regular",
    venue: "",
    agenda: "",
    minutes_text: "",
  });

  // announcements
  const [announcements, setAnnouncements] = useState([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    body: "",
    priority: "normal",
    expires_at: "",
  });
  const [editAnnouncementForm, setEditAnnouncementForm] = useState({
    title: "",
    body: "",
    priority: "normal",
    expires_at: "",
  });

  // calendar
  const [localEvents, setLocalEvents] = useState([]);
  const [fetchingCalendar, setFetchingCalendar] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [savingLocalEvent, setSavingLocalEvent] = useState(false);
  const [pendingEventDate, setPendingEventDate] = useState("");

  const emptyEventForm = {
    title: "",
    description: "",
    location: "",
    start_date: "",
    start_time: "08:00",
    end_date: "",
    end_time: "09:00",
    all_day: false,
    color: "#009439",
  };
  const [localEventForm, setLocalEventForm] = useState(emptyEventForm);
  const [editEventForm, setEditEventForm] = useState(emptyEventForm);

  // ─── Init ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!storedUser || !token) {
      window.location.replace("/");
      return;
    }
    let u;
    try {
      u = JSON.parse(storedUser);
    } catch {
      window.location.replace("/");
      return;
    }
    if (u.role !== "admin" && u.role !== "user") {
      window.location.replace("/");
      return;
    }
    setAdmin(u);

    if (u.role === "admin") fetchUsers();
    fetchOrdinances();
    fetchOfficials();
    fetchSessionMinutes();
    fetchResolutions();
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (activeTab === "calendar") {
      fetchLocalEvents();
      const year = new Date().getFullYear();
      fetchPHHolidays(year);
      fetchPHHolidays(year + 1);
    }
    if (activeTab === "logs") {
      fetchLogs();
      fetchLogStats();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "logs") fetchLogs();
  }, [logModuleFilter, logActionFilter]);

  // ─── Helpers ──────────────────────────────────────────────────────────────────
  const showMsg = (msg, type = "success") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3500);
  };
  const showModalMsg = (msg, type = "success") => {
    setModalMessage(msg);
    setModalMessageType(type);
    setTimeout(() => setModalMessage(""), 3500);
  };
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.replace("/");
  };
  const handleTabChange = (key, subTab = null) => {
    if (!isAdmin && ADMIN_ONLY_TABS.includes(key)) return;
    setActiveTab(key);
    setSubTabRequest(subTab);
    setMobileOpen(false);
  };
  // Only laptops/PCs with a real mouse get hover-to-expand; touch devices keep manual toggle.
  const canHoverSidebar = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const handleSidebarMouseEnter = () => {
    if (canHoverSidebar()) setSidebarCollapsed(false);
  };
  const handleSidebarMouseLeave = () => {
    if (canHoverSidebar()) setSidebarCollapsed(true);
  };

  // ─── Fetches ──────────────────────────────────────────────────────────────────
  const fetchUsers = async () => {
    setFetchingUsers(true);
    try {
      const res = await authFetch(`${API}/api/users`);
      if (res.status === 401 || res.status === 403) {
        if (admin?.role === "admin") {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.replace("/");
        }
        return;
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setFetchingUsers(false);
    }
  };
  const fetchOrdinances = async () => {
    setFetchingOrdinances(true);
    try {
      const d = await (await fetch(`${API}/api/ordinances`)).json();
      setOrdinances(Array.isArray(d) ? d : []);
    } catch {
      setOrdinances([]);
    } finally {
      setFetchingOrdinances(false);
    }
  };
  const fetchResolutions = async () => {
    setFetchingResolutions(true);
    try {
      const d = await (await fetch(`${API}/api/resolutions`)).json();
      setResolutions(Array.isArray(d) ? d : []);
    } catch {
      setResolutions([]);
    } finally {
      setFetchingResolutions(false);
    }
  };
  const fetchOfficials = async () => {
    setFetchingOfficials(true);
    try {
      const d = await (await fetch(`${API}/api/sb-council-members`)).json();
      setOfficials(Array.isArray(d) ? d : []);
    } catch {
      setOfficials([]);
    } finally {
      setFetchingOfficials(false);
    }
  };
  const fetchSessionMinutes = async () => {
    setFetchingMinutes(true);
    try {
      const d = await (await fetch(`${API}/api/session-minutes`)).json();
      setSessionMinutes(Array.isArray(d) ? d : []);
    } catch {
      setSessionMinutes([]);
    } finally {
      setFetchingMinutes(false);
    }
  };
  const fetchAnnouncements = async () => {
    setFetchingAnnouncements(true);
    try {
      const d = await (await fetch(`${API}/api/announcements`)).json();
      setAnnouncements(Array.isArray(d) ? d : []);
    } catch {
      setAnnouncements([]);
    } finally {
      setFetchingAnnouncements(false);
    }
  };
  const fetchLocalEvents = async () => {
    setFetchingCalendar(true);
    try {
      const d = await (await authFetch(`${API}/api/calendar-events`)).json();
      setLocalEvents(Array.isArray(d) ? d : []);
    } catch {
      setLocalEvents([]);
    } finally {
      setFetchingCalendar(false);
    }
  };
  const fetchLogs = async () => {
    setFetchingLogs(true);
    try {
      let url = `${API}/api/activity-logs?limit=100`;
      if (logModuleFilter !== "all") url += `&module=${logModuleFilter}`;
      if (logActionFilter !== "all") url += `&action=${logActionFilter}`;
      const d = await (await authFetch(url)).json();
      setLogs(Array.isArray(d) ? d : []);
    } catch {
      setLogs([]);
    } finally {
      setFetchingLogs(false);
    }
  };
  const fetchLogStats = async () => {
    try {
      const d = await (
        await authFetch(`${API}/api/activity-logs/stats`)
      ).json();
      setLogStats(d);
    } catch {}
  };
  const fetchPHHolidays = async (year) => {
    if (phHolidays[year]) return;
    setFetchingHolidays(true);
    try {
      const res = await fetch(
        `https://date.nager.at/api/v3/PublicHolidays/${year}/PH`
      );
      const data = await res.json();
      setPhHolidays((prev) => ({
        ...prev,
        [year]: data.map((h) => ({
          date: h.date,
          name: h.localName || h.name,
          type: h.types?.includes("Public") ? "national" : "special",
        })),
      }));
    } catch {
      setPhHolidays((prev) => ({ ...prev, [year]: [] }));
    } finally {
      setFetchingHolidays(false);
    }
  };

  // ─── Users / Admins ───────────────────────────────────────────────────────────
  const handleAddAdmin = async () => {
    if (
      !newAdmin.name ||
      !newAdmin.username ||
      !newAdmin.email ||
      !newAdmin.password
    ) {
      showModalMsg("All fields required!", "error");
      return;
    }
    setSubmitting(true);
    const fd = new FormData();
    fd.append("name", newAdmin.name);
    fd.append("username", newAdmin.username);
    fd.append("email", newAdmin.email);
    fd.append("password", newAdmin.password);
    fd.append("position", newAdmin.position || "secretary");
    if (newAdminPhoto) fd.append("photo", newAdminPhoto);
    try {
      const res = await authFetch(`${API}/api/admin/add`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Admin added!");
        setNewAdmin({ name: "", username: "", email: "", password: "", position: "secretary" });
        setNewAdminPhoto(null);
        setShowAddAdminModal(false);
        fetchUsers();
      } else showModalMsg(extractErrorMsg(data, "Failed!"), "error");
    } catch {
      showModalMsg("Server error!", "error");
    } finally {
      setSubmitting(false);
    }
  };
  const handleAddUser = async () => {
    if (
      !newUser.name ||
      !newUser.username ||
      !newUser.email ||
      !newUser.password
    ) {
      showModalMsg("All fields required!", "error");
      return;
    }
    setSubmitting(true);
    const fd = new FormData();
    fd.append("name", newUser.name);
    fd.append("username", newUser.username);
    fd.append("email", newUser.email);
    fd.append("password", newUser.password);
    fd.append("position", newUser.position || "councilor");
    if (newUserPhoto) fd.append("photo", newUserPhoto);
    try {
      const res = await fetch(`${API}/api/register`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("User added!");
        setNewUser({ name: "", username: "", email: "", password: "", position: "councilor" });
        setNewUserPhoto(null);
        setShowAddUserModal(false);
        fetchUsers();
      } else showModalMsg(extractErrorMsg(data, "Failed!"), "error");
    } catch {
      showModalMsg("Server error!", "error");
    } finally {
      setSubmitting(false);
    }
  };
  const handleOpenEditUser = (u) => {
    setEditingUser(u);
    setEditUserForm({
      name: u.name || "",
      username: u.username || "",
      email: u.email || "",
      position: u.position || (u.role === "admin" ? "secretary" : "councilor"),
    });
    setEditUserPhoto(null);
    setModalMessage("");
    setShowEditUserModal(true);
  };
  const handleUpdateUser = async () => {
    if (!editUserForm.name || !editUserForm.username || !editUserForm.email) {
      showModalMsg("Name, username, and email are required!", "error");
      return;
    }
    setSubmitting(true);
    const fd = new FormData();
    fd.append("name", editUserForm.name);
    fd.append("username", editUserForm.username);
    fd.append("email", editUserForm.email);
    fd.append("role", editingUser.role);
    fd.append("position", editUserForm.position);
    if (editUserPhoto) fd.append("photo", editUserPhoto);
    try {
      const res = await authFetch(`${API}/api/users/${editingUser.id}`, {
        method: "PUT",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg(`${editingUser.role === "admin" ? "Admin" : "User"} updated!`);
        setShowEditUserModal(false);
        setEditingUser(null);
        fetchUsers();
      } else showModalMsg(extractErrorMsg(data, "Update failed!"), "error");
    } catch {
      showModalMsg("Server error!", "error");
    } finally {
      setSubmitting(false);
    }
  };
  const handleDeleteUser = async (id) => {
    try {
      const res = await authFetch(`${API}/api/users/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showMsg("User archived!");
        fetchUsers();
      } else showMsg(data.error || "Error!", "error");
    } catch {
      showMsg("Error!", "error");
    }
  };

  // ─── Ordinances ──────────────────────────────────────────────────────────────
  const handleUploadOrdinance = async () => {
    if (
      !ordinanceNumber ||
      !ordinanceTitle ||
      !ordinanceDate ||
      !ordinanceFile
    ) {
      showModalMsg("Please fill all fields and choose a file!", "error");
      return;
    }
    if (
      isDuplicateRecordNumber(ordinances, "ordinance_number", ordinanceNumber)
    ) {
      showModalMsg(
        `"${ordinanceNumber}" is already in use by another ordinance. Please choose a different number.`,
        "error"
      );
      return;
    }
    setSubmitting(true);
    const fd = new FormData();
    fd.append("ordinance_number", ordinanceNumber);
    fd.append("title", ordinanceTitle);
    fd.append("date", ordinanceDate);
    fd.append("year", ordinanceDate.split("-")[0]);
    fd.append("file", ordinanceFile);
    fd.append("officials", JSON.stringify(selectedOfficials));
    try {
      const res = await authFetch(`${API}/api/ordinances/upload`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Ordinance uploaded!");
        if (uploadType === "image-to-text" && data.text) {
          setExtractedText(data.text);
          setShowTextModal(true);
        }
        setOrdinanceNumber("");
        setOrdinanceTitle("");
        setOrdinanceDate("");
        setOrdinanceFile(null);
        setSelectedOfficials([]);
        setUploadType("");
        setShowOrdinanceModal(false);
        fetchOrdinances();
      } else showModalMsg(data.error || "Upload failed!", "error");
    } catch {
      showModalMsg("Server error!", "error");
    } finally {
      setSubmitting(false);
    }
  };
  const handleOpenEditOrdinance = (o) => {
    setEditingOrdinance(o);
    setEditOrdinanceNumber(o.ordinance_number || "");
    setEditOrdinanceTitle(o.title);
    setEditOrdinanceDate(o.date || (o.year ? `${o.year}-01-01` : ""));
    setEditSelectedOfficials(o.officials ? o.officials.map((x) => x.id) : []);
    setEditOrdinanceFile(null);
    setModalMessage("");
    setShowEditOrdinanceModal(true);
  };
  const toggleEditOfficial = (id) =>
    setEditSelectedOfficials((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );
  const handleUpdateOrdinance = async () => {
    if (!editOrdinanceNumber || !editOrdinanceTitle || !editOrdinanceDate) {
      showModalMsg("All fields required!", "error");
      return;
    }
    if (
      isDuplicateRecordNumber(
        ordinances,
        "ordinance_number",
        editOrdinanceNumber,
        editingOrdinance.id
      )
    ) {
      showModalMsg(
        `"${editOrdinanceNumber}" is already in use by another ordinance. Please choose a different number.`,
        "error"
      );
      return;
    }
    setSubmitting(true);
    const fd = new FormData();
    fd.append("ordinance_number", editOrdinanceNumber);
    fd.append("title", editOrdinanceTitle);
    fd.append("date", editOrdinanceDate);
    fd.append("year", editOrdinanceDate.split("-")[0]);
    fd.append("officials", JSON.stringify(editSelectedOfficials));
    if (editOrdinanceFile) fd.append("file", editOrdinanceFile);
    try {
      const res = await authFetch(
        `${API}/api/ordinances/${editingOrdinance.id}`,
        { method: "PUT", body: fd }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Ordinance updated!");
        setShowEditOrdinanceModal(false);
        setEditingOrdinance(null);
        fetchOrdinances();
      } else showModalMsg(data.error || "Update failed!", "error");
    } catch {
      showModalMsg("Server error!", "error");
    } finally {
      setSubmitting(false);
    }
  };
  const handleDeleteOrdinance = async (id) => {
    try {
      const res = await authFetch(`${API}/api/ordinances/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showMsg("Archived!");
        fetchOrdinances();
      } else showMsg(data.error || "Error!", "error");
    } catch {
      showMsg("Error!", "error");
    }
  };
  const toggleOfficial = (id) =>
    setSelectedOfficials((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );

  // ─── Resolutions ─────────────────────────────────────────────────────────────
  const handleUploadResolution = async () => {
    if (
      !resolutionNumber ||
      !resolutionTitle ||
      !resolutionDate ||
      !resolutionFile
    ) {
      showModalMsg("Please fill all fields and choose a file!", "error");
      return;
    }
    if (
      isDuplicateRecordNumber(
        resolutions,
        "resolution_number",
        resolutionNumber
      )
    ) {
      showModalMsg(
        `"${resolutionNumber}" is already in use by another resolution. Please choose a different number.`,
        "error"
      );
      return;
    }
    setSubmitting(true);
    const fd = new FormData();
    fd.append("resolution_number", resolutionNumber);
    fd.append("title", resolutionTitle);
    fd.append("date", resolutionDate);
    fd.append("year", resolutionDate.split("-")[0]);
    fd.append("file", resolutionFile);
    fd.append("officials", JSON.stringify(selectedResolutionOfficials));
    try {
      const res = await authFetch(`${API}/api/resolutions/upload`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Resolution uploaded!");
        setResolutionNumber("");
        setResolutionTitle("");
        setResolutionDate("");
        setResolutionFile(null);
        setSelectedResolutionOfficials([]);
        setShowResolutionModal(false);
        fetchResolutions();
      } else showModalMsg(data.error || "Upload failed!", "error");
    } catch {
      showModalMsg("Server error!", "error");
    } finally {
      setSubmitting(false);
    }
  };
  const handleOpenEditResolution = (r) => {
    setEditingResolution(r);
    setEditResolutionNumber(r.resolution_number || "");
    setEditResolutionTitle(r.title);
    setEditResolutionDate(r.date || (r.year ? `${r.year}-01-01` : ""));
    setEditResolutionSelectedOfficials(
      r.officials ? r.officials.map((x) => x.id) : []
    );
    setEditResolutionFile(null);
    setModalMessage("");
    setShowEditResolutionModal(true);
  };
  const toggleEditResolutionOfficial = (id) =>
    setEditResolutionSelectedOfficials((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );
  const handleUpdateResolution = async () => {
    if (!editResolutionNumber || !editResolutionTitle || !editResolutionDate) {
      showModalMsg("All fields required!", "error");
      return;
    }
    if (
      isDuplicateRecordNumber(
        resolutions,
        "resolution_number",
        editResolutionNumber,
        editingResolution.id
      )
    ) {
      showModalMsg(
        `"${editResolutionNumber}" is already in use by another resolution. Please choose a different number.`,
        "error"
      );
      return;
    }
    setSubmitting(true);
    const fd = new FormData();
    fd.append("resolution_number", editResolutionNumber);
    fd.append("title", editResolutionTitle);
    fd.append("date", editResolutionDate);
    fd.append("year", editResolutionDate.split("-")[0]);
    fd.append("officials", JSON.stringify(editResolutionSelectedOfficials));
    if (editResolutionFile) fd.append("file", editResolutionFile);
    try {
      const res = await authFetch(
        `${API}/api/resolutions/${editingResolution.id}`,
        { method: "PUT", body: fd }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Resolution updated!");
        setShowEditResolutionModal(false);
        setEditingResolution(null);
        fetchResolutions();
      } else showModalMsg(data.error || "Update failed!", "error");
    } catch {
      showModalMsg("Server error!", "error");
    } finally {
      setSubmitting(false);
    }
  };
  const handleDeleteResolution = async (id) => {
    try {
      const res = await authFetch(`${API}/api/resolutions/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showMsg("Resolution archived!");
        fetchResolutions();
      } else showMsg(data.error || "Error!", "error");
    } catch {
      showMsg("Error!", "error");
    }
  };
  const toggleResolutionOfficial = (id) =>
    setSelectedResolutionOfficials((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );

  // ─── Officials ────────────────────────────────────────────────────────────────
  const handleAddOfficial = async () => {
    if (!newOfficial.full_name || !newOfficial.position) {
      showModalMsg("Full name and position are required!", "error");
      return;
    }
    setSubmitting(true);
    const fd = new FormData();
    fd.append("full_name", newOfficial.full_name);
    fd.append("position", newOfficial.position);
    if (newOfficial.term_period)
      fd.append("term_period", newOfficial.term_period);
    if (newOfficial.term_start) fd.append("term_start", newOfficial.term_start);
    if (newOfficial.term_end) fd.append("term_end", newOfficial.term_end);
    fd.append("is_reelected", newOfficial.is_reelected);
    if (newOfficial.notes) fd.append("notes", newOfficial.notes);
    if (officialPhoto) fd.append("photo", officialPhoto);
    try {
      const res = await authFetch(`${API}/api/sb-council-members/add`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Council member added!");
        setNewOfficial({
          full_name: "",
          position: "",
          term_period: "",
          term_start: "",
          term_end: "",
          is_reelected: false,
          notes: "",
        });
        setOfficialPhoto(null);
        setShowOfficialModal(false);
        fetchOfficials();
      } else showModalMsg(data.error || "Failed!", "error");
    } catch {
      showModalMsg("Server error!", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit Official ──
  const handleOpenEditOfficial = (o) => {
    setEditingOfficial(o);
    setEditOfficialName(o.full_name || "");
    setEditOfficialPosition(o.position || "");
    setEditOfficialPhoto(null);
    setModalMessage("");
    setShowEditOfficialModal(true);
  };

  const handleUpdateOfficial = async () => {
    if (!editOfficialName || !editOfficialPosition) {
      showModalMsg("Full name and position are required!", "error");
      return;
    }
    setSubmitting(true);
    const fd = new FormData();
    fd.append("full_name", editOfficialName);
    fd.append("position", editOfficialPosition);
    if (editOfficialPhoto) fd.append("photo", editOfficialPhoto);
    try {
      const res = await authFetch(
        `${API}/api/sb-council-members/${editingOfficial.id}`,
        { method: "PUT", body: fd }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Council member updated!");
        setShowEditOfficialModal(false);
        setEditingOfficial(null);
        fetchOfficials();
      } else showModalMsg(data.error || "Update failed!", "error");
    } catch {
      showModalMsg("Server error!", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOfficial = async (id) => {
    try {
      const res = await authFetch(`${API}/api/sb-council-members/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showMsg("Council member archived!");
        fetchOfficials();
      } else showMsg(data.error || "Error!", "error");
    } catch {
      showMsg("Error!", "error");
    }
  };
  const getOfficialOrdinances = (id) =>
    ordinances.filter(
      (o) => o.officials && o.officials.some((x) => x.id === id)
    );

  // ─── Terms ────────────────────────────────────────────────────────────────────
  const handleOpenAddTerm = (memberId) => {
    setTermTarget({ memberId });
    setTermForm(emptyTermForm);
    setModalMessage("");
    setShowAddTermModal(true);
  };
  const handleSaveTerm = async () => {
    if (!termForm.term_period || !termForm.term_start) {
      showModalMsg("Term period and start date are required!", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch(
        `${API}/api/sb-council-members/${termTarget.memberId}/terms`,
        { method: "POST", body: JSON.stringify(termForm) }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Term added!");
        setShowAddTermModal(false);
        fetchOfficials();
        if (selectedOfficialProfile?.id === termTarget.memberId) {
          const updated = await (
            await fetch(`${API}/api/sb-council-members/${termTarget.memberId}`)
          ).json();
          setSelectedOfficialProfile(updated);
        }
      } else showModalMsg(data.error || "Failed!", "error");
    } catch {
      showModalMsg("Server error!", "error");
    } finally {
      setSubmitting(false);
    }
  };
  const handleOpenEditTerm = (memberId, term) => {
    setTermTarget({ memberId, term });
    setTermForm({
      term_period: term.term_period || "",
      term_start: term.term_start ? term.term_start.split("T")[0] : "",
      term_end: term.term_end ? term.term_end.split("T")[0] : "",
      status: term.status || "active",
      is_reelected: !!term.is_reelected,
      notes: term.notes || "",
    });
    setModalMessage("");
    setShowEditTermModal(true);
  };
  const handleUpdateTerm = async () => {
    if (!termForm.term_period || !termForm.term_start) {
      showModalMsg("Term period and start date are required!", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch(
        `${API}/api/sb-council-members/${termTarget.memberId}/terms/${termTarget.term.id}`,
        { method: "PUT", body: JSON.stringify(termForm) }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Term updated!");
        setShowEditTermModal(false);
        fetchOfficials();
        if (selectedOfficialProfile?.id === termTarget.memberId) {
          const updated = await (
            await fetch(`${API}/api/sb-council-members/${termTarget.memberId}`)
          ).json();
          setSelectedOfficialProfile(updated);
        }
      } else showModalMsg(data.error || "Failed!", "error");
    } catch {
      showModalMsg("Server error!", "error");
    } finally {
      setSubmitting(false);
    }
  };
  const handleDeleteTerm = async (memberId, termId) => {
    try {
      const res = await authFetch(
        `${API}/api/sb-council-members/${memberId}/terms/${termId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        showMsg("Term deleted!");
        fetchOfficials();
        if (selectedOfficialProfile?.id === memberId) {
          const updated = await (
            await fetch(`${API}/api/sb-council-members/${memberId}`)
          ).json();
          setSelectedOfficialProfile(updated);
        }
      } else showMsg(data.error || "Error!", "error");
    } catch {
      showMsg("Error!", "error");
    }
  };

  // ─── Sessions ─────────────────────────────────────────────────────────────────
  const resetSessionForm = () => {
    const suggested = suggestSessionNumber(
      sessionMinutes,
      getCurrentYear(),
      "regular"
    );
    lastSessionSuggestion.current = suggested;
    setSessionForm({
      session_number: suggested,
      session_date: "",
      session_type: "regular",
      venue: "",
      agenda: "",
      minutes_text: "",
    });
    setSessionFile(null);
    setSessionInputMode("text");
  };
  const handleAddSession = async () => {
    if (!sessionForm.session_date) {
      showModalMsg("Session date is required!", "error");
      return;
    }
    if (
      isDuplicateRecordNumber(
        sessionMinutes,
        "session_number",
        sessionForm.session_number
      )
    ) {
      showModalMsg(
        `"${sessionForm.session_number}" is already in use by another session. Please choose a different number.`,
        "error"
      );
      return;
    }
    setSubmitting(true);
    try {
      if (sessionInputMode === "file") {
        if (!sessionFile) {
          showModalMsg("Please upload a file!", "error");
          setSubmitting(false);
          return;
        }
        const fd = new FormData();
        Object.entries(sessionForm).forEach(([k, v]) => fd.append(k, v));
        fd.append("file", sessionFile);
        const res = await authFetch(`${API}/api/session-minutes/upload`, {
          method: "POST",
          body: fd,
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showMsg("Session added!");
          resetSessionForm();
          setShowSessionModal(false);
          fetchSessionMinutes();
        } else showModalMsg(data.error || "Upload failed!", "error");
      } else {
        const res = await authFetch(`${API}/api/session-minutes`, {
          method: "POST",
          body: JSON.stringify(sessionForm),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showMsg("Session minutes saved!");
          resetSessionForm();
          setShowSessionModal(false);
          fetchSessionMinutes();
        } else showModalMsg(data.error || "Save failed!", "error");
      }
    } catch {
      showModalMsg("Server error!", "error");
    } finally {
      setSubmitting(false);
    }
  };
  const handleOpenEditSession = (s) => {
    setEditingSession(s);
    setEditSessionForm({
      session_number: s.session_number || "",
      session_date: s.session_date ? s.session_date.split("T")[0] : "",
      session_type: s.session_type || "regular",
      venue: s.venue || "",
      agenda: s.agenda || "",
      minutes_text: s.minutes_text || "",
    });
    setModalMessage("");
    setShowEditSessionModal(true);
  };
  const handleUpdateSession = async () => {
    if (!editSessionForm.session_date) {
      showModalMsg("Session date is required!", "error");
      return;
    }
    if (
      isDuplicateRecordNumber(
        sessionMinutes,
        "session_number",
        editSessionForm.session_number,
        editingSession.id
      )
    ) {
      showModalMsg(
        `"${editSessionForm.session_number}" is already in use by another session. Please choose a different number.`,
        "error"
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch(
        `${API}/api/session-minutes/${editingSession.id}`,
        { method: "PUT", body: JSON.stringify(editSessionForm) }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Session minutes updated!");
        setShowEditSessionModal(false);
        setEditingSession(null);
        fetchSessionMinutes();
      } else showModalMsg(data.error || "Update failed!", "error");
    } catch {
      showModalMsg("Server error!", "error");
    } finally {
      setSubmitting(false);
    }
  };
  const handleDeleteSession = async (id) => {
    try {
      const res = await authFetch(`${API}/api/session-minutes/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showMsg("Session archived!");
        fetchSessionMinutes();
      } else showMsg(data.error || "Error!", "error");
    } catch {
      showMsg("Error!", "error");
    }
  };

  // ─── Announcements ────────────────────────────────────────────────────────────
  const resetAnnouncementForm = () =>
    setAnnouncementForm({
      title: "",
      body: "",
      priority: "normal",
      expires_at: "",
    });
  const handleAddAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.body) {
      showModalMsg("Title and body are required!", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch(`${API}/api/announcements`, {
        method: "POST",
        body: JSON.stringify(announcementForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Announcement posted!");
        resetAnnouncementForm();
        setShowAnnouncementModal(false);
        fetchAnnouncements();
      } else showModalMsg(data.error || "Failed!", "error");
    } catch {
      showModalMsg("Server error!", "error");
    } finally {
      setSubmitting(false);
    }
  };
  const handleOpenEditAnnouncement = (a) => {
    setEditingAnnouncement(a);
    setEditAnnouncementForm({
      title: a.title || "",
      body: a.body || "",
      priority: a.priority || "normal",
      expires_at: a.expires_at ? a.expires_at.split("T")[0] : "",
    });
    setModalMessage("");
    setShowEditAnnouncementModal(true);
  };
  const handleUpdateAnnouncement = async () => {
    if (!editAnnouncementForm.title || !editAnnouncementForm.body) {
      showModalMsg("Title and body are required!", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch(
        `${API}/api/announcements/${editingAnnouncement.id}`,
        { method: "PUT", body: JSON.stringify(editAnnouncementForm) }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Announcement updated!");
        setShowEditAnnouncementModal(false);
        setEditingAnnouncement(null);
        fetchAnnouncements();
      } else showModalMsg(data.error || "Update failed!", "error");
    } catch {
      showModalMsg("Server error!", "error");
    } finally {
      setSubmitting(false);
    }
  };
  const handleDeleteAnnouncement = async (id) => {
    try {
      const res = await authFetch(`${API}/api/announcements/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showMsg("Announcement deleted!");
        fetchAnnouncements();
      } else showMsg(data.error || "Error!", "error");
    } catch {
      showMsg("Error!", "error");
    }
  };

  // ─── Calendar ─────────────────────────────────────────────────────────────────
  const handleSaveLocalEvent = async () => {
    if (!localEventForm.title || !localEventForm.start_date) {
      showModalMsg("Title and start date are required!", "error");
      return;
    }
    setSavingLocalEvent(true);
    try {
      const res = await authFetch(`${API}/api/calendar-events`, {
        method: "POST",
        body: JSON.stringify(localEventForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Event saved!");
        setShowLocalEventModal(false);
        setLocalEventForm(emptyEventForm);
        fetchLocalEvents();
      } else showModalMsg(data.error || "Failed to save event!", "error");
    } catch {
      showModalMsg("Server error!", "error");
    } finally {
      setSavingLocalEvent(false);
    }
  };
  const handleOpenEditEvent = (ev) => {
    const r = ev.raw;
    setEditingEvent(ev);
    setEditEventForm({
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
    setShowEditEventModal(true);
  };
  const handleUpdateEvent = async () => {
    if (!editEventForm.title || !editEventForm.start_date) {
      showModalMsg("Title and start date are required!", "error");
      return;
    }
    setSavingLocalEvent(true);
    try {
      const res = await authFetch(
        `${API}/api/calendar-events/${editingEvent.dbId}`,
        { method: "PUT", body: JSON.stringify(editEventForm) }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Event updated!");
        setShowEditEventModal(false);
        setEditingEvent(null);
        fetchLocalEvents();
      } else showModalMsg(data.error || "Update failed!", "error");
    } catch {
      showModalMsg("Server error!", "error");
    } finally {
      setSavingLocalEvent(false);
    }
  };
  const handleDeleteEvent = async (dbId) => {
    try {
      const res = await authFetch(`${API}/api/calendar-events/${dbId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showMsg("Event deleted!");
        fetchLocalEvents();
      } else showMsg(data.error || "Error!", "error");
    } catch {
      showMsg("Error!", "error");
    }
  };
  const isAdmin = admin?.role === "admin";
  const position = admin?.position;
  const isSecretary = position === "secretary";
  const isClerk = position === "clerk";
  const isViceMayor = position === "vice_mayor";
  const isCouncilor = position === "councilor";

  const canManageUsers = isSecretary || isClerk;
  const canViewLogs = isSecretary;
  const canViewArchives = isSecretary;
  const canPublishLegislative = isSecretary || isClerk || isViceMayor;
  const canEditLegislative = isSecretary || isClerk;
  const canManageOfficials = isSecretary || isClerk;

  const ADMIN_ONLY_TABS = canManageUsers
    ? canViewLogs
      ? ["users", "admins", "logs", "archives"]
      : ["users", "admins", "archives"]
    : ["users", "admins", "logs", "archives"];
  const pageLoading =
    fetchingUsers ||
    fetchingOrdinances ||
    fetchingOfficials ||
    fetchingMinutes ||
    fetchingResolutions ||
    fetchingAnnouncements;

  const MAlert = () => (
    <ModalAlert message={modalMessage} type={modalMessageType} />
  );

  // ── Quick-action openers ── shared by the sidebar "+ Add" buttons and the
  // Dashboard's Quick Actions panel, so number-suggestion logic lives in one place.
  const openOrdinanceModal = () => {
    setModalMessage("");
    const year = getCurrentYear();
    const suggested = suggestOrdinanceNumber(ordinances, year);
    lastOrdinanceSuggestion.current = suggested;
    setOrdinanceDate(toIsoDate(new Date()));
    setOrdinanceNumber(suggested);
    setShowOrdinanceModal(true);
  };
  const openResolutionModal = () => {
    setModalMessage("");
    const year = getCurrentYear();
    const suggested = suggestResolutionNumber(resolutions, year);
    lastResolutionSuggestion.current = suggested;
    setResolutionNumber(suggested);
    setResolutionTitle("");
    setResolutionDate(toIsoDate(new Date()));
    setResolutionFile(null);
    setSelectedResolutionOfficials([]);
    setShowResolutionModal(true);
  };
  const openSessionModal = () => {
    setModalMessage("");
    resetSessionForm();
    setShowSessionModal(true);
  };
  const openAnnouncementModal = () => {
    setModalMessage("");
    resetAnnouncementForm();
    setShowAnnouncementModal(true);
  };

  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className={styles.container}>
      <div
        className={`${styles.mobileBackdrop} ${
          mobileOpen ? styles.visible : ""
        }`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Mobile topbar */}
      <div className={styles.mobileTopbar}>
        <button
          className={`${styles.hamburgerBtn} ${mobileOpen ? styles.open : ""}`}
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
          <span className={styles.hamburgerLine} />
        </button>
        <span className={styles.mobileTopTitle}>{tabTitles[activeTab]}</span>
        <div style={{ width: 34 }} />
      </div>

      {/* ── SIDEBAR ── */}
      <div
        className={`${styles.sidebar} ${
          sidebarCollapsed ? styles.collapsed : ""
        } ${mobileOpen ? styles.mobileOpen : ""}`}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
      >
        <div className={styles.sidebarHeader}>
          <img src={logo} alt="Balilihan Seal" className={styles.logoCircle} />
          <div className={styles.logoTextWrap}>
            <div className={styles.logoText}>SANGGUNIANG BAYAN OFFICE</div>
            <div className={styles.logoSub}>Admin Portal</div>
          </div>
        </div>
        <nav className={styles.nav}>
          {/* Dashboard */}
          <button
            className={`${styles.navBtn} ${
              activeTab === "dashboard" ? styles.navBtnActive : ""
            }`}
            onClick={() => handleTabChange("dashboard")}
          >
            <span className={styles.navIcon}>
              <Activity size={18} strokeWidth={1.5} />
            </span>
            <span className={styles.navLabel}>Dashboard</span>
          </button>

          <div className={styles.navDivider} />

          {/* Legislative Records dropdown */}
          <div className={styles.navSection}>
            <button
              className={styles.navSectionHeader}
              onClick={() => !sidebarCollapsed && setLegislativeOpen((v) => !v)}
            >
              <span className={styles.navSectionIcon}>
                <ScrollText size={14} strokeWidth={1.8} />
              </span>
              <span className={styles.navSectionLabel}>
                Legislative Records
              </span>
              {!sidebarCollapsed && (
                <span className={styles.navSectionChevron}>
                  {legislativeOpen ? (
                    <ChevronDown size={13} />
                  ) : (
                    <ChevronRight size={13} />
                  )}
                </span>
              )}
            </button>
            <div
              className={`${styles.navSectionItems} ${
                legislativeOpen && !sidebarCollapsed
                  ? styles.navSectionItemsOpen
                  : ""
              }`}
            >
              {[
                {
                  key: "ordinances",
                  icon: <ScrollText size={17} strokeWidth={1.5} />,
                  label: "Ordinances",
                },
                {
                  key: "resolutions",
                  icon: <Gavel size={17} strokeWidth={1.5} />,
                  label: "Resolutions",
                },
                {
                  key: "sessions",
                  icon: <BookOpen size={17} strokeWidth={1.5} />,
                  label: "Session Minutes",
                },
              ].map((t) => (
                <button
                  key={t.key}
                  className={`${styles.navBtn} ${styles.navBtnIndented} ${
                    activeTab === t.key ? styles.navBtnActive : ""
                  }`}
                  onClick={() => handleTabChange(t.key)}
                >
                  <span className={styles.navIcon}>{t.icon}</span>
                  <span className={styles.navLabel}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <button
            className={`${styles.navBtn} ${
              activeTab === "calendar" ? styles.navBtnActive : ""
            }`}
            onClick={() => handleTabChange("calendar")}
          >
            <span className={styles.navIcon}>
              <Calendar size={18} strokeWidth={1.5} />
            </span>
            <span className={styles.navLabel}>Calendar</span>
          </button>

          {/* Announcements */}
          <button
            className={`${styles.navBtn} ${
              activeTab === "announcements" ? styles.navBtnActive : ""
            }`}
            onClick={() => handleTabChange("announcements")}
          >
            <span className={styles.navIcon}>
              <Megaphone size={18} strokeWidth={1.5} />
            </span>
            <span className={styles.navLabel}>Announcements</span>
          </button>

          {/* Councilor Management */}
          <button
            className={`${styles.navBtn} ${
              activeTab === "officials" ? styles.navBtnActive : ""
            }`}
            onClick={() => handleTabChange("officials")}
          >
            <span className={styles.navIcon}>
              <Landmark size={18} strokeWidth={1.5} />
            </span>
            <span className={styles.navLabel}>Councilor Management</span>
          </button>

          {/* Content Management */}
          <button
            className={`${styles.navBtn} ${
              activeTab === "content" ? styles.navBtnActive : ""
            }`}
            onClick={() => handleTabChange("content")}
          >
            <span className={styles.navIcon}>
              <FileText size={18} strokeWidth={1.5} />
            </span>
            <span className={styles.navLabel}>Content Management</span>
          </button>

          {/* Archives */}
          {canViewArchives && (
            <button
              className={`${styles.navBtn} ${
                activeTab === "archives" ? styles.navBtnActive : ""
              }`}
              onClick={() => handleTabChange("archives")}
            >
              <span className={styles.navIcon}>
                <Archive size={18} strokeWidth={1.5} />
              </span>
              <span className={styles.navLabel}>Archives</span>
            </button>
          )}

          {canManageUsers && (
            <>
              <div className={styles.navDivider} />

              {/* User Management dropdown */}
              <div className={styles.navSection}>
                <button
                  className={styles.navSectionHeader}
                  onClick={() =>
                    !sidebarCollapsed && setUserMgmtOpen((v) => !v)
                  }
                >
                  <span className={styles.navSectionIcon}>
                    <Users size={14} strokeWidth={1.8} />
                  </span>
                  <span className={styles.navSectionLabel}>
                    User Management
                  </span>
                  {!sidebarCollapsed && (
                    <span className={styles.navSectionChevron}>
                      {userMgmtOpen ? (
                        <ChevronDown size={13} />
                      ) : (
                        <ChevronRight size={13} />
                      )}
                    </span>
                  )}
                </button>
                <div
                  className={`${styles.navSectionItems} ${
                    userMgmtOpen && !sidebarCollapsed
                      ? styles.navSectionItemsOpen
                      : ""
                  }`}
                >
                  {[
                    {
                      key: "users",
                      icon: <Users size={17} strokeWidth={1.5} />,
                      label: "Manage Users",
                    },
                    {
                      key: "admins",
                      icon: <ShieldCheck size={17} strokeWidth={1.5} />,
                      label: "Manage Admins",
                    },
                    ...(canViewLogs
                      ? [
                          {
                            key: "logs",
                            icon: <Activity size={17} strokeWidth={1.5} />,
                            label: "Activity Logs",
                          },
                        ]
                      : []),
                  ].map((t) => (
                    <button
                      key={t.key}
                      className={`${styles.navBtn} ${styles.navBtnIndented} ${
                        activeTab === t.key ? styles.navBtnActive : ""
                      }`}
                      onClick={() => handleTabChange(t.key)}
                    >
                      <span className={styles.navIcon}>{t.icon}</span>
                      <span className={styles.navLabel}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </nav>
        <div className={styles.sidebarFooter}>
          <div className={styles.adminInfo}>
            <UserAvatar name={admin?.name} photo={admin?.photo} size={34} fallbackBg="#c09a3c" />
            <div className={styles.adminTextWrap}>
              <div className={styles.adminName}>{admin?.name}</div>
              <div className={styles.adminRole}>
                {position === "secretary"
                  ? "Secretary"
                  : position === "clerk"
                  ? "Clerk"
                  : position === "vice_mayor"
                  ? "Vice Mayor"
                  : position === "councilor"
                  ? "Councilor"
                  : isAdmin
                  ? "Administrator"
                  : "User"}
              </div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={15} strokeWidth={1.5} />
            <span className={styles.logoutLabel}>Logout</span>
          </button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className={styles.main}>
        <div
          className={styles.header}
          style={activeTab === "dashboard" ? { display: "none" } : {}}
        >
          <div>
            <h1 className={styles.headerTitle}>{tabTitles[activeTab]}</h1>
            <p className={styles.headerSub}>LGU Administration Dashboard</p>
          </div>
          <div className={styles.headerActions}>
            {activeTab === "users" && isAdmin && (
              <button
                className={styles.addBtn}
                onClick={() => {
                  setModalMessage("");
                  setNewUserPhoto(null);
                  setShowAddUserModal(true);
                }}
              >
                + Add User
              </button>
            )}
            {activeTab === "admins" && isAdmin && (
              <button
                className={styles.addBtn}
                onClick={() => {
                  setModalMessage("");
                  setNewAdminPhoto(null);
                  setShowAddAdminModal(true);
                }}
              >
                + Add Admin
              </button>
            )}
            {activeTab === "ordinances" && isAdmin && (
              <button className={styles.addBtn} onClick={openOrdinanceModal}>
                + Upload Ordinance
              </button>
            )}
            {activeTab === "resolutions" && isAdmin && (
              <button className={styles.addBtn} onClick={openResolutionModal}>
                + Upload Resolution
              </button>
            )}
            {activeTab === "sessions" && isAdmin && (
              <button className={styles.addBtn} onClick={openSessionModal}>
                + Add Session
              </button>
            )}
            {activeTab === "announcements" && isAdmin && (
              <button className={styles.addBtn} onClick={openAnnouncementModal}>
                + New Announcement
              </button>
            )}
            {activeTab === "logs" && isAdmin && (
              <button
                className={styles.addBtn}
                onClick={() => {
                  fetchLogs();
                  fetchLogStats();
                }}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                <RefreshCw size={14} /> Refresh
              </button>
            )}
          </div>
        </div>

        {message && (
          <div
            className={`${styles.message} ${
              messageType === "error" ? styles.messageError : ""
            }`}
          >
            <AlertCircle size={14} /> {message}
            <button className={styles.closeMsg} onClick={() => setMessage("")}>
              <X size={13} />
            </button>
          </div>
        )}
        {pageLoading && (
          <div className={styles.loadingBar}>Loading data...</div>
        )}

        {/* ── PAGE COMPONENTS ── */}
        {activeTab === "dashboard" && (
          <DashboardPage
            ordinances={ordinances}
            resolutions={resolutions}
            sessionMinutes={sessionMinutes}
            announcements={announcements}
            onNavigate={handleTabChange}
            canQuickAdd={isAdmin}
            onAddOrdinance={openOrdinanceModal}
            onAddResolution={openResolutionModal}
            onAddSession={openSessionModal}
            onAddAnnouncement={openAnnouncementModal}
            isViceMayor={isViceMayor}
            isSecretary={isSecretary}
            isClerk={isClerk}
          />
        )}
        {activeTab === "users" && !fetchingUsers && (
          <UsersPage users={users} setDeleteTarget={setDeleteTarget} onEdit={handleOpenEditUser} />
        )}
        {activeTab === "admins" && !fetchingUsers && (
          <AdminsPage users={users} setDeleteTarget={setDeleteTarget} onEdit={handleOpenEditUser} />
        )}
        {activeTab === "ordinances" && !fetchingOrdinances && (
          <OrdinancesPage
            ordinances={ordinances}
            setDeleteTarget={setDeleteTarget}
            onEdit={handleOpenEditOrdinance}
            readOnly={!canEditLegislative}
            canPublish={canPublishLegislative}
            isViceMayor={isViceMayor}
            isSecretary={isSecretary}
            isClerk={isClerk}
            onRefresh={fetchOrdinances}
            initialSubTab={activeTab === "ordinances" ? subTabRequest : null}
          />
        )}
        {activeTab === "resolutions" && !fetchingResolutions && (
          <ResolutionsPage
            resolutions={resolutions}
            setDeleteTarget={setDeleteTarget}
            onEdit={handleOpenEditResolution}
            readOnly={!canEditLegislative}
            canPublish={canPublishLegislative}
            isViceMayor={isViceMayor}
            isSecretary={isSecretary}
            isClerk={isClerk}
            onRefresh={fetchResolutions}
            initialSubTab={activeTab === "resolutions" ? subTabRequest : null}
          />
        )}

        {/* ── OFFICIALS PAGE — group-by-council wiring ── */}
        {activeTab === "officials" && !fetchingOfficials && (
          <OfficialsPage
            officials={officials}
            ordinances={ordinances}
            setDeleteTarget={setDeleteTarget}
            onViewProfile={(o) => {
              setSelectedOfficialProfile(o);
              setShowOfficialProfile(true);
            }}
            onEditMember={handleOpenEditOfficial}
            onAddMember={(termPeriod) => {
              setNewOfficial({
                full_name: "",
                position: "",
                term_period: termPeriod || "",
                term_start: "",
                term_end: "",
                is_reelected: false,
                notes: "",
              });
              setOfficialPhoto(null);
              setModalMessage("");
              setShowOfficialModal(true);
            }}
            readOnly={!canManageOfficials}
          />
        )}

        {activeTab === "sessions" && !fetchingMinutes && (
          <SessionsPage
            sessionMinutes={sessionMinutes}
            setDeleteTarget={setDeleteTarget}
            onEdit={handleOpenEditSession}
            readOnly={!canEditLegislative}
            canPublish={canPublishLegislative}
            isViceMayor={isViceMayor}
            isSecretary={isSecretary}
            isClerk={isClerk}
            onRefresh={fetchSessionMinutes}
            initialSubTab={activeTab === "sessions" ? subTabRequest : null}
          />
        )}
        {activeTab === "announcements" && !fetchingAnnouncements && (
          <AnnouncementsPage
            announcements={announcements}
            setDeleteTarget={setDeleteTarget}
            onEdit={handleOpenEditAnnouncement}
            onOpenComposer={openAnnouncementModal}
            onRefresh={fetchAnnouncements}
            readOnly={false}
            currentUser={{
              id: admin?.id,
              name: admin?.name,
              photo: admin?.photo,
              initials: (admin?.name || "?").trim().charAt(0).toUpperCase(),
              role: isViceMayor || isCouncilor ? "Councilor" : isAdmin ? "Admin" : "Staff",
            }}
          />
        )}
        {activeTab === "calendar" && (
          <CalendarPage
            localEvents={localEvents}
            phHolidays={phHolidays}
            fetchingHolidays={fetchingHolidays}
            showHolidays={showHolidays}
            setShowHolidays={setShowHolidays}
            onAddEvent={(dateStr) => {
              setLocalEventForm({
                ...emptyEventForm,
                start_date: dateStr,
                end_date: dateStr,
              });
              setModalMessage("");
              setShowLocalEventModal(true);
            }}
            onEditEvent={handleOpenEditEvent}
            onDeleteEvent={handleDeleteEvent}
            isAdmin={isAdmin}
            currentUser={admin}
          />
        )}
        {activeTab === "logs" && canViewLogs && (
          <LogsPage
            logs={logs}
            logStats={logStats}
            fetchingLogs={fetchingLogs}
            logModuleFilter={logModuleFilter}
            setLogModuleFilter={setLogModuleFilter}
            logActionFilter={logActionFilter}
            setLogActionFilter={setLogActionFilter}
            onRefresh={() => {
              fetchLogs();
              fetchLogStats();
            }}
          />
        )}
        {activeTab === "content" && (
          <ContentManagementPage isAdmin={isAdmin} currentUser={admin} />
        )}
        {activeTab === "archives" && canViewArchives && <ArchivesPage />}
      </div>

      {/* ══════════════════ MODALS ══════════════════ */}

      {/* Add Admin */}
      {showAddAdminModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowAddAdminModal(false);
            setModalMessage("");
          }}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <h2
                className={styles.modalTitle}
                style={{ margin: 0, fontSize: 18 }}
              >
                Add New Admin
              </h2>
              <button
                onClick={() => {
                  setShowAddAdminModal(false);
                  setModalMessage("");
                }}
                aria-label="Close modal"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                overscrollBehavior: "contain",
              }}
            >
              <input
                className={styles.input}
                placeholder="Full Name"
                value={newAdmin.name}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, name: e.target.value })
                }
              />
              <input
                className={styles.input}
                placeholder="Username"
                value={newAdmin.username}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, username: e.target.value })
                }
              />
              <input
                className={styles.input}
                type="email"
                placeholder="Email Address"
                value={newAdmin.email}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, email: e.target.value })
                }
              />
              <input
                className={styles.input}
                type="password"
                placeholder="Password"
                value={newAdmin.password}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, password: e.target.value })
                }
              />
              <label className={styles.fieldLabel}>Position</label>
              <select
                className={styles.input}
                value={newAdmin.position}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, position: e.target.value })
                }
              >
                <option value="secretary">Secretary</option>
                <option value="clerk">Clerk</option>
              </select>
              <div className={styles.fileUploadBox}>
                <input
                  type="file"
                  accept="image/*"
                  id="newAdminPhotoInput"
                  style={{ display: "none" }}
                  onChange={(e) => setNewAdminPhoto(e.target.files[0])}
                />
                <label htmlFor="newAdminPhotoInput" className={styles.fileLabel}>
                  {newAdminPhoto ? (
                    <>
                      <CheckSquare size={14} strokeWidth={1.5} />{" "}
                      {newAdminPhoto.name}
                    </>
                  ) : (
                    <>
                      <Upload size={14} strokeWidth={1.5} /> Click to upload
                      profile photo (optional)
                    </>
                  )}
                </label>
              </div>
              <MAlert />
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowAddAdminModal(false);
                  setModalMessage("");
                }}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleAddAdmin}
                disabled={submitting}
              >
                {submitting ? "Adding..." : "Add Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User */}
      {showAddUserModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowAddUserModal(false);
            setModalMessage("");
          }}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <h2
                className={styles.modalTitle}
                style={{ margin: 0, fontSize: 18 }}
              >
                Add New User
              </h2>
              <button
                onClick={() => {
                  setShowAddUserModal(false);
                  setModalMessage("");
                }}
                aria-label="Close modal"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                overscrollBehavior: "contain",
              }}
            >
              <input
                className={styles.input}
                placeholder="Full Name"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
              />
              <input
                className={styles.input}
                placeholder="Username"
                value={newUser.username}
                onChange={(e) =>
                  setNewUser({ ...newUser, username: e.target.value })
                }
              />
              <input
                className={styles.input}
                type="email"
                placeholder="Email Address"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
              />
              <input
                className={styles.input}
                type="password"
                placeholder="Password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
              />
              <label className={styles.fieldLabel}>Position</label>
              <select
                className={styles.input}
                value={newUser.position}
                onChange={(e) =>
                  setNewUser({ ...newUser, position: e.target.value })
                }
              >
                <option value="councilor">Councilor</option>
                <option value="vice_mayor">Vice Mayor</option>
              </select>
              <div className={styles.fileUploadBox}>
                <input
                  type="file"
                  accept="image/*"
                  id="newUserPhotoInput"
                  style={{ display: "none" }}
                  onChange={(e) => setNewUserPhoto(e.target.files[0])}
                />
                <label htmlFor="newUserPhotoInput" className={styles.fileLabel}>
                  {newUserPhoto ? (
                    <>
                      <CheckSquare size={14} strokeWidth={1.5} />{" "}
                      {newUserPhoto.name}
                    </>
                  ) : (
                    <>
                      <Upload size={14} strokeWidth={1.5} /> Click to upload
                      profile photo (optional)
                    </>
                  )}
                </label>
              </div>
              <MAlert />
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowAddUserModal(false);
                  setModalMessage("");
                }}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleAddUser}
                disabled={submitting}
              >
                {submitting ? "Adding..." : "Add User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit User / Edit Admin modal (shared) ── */}
      {showEditUserModal && editingUser && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowEditUserModal(false);
            setEditingUser(null);
            setModalMessage("");
          }}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <h2
                className={styles.modalTitle}
                style={{ margin: 0, fontSize: 18 }}
              >
                Edit {editingUser.role === "admin" ? "Admin" : "User"}
              </h2>
              <button
                onClick={() => {
                  setShowEditUserModal(false);
                  setEditingUser(null);
                  setModalMessage("");
                }}
                aria-label="Close modal"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                overscrollBehavior: "contain",
              }}
            >
              <label className={styles.fieldLabel}>
                Full Name <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <input
                className={styles.input}
                placeholder="Full Name"
                value={editUserForm.name}
                onChange={(e) =>
                  setEditUserForm({ ...editUserForm, name: e.target.value })
                }
              />
              <label className={styles.fieldLabel}>
                Username <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <input
                className={styles.input}
                placeholder="Username"
                value={editUserForm.username}
                onChange={(e) =>
                  setEditUserForm({ ...editUserForm, username: e.target.value })
                }
              />
              <label className={styles.fieldLabel}>
                Email Address <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <input
                className={styles.input}
                type="email"
                placeholder="Email Address"
                value={editUserForm.email}
                onChange={(e) =>
                  setEditUserForm({ ...editUserForm, email: e.target.value })
                }
              />
              <label className={styles.fieldLabel}>Position</label>
              <select
                className={styles.input}
                value={editUserForm.position}
                onChange={(e) =>
                  setEditUserForm({ ...editUserForm, position: e.target.value })
                }
              >
                {editingUser.role === "admin" ? (
                  <>
                    <option value="secretary">Secretary</option>
                    <option value="clerk">Clerk</option>
                  </>
                ) : (
                  <>
                    <option value="councilor">Councilor</option>
                    <option value="vice_mayor">Vice Mayor</option>
                  </>
                )}
              </select>
              <div className={styles.fileUploadBox}>
                <input
                  type="file"
                  accept="image/*"
                  id="editUserPhotoInput"
                  style={{ display: "none" }}
                  onChange={(e) => setEditUserPhoto(e.target.files[0])}
                />
                <label htmlFor="editUserPhotoInput" className={styles.fileLabel}>
                  {editUserPhoto ? (
                    <>
                      <CheckSquare size={14} strokeWidth={1.5} />{" "}
                      {editUserPhoto.name}
                    </>
                  ) : (
                    <>
                      <Upload size={14} strokeWidth={1.5} /> Click to replace
                      photo (optional)
                    </>
                  )}
                </label>
                {editingUser.photo && !editUserPhoto && (
                  <p className={styles.fileHint}>Current photo on file</p>
                )}
              </div>
              <MAlert />
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowEditUserModal(false);
                  setEditingUser(null);
                  setModalMessage("");
                }}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleUpdateUser}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Council Member modal ── */}
      {showOfficialModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowOfficialModal(false);
            setModalMessage("");
          }}
        >
          <div
            className={`${styles.modal} ${styles.sessionModal}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
              overflow: "hidden",
            }}
          >
            {/* ── Sticky header ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
                position: "sticky",
                top: 0,
                zIndex: 2,
              }}
            >
              <h2
                className={styles.modalTitle}
                style={{ margin: 0, fontSize: 18 }}
              >
                Add Council Member
              </h2>
              <button
                onClick={() => {
                  setShowOfficialModal(false);
                  setModalMessage("");
                }}
                aria-label="Close modal"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fee2e2";
                  e.currentTarget.style.color = "#dc2626";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                overscrollBehavior: "contain",
              }}
            >
              {/* Council banner */}
              {newOfficial.term_period && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 12px",
                    background: "#ebf4ff",
                    border: "1px solid #bee3f8",
                    borderRadius: 8,
                    marginBottom: 14,
                    fontSize: 13,
                    color: "#1a365d",
                    fontWeight: 600,
                  }}
                >
                  <CalendarDays size={14} strokeWidth={1.5} />
                  Adding to council: {newOfficial.term_period}
                </div>
              )}

              <label className={styles.fieldLabel}>
                Full Name <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <input
                className={styles.input}
                placeholder="Full Name"
                value={newOfficial.full_name}
                onChange={(e) =>
                  setNewOfficial({ ...newOfficial, full_name: e.target.value })
                }
              />

              <label className={styles.fieldLabel}>
                Position <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <select
                className={styles.input}
                value={newOfficial.position}
                onChange={(e) =>
                  setNewOfficial({ ...newOfficial, position: e.target.value })
                }
              >
                <option value="">Select position...</option>
                {OFFICIAL_POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <div className={styles.fileUploadBox}>
                <input
                  type="file"
                  accept="image/*"
                  id="photoInput"
                  style={{ display: "none" }}
                  onChange={(e) => setOfficialPhoto(e.target.files[0])}
                />
                <label htmlFor="photoInput" className={styles.fileLabel}>
                  {officialPhoto ? (
                    <>
                      <CheckSquare size={14} strokeWidth={1.5} />{" "}
                      {officialPhoto.name}
                    </>
                  ) : (
                    <>
                      <Upload size={14} strokeWidth={1.5} /> Click to upload
                      photo (optional)
                    </>
                  )}
                </label>
              </div>

              <div
                style={{
                  marginTop: 14,
                  padding: "14px 16px",
                  background: "#f8fafc",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#1a365d",
                    marginBottom: 10,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                  }}
                >
                  <History size={13} /> Term Details{" "}
                  <span
                    style={{
                      fontWeight: 500,
                      color: "#94a3b8",
                      textTransform: "none",
                      letterSpacing: 0,
                    }}
                  >
                    (optional)
                  </span>
                </div>
                <TermFormFields
                  form={newOfficial}
                  setForm={setNewOfficial}
                  styles={styles}
                />
              </div>

              <MAlert />
            </div>

            {/* ── Sticky footer ── */}
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
                position: "sticky",
                bottom: 0,
                zIndex: 2,
              }}
            >
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowOfficialModal(false);
                  setModalMessage("");
                }}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleAddOfficial}
                disabled={submitting}
              >
                {submitting ? "Adding..." : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Council Member */}
      {showEditOfficialModal && editingOfficial && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowEditOfficialModal(false);
            setEditingOfficial(null);
            setModalMessage("");
          }}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <h2
                className={styles.modalTitle}
                style={{ margin: 0, fontSize: 18 }}
              >
                Edit Council Member
              </h2>
              <button
                onClick={() => {
                  setShowEditOfficialModal(false);
                  setEditingOfficial(null);
                  setModalMessage("");
                }}
                aria-label="Close modal"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                overscrollBehavior: "contain",
              }}
            >
              <label className={styles.fieldLabel}>
                Full Name <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <input
                className={styles.input}
                placeholder="Full Name"
                value={editOfficialName}
                onChange={(e) => setEditOfficialName(e.target.value)}
              />
              <label className={styles.fieldLabel}>
                Position <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <select
                className={styles.input}
                value={editOfficialPosition}
                onChange={(e) => setEditOfficialPosition(e.target.value)}
              >
                <option value="">Select position...</option>
                {OFFICIAL_POSITIONS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <div className={styles.fileUploadBox}>
                <input
                  type="file"
                  accept="image/*"
                  id="editPhotoInput"
                  style={{ display: "none" }}
                  onChange={(e) => setEditOfficialPhoto(e.target.files[0])}
                />
                <label htmlFor="editPhotoInput" className={styles.fileLabel}>
                  {editOfficialPhoto ? (
                    <>
                      <CheckSquare size={14} strokeWidth={1.5} />{" "}
                      {editOfficialPhoto.name}
                    </>
                  ) : (
                    <>
                      <Upload size={14} strokeWidth={1.5} /> Click to replace
                      photo (optional)
                    </>
                  )}
                </label>
                {editingOfficial.photo && !editOfficialPhoto && (
                  <p className={styles.fileHint}>Current photo on file</p>
                )}
              </div>
              <MAlert />
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowEditOfficialModal(false);
                  setEditingOfficial(null);
                  setModalMessage("");
                }}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleUpdateOfficial}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Profile */}
      {showOfficialProfile && selectedOfficialProfile && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowOfficialProfile(false)}
        >
          <div
            className={styles.profileModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.profileHeader}>
              {selectedOfficialProfile.photo ? (
                <img
                  src={selectedOfficialProfile.photo}
                  alt={selectedOfficialProfile.full_name}
                  className={styles.profilePhoto}
                />
              ) : (
                <div className={styles.profileAvatar}>
                  {selectedOfficialProfile.full_name.charAt(0)}
                </div>
              )}
              <div>
                <div className={styles.profileName}>
                  {selectedOfficialProfile.full_name}
                </div>
                <div className={styles.profilePosition}>
                  {selectedOfficialProfile.position}
                </div>
                {selectedOfficialProfile.active_term && (
                  <div
                    style={{
                      marginTop: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <TermStatusBadge
                      status={selectedOfficialProfile.active_term.status}
                    />
                    <span style={{ fontSize: 12, color: "#4a5568" }}>
                      {selectedOfficialProfile.active_term.term_period}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div style={{ margin: "16px 0" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#1a365d",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <History size={14} strokeWidth={1.5} /> Term History (
                  {(selectedOfficialProfile.terms || []).length})
                </h3>
                <button
                  className={styles.addBtn}
                  style={{ fontSize: 11, padding: "4px 10px" }}
                  onClick={() => handleOpenAddTerm(selectedOfficialProfile.id)}
                >
                  + Add Term
                </button>
              </div>
              {(selectedOfficialProfile.terms || []).length === 0 ? (
                <p
                  style={{
                    fontSize: 13,
                    color: "#a0aec0",
                    textAlign: "center",
                    padding: "12px 0",
                  }}
                >
                  No term records yet.
                </p>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {(selectedOfficialProfile.terms || []).map((term) => (
                    <div
                      key={term.id}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                        background:
                          term.status === "active" ? "#f0fff4" : "#f8fafc",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            flexWrap: "wrap",
                            marginBottom: 3,
                          }}
                        >
                          <span style={{ fontWeight: 700, fontSize: 13 }}>
                            {term.term_period}
                          </span>
                          <TermStatusBadge status={term.status} />
                          {term.is_reelected && (
                            <span
                              style={{
                                fontSize: 10,
                                padding: "1px 6px",
                                borderRadius: 10,
                                background: "#dbeafe",
                                color: "#1e40af",
                                fontWeight: 600,
                              }}
                            >
                              Re-elected
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "#718096" }}>
                          {formatDate(term.term_start)} →{" "}
                          {term.term_end ? (
                            formatDate(term.term_end)
                          ) : (
                            <em>Present</em>
                          )}
                        </div>
                        {term.notes && (
                          <div
                            style={{
                              fontSize: 11,
                              color: "#a0aec0",
                              marginTop: 3,
                            }}
                          >
                            {term.notes}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        <button
                          className={styles.editBtn}
                          style={{ fontSize: 11, padding: "3px 8px" }}
                          onClick={() =>
                            handleOpenEditTerm(selectedOfficialProfile.id, term)
                          }
                        >
                          <Pencil size={11} /> Edit
                        </button>
                        <button
                          className={styles.deleteBtn}
                          style={{ fontSize: 11, padding: "3px 8px" }}
                          onClick={() =>
                            setDeleteTarget({
                              id: term.id,
                              type: "term",
                              name: term.term_period,
                              memberId: selectedOfficialProfile.id,
                            })
                          }
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.profileOrdinances}>
              <h3 className={styles.profileOrdinancesTitle}>
                <ClipboardList size={15} strokeWidth={1.5} /> Ordinances Passed
                ({getOfficialOrdinances(selectedOfficialProfile.id).length})
              </h3>
              {getOfficialOrdinances(selectedOfficialProfile.id).length ===
              0 ? (
                <p className={styles.empty}>No ordinances passed yet.</p>
              ) : (
                getOfficialOrdinances(selectedOfficialProfile.id).map((o) => (
                  <div key={o.id} className={styles.profileOrdinanceItem}>
                    <div className={styles.profileOrdinanceLeft}>
                      <span
                        className={`${styles.badge} ${
                          o.filetype === "application/pdf"
                            ? styles.badgeAdmin
                            : styles.badgeGray
                        }`}
                      >
                        {o.filetype === "application/pdf" ? "PDF" : "OCR"}
                      </span>
                      <div>
                        <div className={styles.profileOrdinanceName}>
                          {o.title}
                        </div>
                        <div className={styles.profileOrdinanceDate}>
                          {new Date(o.uploaded_at).toLocaleDateString("en-PH", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                    <a
                      href={o.filepath}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.viewBtn}
                    >
                      <Eye size={13} /> View
                    </a>
                  </div>
                ))
              )}
            </div>
            <div className={styles.modalBtns}>
              <button
                className={styles.confirmBtn}
                onClick={() => setShowOfficialProfile(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Term */}
      {showAddTermModal && termTarget && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowAddTermModal(false);
            setModalMessage("");
          }}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <h2
                className={styles.modalTitle}
                style={{ margin: 0, fontSize: 18 }}
              >
                <History size={16} /> Add Term Record
              </h2>
              <button
                onClick={() => {
                  setShowAddTermModal(false);
                  setModalMessage("");
                }}
                aria-label="Close modal"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                overscrollBehavior: "contain",
              }}
            >
              <TermFormFields
                form={termForm}
                setForm={setTermForm}
                styles={styles}
              />
              <MAlert />
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowAddTermModal(false);
                  setModalMessage("");
                }}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleSaveTerm}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Term"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Term */}
      {showEditTermModal && termTarget && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowEditTermModal(false);
            setModalMessage("");
          }}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <h2
                className={styles.modalTitle}
                style={{ margin: 0, fontSize: 18 }}
              >
                <Pencil size={16} /> Edit Term Record
              </h2>
              <button
                onClick={() => {
                  setShowEditTermModal(false);
                  setModalMessage("");
                }}
                aria-label="Close modal"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                overscrollBehavior: "contain",
              }}
            >
              <TermFormFields
                form={termForm}
                setForm={setTermForm}
                styles={styles}
              />
              <MAlert />
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowEditTermModal(false);
                  setModalMessage("");
                }}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleUpdateTerm}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Ordinance */}
      {showOrdinanceModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowOrdinanceModal(false);
            setOrdinanceFile(null);
            setOrdinanceNumber("");
            setOrdinanceTitle("");
            setOrdinanceDate("");
            setSelectedOfficials([]);
            setUploadType("");
            setModalMessage("");
            lastOrdinanceSuggestion.current = "";
          }}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
              overflow: "hidden",
            }}
          >
            {/* ── Sticky header ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <h2
                className={styles.modalTitle}
                style={{ margin: 0, fontSize: 18 }}
              >
                Upload Ordinance
              </h2>
              <button
                onClick={() => {
                  setShowOrdinanceModal(false);
                  setOrdinanceFile(null);
                  setOrdinanceNumber("");
                  setOrdinanceTitle("");
                  setOrdinanceDate("");
                  setSelectedOfficials([]);
                  setUploadType("");
                  setModalMessage("");
                  lastOrdinanceSuggestion.current = "";
                }}
                aria-label="Close modal"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                overscrollBehavior: "contain",
              }}
            >
              <input
                className={styles.input}
                placeholder="Ordinance Number (e.g. Ordinance No. 2024-001)"
                value={ordinanceNumber}
                onChange={(e) => setOrdinanceNumber(e.target.value)}
              />
              <p
                className={styles.fileHint}
                style={{ marginTop: -6, marginBottom: 10 }}
              >
                Suggested automatically based on the year and existing
                ordinances — feel free to edit it.
              </p>
              <input
                className={styles.input}
                placeholder="Ordinance Title"
                value={ordinanceTitle}
                onChange={(e) => setOrdinanceTitle(e.target.value)}
              />
              <label className={styles.fieldLabel}>Date</label>
              <input
                className={styles.input}
                type="date"
                value={ordinanceDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setOrdinanceDate(newDate);
                  // Only refresh the suggested number if the user hasn't
                  // manually customized it away from the last suggestion.
                  if (ordinanceNumber === lastOrdinanceSuggestion.current) {
                    const newYear = newDate ? newDate.split("-")[0] : "";
                    const suggested = suggestOrdinanceNumber(
                      ordinances,
                      newYear
                    );
                    lastOrdinanceSuggestion.current = suggested;
                    setOrdinanceNumber(suggested);
                  }
                }}
              />
              <div className={styles.fileUploadBox}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  id="fileInput"
                  style={{ display: "none" }}
                  onChange={(e) => setOrdinanceFile(e.target.files[0])}
                />
                <label htmlFor="fileInput" className={styles.fileLabel}>
                  {ordinanceFile ? (
                    <>
                      <CheckSquare size={14} strokeWidth={1.5} />{" "}
                      {ordinanceFile.name}
                    </>
                  ) : (
                    <>
                      <Upload size={14} strokeWidth={1.5} /> Click to choose
                      file
                    </>
                  )}
                </label>
                <p className={styles.fileHint}>
                  Accepted: PDF, Word (.doc/.docx), or Image (JPG, PNG)
                </p>
              </div>

              <div className={styles.officialsSelectSection}>
                <p className={styles.officialsSelectLabel}>
                  Tag Council Members who passed this ordinance:
                </p>
                <OfficialsCheckList
                  officials={officials}
                  selected={selectedOfficials}
                  onToggle={toggleOfficial}
                  styles={styles}
                />
              </div>
              <MAlert />
            </div>

            {/* ── Sticky footer ── */}
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowOrdinanceModal(false);
                  setOrdinanceFile(null);
                  setOrdinanceNumber("");
                  setOrdinanceTitle("");
                  setOrdinanceDate("");
                  setSelectedOfficials([]);
                  setUploadType("");
                  setModalMessage("");
                  lastOrdinanceSuggestion.current = "";
                }}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleUploadOrdinance}
                disabled={submitting}
              >
                {submitting ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Ordinance */}
      {showEditOrdinanceModal && editingOrdinance && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowEditOrdinanceModal(false);
            setEditingOrdinance(null);
            setModalMessage("");
          }}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
              overflow: "hidden",
            }}
          >
            {/* ── Sticky header ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <h2
                className={styles.modalTitle}
                style={{ margin: 0, fontSize: 18 }}
              >
                Edit Ordinance
              </h2>
              <button
                onClick={() => {
                  setShowEditOrdinanceModal(false);
                  setEditingOrdinance(null);
                  setModalMessage("");
                }}
                aria-label="Close modal"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                overscrollBehavior: "contain",
              }}
            >
              <input
                className={styles.input}
                placeholder="Ordinance Number"
                value={editOrdinanceNumber}
                onChange={(e) => setEditOrdinanceNumber(e.target.value)}
              />
              <input
                className={styles.input}
                placeholder="Ordinance Title"
                value={editOrdinanceTitle}
                onChange={(e) => setEditOrdinanceTitle(e.target.value)}
              />
              <label className={styles.fieldLabel}>Date</label>
              <input
                className={styles.input}
                type="date"
                value={editOrdinanceDate}
                onChange={(e) => setEditOrdinanceDate(e.target.value)}
              />
              <p className={styles.officialsSelectLabel}>
                Replace file (optional):
              </p>
              <div className={styles.fileUploadBox}>
                <input
                  type="file"
                  accept={
                    editingOrdinance.filetype === "application/pdf"
                      ? ".pdf"
                      : "image/*"
                  }
                  id="editFileInput"
                  style={{ display: "none" }}
                  onChange={(e) => setEditOrdinanceFile(e.target.files[0])}
                />
                <label htmlFor="editFileInput" className={styles.fileLabel}>
                  {editOrdinanceFile ? (
                    <>
                      <CheckSquare size={14} strokeWidth={1.5} />{" "}
                      {editOrdinanceFile.name}
                    </>
                  ) : (
                    <>
                      <Upload size={14} strokeWidth={1.5} />{" "}
                      {editingOrdinance.filetype === "application/pdf"
                        ? "Click to replace PDF"
                        : "Click to replace Image"}
                    </>
                  )}
                </label>
                <p className={styles.fileHint}>
                  Current file: {editingOrdinance.filename}
                </p>
              </div>
              <div className={styles.officialsSelectSection}>
                <p className={styles.officialsSelectLabel}>
                  Tag Council Members who passed this ordinance:
                </p>
                <OfficialsCheckList
                  officials={officials}
                  selected={editSelectedOfficials}
                  onToggle={toggleEditOfficial}
                  styles={styles}
                />
              </div>
              <MAlert />
            </div>

            {/* ── Sticky footer ── */}
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowEditOrdinanceModal(false);
                  setEditingOrdinance(null);
                  setModalMessage("");
                }}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleUpdateOrdinance}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Resolution */}
      {showResolutionModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowResolutionModal(false);
            setResolutionFile(null);
            setResolutionNumber("");
            setResolutionTitle("");
            setResolutionDate("");
            setSelectedResolutionOfficials([]);
            setModalMessage("");
            lastResolutionSuggestion.current = "";
          }}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
              overflow: "hidden",
            }}
          >
            {/* ── Sticky header ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <h2
                className={styles.modalTitle}
                style={{ margin: 0, fontSize: 18 }}
              >
                <Gavel size={18} strokeWidth={1.5} /> Upload Resolution
              </h2>
              <button
                onClick={() => {
                  setShowResolutionModal(false);
                  setResolutionFile(null);
                  setResolutionNumber("");
                  setResolutionTitle("");
                  setResolutionDate("");
                  setSelectedResolutionOfficials([]);
                  setModalMessage("");
                  lastResolutionSuggestion.current = "";
                }}
                aria-label="Close modal"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                overscrollBehavior: "contain",
              }}
            >
              <input
                className={styles.input}
                placeholder="Resolution Number (e.g. Resolution No. 2024-001)"
                value={resolutionNumber}
                onChange={(e) => setResolutionNumber(e.target.value)}
              />
              <p
                className={styles.fileHint}
                style={{ marginTop: -6, marginBottom: 10 }}
              >
                Suggested automatically based on the year and existing
                resolutions — feel free to edit it.
              </p>
              <input
                className={styles.input}
                placeholder="Resolution Title"
                value={resolutionTitle}
                onChange={(e) => setResolutionTitle(e.target.value)}
              />
              <label className={styles.fieldLabel}>Date</label>
              <input
                className={styles.input}
                type="date"
                value={resolutionDate}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setResolutionDate(newDate);
                  if (resolutionNumber === lastResolutionSuggestion.current) {
                    const newYear = newDate ? newDate.split("-")[0] : "";
                    const suggested = suggestResolutionNumber(
                      resolutions,
                      newYear
                    );
                    lastResolutionSuggestion.current = suggested;
                    setResolutionNumber(suggested);
                  }
                }}
              />
              <div className={styles.fileUploadBox}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,image/*"
                  id="resFileInput"
                  style={{ display: "none" }}
                  onChange={(e) => setResolutionFile(e.target.files[0])}
                />
                <label htmlFor="resFileInput" className={styles.fileLabel}>
                  {resolutionFile ? (
                    <>
                      <CheckSquare size={14} strokeWidth={1.5} />{" "}
                      {resolutionFile.name}
                    </>
                  ) : (
                    <>
                      <Upload size={14} strokeWidth={1.5} /> Click to choose
                      file
                    </>
                  )}
                </label>
                <p className={styles.fileHint}>
                  Accepted: PDF, Word (.doc/.docx), or Image (JPG, PNG)
                </p>
              </div>

              <div className={styles.officialsSelectSection}>
                <p className={styles.officialsSelectLabel}>
                  Tag Council Members who passed this resolution:
                </p>
                <OfficialsCheckList
                  officials={officials}
                  selected={selectedResolutionOfficials}
                  onToggle={toggleResolutionOfficial}
                  styles={styles}
                />
              </div>
              <MAlert />
            </div>

            {/* ── Sticky footer ── */}
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowResolutionModal(false);
                  setResolutionFile(null);
                  setResolutionNumber("");
                  setResolutionTitle("");
                  setResolutionDate("");
                  setSelectedResolutionOfficials([]);
                  setModalMessage("");
                  lastResolutionSuggestion.current = "";
                }}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleUploadResolution}
                disabled={submitting}
              >
                {submitting ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Resolution */}
      {showEditResolutionModal && editingResolution && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowEditResolutionModal(false);
            setEditingResolution(null);
            setModalMessage("");
          }}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
              overflow: "hidden",
            }}
          >
            {/* ── Sticky header ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <h2
                className={styles.modalTitle}
                style={{ margin: 0, fontSize: 18 }}
              >
                <Pencil size={16} strokeWidth={1.5} /> Edit Resolution
              </h2>
              <button
                onClick={() => {
                  setShowEditResolutionModal(false);
                  setEditingResolution(null);
                  setModalMessage("");
                }}
                aria-label="Close modal"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                overscrollBehavior: "contain",
              }}
            >
              <input
                className={styles.input}
                placeholder="Resolution Number"
                value={editResolutionNumber}
                onChange={(e) => setEditResolutionNumber(e.target.value)}
              />
              <input
                className={styles.input}
                placeholder="Resolution Title"
                value={editResolutionTitle}
                onChange={(e) => setEditResolutionTitle(e.target.value)}
              />
              <label className={styles.fieldLabel}>Date</label>
              <input
                className={styles.input}
                type="date"
                value={editResolutionDate}
                onChange={(e) => setEditResolutionDate(e.target.value)}
              />
              <p className={styles.officialsSelectLabel}>
                Replace file (optional):
              </p>
              <div className={styles.fileUploadBox}>
                <input
                  type="file"
                  accept={
                    editingResolution.filetype === "application/pdf"
                      ? ".pdf"
                      : "image/*"
                  }
                  id="editResFileInput"
                  style={{ display: "none" }}
                  onChange={(e) => setEditResolutionFile(e.target.files[0])}
                />
                <label htmlFor="editResFileInput" className={styles.fileLabel}>
                  {editResolutionFile ? (
                    <>
                      <CheckSquare size={14} strokeWidth={1.5} />{" "}
                      {editResolutionFile.name}
                    </>
                  ) : (
                    <>
                      <Upload size={14} strokeWidth={1.5} />{" "}
                      {editingResolution.filetype === "application/pdf"
                        ? "Click to replace PDF"
                        : "Click to replace Image"}
                    </>
                  )}
                </label>
                <p className={styles.fileHint}>
                  Current file: {editingResolution.filename}
                </p>
              </div>
              <div className={styles.officialsSelectSection}>
                <p className={styles.officialsSelectLabel}>
                  Tag Council Members who passed this resolution:
                </p>
                <OfficialsCheckList
                  officials={officials}
                  selected={editResolutionSelectedOfficials}
                  onToggle={toggleEditResolutionOfficial}
                  styles={styles}
                />
              </div>
              <MAlert />
            </div>

            {/* ── Sticky footer ── */}
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowEditResolutionModal(false);
                  setEditingResolution(null);
                  setModalMessage("");
                }}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleUpdateResolution}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extracted Text */}
      {showTextModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowTextModal(false)}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <h2
                className={styles.modalTitle}
                style={{ margin: 0, fontSize: 18 }}
              >
                Extracted Text (OCR)
              </h2>
              <button
                onClick={() => setShowTextModal(false)}
                aria-label="Close modal"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                overscrollBehavior: "contain",
              }}
            >
              <textarea
                className={styles.textArea}
                value={extractedText}
                readOnly
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  navigator.clipboard.writeText(extractedText);
                  showMsg("Copied to clipboard!");
                }}
              >
                <Copy size={13} /> Copy Text
              </button>
              <button
                className={styles.confirmBtn}
                onClick={() => setShowTextModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Session */}
      {showSessionModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowSessionModal(false);
            resetSessionForm();
            setModalMessage("");
          }}
        >
          <div
            className={`${styles.modal} ${styles.sessionModal}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
              overflow: "hidden",
            }}
          >
            {/* ── Sticky header ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <h2
                className={styles.modalTitle}
                style={{ margin: 0, fontSize: 18 }}
              >
                <BookOpen size={18} strokeWidth={1.5} /> Add Session Minutes
                &amp; Agenda
              </h2>
              <button
                onClick={() => {
                  setShowSessionModal(false);
                  resetSessionForm();
                  setModalMessage("");
                }}
                aria-label="Close modal"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                overscrollBehavior: "contain",
              }}
            >
              <div className={styles.uploadTypeRow}>
                <button
                  className={`${styles.uploadTypeBtn} ${
                    sessionInputMode === "text"
                      ? styles.uploadTypeBtnActive
                      : ""
                  }`}
                  onClick={() => setSessionInputMode("text")}
                >
                  <FileEdit size={16} strokeWidth={1.5} /> Direct Input
                  <span className={styles.uploadTypeDesc}>
                    Type or paste session minutes directly
                  </span>
                </button>
                <button
                  className={`${styles.uploadTypeBtn} ${
                    sessionInputMode === "file"
                      ? styles.uploadTypeBtnActive
                      : ""
                  }`}
                  onClick={() => setSessionInputMode("file")}
                >
                  <Upload size={16} strokeWidth={1.5} /> Upload File
                  <span className={styles.uploadTypeDesc}>
                    PDF, Word, or Image — system auto-detects
                  </span>
                </button>
              </div>
              <div className={styles.sessionFormGrid}>
                <div className={styles.sessionFormCol}>
                  <label className={styles.fieldLabel}>Session Number</label>
                  <input
                    className={styles.input}
                    placeholder="e.g. 12th Regular Session"
                    value={sessionForm.session_number}
                    onChange={(e) =>
                      setSessionForm({
                        ...sessionForm,
                        session_number: e.target.value,
                      })
                    }
                  />
                  <p className={styles.fieldHint}>
                    Suggested automatically — feel free to edit it.
                  </p>
                </div>
                <div className={styles.sessionFormCol}>
                  <label className={styles.fieldLabel}>
                    Session Date <span style={{ color: "#e53e3e" }}>*</span>
                  </label>
                  <input
                    className={styles.input}
                    type="date"
                    value={sessionForm.session_date}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setSessionForm((prev) => {
                        const year = newDate
                          ? new Date(newDate).getFullYear()
                          : getCurrentYear();
                        const shouldUpdate =
                          prev.session_number === lastSessionSuggestion.current;
                        if (!shouldUpdate)
                          return { ...prev, session_date: newDate };
                        const suggested = suggestSessionNumber(
                          sessionMinutes,
                          year,
                          prev.session_type
                        );
                        lastSessionSuggestion.current = suggested;
                        return {
                          ...prev,
                          session_date: newDate,
                          session_number: suggested,
                        };
                      });
                    }}
                  />
                </div>
                <div className={styles.sessionFormCol}>
                  <label className={styles.fieldLabel}>Session Type</label>
                  <select
                    className={styles.input}
                    value={sessionForm.session_type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setSessionForm((prev) => {
                        const year = prev.session_date
                          ? new Date(prev.session_date).getFullYear()
                          : getCurrentYear();
                        const shouldUpdate =
                          prev.session_number === lastSessionSuggestion.current;
                        if (!shouldUpdate)
                          return { ...prev, session_type: newType };
                        const suggested = suggestSessionNumber(
                          sessionMinutes,
                          year,
                          newType
                        );
                        lastSessionSuggestion.current = suggested;
                        return {
                          ...prev,
                          session_type: newType,
                          session_number: suggested,
                        };
                      });
                    }}
                  >
                    <option value="regular">Regular Session</option>
                    <option value="special">Special Session</option>
                  </select>
                </div>
                <div className={styles.sessionFormCol}>
                  <label className={styles.fieldLabel}>Venue</label>
                  <input
                    className={styles.input}
                    placeholder="e.g. Session Hall"
                    value={sessionForm.venue}
                    onChange={(e) =>
                      setSessionForm({ ...sessionForm, venue: e.target.value })
                    }
                  />
                </div>
              </div>
              {sessionInputMode === "text" ? (
                <>
                  <label className={styles.fieldLabel}>
                    Agenda Items{" "}
                    <span className={styles.fieldHint}>
                      (one item per line)
                    </span>
                  </label>
                  <textarea
                    className={styles.textArea}
                    placeholder={
                      "1. Call to order\n2. Roll call\n3. Reading of minutes\n..."
                    }
                    value={sessionForm.agenda}
                    onChange={(e) =>
                      setSessionForm({ ...sessionForm, agenda: e.target.value })
                    }
                    rows={5}
                  />
                  <label
                    className={styles.fieldLabel}
                    style={{ marginTop: "10px" }}
                  >
                    Minutes of the Session
                  </label>
                  <textarea
                    className={styles.textArea}
                    placeholder="Type the full session minutes here..."
                    value={sessionForm.minutes_text}
                    onChange={(e) =>
                      setSessionForm({
                        ...sessionForm,
                        minutes_text: e.target.value,
                      })
                    }
                    rows={8}
                  />
                </>
              ) : (
                <>
                  <div className={styles.fileUploadBox}>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,image/*"
                      id="sessionFileInput"
                      style={{ display: "none" }}
                      onChange={(e) => setSessionFile(e.target.files[0])}
                    />
                    <label
                      htmlFor="sessionFileInput"
                      className={styles.fileLabel}
                    >
                      {sessionFile ? (
                        <>
                          <CheckSquare size={14} strokeWidth={1.5} />{" "}
                          {sessionFile.name}
                        </>
                      ) : (
                        <>
                          <Upload size={14} strokeWidth={1.5} /> Click to choose
                          file
                        </>
                      )}
                    </label>
                    <p className={styles.fileHint}>
                      Accepted: PDF, Word (.doc/.docx), or Image (JPG, PNG)
                    </p>
                  </div>
                </>
              )}
              <MAlert />
            </div>

            {/* ── Sticky footer ── */}
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowSessionModal(false);
                  resetSessionForm();
                  setModalMessage("");
                }}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleAddSession}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Session"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Session */}
      {showEditSessionModal && editingSession && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowEditSessionModal(false);
            setEditingSession(null);
            setModalMessage("");
          }}
        >
          <div
            className={`${styles.modal} ${styles.sessionModal}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
              overflow: "hidden",
            }}
          >
            {/* ── Sticky header ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <h2
                className={styles.modalTitle}
                style={{ margin: 0, fontSize: 18 }}
              >
                <Pencil size={16} strokeWidth={1.5} /> Edit Session Minutes
              </h2>
              <button
                onClick={() => {
                  setShowEditSessionModal(false);
                  setEditingSession(null);
                  setModalMessage("");
                }}
                aria-label="Close modal"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                overscrollBehavior: "contain",
              }}
            >
              <div className={styles.sessionFormGrid}>
                <div className={styles.sessionFormCol}>
                  <label className={styles.fieldLabel}>Session Number</label>
                  <input
                    className={styles.input}
                    placeholder="e.g. 12th Regular Session"
                    value={editSessionForm.session_number}
                    onChange={(e) =>
                      setEditSessionForm({
                        ...editSessionForm,
                        session_number: e.target.value,
                      })
                    }
                  />
                </div>
                <div className={styles.sessionFormCol}>
                  <label className={styles.fieldLabel}>
                    Session Date <span style={{ color: "#e53e3e" }}>*</span>
                  </label>
                  <input
                    className={styles.input}
                    type="date"
                    value={editSessionForm.session_date}
                    onChange={(e) =>
                      setEditSessionForm({
                        ...editSessionForm,
                        session_date: e.target.value,
                      })
                    }
                  />
                </div>
                <div className={styles.sessionFormCol}>
                  <label className={styles.fieldLabel}>Session Type</label>
                  <select
                    className={styles.input}
                    value={editSessionForm.session_type}
                    onChange={(e) =>
                      setEditSessionForm({
                        ...editSessionForm,
                        session_type: e.target.value,
                      })
                    }
                  >
                    <option value="regular">Regular Session</option>
                    <option value="special">Special Session</option>
                  </select>
                </div>
                <div className={styles.sessionFormCol}>
                  <label className={styles.fieldLabel}>Venue</label>
                  <input
                    className={styles.input}
                    placeholder="Venue"
                    value={editSessionForm.venue}
                    onChange={(e) =>
                      setEditSessionForm({
                        ...editSessionForm,
                        venue: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <label className={styles.fieldLabel}>
                Agenda Items{" "}
                <span className={styles.fieldHint}>(one item per line)</span>
              </label>
              <textarea
                className={styles.textArea}
                value={editSessionForm.agenda}
                onChange={(e) =>
                  setEditSessionForm({
                    ...editSessionForm,
                    agenda: e.target.value,
                  })
                }
                rows={5}
              />
              <label
                className={styles.fieldLabel}
                style={{ marginTop: "10px" }}
              >
                Minutes of the Session
              </label>
              <textarea
                className={styles.textArea}
                value={editSessionForm.minutes_text}
                onChange={(e) =>
                  setEditSessionForm({
                    ...editSessionForm,
                    minutes_text: e.target.value,
                  })
                }
                rows={8}
              />
              <MAlert />
            </div>

            {/* ── Sticky footer ── */}
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowEditSessionModal(false);
                  setEditingSession(null);
                  setModalMessage("");
                }}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleUpdateSession}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Announcement */}
      {showAnnouncementModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowAnnouncementModal(false);
            resetAnnouncementForm();
            setModalMessage("");
          }}
        >
          <div
            className={`${styles.modal} ${styles.sessionModal}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <h2
                className={styles.modalTitle}
                style={{ margin: 0, fontSize: 18 }}
              >
                <Megaphone size={18} strokeWidth={1.5} /> New Announcement
              </h2>
              <button
                onClick={() => {
                  setShowAnnouncementModal(false);
                  resetAnnouncementForm();
                  setModalMessage("");
                }}
                aria-label="Close modal"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                overscrollBehavior: "contain",
              }}
            >
              <label className={styles.fieldLabel}>
                Title <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <input
                className={styles.input}
                placeholder="Announcement title..."
                value={announcementForm.title}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    title: e.target.value,
                  })
                }
              />
              <label className={styles.fieldLabel}>Priority Level</label>
              <div className={styles.priorityRow}>
                {["urgent", "high", "normal", "low"].map((p) => {
                  const cfg = priorityConfig[p];
                  return (
                    <button
                      key={p}
                      className={`${styles.priorityBtn} ${
                        announcementForm.priority === p
                          ? styles.priorityBtnActive
                          : ""
                      }`}
                      style={
                        announcementForm.priority === p
                          ? {
                              background: cfg.bg,
                              borderColor: cfg.border,
                              color: cfg.color,
                            }
                          : {}
                      }
                      onClick={() =>
                        setAnnouncementForm({
                          ...announcementForm,
                          priority: p,
                        })
                      }
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
              <label className={styles.fieldLabel}>
                Announcement Body <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <textarea
                className={styles.textArea}
                placeholder="Write your announcement here..."
                value={announcementForm.body}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    body: e.target.value,
                  })
                }
                rows={7}
                style={{ height: "auto" }}
              />
              <label className={styles.fieldLabel}>
                Expiry Date{" "}
                <span className={styles.fieldHint}>
                  (optional — leave blank for no expiry)
                </span>
              </label>
              <input
                className={styles.input}
                type="date"
                value={announcementForm.expires_at}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    expires_at: e.target.value,
                  })
                }
              />
              <MAlert />
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowAnnouncementModal(false);
                  resetAnnouncementForm();
                  setModalMessage("");
                }}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleAddAnnouncement}
                disabled={submitting}
              >
                {submitting ? "Posting..." : "Post Announcement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Announcement */}
      {showEditAnnouncementModal && editingAnnouncement && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowEditAnnouncementModal(false);
            setEditingAnnouncement(null);
            setModalMessage("");
          }}
        >
          <div
            className={`${styles.modal} ${styles.sessionModal}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <h2
                className={styles.modalTitle}
                style={{ margin: 0, fontSize: 18 }}
              >
                <Pencil size={16} strokeWidth={1.5} /> Edit Announcement
              </h2>
              <button
                onClick={() => {
                  setShowEditAnnouncementModal(false);
                  setEditingAnnouncement(null);
                  setModalMessage("");
                }}
                aria-label="Close modal"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                overscrollBehavior: "contain",
              }}
            >
              <label className={styles.fieldLabel}>
                Title <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <input
                className={styles.input}
                placeholder="Announcement title..."
                value={editAnnouncementForm.title}
                onChange={(e) =>
                  setEditAnnouncementForm({
                    ...editAnnouncementForm,
                    title: e.target.value,
                  })
                }
              />
              <label className={styles.fieldLabel}>Priority Level</label>
              <div className={styles.priorityRow}>
                {["urgent", "high", "normal", "low"].map((p) => {
                  const cfg = priorityConfig[p];
                  return (
                    <button
                      key={p}
                      className={`${styles.priorityBtn} ${
                        editAnnouncementForm.priority === p
                          ? styles.priorityBtnActive
                          : ""
                      }`}
                      style={
                        editAnnouncementForm.priority === p
                          ? {
                              background: cfg.bg,
                              borderColor: cfg.border,
                              color: cfg.color,
                            }
                          : {}
                      }
                      onClick={() =>
                        setEditAnnouncementForm({
                          ...editAnnouncementForm,
                          priority: p,
                        })
                      }
                    >
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
              <label className={styles.fieldLabel}>
                Announcement Body <span style={{ color: "#e53e3e" }}>*</span>
              </label>
              <textarea
                className={styles.textArea}
                value={editAnnouncementForm.body}
                onChange={(e) =>
                  setEditAnnouncementForm({
                    ...editAnnouncementForm,
                    body: e.target.value,
                  })
                }
                rows={7}
                style={{ height: "auto" }}
              />
              <label className={styles.fieldLabel}>
                Expiry Date <span className={styles.fieldHint}>(optional)</span>
              </label>
              <input
                className={styles.input}
                type="date"
                value={editAnnouncementForm.expires_at}
                onChange={(e) =>
                  setEditAnnouncementForm({
                    ...editAnnouncementForm,
                    expires_at: e.target.value,
                  })
                }
              />
              <MAlert />
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowEditAnnouncementModal(false);
                  setEditingAnnouncement(null);
                  setModalMessage("");
                }}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleUpdateAnnouncement}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Local Event */}
      {showLocalEventModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowLocalEventModal(false);
            setModalMessage("");
          }}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <h2
                className={styles.modalTitle}
                style={{ margin: 0, fontSize: 18 }}
              >
                <PlusCircle size={16} /> Add Event
              </h2>
              <button
                onClick={() => {
                  setShowLocalEventModal(false);
                  setModalMessage("");
                }}
                aria-label="Close modal"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                overscrollBehavior: "contain",
              }}
            >
              <EventFormFields
                form={localEventForm}
                setForm={setLocalEventForm}
                styles={styles}
              />
              <MAlert />
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowLocalEventModal(false);
                  setModalMessage("");
                }}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleSaveLocalEvent}
                disabled={savingLocalEvent}
              >
                {savingLocalEvent ? "Saving..." : "Save Event"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Local Event */}
      {showEditEventModal && editingEvent && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowEditEventModal(false);
            setEditingEvent(null);
            setModalMessage("");
          }}
        >
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "flex",
              flexDirection: "column",
              maxHeight: "90vh",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <h2
                className={styles.modalTitle}
                style={{ margin: 0, fontSize: 18 }}
              >
                <Pencil size={16} /> Edit Event
              </h2>
              <button
                onClick={() => {
                  setShowEditEventModal(false);
                  setEditingEvent(null);
                  setModalMessage("");
                }}
                aria-label="Close modal"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px 24px",
                overscrollBehavior: "contain",
              }}
            >
              <EventFormFields
                form={editEventForm}
                setForm={setEditEventForm}
                styles={styles}
              />
              <MAlert />
            </div>
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
              }}
            >
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowEditEventModal(false);
                  setEditingEvent(null);
                  setModalMessage("");
                }}
              >
                Cancel
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleUpdateEvent}
                disabled={savingLocalEvent}
              >
                {savingLocalEvent ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <ConfirmModal
          type={
            ARCHIVABLE_TYPES.includes(deleteTarget.type) ? "warning" : "delete"
          }
          title={
            ARCHIVABLE_TYPES.includes(deleteTarget.type)
              ? `Archive this ${deleteTarget.type}?`
              : `Delete this ${deleteTarget.type}?`
          }
          message={
            ARCHIVABLE_TYPES.includes(deleteTarget.type)
              ? `"${deleteTarget.name}" will be moved to Archives. You can restore it later.`
              : `"${deleteTarget.name}" will be permanently removed. This cannot be undone.`
          }
          confirmLabel={
            ARCHIVABLE_TYPES.includes(deleteTarget.type) ? "Archive" : "Delete"
          }
          onConfirm={() => {
            if (deleteTarget.type === "user") handleDeleteUser(deleteTarget.id);
            else if (deleteTarget.type === "ordinance")
              handleDeleteOrdinance(deleteTarget.id);
            else if (deleteTarget.type === "resolution")
              handleDeleteResolution(deleteTarget.id);
            else if (deleteTarget.type === "official")
              handleDeleteOfficial(deleteTarget.id);
            else if (deleteTarget.type === "session")
              handleDeleteSession(deleteTarget.id);
            else if (deleteTarget.type === "announcement")
              handleDeleteAnnouncement(deleteTarget.id);
            else if (deleteTarget.type === "term")
              handleDeleteTerm(deleteTarget.memberId, deleteTarget.id);
            setDeleteTarget(null);
          }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
