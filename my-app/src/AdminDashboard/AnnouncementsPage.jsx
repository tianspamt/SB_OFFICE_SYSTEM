import { useState, useRef, useEffect } from "react";
import {
  Pencil, Trash2, CalendarDays, Megaphone,
  Send, MoreVertical, MessageCircle, ChevronDown, ChevronUp,
  SmilePlus,
} from "lucide-react";
import styles from "./AdminDashboard.module.css";
import { priorityConfig } from "./AdminContext";

/* ─────────────────────────────────────────────
   MOCK DATA — replace with Supabase queries
───────────────────────────────────────────── */
const MOCK_USER = {
  id: "usr_001",
  name: "Juan dela Cruz",
  role: "Admin",        // "Admin" | "Staff" | "Councilor"
  initials: "JD",
};

const REACTIONS_LIST = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const ROLE_COLORS = {
  Admin:     { bg: "#ebf8ff", color: "#2b6cb0", border: "#bee3f8" },
  Staff:     { bg: "#f0fff4", color: "#276749", border: "#9ae6b4" },
  Councilor: { bg: "#faf5ff", color: "#6b46c1", border: "#d6bcfa" },
};

// Convert prop announcements → feed posts format
function announcementsToFeedPosts(announcements) {
  return announcements.map((a) => ({
    id: a.id,
    authorId: "usr_admin",
    authorName: "Admin",
    authorRole: "Admin",
    authorInitials: "AD",
    title: a.title,
    body: a.body,
    priority: a.priority,
    createdAt: a.created_at,
    expiresAt: a.expires_at,
    // Reaction map: { "👍": ["usr_001", ...], ... }
    reactions: {
      "👍": [],
      "❤️": [],
      "😂": [],
      "😮": [],
      "😢": [],
      "😡": [],
    },
    comments: [],
    showComments: false,
  }));
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)   return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */

// Avatar circle (renders a photo if provided, falls back to initials)
function Avatar({ initials, photo, size = 36, style = {} }) {
  if (photo) {
    return (
      <img
        src={photo}
        alt=""
        style={{
          width: size, height: size, minWidth: size, borderRadius: "50%",
          objectFit: "cover", flexShrink: 0, ...style,
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, minWidth: size, borderRadius: "50%",
      background: "linear-gradient(135deg, #009439, #005822)",
      color: "#fff", fontWeight: 700, fontSize: size * 0.38,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, userSelect: "none", ...style,
    }}>
      {initials}
    </div>
  );
}

// Role badge
function RoleBadge({ role }) {
  const cfg = ROLE_COLORS[role] || ROLE_COLORS.Staff;
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.6px",
      textTransform: "uppercase", padding: "2px 8px", borderRadius: 20,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {role}
    </span>
  );
}

// Reaction bar
function ReactionBar({ post, currentUserId, onReact }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const activeEmoji = REACTIONS_LIST.find(
    (e) => (post.reactions[e] || []).includes(currentUserId)
  );

  const hasAnyReaction = REACTIONS_LIST.some((e) => (post.reactions[e] || []).length > 0);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
      {/* Existing reaction counts */}
      {REACTIONS_LIST.map((emoji) => {
        const users = post.reactions[emoji] || [];
        if (users.length === 0) return null;
        const isMine = users.includes(currentUserId);
        return (
          <button
            key={emoji}
            onClick={() => onReact(post.id, emoji)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 9px", borderRadius: 20,
              background: isMine ? "#e6f4ea" : "#f7fafc",
              border: `1px solid ${isMine ? "#9ae6b4" : "#e2e8f0"}`,
              cursor: "pointer", fontSize: 13, fontWeight: 600,
              color: isMine ? "#276749" : "#4a5568",
              transition: "all 0.15s",
              transform: isMine ? "scale(1.05)" : "scale(1)",
            }}
          >
            <span style={{ fontSize: 14 }}>{emoji}</span>
            <span style={{ fontSize: 11 }}>{users.length}</span>
          </button>
        );
      })}

      {/* Add reaction button */}
      <div style={{ position: "relative" }} ref={pickerRef}>
        <button
          onClick={() => setPickerOpen((p) => !p)}
          title="Add reaction"
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "3px 10px", borderRadius: 20,
            background: pickerOpen ? "#f0fff4" : "#f7fafc",
            border: `1px solid ${pickerOpen ? "#9ae6b4" : "#e2e8f0"}`,
            cursor: "pointer", color: "#718096", fontSize: 12,
            transition: "all 0.15s",
          }}
        >
          <SmilePlus size={14} />
          {!hasAnyReaction && <span>React</span>}
        </button>
        {pickerOpen && (
          <div style={{
            position: "absolute", bottom: "calc(100% + 6px)", left: 0,
            background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            padding: "8px 10px", display: "flex", gap: 4, zIndex: 100,
          }}>
            {REACTIONS_LIST.map((emoji) => {
              const isMine = (post.reactions[emoji] || []).includes(currentUserId);
              return (
                <button
                  key={emoji}
                  onClick={() => { onReact(post.id, emoji); setPickerOpen(false); }}
                  style={{
                    fontSize: 20, background: isMine ? "#f0fff4" : "transparent",
                    border: "none", cursor: "pointer", padding: "4px 6px",
                    borderRadius: 8, transition: "transform 0.1s",
                    transform: "scale(1)",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.3)"}
                  onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Comment list + input
function CommentSection({ post, currentUser, onAddComment, onDeleteComment, onEditComment }) {
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  function handleSubmit() {
    if (!text.trim()) return;
    onAddComment(post.id, text.trim());
    setText("");
  }

  return (
    <div style={{
      borderTop: "1px solid #edf2f7", paddingTop: 14, marginTop: 14,
    }}>
      {/* Comment list */}
      {post.comments.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {post.comments.map((c) => (
            <div key={c.id} style={{
              display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <Avatar initials={c.authorInitials} photo={c.authorPhoto} size={30} />
              <div style={{ flex: 1 }}>
                <div style={{
                  background: "#f7fafc", borderRadius: 10,
                  padding: "8px 12px", border: "1px solid #edf2f7",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#1a365d" }}>{c.authorName}</span>
                    <RoleBadge role={c.authorRole} />
                  </div>
                  {editingId === c.id ? (
                    <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      <input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        style={{
                          flex: 1, padding: "5px 8px", fontSize: 12,
                          border: "1px solid #9ae6b4", borderRadius: 6, outline: "none",
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { onEditComment(post.id, c.id, editText); setEditingId(null); }
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => { onEditComment(post.id, c.id, editText); setEditingId(null); }}
                        style={{
                          background: "#009439", color: "#fff", border: "none",
                          borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11,
                        }}
                      >Save</button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{
                          background: "#edf2f7", border: "none",
                          borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 11,
                        }}
                      >Cancel</button>
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: "#4a5568", lineHeight: 1.5, margin: 0 }}>{c.text}</p>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 3, paddingLeft: 4 }}>
                  <span style={{ fontSize: 10, color: "#a0aec0" }}>{timeAgo(c.createdAt)}</span>
                  {c.authorId === currentUser.id && editingId !== c.id && (
                    <>
                      <button
                        onClick={() => { setEditingId(c.id); setEditText(c.text); }}
                        style={{ fontSize: 10, color: "#718096", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >Edit</button>
                      <button
                        onClick={() => onDeleteComment(post.id, c.id)}
                        style={{ fontSize: 10, color: "#c53030", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                      >Delete</button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comment input */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Avatar initials={currentUser.initials} photo={currentUser.photo} size={32} />
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 6,
          background: "#f7fafc", border: "1px solid #e2e8f0",
          borderRadius: 20, padding: "6px 8px 6px 14px",
          transition: "border-color 0.15s",
        }}
          onFocusCapture={(e) => e.currentTarget.style.borderColor = "#009439"}
          onBlurCapture={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
        >
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment…"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            style={{
              flex: 1, border: "none", background: "transparent",
              fontSize: 12, outline: "none", color: "#2d3748",
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            style={{
              background: text.trim() ? "linear-gradient(135deg,#009439,#005822)" : "#e2e8f0",
              color: text.trim() ? "#fff" : "#a0aec0",
              border: "none", borderRadius: "50%", width: 28, height: 28,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: text.trim() ? "pointer" : "default",
              transition: "all 0.2s", flexShrink: 0,
            }}
          >
            <Send size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Feed Post Card
function FeedPostCard({ post, currentUser, onReact, onAddComment, onDeleteComment, onEditComment, onEdit, onDelete, readOnly = false }) {
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const cfg = priorityConfig[post.priority] || priorityConfig.normal;
  const isExpired = post.expiresAt && new Date(post.expiresAt) < new Date();
  const totalReactions = REACTIONS_LIST.reduce((sum, e) => sum + (post.reactions[e] || []).length, 0);
  const isAdmin = !readOnly;

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div style={{
      background: "#fff", borderRadius: 14,
      border: `1px solid ${isExpired ? "#fed7d7" : "#e2e8f0"}`,
      boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
      padding: "18px 20px",
      opacity: isExpired ? 0.75 : 1,
      transition: "box-shadow 0.2s, transform 0.15s",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,148,57,0.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 1px 8px rgba(0,0,0,0.06)"; e.currentTarget.style.transform = "none"; }}
    >
      {/* ── Post Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
        <Avatar initials={post.authorInitials} photo={post.authorPhoto} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "#1a365d" }}>{post.authorName}</span>
            <RoleBadge role={post.authorRole} />
            {/* Priority badge */}
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.7px", textTransform: "uppercase",
              padding: "2px 9px", borderRadius: 20,
              background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
            }}>
              {cfg.label}
            </span>
            {isExpired && (
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.7px",
                padding: "2px 9px", borderRadius: 20,
                background: "#fff5f5", color: "#c53030", border: "1px solid #fed7d7",
              }}>Expired</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#a0aec0", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
            <CalendarDays size={10} strokeWidth={1.5} />
            {timeAgo(post.createdAt)}
            {post.expiresAt && (
              <span style={{ color: isExpired ? "#c53030" : "#718096", marginLeft: 4 }}>
                · {isExpired ? "⚠ Expired" : "⏱ Expires"}: {new Date(post.expiresAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
        </div>

        {/* More options (Admin/Author only) */}
        {isAdmin && (
          <div style={{ position: "relative", flexShrink: 0 }} ref={menuRef}>
            <button
              onClick={() => setMenuOpen((p) => !p)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#718096", padding: "4px 6px", borderRadius: 6,
                display: "flex", alignItems: "center",
              }}
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div style={{
                position: "absolute", right: 0, top: "calc(100% + 4px)",
                background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0",
                boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 200,
                overflow: "hidden", minWidth: 120,
              }}>
                <button
                  className={styles.editBtn}
                  onClick={() => { onEdit(post); setMenuOpen(false); }}
                  style={{
                    width: "100%", borderRadius: 0, justifyContent: "flex-start",
                    border: "none", borderBottom: "1px solid #edf2f7", padding: "9px 14px",
                  }}
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => { onDelete(post); setMenuOpen(false); }}
                  style={{
                    width: "100%", borderRadius: 0, justifyContent: "flex-start",
                    border: "none", padding: "9px 14px",
                  }}
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Post Content ── */}
      {post.title && (
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "#1a365d", marginBottom: 6, lineHeight: 1.3 }}>
          {post.title}
        </h3>
      )}
      <p style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.7, margin: 0 }}>
        {post.body}
      </p>

      {/* ── Reaction Bar ── */}
      <ReactionBar post={post} currentUserId={currentUser.id} onReact={onReact} />

      {/* ── Action Row ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14, marginTop: 12,
        paddingTop: 12, borderTop: "1px solid #edf2f7",
      }}>
        <button
          onClick={() => setShowComments((p) => !p)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: showComments ? "#f0fff4" : "none",
            border: showComments ? "1px solid #9ae6b4" : "1px solid transparent",
            color: showComments ? "#276749" : "#718096",
            borderRadius: 20, padding: "4px 12px", cursor: "pointer",
            fontSize: 12, fontWeight: 600, transition: "all 0.15s",
          }}
        >
          <MessageCircle size={13} />
          {post.comments.length > 0 ? `${post.comments.length} Comment${post.comments.length !== 1 ? "s" : ""}` : "Comment"}
          {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {totalReactions > 0 && (
          <span style={{ fontSize: 11, color: "#a0aec0", marginLeft: "auto" }}>
            {totalReactions} reaction{totalReactions !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Comment Section ── */}
      {showComments && (
        <CommentSection
          post={post}
          currentUser={currentUser}
          onAddComment={onAddComment}
          onDeleteComment={onDeleteComment}
          onEditComment={onEditComment}
        />
      )}
    </div>
  );
}

// Create Announcement Box (top card)
function CreateAnnouncementBox({ currentUser, onPost }) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("normal");

  function handlePost() {
    if (!body.trim()) return;
    onPost({ title: title.trim(), body: body.trim(), priority });
    setTitle("");
    setBody("");
    setPriority("normal");
    setExpanded(false);
  }

  function handleCancel() {
    setTitle("");
    setBody("");
    setPriority("normal");
    setExpanded(false);
  }

  return (
    <div style={{
      background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0",
      boxShadow: "0 2px 12px rgba(0,148,57,0.06)", marginBottom: 20,
      overflow: "hidden", transition: "box-shadow 0.2s",
    }}>
      {/* Collapsed trigger */}
      {!expanded ? (
        <div
          onClick={() => setExpanded(true)}
          style={{
            display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
            cursor: "text",
          }}
        >
          <Avatar initials={currentUser.initials} photo={currentUser.photo} size={38} />
          <div style={{
            flex: 1, padding: "9px 16px", background: "#f7fafc",
            border: "1px solid #e2e8f0", borderRadius: 20,
            fontSize: 13, color: "#a0aec0",
            cursor: "text", userSelect: "none",
            transition: "border-color 0.15s, background 0.15s",
          }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#9ae6b4"; e.currentTarget.style.background = "#f0fff4"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f7fafc"; }}
          >
            Share an announcement…
          </div>
        </div>
      ) : (
        <div style={{ padding: "18px 20px" }}>
          {/* Author row */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Avatar initials={currentUser.initials} photo={currentUser.photo} size={38} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#1a365d" }}>{currentUser.name}</div>
              <RoleBadge role={currentUser.role} />
            </div>
          </div>

          {/* Title */}
          <input
            placeholder="Announcement title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: "100%", padding: "9px 12px", marginBottom: 10,
              border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13,
              fontWeight: 600, outline: "none", color: "#1a365d",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => e.target.style.borderColor = "#009439"}
            onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
          />

          {/* Body */}
          <textarea
            placeholder="Share an announcement with your barangay…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            style={{
              width: "100%", padding: "9px 12px", marginBottom: 12,
              border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13,
              outline: "none", resize: "vertical", lineHeight: 1.6,
              color: "#4a5568", fontFamily: "inherit",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => e.target.style.borderColor = "#009439"}
            onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
          />

          {/* Priority selector */}
          <div style={{ marginBottom: 14 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.8px", color: "#718096", marginBottom: 7,
            }}>
              Priority
            </div>
            <div className={styles.priorityRow}>
              {["low", "normal", "high", "urgent"].map((p) => {
                const cfg = priorityConfig[p] || priorityConfig.normal;
                return (
                  <button
                    key={p}
                    className={`${styles.priorityBtn} ${priority === p ? styles.priorityBtnActive : ""}`}
                    onClick={() => setPriority(p)}
                    style={priority === p ? {
                      background: cfg.bg, color: cfg.color,
                      borderColor: cfg.border,
                    } : {}}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              onClick={handleCancel}
              style={{
                padding: "8px 18px", background: "#f7fafc", border: "1px solid #e2e8f0",
                borderRadius: 8, fontSize: 13, cursor: "pointer", color: "#4a5568",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#edf2f7"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#f7fafc"}
            >
              Cancel
            </button>
            <button
              onClick={handlePost}
              disabled={!body.trim()}
              style={{
                padding: "8px 22px",
                background: body.trim() ? "linear-gradient(135deg,#009439,#005822)" : "#e2e8f0",
                color: body.trim() ? "#fff" : "#a0aec0",
                border: "none", borderRadius: 8, fontSize: 13,
                fontWeight: 700, cursor: body.trim() ? "pointer" : "default",
                display: "inline-flex", alignItems: "center", gap: 6,
                boxShadow: body.trim() ? "0 2px 8px rgba(0,148,57,0.3)" : "none",
                transition: "all 0.2s",
              }}
            >
              <Send size={13} /> Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE COMPONENT
───────────────────────────────────────────── */
export default function AnnouncementsPage({ announcements, setDeleteTarget, onEdit, readOnly = false, currentUser: currentUserProp }) {
  // Falls back to the mock identity only if no logged-in admin was passed in.
  const currentUser = currentUserProp?.id ? currentUserProp : MOCK_USER;

  // Feed-local state (UI only — wire to Supabase later)
  const [feedPosts, setFeedPosts] = useState(() => announcementsToFeedPosts(announcements));

  // Keep feed in sync when prop changes
  // NOTE: In production, remove this and fetch directly from DB
  const prevLength = useRef(announcements.length);
  if (announcements.length !== prevLength.current) {
    prevLength.current = announcements.length;
    setFeedPosts(announcementsToFeedPosts(announcements));
  }

  // ── Feed handlers (UI-only) — TODO: replace body with Supabase mutations ──

  function handlePost({ title, body, priority }) {
    // TODO: await supabase.from("announcements").insert(...)
    const newPost = {
      id: `local_${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      authorInitials: currentUser.initials,
      authorPhoto: currentUser.photo,
      title,
      body,
      priority,
      createdAt: new Date().toISOString(),
      expiresAt: null,
      reactions: { "👍": [], "❤️": [], "😂": [], "😮": [], "😢": [], "😡": [] },
      comments: [],
    };
    setFeedPosts((prev) => [newPost, ...prev]);
  }

  function handleReact(postId, emoji) {
    // TODO: await supabase.from("reactions").upsert / delete
    setFeedPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const users = p.reactions[emoji] || [];
        const already = users.includes(currentUser.id);
        return {
          ...p,
          reactions: {
            ...p.reactions,
            [emoji]: already
              ? users.filter((u) => u !== currentUser.id)
              : [...users, currentUser.id],
          },
        };
      })
    );
  }

  function handleAddComment(postId, text) {
    // TODO: await supabase.from("comments").insert(...)
    const comment = {
      id: `cmt_${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      authorInitials: currentUser.initials,
      authorPhoto: currentUser.photo,
      text,
      createdAt: new Date().toISOString(),
    };
    setFeedPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
      )
    );
  }

  function handleDeleteComment(postId, commentId) {
    // TODO: await supabase.from("comments").delete().eq("id", commentId)
    setFeedPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) }
          : p
      )
    );
  }

  function handleEditComment(postId, commentId, newText) {
    // TODO: await supabase.from("comments").update({ text: newText }).eq("id", commentId)
    setFeedPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments: p.comments.map((c) => c.id === commentId ? { ...c, text: newText } : c) }
          : p
      )
    );
  }


  return (
    /* Full-width — fills the main content area, no centering cap */
    <div style={{ width: "100%" }}>
      {/* Create box */}
      <CreateAnnouncementBox currentUser={currentUser} onPost={handlePost} />

      {/* Feed */}
      {feedPosts.length === 0 ? (
        <div className={styles.empty} style={{ marginTop: 40 }}>
          <Megaphone
            size={40}
            style={{ color: "#cbd5e0", display: "block", margin: "0 auto 10px" }}
          />
          No announcements yet. Be the first to post!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {feedPosts.map((post) => (
            <FeedPostCard
  key={post.id}
  post={post}
  currentUser={currentUser}
  onReact={handleReact}
  onAddComment={handleAddComment}
  onDeleteComment={handleDeleteComment}
  onEditComment={handleEditComment}
  onEdit={(p) => {
    const original = announcements.find((a) => a.id === p.id);
    if (original) onEdit(original);
  }}
  onDelete={(p) =>
    setDeleteTarget({ id: p.id, type: "announcement", name: p.title })
  }
  readOnly={readOnly}
/>
          ))}
        </div>
      )}
    </div>
  );
}
