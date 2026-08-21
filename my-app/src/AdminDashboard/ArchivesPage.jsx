import { useEffect, useState } from "react";
import {
  Filter,
  RotateCcw,
  Trash2,
  FileText,
  Gavel,
  BookOpen,
  Users,
  Landmark,
} from "lucide-react";
import styles from "./AdminDashboard.module.css";
import ConfirmModal from "./ConfirmModal";
import { ToastContainer } from "./Toast";
import { useToasts } from "./useToasts";
import { API, authFetch } from "./AdminContext";

const MODULE_OPTIONS = [
  { value: "all", label: "All Modules" },
  { value: "ordinance", label: "Ordinances" },
  { value: "resolution", label: "Resolutions" },
  { value: "session_minutes", label: "Session Minutes" },
  { value: "user", label: "Users" },
  { value: "official", label: "Officials" },
];

const ENTITY_LABELS = {
  ordinance: "Ordinance",
  resolution: "Resolution",
  session_minutes: "Session Minutes",
  user: "User",
  official: "Official",
};

const ENTITY_ICONS = {
  ordinance: FileText,
  resolution: Gavel,
  session_minutes: BookOpen,
  user: Users,
  official: Landmark,
};

const restoreEndpoint = (row) => {
  if (row.source === "user") return `${API}/api/users/${row.id}/restore`;
  if (row.source === "official") return `${API}/api/sb-council-members/${row.id}/restore`;
  return `${API}/api/archives/${row.id}/restore`;
};

export default function ArchivesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [moduleFilter, setModuleFilter] = useState("all");
  const [confirmTarget, setConfirmTarget] = useState(null); // { row, action: "restore" | "delete" }
  const [processing, setProcessing] = useState(false);
  const { toasts, showMsg, dismissToast } = useToasts();

  const fetchArchives = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API}/api/archives?module=${moduleFilter}`);
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleFilter]);

  const handleRestore = async (row) => {
    setProcessing(true);
    try {
      const res = await authFetch(restoreEndpoint(row), { method: "PUT" });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg(`"${row.title || ENTITY_LABELS[row.entity_type]}" restored.`);
        fetchArchives();
      } else showMsg(data.error || "Restore failed.", "error");
    } catch {
      showMsg("Server error.", "error");
    } finally {
      setProcessing(false);
      setConfirmTarget(null);
    }
  };

  const handlePermanentDelete = async (row) => {
    setProcessing(true);
    try {
      const res = await authFetch(`${API}/api/archives/${row.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        showMsg("Permanently deleted.");
        fetchArchives();
      } else showMsg(data.error || "Delete failed.", "error");
    } catch {
      showMsg("Server error.", "error");
    } finally {
      setProcessing(false);
      setConfirmTarget(null);
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className={styles.searchFilterBar}>
        <div className={styles.filterGroup}>
          <Filter size={15} className={styles.filterIcon} />
          <select
            className={styles.filterSelect}
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
          >
            {MODULE_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.searchResultCount}>
        Showing {rows.length} archived record{rows.length !== 1 ? "s" : ""}
      </div>

      {loading ? (
        <div className={styles.loadingBar}>Loading archives...</div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                {["Type", "Title / Name", "Archived", "Archived By", "Actions"].map((h) => (
                  <th key={h} className={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={5} className={styles.empty}>No archived records.</td></tr>
              )}
              {rows.map((row, i) => {
                const Icon = ENTITY_ICONS[row.entity_type] || FileText;
                return (
                  <tr key={`${row.source}-${row.id}`} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                    <td className={styles.td}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                        <Icon size={14} /> {ENTITY_LABELS[row.entity_type] || row.entity_type}
                      </span>
                    </td>
                    <td className={styles.td}>{row.title || "—"}</td>
                    <td className={styles.td} style={{ color: "#64748b", fontSize: 12 }}>
                      {row.archived_at
                        ? new Date(row.archived_at).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" })
                        : "—"}
                    </td>
                    <td className={styles.td} style={{ color: "#64748b", fontSize: 12 }}>
                      {row.archived_by_name || "—"}
                    </td>
                    <td className={styles.td}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          className={styles.addBtn}
                          style={{ padding: "6px 10px", fontSize: 12 }}
                          onClick={() => setConfirmTarget({ row, action: "restore" })}
                        >
                          <RotateCcw size={13} /> Restore
                        </button>
                        {row.source === "content" && (
                          <button
                            className={styles.deleteBtn}
                            onClick={() => setConfirmTarget({ row, action: "delete" })}
                          >
                            <Trash2 size={13} /> Delete Permanently
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {confirmTarget?.action === "restore" && (
        <ConfirmModal
          type="info"
          title={`Restore this ${(ENTITY_LABELS[confirmTarget.row.entity_type] || "record").toLowerCase()}?`}
          message={`"${confirmTarget.row.title || "This record"}" will be moved back to its active list.`}
          confirmLabel="Restore"
          onConfirm={() => !processing && handleRestore(confirmTarget.row)}
          onCancel={() => !processing && setConfirmTarget(null)}
        />
      )}
      {confirmTarget?.action === "delete" && (
        <ConfirmModal
          type="delete"
          title="Permanently delete this record?"
          message={`"${confirmTarget.row.title || "This record"}" and its stored file will be permanently removed. This cannot be undone.`}
          confirmLabel="Delete Forever"
          onConfirm={() => !processing && handlePermanentDelete(confirmTarget.row)}
          onCancel={() => !processing && setConfirmTarget(null)}
        />
      )}
    </>
  );
}
