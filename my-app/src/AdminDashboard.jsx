import { useEffect, useState } from "react";
import styles from "./AdminDashboard.module.css";
import logo from "./assets/image/balilihan-logo-Large-1.png";
import {
  Users, ShieldCheck, ScrollText, Landmark,
  Search, X, Filter, Eye, Pencil, Trash2,
  FileText, Image, CalendarDays, LogOut,
  ClipboardList, Copy, Upload, CheckSquare, AlertCircle,
  BookOpen, Plus, Printer, FileEdit, Camera, Gavel,
  Megaphone, ChevronDown, ChevronRight
} from "lucide-react";
import ConfirmModal from "./ConfirmModal";

// ---- Auth helper ----
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
};

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", username: "", email: "", password: "" });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [fetchingOrdinances, setFetchingOrdinances] = useState(false);
  const [fetchingOfficials, setFetchingOfficials] = useState(false);
  const [fetchingMinutes, setFetchingMinutes] = useState(false);
  const [fetchingResolutions, setFetchingResolutions] = useState(false);
  
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showOrdinanceModal, setShowOrdinanceModal] = useState(false);
  const [showOfficialModal, setShowOfficialModal] = useState(false);
  const [showOfficialProfile, setShowOfficialProfile] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [selectedOfficialProfile, setSelectedOfficialProfile] = useState(null);

  const [newAdmin, setNewAdmin] = useState({ name: "", username: "", email: "", password: "" });

  // ---- Sidebar section collapse ----
  const [userMgmtOpen, setUserMgmtOpen] = useState(true);

  // ---- Ordinances ----
  const [ordinances, setOrdinances] = useState([]);
  const [ordinanceNumber, setOrdinanceNumber] = useState("");
  const [ordinanceTitle, setOrdinanceTitle] = useState("");
  const [ordinanceYear, setOrdinanceYear] = useState("");
  const [ordinanceFile, setOrdinanceFile] = useState(null);
  const [uploadType, setUploadType] = useState("");
  const [selectedOfficials, setSelectedOfficials] = useState([]);
  const [extractedText, setExtractedText] = useState("");
  const [showEditOrdinanceModal, setShowEditOrdinanceModal] = useState(false);
  const [editingOrdinance, setEditingOrdinance] = useState(null);
  const [editOrdinanceNumber, setEditOrdinanceNumber] = useState("");
  const [editOrdinanceTitle, setEditOrdinanceTitle] = useState("");
  const [editOrdinanceYear, setEditOrdinanceYear] = useState("");
  const [editSelectedOfficials, setEditSelectedOfficials] = useState([]);
  const [editOrdinanceFile, setEditOrdinanceFile] = useState(null);
  const [ordinanceSearch, setOrdinanceSearch] = useState("");
  const [ordinanceTypeFilter, setOrdinanceTypeFilter] = useState("all");

  // ---- Resolutions ----
  const [resolutions, setResolutions] = useState([]);
  const [resolutionNumber, setResolutionNumber] = useState("");
  const [resolutionTitle, setResolutionTitle] = useState("");
  const [resolutionYear, setResolutionYear] = useState("");
  const [resolutionFile, setResolutionFile] = useState(null);
  const [resolutionUploadType, setResolutionUploadType] = useState("");
  const [selectedResolutionOfficials, setSelectedResolutionOfficials] = useState([]);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [showEditResolutionModal, setShowEditResolutionModal] = useState(false);
  const [editingResolution, setEditingResolution] = useState(null);
  const [editResolutionNumber, setEditResolutionNumber] = useState("");
  const [editResolutionTitle, setEditResolutionTitle] = useState("");
  const [editResolutionYear, setEditResolutionYear] = useState("");
  const [editResolutionSelectedOfficials, setEditResolutionSelectedOfficials] = useState([]);
  const [editResolutionFile, setEditResolutionFile] = useState(null);
  const [resolutionSearch, setResolutionSearch] = useState("");
  const [resolutionTypeFilter, setResolutionTypeFilter] = useState("all");

  // ---- Officials ----
  const [officials, setOfficials] = useState([]);
  const [newOfficial, setNewOfficial] = useState({ full_name: "", position: "", term_period: "" });
  const [officialPhoto, setOfficialPhoto] = useState(null);
  const [officialSearch, setOfficialSearch] = useState("");
  const [officialPositionFilter, setOfficialPositionFilter] = useState("all");

  // ---- Session Minutes ----
  const [sessionMinutes, setSessionMinutes] = useState([]);
  const [minutesSearch, setMinutesSearch] = useState("");
  const [minutesTypeFilter, setMinutesTypeFilter] = useState("all");
  const [minutesYearFilter, setMinutesYearFilter] = useState("all");
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionInputMode, setSessionInputMode] = useState("text");
  const [sessionForm, setSessionForm] = useState({
    session_number: "", session_date: "", session_type: "regular",
    venue: "", agenda: "", minutes_text: ""
  });
  const [sessionFile, setSessionFile] = useState(null);
  const [sessionOcrTarget, setSessionOcrTarget] = useState("minutes");
  const [showEditSessionModal, setShowEditSessionModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [editSessionForm, setEditSessionForm] = useState({
    session_number: "", session_date: "", session_type: "regular",
    venue: "", agenda: "", minutes_text: ""
  });

  // ---- Announcements ----
  const [announcements, setAnnouncements] = useState([]);
  const [fetchingAnnouncements, setFetchingAnnouncements] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showEditAnnouncementModal, setShowEditAnnouncementModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "", body: "", priority: "normal", expires_at: ""
  });
  const [editAnnouncementForm, setEditAnnouncementForm] = useState({
    title: "", body: "", priority: "normal", expires_at: ""
  });
  const [announcementSearch, setAnnouncementSearch] = useState("");
  const [announcementPriorityFilter, setAnnouncementPriorityFilter] = useState("all");

  // ---- Sidebar ----
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleTabChange = (key) => { setActiveTab(key); setMobileOpen(false); };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (!storedUser || !token) { window.location.replace("/"); return; }
    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== "admin") { window.location.replace("/"); return; }
      setAdmin(parsedUser);
    } catch { window.location.replace("/"); return; }
    fetchUsers();
    fetchOrdinances();
    fetchOfficials();
    fetchSessionMinutes();
    fetchResolutions();
    fetchAnnouncements();
  }, []);

  const showMsg = (msg, type = "success") => {
    setMessage(msg); setMessageType(type);
    setTimeout(() => setMessage(""), 3500);
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); localStorage.removeItem("user");
    window.location.replace("/");
  };

  // ---- Fetch functions ----
  const fetchUsers = async () => {
    setFetchingUsers(true);
    try {
      const res = await authFetch("http://localhost:5000/api/users");
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem("token"); localStorage.removeItem("user");
        window.location.replace("/"); return;
      }
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); setUsers([]); }
    finally { setFetchingUsers(false); }
  };

  const fetchOrdinances = async () => {
    setFetchingOrdinances(true);
    try {
      const res = await fetch("http://localhost:5000/api/ordinances");
      const data = await res.json();
      setOrdinances(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); setOrdinances([]); }
    finally { setFetchingOrdinances(false); }
  };

  const fetchResolutions = async () => {
    setFetchingResolutions(true);
    try {
      const res = await fetch("http://localhost:5000/api/resolutions");
      const data = await res.json();
      setResolutions(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); setResolutions([]); }
    finally { setFetchingResolutions(false); }
  };

  const fetchOfficials = async () => {
    setFetchingOfficials(true);
    try {
      const res = await fetch("http://localhost:5000/api/sb-officials");
      const data = await res.json();
      setOfficials(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); setOfficials([]); }
    finally { setFetchingOfficials(false); }
  };

  const fetchSessionMinutes = async () => {
    setFetchingMinutes(true);
    try {
      const res = await fetch("http://localhost:5000/api/session-minutes");
      const data = await res.json();
      setSessionMinutes(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); setSessionMinutes([]); }
    finally { setFetchingMinutes(false); }
  };

  const fetchAnnouncements = async () => {
    setFetchingAnnouncements(true);
    try {
      const res = await fetch("http://localhost:5000/api/announcements");
      const data = await res.json();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); setAnnouncements([]); }
    finally { setFetchingAnnouncements(false); }
  };

  // ---- Admin handlers ----
  const handleAddAdmin = async () => {
    if (!newAdmin.name || !newAdmin.username || !newAdmin.email || !newAdmin.password) {
      showMsg("All fields required!", "error"); return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch("http://localhost:5000/api/admin/add", { method: "POST", body: JSON.stringify(newAdmin) });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Admin added!"); setNewAdmin({ name: "", username: "", email: "", password: "" });
        setShowAddAdminModal(false); fetchUsers();
      } else showMsg(data.error || "Failed!", "error");
    } catch { showMsg("Server error!", "error"); }
    finally { setSubmitting(false); }
  };

  const handleDeleteUser = async (id) => {
    try {
      const res = await authFetch(`http://localhost:5000/api/users/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { showMsg("User deleted!"); fetchUsers(); }
      else showMsg(data.error || "Error!", "error");
    } catch { showMsg("Error!", "error"); }
  };

  // ---- Ordinance handlers ----
  const handleUploadOrdinance = async () => {
    if (!ordinanceNumber || !ordinanceTitle || !ordinanceYear || !ordinanceFile || !uploadType) {
      showMsg("Please fill all fields and choose upload type!", "error"); return;
    }
    setSubmitting(true);
    const formData = new FormData();
    formData.append("ordinance_number", ordinanceNumber);
    formData.append("title", ordinanceTitle);
    formData.append("year", ordinanceYear);
    formData.append("file", ordinanceFile);
    formData.append("officials", JSON.stringify(selectedOfficials));
    formData.append("uploadType", uploadType);
    try {
      const endpoint = uploadType === "image-to-text"
        ? "http://localhost:5000/api/ordinances/upload-image-text"
        : "http://localhost:5000/api/ordinances/upload";
      const res = await authFetch(endpoint, { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Ordinance uploaded!");
        if (uploadType === "image-to-text" && data.text) { setExtractedText(data.text); setShowTextModal(true); }
        setOrdinanceNumber(""); setOrdinanceTitle(""); setOrdinanceYear("");
        setOrdinanceFile(null); setSelectedOfficials([]); setUploadType("");
        setShowOrdinanceModal(false); fetchOrdinances();
      } else showMsg(data.error || "Upload failed!", "error");
    } catch { showMsg("Server error!", "error"); }
    finally { setSubmitting(false); }
  };
  // ---- Add User handler ----
  const handleAddUser = async () => {
  if (!newUser.name || !newUser.username || !newUser.email || !newUser.password) {
    showMsg("All fields required!", "error"); return;
  }
  setSubmitting(true);
  try {
    const res = await fetch("http://localhost:5000/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUser)
    });
    const data = await res.json();
    if (res.ok && data.success) {
      showMsg("User added!"); setNewUser({ name: "", username: "", email: "", password: "" });
      setShowAddUserModal(false); fetchUsers();
    } else showMsg(data.error || "Failed!", "error");
  } catch { showMsg("Server error!", "error"); }
  finally { setSubmitting(false); }
};

  const handleOpenEditOrdinance = (o) => {
    setEditingOrdinance(o);
    setEditOrdinanceNumber(o.ordinance_number || "");
    setEditOrdinanceTitle(o.title);
    setEditOrdinanceYear(o.year || "");
    setEditSelectedOfficials(o.officials ? o.officials.map((off) => off.id) : []);
    setEditOrdinanceFile(null);
    setShowEditOrdinanceModal(true);
  };

  const toggleEditOfficial = (id) =>
    setEditSelectedOfficials((prev) => prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]);

  const handleUpdateOrdinance = async () => {
    if (!editOrdinanceNumber || !editOrdinanceTitle || !editOrdinanceYear) {
      showMsg("All fields required!", "error"); return;
    }
    setSubmitting(true);
    const formData = new FormData();
    formData.append("ordinance_number", editOrdinanceNumber);
    formData.append("title", editOrdinanceTitle);
    formData.append("year", editOrdinanceYear);
    formData.append("officials", JSON.stringify(editSelectedOfficials));
    if (editOrdinanceFile) formData.append("file", editOrdinanceFile);
    try {
      const res = await authFetch(`http://localhost:5000/api/ordinances/${editingOrdinance.id}`, { method: "PUT", body: formData });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Ordinance updated!"); setShowEditOrdinanceModal(false);
        setEditingOrdinance(null); fetchOrdinances();
      } else showMsg(data.error || "Update failed!", "error");
    } catch { showMsg("Server error!", "error"); }
    finally { setSubmitting(false); }
  };

  const handleDeleteOrdinance = async (id) => {
    if (!window.confirm("Delete this ordinance?")) return;
    try {
      const res = await authFetch(`http://localhost:5000/api/ordinances/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { showMsg("Deleted!"); fetchOrdinances(); }
      else showMsg(data.error || "Error!", "error");
    } catch { showMsg("Error!", "error"); }
  };

  // ---- Resolution handlers ----
  const handleUploadResolution = async () => {
    if (!resolutionNumber || !resolutionTitle || !resolutionYear || !resolutionFile || !resolutionUploadType) {
      showMsg("Please fill all fields and choose upload type!", "error"); return;
    }
    setSubmitting(true);
    const formData = new FormData();
    formData.append("resolution_number", resolutionNumber);
    formData.append("title", resolutionTitle);
    formData.append("year", resolutionYear);
    formData.append("file", resolutionFile);
    formData.append("officials", JSON.stringify(selectedResolutionOfficials));
    formData.append("uploadType", resolutionUploadType);
    try {
      const endpoint = resolutionUploadType === "image-to-text"
        ? "http://localhost:5000/api/resolutions/upload-image-text"
        : "http://localhost:5000/api/resolutions/upload";
      const res = await authFetch(endpoint, { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Resolution uploaded!");
        if (resolutionUploadType === "image-to-text" && data.text) { setExtractedText(data.text); setShowTextModal(true); }
        setResolutionNumber(""); setResolutionTitle(""); setResolutionYear("");
        setResolutionFile(null); setSelectedResolutionOfficials([]); setResolutionUploadType("");
        setShowResolutionModal(false); fetchResolutions();
      } else showMsg(data.error || "Upload failed!", "error");
    } catch { showMsg("Server error!", "error"); }
    finally { setSubmitting(false); }
  };

  const handleOpenEditResolution = (r) => {
    setEditingResolution(r);
    setEditResolutionNumber(r.resolution_number || "");
    setEditResolutionTitle(r.title);
    setEditResolutionYear(r.year || "");
    setEditResolutionSelectedOfficials(r.officials ? r.officials.map((off) => off.id) : []);
    setEditResolutionFile(null);
    setShowEditResolutionModal(true);
  };

  const toggleEditResolutionOfficial = (id) =>
    setEditResolutionSelectedOfficials((prev) => prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]);

  const handleUpdateResolution = async () => {
    if (!editResolutionNumber || !editResolutionTitle || !editResolutionYear) {
      showMsg("All fields required!", "error"); return;
    }
    setSubmitting(true);
    const formData = new FormData();
    formData.append("resolution_number", editResolutionNumber);
    formData.append("title", editResolutionTitle);
    formData.append("year", editResolutionYear);
    formData.append("officials", JSON.stringify(editResolutionSelectedOfficials));
    if (editResolutionFile) formData.append("file", editResolutionFile);
    try {
      const res = await authFetch(`http://localhost:5000/api/resolutions/${editingResolution.id}`, { method: "PUT", body: formData });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Resolution updated!"); setShowEditResolutionModal(false);
        setEditingResolution(null); fetchResolutions();
      } else showMsg(data.error || "Update failed!", "error");
    } catch { showMsg("Server error!", "error"); }
    finally { setSubmitting(false); }
  };

  const handleDeleteResolution = async (id) => {
    if (!window.confirm("Delete this resolution?")) return;
    try {
      const res = await authFetch(`http://localhost:5000/api/resolutions/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { showMsg("Resolution deleted!"); fetchResolutions(); }
      else showMsg(data.error || "Error!", "error");
    } catch { showMsg("Error!", "error"); }
  };

  const toggleResolutionOfficial = (id) =>
    setSelectedResolutionOfficials((prev) => prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]);

  // ---- Officials handlers ----
  const handleAddOfficial = async () => {
    if (!newOfficial.full_name || !newOfficial.position || !newOfficial.term_period) {
      showMsg("All fields required!", "error"); return;
    }
    setSubmitting(true);
    const formData = new FormData();
    formData.append("full_name", newOfficial.full_name);
    formData.append("position", newOfficial.position);
    formData.append("term_period", newOfficial.term_period);
    if (officialPhoto) formData.append("photo", officialPhoto);
    try {
      const res = await authFetch("http://localhost:5000/api/sb-officials/add", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Official added!"); setNewOfficial({ full_name: "", position: "", term_period: "" });
        setOfficialPhoto(null); setShowOfficialModal(false); fetchOfficials();
      } else showMsg(data.error || "Failed!", "error");
    } catch { showMsg("Server error!", "error"); }
    finally { setSubmitting(false); }
  };

  const handleDeleteOfficial = async (id) => {
    if (!window.confirm("Delete this official?")) return;
    try {
      const res = await authFetch(`http://localhost:5000/api/sb-officials/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { showMsg("Official deleted!"); fetchOfficials(); }
      else showMsg(data.error || "Error!", "error");
    } catch { showMsg("Error!", "error"); }
  };

  const toggleOfficial = (id) =>
    setSelectedOfficials((prev) => prev.includes(id) ? prev.filter((o) => o !== id) : [...prev, id]);

  const getOfficialOrdinances = (officialId) =>
    ordinances.filter((o) => o.officials && o.officials.some((off) => off.id === officialId));

  // ---- Session Minutes handlers ----
  const resetSessionForm = () => {
    setSessionForm({ session_number: "", session_date: "", session_type: "regular", venue: "", agenda: "", minutes_text: "" });
    setSessionFile(null);
    setSessionInputMode("text");
    setSessionOcrTarget("minutes");
  };

  const handleAddSession = async () => {
    if (!sessionForm.session_date) { showMsg("Session date is required!", "error"); return; }
    setSubmitting(true);
    try {
      if (sessionInputMode === "ocr") {
        if (!sessionFile) { showMsg("Please upload an image file!", "error"); setSubmitting(false); return; }
        const formData = new FormData();
        Object.entries(sessionForm).forEach(([k, v]) => formData.append(k, v));
        formData.append("file", sessionFile);
        formData.append("ocr_target", sessionOcrTarget);
        const res = await authFetch("http://localhost:5000/api/session-minutes/upload-image", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok && data.success) {
          showMsg(`Session added! OCR extracted text from ${data.ocr_target}.`);
          resetSessionForm(); setShowSessionModal(false); fetchSessionMinutes();
        } else showMsg(data.error || "Upload failed!", "error");
      } else {
        const res = await authFetch("http://localhost:5000/api/session-minutes", { method: "POST", body: JSON.stringify(sessionForm) });
        const data = await res.json();
        if (res.ok && data.success) {
          showMsg("Session minutes saved!"); resetSessionForm();
          setShowSessionModal(false); fetchSessionMinutes();
        } else showMsg(data.error || "Save failed!", "error");
      }
    } catch { showMsg("Server error!", "error"); }
    finally { setSubmitting(false); }
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
    setShowEditSessionModal(true);
  };

  const handleUpdateSession = async () => {
    if (!editSessionForm.session_date) { showMsg("Session date is required!", "error"); return; }
    setSubmitting(true);
    try {
      const res = await authFetch(`http://localhost:5000/api/session-minutes/${editingSession.id}`, { method: "PUT", body: JSON.stringify(editSessionForm) });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Session minutes updated!"); setShowEditSessionModal(false);
        setEditingSession(null); fetchSessionMinutes();
      } else showMsg(data.error || "Update failed!", "error");
    } catch { showMsg("Server error!", "error"); }
    finally { setSubmitting(false); }
  };

  const handleDeleteSession = async (id) => {
    if (!window.confirm("Delete this session record?")) return;
    try {
      const res = await authFetch(`http://localhost:5000/api/session-minutes/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { showMsg("Session deleted!"); fetchSessionMinutes(); }
      else showMsg(data.error || "Error!", "error");
    } catch { showMsg("Error!", "error"); }
  };

  // ---- Announcement handlers ----
  const resetAnnouncementForm = () => setAnnouncementForm({ title: "", body: "", priority: "normal", expires_at: "" });

  const handleAddAnnouncement = async () => {
    if (!announcementForm.title || !announcementForm.body) {
      showMsg("Title and body are required!", "error"); return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch("http://localhost:5000/api/announcements", {
        method: "POST", body: JSON.stringify(announcementForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Announcement posted!"); resetAnnouncementForm();
        setShowAnnouncementModal(false); fetchAnnouncements();
      } else showMsg(data.error || "Failed!", "error");
    } catch { showMsg("Server error!", "error"); }
    finally { setSubmitting(false); }
  };

  const handleOpenEditAnnouncement = (a) => {
    setEditingAnnouncement(a);
    setEditAnnouncementForm({
      title: a.title || "",
      body: a.body || "",
      priority: a.priority || "normal",
      expires_at: a.expires_at ? a.expires_at.split("T")[0] : ""
    });
    setShowEditAnnouncementModal(true);
  };

  const handleUpdateAnnouncement = async () => {
    if (!editAnnouncementForm.title || !editAnnouncementForm.body) {
      showMsg("Title and body are required!", "error"); return;
    }
    setSubmitting(true);
    try {
      const res = await authFetch(`http://localhost:5000/api/announcements/${editingAnnouncement.id}`, {
        method: "PUT", body: JSON.stringify(editAnnouncementForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Announcement updated!"); setShowEditAnnouncementModal(false);
        setEditingAnnouncement(null); fetchAnnouncements();
      } else showMsg(data.error || "Update failed!", "error");
    } catch { showMsg("Server error!", "error"); }
    finally { setSubmitting(false); }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      const res = await authFetch(`http://localhost:5000/api/announcements/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { showMsg("Announcement deleted!"); fetchAnnouncements(); }
      else showMsg(data.error || "Error!", "error");
    } catch { showMsg("Error!", "error"); }
  };

  // ---- Computed ----
  const totalUsers = users.filter((u) => u.role === "user").length;
  const totalAdmins = users.filter((u) => u.role === "admin").length;

  const filteredOrdinances = ordinances.filter((o) => {
    const matchesSearch =
      (o.title || "").toLowerCase().includes(ordinanceSearch.toLowerCase()) ||
      (o.ordinance_number || "").toLowerCase().includes(ordinanceSearch.toLowerCase());
    const matchesType =
      ordinanceTypeFilter === "all" ? true :
      ordinanceTypeFilter === "pdf" ? o.filetype === "application/pdf" :
      o.filetype?.startsWith("image");
    return matchesSearch && matchesType;
  });

  const filteredResolutions = resolutions.filter((r) => {
    const matchesSearch =
      (r.title || "").toLowerCase().includes(resolutionSearch.toLowerCase()) ||
      (r.resolution_number || "").toLowerCase().includes(resolutionSearch.toLowerCase());
    const matchesType =
      resolutionTypeFilter === "all" ? true :
      resolutionTypeFilter === "pdf" ? r.filetype === "application/pdf" :
      r.filetype?.startsWith("image");
    return matchesSearch && matchesType;
  });

  const uniquePositions = ["all", ...new Set(officials.map((o) => o.position).filter(Boolean))];
  const filteredOfficials = officials.filter((o) => {
    const matchesSearch =
      o.full_name.toLowerCase().includes(officialSearch.toLowerCase()) ||
      o.position.toLowerCase().includes(officialSearch.toLowerCase());
    const matchesPosition = officialPositionFilter === "all" ? true : o.position === officialPositionFilter;
    return matchesSearch && matchesPosition;
  });

  const minutesYears = ["all", ...new Set(sessionMinutes.map(s =>
    s.session_date ? new Date(s.session_date).getFullYear().toString() : null
  ).filter(Boolean)).values()].sort((a, b) => b - a);

  const filteredMinutes = sessionMinutes.filter((s) => {
    const matchesSearch =
      (s.session_number || "").toLowerCase().includes(minutesSearch.toLowerCase()) ||
      (s.venue || "").toLowerCase().includes(minutesSearch.toLowerCase()) ||
      (s.agenda || "").toLowerCase().includes(minutesSearch.toLowerCase());
    const matchesType = minutesTypeFilter === "all" ? true : s.session_type === minutesTypeFilter;
    const matchesYear = minutesYearFilter === "all" ? true :
      (s.session_date && new Date(s.session_date).getFullYear().toString() === minutesYearFilter);
    return matchesSearch && matchesType && matchesYear;
  });

  const filteredAnnouncements = announcements.filter((a) => {
    const matchesSearch =
      (a.title || "").toLowerCase().includes(announcementSearch.toLowerCase()) ||
      (a.body || "").toLowerCase().includes(announcementSearch.toLowerCase());
    const matchesPriority = announcementPriorityFilter === "all" ? true : a.priority === announcementPriorityFilter;
    return matchesSearch && matchesPriority;
  });

  const pageLoading = fetchingUsers || fetchingOrdinances || fetchingOfficials || fetchingMinutes || fetchingResolutions || fetchingAnnouncements;
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const priorityConfig = {
    urgent:  { label: "Urgent",  color: "#c53030", bg: "#fff5f5", border: "#feb2b2" },
    high:    { label: "High",    color: "#975a16", bg: "#fffbeb", border: "#f6e05e" },
    normal:  { label: "Normal",  color: "#276749", bg: "#f0fff4", border: "#9ae6b4" },
    low:     { label: "Low",     color: "#4a5568", bg: "#f7fafc", border: "#cbd5e0" },
  };

  // ---- Reusable officials checklist ----
  const OfficialsCheckList = ({ selected, onToggle }) => (
    <div className={styles.officialsCheckList}>
      {officials.length === 0 && <p className={styles.fileHint}>No officials yet. Add officials first.</p>}
      {officials.map((o) => (
        <label key={o.id} className={`${styles.checkItem} ${selected.includes(o.id) ? styles.checkItemSelected : ""}`}>
          <input type="checkbox" checked={selected.includes(o.id)} onChange={() => onToggle(o.id)} />
          {o.photo
            ? <img src={`http://localhost:5000/uploads/${o.photo}`} alt={o.full_name} className={styles.checkPhoto} />
            : <div className={styles.checkAvatar}>{o.full_name.charAt(0)}</div>}
          <div>
            <div style={{ fontWeight: "600", fontSize: "13px" }}>{o.full_name}</div>
            <div style={{ fontSize: "11px", color: "#718096" }}>{o.position}</div>
          </div>
        </label>
      ))}
    </div>
  );

  const tabTitles = {
    users: "Manage Users", admins: "Manage Admins",
    ordinances: "Ordinances", resolutions: "Resolutions",
    officials: "Sangguniang Bayan Officials",
    sessions: "Session Minutes & Agenda",
    announcements: "Announcements"
  };

  return (
    <div className={styles.container}>

      {/* ── Mobile backdrop ── */}
      <div
        className={`${styles.mobileBackdrop} ${mobileOpen ? styles.visible : ""}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* ── Mobile top-bar ── */}
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
      <div className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ""} ${mobileOpen ? styles.mobileOpen : ""}`}>
        <button
          className={styles.sidebarToggle}
          onClick={() => setSidebarCollapsed((v) => !v)}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={sidebarCollapsed ? "Expand" : "Collapse"}
        >
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            style={{ transform: sidebarCollapsed ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.3s" }}
          >
            <path d="M8 2L4 6L8 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

          {/* ── USER MANAGEMENT SECTION ── */}
          <div className={styles.navSection}>
            <button
              className={styles.navSectionHeader}
              onClick={() => !sidebarCollapsed && setUserMgmtOpen(v => !v)}
              title="User Management"
            >
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
              ].map((tab) => (
                <button
                  key={tab.key}
                  data-label={tab.label}
                  className={`${styles.navBtn} ${styles.navBtnIndented} ${activeTab === tab.key ? styles.navBtnActive : ""}`}
                  onClick={() => handleTabChange(tab.key)}
                >
                  <span className={styles.navIcon}>{tab.icon}</span>
                  <span className={styles.navLabel}>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── DIVIDER ── */}
          <div className={styles.navDivider} />

          {/* ── REMAINING TABS ── */}
          {[
            { key: "ordinances",    icon: <ScrollText size={18} strokeWidth={1.5} />,  label: "Ordinances" },
            { key: "resolutions",   icon: <Gavel size={18} strokeWidth={1.5} />,       label: "Resolutions" },
            { key: "officials",     icon: <Landmark size={18} strokeWidth={1.5} />,    label: "SB Officials" },
            { key: "sessions",      icon: <BookOpen size={18} strokeWidth={1.5} />,    label: "Session Minutes" },
            { key: "announcements", icon: <Megaphone size={18} strokeWidth={1.5} />,   label: "Announcements" },
          ].map((tab) => (
            <button
              key={tab.key}
              data-label={tab.label}
              className={`${styles.navBtn} ${activeTab === tab.key ? styles.navBtnActive : ""}`}
              onClick={() => handleTabChange(tab.key)}
            >
              <span className={styles.navIcon}>{tab.icon}</span>
              <span className={styles.navLabel}>{tab.label}</span>
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

      {/* ---- MAIN ---- */}
      <div className={styles.main}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>{tabTitles[activeTab]}</h1>
            <p className={styles.headerSub}>LGU Administration Dashboard</p>
          </div>
          <div className={styles.headerActions}>
            {activeTab === "users" && <button className={styles.addBtn} onClick={() => setShowAddUserModal(true)}>+ Add User</button>}
            {activeTab === "admins"        && <button className={styles.addBtn} onClick={() => setShowAddAdminModal(true)}>+ Add Admin</button>}
            {activeTab === "ordinances"    && <button className={styles.addBtn} onClick={() => setShowOrdinanceModal(true)}>+ Upload Ordinance</button>}
            {activeTab === "resolutions"   && <button className={styles.addBtn} onClick={() => { setResolutionNumber(""); setResolutionTitle(""); setResolutionYear(""); setResolutionFile(null); setSelectedResolutionOfficials([]); setResolutionUploadType(""); setShowResolutionModal(true); }}>+ Upload Resolution</button>}
            {activeTab === "officials"     && <button className={styles.addBtn} onClick={() => setShowOfficialModal(true)}>+ Add Official</button>}
            {activeTab === "sessions"      && <button className={styles.addBtn} onClick={() => { resetSessionForm(); setShowSessionModal(true); }}>+ Add Session</button>}
            {activeTab === "announcements" && <button className={styles.addBtn} onClick={() => { resetAnnouncementForm(); setShowAnnouncementModal(true); }}>+ New Announcement</button>}
          </div>
        </div>

        {message && (
          <div className={`${styles.message} ${messageType === "error" ? styles.messageError : ""}`}>
            <AlertCircle size={14} /> {message}
            <button className={styles.closeMsg} onClick={() => setMessage("")}><X size={13} /></button>
          </div>
        )}

        {pageLoading && <div className={styles.loadingBar}>Loading data...</div>}

        {/* ---- USERS TAB ---- */}
        {activeTab === "users" && !fetchingUsers && (
          <>
            <div className={styles.statsRow}>
              <div className={styles.statCard}><div className={styles.statNumber}>{users.length}</div><div className={styles.statLabel}>Total Accounts</div></div>
              <div className={`${styles.statCard} ${styles.statCardGreen}`}><div className={styles.statNumber}>{totalUsers}</div><div className={styles.statLabel}>Total Users</div></div>
              <div className={`${styles.statCard} ${styles.statCardOrange}`}><div className={styles.statNumber}>{totalAdmins}</div><div className={styles.statLabel}>Total Admins</div></div>
            </div>
            <div className={styles.tableCard}>
              <table className={styles.table}>
                <thead><tr><th className={styles.th}>ID</th><th className={styles.th}>Name</th><th className={styles.th}>Username</th><th className={styles.th}>Email</th><th className={styles.th}>Role</th><th className={styles.th}>Action</th></tr></thead>
                <tbody>
                  {users.filter((u) => u.role === "user").map((u, i) => (
                    <tr key={u.id} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td className={styles.td}>{u.id}</td><td className={styles.td}>{u.name}</td>
                      <td className={styles.td}>{u.username}</td><td className={styles.td}>{u.email}</td>
                      <td className={styles.td}><span className={`${styles.badge} ${styles.badgeUser}`}>user</span></td>
                      <td className={styles.td}><button className={styles.deleteBtn} onClick={() => setDeleteTarget({ id: u.id, type: "user", name: u.name })}><Trash2 size={13} /> Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.filter((u) => u.role === "user").length === 0 && <div className={styles.empty}>No users found.</div>}
            </div>
          </>
        )}

        {/* ---- ADMINS TAB ---- */}
        {activeTab === "admins" && !fetchingUsers && (
          <>
            <div className={styles.statsRow}>
              <div className={styles.statCard}><div className={styles.statNumber}>{totalAdmins}</div><div className={styles.statLabel}>Total Admins</div></div>
            </div>
            <div className={styles.tableCard}>
              <table className={styles.table}>
                <thead><tr><th className={styles.th}>ID</th><th className={styles.th}>Name</th><th className={styles.th}>Username</th><th className={styles.th}>Email</th><th className={styles.th}>Action</th></tr></thead>
                <tbody>
                  {users.filter((u) => u.role === "admin").map((u, i) => (
                    <tr key={u.id} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                      <td className={styles.td}>{u.id}</td><td className={styles.td}>{u.name}</td>
                      <td className={styles.td}>{u.username}</td><td className={styles.td}>{u.email}</td>
                      <td className={styles.td}><button className={styles.deleteBtn} onClick={() => setDeleteTarget({ id: u.id, type: "user", name: u.name })}><Trash2 size={13} /> Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.filter((u) => u.role === "admin").length === 0 && <div className={styles.empty}>No admins found.</div>}
            </div>
          </>
        )}

        {/* ---- ORDINANCES TAB ---- */}
        {activeTab === "ordinances" && !fetchingOrdinances && (
          <>
            <div className={styles.statsRow}>
              <div className={styles.statCard}><div className={styles.statNumber}>{ordinances.length}</div><div className={styles.statLabel}>Total Ordinances</div></div>
              <div className={`${styles.statCard} ${styles.statCardGreen}`}><div className={styles.statNumber}>{ordinances.filter((o) => o.filetype === "application/pdf").length}</div><div className={styles.statLabel}>PDF Files</div></div>
              <div className={`${styles.statCard} ${styles.statCardOrange}`}><div className={styles.statNumber}>{ordinances.filter((o) => o.filetype?.startsWith("image")).length}</div><div className={styles.statLabel}>Image / OCR</div></div>
            </div>
            <div className={styles.searchFilterBar}>
              <div className={styles.searchInputWrapper}>
                <Search size={16} className={styles.searchIcon} />
                <input className={styles.searchInput} type="text" placeholder="Search by title or number..." value={ordinanceSearch} onChange={(e) => setOrdinanceSearch(e.target.value)} />
                {ordinanceSearch && <button className={styles.clearSearch} onClick={() => setOrdinanceSearch("")}><X size={14} /></button>}
              </div>
              <div className={styles.filterGroup}>
                <Filter size={15} className={styles.filterIcon} />
                {["all", "pdf", "image"].map((type) => (
                  <button key={type} className={`${styles.filterBtn} ${ordinanceTypeFilter === type ? styles.filterBtnActive : ""}`} onClick={() => setOrdinanceTypeFilter(type)}>
                    {type === "all" ? "All" : type === "pdf" ? "PDF" : "Image / OCR"}
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
                      : <img src={`http://localhost:5000/uploads/${o.filename}`} alt={o.title} className={styles.ordinanceThumb} />}
                  </div>
                  <div className={styles.ordinanceInfo}>
                    <div className={styles.ordinanceNumber}>{o.ordinance_number || "—"}</div>
                    <div className={styles.ordinanceTitle}>{o.title}</div>
                    {o.year && <div className={styles.ordinanceYear}><CalendarDays size={13} strokeWidth={1.5} /> {o.year}</div>}
                    <div className={styles.ordinanceFileType}>
                      {o.filetype === "application/pdf" ? <><FileText size={12} strokeWidth={1.5} /> PDF</> : <><Image size={12} strokeWidth={1.5} /> Image to Text</>}
                    </div>
                    <div className={styles.ordinanceOfficialsList}>
                      <span className={styles.officialsPassedLabel}>Officials who passed:</span>
                      <div className={styles.officialAvatarRow}>
                        {o.officials && o.officials.length > 0 ? (
                          o.officials.map((off) => (
                            <div key={off.id} className={styles.officialChip}>
                              {off.photo ? <img src={`http://localhost:5000/uploads/${off.photo}`} alt={off.full_name} className={styles.chipPhoto} /> : <div className={styles.chipAvatar}>{off.full_name.charAt(0)}</div>}
                              <span className={styles.chipName}>{off.full_name}</span>
                            </div>
                          ))
                        ) : <span className={styles.noOfficials}>No officials tagged</span>}
                      </div>
                    </div>
                  </div>
                  <div className={styles.ordinanceActions}>
                    <a href={o.extracted_text ? `http://localhost:5000/api/ordinances/${o.id}/print` : `http://localhost:5000/uploads/${o.filename}`} target="_blank" rel="noreferrer" className={styles.viewBtn}><Eye size={13} /> View</a>
                    <button className={styles.editBtn} onClick={() => handleOpenEditOrdinance(o)}><Pencil size={13} /> Edit</button>
                    <button className={styles.deleteBtn} onClick={() => handleDeleteOrdinance(o.id)}><Trash2 size={13} /> Delete</button>
                  </div>
                </div>
              ))}
              {filteredOrdinances.length === 0 && (
                <div className={styles.empty}>{ordinanceSearch || ordinanceTypeFilter !== "all" ? "No ordinances match your search." : "No ordinances uploaded yet."}</div>
              )}
            </div>
          </>
        )}

        {/* ---- RESOLUTIONS TAB ---- */}
        {activeTab === "resolutions" && !fetchingResolutions && (
          <>
            <div className={styles.statsRow}>
              <div className={styles.statCard}><div className={styles.statNumber}>{resolutions.length}</div><div className={styles.statLabel}>Total Resolutions</div></div>
              <div className={`${styles.statCard} ${styles.statCardGreen}`}><div className={styles.statNumber}>{resolutions.filter((r) => r.filetype === "application/pdf").length}</div><div className={styles.statLabel}>PDF Files</div></div>
              <div className={`${styles.statCard} ${styles.statCardOrange}`}><div className={styles.statNumber}>{resolutions.filter((r) => r.filetype?.startsWith("image")).length}</div><div className={styles.statLabel}>Image / OCR</div></div>
            </div>
            <div className={styles.searchFilterBar}>
              <div className={styles.searchInputWrapper}>
                <Search size={16} className={styles.searchIcon} />
                <input className={styles.searchInput} type="text" placeholder="Search by title or resolution number..." value={resolutionSearch} onChange={(e) => setResolutionSearch(e.target.value)} />
                {resolutionSearch && <button className={styles.clearSearch} onClick={() => setResolutionSearch("")}><X size={14} /></button>}
              </div>
              <div className={styles.filterGroup}>
                <Filter size={15} className={styles.filterIcon} />
                {["all", "pdf", "image"].map((type) => (
                  <button key={type} className={`${styles.filterBtn} ${resolutionTypeFilter === type ? styles.filterBtnActive : ""}`} onClick={() => setResolutionTypeFilter(type)}>
                    {type === "all" ? "All" : type === "pdf" ? "PDF" : "Image / OCR"}
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
                      : <img src={`http://localhost:5000/uploads/${r.filename}`} alt={r.title} className={styles.ordinanceThumb} />}
                  </div>
                  <div className={styles.ordinanceInfo}>
                    <div className={styles.ordinanceNumber}>{r.resolution_number || "—"}</div>
                    <div className={styles.ordinanceTitle}>{r.title}</div>
                    {r.year && <div className={styles.ordinanceYear}><CalendarDays size={13} strokeWidth={1.5} /> {r.year}</div>}
                    <div className={styles.ordinanceFileType}>
                      {r.filetype === "application/pdf" ? <><FileText size={12} strokeWidth={1.5} /> PDF</> : <><Image size={12} strokeWidth={1.5} /> Image to Text</>}
                    </div>
                    <div className={styles.ordinanceOfficialsList}>
                      <span className={styles.officialsPassedLabel}>Officials who passed:</span>
                      <div className={styles.officialAvatarRow}>
                        {r.officials && r.officials.length > 0 ? (
                          r.officials.map((off) => (
                            <div key={off.id} className={styles.officialChip}>
                              {off.photo ? <img src={`http://localhost:5000/uploads/${off.photo}`} alt={off.full_name} className={styles.chipPhoto} /> : <div className={styles.chipAvatar}>{off.full_name.charAt(0)}</div>}
                              <span className={styles.chipName}>{off.full_name}</span>
                            </div>
                          ))
                        ) : <span className={styles.noOfficials}>No officials tagged</span>}
                      </div>
                    </div>
                  </div>
                  <div className={styles.ordinanceActions}>
                    <a href={r.extracted_text ? `http://localhost:5000/api/resolutions/${r.id}/print` : `http://localhost:5000/uploads/${r.filename}`} target="_blank" rel="noreferrer" className={styles.viewBtn}><Eye size={13} /> View</a>
                    <button className={styles.editBtn} onClick={() => handleOpenEditResolution(r)}><Pencil size={13} /> Edit</button>
                    <button className={styles.deleteBtn} onClick={() => handleDeleteResolution(r.id)}><Trash2 size={13} /> Delete</button>
                  </div>
                </div>
              ))}
              {filteredResolutions.length === 0 && (
                <div className={styles.empty}>{resolutionSearch || resolutionTypeFilter !== "all" ? "No resolutions match your search." : "No resolutions uploaded yet."}</div>
              )}
            </div>
          </>
        )}

        {/* ---- OFFICIALS TAB ---- */}
        {activeTab === "officials" && !fetchingOfficials && (
          <>
            <div className={styles.statsRow}>
              <div className={styles.statCard}><div className={styles.statNumber}>{officials.length}</div><div className={styles.statLabel}>Total SB Officials</div></div>
            </div>
            <div className={styles.searchFilterBar}>
              <div className={styles.searchInputWrapper}>
                <Search size={16} className={styles.searchIcon} />
                <input className={styles.searchInput} type="text" placeholder="Search by name or position..." value={officialSearch} onChange={(e) => setOfficialSearch(e.target.value)} />
                {officialSearch && <button className={styles.clearSearch} onClick={() => setOfficialSearch("")}><X size={14} /></button>}
              </div>
              <div className={styles.filterGroup}>
                <Filter size={15} className={styles.filterIcon} />
                <select className={styles.filterSelect} value={officialPositionFilter} onChange={(e) => setOfficialPositionFilter(e.target.value)}>
                  {uniquePositions.map((pos) => <option key={pos} value={pos}>{pos === "all" ? "All Positions" : pos}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.searchResultCount}>Showing {filteredOfficials.length} of {officials.length} officials</div>
            <div className={styles.officialsGrid}>
              {filteredOfficials.map((o) => (
                <div key={o.id} className={styles.officialCard}>
                  <button className={styles.officialCardInner} onClick={() => { setSelectedOfficialProfile(o); setShowOfficialProfile(true); }}>
                    {o.photo ? <img src={`http://localhost:5000/uploads/${o.photo}`} alt={o.full_name} className={styles.officialImg} /> : <div className={styles.officialAvatar}>{o.full_name.charAt(0)}</div>}
                    <div className={styles.officialName}>{o.full_name}</div>
                    <div className={styles.officialPosition}>{o.position}</div>
                    <div className={styles.officialTerm}><CalendarDays size={12} strokeWidth={1.5} /> {o.term_period}</div>
                    <div className={styles.ordinanceCount}><ClipboardList size={12} strokeWidth={1.5} /> {getOfficialOrdinances(o.id).length} ordinance{getOfficialOrdinances(o.id).length !== 1 ? "s" : ""} passed</div>
                  </button>
                  <button className={styles.deleteBtn} onClick={() => handleDeleteOfficial(o.id)}><Trash2 size={13} /> Delete</button>
                </div>
              ))}
              {filteredOfficials.length === 0 && (
                <div className={styles.empty}>{officialSearch || officialPositionFilter !== "all" ? "No officials match your search." : "No SB Officials added yet."}</div>
              )}
            </div>
          </>
        )}

        {/* ---- SESSION MINUTES TAB ---- */}
        {activeTab === "sessions" && !fetchingMinutes && (
          <>
            <div className={styles.statsRow}>
              <div className={styles.statCard}><div className={styles.statNumber}>{sessionMinutes.length}</div><div className={styles.statLabel}>Total Sessions</div></div>
              <div className={`${styles.statCard} ${styles.statCardGreen}`}><div className={styles.statNumber}>{sessionMinutes.filter(s => s.session_type === "regular").length}</div><div className={styles.statLabel}>Regular Sessions</div></div>
              <div className={`${styles.statCard} ${styles.statCardOrange}`}><div className={styles.statNumber}>{sessionMinutes.filter(s => s.session_type === "special").length}</div><div className={styles.statLabel}>Special Sessions</div></div>
            </div>
            <div className={styles.searchFilterBar}>
              <div className={styles.searchInputWrapper}>
                <Search size={16} className={styles.searchIcon} />
                <input className={styles.searchInput} type="text" placeholder="Search by session number, venue, or agenda..." value={minutesSearch} onChange={(e) => setMinutesSearch(e.target.value)} />
                {minutesSearch && <button className={styles.clearSearch} onClick={() => setMinutesSearch("")}><X size={14} /></button>}
              </div>
              <div className={styles.filterGroup}>
                <Filter size={15} className={styles.filterIcon} />
                {["all", "regular", "special"].map((type) => (
                  <button key={type} className={`${styles.filterBtn} ${minutesTypeFilter === type ? styles.filterBtnActive : ""}`} onClick={() => setMinutesTypeFilter(type)}>
                    {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
                <select className={styles.filterSelect} value={minutesYearFilter} onChange={(e) => setMinutesYearFilter(e.target.value)}>
                  {minutesYears.map(y => <option key={y} value={y}>{y === "all" ? "All Years" : y}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.searchResultCount}>Showing {filteredMinutes.length} of {sessionMinutes.length} sessions</div>
            <div className={styles.sessionList}>
              {filteredMinutes.map((s) => {
                const date = s.session_date ? new Date(s.session_date) : null;
                const agendaPreview = s.agenda ? s.agenda.split("\n").filter(Boolean).slice(0, 3) : [];
                return (
                  <div key={s.id} className={styles.sessionCard}>
                    <div className={styles.sessionDateBlock}>
                      {date ? (<><div className={styles.sessionMonth}>{MONTHS[date.getMonth()]}</div><div className={styles.sessionDay}>{date.getDate()}</div><div className={styles.sessionYear}>{date.getFullYear()}</div></>) : <div className={styles.sessionDay}>—</div>}
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
                            {s.agenda.split("\n").filter(Boolean).length > 3 && (
                              <li className={styles.sessionAgendaMore}>+{s.agenda.split("\n").filter(Boolean).length - 3} more items</li>
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
                      <a href={`http://localhost:5000/api/session-minutes/${s.id}/print`} target="_blank" rel="noreferrer" className={styles.printBtn}><Printer size={13} /> Print</a>
                      <a href={`http://localhost:5000/api/session-minutes/${s.id}/print`} target="_blank" rel="noreferrer" className={styles.viewBtn}><Eye size={13} /> View</a>
                      <button className={styles.editBtn} onClick={() => handleOpenEditSession(s)}><Pencil size={13} /> Edit</button>
                      <button className={styles.deleteBtn} onClick={() => handleDeleteSession(s.id)}><Trash2 size={13} /> Delete</button>
                    </div>
                  </div>
                );
              })}
              {filteredMinutes.length === 0 && (
                <div className={styles.empty}>
                  {minutesSearch || minutesTypeFilter !== "all" || minutesYearFilter !== "all"
                    ? "No session records match your search."
                    : "No session minutes recorded yet. Click \"+ Add Session\" to get started."}
                </div>
              )}
            </div>
          </>
        )}

        {/* ---- ANNOUNCEMENTS TAB ---- */}
        {activeTab === "announcements" && !fetchingAnnouncements && (
          <>
            <div className={styles.statsRow}>
              <div className={styles.statCard}><div className={styles.statNumber}>{announcements.length}</div><div className={styles.statLabel}>Total Announcements</div></div>
              <div className={`${styles.statCard} ${styles.statCardOrange}`}><div className={styles.statNumber}>{announcements.filter(a => a.priority === "urgent").length}</div><div className={styles.statLabel}>Urgent</div></div>
              <div className={`${styles.statCard} ${styles.statCardGreen}`}><div className={styles.statNumber}>{announcements.filter(a => !a.expires_at || new Date(a.expires_at) >= new Date()).length}</div><div className={styles.statLabel}>Active</div></div>
            </div>

            <div className={styles.searchFilterBar}>
              <div className={styles.searchInputWrapper}>
                <Search size={16} className={styles.searchIcon} />
                <input className={styles.searchInput} type="text" placeholder="Search announcements..." value={announcementSearch} onChange={(e) => setAnnouncementSearch(e.target.value)} />
                {announcementSearch && <button className={styles.clearSearch} onClick={() => setAnnouncementSearch("")}><X size={14} /></button>}
              </div>
              <div className={styles.filterGroup}>
                <Filter size={15} className={styles.filterIcon} />
                {["all", "urgent", "high", "normal", "low"].map((p) => (
                  <button key={p} className={`${styles.filterBtn} ${announcementPriorityFilter === p ? styles.filterBtnActive : ""}`} onClick={() => setAnnouncementPriorityFilter(p)}>
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
                        <span className={styles.announcementPriorityBadge} style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                          {cfg.label}
                        </span>
                        {isExpired && <span className={styles.expiredBadge}>Expired</span>}
                        <span className={styles.announcementDate}>
                          <CalendarDays size={11} strokeWidth={1.5} />
                          {new Date(a.created_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <div className={styles.announcementTitle}>{a.title}</div>
                      <div className={styles.announcementText}>
                        {a.body.length > 200 ? a.body.slice(0, 200) + "…" : a.body}
                      </div>
                      {a.expires_at && (
                        <div className={styles.announcementExpiry} style={{ color: isExpired ? "#c53030" : "#718096" }}>
                          {isExpired ? "⚠ Expired" : "⏱ Expires"}: {new Date(a.expires_at).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                        </div>
                      )}
                    </div>
                    <div className={styles.announcementActions}>
                      <button className={styles.editBtn} onClick={() => handleOpenEditAnnouncement(a)}><Pencil size={13} /> Edit</button>
                      <button className={styles.deleteBtn} onClick={() => handleDeleteAnnouncement(a.id)}><Trash2 size={13} /> Delete</button>
                    </div>
                  </div>
                );
              })}
              {filteredAnnouncements.length === 0 && (
                <div className={styles.empty}>
                  {announcementSearch || announcementPriorityFilter !== "all"
                    ? "No announcements match your search."
                    : "No announcements yet. Click \"+ New Announcement\" to post one."}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ============================================================
          MODALS
      ============================================================ */}

      {/* Add Admin */}
      {showAddAdminModal && (
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <h2 className={styles.modalTitle}>Add New Admin</h2>
          <input className={styles.input} placeholder="Full Name" value={newAdmin.name} onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })} />
          <input className={styles.input} placeholder="Username" value={newAdmin.username} onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })} />
          <input className={styles.input} type="email" placeholder="Email Address" value={newAdmin.email} onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })} />
          <input className={styles.input} type="password" placeholder="Password" value={newAdmin.password} onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })} />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => setShowAddAdminModal(false)}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleAddAdmin} disabled={submitting}>{submitting ? "Adding..." : "Add Admin"}</button>
          </div>
        </div></div>
      )}

      {/* Upload Ordinance */}
      {showOrdinanceModal && (
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <h2 className={styles.modalTitle}>Upload Ordinance</h2>
          <input className={styles.input} placeholder="Ordinance Number (e.g. Ordinance No. 2024-001)" value={ordinanceNumber} onChange={(e) => setOrdinanceNumber(e.target.value)} />
          <input className={styles.input} placeholder="Ordinance Title (e.g. An Ordinance Providing...)" value={ordinanceTitle} onChange={(e) => setOrdinanceTitle(e.target.value)} />
          <input className={styles.input} placeholder="Year (e.g. 2024)" type="number" min="1900" max="2100" value={ordinanceYear} onChange={(e) => setOrdinanceYear(e.target.value)} />
          <p className={styles.officialsSelectLabel}>Choose upload type:</p>
          <div className={styles.uploadTypeRow}>
            <button className={`${styles.uploadTypeBtn} ${uploadType === "pdf" ? styles.uploadTypeBtnActive : ""}`} onClick={() => { setUploadType("pdf"); setOrdinanceFile(null); }}>
              <FileText size={16} strokeWidth={1.5} /> Upload as PDF
              <span className={styles.uploadTypeDesc}>Store and view the PDF file</span>
            </button>
            <button className={`${styles.uploadTypeBtn} ${uploadType === "image-to-text" ? styles.uploadTypeBtnActive : ""}`} onClick={() => { setUploadType("image-to-text"); setOrdinanceFile(null); }}>
              <Image size={16} strokeWidth={1.5} /> Image to Text (OCR)
              <span className={styles.uploadTypeDesc}>Upload image and extract text</span>
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
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowOrdinanceModal(false); setOrdinanceFile(null); setOrdinanceNumber(""); setOrdinanceTitle(""); setOrdinanceYear(""); setSelectedOfficials([]); setUploadType(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleUploadOrdinance} disabled={submitting || !uploadType}>
              {submitting ? (uploadType === "image-to-text" ? "Extracting text..." : "Uploading...") : "Upload"}
            </button>
          </div>
        </div></div>
      )}

      {/* Upload Resolution */}
      {showResolutionModal && (
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <h2 className={styles.modalTitle}><Gavel size={18} strokeWidth={1.5} /> Upload Resolution</h2>
          <input className={styles.input} placeholder="Resolution Number (e.g. Resolution No. 2024-001)" value={resolutionNumber} onChange={(e) => setResolutionNumber(e.target.value)} />
          <input className={styles.input} placeholder="Resolution Title (e.g. A Resolution Authorizing...)" value={resolutionTitle} onChange={(e) => setResolutionTitle(e.target.value)} />
          <input className={styles.input} placeholder="Year (e.g. 2024)" type="number" min="1900" max="2100" value={resolutionYear} onChange={(e) => setResolutionYear(e.target.value)} />
          <p className={styles.officialsSelectLabel}>Choose upload type:</p>
          <div className={styles.uploadTypeRow}>
            <button className={`${styles.uploadTypeBtn} ${resolutionUploadType === "pdf" ? styles.uploadTypeBtnActive : ""}`} onClick={() => { setResolutionUploadType("pdf"); setResolutionFile(null); }}>
              <FileText size={16} strokeWidth={1.5} /> Upload as PDF
              <span className={styles.uploadTypeDesc}>Store and view the PDF file</span>
            </button>
            <button className={`${styles.uploadTypeBtn} ${resolutionUploadType === "image-to-text" ? styles.uploadTypeBtnActive : ""}`} onClick={() => { setResolutionUploadType("image-to-text"); setResolutionFile(null); }}>
              <Image size={16} strokeWidth={1.5} /> Image to Text (OCR)
              <span className={styles.uploadTypeDesc}>Upload image and extract text</span>
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
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowResolutionModal(false); setResolutionFile(null); setResolutionNumber(""); setResolutionTitle(""); setResolutionYear(""); setSelectedResolutionOfficials([]); setResolutionUploadType(""); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleUploadResolution} disabled={submitting || !resolutionUploadType}>
              {submitting ? (resolutionUploadType === "image-to-text" ? "Extracting text..." : "Uploading...") : "Upload"}
            </button>
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
            <p className={styles.officialsSelectLabel}>Tag SB Officials who passed this ordinance:</p>
            <OfficialsCheckList selected={editSelectedOfficials} onToggle={toggleEditOfficial} />
          </div>
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowEditOrdinanceModal(false); setEditingOrdinance(null); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleUpdateOrdinance} disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</button>
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
            <p className={styles.officialsSelectLabel}>Tag SB Officials who passed this resolution:</p>
            <OfficialsCheckList selected={editResolutionSelectedOfficials} onToggle={toggleEditResolutionOfficial} />
          </div>
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowEditResolutionModal(false); setEditingResolution(null); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleUpdateResolution} disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</button>
          </div>
        </div></div>
      )}

      {/* Add Official */}
      {showOfficialModal && (
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
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => setShowOfficialModal(false)}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleAddOfficial} disabled={submitting}>{submitting ? "Adding..." : "Add Official"}</button>
          </div>
        </div></div>
      )}

      {/* Official Profile */}
      {showOfficialProfile && selectedOfficialProfile && (
        <div className={styles.modalOverlay}><div className={styles.profileModal}>
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
                  <a href={`http://localhost:5000/uploads/${o.filename}`} target="_blank" rel="noreferrer" className={styles.viewBtn}><Eye size={13} /> View</a>
                </div>
              ))}
          </div>
          <div className={styles.modalBtns}>
            <button className={styles.confirmBtn} onClick={() => setShowOfficialProfile(false)}>Close</button>
          </div>
        </div></div>
      )}

      {/* Extracted Text Modal */}
      {showTextModal && (
        <div className={styles.modalOverlay}><div className={styles.modal}>
          <h2 className={styles.modalTitle}>Extracted Text (OCR)</h2>
          <textarea className={styles.textArea} value={extractedText} readOnly />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { navigator.clipboard.writeText(extractedText); showMsg("Copied to clipboard!"); }}>
              <Copy size={13} /> Copy Text
            </button>
            <button className={styles.confirmBtn} onClick={() => setShowTextModal(false)}>Close</button>
          </div>
        </div></div>
      )}

      {/* ADD SESSION MODAL */}
      {showSessionModal && (
        <div className={styles.modalOverlay}><div className={`${styles.modal} ${styles.sessionModal}`}>
          <h2 className={styles.modalTitle}><BookOpen size={18} strokeWidth={1.5} /> Add Session Minutes &amp; Agenda</h2>
          <div className={styles.uploadTypeRow}>
            <button className={`${styles.uploadTypeBtn} ${sessionInputMode === "text" ? styles.uploadTypeBtnActive : ""}`} onClick={() => setSessionInputMode("text")}>
              <FileEdit size={16} strokeWidth={1.5} /> Direct Input
              <span className={styles.uploadTypeDesc}>Type or paste session minutes directly</span>
            </button>
            <button className={`${styles.uploadTypeBtn} ${sessionInputMode === "ocr" ? styles.uploadTypeBtnActive : ""}`} onClick={() => setSessionInputMode("ocr")}>
              <Camera size={16} strokeWidth={1.5} /> Upload Image (OCR)
              <span className={styles.uploadTypeDesc}>Scan handwritten or printed paper</span>
            </button>
          </div>
          <div className={styles.sessionFormGrid}>
            <div className={styles.sessionFormCol}>
              <label className={styles.fieldLabel}>Session Number</label>
              <input className={styles.input} placeholder="e.g. 12th Regular Session" value={sessionForm.session_number} onChange={(e) => setSessionForm({ ...sessionForm, session_number: e.target.value })} />
            </div>
            <div className={styles.sessionFormCol}>
              <label className={styles.fieldLabel}>Session Date <span style={{color:"#e53e3e"}}>*</span></label>
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
              <textarea className={styles.textArea} placeholder={"1. Call to order\n2. Roll call\n3. Reading of minutes\n4. Committee reports\n..."} value={sessionForm.agenda} onChange={(e) => setSessionForm({ ...sessionForm, agenda: e.target.value })} rows={5} />
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
                <><label className={styles.fieldLabel}>Agenda Items <span className={styles.fieldHint}>(optional, one per line)</span></label>
                <textarea className={styles.textArea} placeholder={"1. Call to order\n2. Roll call\n..."} value={sessionForm.agenda} onChange={(e) => setSessionForm({ ...sessionForm, agenda: e.target.value })} rows={4} /></>
              )}
              {sessionOcrTarget === "agenda" && (
                <><label className={styles.fieldLabel}>Minutes Text <span className={styles.fieldHint}>(optional)</span></label>
                <textarea className={styles.textArea} placeholder="Type session minutes or leave blank..." value={sessionForm.minutes_text} onChange={(e) => setSessionForm({ ...sessionForm, minutes_text: e.target.value })} rows={4} /></>
              )}
            </>
          )}
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowSessionModal(false); resetSessionForm(); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleAddSession} disabled={submitting}>
              {submitting ? (sessionInputMode === "ocr" ? "Extracting & Saving..." : "Saving...") : "Save Session"}
            </button>
          </div>
        </div></div>
      )}

      {/* EDIT SESSION MODAL */}
      {showEditSessionModal && editingSession && (
        <div className={styles.modalOverlay}><div className={`${styles.modal} ${styles.sessionModal}`}>
          <h2 className={styles.modalTitle}><Pencil size={16} strokeWidth={1.5} /> Edit Session Minutes</h2>
          <div className={styles.sessionFormGrid}>
            <div className={styles.sessionFormCol}>
              <label className={styles.fieldLabel}>Session Number</label>
              <input className={styles.input} placeholder="e.g. 12th Regular Session" value={editSessionForm.session_number} onChange={(e) => setEditSessionForm({ ...editSessionForm, session_number: e.target.value })} />
            </div>
            <div className={styles.sessionFormCol}>
              <label className={styles.fieldLabel}>Session Date <span style={{color:"#e53e3e"}}>*</span></label>
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
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowEditSessionModal(false); setEditingSession(null); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleUpdateSession} disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</button>
          </div>
        </div></div>
      )}

      {/* ADD ANNOUNCEMENT MODAL */}
      {showAnnouncementModal && (
        <div className={styles.modalOverlay}><div className={`${styles.modal} ${styles.sessionModal}`}>
          <h2 className={styles.modalTitle}><Megaphone size={18} strokeWidth={1.5} /> New Announcement</h2>
          <label className={styles.fieldLabel}>Title <span style={{color:"#e53e3e"}}>*</span></label>
          <input className={styles.input} placeholder="Announcement title..." value={announcementForm.title} onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })} />
          <label className={styles.fieldLabel}>Priority Level</label>
          <div className={styles.priorityRow}>
            {["urgent", "high", "normal", "low"].map((p) => {
              const cfg = priorityConfig[p];
              return (
                <button
                  key={p}
                  className={`${styles.priorityBtn} ${announcementForm.priority === p ? styles.priorityBtnActive : ""}`}
                  style={announcementForm.priority === p ? { background: cfg.bg, borderColor: cfg.border, color: cfg.color } : {}}
                  onClick={() => setAnnouncementForm({ ...announcementForm, priority: p })}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
          <label className={styles.fieldLabel}>Announcement Body <span style={{color:"#e53e3e"}}>*</span></label>
          <textarea className={styles.textArea} placeholder="Write your announcement here..." value={announcementForm.body} onChange={(e) => setAnnouncementForm({ ...announcementForm, body: e.target.value })} rows={7} style={{ height: "auto" }} />
          <label className={styles.fieldLabel}>Expiry Date <span className={styles.fieldHint}>(optional — leave blank for no expiry)</span></label>
          <input className={styles.input} type="date" value={announcementForm.expires_at} onChange={(e) => setAnnouncementForm({ ...announcementForm, expires_at: e.target.value })} />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowAnnouncementModal(false); resetAnnouncementForm(); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleAddAnnouncement} disabled={submitting}>{submitting ? "Posting..." : "Post Announcement"}</button>
          </div>
        </div></div>
      )}

      {/* EDIT ANNOUNCEMENT MODAL */}
      {showEditAnnouncementModal && editingAnnouncement && (
        <div className={styles.modalOverlay}><div className={`${styles.modal} ${styles.sessionModal}`}>
          <h2 className={styles.modalTitle}><Pencil size={16} strokeWidth={1.5} /> Edit Announcement</h2>
          <label className={styles.fieldLabel}>Title <span style={{color:"#e53e3e"}}>*</span></label>
          <input className={styles.input} placeholder="Announcement title..." value={editAnnouncementForm.title} onChange={(e) => setEditAnnouncementForm({ ...editAnnouncementForm, title: e.target.value })} />
          <label className={styles.fieldLabel}>Priority Level</label>
          <div className={styles.priorityRow}>
            {["urgent", "high", "normal", "low"].map((p) => {
              const cfg = priorityConfig[p];
              return (
                <button
                  key={p}
                  className={`${styles.priorityBtn} ${editAnnouncementForm.priority === p ? styles.priorityBtnActive : ""}`}
                  style={editAnnouncementForm.priority === p ? { background: cfg.bg, borderColor: cfg.border, color: cfg.color } : {}}
                  onClick={() => setEditAnnouncementForm({ ...editAnnouncementForm, priority: p })}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
          <label className={styles.fieldLabel}>Announcement Body <span style={{color:"#e53e3e"}}>*</span></label>
          <textarea className={styles.textArea} value={editAnnouncementForm.body} onChange={(e) => setEditAnnouncementForm({ ...editAnnouncementForm, body: e.target.value })} rows={7} style={{ height: "auto" }} />
          <label className={styles.fieldLabel}>Expiry Date <span className={styles.fieldHint}>(optional)</span></label>
          <input className={styles.input} type="date" value={editAnnouncementForm.expires_at} onChange={(e) => setEditAnnouncementForm({ ...editAnnouncementForm, expires_at: e.target.value })} />
          <div className={styles.modalBtns}>
            <button className={styles.cancelBtn} onClick={() => { setShowEditAnnouncementModal(false); setEditingAnnouncement(null); }}>Cancel</button>
            <button className={styles.confirmBtn} onClick={handleUpdateAnnouncement} disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</button>
          </div>
        </div></div>
      )}

   
      {showAddUserModal && (
    <div className={styles.modalOverlay}><div className={styles.modal}>
    <h2 className={styles.modalTitle}>Add New User</h2>
    <input className={styles.input} placeholder="Full Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
    <input className={styles.input} placeholder="Username" value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} />
    <input className={styles.input} type="email" placeholder="Email Address" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
    <input className={styles.input} type="password" placeholder="Password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
    <div className={styles.modalBtns}>
      <button className={styles.cancelBtn} onClick={() => setShowAddUserModal(false)}>Cancel</button>
      <button className={styles.confirmBtn} onClick={handleAddUser} disabled={submitting}>{submitting ? "Adding..." : "Add User"}</button>
    </div>
  </div></div>
)}

{/* DELETE CONFIRM MODAL — ADD THIS */}
      {deleteTarget && (
        <ConfirmModal
          type="delete"
          title="Delete this user?"
          message={`"${deleteTarget.name}" will be permanently removed. This cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={() => { handleDeleteUser(deleteTarget.id); setDeleteTarget(null); }}
          onCancel={() => setDeleteTarget(null)}
        />
      )}



    </div>
  );
}