import { Trash2 } from "lucide-react";
import styles from "../AdminDashboard.module.css";
import { COPY } from "./constants";

export function DeleteContentPostModal({ post, onCancel, onConfirm, deleting }) {
  return (
    <div className={styles.modalOverlay}>
      <div className={`${styles.modal} ${styles.modalSm}`}>
        <div className={styles.deleteIcon}>
          <Trash2 size={28} strokeWidth={1.5} />
        </div>
        <h3 className={styles.deleteTitle}>Delete this activity?</h3>
        <p className={styles.deleteSub}>
          <strong>{post.title}</strong> — {COPY.deleteConfirmIntro}. This cannot
          be undone.
        </p>
        <div className={styles.modalFooter}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
