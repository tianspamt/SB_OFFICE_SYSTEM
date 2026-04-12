import { useState } from "react";
import { Search, X, Filter, Eye, Pencil, Trash2, FileText, Image, CalendarDays } from "lucide-react";
import styles from "./AdminDashboard.module.css";
import { API } from "./AdminContext";

export default function ResolutionsPage({ resolutions, setDeleteTarget, onEdit }) {
  const [resolutionSearch, setResolutionSearch] = useState("");
  const [resolutionTypeFilter, setResolutionTypeFilter] = useState("all");

  const filteredResolutions = resolutions.filter((r) => {
    const s = (r.title || "").toLowerCase().includes(resolutionSearch.toLowerCase()) ||
      (r.resolution_number || "").toLowerCase().includes(resolutionSearch.toLowerCase());
    const t = resolutionTypeFilter === "all" ? true : resolutionTypeFilter === "pdf"
      ? r.filetype === "application/pdf" : r.filetype?.startsWith("image");
    return s && t;
  });

  return (
    <>
      <div className={styles.statsRow}>
        <div className={styles.statCard}><div className={styles.statNumber}>{resolutions.length}</div><div className={styles.statLabel}>Total Resolutions</div></div>
        <div className={`${styles.statCard} ${styles.statCardGreen}`}><div className={styles.statNumber}>{resolutions.filter((r) => r.filetype === "application/pdf").length}</div><div className={styles.statLabel}>PDF Files</div></div>
        <div className={`${styles.statCard} ${styles.statCardOrange}`}><div className={styles.statNumber}>{resolutions.filter((r) => r.filetype?.startsWith("image")).length}</div><div className={styles.statLabel}>Image / OCR</div></div>
      </div>
      <div className={styles.searchFilterBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input className={styles.searchInput} placeholder="Search by title or resolution number..." value={resolutionSearch} onChange={(e) => setResolutionSearch(e.target.value)} />
          {resolutionSearch && <button className={styles.clearSearch} onClick={() => setResolutionSearch("")}><X size={14} /></button>}
        </div>
        <div className={styles.filterGroup}>
          <Filter size={15} className={styles.filterIcon} />
          {["all", "pdf", "image"].map((t) => (
            <button key={t} className={`${styles.filterBtn} ${resolutionTypeFilter === t ? styles.filterBtnActive : ""}`} onClick={() => setResolutionTypeFilter(t)}>
              {t === "all" ? "All" : t === "pdf" ? "PDF" : "Image / OCR"}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.searchResultCount}>Showing {filteredResolutions.length} of {resolutions.length} resolutions</div>
      <div className={styles.ordinanceList}>
        {filteredResolutions.map((r) => (
          <div key={r.id} className={styles.ordinanceCard}>
            <div className={styles.ordinancePreview}>
              {r.filetype === "application/pdf"
                ? <div className={styles.pdfIcon}><FileText size={28} strokeWidth={1.2} /></div>
                : <img src={r.filepath} alt={r.title} className={styles.ordinanceThumb} />}
            </div>
            <div className={styles.ordinanceInfo}>
              <div className={styles.ordinanceNumber}>{r.resolution_number || "—"}</div>
              <div className={styles.ordinanceTitle}>{r.title}</div>
              {r.year && <div className={styles.ordinanceYear}><CalendarDays size={13} strokeWidth={1.5} /> {r.year}</div>}
              <div className={styles.ordinanceFileType}>
                {r.filetype === "application/pdf" ? <><FileText size={12} strokeWidth={1.5} /> PDF</> : <><Image size={12} strokeWidth={1.5} /> Image to Text</>}
              </div>
              <div className={styles.ordinanceOfficialsList}>
                <span className={styles.officialsPassedLabel}>Council Members who passed:</span>
                <div className={styles.officialAvatarRow}>
                  {r.officials && r.officials.length > 0 ? r.officials.map((off) => (
                    <div key={off.id} className={styles.officialChip}>
                      {off.photo ? <img src={off.photo} alt={off.full_name} className={styles.chipPhoto} /> : <div className={styles.chipAvatar}>{off.full_name.charAt(0)}</div>}
                      <span className={styles.chipName}>{off.full_name}</span>
                    </div>
                  )) : <span className={styles.noOfficials}>No members tagged</span>}
                </div>
              </div>
            </div>
            <div className={styles.ordinanceActions}>
              <a href={r.extracted_text ? `${API}/api/resolutions/${r.id}/print` : r.filepath} target="_blank" rel="noreferrer" className={styles.viewBtn}><Eye size={13} /> View</a>
              <button className={styles.editBtn} onClick={() => onEdit(r)}><Pencil size={13} /> Edit</button>
              <button className={styles.deleteBtn} onClick={() => setDeleteTarget({ id: r.id, type: "resolution", name: r.title })}><Trash2 size={13} /> Delete</button>
            </div>
          </div>
        ))}
        {filteredResolutions.length === 0 && <div className={styles.empty}>{resolutionSearch || resolutionTypeFilter !== "all" ? "No resolutions match your search." : "No resolutions uploaded yet."}</div>}
      </div>
    </>
  );
}
