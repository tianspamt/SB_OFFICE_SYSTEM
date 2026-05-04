import { useState, useRef, useEffect } from "react";
import {
  Pencil,
  Trash2,
  Calendar,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Pin,
  MoreHorizontal,
  Camera,
} from "lucide-react";
import styles from "../AdminDashboard.module.css";
import { COPY } from "./constants";
import { formatPostDate } from "./utils";
import { ImageCarousel } from "./ImageCarousel";

const BADGE_STYLE = {
  background: "#f0fdf4",
  color: "#15803d",
  borderColor: "#bbf7d0",
};

export function ContentPostCard({
  post,
  onEdit,
  onDelete,
  onTogglePublish,
  onPin,
  view,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      className={`${styles.postCard} ${
        view === "list" ? styles.postCardList : ""
      } ${!post.published ? styles.postCardDraft : ""}`}
    >
      {post.images?.length > 0 && (
        <div className={styles.postImgWrap}>
          <ImageCarousel images={post.images} />
          {post.pinned && (
            <span className={styles.pinnedBadge}>
              <Pin size={10} /> Pinned
            </span>
          )}
        </div>
      )}
      {!post.images?.length && post.pinned && (
        <div className={styles.pinnedBadgeNoImg}>
          <Pin size={10} /> Pinned
        </div>
      )}

      <div className={styles.postBody}>
        <div className={styles.postTop}>
          <span
            className={styles.catBadge}
            style={{
              background: BADGE_STYLE.background,
              color: BADGE_STYLE.color,
              borderColor: BADGE_STYLE.borderColor,
            }}
          >
            <Camera size={10} /> {COPY.badgeLabel}
          </span>
          <div className={styles.postTopRight}>
            <span
              className={`${styles.statusDot} ${
                post.published ? styles.statusPublished : styles.statusDraft
              }`}
            >
              {post.published ? (
                <>
                  <CheckCircle2 size={11} /> Published
                </>
              ) : (
                <>
                  <Clock size={11} /> Draft
                </>
              )}
            </span>
            <div className={styles.menuWrap} ref={menuRef}>
              <button
                type="button"
                className={styles.menuBtn}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <MoreHorizontal size={16} />
              </button>
              {menuOpen && (
                <div className={styles.menuDropdown}>
                  <button
                    type="button"
                    onClick={() => {
                      onEdit(post);
                      setMenuOpen(false);
                    }}
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onPin(post.id);
                      setMenuOpen(false);
                    }}
                  >
                    <Pin size={13} /> {post.pinned ? "Unpin" : "Pin to top"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onTogglePublish(post.id);
                      setMenuOpen(false);
                    }}
                  >
                    {post.published ? (
                      <>
                        <EyeOff size={13} /> Unpublish
                      </>
                    ) : (
                      <>
                        <Eye size={13} /> Publish
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className={styles.menuDelete}
                    onClick={() => {
                      onDelete(post);
                      setMenuOpen(false);
                    }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <h3 className={styles.postTitle}>{post.title}</h3>

        {post.caption && <p className={styles.postCaption}>{post.caption}</p>}

        <div className={styles.postFooter}>
          <span className={styles.postDate}>
            <Calendar size={11} /> {formatPostDate(post.created_at)}
          </span>
          {post.published && (
            <a
              className={styles.viewLiveBtn}
              href="#"
              target="_blank"
              rel="noreferrer"
            >
              View live <ArrowUpRight size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
