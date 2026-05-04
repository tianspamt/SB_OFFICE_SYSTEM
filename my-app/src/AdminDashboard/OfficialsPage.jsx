import { useState } from "react";
import {
  Search,
  X,
  Filter,
  Trash2,
  CalendarDays,
  ChevronRight,
  Plus,
  Users,
  Crown,
  Edit2,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import styles from "./AdminDashboard.module.css";

// ─────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function TermStatusBadge({ status }) {
  const map = {
    active: {
      label: "Active",
      bg: "#f0fdf4",
      color: "#16a34a",
      border: "#bbf7d0",
    },
    terms_ended: {
      label: "Terms Ended",
      bg: "#fff7ed",
      color: "#c2410c",
      border: "#fed7aa",
    },
    inactive: {
      label: "Inactive",
      bg: "#f8fafc",
      color: "#64748b",
      border: "#e2e8f0",
    },
  };
  const s = map[status] || map.inactive;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.5px",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      {status === "active" ? <CheckCircle2 size={10} /> : <Clock size={10} />}
      {s.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Council Card (list view)
// ─────────────────────────────────────────────────────────────

function CouncilCard({ council, isCurrent, onClick, onDelete }) {
  const memberCount = council.councilors?.length ?? 0;
  const activeCount =
    council.councilors?.filter((c) => c.term_status === "active").length ?? 0;

  return (
    <div
      className={councilCardStyles.card}
      style={isCurrent ? councilCardStyles.cardCurrent : {}}
    >
      {isCurrent && (
        <div className={councilCardStyles.currentBadge}>
          <Crown size={10} /> Current
        </div>
      )}
      <button className={councilCardStyles.inner} onClick={onClick}>
        <div
          className={councilCardStyles.iconWrap}
          style={
            isCurrent
              ? {
                  background: "linear-gradient(135deg,#009439,#00b84a)",
                  color: "#fff",
                }
              : {}
          }
        >
          <Building2 size={22} />
        </div>
        <div className={councilCardStyles.info}>
          <div className={councilCardStyles.title}>
            {ordinal(council.number)} Sangguniang Bayan Council
          </div>
          {council.term_period && (
            <div className={councilCardStyles.term}>
              <CalendarDays size={12} strokeWidth={1.5} /> {council.term_period}
            </div>
          )}
          <div className={councilCardStyles.stats}>
            <span>
              <Users size={12} strokeWidth={1.5} /> {memberCount} member
              {memberCount !== 1 ? "s" : ""}
            </span>
            {activeCount > 0 && (
              <span style={{ color: "#16a34a" }}>
                <CheckCircle2 size={12} strokeWidth={1.5} /> {activeCount}{" "}
                active
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={18} style={{ color: "#94a3b8", flexShrink: 0 }} />
      </button>
      <button
        className={styles.deleteBtn}
        onClick={(e) => {
          e.stopPropagation();
          onDelete(council);
        }}
        style={{
          borderTop: "1px solid #f1f5f9",
          borderRadius: "0 0 12px 12px",
          marginTop: 0,
        }}
      >
        <Trash2 size={13} /> Delete Council
      </button>
    </div>
  );
}

// Inline styles for CouncilCard (avoids needing new CSS classes)
const councilCardStyles = {
  card: {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 14,
    overflow: "hidden",
    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
    transition: "box-shadow 0.2s, transform 0.15s",
    position: "relative",
  },
  cardCurrent: {
    border: "1.5px solid #86efac",
    boxShadow: "0 2px 16px rgba(0,148,57,0.12)",
  },
  currentBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    background: "linear-gradient(135deg,#009439,#00b84a)",
    color: "#fff",
    fontSize: 10,
    fontWeight: 800,
    padding: "2px 9px",
    borderRadius: 20,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  inner: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "16px 16px 12px",
    width: "100%",
    background: "none",
    border: "none",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: "#f1f5f9",
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  info: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: 800, color: "#1e293b", marginBottom: 3 },
  term: {
    fontSize: 12,
    color: "#64748b",
    display: "flex",
    alignItems: "center",
    gap: 4,
    marginBottom: 5,
  },
  stats: {
    display: "flex",
    gap: 12,
    fontSize: 12,
    color: "#64748b",
    alignItems: "center",
  },
};

// ─────────────────────────────────────────────────────────────
// Councilor Card (detail view)
// ─────────────────────────────────────────────────────────────

function CouncilorCard({ councilor, onEdit, onRemove }) {
  return (
    <div className={styles.officialCard}>
      <div className={styles.officialCardInner} style={{ cursor: "default" }}>
        {councilor.photo ? (
          <img
            src={councilor.photo}
            alt={councilor.full_name}
            className={styles.officialImg}
          />
        ) : (
          <div className={styles.officialAvatar}>
            {councilor.full_name.charAt(0)}
          </div>
        )}
        <div className={styles.officialName}>{councilor.full_name}</div>
        <div className={styles.officialPosition}>{councilor.position}</div>
        <div style={{ margin: "4px 0" }}>
          <TermStatusBadge status={councilor.term_status} />
        </div>
        {councilor.term_period && (
          <div className={styles.officialTerm}>
            <CalendarDays size={12} strokeWidth={1.5} /> {councilor.term_period}
          </div>
        )}
      </div>
      <div style={{ display: "flex", gap: 6, padding: "0 10px 10px" }}>
        <button
          onClick={() => onEdit(councilor)}
          style={actionBtnStyle("#2563eb", "#eff6ff")}
        >
          <Edit2 size={12} /> Edit
        </button>
        <button
          onClick={() => onRemove(councilor)}
          style={actionBtnStyle("#dc2626", "#fff5f5")}
        >
          <Trash2 size={12} /> Remove
        </button>
      </div>
    </div>
  );
}

function actionBtnStyle(color, bg) {
  return {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    padding: "7px 4px",
    background: bg,
    border: `1px solid ${color}22`,
    borderRadius: 8,
    color,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "opacity 0.15s",
  };
}

// ─────────────────────────────────────────────────────────────
// Council Form Modal (Create / Edit councilor)
// ─────────────────────────────────────────────────────────────

function CouncilorFormModal({ councilor, onSave, onClose }) {
  const isEdit = !!councilor?.id;
  const [form, setForm] = useState({
    full_name: councilor?.full_name ?? "",
    position: councilor?.position ?? "",
    term_status: councilor?.term_status ?? "active",
    term_period: councilor?.term_period ?? "",
    photo: councilor?.photo ?? "",
  });
  const [error, setError] = useState("");

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSubmit() {
    if (!form.full_name.trim()) return setError("Full name is required.");
    if (!form.position.trim()) return setError("Position is required.");
    setError("");
    onSave({ ...councilor, ...form, id: councilor?.id ?? crypto.randomUUID() });
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${styles.modalSm}`}
        style={{ maxWidth: 440 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>
            {isEdit ? "Edit Councilor" : "Add Councilor"}
          </span>
          <button className={styles.modalClose} onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <label className={styles.fieldLabel}>
            Full Name <span className={styles.required}>*</span>
          </label>
          <input
            className={styles.input}
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder="e.g. Juan dela Cruz"
          />

          <label className={styles.fieldLabel}>
            Position <span className={styles.required}>*</span>
          </label>
          <input
            className={styles.input}
            value={form.position}
            onChange={(e) => set("position", e.target.value)}
            placeholder="e.g. Councilor, SK Federation President"
          />

          <label className={styles.fieldLabel}>Term Status</label>
          <select
            className={styles.input}
            value={form.term_status}
            onChange={(e) => set("term_status", e.target.value)}
          >
            <option value="active">Active</option>
            <option value="terms_ended">Terms Ended</option>
            <option value="inactive">Inactive</option>
          </select>

          <label className={styles.fieldLabel}>Term Period</label>
          <input
            className={styles.input}
            value={form.term_period}
            onChange={(e) => set("term_period", e.target.value)}
            placeholder="e.g. 2022 – 2025"
          />

          <label className={styles.fieldLabel}>Photo URL</label>
          <input
            className={styles.input}
            value={form.photo}
            onChange={(e) => set("photo", e.target.value)}
            placeholder="https://..."
          />

          {error && (
            <div className={styles.modalError}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.saveBtn} onClick={handleSubmit}>
            {isEdit ? "Save Changes" : "Add Councilor"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Create Council Modal
// ─────────────────────────────────────────────────────────────

function CreateCouncilModal({ existingNumbers, onSave, onClose }) {
  const nextNumber = Math.max(0, ...existingNumbers) + 1;
  const [form, setForm] = useState({
    number: nextNumber,
    term_period: "",
    is_current: existingNumbers.length === 0,
  });
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!form.number || form.number < 1)
      return setError("Council number must be at least 1.");
    if (existingNumbers.includes(Number(form.number)))
      return setError(`${ordinal(form.number)} Council already exists.`);
    setError("");
    onSave({
      id: crypto.randomUUID(),
      number: Number(form.number),
      term_period: form.term_period,
      is_current: form.is_current,
      councilors: [],
    });
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${styles.modalSm}`}
        style={{ maxWidth: 420 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>Create New Council</span>
          <button className={styles.modalClose} onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <label className={styles.fieldLabel}>
            Council Number <span className={styles.required}>*</span>
          </label>
          <input
            type="number"
            min={1}
            className={styles.input}
            value={form.number}
            onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
            placeholder="e.g. 3"
          />
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
            Will be displayed as:{" "}
            <strong style={{ color: "#1e293b" }}>
              {ordinal(form.number || "?")} Sangguniang Bayan Council
            </strong>
          </div>

          <label className={styles.fieldLabel}>Term Period</label>
          <input
            className={styles.input}
            value={form.term_period}
            onChange={(e) =>
              setForm((f) => ({ ...f, term_period: e.target.value }))
            }
            placeholder="e.g. 2025 – 2028"
          />

          <div className={styles.optionsRow} style={{ marginTop: 14 }}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={form.is_current}
                onChange={(e) =>
                  setForm((f) => ({ ...f, is_current: e.target.checked }))
                }
              />
              <span className={styles.toggleText}>
                <Crown size={14} style={{ color: "#009439" }} /> Mark as Current
                Council
              </span>
            </label>
          </div>

          {error && (
            <div className={styles.modalError}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.saveBtn} onClick={handleSubmit}>
            Create Council
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Delete Confirm Modal
// ─────────────────────────────────────────────────────────────

function DeleteConfirmModal({ title, subtitle, onConfirm, onClose }) {
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${styles.modalSm}`}
        style={{ maxWidth: 380, textAlign: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.deleteIcon}>
          <Trash2 size={28} />
        </div>
        <div className={styles.deleteTitle}>{title}</div>
        <div className={styles.deleteSub}>{subtitle}</div>
        <div
          className={styles.modalFooter}
          style={{ justifyContent: "center", paddingTop: 20 }}
        >
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.deleteBtn} onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Council Detail View (councilors inside a council)
// ─────────────────────────────────────────────────────────────

function CouncilDetailView({ council, onBack, onUpdateCouncil }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [councilorModal, setCouncilorModal] = useState(null); // null | { mode: "add"|"edit", data }
  const [deleteTarget, setDeleteTarget] = useState(null); // councilor to delete

  const councilors = council.councilors ?? [];

  const filtered = councilors.filter((c) => {
    const matchSearch =
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.position.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" || c.term_status === statusFilter;
    return matchSearch && matchStatus;
  });

  function handleSaveCouncilor(data) {
    const exists = councilors.some((c) => c.id === data.id);
    const updated = exists
      ? councilors.map((c) => (c.id === data.id ? data : c))
      : [...councilors, data];
    onUpdateCouncil({ ...council, councilors: updated });
    setCouncilorModal(null);
  }

  function handleDeleteCouncilor() {
    onUpdateCouncil({
      ...council,
      councilors: councilors.filter((c) => c.id !== deleteTarget.id),
    });
    setDeleteTarget(null);
  }

  const activeCount = councilors.filter(
    (c) => c.term_status === "active"
  ).length;
  const endedCount = councilors.filter(
    (c) => c.term_status === "terms_ended"
  ).length;

  return (
    <>
      {/* ── Breadcrumb / Back ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={onBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#f1f5f9",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: "7px 14px",
            fontSize: 13,
            fontWeight: 700,
            color: "#475569",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <ArrowLeft size={15} /> All Councils
        </button>
        <ChevronRight size={15} style={{ color: "#cbd5e1" }} />
        <span style={{ fontSize: 15, fontWeight: 800, color: "#1e293b" }}>
          {ordinal(council.number)} Sangguniang Bayan Council
        </span>
        {council.is_current && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "linear-gradient(135deg,#009439,#00b84a)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 800,
              padding: "2px 9px",
              borderRadius: 20,
              letterSpacing: "0.5px",
            }}
          >
            <Crown size={10} /> Current
          </span>
        )}
        {council.term_period && (
          <span
            style={{
              fontSize: 12,
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <CalendarDays size={12} strokeWidth={1.5} /> {council.term_period}
          </span>
        )}
      </div>

      {/* ── Stats ── */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{councilors.length}</div>
          <div className={styles.statLabel}>Total Councilors</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardGreen}`}>
          <div className={styles.statNumber}>{activeCount}</div>
          <div className={styles.statLabel}>Active Terms</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardOrange}`}>
          <div className={styles.statNumber}>{endedCount}</div>
          <div className={styles.statLabel}>Terms Ended</div>
        </div>
      </div>

      {/* ── Search / Filter / Add ── */}
      <div className={styles.searchFilterBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search by name or position..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className={styles.clearSearch}
              onClick={() => setSearch("")}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className={styles.filterGroup}>
          <Filter size={15} className={styles.filterIcon} />
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="terms_ended">Terms Ended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <button
          onClick={() => setCouncilorModal({ mode: "add", data: null })}
          className={styles.saveBtn}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            flexShrink: 0,
          }}
        >
          <UserPlus size={15} /> Add Councilor
        </button>
      </div>

      <div className={styles.searchResultCount}>
        Showing {filtered.length} of {councilors.length} councilor
        {councilors.length !== 1 ? "s" : ""}
      </div>

      {/* ── Councilors Grid ── */}
      <div className={styles.officialsGrid}>
        {filtered.map((c) => (
          <CouncilorCard
            key={c.id}
            councilor={c}
            onEdit={(data) => setCouncilorModal({ mode: "edit", data })}
            onRemove={(data) => setDeleteTarget(data)}
          />
        ))}
        {filtered.length === 0 && (
          <div className={styles.empty}>
            {search || statusFilter !== "all"
              ? "No councilors match your search."
              : 'No councilors added yet. Click "Add Councilor" to get started.'}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {councilorModal && (
        <CouncilorFormModal
          councilor={
            councilorModal.mode === "edit" ? councilorModal.data : null
          }
          onSave={handleSaveCouncilor}
          onClose={() => setCouncilorModal(null)}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          title="Remove Councilor?"
          subtitle={`"${deleteTarget.full_name}" will be permanently removed from this council.`}
          onConfirm={handleDeleteCouncilor}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Main CouncilorsPage
// ─────────────────────────────────────────────────────────────

/**
 * Props:
 *  councils        – array of council objects (see shape below)
 *  onUpdateCouncil – (updatedCouncil) => void
 *  onCreateCouncil – (newCouncil) => void
 *  onDeleteCouncil – (council) => void
 *
 * Council shape:
 * {
 *   id:          string,
 *   number:      number,       // 1, 2, 3 …
 *   term_period: string,       // "2022 – 2025"
 *   is_current:  boolean,
 *   councilors:  Councilor[],
 * }
 *
 * Councilor shape:
 * {
 *   id:          string,
 *   full_name:   string,
 *   position:    string,
 *   term_status: "active" | "terms_ended" | "inactive",
 *   term_period: string,
 *   photo:       string,
 * }
 */
export default function CouncilorsPage({
  councils = [],
  onUpdateCouncil,
  onCreateCouncil,
  onDeleteCouncil,
}) {
  const [selectedCouncil, setSelectedCouncil] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Keep current council first, then sort by number descending
  const sortedCouncils = [...councils].sort((a, b) => {
    if (a.is_current && !b.is_current) return -1;
    if (!a.is_current && b.is_current) return 1;
    return b.number - a.number;
  });

  function handleCreateCouncil(council) {
    // If new council is marked current, unmark others
    let updated = council;
    if (council.is_current) {
      councils.forEach((c) => {
        if (c.is_current) onUpdateCouncil({ ...c, is_current: false });
      });
    }
    onCreateCouncil(updated);
    setShowCreateModal(false);
  }

  function handleDeleteCouncil() {
    onDeleteCouncil(deleteTarget);
    setDeleteTarget(null);
    if (selectedCouncil?.id === deleteTarget.id) setSelectedCouncil(null);
  }

  // ── Detail view ──
  if (selectedCouncil) {
    const live =
      councils.find((c) => c.id === selectedCouncil.id) ?? selectedCouncil;
    return (
      <CouncilDetailView
        council={live}
        onBack={() => setSelectedCouncil(null)}
        onUpdateCouncil={(updated) => {
          onUpdateCouncil(updated);
          setSelectedCouncil(updated);
        }}
      />
    );
  }

  // ── Council list view ──
  const totalMembers = councils.reduce(
    (acc, c) => acc + (c.councilors?.length ?? 0),
    0
  );
  const currentCouncil = councils.find((c) => c.is_current);

  return (
    <>
      {/* ── Summary stats ── */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{councils.length}</div>
          <div className={styles.statLabel}>Total Councils</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardGreen}`}>
          <div className={styles.statNumber}>
            {currentCouncil?.councilors?.length ?? 0}
          </div>
          <div className={styles.statLabel}>Current Council Members</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardOrange}`}>
          <div className={styles.statNumber}>{totalMembers}</div>
          <div className={styles.statLabel}>All-time Councilors</div>
        </div>
      </div>

      {/* ── Top bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ fontSize: 13, color: "#64748b" }}>
          {councils.length > 0
            ? `${councils.length} council${
                councils.length !== 1 ? "s" : ""
              } — current council shown first`
            : "No councils yet. Create your first council to get started."}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className={styles.saveBtn}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 18px",
          }}
        >
          <Plus size={15} /> New Council
        </button>
      </div>

      {/* ── Council list ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {sortedCouncils.map((council) => (
          <CouncilCard
            key={council.id}
            council={council}
            isCurrent={council.is_current}
            onClick={() => setSelectedCouncil(council)}
            onDelete={(c) => setDeleteTarget(c)}
          />
        ))}
        {councils.length === 0 && (
          <div className={styles.empty}>
            No councils added yet. Click <strong>"New Council"</strong> to get
            started.
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showCreateModal && (
        <CreateCouncilModal
          existingNumbers={councils.map((c) => c.number)}
          onSave={handleCreateCouncil}
          onClose={() => setShowCreateModal(false)}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          title="Delete Council?"
          subtitle={`The ${ordinal(
            deleteTarget.number
          )} Sangguniang Bayan Council and all its councilors will be permanently deleted. This cannot be undone.`}
          onConfirm={handleDeleteCouncil}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
