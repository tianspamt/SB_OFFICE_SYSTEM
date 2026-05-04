import { ImagePlus } from "lucide-react";
import styles from "../AdminDashboard.module.css";
import { COPY } from "./constants";

export function ContentEmptyState({ filtered }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>
        <ImagePlus size={40} strokeWidth={1.2} />
      </div>
      <h3>{filtered ? COPY.emptyFiltered : COPY.emptyTitle}</h3>
      <p>{filtered ? COPY.emptyFilteredHint : COPY.emptyHint}</p>
    </div>
  );
}
