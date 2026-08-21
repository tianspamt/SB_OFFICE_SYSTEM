import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import styles from "../AdminDashboard.module.css";
import { MAX_IMAGES_PER_POST } from "./constants";

// Each entry in `images` is either:
//   { isNew: true, file, preview }   — a freshly picked file, not uploaded yet
//   { isNew: false, url, path }      — an already-stored image (kept as-is
//                                      unless removed; on removal the parent
//                                      deletes it from Storage on save)
export function ImageUploadArea({ images, setImages }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = (files) => {
    const valid = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, MAX_IMAGES_PER_POST - images.length);
    const newEntries = valid.map((file) => ({
      isNew: true,
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newEntries].slice(0, MAX_IMAGES_PER_POST));
  };

  const removeImage = (idx) => {
    setImages((prev) => {
      const target = prev[idx];
      if (target?.isNew && target.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  return (
    <div className={styles.uploadSection}>
      <div
        className={`${styles.dropzone} ${
          dragging ? styles.dropzoneDragging : ""
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
      >
        <Upload size={22} strokeWidth={1.5} />
        <span>Click or drag photos here</span>
        <span className={styles.dropzoneHint}>
          Up to {MAX_IMAGES_PER_POST} images · JPG, PNG, WEBP
        </span>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {images.length > 0 && (
        <div className={styles.imageGrid}>
          {images.map((img, i) => (
            <div key={i} className={styles.imageThumb}>
              <img src={img.isNew ? img.preview : img.url} alt={`upload-${i}`} />
              <button
                type="button"
                className={styles.removeImg}
                onClick={() => removeImage(i)}
              >
                <X size={11} />
              </button>
              {i === 0 && <span className={styles.coverLabel}>Cover</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
