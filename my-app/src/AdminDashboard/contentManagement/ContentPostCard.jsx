import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import {
  Pencil,
  Trash2,
  Calendar,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  Pin,
  MoreHorizontal,
  Camera,
} from "lucide-react";
import styles from "../AdminDashboard.module.css";
import { CATEGORY_LABELS } from "./constants";
import { formatPostDate } from "./utils";
import { ImageCarousel } from "./ImageCarousel";

const BADGE_STYLE = {
  activity: { background: "#f0fdf4", color: "#15803d", borderColor: "#bbf7d0" },
  announcement: { background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" },
};


export function ContentPostCard({
  post,
  onEdit,
  onDelete,
  onTogglePublish,
  onPin,
  view,
  readOnly = false,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  // Dropdown opens downward by default; if the button is near the bottom of
  // the viewport that pushes it past the fold and forces a scroll to see
  // every item, so flip it to open upward instead once we know it doesn't fit.
  const [dropUp, setDropUp] = useState(false);
  // Coordinates for the portaled dropdown, in viewport (position:fixed)
  // terms — computed from the button's own position, not the card's, since
  // the dropdown no longer lives inside the card's DOM subtree.
  const [menuCoords, setMenuCoords] = useState(null);
  const btnRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (
        btnRef.current && !btnRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // A portaled, fixed-position menu doesn't move with the button if the page
  // scrolls or resizes underneath it — rather than re-tracking on every
  // scroll tick, just close it, same as clicking outside would.
  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menuOpen]);

  const openMenu = () => {
    const rect = btnRef.current.getBoundingClientRect();
    setDropUp(false); // reset; layout effect below flips it if it doesn't fit
    setMenuCoords({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setMenuOpen(true);
  };

  // Runs after the dropdown mounts (opening downward by default) but before
  // the browser paints, so measuring/flipping here never shows a flicker.
  useLayoutEffect(() => {
    if (!menuOpen || !dropdownRef.current || !btnRef.current) return;
    const dropRect = dropdownRef.current.getBoundingClientRect();
    if (dropRect.bottom > window.innerHeight) {
      const btnRect = btnRef.current.getBoundingClientRect();
      setMenuCoords({
        bottom: window.innerHeight - btnRect.top + 4,
        right: window.innerWidth - btnRect.right,
      });
      setDropUp(true);
    }
  }, [menuOpen]);

  return (
    <div
      className={`${styles.postCard} ${
        view === "list" ? styles.postCardList : ""
      } ${!post.published ? styles.postCardDraft : ""}`}
    >
      {post.images?.length > 0 && (
        <div className={styles.postImgWrap}>
          <ImageCarousel images={post.images.map((img) => img.url)} />
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
              background: (BADGE_STYLE[post.category] || BADGE_STYLE.activity).background,
              color: (BADGE_STYLE[post.category] || BADGE_STYLE.activity).color,
              borderColor: (BADGE_STYLE[post.category] || BADGE_STYLE.activity).borderColor,
            }}
          >
            <Camera size={10} /> {CATEGORY_LABELS[post.category] || "Activity"}
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
            {!readOnly && (
            <div className={styles.menuWrap}>
              <button
                ref={btnRef}
                type="button"
                className={styles.menuBtn}
                onClick={() => (menuOpen ? setMenuOpen(false) : openMenu())}
              >
                <MoreHorizontal size={16} />
              </button>
              {menuOpen && menuCoords && createPortal(
                <div
                  ref={dropdownRef}
                  className={`${styles.menuDropdown} ${dropUp ? styles.menuDropdownUp : ""}`}
                  style={{ position: "fixed", ...menuCoords }}
                >
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
                </div>,
                document.body
              )}
            </div>
            )}
          </div>
        </div>

        <h3 className={styles.postTitle}>{post.title}</h3>

        {post.body && <p className={styles.postCaption}>{post.body}</p>}

        <div className={styles.postFooter}>
          <span className={styles.postDate}>
            <Calendar size={11} /> {formatPostDate(post.created_at)}
          </span>
          {/* "View live" removed — there's no public site wired up yet to
              link to (see the Content Management critique); a fake link
              that goes nowhere is worse than no link. */}
        </div>
      </div>
    </div>
  );
}
