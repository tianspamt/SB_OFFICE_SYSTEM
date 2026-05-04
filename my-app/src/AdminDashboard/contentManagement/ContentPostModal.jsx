import { useState } from "react";
import {
  PlusCircle,
  Pencil,
  X,
  Eye,
  EyeOff,
  Pin,
  AlertCircle,
} from "lucide-react";
import styles from "../AdminDashboard.module.css";
import { COPY, DEFAULT_POST_CATEGORY } from "./constants";
import { ImageUploadArea } from "./ImageUploadArea";

const emptyForm = {
  title: "",
  caption: "",
  category: DEFAULT_POST_CATEGORY,
  published: true,
  pinned: false,
};

export function ContentPostModal({
  mode,
  initial,
  onClose,
  onSave,
  saving,
  error,
}) {
  const [form, setForm] = useState(() => ({
    ...emptyForm,
    ...initial,
    category: initial?.category || DEFAULT_POST_CATEGORY,
  }));
  const [images, setImages] = useState(
    initial?.images ? initial.images.map((url) => ({ preview: url })) : []
  );

  const handleSave = () => {
    onSave({
      title: form.title.trim(),
      caption: form.caption.trim(),
      published: form.published,
      pinned: form.pinned,
      category: DEFAULT_POST_CATEGORY,
      images: images.map((img) => img.preview || img),
    });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {mode === "add" ? (
              <>
                <PlusCircle size={17} /> {COPY.newPost}
              </>
            ) : (
              <>
                <Pencil size={17} /> {COPY.editPost}
              </>
            )}
          </h2>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <p
            style={{
              fontSize: 13,
              color: "#64748b",
              margin: "0 0 12px",
              lineHeight: 1.5,
            }}
          >
            {COPY.pagePurpose}
          </p>

          <label className={styles.fieldLabel}>
            {COPY.titleLabel} <span className={styles.required}>*</span>
          </label>
          <input
            className={styles.input}
            placeholder={COPY.titlePlaceholder}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <label className={styles.fieldLabel}>{COPY.captionLabel}</label>
          <textarea
            className={styles.textarea}
            rows={5}
            placeholder={COPY.captionPlaceholder}
            value={form.caption}
            onChange={(e) => setForm({ ...form, caption: e.target.value })}
          />

          <label className={styles.fieldLabel}>{COPY.photosLabel}</label>
          <ImageUploadArea images={images} setImages={setImages} />

          <div className={styles.optionsRow}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) =>
                  setForm({ ...form, published: e.target.checked })
                }
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
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={(e) =>
                  setForm({ ...form, pinned: e.target.checked })
                }
              />
              <span className={styles.toggleText}>
                <Pin size={13} /> Pin to top of homepage
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
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
          >
            {saving
              ? "Saving…"
              : mode === "add"
              ? "Publish"
              : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
