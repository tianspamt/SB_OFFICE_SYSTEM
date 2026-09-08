import { useState } from "react";
import { Archive, KeyRound, Pencil, MoreVertical } from "lucide-react";
import styles from "./AdminDashboard.module.css";
import { UserAvatar } from "./AdminComponents";
import { useIsMobile, truncateText } from "./AdminContext";

const SKELETON_ROWS = 5;
const SKELETON_WIDTHS = [24, 130, 110, 170, 220]; // Name, Username, Email, Action

export default function AdminsPage({ users, totalAdmins, loading, setDeleteTarget, onEdit, onResetPassword }) {
  const adminsList = users.filter((u) => u.role === "admin");
  const isMobile = useIsMobile();
  // Which admin's mobile "more details" menu (username/email) is open — the
  // row list only has room for ID + name at this width (see the isMobile
  // branch below), so everything else lives behind this.
  const [openMenuId, setOpenMenuId] = useState(null);

  return (
    <>
      <div className={styles.statsRow}>
        <div className={styles.statCardSolid}>
          <div className={styles.statNumberSolid}>{loading ? <span className={styles.skeletonSolid} style={{ display: "inline-block", height: 28, width: 36 }} /> : totalAdmins}</div>
          <div className={styles.statLabelSolid}>Total Admins</div>
        </div>
      </div>
      <div className={styles.tableCard}>
        {isMobile ? (
          <div className={styles.mobileRowList}>
            {loading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <div key={i} className={styles.mobileRowCard}>
                  <div className={styles.skeleton} style={{ height: 30, width: 30, borderRadius: "50%" }} />
                  <div className={styles.mobileRowMain}>
                    <div className={styles.skeleton} style={{ height: 10, width: 30, borderRadius: 4, marginBottom: 5 }} />
                    <div className={styles.skeleton} style={{ height: 14, width: 130, borderRadius: 4 }} />
                  </div>
                  <div className={styles.skeleton} style={{ height: 32, width: 32, borderRadius: 8 }} />
                </div>
              ))
            ) : adminsList.length === 0 ? (
              <div className={styles.empty}>No admins found.</div>
            ) : (
              adminsList.map((u) => {
                const menuOpen = openMenuId === u.id;
                return (
                  <div key={u.id} className={styles.mobileRowCard}>
                    <span className={styles.mobileRowIdBadge}>{u.id}</span>
                    <div className={styles.mobileRowMain}>
                      <span className={styles.mobileRowTitle}>{u.name}</span>
                    </div>
                    <button
                      className={`${styles.mobileIconBtn} ${styles.mobileIconBtnWarning}`}
                      onClick={() => onEdit(u)}
                      aria-label="Edit"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className={`${styles.mobileIconBtn} ${styles.mobileIconBtnWarning}`}
                      onClick={() => onResetPassword({ id: u.id, name: u.name, email: u.email })}
                      aria-label="Reset password"
                      title="Reset password"
                    >
                      <KeyRound size={15} />
                    </button>
                    <button
                      className={`${styles.mobileIconBtn} ${styles.mobileIconBtnDanger}`}
                      onClick={() => setDeleteTarget({ id: u.id, type: "user", name: u.name })}
                      aria-label="Archive"
                      title="Archive"
                    >
                      <Archive size={15} />
                    </button>
                    <div style={{ position: "relative" }}>
                      <button
                        className={styles.mobileMenuBtn}
                        onClick={() => setOpenMenuId(menuOpen ? null : u.id)}
                        aria-label="More details"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {menuOpen && (
                        <>
                          <div className={styles.mobileMenuBackdrop} onClick={() => setOpenMenuId(null)} />
                          <div className={styles.mobileMenu}>
                            <div className={styles.mobileMenuRow}>
                              <span>Username</span>
                              <span>{u.username}</span>
                            </div>
                            <div className={styles.mobileMenuRow}>
                              <span>Email</span>
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                                {u.email}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
        <table className={styles.table}>
          <thead><tr>
            <th className={styles.th}></th><th className={styles.th}>ID</th><th className={styles.th}>Name</th>
            <th className={styles.th}>Username</th><th className={styles.th}>Email</th>
            <th className={`${styles.th} ${styles.thSticky}`}>Action</th>
          </tr></thead>
          <tbody>
            {loading ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <tr key={i} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <td className={styles.td}><div className={styles.skeleton} style={{ height: 30, width: 30, borderRadius: "50%" }} /></td>
                  {SKELETON_WIDTHS.map((w, j) => (
                    <td key={j} className={styles.td}>
                      <div className={styles.skeleton} style={{ height: 14, width: w, borderRadius: 4 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              adminsList.map((u, i) => (
                <tr key={u.id} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  <td className={styles.td}><UserAvatar name={u.name} photo={u.photo} size={30} /></td>
                  <td className={styles.td}>{u.id}</td>
                  <td className={styles.td}>{u.name}</td>
                  <td className={`${styles.td} ${styles.tdTruncate}`} title={u.username}>{truncateText(u.username, 15)}</td>
                  <td className={styles.td}>{u.email}</td>
                  <td className={`${styles.td} ${styles.tdSticky}`}>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button className={styles.editBtn} style={{ padding: "5px 9px", fontSize: 12 }} onClick={() => onEdit(u)}>
                        <Pencil size={12} /> Edit
                      </button>
                      <button
                        className={styles.editBtn}
                        style={{ padding: "5px 9px", fontSize: 12 }}
                        title="Reset Password"
                        onClick={() => onResetPassword({ id: u.id, name: u.name, email: u.email })}
                      >
                        <KeyRound size={12} /> Reset
                      </button>
                      <button className={styles.deleteBtn} style={{ padding: "5px 9px", fontSize: 12 }} onClick={() => setDeleteTarget({ id: u.id, type: "user", name: u.name })}>
                        <Archive size={12} /> Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        )}
        {!isMobile && !loading && adminsList.length === 0 && <div className={styles.empty}>No admins found.</div>}
      </div>
    </>
  );
}
