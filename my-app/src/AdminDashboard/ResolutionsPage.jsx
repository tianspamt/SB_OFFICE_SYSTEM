/**
 * ResolutionsPage.jsx — Review, Approval, and Manual Publishing Workflow
 * Preserves existing props: resolutions, setDeleteTarget, onEdit
 */

import { useState, useEffect } from "react";
import {
  X,
  Eye,
  Pencil,
  Archive,
  FileText,
  Image,
  CalendarDays,
  Download,
  Upload,
  Send,
} from "lucide-react";
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

const CATEGORIES = [
  "All",
  "Finance",
  "Health",
  "Infrastructure",
  "Education",
  "Environment",
  "Public Safety",
  "Agriculture",
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function ResolutionsPage({
  resolutions,
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
  const [pendingResolutions, setPendingResolutions] = useState([]);
  const [fetchingPending, setFetchingPending] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);

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

  // ── Split resolutions by actual status from the backend ─────────────────────
  const publishedResolutions = resolutions.filter((r) => r.status === "published");

  // ── Derive available years from published resolutions ──────────────────────
  const availableYears = [
    ...new Set(publishedResolutions.map((r) => r.year?.toString()).filter(Boolean)),
  ].sort((a, b) => b - a);

  const filterPublished = (list) =>
    list.filter((r) => {
      const s =
        !search ||
        (r.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.resolution_number || "").toLowerCase().includes(search.toLowerCase());
      const c =
        catFilter === "All" ||
        (r.category || "").toLowerCase() === catFilter.toLowerCase();
      const a =
        !authorFilter ||
        (r.author || "").toLowerCase().includes(authorFilter.toLowerCase());
      const y = yearFilter === "all" || r.year?.toString() === yearFilter;
      return s && c && a && y;
    });

  const resetFilters = () => {
    setSearch("");
    setCatFilter("All");
    setDateFilter("");
    setAuthorFilter("");
    setYearFilter("all");
  };

  useEffect(() => {
    if (activeTab === "pending" && canPublish) {
      fetchPendingResolutions();
    }
  }, [activeTab]);

  // Role-aware pending queue: each position only reviews the status it owns.
  const pendingStatusesForRole = () => {
    if (isSecretary) return "pending,approved";
    if (isViceMayor) return "ready_to_publish";
    if (isClerk) return "needs_revision";
    return "pending,needs_revision,ready_to_publish,approved";
  };

  const fetchPendingResolutions = async () => {
    setFetchingPending(true);
    try {
      const res = await fetch(`${API}/api/resolutions?status=${pendingStatusesForRole()}`);
      const data = await res.json();
      setPendingResolutions(Array.isArray(data) ? data : []);
    } catch {
      setPendingResolutions([]);
    } finally {
      setFetchingPending(false);
    }
  };

  const refreshAll = () => {
    fetchPendingResolutions();
    onRefresh?.();
  };

  // ── Comment thread (inside the View Draft modal) ────────────────────────────
  const fetchComments = async (resolutionId) => {
    setLoadingComments(true);
    try {
      const res = await authFetch(`${API}/api/comments?entity_type=resolution&entity_id=${resolutionId}`);
      const data = await res.json();
      setReviewComments(Array.isArray(data) ? data : []);
    } catch {
      setReviewComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleOpenView = (item) => {
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
        body: JSON.stringify({ entity_type: "resolution", entity_id: viewTarget.id, text: reviewCommentText.trim() }),
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
    runReviewAction(`/api/resolutions/${id}/accept`, { method: "PUT" }, (d) => ({ status: d.status }));

  const handleRequestChanges = async () => {
    if (!reviewCommentText.trim() || !viewTarget) return;
    const ok = await runReviewAction(
      `/api/resolutions/${viewTarget.id}/request-changes`,
      { method: "PUT", body: JSON.stringify({ comment: reviewCommentText.trim() }) },
      (d) => ({ status: d.status })
    );
    if (ok) {
      setReviewCommentText("");
      fetchComments(viewTarget.id);
    }
  };

  const handleVMApprove = (id) =>
    runReviewAction(`/api/resolutions/${id}/vm-approve`, { method: "PUT" }, (d) => ({ status: d.status }));

  const handlePublish = (id) =>
    runReviewAction(`/api/resolutions/${id}/publish`, { method: "PUT" }, (d) => ({ status: d.status }));

  const handleReplaceFile = async (id) => {
    if (!reviewFile) return;
    const fd = new FormData();
    fd.append("file", reviewFile);
    const ok = await runReviewAction(`/api/resolutions/${id}/replace-file`, { method: "PUT", body: fd }, (d) => ({
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
    runReviewAction(`/api/resolutions/${id}/resubmit`, { method: "PUT" }, (d) => ({ status: d.status }));
  };

  const pendingFiltered = pendingResolutions.filter((r) => {
    return !search ||
      (r.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.resolution_number || "").toLowerCase().includes(search.toLowerCase());
  });
  const pendingCount = pendingResolutions.length;
  const publishedFiltered = filterPublished(publishedResolutions);

  return (
    <>
      {/* STATS */}
      <StatsRow
        stats={[
          { value: publishedResolutions.length, label: "Total Published" },
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
            Showing {publishedFiltered.length} of {publishedResolutions.length} resolutions
          </div>
          <div className={lStyles.recordList}>
            {publishedFiltered.length === 0 ? (
              <EmptyState
                title="No published resolutions yet"
                text={
                  search || catFilter !== "All"
                    ? "No records match your filters."
                    : "Approved drafts will appear here after final signed upload."
                }
              />
            ) : (
              publishedFiltered.map((r) => (
                <div key={r.id} className={lStyles.recordCard}>
                  <div
                    className={lStyles.recordIcon}
                    style={{ background: "var(--blue-50)" }}
                  >
                    {r.filetype === "application/pdf" ? (
                      <FileText size={20} strokeWidth={1.2} />
                    ) : (
                      <Image size={20} strokeWidth={1.2} />
                    )}
                  </div>
                  <div className={lStyles.recordBody}>
                    <div className={lStyles.recordCode}>
                      {r.resolution_number || "—"}
                    </div>
                    <div className={lStyles.recordTitle}>{r.title}</div>
                    <div className={lStyles.recordMeta}>
                      {r.year && (
                        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <CalendarDays size={12} /> {r.year}
                        </span>
                      )}
                      <StatusBadge status={r.status} />
                      {r.officials?.length > 0 && (
                        <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
                          {r.officials.length} council member{r.officials.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={lStyles.recordActions}>
                    <button
                      className={`${lStyles.btn} ${lStyles.btnSm} ${lStyles.btnInfo}`}
                      onClick={() => handleOpenView(r)}
                    >
                      <Eye size={13} /> View
                    </button>
                    {!readOnly && (
                      <>
                        <button
                          className={`${lStyles.btn} ${lStyles.btnSm}`}
                          onClick={() => onEdit(r)}
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        <button
                          className={`${lStyles.btn} ${lStyles.btnSm} ${lStyles.btnDanger}`}
                          onClick={() =>
                            setDeleteTarget({
                              id: r.id,
                              type: "resolution",
                              name: r.title,
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
                      {item.resolution_number || "—"}
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
          title="Add Final Resolution"
          codePrefix="RES"
          categories={[
            "Finance",
            "Health",
            "Infrastructure",
            "Education",
            "Environment",
            "Public Safety",
          ]}
          onClose={() => setShowUploadModal(false)}
          onSubmit={(formData) => {
            console.log("Publish resolution:", formData);
            setShowUploadModal(false);
          }}
        />
      )}

      {/* ── VIEW RESOLUTION MODAL ────────────────────────────────────────────── */}
      {viewTarget && (
        <div className={lStyles.viewModalOverlay} onClick={() => setViewTarget(null)}>
          <div className={lStyles.viewModal} onClick={(e) => e.stopPropagation()}>
            {/* ── Header ── */}
            <div className={lStyles.viewModalHeader}>
              <div className={lStyles.viewModalHeaderTop}>
                <div className={lStyles.viewModalHeaderInfo}>
                  {viewTarget.resolution_number && (
                    <div className={lStyles.viewModalOrdNumber}>
                      <FileText size={12} />
                      {viewTarget.resolution_number}
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
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </div>
                  </div>
                </div>
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
                    value={viewTarget.extracted_text || "No text could be extracted from this image."}
                  />
                </div>
              )}

              {/* ── Council members ── */}
              {viewTarget.officials?.length > 0 && (
                <>
                  <div className={lStyles.viewModalDivider} />
                  <div className={lStyles.viewModalCouncilSection}>
                    <div className={lStyles.viewModalCouncilHeader}>
                      <div className={lStyles.viewModalCouncilTitle}>Author</div>
                      <div className={lStyles.viewModalCouncilCount}>
                        {viewTarget.officials.length} member{viewTarget.officials.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className={lStyles.viewModalCouncilGrid}>
                      {viewTarget.officials.map((m) => (
                        <div key={m.id} className={lStyles.viewModalCouncilCard}>
                          {m.photo ? (
                            <img src={m.photo} alt={m.full_name} className={lStyles.viewModalCouncilPhoto} />
                          ) : (
                            <div className={lStyles.viewModalCouncilAvatar}>{m.full_name?.charAt(0)}</div>
                          )}
                          <div>
                            <div className={lStyles.viewModalCouncilName}>{m.full_name}</div>
                            <div className={lStyles.viewModalCouncilPosition}>{m.position}</div>
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

                  {(isSecretary || isClerk) && (
                    <div style={{ marginBottom: 16 }}>
                      <div className={lStyles.viewModalCouncilTitle} style={{ marginBottom: 8 }}>
                        Replace Draft File
                      </div>
                      <div className={lStyles.uploadZone} onClick={() => document.getElementById("reviewFileInputRes")?.click()}>
                        <div className={lStyles.uploadIcon}>📎</div>
                        <div className={lStyles.uploadText}>
                          {reviewFile ? reviewFile.name : "Click to choose a replacement file"}
                        </div>
                        <input
                          id="reviewFileInputRes"
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
                            <span className={lStyles.commentAuthor}>{c.author?.name || c.author_role}</span>
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

                  <div className={lStyles.viewModalFileActions} style={{ marginTop: 16 }}>
                    {isSecretary && viewTarget.status === "pending" && (
                      <>
                        <button
                          className={`${lStyles.btn} ${lStyles.btnSuccess}`}
                          disabled={reviewSubmitting}
                          onClick={() => handleAccept(viewTarget.id)}
                        >
                          ✅ Accept
                        </button>
                        <button
                          className={`${lStyles.btn} ${lStyles.btnDanger}`}
                          disabled={reviewSubmitting || !reviewCommentText.trim()}
                          title={!reviewCommentText.trim() ? "Enter a comment above explaining the requested changes" : ""}
                          onClick={handleRequestChanges}
                        >
                          Request Changes
                        </button>
                      </>
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
