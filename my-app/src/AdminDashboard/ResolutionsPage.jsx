/**
 * ResolutionsPage.jsx — Review, Approval, and Manual Publishing Workflow
 * Preserves existing props: resolutions, setDeleteTarget, onEdit
 */

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import lStyles from "./LegislativeModule.module.css";
import { pendingQueryKey, fetchPendingList, RESOLUTION_CATEGORIES } from "./AdminContext";
import {
  pendingStatusesForRole,
  useReviewWorkflow,
  useCommentThread,
  useLegislativePublished,
  useResetOnChange,
  useDeepLinkedTab,
} from "./useLegislativeReview";

import {
  TabNavigation,
  SearchBar,
  FilterPanel,
  EmptyState,
  StatsRow,
  StatusBadge,
  RecordListSkeleton,
} from "./LegislativeComponents";

const CATEGORIES = RESOLUTION_CATEGORIES;

// Published records are paginated server-side (see GET /api/resolutions'
// opt-in page/limit) instead of fetching every resolution ever created —
// this stays independent of the `resolutions` prop, which the dashboard
// still fetches in full for its own stats.
const PAGE_SIZE = 20;

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function ResolutionsPage({
  resolutions,
  loading = false,
  setDeleteTarget,
  onEdit,
  readOnly = false,
  canPublish = false,
  canManagePending = false,
  isViceMayor = false,
  isSecretary = false,
  isClerk = false,
  isCouncilor = false,
  onRefresh,
  initialSubTab = null,
}) {
  // Lets the dashboard's "Needs your review" widget deep-link straight into
  // the Pending tab instead of landing on the default Published tab.
  const [activeTab, setActiveTab] = useDeepLinkedTab("published", initialSubTab);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const queryClient = useQueryClient();
  const pendingStatusQ = pendingStatusesForRole({ isSecretary, isViceMayor });
  const { data: pendingResolutions = [], isLoading: fetchingPending } = useQuery({
    queryKey: pendingQueryKey("resolutions", pendingStatusQ),
    queryFn: () => fetchPendingList("resolutions", pendingStatusQ),
    enabled: activeTab === "pending" && canPublish,
    staleTime: 15000,
  });

  // ── Published tab: server-paginated ─────────────────────────────────────────
  const [publishedPage, setPublishedPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);
  // Same debouncing as search, and for the same reason — Author is a text
  // input that hits the server (an ILIKE filter), unlike Category/Year/Date
  // which are discrete pickers with no per-keystroke concern.
  const [debouncedAuthor, setDebouncedAuthor] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAuthor(authorFilter.trim()), 350);
    return () => clearTimeout(timer);
  }, [authorFilter]);
  useResetOnChange(
    [debouncedSearch, yearFilter, catFilter, debouncedAuthor, dateFilter],
    setPublishedPage,
    1
  );

  const publishedParams = {
    page: String(publishedPage),
    limit: String(PAGE_SIZE),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(yearFilter !== "all" ? { year: yearFilter } : {}),
    ...(catFilter !== "All" ? { category: catFilter } : {}),
    ...(debouncedAuthor ? { author: debouncedAuthor } : {}),
    ...(dateFilter ? { date: dateFilter } : {}),
  };
  const {
    publishedList,
    publishedTotal,
    publishedTotalPages,
    fetchingPublished,
    refreshPublished: fetchPublishedResolutions,
  } = useLegislativePublished("resolutions", publishedParams, resolutions);

  // ── Review workflow (comment thread + actions inside the View Draft modal) ──
  // reviewCommentText/reviewFile stay local — they're page-specific glue
  // (one textarea doubles as both the comment box and the reject-reason
  // input; the file picker feeds handleReplaceFile below).
  const [reviewCommentText, setReviewCommentText] = useState("");
  const [reviewFile, setReviewFile] = useState(null);
  const {
    viewTarget, setViewTarget,
    submitting: reviewSubmitting, error: reviewError, setError: setReviewError,
    runAction: runReviewAction,
  } = useReviewWorkflow({ onRefresh: () => refreshAll() });
  const {
    comments: reviewComments, loadingComments, commentSubmitting,
    fetchComments: fetchCommentsForId, sendComment,
  } = useCommentThread();
  const fetchComments = (id) => fetchCommentsForId("resolution", id);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const getFileUrl = (filepath) =>
    `${SUPABASE_URL}/storage/v1/object/public/assets/${filepath}`;

  // ── Derive available years from the full resolutions list (the dashboard
  // already fetches this in full for its own stats, so reusing it here is
  // free — the Published tab's own list below is the one that's paginated).
  const availableYears = [
    ...new Set(
      resolutions
        .filter((r) => r.status === "published")
        .map((r) => r.year?.toString())
        .filter(Boolean)
    ),
  ].sort((a, b) => b - a);

  const resetFilters = () => {
    setSearch("");
    setCatFilter("All");
    setDateFilter("");
    setAuthorFilter("");
    setYearFilter("all");
  };

  // Old call sites just call fetchPendingResolutions() to refresh — keeping
  // the name means refreshAll() below doesn't need to change.
  const fetchPendingResolutions = () =>
    queryClient.invalidateQueries({ queryKey: pendingQueryKey("resolutions", pendingStatusQ) });

  const refreshAll = () => {
    fetchPendingResolutions();
    fetchPublishedResolutions();
    onRefresh?.();
  };

  const handleOpenView = (item) => {
    setReviewError("");
    setReviewCommentText("");
    setReviewFile(null);
    setViewTarget(item);
    if (item.status !== "published") fetchComments(item.id);
  };

  const handleSendComment = async () => {
    if (!viewTarget) return;
    const result = await sendComment("resolution", viewTarget.id, reviewCommentText);
    if (result.ok) setReviewCommentText("");
    else if (result.error) setReviewError(result.error);
  };

  const handleAccept = (id) =>
    runReviewAction(
      `/api/resolutions/${id}/accept`,
      { method: "PUT" },
      (d) => ({ status: d.status })
    );

  const handleRequestChanges = async () => {
    if (!reviewCommentText.trim() || !viewTarget) return;
    const ok = await runReviewAction(
      `/api/resolutions/${viewTarget.id}/request-changes`,
      {
        method: "PUT",
        body: JSON.stringify({ comment: reviewCommentText.trim() }),
      },
      (d) => ({ status: d.status })
    );
    if (ok) {
      setReviewCommentText("");
      fetchComments(viewTarget.id);
    }
  };

  const handleVMApprove = (id) =>
    runReviewAction(
      `/api/resolutions/${id}/vm-approve`,
      { method: "PUT" },
      (d) => ({ status: d.status })
    );

  const handlePublish = (id) =>
    runReviewAction(
      `/api/resolutions/${id}/publish`,
      { method: "PUT" },
      (d) => ({ status: d.status })
    );

  const handleReplaceFile = async (id) => {
    if (!reviewFile) return;
    const fd = new FormData();
    fd.append("file", reviewFile);
    const ok = await runReviewAction(
      `/api/resolutions/${id}/replace-file`,
      { method: "PUT", body: fd },
      (d) => ({
        filename: d.filename,
        filetype: d.filetype,
        filepath: d.filepath,
        extracted_text: d.extracted_text,
        revision_count: d.revision_count,
      })
    );
    if (ok) setReviewFile(null);
    return ok;
  };

  const pendingFiltered = pendingResolutions.filter((r) => {
    const matchesSearch =
      !search ||
      (r.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.resolution_number || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory = catFilter === "All" || r.category === catFilter;
    // Searches the real officials relation (Tag Council Members), not a
    // free-text author field — see the same change on the backend's
    // GET /api/resolutions (findRecordIdsByAuthorName).
    const matchesAuthor =
      !authorFilter ||
      (r.officials || []).some((off) =>
        (off.full_name || "").toLowerCase().includes(authorFilter.toLowerCase())
      );
    const matchesYear = yearFilter === "all" || String(r.year) === yearFilter;
    const matchesDate =
      !dateFilter || (r.uploaded_at || "").slice(0, 10) === dateFilter;
    return matchesSearch && matchesCategory && matchesAuthor && matchesYear && matchesDate;
  });
  const pendingCount = pendingResolutions.length;

  return (
    <>
      {/* STATS */}
      <StatsRow
        loading={loading || (fetchingPublished && publishedTotal === 0)}
        stats={[
          { value: publishedTotal, label: "Total Published" },
          {
            value: pendingCount,
            label: "Pending Review",
            colorClass: lStyles.statCardAmber,
          },
        ]}
      />

      {/* TABS */}
      <TabNavigation
        tabs={[
          { id: "published", label: "Published" },
          ...(canPublish
            ? [{ id: "pending", label: "Pending", badge: pendingCount }]
            : []),
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
            Showing {publishedList.length === 0 ? 0 : (publishedPage - 1) * PAGE_SIZE + 1}
            {publishedList.length > 0 ? `-${(publishedPage - 1) * PAGE_SIZE + publishedList.length}` : ""} of {publishedTotal} resolutions
          </div>
          {loading || fetchingPublished ? (
            <RecordListSkeleton count={4} />
          ) : (
          <div className={lStyles.recordList}>
            {publishedList.length === 0 ? (
              <EmptyState
                title="No published resolutions yet"
                text={
                  search || yearFilter !== "all"
                    ? "No records match your filters."
                    : "Approved drafts will appear here after final signed upload."
                }
              />
            ) : (
              publishedList.map((r) => (
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
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <CalendarDays size={12} /> {r.year}
                        </span>
                      )}
                      <StatusBadge status={r.status} />
                      {r.officials?.length > 0 && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          {r.officials.length} council member
                          {r.officials.length !== 1 ? "s" : ""}
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
          )}
          {!fetchingPublished && publishedTotalPages > 1 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, padding: "14px 0" }}>
              <button
                className={`${lStyles.btn} ${lStyles.btnSm}`}
                disabled={publishedPage <= 1}
                onClick={() => setPublishedPage((p) => Math.max(p - 1, 1))}
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                Page {publishedPage} of {publishedTotalPages}
              </span>
              <button
                className={`${lStyles.btn} ${lStyles.btnSm}`}
                disabled={publishedPage >= publishedTotalPages}
                onClick={() => setPublishedPage((p) => Math.min(p + 1, publishedTotalPages))}
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          )}
        </>
      )}

      {/* ── PENDING TAB ──────────────────────────────────────────────────────── */}
      {activeTab === "pending" && (
        <>
          <div className={lStyles.resultCount}>
            Showing {pendingFiltered.length} drafts
          </div>
          {fetchingPending ? (
            <RecordListSkeleton count={3} />
          ) : (
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
                        Submitted:{" "}
                        {new Date(item.uploaded_at).toLocaleDateString("en-PH")}
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
                    {canManagePending && (
                      <button
                        className={`${lStyles.btn} ${lStyles.btnSm} ${lStyles.btnDanger}`}
                        onClick={() =>
                          setDeleteTarget({
                            id: item.id,
                            type: "resolution",
                            name: item.title,
                          })
                        }
                      >
                        <Archive size={13} /> Archive
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          )}
        </>
      )}

      {/* ── VIEW RESOLUTION MODAL ────────────────────────────────────────────── */}
      {viewTarget && (
        <div
          className={lStyles.viewModalOverlay}
          onClick={() => setViewTarget(null)}
        >
          <div
            className={lStyles.viewModal}
            onClick={(e) => e.stopPropagation()}
          >
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
                    <div
                      className={`${lStyles.viewModalMetaIcon} ${lStyles.viewModalMetaIconBlue}`}
                    >
                      <CalendarDays size={16} />
                    </div>
                    <div>
                      <div className={lStyles.viewModalMetaLabel}>Year</div>
                      <div className={lStyles.viewModalMetaValue}>
                        {viewTarget.year}
                      </div>
                    </div>
                  </div>
                )}
                <div className={lStyles.viewModalMetaItem}>
                  <div
                    className={`${lStyles.viewModalMetaIcon} ${lStyles.viewModalMetaIconGreen}`}
                  >
                    <CalendarDays size={16} />
                  </div>
                  <div>
                    <div className={lStyles.viewModalMetaLabel}>Uploaded</div>
                    <div className={lStyles.viewModalMetaValue}>
                      {new Date(viewTarget.uploaded_at).toLocaleDateString(
                        "en-PH",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </div>
                  </div>
                </div>
                {viewTarget.status && (
                  <div className={lStyles.viewModalMetaItem}>
                    <div
                      className={`${lStyles.viewModalMetaIcon} ${lStyles.viewModalMetaIconAmber}`}
                    >
                      <Eye size={16} />
                    </div>
                    <div>
                      <div className={lStyles.viewModalMetaLabel}>Status</div>
                      <div
                        className={lStyles.viewModalMetaValue}
                        style={{ textTransform: "capitalize" }}
                      >
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
                        const res = await fetch(
                          getFileUrl(viewTarget.filepath)
                        );
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
                        {viewTarget.officials.length} member
                        {viewTarget.officials.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className={lStyles.viewModalCouncilGrid}>
                      {viewTarget.officials.map((m) => (
                        <div
                          key={m.id}
                          className={lStyles.viewModalCouncilCard}
                        >
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

                  {(isSecretary || isClerk || isCouncilor) && (
                    <div style={{ marginBottom: 16 }}>
                      <div
                        className={lStyles.viewModalCouncilTitle}
                        style={{ marginBottom: 8 }}
                      >
                        Replace Draft File
                      </div>
                      <div
                        className={lStyles.uploadZone}
                        onClick={() =>
                          document.getElementById("reviewFileInputRes")?.click()
                        }
                      >
                        <div className={lStyles.uploadIcon}>📎</div>
                        <div className={lStyles.uploadText}>
                          {reviewFile
                            ? reviewFile.name
                            : "Click to choose a replacement file"}
                        </div>
                        <input
                          id="reviewFileInputRes"
                          type="file"
                          accept=".pdf,.doc,.docx,image/*"
                          style={{ display: "none" }}
                          onChange={(e) =>
                            setReviewFile(e.target.files?.[0] || null)
                          }
                        />
                      </div>
                      {reviewFile && (
                        <button
                          className={`${lStyles.btn} ${lStyles.btnSm}`}
                          style={{ marginTop: 8 }}
                          disabled={reviewSubmitting}
                          onClick={() => handleReplaceFile(viewTarget.id)}
                        >
                          <Upload size={13} />{" "}
                          {viewTarget.status === "needs_revision"
                            ? "Replace File & Resubmit"
                            : "Upload Replacement"}
                        </button>
                      )}
                    </div>
                  )}

                  <div className={lStyles.commentsLabel}>Comments</div>
                  <div className={lStyles.commentsThread}>
                    {loadingComments ? (
                      <div
                        style={{
                          fontSize: 13,
                          textAlign: "center",
                          padding: "1rem",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        Loading comments...
                      </div>
                    ) : reviewComments.length === 0 ? (
                      <div
                        style={{
                          fontSize: 13,
                          textAlign: "center",
                          padding: "1rem",
                          color: "var(--color-text-secondary)",
                        }}
                      >
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
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className={lStyles.commentText}>{c.text}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {(isSecretary || isClerk || isCouncilor || isViceMayor) && (
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
                        disabled={commentSubmitting || !reviewCommentText.trim()}
                        onClick={handleSendComment}
                      >
                        <Send size={13} />
                      </button>
                    </div>
                  )}

                  {reviewError && (
                    <div
                      style={{ color: "#c53030", fontSize: 12, marginTop: 8 }}
                    >
                      {reviewError}
                    </div>
                  )}

                  <div
                    className={lStyles.viewModalFileActions}
                    style={{ marginTop: 16 }}
                  >
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
                          disabled={
                            reviewSubmitting || !reviewCommentText.trim()
                          }
                          title={
                            !reviewCommentText.trim()
                              ? "Enter a comment above explaining the requested changes"
                              : ""
                          }
                          onClick={handleRequestChanges}
                        >
                          Request Changes
                        </button>
                      </>
                    )}

                    {isViceMayor &&
                      viewTarget.status === "ready_to_publish" && (
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
