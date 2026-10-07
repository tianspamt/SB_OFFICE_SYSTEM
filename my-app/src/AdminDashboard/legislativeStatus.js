/**
 * legislativeStatus.js
 * Status labels for ordinances/resolutions, shared by StatusBadge
 * (LegislativeComponents.jsx) and the pages. Kept out of the components file
 * so that file exports only components (React Fast Refresh requirement).
 */

import styles from "./LegislativeModule.module.css";
import { READING_STATUSES } from "./useLegislativeReview";

export const STATUS_MAP = {
  pending: { label: "● Pending Review", cls: styles.statusPending },
  needs_revision: { label: "Needs Revision", cls: styles.statusRejected },
  first_reading: { label: "First Reading", cls: styles.statusApproved },
  second_reading: { label: "Second Reading", cls: styles.statusApproved },
  third_reading: { label: "Third Reading", cls: styles.statusApproved },
  ready_to_publish: { label: "Ready to Publish", cls: styles.statusApproved },
  approved: { label: "VM Approved", cls: styles.statusApproved },
  rejected: { label: "Rejected", cls: styles.statusRejected },
  published: { label: "● Published", cls: styles.statusPublished },
};

// Plain-text version of the same label (no pill/border) — for spots like the
// View modal's meta cards where Status needs to read like Year/Uploaded's
// plain bold text, not a colored badge.
export function statusLabel(status) {
  const s = STATUS_MAP[status] || STATUS_MAP.pending;
  return s.label.replace(/^●\s*/, "");
}

// Label for the Secretary's action button while an ordinance/resolution is
// mid-reading (see READING_STATUSES) — walks first_reading -> second_reading
// -> third_reading -> "send to the Vice-Mayor", matching what PUT
// /:id/advance-reading actually does at each step. Returns null for any
// other status, so callers can use it directly as a render guard.
export function nextReadingActionLabel(status) {
  const idx = READING_STATUSES.indexOf(status);
  if (idx === -1) return null;
  if (idx === READING_STATUSES.length - 1) return "Send for VM Approval";
  return `Mark ${statusLabel(READING_STATUSES[idx + 1])}`;
}
