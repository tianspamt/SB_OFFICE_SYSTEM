import { useEffect, useRef, useState } from "react";
import {
  Filter,
  RotateCcw,
  Trash2,
  FileText,
  Gavel,
  BookOpen,
  Users,
  Landmark,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
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

const PAGE_SIZE = 20;
const SKELETON_ROWS = 8;

const rowKey = (row) => `${row.source}-${row.id}`;

const restoreEndpoint = (row) => {
  if (row.source === "user") return `${API}/api/users/${row.id}/restore`;
  if (row.source === "official") return `${API}/api/sb-council-members/${row.id}/restore`;
  return `${API}/api/archives/${row.id}/restore`;
};

export default function ArchivesPage() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [moduleFilter, setModuleFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("desc"); // by archived_at
  const [selected, setSelected] = useState(() => new Set());
  const [confirmTarget, setConfirmTarget] = useState(null); // { row, action: "restore" | "delete" }
  const [bulkAction, setBulkAction] = useState(null); // "restore" | "delete" | null
  const [processing, setProcessing] = useState(false);
  const { toasts, showMsg, dismissToast } = useToasts();
  const selectAllRef = useRef(null);

  // Debounce the search box so typing doesn't fire a request per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Any change to the filter, search, or sort invalidates the current page
  // and whatever was selected on it.
  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [moduleFilter, search, sort]);

  // Selection is page-scoped — moving pages clears it too.
  useEffect(() => {
    setSelected(new Set());
  }, [page]);

  const fetchArchives = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        module: moduleFilter,
        page: String(page),
        limit: String(PAGE_SIZE),
        sort,
      });
      if (search) params.set("search", search);
      const res = await authFetch(`${API}/api/archives?${params.toString()}`);
      const data = await res.json();
      setRows(Array.isArray(data?.rows) ? data.rows : []);
      setTotal(data?.total || 0);
      setTotalPages(data?.totalPages || 1);
    } catch {
      setRows([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchives();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleFilter, search, page, sort]);

  useEffect(() => {
    if (!selectAllRef.current) return;
    const selectedOnPage = rows.filter((r) => selected.has(rowKey(r))).length;
    selectAllRef.current.indeterminate = selectedOnPage > 0 && selectedOnPage < rows.length;
  }, [selected, rows]);

  const toggleSort = () => setSort((s) => (s === "desc" ? "asc" : "desc"));

  const toggleRow = (row) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const key = rowKey(row);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const allSelected = rows.length > 0 && rows.every((r) => prev.has(rowKey(r)));
      if (allSelected) return new Set();
      return new Set(rows.map(rowKey));
    });
  };

  const selectedRows = rows.filter((r) => selected.has(rowKey(r)));
  const selectedDeletable = selectedRows.filter((r) => r.source === "content");

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

  // Bulk actions dispatch the same per-row endpoints in parallel (each one
  // is already its own atomic operation server-side — see archives.js /
  // migrations/007) and report how many succeeded vs failed, rather than
  // introducing a separate all-or-nothing bulk endpoint.
  const handleBulkRestore = async () => {
    setProcessing(true);
    try {
      const results = await Promise.allSettled(
        selectedRows.map((row) => authFetch(restoreEndpoint(row), { method: "PUT" }).then((r) => r.json()))
      );
      const succeeded = results.filter((r) => r.status === "fulfilled" && r.value?.success).length;
      const failed = results.length - succeeded;
      showMsg(
        failed === 0 ? `${succeeded} record${succeeded !== 1 ? "s" : ""} restored.` : `${succeeded} restored, ${failed} failed.`,
        failed === 0 ? "success" : "error"
      );
      setSelected(new Set());
      fetchArchives();
    } finally {
      setProcessing(false);
      setBulkAction(null);
    }
  };

  const handleBulkDelete = async () => {
    setProcessing(true);
    try {
      const results = await Promise.allSettled(
        selectedDeletable.map((row) => authFetch(`${API}/api/archives/${row.id}`, { method: "DELETE" }).then((r) => r.json()))
      );
      const succeeded = results.filter((r) => r.status === "fulfilled" && r.value?.success).length;
      const failed = results.length - succeeded;
      showMsg(
        failed === 0 ? `${succeeded} record${succeeded !== 1 ? "s" : ""} permanently deleted.` : `${succeeded} deleted, ${failed} failed.`,
        failed === 0 ? "success" : "error"
      );
      setSelected(new Set());
      fetchArchives();
    } finally {
      setProcessing(false);
      setBulkAction(null);
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className={styles.searchFilterBar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search by title, number, or name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              type="button"
              className={styles.searchClear}
              onClick={() => setSearchInput("")}
            >
              <X size={13} />
            </button>
          )}
        </div>

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

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div className={styles.searchResultCount} style={{ marginBottom: 0 }}>
          Showing {rows.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
          {rows.length > 0 ? `-${(page - 1) * PAGE_SIZE + rows.length}` : ""} of {total} archived record{total !== 1 ? "s" : ""}
        </div>

        {selected.size > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "6px 10px" }}>
            <span style={{ fontSize: 13, color: "#166534", fontWeight: 600 }}>{selected.size} selected</span>
            <button
              className={styles.addBtn}
              style={{ padding: "5px 10px", fontSize: 12 }}
              onClick={() => setBulkAction("restore")}
            >
              <RotateCcw size={12} /> Restore Selected
            </button>
            {selectedDeletable.length > 0 && (
              <button
                className={styles.deleteBtn}
                style={{ padding: "5px 10px", fontSize: 12 }}
                onClick={() => setBulkAction("delete")}
              >
                <Trash2 size={12} /> Delete Permanently ({selectedDeletable.length})
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                {["", "Type", "Title / Name", "Archived", "Archived By", "Actions"].map((h) => (
                  <th key={h} className={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <tr key={i} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  {[16, 90, 220, 90, 110, 140].map((w, j) => (
                    <td key={j} className={styles.td}>
                      <div className={styles.skeleton} style={{ height: 14, width: w, borderRadius: 4 }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    checked={rows.length > 0 && rows.every((r) => selected.has(rowKey(r)))}
                    onChange={toggleSelectAll}
                    disabled={rows.length === 0}
                  />
                </th>
                <th className={styles.th}>Type</th>
                <th className={styles.th}>Title / Name</th>
                <th
                  className={styles.th}
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={toggleSort}
                  title={sort === "asc" ? "Sorted oldest first — click to sort newest first" : "Sorted newest first — click to sort oldest first"}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    Archived
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 2,
                      background: "#fff", color: "#009439", fontWeight: 700, fontSize: 10.5,
                      textTransform: "none", borderRadius: 20, padding: "2px 7px",
                    }}>
                      {sort === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      {sort === "asc" ? "Oldest first" : "Newest first"}
                    </span>
                  </span>
                </th>
                <th className={styles.th}>Archived By</th>
                <th className={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={6} className={styles.empty}>No archived records.</td></tr>
              )}
              {rows.map((row, i) => {
                const Icon = ENTITY_ICONS[row.entity_type] || FileText;
                const key = rowKey(row);
                return (
                  <tr key={key} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                    <td className={styles.td}>
                      <input
                        type="checkbox"
                        checked={selected.has(key)}
                        onChange={() => toggleRow(row)}
                      />
                    </td>
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

          {totalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "14px 0" }}>
              <button
                className={styles.addBtn}
                style={{ padding: "6px 10px", fontSize: 12, opacity: page <= 1 ? 0.5 : 1, cursor: page <= 1 ? "not-allowed" : "pointer" }}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <span style={{ fontSize: 13, color: "#64748b" }}>Page {page} of {totalPages}</span>
              <button
                className={styles.addBtn}
                style={{ padding: "6px 10px", fontSize: 12, opacity: page >= totalPages ? 0.5 : 1, cursor: page >= totalPages ? "not-allowed" : "pointer" }}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      )}

      {confirmTarget?.action === "restore" && (
        <ConfirmModal
          type="info"
          title={`Restore this ${(ENTITY_LABELS[confirmTarget.row.entity_type] || "record").toLowerCase()}?`}
          message={`"${confirmTarget.row.title || "This record"}" will be moved back to its active list.`}
          confirmLabel="Restore"
          loading={processing}
          onConfirm={() => handleRestore(confirmTarget.row)}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
      {confirmTarget?.action === "delete" && (
        <ConfirmModal
          type="delete"
          title="Permanently delete this record?"
          message={`"${confirmTarget.row.title || "This record"}" and its stored file will be permanently removed. This cannot be undone.`}
          confirmLabel="Delete Forever"
          loading={processing}
          onConfirm={() => handlePermanentDelete(confirmTarget.row)}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      {bulkAction === "restore" && (
        <ConfirmModal
          type="info"
          title={`Restore ${selectedRows.length} record${selectedRows.length !== 1 ? "s" : ""}?`}
          message="They will be moved back to their active lists."
          confirmLabel="Restore All"
          loading={processing}
          onConfirm={handleBulkRestore}
          onCancel={() => setBulkAction(null)}
        />
      )}
      {bulkAction === "delete" && (
        <ConfirmModal
          type="delete"
          title={`Permanently delete ${selectedDeletable.length} record${selectedDeletable.length !== 1 ? "s" : ""}?`}
          message={
            selectedDeletable.length < selectedRows.length
              ? `${selectedRows.length - selectedDeletable.length} of your selected record(s) can't be permanently deleted (users/officials) and will be skipped. This cannot be undone for the rest.`
              : "This cannot be undone."
          }
          confirmLabel="Delete Forever"
          loading={processing}
          onConfirm={handleBulkDelete}
          onCancel={() => setBulkAction(null)}
        />
      )}
    </>
  );
}
