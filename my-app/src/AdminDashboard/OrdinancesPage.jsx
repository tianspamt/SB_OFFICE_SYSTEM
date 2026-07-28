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
  Archive,
  FileText,
  Image,
  CalendarDays,
  Download,
  ExternalLink,
  Upload,
  Send,
  Check,
} from "lucide-react";
import styles from "./AdminDashboard.module.css";
import lStyles from "./LegislativeModule.module.css";
import { API, authFetch } from "./AdminContext";

import {
  TabNavigation,
  SearchBar,
  FilterPanel,
  UploadModal,
  EmptyState,
  StatsRow,
  StatusBadge,
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
  isSecretary = false,
  isClerk = false,
  onRefresh,
}) {
  const [activeTab, setActiveTab] = useState("published");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [pendingOrdinances, setPendingOrdinances] = useState([]);
  const [fetchingPending, setFetchingPending] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [pdfError, setPdfError] = useState(false);

  // ── Review workflow (comment thread + actions inside the View Draft modal) ──
  const [reviewComments, setReviewComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [reviewCommentText, setReviewCommentText] = useState("");
  const [reviewFile, setReviewFile] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");

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

  // Role-aware pending queue: each position only reviews the status it owns.
  const pendingStatusesForRole = () => {
    if (isSecretary) return "pending,approved";
    if (isViceMayor) return "ready_to_publish";
    if (isClerk) return "needs_revision";
    return "pending,needs_revision,ready_to_publish,approved";
  };

  const fetchPendingOrdinances = async () => {
    setFetchingPending(true);
    try {
      const res = await fetch(`${API}/api/ordinances?status=${pendingStatusesForRole()}`);
      const data = await res.json();
      setPendingOrdinances(Array.isArray(data) ? data : []);
    } catch {
      setPendingOrdinances([]);
    } finally {
      setFetchingPending(false);
    }
  };

  const refreshAll = () => {
    fetchPendingOrdinances();
    onRefresh?.();
  };

  // ── Comment thread (inside the View Draft modal) ────────────────────────────
  const fetchComments = async (ordinanceId) => {
    setLoadingComments(true);
    try {
      const res = await authFetch(`${API}/api/comments?entity_type=ordinance&entity_id=${ordinanceId}`);
      const data = await res.json();
      setReviewComments(Array.isArray(data) ? data : []);
    } catch {
      setReviewComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleOpenView = (item) => {
    setPdfError(false);
    setReviewError("");
    setReviewCommentText("");
    setReviewFile(null);
    setViewTarget(item);
    if (item.status !== "published") fetchComments(item.id);
  };

  const handleSendComment = async () => {
    if (!reviewCommentText.trim() || !viewTarget) return;
    setReviewSubmitting(true);
    try {
      const res = await authFetch(`${API}/api/comments`, {
        method: "POST",
        body: JSON.stringify({ entity_type: "ordinance", entity_id: viewTarget.id, text: reviewCommentText.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReviewCommentText("");
        fetchComments(viewTarget.id);
      } else setReviewError(data.error || "Failed to add comment.");
    } catch {
      setReviewError("Server error.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  // ── Review workflow actions ──────────────────────────────────────────────────
  const runReviewAction = async (url, options, successUpdate) => {
    setReviewSubmitting(true);
    setReviewError("");
    try {
      const res = await authFetch(`${API}${url}`, options);
      const data = await res.json();
      if (res.ok && data.success) {
        setViewTarget((prev) => (prev ? { ...prev, ...successUpdate(data.data) } : prev));
        refreshAll();
        return true;
      }
      setReviewError(data.error || "Action failed.");
      return false;
    } catch {
      setReviewError("Server error.");
      return false;
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleAccept = (id) =>
    runReviewAction(`/api/ordinances/${id}/accept`, { method: "PUT" }, (d) => ({ status: d.status }));

  const handleRequestChanges = async () => {
    if (!reviewCommentText.trim() || !viewTarget) return;
    const ok = await runReviewAction(
      `/api/ordinances/${viewTarget.id}/request-changes`,
      { method: "PUT", body: JSON.stringify({ comment: reviewCommentText.trim() }) },
      (d) => ({ status: d.status })
    );
    if (ok) {
      setReviewCommentText("");
      fetchComments(viewTarget.id);
    }
  };

  const handleVMApprove = (id) =>
    runReviewAction(`/api/ordinances/${id}/vm-approve`, { method: "PUT" }, (d) => ({ status: d.status }));

  const handlePublish = (id) =>
    runReviewAction(`/api/ordinances/${id}/publish`, { method: "PUT" }, (d) => ({ status: d.status }));

  const handleReplaceFile = async (id) => {
    if (!reviewFile) return;
    const fd = new FormData();
    fd.append("file", reviewFile);
    const ok = await runReviewAction(`/api/ordinances/${id}/replace-file`, { method: "PUT", body: fd }, (d) => ({
      filename: d.filename,
      filetype: d.filetype,
      filepath: d.filepath,
      extracted_text: d.extracted_text,
      revision_count: d.revision_count,
    }));
    if (ok) setReviewFile(null);
    return ok;
  };

  const handleResubmit = async (id) => {
    if (reviewFile) {
      const replaced = await handleReplaceFile(id);
      if (!replaced) return;
    }
    runReviewAction(`/api/ordinances/${id}/resubmit`, { method: "PUT" }, (d) => ({ status: d.status }));
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
                      onClick={() => handleOpenView(o)}
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
                          <Archive size={13} /> Archive
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
                <div key={item.id} className={lStyles.recordCard}>
                  <div
                    className={lStyles.recordIcon}
                    style={{ background: "var(--blue-50)" }}
                  >
                    {item.filetype === "application/pdf" ? (
                      <FileText size={20} strokeWidth={1.2} />
                    ) : (
                      <Image size={20} strokeWidth={1.2} />
                    )}
                  </div>
                  <div className={lStyles.recordBody}>
                    <div className={lStyles.recordCode}>
                      {item.ordinance_number || "—"}
                    </div>
                    <div className={lStyles.recordTitle}>{item.title}</div>
                    <div className={lStyles.recordMeta}>
                      <span>
                        Submitted: {new Date(item.uploaded_at).toLocaleDateString("en-PH")}
                      </span>
                      {item.revision_count > 0 && (
                        <span>Revision #{item.revision_count}</span>
                      )}
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                  <div className={lStyles.recordActions}>
                    <button
                      className={`${lStyles.btn} ${lStyles.btnSm} ${lStyles.btnInfo}`}
                      onClick={() => handleOpenView(item)}
                    >
                      <Eye size={13} /> View Draft
                    </button>
                  </div>
                </div>
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
              {console.log("SUPABASE_URL:", SUPABASE_URL, "filepath:", viewTarget.filepath, "full URL:", getFileUrl(viewTarget.filepath))}
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
                    <button
                      className={`${lStyles.viewModalFileBtn} ${lStyles.viewModalFileBtnPrimary}`}
                      onClick={async () => {
                        try {
                          const res = await fetch(getFileUrl(viewTarget.filepath));
                          const blob = await res.blob();
                          const blobUrl = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = blobUrl;
                          const ext = viewTarget.filepath.split(".").pop();
                          a.download = `${viewTarget.title}.${ext}`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(blobUrl);
                        } catch (err) {
                          console.error("Download failed:", err);
                        }
                      }}
                    >
                      <Download size={16} />
                      Download Word Document
                    </button>
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
                        Author
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

              {/* ── Review workflow (hidden once published) ── */}
              {viewTarget.status !== "published" && (
                <>
                  <div className={lStyles.viewModalDivider} />

                  {/* Replace file — Secretary or Clerk, while the draft is still under review */}
                  {(isSecretary || isClerk) && (
                    <div style={{ marginBottom: 16 }}>
                      <div className={lStyles.viewModalCouncilTitle} style={{ marginBottom: 8 }}>
                        Replace Draft File
                      </div>
                      <div className={lStyles.uploadZone} onClick={() => document.getElementById("reviewFileInput")?.click()}>
                        <div className={lStyles.uploadIcon}>📎</div>
                        <div className={lStyles.uploadText}>
                          {reviewFile ? reviewFile.name : "Click to choose a replacement file"}
                        </div>
                        <input
                          id="reviewFileInput"
                          type="file"
                          accept=".pdf,.doc,.docx,image/*"
                          style={{ display: "none" }}
                          onChange={(e) => setReviewFile(e.target.files?.[0] || null)}
                        />
                      </div>
                      {reviewFile && viewTarget.status !== "needs_revision" && (
                        <button
                          className={`${lStyles.btn} ${lStyles.btnSm}`}
                          style={{ marginTop: 8 }}
                          disabled={reviewSubmitting}
                          onClick={() => handleReplaceFile(viewTarget.id)}
                        >
                          <Upload size={13} /> Upload Replacement
                        </button>
                      )}
                    </div>
                  )}

                  {/* Comment thread */}
                  <div className={lStyles.commentsLabel}>Comments</div>
                  <div className={lStyles.commentsThread}>
                    {loadingComments ? (
                      <div style={{ fontSize: 13, textAlign: "center", padding: "1rem", color: "var(--color-text-secondary)" }}>
                        Loading comments...
                      </div>
                    ) : reviewComments.length === 0 ? (
                      <div style={{ fontSize: 13, textAlign: "center", padding: "1rem", color: "var(--color-text-secondary)" }}>
                        No comments yet
                      </div>
                    ) : (
                      reviewComments.map((c) => (
                        <div key={c.id} className={lStyles.comment}>
                          <div className={lStyles.commentMeta}>
                            <span className={lStyles.commentAuthor}>
                              {c.author?.name || c.author_role}
                            </span>
                            <span>
                              {new Date(c.created_at).toLocaleString("en-PH", {
                                month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className={lStyles.commentText}>{c.text}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {(isSecretary || isClerk) && (
                    <div className={lStyles.commentInputRow}>
                      <textarea
                        className={lStyles.commentInput}
                        rows={2}
                        placeholder="Add a comment..."
                        value={reviewCommentText}
                        onChange={(e) => setReviewCommentText(e.target.value)}
                      />
                      <button
                        className={`${lStyles.btn} ${lStyles.btnSm}`}
                        disabled={reviewSubmitting || !reviewCommentText.trim()}
                        onClick={handleSendComment}
                      >
                        <Send size={13} />
                      </button>
                    </div>
                  )}

                  {reviewError && (
                    <div style={{ color: "#c53030", fontSize: 12, marginTop: 8 }}>{reviewError}</div>
                  )}

                  {/* Status + role driven actions */}
                  <div className={lStyles.viewModalFileActions} style={{ marginTop: 16 }}>
                    {isSecretary && viewTarget.status === "pending" && (
                      <div className={lStyles.pendingActionsRow}>
                        <button
                          className={`${lStyles.pillActionBtn} ${lStyles.pillReject}`}
                          disabled={reviewSubmitting || !reviewCommentText.trim()}
                          title={!reviewCommentText.trim() ? "Enter a comment above explaining the requested changes" : ""}
                          onClick={handleRequestChanges}
                        >
                          <X size={16} /> Request Changes
                        </button>
                        <button
                          className={`${lStyles.pillActionBtn} ${lStyles.pillAccept}`}
                          disabled={reviewSubmitting}
                          onClick={() => handleAccept(viewTarget.id)}
                        >
                          <Check size={16} /> Accept
                        </button>
                      </div>
                    )}

                    {isClerk && viewTarget.status === "needs_revision" && (
                      <button
                        className={`${lStyles.btn} ${lStyles.btnSuccess}`}
                        disabled={reviewSubmitting}
                        onClick={() => handleResubmit(viewTarget.id)}
                      >
                        <Upload size={13} /> Replace File &amp; Resubmit
                      </button>
                    )}

                    {isViceMayor && viewTarget.status === "ready_to_publish" && (
                      <button
                        className={`${lStyles.btn} ${lStyles.btnSuccess}`}
                        disabled={reviewSubmitting}
                        onClick={() => handleVMApprove(viewTarget.id)}
                      >
                        ✅ Approve
                      </button>
                    )}

                    {isSecretary && viewTarget.status === "approved" && (
                      <button
                        className={`${lStyles.btn} ${lStyles.btnSuccess}`}
                        disabled={reviewSubmitting}
                        onClick={() => handlePublish(viewTarget.id)}
                      >
                        ✅ Publish
                      </button>
                    )}
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