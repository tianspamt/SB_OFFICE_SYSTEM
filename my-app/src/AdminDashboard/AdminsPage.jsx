import { Archive, Pencil } from "lucide-react";
import styles from "./AdminDashboard.module.css";
import { UserAvatar } from "./AdminComponents";

export default function AdminsPage({ users, setDeleteTarget, onEdit }) {
  const totalAdmins = users.filter((u) => u.role === "admin").length;

  return (
    <>
      <div className={styles.statsRow}>
        <div className={styles.statCard}><div className={styles.statNumber}>{totalAdmins}</div><div className={styles.statLabel}>Total Admins</div></div>
      </div>
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead><tr>
            <th className={styles.th}></th><th className={styles.th}>ID</th><th className={styles.th}>Name</th>
            <th className={styles.th}>Username</th><th className={styles.th}>Email</th>
            <th className={styles.th}>Action</th>
          </tr></thead>
          <tbody>
            {users.filter((u) => u.role === "admin").map((u, i) => (
              <tr key={u.id} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                <td className={styles.td}><UserAvatar name={u.name} photo={u.photo} size={30} /></td>
                <td className={styles.td}>{u.id}</td><td className={styles.td}>{u.name}</td>
                <td className={styles.td}>{u.username}</td><td className={styles.td}>{u.email}</td>
                <td className={styles.td}>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className={styles.editBtn} onClick={() => onEdit(u)}>
                      <Pencil size={13} /> Edit
                    </button>
                    <button className={styles.deleteBtn} onClick={() => setDeleteTarget({ id: u.id, type: "user", name: u.name })}>
                      <Archive size={13} /> Archive
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.filter((u) => u.role === "admin").length === 0 && <div className={styles.empty}>No admins found.</div>}
      </div>
    </>
  );
}
