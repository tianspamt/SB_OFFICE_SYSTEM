import { AlertCircle, CalendarDays, Upload, CheckSquare } from "lucide-react";
import { COLOR_SWATCHES } from "./AdminContext";

// ─── Term Status Badge ────────────────────────────────────────────────────────
export const TermStatusBadge = ({ status }) => {
  if (!status) return null;
  const isActive = status === "active";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: isActive ? "#d1fae5" : "#f3f4f6",
      color: isActive ? "#065f46" : "#6b7280",
      border: `1px solid ${isActive ? "#6ee7b7" : "#d1d5db"}`,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: isActive ? "#10b981" : "#9ca3af",
        display: "inline-block",
      }} />
      {isActive ? "Active" : "Term Ended"}
    </span>
  );
};

// ─── Modal Alert ──────────────────────────────────────────────────────────────
export const ModalAlert = ({ message, type }) => message ? (
  <div style={{
    display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
    borderRadius: 8, marginBottom: 14, fontSize: 13,
    background: type === "error" ? "#fff5f5" : "#f0fff4",
    border: `1px solid ${type === "error" ? "#feb2b2" : "#9ae6b4"}`,
    color: type === "error" ? "#c53030" : "#276749",
  }}>
    <AlertCircle size={14} />{message}
  </div>
) : null;

// ─── Term Form Fields ─────────────────────────────────────────────────────────
export const TermFormFields = ({ form, setForm, styles }) => (
  <>
    <label className={styles.fieldLabel}>Term Period <span style={{ color: "#e53e3e" }}>*</span></label>
    <input className={styles.input} placeholder="e.g. 2022–2025" value={form.term_period}
      onChange={(e) => setForm({ ...form, term_period: e.target.value })} />
    <div style={{ display: "flex", gap: 10 }}>
      <div style={{ flex: 1 }}>
        <label className={styles.fieldLabel}>Start Date <span style={{ color: "#e53e3e" }}>*</span></label>
        <input className={styles.input} type="date" value={form.term_start}
          onChange={(e) => setForm({ ...form, term_start: e.target.value })} />
      </div>
      <div style={{ flex: 1 }}>
        <label className={styles.fieldLabel}>End Date <span className={styles.fieldHint}>(leave blank if serving)</span></label>
        <input className={styles.input} type="date" value={form.term_end}
          onChange={(e) => setForm({ ...form, term_end: e.target.value })} />
      </div>
    </div>
    <label className={styles.fieldLabel}>Status</label>
    <select className={styles.input} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
      <option value="active">Active</option>
      <option value="terms_ended">Term Ended</option>
    </select>
    <label className={styles.fieldLabel} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", marginTop: 4 }}>
      <input type="checkbox" checked={form.is_reelected} onChange={(e) => setForm({ ...form, is_reelected: e.target.checked })} />
      {" "}Re-elected for this term
    </label>
    <label className={styles.fieldLabel} style={{ marginTop: 8 }}>Notes <span className={styles.fieldHint}>(optional)</span></label>
    <textarea className={styles.textArea} rows={2} placeholder="Optional notes…" value={form.notes}
      onChange={(e) => setForm({ ...form, notes: e.target.value })} />
  </>
);

// ─── Officials Check List ─────────────────────────────────────────────────────
export const OfficialsCheckList = ({ officials, selected, onToggle, styles }) => (
  <div className={styles.officialsCheckList}>
    {officials.length === 0 && <p className={styles.fileHint}>No council members yet.</p>}
    {officials.map((o) => (
      <label key={o.id} className={`${styles.checkItem} ${selected.includes(o.id) ? styles.checkItemSelected : ""}`}>
        <input type="checkbox" checked={selected.includes(o.id)} onChange={() => onToggle(o.id)} />
        {o.photo
          ? <img src={o.photo} alt={o.full_name} className={styles.checkPhoto} />
          : <div className={styles.checkAvatar}>{o.full_name.charAt(0)}</div>}
        <div>
          <div style={{ fontWeight: "600", fontSize: "13px" }}>{o.full_name}</div>
          <div style={{ fontSize: "11px", color: "#718096" }}>{o.position}</div>
        </div>
      </label>
    ))}
  </div>
);

// ─── Event Form Fields ────────────────────────────────────────────────────────
export const EventFormFields = ({ form, setForm, styles }) => (
  <>
    <label className={styles.fieldLabel}>Title <span style={{ color: "#e53e3e" }}>*</span></label>
    <input className={styles.input} placeholder="Event title..." value={form.title}
      onChange={(e) => setForm({ ...form, title: e.target.value })} />
    <label className={styles.fieldLabel} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", marginTop: 8 }}>
      <input type="checkbox" checked={form.all_day} onChange={(e) => setForm({ ...form, all_day: e.target.checked })} />
      {" "}All-day event
    </label>
    <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
      <div style={{ flex: 1 }}>
        <label className={styles.fieldLabel}>Start Date <span style={{ color: "#e53e3e" }}>*</span></label>
        <input className={styles.input} type="date" value={form.start_date}
          onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
      </div>
      {!form.all_day && (
        <div style={{ flex: 1 }}>
          <label className={styles.fieldLabel}>Start Time</label>
          <input className={styles.input} type="time" value={form.start_time}
            onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
        </div>
      )}
    </div>
    <div style={{ display: "flex", gap: 10 }}>
      <div style={{ flex: 1 }}>
        <label className={styles.fieldLabel}>End Date</label>
        <input className={styles.input} type="date" value={form.end_date}
          onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
      </div>
      {!form.all_day && (
        <div style={{ flex: 1 }}>
          <label className={styles.fieldLabel}>End Time</label>
          <input className={styles.input} type="time" value={form.end_time}
            onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
        </div>
      )}
    </div>
    <label className={styles.fieldLabel}>Location</label>
    <input className={styles.input} placeholder="Location (optional)" value={form.location}
      onChange={(e) => setForm({ ...form, location: e.target.value })} />
    <label className={styles.fieldLabel}>Description</label>
    <textarea className={styles.textArea} placeholder="Description (optional)" rows={3}
      value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
    <label className={styles.fieldLabel}>Event Color</label>
    <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
      {COLOR_SWATCHES.map((c) => (
        <button key={c} onClick={() => setForm({ ...form, color: c })} style={{
          width: 28, height: 28, borderRadius: "50%", background: c, border: "none",
          cursor: "pointer", outline: form.color === c ? "3px solid #0f172a" : "none", outlineOffset: 2,
        }} />
      ))}
    </div>
  </>
);
