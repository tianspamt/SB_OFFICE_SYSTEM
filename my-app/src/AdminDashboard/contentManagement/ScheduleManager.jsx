import { useState } from "react";
import {
  PlusCircle,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  MapPin,
  Calendar,
} from "lucide-react";
import styles from "../AdminDashboard.module.css";
import ConfirmModal from "../ConfirmModal";
import { useSchedules } from "./useSchedules";

const emptyForm = {
  title: "",
  description: "",
  location: "",
  event_date: "",
  event_time: "",
  published: true,
};

function formatEventDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatEventTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${period}`;
}

export function ScheduleManager({ isAdmin = false }) {
  const { schedules, loading, fetchError, saveSchedule, deleteSchedule, togglePublish } =
    useSchedules();

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [message, setMessage] = useState("");
  const showMsg = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3500);
  };

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setModalError("");
    setShowModal(true);
  };
  const openEdit = (s) => {
    setEditTarget(s);
    setForm({
      title: s.title || "",
      description: s.description || "",
      location: s.location || "",
      event_date: s.event_date || "",
      event_time: s.event_time || "",
      published: s.published,
    });
    setModalError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.event_date) {
      setModalError("Title and event date are required.");
      return;
    }
    setSaving(true);
    setModalError("");
    try {
      await saveSchedule(editTarget, form);
      setShowModal(false);
    } catch (err) {
      setModalError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteSchedule(deleteTarget);
      setDeleteTarget(null);
    } catch (err) {
      showMsg(err.message || "Failed to delete schedule.");
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      await togglePublish(id);
    } catch (err) {
      showMsg(err.message || "Failed to update schedule.");
    }
  };

  return (
    <div>
      <p
        style={{
          fontSize: 14,
          color: "#64748b",
          margin: "0 0 16px",
          lineHeight: 1.55,
          maxWidth: 720,
        }}
      >
        Dated public events shown on the public site — sessions, hearings,
        community activities. Sorted soonest-first, not by post date.
      </p>

      {message && (
        <div className={styles.fetchError}>
          <AlertCircle size={14} /> {message}
        </div>
      )}

      {isAdmin && (
        <button
          type="button"
          className={styles.addBtn}
          onClick={openAdd}
          style={{ marginBottom: 16 }}
        >
          <PlusCircle size={16} /> New schedule
        </button>
      )}

      {fetchError && (
        <div className={styles.fetchError}>
          <AlertCircle size={14} /> {fetchError}
        </div>
      )}

      {loading ? (
        <div className={styles.loadingWrap}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      ) : schedules.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No schedules yet</h3>
          <p>Add upcoming events for the public site.</p>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Event</th>
                <th className={styles.th}>When</th>
                <th className={styles.th}>Location</th>
                <th className={styles.th}>Status</th>
                {isAdmin && <th className={styles.th}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {schedules.map((s, i) => (
                <tr key={s.id} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <td className={styles.td}>
                    <div style={{ fontWeight: 600 }}>{s.title}</div>
                    {s.description && (
                      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                        {s.description}
                      </div>
                    )}
                  </td>
                  <td className={styles.td} style={{ whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Calendar size={12} /> {formatEventDate(s.event_date)}
                    </div>
                    {s.event_time && (
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>
                        {formatEventTime(s.event_time)}
                      </div>
                    )}
                  </td>
                  <td className={styles.td}>
                    {s.location ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <MapPin size={12} /> {s.location}
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.badge} ${
                        s.published ? styles.badgeUser : styles.badgeGray
                      }`}
                    >
                      {s.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className={styles.td}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button className={styles.editBtn} onClick={() => openEdit(s)}>
                          <Pencil size={13} /> Edit
                        </button>
                        <button
                          className={styles.editBtn}
                          onClick={() => handleTogglePublish(s.id)}
                        >
                          {s.published ? <EyeOff size={13} /> : <Eye size={13} />}{" "}
                          {s.published ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => setDeleteTarget(s)}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editTarget ? (
                  <>
                    <Pencil size={17} /> Edit schedule
                  </>
                ) : (
                  <>
                    <PlusCircle size={17} /> New schedule
                  </>
                )}
              </h2>
              <button type="button" className={styles.modalClose} onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.fieldLabel}>
                Title <span className={styles.required}>*</span>
              </label>
              <input
                className={styles.input}
                placeholder="e.g. Regular Session, August 2026"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label className={styles.fieldLabel}>
                    Date <span className={styles.required}>*</span>
                  </label>
                  <input
                    className={styles.input}
                    type="date"
                    value={form.event_date}
                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className={styles.fieldLabel}>Time</label>
                  <input
                    className={styles.input}
                    type="time"
                    value={form.event_time}
                    onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                  />
                </div>
              </div>

              <label className={styles.fieldLabel}>Location</label>
              <input
                className={styles.input}
                placeholder="e.g. Municipal Session Hall"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />

              <label className={styles.fieldLabel}>Description</label>
              <textarea
                className={styles.textarea}
                rows={4}
                placeholder="Optional details about this event…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />

              <label
                className={styles.toggleLabel}
                style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}
              >
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => setForm({ ...form, published: e.target.checked })}
                />
                <span className={styles.toggleText}>
                  {form.published ? (
                    <>
                      <Eye size={13} /> Publish immediately
                    </>
                  ) : (
                    <>
                      <EyeOff size={13} /> Save as draft
                    </>
                  )}
                </span>
              </label>

              {modalError && (
                <div className={styles.modalError}>
                  <AlertCircle size={14} /> {modalError}
                </div>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={saving || !form.title.trim() || !form.event_date}
              >
                {saving ? "Saving…" : editTarget ? "Save changes" : "Add schedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          type="delete"
          title="Delete this schedule?"
          message={`"${deleteTarget.title}" will be permanently removed. This cannot be undone.`}
          confirmLabel={deleting ? "Deleting…" : "Delete"}
          onConfirm={() => !deleting && handleDelete()}
          onCancel={() => !deleting && setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
