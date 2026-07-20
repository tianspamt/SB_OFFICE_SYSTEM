/**
 * OrdinancesPage.jsx — Updated with Review, Approval, and Manual Publishing Workflow
 * ADMIN ONLY — UI only, no backend logic
 * Preserves existing props: ordinances, setDeleteTarget, onEdit
 */

import { useState, useEffect } from "react";
import {
  Search,
  X,
  Filter,
  Eye,
  Pencil,
  Trash2,
  FileText,
  Image,
  CalendarDays,
  Download,
} from "lucide-react";
import styles from "./AdminDashboard.module.css";
import lStyles from "./LegislativeModule.module.css";
import { API } from "./AdminContext";

import {
  TabNavigation,
  SearchBar,
  FilterPanel,
  PendingRecordCard,
  PublishedRecordCard,
  UploadModal,
  CommentPanel,
  EmptyState,
  StatsRow,
  StatusBadge,
  CategoryBadge,
  ReadyTag,
} from "./LegislativeComponents";

// ─── DUMMY DATA ───────────────────────────────────────────────────────────────
// Remove when wiring to backend — replace with props or API calls



const CATEGORIES = [
  "All",
  "Tax",
  "Education",
  "Agriculture",
  "Environment",
  "Public Works",
  "Health",
  "Infrastructure",
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function OrdinancesPage({
  ordinances,
  setDeleteTarget,
  onEdit,
  readOnly = false,
  canPublish = false,
  isViceMayor = false,
}) {
  const [activeTab, setActiveTab] = useState("published");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [pendingOrdinances, setPendingOrdinances] = useState([]);
  const [fetchingPending, setFetchingPending] = useState(false);
  const [comments, setComments] = useState({});
  const [panelItem, setPanelItem] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const getFileUrl = (filepath) =>
    `${SUPABASE_URL}/storage/v1/object/public/assets/${filepath}`;

  // ── Split ordinances by actual status from the backend ─────────────────────
  const publishedOrdinances = ordinances.filter((o) => o.status === "published");
  

  // ── Derive available years from published ordinances ───────────────────────
  const availableYears = [
    ...new Set(publishedOrdinances.map((o) => o.year?.toString()).filter(Boolean)),
  ].sort((a, b) => b - a);

  // ── Filter helpers ──────────────────────────────────────────────────────────

  const filterPublished = (list) =>
    list.filter((o) => {
      const s =
        !search ||
        (o.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (o.ordinance_number || "").toLowerCase().includes(search.toLowerCase());
      const c =
        catFilter === "All" ||
        (o.category || "").toLowerCase() === catFilter.toLowerCase();
      const a =
        !authorFilter ||
        (o.author || "").toLowerCase().includes(authorFilter.toLowerCase());
      const y = yearFilter === "all" || o.year?.toString() === yearFilter;
      return s && c && a && y;
    });

  const filterPending = (list) =>
    list.filter((o) => {
      const s =
        !search ||
        (o.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (o.ordinance_number || "").toLowerCase().includes(search.toLowerCase()) ||
        (o.author || "").toLowerCase().includes(search.toLowerCase());
      const c = catFilter === "All" || o.category === catFilter;
      const a =
        !authorFilter ||
        (o.author || "").toLowerCase().includes(authorFilter.toLowerCase());
      return s && c && a;
    });

  const resetFilters = () => {
    setSearch("");
    setCatFilter("All");
    setDateFilter("");
    setAuthorFilter("");
    setYearFilter("all");
  };
//
  useEffect(() => {
  if (activeTab === "pending" && canPublish) {
    fetchPendingOrdinances();
  }
}, [activeTab]);

const fetchPendingOrdinances = async () => {
  setFetchingPending(true);
  try {
    const res = await fetch(`${API}/api/ordinances?status=pending,ready_to_publish`);
    const data = await res.json();
    setPendingOrdinances(Array.isArray(data) ? data : []);
  } catch {
    setPendingOrdinances([]);
  } finally {
    setFetchingPending(false);
  }
};

  // ── Pending actions ─────────────────────────────────────────────────────────

  const handleApprove = async (id, currentStatus) => {
  const newStatus = isViceMayor ? "ready_to_publish" : "published";
  try {
    const res = await fetch(`${API}/api/ordinances/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (data.success) {
      fetchPendingOrdinances();
    }
  } catch {
    console.error("Failed to update status");
  }
};

  const handleAddComment = (itemId, text) => {
    const now = new Date();
    const time = now.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    setComments((prev) => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), { author: "Admin", text, time }],
    }));
  };

  // ── Pending count for badge ─────────────────────────────────────────────────

  const pendingFiltered = pendingOrdinances.filter((o) => {
  return !search ||
    (o.title || "").toLowerCase().includes(search.toLowerCase()) ||
    (o.ordinance_number || "").toLowerCase().includes(search.toLowerCase());
});
const pendingCount = pendingOrdinances.length;
const publishedFiltered = filterPublished(publishedOrdinances);

  return (
    <>
      <StatsRow
  stats={[
    { value: publishedOrdinances.length, label: "Total Published" },
    { value: pendingCount, label: "Pending Review", colorClass: lStyles.statCardAmber },
  ]}
/>

      {/* TABS */}
      <TabNavigation
  tabs={[
    { id: "published", label: "Published" },
    ...(canPublish ? [{ id: "pending", label: "Pending", badge: pendingCount }] : []),
  ]}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          resetFilters();
        }}
      />

      {/* SEARCH & FILTER */}
      <div className={lStyles.searchFilterBar}>
        <div className={lStyles.searchRow}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by title, category, author..."
          />
        </div>
        <FilterPanel
          categories={CATEGORIES}
          categoryValue={catFilter}
          onCategoryChange={setCatFilter}
          dateValue={dateFilter}
          onDateChange={setDateFilter}
          authorValue={authorFilter}
          onAuthorChange={setAuthorFilter}
          yearValue={yearFilter}
          onYearChange={setYearFilter}
          years={availableYears}
          onReset={resetFilters}
        />
      </div>

      {/* ── PUBLISHED TAB ────────────────────────────────────────────────────── */}
      {activeTab === "published" && (
        <>
          <div className={lStyles.resultCount}>
            Showing {publishedFiltered.length} of {publishedOrdinances.length} ordinances
          </div>
          <div className={lStyles.recordList}>
            {publishedFiltered.length === 0 ? (
              <EmptyState
                title="No published ordinances yet"
                text={
                  search || catFilter !== "All"
                    ? "No records match your filters."
                    : "Approved drafts will appear here after final signed upload."
                }
              />
            ) : (
              publishedFiltered.map((o) => (
                <div key={o.id} className={lStyles.recordCard}>
                  <div
                    className={lStyles.recordIcon}
                    style={{ background: "var(--blue-50)" }}
                  >
                    {o.filetype === "application/pdf" ? (
                      <FileText size={20} strokeWidth={1.2} />
                    ) : (
                      <Image size={20} strokeWidth={1.2} />
                    )}
                  </div>
                  <div className={lStyles.recordBody}>
                    <div className={lStyles.recordCode}>
                      {o.ordinance_number || "—"}
                    </div>
                    <div className={lStyles.recordTitle}>{o.title}</div>
                    <div className={lStyles.recordMeta}>
                      {o.year && (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <CalendarDays size={12} /> {o.year}
                        </span>
                      )}
                      <StatusBadge status={o.status} />
                      {o.officials?.length > 0 && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {o.officials.length} council member
                          {o.officials.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={lStyles.recordActions}>
                   <button
                      className={`${lStyles.btn} ${lStyles.btnSm} ${lStyles.btnInfo}`}
                      onClick={() => setViewTarget(o)}
                    >
                      <Eye size={13} /> View
                    </button>
                    {!readOnly && (
  <>
    <button
      className={`${lStyles.btn} ${lStyles.btnSm}`}
      onClick={() => onEdit(o)}
    >
      <Pencil size={13} /> Edit
    </button>
    <button
      className={`${lStyles.btn} ${lStyles.btnSm} ${lStyles.btnDanger}`}
      onClick={() =>
        setDeleteTarget({
          id: o.id,
          type: "ordinance",
          name: o.title,
        })
      }
    >
      <Trash2 size={13} /> Delete
    </button>
  </>
)}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ── PENDING TAB ──────────────────────────────────────────────────────── */}
      {activeTab === "pending" && (
        <>
          <div className={lStyles.resultCount}>
  Showing {pendingFiltered.length} drafts
</div>
          <div className={lStyles.recordList}>
            {pendingFiltered.length === 0 ? (
              <EmptyState
                title="No pending drafts"
                text="All submitted drafts have been reviewed."
              />
            ) : (
              pendingFiltered.map((item) => (
  <PendingRecordCard
    key={item.id}
    code={item.ordinance_number}
    title={item.title}
    category={item.category}
    author={item.filename}
    submitted={new Date(item.uploaded_at).toLocaleDateString("en-PH")}
    status={item.status}
    onApprove={() => handleApprove(item.id, item.status)}
    onViewDraft={() => setPanelItem(item)}
    onComment={() => setPanelItem(item)}
    isViceMayor={isViceMayor}
  />
))
            )}
          </div>
        </>
      )}

      {/* ── UPLOAD MODAL ─────────────────────────────────────────────────────── */}
      {showUploadModal && (
        <UploadModal
          title="Add Final Ordinance"
          codePrefix="ORD"
          categories={[
            "Tax",
            "Education",
            "Agriculture",
            "Environment",
            "Public Works",
            "Health",
            "Infrastructure",
          ]}
          onClose={() => setShowUploadModal(false)}
          onSubmit={(formData) => {
            // TODO: connect to backend
            console.log("Publish ordinance:", formData);
            setShowUploadModal(false);
          }}
        />
      )}

       {/* ── VIEW ORDINANCE MODAL ─────────────────────────────────────────────── */}
      {viewTarget && (
        <div className={styles.modalOverlay} onClick={() => setViewTarget(null)}>
          <div
            className={`${styles.modal} ${styles.sessionModal}`}
            onClick={(e) => e.stopPropagation()}
            style={{ display: "flex", flexDirection: "column", maxHeight: "90vh", overflow: "hidden" }}
          >
            {/* ── Sticky header ── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
                position: "sticky",
                top: 0,
                zIndex: 2,
              }}
            >
              <h2 className={styles.modalTitle} style={{ margin: 0, fontSize: 18 }}>
                {viewTarget.title}
              </h2>
              <button
                onClick={() => setViewTarget(null)}
                aria-label="Close modal"
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  width: 32,
                  height: 32,
                  minWidth: 32,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#fee2e2";
                  e.currentTarget.style.color = "#dc2626";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                  e.currentTarget.style.color = "#64748b";
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", overscrollBehavior: "contain" }}>
              <div style={{ fontSize: 13, color: "#4a5568", marginBottom: 16, lineHeight: 1.7 }}>
                {viewTarget.ordinance_number && (
                  <div><strong>Ordinance No:</strong> {viewTarget.ordinance_number}</div>
                )}
                {viewTarget.year && <div><strong>Year:</strong> {viewTarget.year}</div>}
                <div>
                  <strong>Uploaded:</strong>{" "}
                  {new Date(viewTarget.uploaded_at).toLocaleDateString("en-PH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>

              {/* ── Read Files ── */}
              {viewTarget.filetype === "application/pdf" && (
                
                <a href={getFileUrl(viewTarget.filepath)}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.confirmBtn}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", marginBottom: 16 }}
                >
                  <FileText size={14} /> Read File (PDF)
                </a>
              )}

              {(viewTarget.filetype === "application/msword" ||
                viewTarget.filetype ===
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document") && (
                
                <a  href={getFileUrl(viewTarget.filepath)}
                  download={viewTarget.filename}
                  className={styles.confirmBtn}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textDecoration: "none", marginBottom: 16, width: "100%" }}
                >
                  <Download size={14} /> Download Word File
                </a>
              )}

              {viewTarget.filetype?.startsWith("image/") && (
                <div style={{ marginBottom: 16 }}>
                  <p className={styles.officialsSelectLabel}>Extracted Text (OCR):</p>
                  <textarea
                    className={styles.textArea}
                    readOnly
                    rows={8}
                    value={viewTarget.extracted_text || "No text could be extracted from this image."}
                  />
                </div>
              )}

              {/* ── Council members with photo ── */}
              {viewTarget.officials?.length > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    padding: "14px 16px",
                    background: "#f8fafc",
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#1a365d",
                      marginBottom: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.4px",
                    }}
                  >
                    Council Members
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {viewTarget.officials.map((m) => (
                      <div
                        key={m.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 10px",
                          background: "#fff",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {m.photo ? (
                          <img
                            src={m.photo}
                            alt={m.full_name}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background: "#e2e8f0",
                              color: "#4a5568",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 700,
                              fontSize: 14,
                              flexShrink: 0,
                            }}
                          >
                            {m.full_name?.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "#1a202c" }}>
                            {m.full_name}
                          </div>
                          <div style={{ fontSize: 11, color: "#718096" }}>{m.position}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Sticky footer ── */}
            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "flex-end",
                padding: "16px 24px 20px",
                borderTop: "1px solid #f1f5f9",
                background: "#fff",
                flexShrink: 0,
                position: "sticky",
                bottom: 0,
                zIndex: 2,
              }}
            >
              <button className={styles.cancelBtn} onClick={() => setViewTarget(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}