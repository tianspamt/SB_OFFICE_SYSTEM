/**
 * ResolutionsPage.jsx — Updated with Review, Approval, and Manual Publishing Workflow
 * ADMIN ONLY — UI only, no backend logic
 * Preserves existing props: resolutions, setDeleteTarget, onEdit
 */

import { useState } from "react";
import {
  Eye,
  Pencil,
  Trash2,
  FileText,
  Image,
  CalendarDays,
} from "lucide-react";
import styles from "./AdminDashboard.module.css";
import lStyles from "./LegislativeModule.module.css";
import { API } from "./AdminContext";

import {
  TabNavigation,
  SearchBar,
  FilterPanel,
  PendingRecordCard,
  UploadModal,
  CommentPanel,
  EmptyState,
  StatsRow,
  StatusBadge,
} from "./LegislativeComponents";

// ─── DUMMY DATA ───────────────────────────────────────────────────────────────

const DUMMY_PENDING = [
  {
    id: "pend-1",
    code: "RES-2026-FIN-001-DRAFT",
    title: "Authorization for Emergency Fund Release",
    category: "Finance",
    author: "Roberto Tan",
    coauthor: "",
    status: "approved",
    submitted: "2026-04-18",
  },
  {
    id: "pend-2",
    code: "RES-2026-HLT-001-DRAFT",
    title: "Support for Barangay Health Center Expansion",
    category: "Health",
    author: "Lourdes Aquino",
    coauthor: "",
    status: "pending",
    submitted: "2026-04-25",
  },
  {
    id: "pend-3",
    code: "RES-2026-INF-001-DRAFT",
    title: "Road Rehabilitation Project in Barangay Sta. Cruz",
    category: "Infrastructure",
    author: "Ramon Garcia",
    coauthor: "Elena Bautista",
    status: "pending",
    submitted: "2026-05-01",
  },
];

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
}) {
  const [activeTab, setActiveTab] = useState("published");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("");
  const [authorFilter, setAuthorFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [pendingStatuses, setPendingStatuses] = useState(
    Object.fromEntries(DUMMY_PENDING.map((d) => [d.id, d.status]))
  );
  const [comments, setComments] = useState({});
  const [panelItem, setPanelItem] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // ── Derive available years from published resolutions ──────────────────────
  const availableYears = [
    ...new Set(resolutions.map((r) => r.year?.toString()).filter(Boolean)),
  ].sort((a, b) => b - a);

  const filterPublished = (list) =>
    list.filter((r) => {
      const s =
        !search ||
        (r.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.resolution_number || "")
          .toLowerCase()
          .includes(search.toLowerCase());
      const c =
        catFilter === "All" ||
        (r.category || "").toLowerCase() === catFilter.toLowerCase();
      const a =
        !authorFilter ||
        (r.author || "").toLowerCase().includes(authorFilter.toLowerCase());
      const y = yearFilter === "all" || r.year?.toString() === yearFilter;
      return s && c && a && y;
    });

  const filterPending = (list) =>
    list.filter((r) => {
      const s =
        !search ||
        (r.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.code || "").toLowerCase().includes(search.toLowerCase()) ||
        (r.author || "").toLowerCase().includes(search.toLowerCase());
      const c = catFilter === "All" || r.category === catFilter;
      const a =
        !authorFilter ||
        (r.author || "").toLowerCase().includes(authorFilter.toLowerCase());
      return s && c && a;
    });

  const resetFilters = () => {
    setSearch("");
    setCatFilter("All");
    setDateFilter("");
    setAuthorFilter("");
    setYearFilter("all");
  };

  const handleApprove = (id) =>
    setPendingStatuses((prev) => ({ ...prev, [id]: "approved" }));
  const handleReject = (id) =>
    setPendingStatuses((prev) => ({ ...prev, [id]: "rejected" }));

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

  const pendingCount = DUMMY_PENDING.filter(
    (d) => pendingStatuses[d.id] !== "published"
  ).length;

  const publishedFiltered = filterPublished(resolutions);
  const pendingFiltered = filterPending(DUMMY_PENDING);

  return (
    <>
      {/* STATS */}
      <StatsRow
        stats={[
          { value: resolutions.length, label: "Total Published" },
          {
            value: pendingCount,
            label: "Pending Review",
            colorClass: lStyles.statCardAmber,
          },
          {
            value: DUMMY_PENDING.filter(
              (d) => pendingStatuses[d.id] === "approved"
            ).length,
            label: "Ready for Upload",
            colorClass: lStyles.statCardGreen,
          },
        ]}
      />

      {/* TABS */}
      <TabNavigation
  tabs={[
    { id: "published", label: "Published" },
    ...(!readOnly ? [{ id: "pending", label: "Pending", badge: pendingCount }] : []),
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
            Showing {publishedFiltered.length} of {resolutions.length}{" "}
            resolutions
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
                      <StatusBadge status="published" />
                    </div>
                  </div>
                  <div className={lStyles.recordActions}>
                    <a
                      href={
                        r.extracted_text
                          ? `${API}/api/resolutions/${r.id}/print`
                          : r.filepath
                      }
                      target="_blank"
                      rel="noreferrer"
                      className={`${lStyles.btn} ${lStyles.btnSm} ${lStyles.btnInfo}`}
                    >
                      <Eye size={13} /> View
                    </a>
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
            Showing {pendingFiltered.length} of {DUMMY_PENDING.length} drafts
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
                  code={item.code}
                  title={item.title}
                  category={item.category}
                  author={item.author}
                  submitted={item.submitted}
                  status={pendingStatuses[item.id] || item.status}
                  onApprove={() => handleApprove(item.id)}
                  onReject={() => handleReject(item.id)}
                  onViewDraft={() => setPanelItem(item)}
                  onComment={() => setPanelItem(item)}
                />
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
            // TODO: connect to backend
            console.log("Publish resolution:", formData);
            setShowUploadModal(false);
          }}
        />
      )}

      {/* ── COMMENT PANEL ────────────────────────────────────────────────────── */}
      {panelItem && (
        <CommentPanel
          item={panelItem}
          comments={comments[panelItem.id] || []}
          onClose={() => setPanelItem(null)}
          onAddComment={(text) => handleAddComment(panelItem.id, text)}
        />
      )}
    </>
  );
}
