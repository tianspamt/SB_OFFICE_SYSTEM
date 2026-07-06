/**
 * LegislativeComponents.jsx
 * Reusable components for the Legislative Records Module
 * UI ONLY — ready for backend integration
 */

import { useState } from "react";
import { Search, Filter, X, Upload, Send } from "lucide-react";
import styles from "./LegislativeModule.module.css";

// ─── STATUS BADGE ────────────────────────────────────────────────────────────

export function StatusBadge({ status }) {
  const map = {
  pending: { label: "● Pending Review", cls: styles.statusPending },
  ready_to_publish: { label: "Ready to Publish", cls: styles.statusApproved },
  published: { label: "● Published", cls: styles.statusPublished },
};
  const s = map[status] || map.pending;
  return <span className={`${styles.statusBadge} ${s.cls}`}>{s.label}</span>;
}

// ─── CATEGORY BADGE ───────────────────────────────────────────────────────────

export function CategoryBadge({ category }) {
  if (!category) return null;
  return <span className={styles.categoryBadge}>{category}</span>;
}

// ─── READY TAG ────────────────────────────────────────────────────────────────

export function ReadyTag() {
  return <span className={styles.readyTag}>Ready for Final Upload</span>;
}

// ─── TAB NAVIGATION ──────────────────────────────────────────────────────────

export function TabNavigation({ tabs, activeTab, onTabChange }) {
  return (
    <div className={styles.tabRow}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.tabBtn} ${
            activeTab === tab.id ? styles.tabBtnActive : ""
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
          {tab.badge > 0 && (
            <span className={styles.tabBadge}>{tab.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── SEARCH BAR ──────────────────────────────────────────────────────────────

export function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className={styles.searchInputWrap}>
      <Search size={14} className={styles.searchIcon} />
      <input
        className={styles.searchInput}
        type="text"
        placeholder={placeholder || "Search..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button className={styles.searchClear} onClick={() => onChange("")}>
          <X size={13} />
        </button>
      )}
    </div>
  );
}

// ─── FILTER PANEL ────────────────────────────────────────────────────────────

export function FilterPanel({
  categories,
  categoryValue,
  onCategoryChange,
  dateValue,
  onDateChange,
  authorValue,
  onAuthorChange,
  yearValue,
  onYearChange,
  years,
  onReset,
}) {
  return (
    <div className={styles.filterRow}>
      <Filter size={14} className={styles.filterIcon} />

      {categories && (
        <>
          <span className={styles.filterLabel}>Category:</span>
          <select
            className={styles.filterSelect}
            value={categoryValue}
            onChange={(e) => onCategoryChange(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </>
      )}

      {onYearChange && (
        <>
          <span className={styles.filterLabel}>Year:</span>
          <select
            className={styles.filterSelect}
            value={yearValue || "all"}
            onChange={(e) => onYearChange(e.target.value)}
          >
            <option value="all">All Years</option>
            {(years || []).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </>
      )}

      <span className={styles.filterLabel}>Date:</span>
      <input
        className={styles.filterDate}
        type="date"
        value={dateValue}
        onChange={(e) => onDateChange(e.target.value)}
      />

      {onAuthorChange && (
        <>
          <span className={styles.filterLabel}>Author:</span>
          <input
            className={styles.filterDate}
            type="text"
            placeholder="Search author..."
            value={authorValue}
            onChange={(e) => onAuthorChange(e.target.value)}
            style={{ width: 140 }}
          />
        </>
      )}

      <div className={styles.filterActions}>
        <button className={`${styles.btn} ${styles.btnSm}`} onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}

// ─── DROPDOWN SELECT ─────────────────────────────────────────────────────────

export function DropdownSelect({ options, value, onChange, label }) {
  return (
    <div className={styles.formGroup}>
      {label && <label className={styles.formLabel}>{label}</label>}
      <select
        className={styles.formInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value || o} value={o.value || o}>
            {o.label || o}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── ACTION BUTTONS ───────────────────────────────────────────────────────────

export function ActionButtons({
  status,
  onApprove,
  onViewDraft,
  onComment,
  isViceMayor = false,
}) {
  return (
    <div className={styles.recordActions}>
      <button
        className={`${styles.btn} ${styles.btnSm} ${styles.btnInfo}`}
        onClick={onViewDraft}
      >
        View Draft
      </button>

      {isViceMayor ? (
        status === "pending" && (
          <button
            className={`${styles.btn} ${styles.btnSm} ${styles.btnSuccess}`}
            onClick={onApprove}
          >
            Mark Ready
          </button>
        )
      ) : (
        status === "ready_to_publish" && (
          <button
            className={`${styles.btn} ${styles.btnSm} ${styles.btnSuccess}`}
            onClick={onApprove}
          >
            ✅ Publish
          </button>
        )
      )}

      {!isViceMayor && (
        <button className={`${styles.btn} ${styles.btnSm}`} onClick={onComment}>
          💬 Comment
        </button>
      )}
    </div>
  );
}

// ─── RECORD CARD (Pending) ────────────────────────────────────────────────────

export function PendingRecordCard({
  code,
  title,
  category,
  author,
  submitted,
  status,
  onApprove,
  onReject,
  onViewDraft,
  onComment,
  isViceMayor = false,
}) {
  const isApproved = status === "approved";
  return (
    <div
      className={`${styles.recordCard} ${
        isApproved ? styles.recordCardHighlight : ""
      }`}
    >
      <div className={styles.recordIcon}>
        {status === "approved" ? "📄" : status === "rejected" ? "📋" : "📝"}
      </div>
      <div className={styles.recordBody}>
        {code && <div className={styles.recordCode}>{code}</div>}
        <div className={styles.recordTitle}>{title}</div>
        <div className={styles.recordMeta}>
          {category && <CategoryBadge category={category} />}
          <span>{author}</span>
          {submitted && <span>Submitted: {submitted}</span>}
          <StatusBadge status={status} />
          {isApproved && <ReadyTag />}
        </div>
      </div>
      <ActionButtons
  status={status}
  onApprove={onApprove}
  onReject={onReject}
  onViewDraft={onViewDraft}
  onComment={onComment}
  isViceMayor={isViceMayor}
/>
    </div>
  );
}

// ─── RECORD CARD (Published) ──────────────────────────────────────────────────

export function PublishedRecordCard({
  code,
  title,
  category,
  author,
  date,
  onView,
  onDownload,
}) {
  return (
    <div className={styles.recordCard}>
      <div
        className={styles.recordIcon}
        style={{ background: "var(--blue-50)" }}
      >
        📄
      </div>
      <div className={styles.recordBody}>
        {code && <div className={styles.recordCode}>{code}</div>}
        <div className={styles.recordTitle}>{title}</div>
        <div className={styles.recordMeta}>
          {category && <CategoryBadge category={category} />}
          <span>{author}</span>
          <span>Published: {date}</span>
          <StatusBadge status="published" />
        </div>
      </div>
      <div className={styles.recordActions}>
        <button
          className={`${styles.btn} ${styles.btnSm} ${styles.btnInfo}`}
          onClick={onView}
        >
          View
        </button>
        <button
          className={`${styles.btn} ${styles.btnSm}`}
          onClick={onDownload}
        >
          ↓ Download
        </button>
      </div>
    </div>
  );
}

// ─── UPLOAD MODAL ─────────────────────────────────────────────────────────────

export function UploadModal({
  title,
  codePrefix,
  categories,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState({
    title: "",
    category: categories?.[0] || "",
    code: codePrefix ? `${codePrefix}-2026-XXX-001` : "",
    author: "",
    coauthor: "",
    date: "",
    notes: "",
    description: "",
    file: null,
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>{title}</span>
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Title</label>
          <input
            className={styles.formInput}
            type="text"
            placeholder="Enter title..."
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </div>

        {categories && (
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Category</label>
              <select
                className={styles.formInput}
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Codification Code</label>
              <input
                className={styles.formInput}
                type="text"
                placeholder={codePrefix ? `${codePrefix}-2026-XXX-001` : ""}
                value={form.code}
                onChange={(e) => set("code", e.target.value)}
              />
            </div>
          </div>
        )}

        {categories && (
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Author</label>
              <input
                className={styles.formInput}
                type="text"
                placeholder="Council member name..."
                value={form.author}
                onChange={(e) => set("author", e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Co-Author</label>
              <input
                className={styles.formInput}
                type="text"
                placeholder="Optional..."
                value={form.coauthor}
                onChange={(e) => set("coauthor", e.target.value)}
              />
            </div>
          </div>
        )}

        {!categories && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Description</label>
            <input
              className={styles.formInput}
              type="text"
              placeholder="Brief description..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
        )}

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Date Published</label>
          <input
            className={styles.formInput}
            type="date"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Upload Final File</label>
          <div
            className={styles.uploadZone}
            onClick={() => document.getElementById("fileUpload")?.click()}
          >
            <div className={styles.uploadIcon}>📎</div>
            <div className={styles.uploadText}>
              {form.file
                ? form.file.name
                : "Click to upload signed final document"}
              <br />
              <span style={{ fontSize: 11, opacity: 0.7 }}>
                PDF or DOC accepted
              </span>
            </div>
            <input
              id="fileUpload"
              type="file"
              accept=".pdf,.doc,.docx"
              style={{ display: "none" }}
              onChange={(e) => set("file", e.target.files?.[0] || null)}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Notes (optional)</label>
          <input
            className={styles.formInput}
            type="text"
            placeholder="Internal notes..."
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btn} onClick={onClose}>
            Cancel
          </button>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={() => onSubmit(form)}
          >
            Publish Record
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── COMMENT PANEL ────────────────────────────────────────────────────────────

export function CommentPanel({ item, comments, onClose, onAddComment }) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    onAddComment(text.trim());
    setText("");
  };

  return (
    <>
      <div className={styles.sideOverlay} onClick={onClose} />
      <div className={styles.sidePanel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>Draft Review</span>
          <button className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.panelBody}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
            {item?.title}
          </div>
          {item?.code && <div className={styles.recordCode}>{item.code}</div>}

          <div className={styles.previewBox}>
            <Upload size={24} style={{ opacity: 0.3 }} />
            <span
              style={{ fontSize: 13, color: "var(--color-text-secondary)" }}
            >
              File preview placeholder
            </span>
            <span style={{ fontSize: 11, opacity: 0.6 }}>
              PDF/DOC viewer would appear here
            </span>
          </div>

          <div className={styles.commentsLabel}>Comments</div>

          <div className={styles.commentsThread}>
            {comments.length === 0 ? (
              <div
                style={{
                  fontSize: 13,
                  color: "var(--color-text-secondary)",
                  textAlign: "center",
                  padding: "1rem",
                }}
              >
                No comments yet
              </div>
            ) : (
              comments.map((c, i) => (
                <div key={i} className={styles.comment}>
                  <div className={styles.commentMeta}>
                    <span className={styles.commentAuthor}>{c.author}</span>
                    <span>{c.time}</span>
                  </div>
                  <div className={styles.commentText}>{c.text}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.commentInputRow}>
          <textarea
            className={styles.commentInput}
            rows={2}
            placeholder="Add a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button
            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
            onClick={handleSend}
            style={{ alignSelf: "flex-end" }}
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

export function EmptyState({ icon = "📭", title, text }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>{icon}</div>
      <div className={styles.emptyTitle}>{title}</div>
      {text && <div className={styles.emptyText}>{text}</div>}
    </div>
  );
}

// ─── STATS ROW ────────────────────────────────────────────────────────────────

export function StatsRow({ stats }) {
  return (
    <div className={styles.statsRow}>
      {stats.map((s, i) => (
        <div key={i} className={`${styles.statCard} ${s.colorClass || ""}`}>
          <div className={styles.statNum}>{s.value}</div>
          <div className={styles.statLbl}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}
