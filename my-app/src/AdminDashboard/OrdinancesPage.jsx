/**
 * OrdinancesPage.jsx — Updated with Review, Approval, and Manual Publishing Workflow
 * ADMIN ONLY — UI only, no backend logic
 * Preserves existing props: ordinances, setDeleteTarget, onEdit
 */

import { useState } from "react";
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

const DUMMY_PENDING = [
  {
    id: "pend-1",
    code: "ORD-2026-TAX-001-DRAFT",
    title: "Tax Rate Amendment for Commercial Establishments",
    category: "Tax",
    author: "Maria Santos",
    coauthor: "Jose Reyes",
    status: "approved",
    submitted: "2026-04-15",
  },
  {
    id: "pend-2",
    code: "ORD-2026-EDU-001-DRAFT",
    title: "Scholarship Program for Indigenous Students",
    category: "Education",
    author: "Ana Villanueva",
    coauthor: "",
    status: "pending",
    submitted: "2026-04-20",
  },
  {
    id: "pend-3",
    code: "ORD-2026-AGR-001-DRAFT",
    title: "Organic Farming Incentives and Support Act",
    category: "Agriculture",
    author: "Carlos Mendoza",
    coauthor: "Lisa Cruz",
    status: "rejected",
    submitted: "2026-04-22",
  },
  {
    id: "pend-4",
    code: "ORD-2026-ENV-001-DRAFT",
    title: "Coastal Resource Management Ordinance",
    category: "Environment",
    author: "Pedro Lim",
    coauthor: "",
    status: "pending",
    submitted: "2026-04-28",
  },
];

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

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const getFileUrl = (filepath) =>
    `${SUPABASE_URL}/storage/v1/object/public/assets/${filepath}`;

  // ── Derive available years from published ordinances ───────────────────────
  const availableYears = [
    ...new Set(ordinances.map((o) => o.year?.toString()).filter(Boolean)),
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
        (o.code || "").toLowerCase().includes(search.toLowerCase()) ||
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

  // ── Pending actions ─────────────────────────────────────────────────────────

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

  // ── Pending count for badge ─────────────────────────────────────────────────

  const pendingCount = DUMMY_PENDING.filter(
    (d) => pendingStatuses[d.id] !== "published"
  ).length;

  // ── Published list (existing ordinances) ────────────────────────────────────

  const publishedFiltered = filterPublished(ordinances);
  const pendingFiltered = filterPending(DUMMY_PENDING);

  return (
    <>
      {/* STATS */}
      <StatsRow
        stats={[
          { value: ordinances.length, label: "Total Published" },
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
          { id: "pending", label: "Pending", badge: pendingCount },
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
            Showing {publishedFiltered.length} of {ordinances.length} ordinances
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
                      <StatusBadge status="published" />
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
                    <a
                      href={`${API}/api/ordinances/${o.id}/print`}
                      target="_blank"
                      rel="noreferrer"
                      className={`${lStyles.btn} ${lStyles.btnSm} ${lStyles.btnInfo}`}
                    >
                      <Eye size={13} /> View
                    </a>
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
