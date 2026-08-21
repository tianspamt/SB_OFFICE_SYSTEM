import { useState } from "react";
import {
  PlusCircle,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  X,
} from "lucide-react";
import styles from "../AdminDashboard.module.css";
import ConfirmModal from "../ConfirmModal";
import { useTrivia } from "./useTrivia";

export function TriviaManager({ isAdmin = false, showMsg }) {
  const { facts, loading, fetchError, saveFact, deleteFact, toggleActive } = useTrivia();

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [factText, setFactText] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const openAdd = () => {
    setEditTarget(null);
    setFactText("");
    setModalError("");
    setShowModal(true);
  };
  const openEdit = (f) => {
    setEditTarget(f);
    setFactText(f.fact_text);
    setModalError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!factText.trim()) {
      setModalError("Fact text is required.");
      return;
    }
    setSaving(true);
    setModalError("");
    try {
      await saveFact(editTarget, {
        fact_text: factText.trim(),
        is_active: editTarget ? editTarget.is_active : true,
      });
      showMsg?.(editTarget ? "Trivia fact updated!" : "Trivia fact added!");
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
      await deleteFact(deleteTarget);
      showMsg?.("Trivia fact deleted!");
      setDeleteTarget(null);
    } catch (err) {
      showMsg?.(err.message || "Failed to delete trivia fact.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleActive(id);
    } catch (err) {
      showMsg?.(err.message || "Failed to update trivia fact.", "error");
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
        Rotating legislative facts shown on the public site's homepage.
        Inactive facts stay saved but won't appear there.
      </p>

      {isAdmin && (
        <button
          type="button"
          className={styles.addBtn}
          onClick={openAdd}
          style={{ marginBottom: 16 }}
        >
          <PlusCircle size={16} /> New trivia fact
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
      ) : facts.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No trivia facts yet</h3>
          <p>Add facts to rotate on the public homepage.</p>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Fact</th>
                <th className={styles.th}>Status</th>
                {isAdmin && <th className={styles.th}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {facts.map((f, i) => (
                <tr key={f.id} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <td className={styles.td} style={{ maxWidth: 480 }}>{f.fact_text}</td>
                  <td className={styles.td}>
                    <span
                      className={`${styles.badge} ${
                        f.is_active ? styles.badgeUser : styles.badgeGray
                      }`}
                    >
                      {f.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className={styles.td}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button className={styles.editBtn} onClick={() => openEdit(f)}>
                          <Pencil size={13} /> Edit
                        </button>
                        <button className={styles.editBtn} onClick={() => handleToggle(f.id)}>
                          {f.is_active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}{" "}
                          {f.is_active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => setDeleteTarget(f)}
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
          <div className={`${styles.modal} ${styles.modalSm}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editTarget ? (
                  <>
                    <Pencil size={17} /> Edit trivia fact
                  </>
                ) : (
                  <>
                    <PlusCircle size={17} /> New trivia fact
                  </>
                )}
              </h2>
              <button type="button" className={styles.modalClose} onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <label className={styles.fieldLabel}>
                Fact text <span className={styles.required}>*</span>
              </label>
              <textarea
                className={styles.textarea}
                rows={5}
                placeholder="e.g. A resolution generally does not carry the same binding legal weight as an ordinance."
                value={factText}
                onChange={(e) => setFactText(e.target.value)}
              />
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
                disabled={saving || !factText.trim()}
              >
                {saving ? "Saving…" : editTarget ? "Save changes" : "Add fact"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmModal
          type="delete"
          title="Delete this trivia fact?"
          message={`"${deleteTarget.fact_text.slice(0, 80)}${deleteTarget.fact_text.length > 80 ? "…" : ""}" will be permanently removed. This cannot be undone.`}
          confirmLabel={deleting ? "Deleting…" : "Delete"}
          onConfirm={() => !deleting && handleDelete()}
          onCancel={() => !deleting && setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
