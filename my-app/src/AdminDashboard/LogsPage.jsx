import { Filter, RefreshCw } from "lucide-react";
import styles from "./AdminDashboard.module.css";
import { ACTION_COLORS } from "./AdminContext";

export default function LogsPage({ logs, logStats, fetchingLogs, logModuleFilter, setLogModuleFilter, logActionFilter, setLogActionFilter, onRefresh }) {
  return (
    <>
      {logStats && (
        <div className={styles.statsRow}>
          {[
            { label: "Total Logs",  value: logStats.total,   color: "#1a365d", cls: styles.statCard },
            { label: "Logins",      value: logStats.logins,  color: "#065f46", cls: `${styles.statCard} ${styles.statCardGreen}` },
            { label: "Uploads",     value: logStats.uploads, color: "#5b21b6", cls: styles.statCard },
            { label: "Creates",     value: logStats.creates, color: "#854d0e", cls: `${styles.statCard} ${styles.statCardOrange}` },
            { label: "Deletes",     value: logStats.deletes, color: "#991b1b", cls: styles.statCard },
            { label: "Failed",      value: logStats.failed,  color: "#c53030", cls: styles.statCard },
          ].map((s) => (
            <div key={s.label} className={s.cls}>
              <div className={styles.statNumber} style={{ color: s.color }}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
      <div className={styles.searchFilterBar}>
        <div className={styles.filterGroup}>
          <Filter size={15} className={styles.filterIcon} />
          <select className={styles.filterSelect} value={logModuleFilter} onChange={(e) => setLogModuleFilter(e.target.value)}>
            {["all","Auth","Ordinances","Resolutions","Officials","Announcements","Sessions","Users","Calendar"].map((m) => (
              <option key={m} value={m}>{m === "all" ? "All Modules" : m}</option>
            ))}
          </select>
          <select className={styles.filterSelect} value={logActionFilter} onChange={(e) => setLogActionFilter(e.target.value)}>
            {["all","LOGIN","LOGOUT","REGISTER","UPLOAD","CREATE","UPDATE","DELETE"].map((a) => (
              <option key={a} value={a}>{a === "all" ? "All Actions" : a}</option>
            ))}
          </select>
        </div>
      </div>
      <div className={styles.searchResultCount}>Showing {logs.length} logs</div>
      {fetchingLogs ? (
        <div className={styles.loadingBar}>Loading logs...</div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                {["Date & Time","User","Role","Action","Module","Description","IP","Status"].map((h) => (
                  <th key={h} className={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && <tr><td colSpan={8} className={styles.empty}>No logs found.</td></tr>}
              {logs.map((log, i) => {
                const ac = ACTION_COLORS[log.action] || { bg: "#f3f4f6", color: "#374151" };
                return (
                  <tr key={log.id} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                    <td className={styles.td} style={{ whiteSpace: "nowrap", color: "#64748b", fontSize: 12 }}>
                      {new Date(log.created_at).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className={styles.td} style={{ fontWeight: 600 }}>{log.user_name || "—"}</td>
                    <td className={styles.td}>
                      <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: log.user_role === "admin" ? "#dbeafe" : "#f0fdf4", color: log.user_role === "admin" ? "#1e40af" : "#166534" }}>
                        {log.user_role || "—"}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: ac.bg, color: ac.color }}>{log.action}</span>
                    </td>
                    <td className={styles.td} style={{ color: "#64748b" }}>{log.module || "—"}</td>
                    <td className={styles.td} style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>{log.description || "—"}</td>
                    <td className={styles.td} style={{ color: "#94a3b8", fontSize: 11 }}>{log.ip_address || "—"}</td>
                    <td className={styles.td}>
                      <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: log.status === "success" ? "#d1fae5" : "#fee2e2", color: log.status === "success" ? "#065f46" : "#991b1b" }}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
