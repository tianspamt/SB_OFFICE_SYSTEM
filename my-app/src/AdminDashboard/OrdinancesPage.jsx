import { useState } from "react";
import {
  Search,
  X,
  Filter,
  Eye,
  Pencil,
  Trash2,
  FileText,
  Image,
  CalendarDays,
} from "lucide-react";
import styles from "./AdminDashboard.module.css";
import { API } from "./AdminContext";

export default function OrdinancesPage({
  ordinances,
  setDeleteTarget,
  onEdit,
}) {
  const [ordinanceSearch, setOrdinanceSearch] = useState("");
  const [ordinanceTypeFilter, setOrdinanceTypeFilter] = useState("all");
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const getFileUrl = (filepath) =>
    `${SUPABASE_URL}/storage/v1/object/public/assets/${filepath}`;

  const filteredOrdinances = ordinances.filter((o) => {
    const s =
      (o.title || "").toLowerCase().includes(ordinanceSearch.toLowerCase()) ||
      (o.ordinance_number || "")
        .toLowerCase()
        .includes(ordinanceSearch.toLowerCase());
    const t =
      ordinanceTypeFilter === "all"
        ? true
        : ordinanceTypeFilter === "pdf"
          ? o.filetype === "application/pdf"
          : o.filetype?.startsWith("image");
    return s && t;
  });

  return (
    <>
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{ordinances.length}</div>
          <div className={styles.statLabel}>Total Ordinances</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardGreen}`}>
          <div className={styles.statNumber}>
            {ordinances.filter((o) => o.filetype === "application/pdf").length}
          </div>
          <div className={styles.statLabel}>PDF Files</div>
        </div>
        <div className={`${styles.statCard} ${styles.statCardOrange}`}>
          <div className={styles.statNumber}>
            {ordinances.filter((o) => o.filetype?.startsWith("image")).length}
          </div>
          <div className={styles.statLabel}>Image / OCR</div>
        </div>
      </div>
      <div className={styles.searchFilterBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search by title or number..."
            value={ordinanceSearch}
            onChange={(e) => setOrdinanceSearch(e.target.value)}
          />
          {ordinanceSearch && (
            <button
              className={styles.clearSearch}
              onClick={() => setOrdinanceSearch("")}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className={styles.filterGroup}>
          <Filter size={15} className={styles.filterIcon} />
          {["all", "pdf", "image"].map((t) => (
            <button
              key={t}
              className={`${styles.filterBtn} ${ordinanceTypeFilter === t ? styles.filterBtnActive : ""}`}
              onClick={() => setOrdinanceTypeFilter(t)}
            >
              {t === "all" ? "All" : t === "pdf" ? "PDF" : "Image / OCR"}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.searchResultCount}>
        Showing {filteredOrdinances.length} of {ordinances.length} ordinances
      </div>
      <div className={styles.ordinanceList}>
        {filteredOrdinances.map((o) => (
          <div key={o.id} className={styles.ordinanceCard}>
            <div className={styles.ordinancePreview}>
              {o.filetype === "application/pdf" ? (
                <div className={styles.pdfIcon}>
                  <FileText size={28} strokeWidth={1.2} />
                </div>
              ) : (
                <img
                  src={getFileUrl(o.filepath)}
                  alt={o.title}
                  className={styles.ordinanceThumb}
                />
              )}
            </div>
            <div className={styles.ordinanceInfo}>
              <div className={styles.ordinanceNumber}>
                {o.ordinance_number || "—"}
              </div>
              <div className={styles.ordinanceTitle}>{o.title}</div>
              {o.year && (
                <div className={styles.ordinanceYear}>
                  <CalendarDays size={13} strokeWidth={1.5} /> {o.year}
                </div>
              )}
              <div className={styles.ordinanceFileType}>
                {o.filetype === "application/pdf" ? (
                  <>
                    <FileText size={12} strokeWidth={1.5} /> PDF
                  </>
                ) : (
                  <>
                    <Image size={12} strokeWidth={1.5} /> Image to Text
                  </>
                )}
              </div>
              <div className={styles.ordinanceOfficialsList}>
                <span className={styles.officialsPassedLabel}>
                  Council Members who passed:
                </span>
                <div className={styles.officialAvatarRow}>
                  {o.officials && o.officials.length > 0 ? (
                    o.officials.map((off) => (
                      <div key={off.id} className={styles.officialChip}>
                        {off.photo ? (
                          <img
                            src={off.photo}
                            alt={off.full_name}
                            className={styles.chipPhoto}
                          />
                        ) : (
                          <div className={styles.chipAvatar}>
                            {off.full_name.charAt(0)}
                          </div>
                        )}
                        <span className={styles.chipName}>{off.full_name}</span>
                      </div>
                    ))
                  ) : (
                    <span className={styles.noOfficials}>
                      No members tagged
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.ordinanceActions}>
              <a
                href={`${API}/api/ordinances/${o.id}/print`}
                target="_blank"
                rel="noreferrer"
                className={styles.viewBtn}
              >
                <Eye size={13} /> View
              </a>
              <button className={styles.editBtn} onClick={() => onEdit(o)}>
                <Pencil size={13} /> Edit
              </button>
              <button
                className={styles.deleteBtn}
                onClick={() =>
                  setDeleteTarget({
                    id: o.id,
                    type: "ordinance",
                    name: o.title,
                  })
                }
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>
        ))}
        {filteredOrdinances.length === 0 && (
          <div className={styles.empty}>
            {ordinanceSearch || ordinanceTypeFilter !== "all"
              ? "No ordinances match your search."
              : "No ordinances uploaded yet."}
          </div>
        )}
      </div>
    </>
  );
}
