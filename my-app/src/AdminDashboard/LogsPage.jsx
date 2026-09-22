import { useState } from "react";
import { Filter, RefreshCw, MoreVertical } from "lucide-react";
import styles from "./AdminDashboard.module.css";
import { ACTION_COLORS, useIsMobile } from "./AdminContext";

const SKELETON_ROWS = 6;
const SKELETON_WIDTHS = [110, 100, 60, 70, 90, 160, 80, 60]; // Date, User, Role, Action, Module, Description, IP, Status

const STAT_DEFS = [
  { label: "Total Logs", key: "total", color: "#1a365d" },
  { label: "Logins", key: "logins", color: "#065f46" },
  { label: "Uploads", key: "uploads", color: "#240050" },
  { label: "Creates", key: "creates", color: "#854d0e" },
  { label: "Deletes", key: "deletes", color: "#991b1b" },
  { label: "Failed", key: "failed", color: "#c53030" },
];

export default function LogsPage({ logs, logStats, fetchingLogs, logModuleFilter, setLogModuleFilter, logActionFilter, setLogActionFilter }) {
  const isMobile = useIsMobile();
  // Which log entry's mobile "more details" menu (role/module/description/
  // IP/status) is open — the row list only has room for the action + user +
  // date at this width (see the isMobile branch below), so the rest of this
  // 8-column table lives behind this instead of forcing a horizontal scroll.
  const [openMenuId, setOpenMenuId] = useState(null);

  return (
    <>
      <div className={styles.logsStatsRow}>
        {STAT_DEFS.map((s) => (
          <div key={s.label} className={styles.logsStatCard}>
            <div className={styles.logsStatNumber} style={{ color: s.color }}>
              {fetchingLogs || !logStats
                ? <span className={styles.skeleton} style={{ display: "inline-block", height: 26, width: 34, borderRadius: 4 }} />
                : logStats[s.key]}
            </div>
            <div className={styles.logsStatLabel}>{s.label}</div>
          </div>
        ))}
      </div>
      <div className={styles.searchFilterBar}>
        <div className={styles.filterGroup}>
          <Filter size={15} className={styles.filterIcon} />
          <select className={styles.filterSelect} value={logModuleFilter} onChange={(e) => setLogModuleFilter(e.target.value)}>
            {["all","Auth","Ordinances","Resolutions","Officials","Announcements","Sessions","Session Agendas","Users","Calendar"].map((m) => (
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
      <div className={styles.tableCard}>
        {isMobile ? (
          <div className={styles.mobileRowList}>
            {fetchingLogs ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <div key={i} className={styles.mobileRowCard}>
                  <div className={styles.skeleton} style={{ height: 20, width: 50, borderRadius: 4 }} />
                  <div className={styles.mobileRowMain}>
                    <div className={styles.skeleton} style={{ height: 10, width: 60, borderRadius: 4, marginBottom: 5 }} />
                    <div className={styles.skeleton} style={{ height: 14, width: 110, borderRadius: 4 }} />
                  </div>
                  <div className={styles.skeleton} style={{ height: 32, width: 32, borderRadius: 8 }} />
                </div>
              ))
            ) : logs.length === 0 ? (
              <div className={styles.empty}>No logs found.</div>
            ) : (
              logs.map((log) => {
                const ac = ACTION_COLORS[log.action] || { bg: "#f3f4f6", color: "#374151" };
                const menuOpen = openMenuId === log.id;
                return (
                  <div key={log.id} className={styles.mobileRowCard}>
                    <span style={{ padding: "3px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700, background: ac.bg, color: ac.color, flexShrink: 0 }}>
                      {log.action}
                    </span>
                    <div className={styles.mobileRowMain}>
                      <span className={styles.mobileRowMeta}>
                        {new Date(log.created_at).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className={styles.mobileRowTitle}>{log.user_name || "—"}</span>
                    </div>
                    <div style={{ position: "relative" }}>
                      <button
                        className={styles.mobileMenuBtn}
                        onClick={() => setOpenMenuId(menuOpen ? null : log.id)}
                        aria-label="More details"
                      >
                        <MoreVertical size={16} />
                      </button>
                      {menuOpen && (
                        <>
                          <div className={styles.mobileMenuBackdrop} onClick={() => setOpenMenuId(null)} />
                          <div className={styles.mobileMenu}>
                            <div className={styles.mobileMenuRow}>
                              <span>Role</span>
                              <span>{log.user_role || "—"}</span>
                            </div>
                            <div className={styles.mobileMenuRow}>
                              <span>Module</span>
                              <span>{log.module || "—"}</span>
                            </div>
                            <div className={styles.mobileMenuRow}>
                              <span>IP</span>
                              <span>{log.ip_address || "—"}</span>
                            </div>
                            <div className={styles.mobileMenuRow}>
                              <span>Status</span>
                              <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: log.status === "success" ? "#d1fae5" : "#fee2e2", color: log.status === "success" ? "#065f46" : "#991b1b" }}>
                                {log.status}
                              </span>
                            </div>
                            {log.description && (
                              <div style={{ marginTop: 6, paddingTop: 6, borderTop: "1px solid #f1f5f9", fontSize: 12, color: "#64748b" }}>
                                {log.description}
                              </div>
                            )}
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
          <thead>
            <tr>
              {["Date & Time","User","Role","Action","Module","Description","IP","Status"].map((h) => (
                <th key={h} className={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fetchingLogs ? (
              Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <tr key={i} className={i % 2 === 0 ? styles.rowEven : styles.rowOdd}>
                  {SKELETON_WIDTHS.map((w, j) => (
                    <td key={j} className={styles.td}>
                      <div className={styles.skeleton} style={{ height: 14, width: w, borderRadius: 4 }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <>
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
                        <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: log.user_role === "admin" ? "#dbeafe" : "#eef2ff", color: log.user_role === "admin" ? "#1e40af" : "#380075" }}>
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
              </>
            )}
          </tbody>
        </table>
        )}
      </div>
    </>
  );
}
