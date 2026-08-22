import { Archive, KeyRound, Pencil } from "lucide-react";
import styles from "./AdminDashboard.module.css";
import { UserAvatar } from "./AdminComponents";

const SKELETON_ROWS = 5;
const SKELETON_WIDTHS = [24, 130, 110, 170, 220]; // Name, Username, Email, Action

export default function AdminsPage({ users, totalAdmins, loading, setDeleteTarget, onEdit, onResetPassword }) {
  const adminsList = users.filter((u) => u.role === "admin");

  return (
    <>
      <div className={styles.statsRow}>
        <div className={styles.statCardSolid}>
          <div className={styles.statNumberSolid}>{loading ? <span className={styles.skeletonSolid} style={{ display: "inline-block", height: 28, width: 36 }} /> : totalAdmins}</div>
          <div className={styles.statLabelSolid}>Total Admins</div>
        </div>
      </div>
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead><tr>
            <th className={styles.th}></th><th className={styles.th}>ID</th><th className={styles.th}>Name</th>
            <th className={styles.th}>Username</th><th className={styles.th}>Email</th>
            <th className={styles.th}>Action</th>
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
                  <td className={styles.td}>{u.id}</td><td className={styles.td}>{u.name}</td>
                  <td className={styles.td}>{u.username}</td><td className={styles.td}>{u.email}</td>
                  <td className={styles.td}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className={styles.editBtn} onClick={() => onEdit(u)}>
                        <Pencil size={13} /> Edit
                      </button>
                      <button className={styles.editBtn} onClick={() => onResetPassword({ id: u.id, name: u.name, email: u.email })}>
                        <KeyRound size={13} /> Reset Password
                      </button>
                      <button className={styles.deleteBtn} onClick={() => setDeleteTarget({ id: u.id, type: "user", name: u.name })}>
                        <Archive size={13} /> Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loading && adminsList.length === 0 && <div className={styles.empty}>No admins found.</div>}
      </div>
    </>
  );
}
