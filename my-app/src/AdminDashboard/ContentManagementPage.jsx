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
} from "lucide-react";
import styles from "./AdminDashboard.module.css";
import { COPY } from "./contentManagement/constants";
import { ContentEmptyState } from "./contentManagement/ContentEmptyState";
import { ContentPostCard } from "./contentManagement/ContentPostCard";
import { ContentPostModal } from "./contentManagement/ContentPostModal";
import { DeleteContentPostModal } from "./contentManagement/DeleteContentPostModal";
import { useContentPosts } from "./contentManagement/useContentPosts";
import { filterPosts, sortPostsPinnedThenNewest } from "./contentManagement/utils";

export default function ContentManagementPage() {
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

  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modalError, setModalError] = useState("");

  const sorted = useMemo(() => {
    const filtered = filterPosts(posts, { search, filterStatus });
    return sortPostsPinnedThenNewest(filtered);
  }, [posts, search, filterStatus]);

  const publishedCount = posts.filter((p) => p.published).length;
  const draftCount = posts.filter((p) => !p.published).length;

  const handleSave = async (formData) => {
    setSaving(true);
    setModalError("");
    try {
      await savePost(editTarget, formData);
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
    try {
      await deletePost(deleteTarget);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const isFiltered = search.trim() !== "" || filterStatus !== "all";

  return (
    <div className={styles.page}>
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
              onEdit={(p) => {
                setModalError("");
                setEditTarget(p);
              }}
              onDelete={setDeleteTarget}
              onTogglePublish={togglePublish}
              onPin={togglePin}
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
        />
      )}
    </div>
  );
}
