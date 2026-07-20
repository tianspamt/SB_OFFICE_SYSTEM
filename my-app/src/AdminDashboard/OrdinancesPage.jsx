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
  ExternalLink,
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
  const [pdfError, setPdfError] = useState(false);

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
                      onClick={() => { setPdfError(false); setViewTarget(o); }}
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
        <div className={lStyles.viewModalOverlay} onClick={() => setViewTarget(null)}>
          <div
            className={lStyles.viewModal}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Green gradient header ── */}
            <div className={lStyles.viewModalHeader}>
              <div className={lStyles.viewModalHeaderTop}>
                <div className={lStyles.viewModalHeaderInfo}>
                  {viewTarget.ordinance_number && (
                    <div className={lStyles.viewModalOrdNumber}>
                      <FileText size={12} />
                      {viewTarget.ordinance_number}
                    </div>
                  )}
                  <h2 className={lStyles.viewModalTitle}>{viewTarget.title}</h2>
                </div>
                <button
                  className={lStyles.viewModalCloseBtn}
                  onClick={() => setViewTarget(null)}
                  aria-label="Close modal"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* ── Scrollable body ── */}
            <div className={lStyles.viewModalBody}>
              {/* ── Metadata cards ── */}
              <div className={lStyles.viewModalMeta}>
                {viewTarget.year && (
                  <div className={lStyles.viewModalMetaItem}>
                    <div className={`${lStyles.viewModalMetaIcon} ${lStyles.viewModalMetaIconBlue}`}>
                      <CalendarDays size={16} />
                    </div>
                    <div>
                      <div className={lStyles.viewModalMetaLabel}>Year</div>
                      <div className={lStyles.viewModalMetaValue}>{viewTarget.year}</div>
                    </div>
                  </div>
                )}
                <div className={lStyles.viewModalMetaItem}>
                  <div className={`${lStyles.viewModalMetaIcon} ${lStyles.viewModalMetaIconGreen}`}>
                    <CalendarDays size={16} />
                  </div>
                  <div>
                    <div className={lStyles.viewModalMetaLabel}>Uploaded</div>
                    <div className={lStyles.viewModalMetaValue}>
                      {new Date(viewTarget.uploaded_at).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>
                {viewTarget.category && (
                  <div className={lStyles.viewModalMetaItem}>
                    <div className={`${lStyles.viewModalMetaIcon} ${lStyles.viewModalMetaIconPurple}`}>
                      <Filter size={16} />
                    </div>
                    <div>
                      <div className={lStyles.viewModalMetaLabel}>Category</div>
                      <div className={lStyles.viewModalMetaValue}>{viewTarget.category}</div>
                    </div>
                  </div>
                )}
                {viewTarget.status && (
                  <div className={lStyles.viewModalMetaItem}>
                    <div className={`${lStyles.viewModalMetaIcon} ${lStyles.viewModalMetaIconAmber}`}>
                      <Eye size={16} />
                    </div>
                    <div>
                      <div className={lStyles.viewModalMetaLabel}>Status</div>
                      <div className={lStyles.viewModalMetaValue} style={{ textTransform: "capitalize" }}>
                        {viewTarget.status}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className={lStyles.viewModalDivider} />

              {/* ── File actions ── */}
              {viewTarget.filetype === "application/pdf" && (
                <div className={lStyles.viewModalFileActions}>
                  <a
                    href={getFileUrl(viewTarget.filepath)}
                    target="_blank"
                    rel="noreferrer"
                    className={`${lStyles.viewModalFileBtn} ${lStyles.viewModalFileBtnPrimary}`}
                  >
                    <FileText size={16} />
                    Open PDF Document
                  </a>
                </div>
              )}

              {/* ── Word document download ── */}
              {(viewTarget.filetype === "application/msword" ||
                viewTarget.filetype ===
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document") && (
                  <div className={lStyles.viewModalFileActions}>
                    <a
                      href={getFileUrl(viewTarget.filepath)}
                      download={viewTarget.filename}
                      className={`${lStyles.viewModalFileBtn} ${lStyles.viewModalFileBtnPrimary}`}
                    >
                      <Download size={16} />
                      Download Word Document
                    </a>
                  </div>
                )}

              {/* ── Image preview + OCR extracted text ── */}
              {viewTarget.filetype?.startsWith("image/") && (
                <div className={lStyles.viewModalOcrSection}>
                  <img
                    src={getFileUrl(viewTarget.filepath)}
                    alt={viewTarget.title}
                    className={lStyles.viewModalImagePreview}
                  />
                  <div className={lStyles.viewModalOcrLabel}>
                    <Image size={14} />
                    Extracted Text (OCR)
                  </div>
                  <textarea
                    className={lStyles.viewModalOcrText}
                    readOnly
                    rows={6}
                    value={
                      viewTarget.extracted_text ||
                      "No text could be extracted from this image."
                    }
                  />
                </div>
              )}

              {/* ── Council members ── */}
              {viewTarget.officials?.length > 0 && (
                <>
                  <div className={lStyles.viewModalDivider} />
                  <div className={lStyles.viewModalCouncilSection}>
                    <div className={lStyles.viewModalCouncilHeader}>
                      <div className={lStyles.viewModalCouncilTitle}>
                        Council Members
                      </div>
                      <div className={lStyles.viewModalCouncilCount}>
                        {viewTarget.officials.length} member{viewTarget.officials.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className={lStyles.viewModalCouncilGrid}>
                      {viewTarget.officials.map((m) => (
                        <div key={m.id} className={lStyles.viewModalCouncilCard}>
                          {m.photo ? (
                            <img
                              src={m.photo}
                              alt={m.full_name}
                              className={lStyles.viewModalCouncilPhoto}
                            />
                          ) : (
                            <div className={lStyles.viewModalCouncilAvatar}>
                              {m.full_name?.charAt(0)}
                            </div>
                          )}
                          <div>
                            <div className={lStyles.viewModalCouncilName}>
                              {m.full_name}
                            </div>
                            <div className={lStyles.viewModalCouncilPosition}>
                              {m.position}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── Footer ── */}
            <div className={lStyles.viewModalFooter}>
              <button
                className={`${lStyles.viewModalFooterBtn} ${lStyles.viewModalFooterBtnClose}`}
                onClick={() => setViewTarget(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}