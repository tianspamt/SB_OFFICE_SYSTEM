import { useMemo, useState } from "react";
import {
  Image,
  PlusCircle,
  X,
  LayoutGrid,
  List,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Newspaper,
  CalendarDays,
} from "lucide-react";
import styles from "./AdminDashboard.module.css";
import { ToastContainer } from "./Toast";
import { useToasts } from "./useToasts";
import { COPY, CATEGORY_OPTIONS } from "./contentManagement/constants";
import { ContentEmptyState } from "./contentManagement/ContentEmptyState";
import { ContentPostCard } from "./contentManagement/ContentPostCard";
import { ContentPostModal } from "./contentManagement/ContentPostModal";
import { DeleteContentPostModal } from "./contentManagement/DeleteContentPostModal";
import { TriviaManager } from "./contentManagement/TriviaManager";
import { ScheduleManager } from "./contentManagement/ScheduleManager";
import { useContentPosts } from "./contentManagement/useContentPosts";
import { filterPosts, sortPostsPinnedThenNewest } from "./contentManagement/utils";

const SECTIONS = [
  { value: "posts", label: "Posts", icon: Newspaper },
  { value: "trivia", label: "Trivia", icon: Sparkles },
  { value: "schedules", label: "Schedules", icon: CalendarDays },
];

export default function ContentManagementPage({ isAdmin = false }) {
  const [section, setSection] = useState("posts");

  const {
    posts,
    loading,
    fetchError,
    savePost,
    deletePost,
    togglePublish,
    togglePin,
  } = useContentPosts();

  const [view, setView] = useState("grid");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const { toasts, showMsg, dismissToast } = useToasts();

  const sorted = useMemo(() => {
    const filtered = filterPosts(posts, { search, filterStatus, filterCategory });
    return sortPostsPinnedThenNewest(filtered);
  }, [posts, search, filterStatus, filterCategory]);

  const publishedCount = posts.filter((p) => p.published).length;
  const draftCount = posts.filter((p) => !p.published).length;

  const handleSave = async (formData) => {
    setSaving(true);
    setModalError("");
    try {
      await savePost(editTarget, formData);
      showMsg(editTarget ? "Post updated!" : "Post published!");
      setShowAddModal(false);
      setEditTarget(null);
    } catch (err) {
      setModalError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deletePost(deleteTarget);
      showMsg("Post deleted!");
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err.message || "Failed to delete post.");
    } finally {
      setDeleting(false);
    }
  };

  // togglePublish/togglePin roll their own optimistic state back on failure
  // (see useContentPosts) — this just surfaces why, instead of leaving the
  // UI silently snap back with no explanation.
  const handleTogglePublish = async (id) => {
    try {
      await togglePublish(id);
    } catch (err) {
      showMsg(err.message || "Failed to update post.", "error");
    }
  };
  const handleTogglePin = async (id) => {
    try {
      await togglePin(id);
    } catch (err) {
      showMsg(err.message || "Failed to update post.", "error");
    }
  };

  const isFiltered =
    search.trim() !== "" || filterStatus !== "all" || filterCategory !== "all";

  return (
    <div className={styles.page}>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className={styles.viewToggle} style={{ marginBottom: 16, width: "fit-content" }}>
        {SECTIONS.map((s) => (
          <button
            key={s.value}
            type="button"
            className={`${styles.viewBtn} ${section === s.value ? styles.viewBtnActive : ""}`}
            style={{ width: "auto", padding: "6px 14px", gap: 6, display: "inline-flex", alignItems: "center" }}
            onClick={() => setSection(s.value)}
          >
            <s.icon size={14} /> {s.label}
          </button>
        ))}
      </div>

      {section === "trivia" ? (
        <TriviaManager isAdmin={isAdmin} showMsg={showMsg} />
      ) : section === "schedules" ? (
        <ScheduleManager isAdmin={isAdmin} showMsg={showMsg} />
      ) : (
      <>
      <p
        style={{
          fontSize: 14,
          color: "#64748b",
          margin: "0 0 16px",
          lineHeight: 1.55,
          maxWidth: 720,
        }}
      >
        {COPY.pagePurpose}
      </p>

      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <div className={styles.topStats}>
            <span className={styles.topStat}>
              <CheckCircle2 size={13} />
              {publishedCount} Published
            </span>
            <span className={styles.topStatDivider} />
            <span className={styles.topStat}>
              <Clock size={13} />
              {draftCount} Drafts
            </span>
            <span className={styles.topStatDivider} />
            <span className={styles.topStat}>
              <Image size={13} />
              {posts.length} Total
            </span>
          </div>
        </div>
        {isAdmin && (
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => {
              setModalError("");
              setShowAddModal(true);
            }}
          >
            <PlusCircle size={16} /> {COPY.newPost}
          </button>
        )}
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder={COPY.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className={styles.searchClear}
              onClick={() => setSearch("")}
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className={styles.rightControls}>
          <select
            className={styles.statusSelect}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className={styles.statusSelect}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All status</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
          <div className={styles.viewToggle}>
            <button
              type="button"
              className={`${styles.viewBtn} ${
                view === "grid" ? styles.viewBtnActive : ""
              }`}
              onClick={() => setView("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              className={`${styles.viewBtn} ${
                view === "list" ? styles.viewBtnActive : ""
              }`}
              onClick={() => setView("list")}
              aria-label="List view"
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {fetchError && (
        <div className={styles.fetchError}>
          <AlertCircle size={14} /> {fetchError}
        </div>
      )}

      {loading ? (
        <div className={styles.loadingWrap}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <ContentEmptyState filtered={isFiltered} />
      ) : (
        <div
          className={`${styles.postsGrid} ${
            view === "list" ? styles.postsGridList : ""
          }`}
        >
          {sorted.map((post) => (
            <ContentPostCard
              key={post.id}
              post={post}
              view={view}
              readOnly={!isAdmin}
              onEdit={(p) => {
                setModalError("");
                setEditTarget(p);
              }}
              onDelete={(p) => {
                setDeleteError("");
                setDeleteTarget(p);
              }}
              onTogglePublish={handleTogglePublish}
              onPin={handleTogglePin}
            />
          ))}
        </div>
      )}

      {(showAddModal || editTarget) && (
        <ContentPostModal
          key={editTarget?.id ?? "new"}
          mode={editTarget ? "edit" : "add"}
          initial={editTarget}
          onClose={() => {
            setShowAddModal(false);
            setEditTarget(null);
          }}
          onSave={handleSave}
          saving={saving}
          error={modalError}
        />
      )}
      {deleteTarget && (
        <DeleteContentPostModal
          post={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          deleting={deleting}
          error={deleteError}
        />
      )}
      </>
      )}
    </div>
  );
}
