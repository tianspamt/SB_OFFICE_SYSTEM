// Shared review-workflow logic for Ordinances/Resolutions/Sessions (and, for
// the comment thread, PendingRecordsWidget too). These four places used to
// carry near-identical copies of this code — a behavior change had to be
// hand-applied in each one, which is exactly how the Pending tab's loading
// flag went dead in three of the four without anyone noticing.
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { API, authFetch, publishedQueryKey, fetchPublishedList, useModalError } from "./AdminContext";

// The three readings an ordinance/resolution draft goes through in session
// (RA 7160), inserted into the state machine as three more `status` values
// between "Secretary accepted" and "ready for Vice-Mayor" — Accept now lands
// here instead of jumping straight to ready_to_publish, and the Secretary
// walks it the rest of the way one status at a time (see OrdinancesPage/
// ResolutionsPage's handleAdvanceReading). session_minutes has no reading
// requirement and never enters these statuses — its Accept still jumps
// straight to ready_to_publish, same as before. Deliberately kept in the
// Pending tab's bucket (below) rather than Ready to Publish's — a record
// mid-reading hasn't been approved by anyone yet, it's still Secretary's to
// keep moving, same as a fresh pending draft.
export const READING_STATUSES = ["first_reading", "second_reading", "third_reading"];

// Role-aware pending queue — strictly "still needs review/fixing/advancing"
// work: pending (awaiting Secretary's first look) and, for Secretary only,
// the three reading statuses too (advancing a reading is Secretary's job,
// same bucket as accepting/rejecting), plus needs_revision (sent back,
// awaiting a fix) for Clerk/Councilor/Vice-Mayor, who draft/fix records —
// Secretary doesn't fix drafts themselves so they don't need that slice.
// ready_to_publish and approved never appear here — once Vice-Mayor accepts
// a record into the ready_to_publish bucket, it moves to its own tab (see
// READY_TO_PUBLISH_STATUSES below) and stays there, through approved, until
// it's published — never back in Pending.
export const pendingStatusesForRole = ({ isSecretary }) => {
  if (isSecretary) return ["pending", ...READING_STATUSES].join(",");
  return "pending,needs_revision";
};

// Broader than pendingStatusesForRole above — this is "every status the
// given role can currently act on", used by the dashboard's "Needs your
// review" widget (a cross-module action list, not a tab), not the Pending
// tab itself. Secretary needs pending (accept/reject), the three reading
// statuses (advance-reading), and approved (publish); Vice-Mayor needs
// ready_to_publish (approve); Clerk/Councilor's only actionable slice is the
// same one Pending shows them — they can't act on a record mid-reading.
export const actionableStatusesForRole = ({ isSecretary, isViceMayor }) => {
  if (isSecretary) return ["pending", ...READING_STATUSES, "approved"].join(",");
  if (isViceMayor) return "ready_to_publish";
  return "pending,needs_revision";
};

// The tail of the pipeline — split into its own tab (next to Pending) on
// Ordinances/Resolutions/Sessions instead of being buried inside
// Vice-Mayor's Pending tab, which used to show only ready_to_publish under
// a confusingly generic "Pending" label. Covers ready_to_publish
// (Vice-Mayor's approval queue) and approved (Secretary's publish queue,
// once Vice-Mayor approves) so a record doesn't disappear from this tab the
// moment it's approved — the Publish button just becomes available where
// the Approve button was. isLockedStatus below gates the read-only
// behavior (no edit/comment/archive) that applies to both statuses here,
// and to the three reading statuses too even though those stay in Pending.
export const READY_TO_PUBLISH_STATUSES = "ready_to_publish,approved";
export const isLockedStatus = (status) =>
  READING_STATUSES.includes(status) ||
  status === "ready_to_publish" ||
  status === "approved" ||
  status === "rejected";

// Terminal — a Secretary rejected the record while it was mid-reading (see
// PUT /:id/reject). Unlike needs_revision (pending → needs_revision →
// pending), there's no path back into the pipeline; the record just stays
// visible as a record of the rejection. The backend scopes who can browse
// it via GET ?status=rejected: the Secretary sees every rejected record,
// everyone else only their own (see routes/ordinances.js and
// resolutions.js), so this same query works as both "my rejected records"
// and "all rejected records" depending on who's asking.
export const REJECTED_STATUS = "rejected";

// Shared Published-tab fetch, used identically by OrdinancesPage/
// ResolutionsPage/SessionsPage — each page still builds its own `params`
// (page/limit always, search/year/type only when actually set — the exact
// filter shape differs slightly per page, e.g. Sessions has a `type` filter
// the other two don't) but the query/cache/invalidate mechanics around it
// were three near-identical copies, so those live here now.
//
// `resyncOn` should be the page's own full record-list prop (ordinances/
// resolutions/sessionMinutes) — re-invalidating when it changes is the only
// signal this tab gets that an edit made outside its own review workflow
// (e.g. via the Dashboard's Edit modal) might have changed the current
// page's contents.
// Suggests the official number in the Publish dialog by reading the record's
// stored file (POST /api/{route}/:id/detect-meta — the same detection the
// upload form uses, so drafts uploaded without a number still get one).
// `detect(id, onFound)` starts a read and calls `onFound(data)` if it turns
// up a number or an approved date; `reset()` drops any read still in flight, so a slow scan
// finishing after the dialog moved on to another record can't touch it.
// `detected` is null | { status: "reading" } | { status: "error", message }
// | { status: "done", data }.
export function usePublishNumberDetection(route) {
  const [detected, setDetected] = useState(null);
  const seq = useRef(0);

  const reset = () => {
    seq.current++;
    setDetected(null);
  };

  const detect = async (id, onFound) => {
    const mine = ++seq.current;
    setDetected({ status: "reading" });
    try {
      const res = await authFetch(`${API}/api/${route}/${id}/detect-meta`, { method: "POST" });
      const data = await res.json();
      if (mine !== seq.current) return;
      if (!res.ok || !data.success) {
        setDetected({ status: "error", message: data.error });
        return;
      }
      setDetected({ status: "done", data: data.data });
      if (data.data.number || data.data.date) onFound?.(data.data);
    } catch {
      if (mine === seq.current) {
        setDetected({ status: "error", message: "Couldn't read the document automatically." });
      }
    }
  };

  return { detected, detect, reset };
}

export function useLegislativePublished(route, params, resyncOn) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: publishedQueryKey(route, params),
    queryFn: () => fetchPublishedList(route, params),
    staleTime: 30000,
  });

  const refreshPublished = () =>
    queryClient.invalidateQueries({ queryKey: ["published", route] });

  useEffect(() => {
    refreshPublished();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resyncOn]);

  return {
    publishedList: data?.data ?? [],
    publishedTotal: data?.total ?? 0,
    publishedTotalPages: data?.totalPages ?? 1,
    fetchingPublished: isLoading,
    refreshPublished,
  };
}

// Resets `setState(resetValue)` whenever any value in `deps` changes — the
// render-time equivalent of a `useEffect(() => setState(x), deps)` "adjust
// state when a prop changes" effect (see
// https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes).
// Doing it during render instead of after commit avoids an extra render
// pass, and is what react-hooks' set-state-in-effect rule expects instead
// of the effect version. Used identically by all three Published tabs to
// reset back to page 1 whenever a search/year/type filter changes.
export function useResetOnChange(deps, setState, resetValue) {
  const key = JSON.stringify(deps);
  const [seenKey, setSeenKey] = useState(key);
  if (key !== seenKey) {
    setSeenKey(key);
    setState(resetValue);
  }
}

// Deep-link support: the Dashboard's "Needs your review" widget can jump a
// module straight into its Pending tab via `initialSubTab` instead of
// landing on the default Published tab. Same render-time-adjustment
// pattern as useResetOnChange above, specialized for "sync a piece of
// state to a prop, but only into it, not out of it" — an empty/falsy
// initialSubTab shouldn't force the tab back to the default once the user
// has already navigated away from wherever the deep link landed them.
//
// The initial `activeTab` is seeded from `initialSubTab` (falling back to
// `defaultTab`) rather than always starting at `defaultTab` — the page
// mounts fresh on every deep-link navigation (see AdminDashboard's
// conditional tab rendering), so "the prop is already set on the very
// first render" is the common case here, not a later change. Seeding
// `seenSubTab` from the same value is what makes that first render a
// correctly-skipped no-op adjustment rather than a redundant extra set.
export function useDeepLinkedTab(defaultTab, initialSubTab) {
  const [activeTab, setActiveTab] = useState(initialSubTab || defaultTab);
  const [seenSubTab, setSeenSubTab] = useState(initialSubTab);
  if (initialSubTab !== seenSubTab) {
    setSeenSubTab(initialSubTab);
    if (initialSubTab) setActiveTab(initialSubTab);
  }
  return [activeTab, setActiveTab];
}

// Owns the "currently open record" + the approve/reject/publish/replace-file
// action runner used by the View Draft modal on Ordinances/Resolutions/
// Sessions. `onRefresh` is called after every successful action (each page
// passes its own refreshAll, which re-pulls the pending queue).
//
// `successMsg` backs a blocking confirmation (rendered by each page as a
// <ConfirmModal type="success">, same as the upload/archive/save/update
// confirmations elsewhere) for actions that otherwise gave zero feedback —
// Accept, Request Changes, and Vice-Mayor's Approve all just quietly
// updated the status in place before this. Pass a 4th `successMsg` arg to
// runAction only for actions that should show one; omitting it (Publish,
// replace-file/revise, etc.) leaves this alone.
export function useReviewWorkflow({ onRefresh } = {}) {
  const [viewTarget, setViewTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, showError, clearError] = useModalError();
  const [successMsg, setSuccessMsg] = useState("");

  const runAction = async (url, options, applyUpdate, successMsg) => {
    setSubmitting(true);
    clearError();
    try {
      const res = await authFetch(`${API}${url}`, options);
      const data = await res.json();
      if (res.ok && data.success) {
        setViewTarget((prev) => (prev ? { ...prev, ...applyUpdate(data.data) } : prev));
        onRefresh?.();
        if (successMsg) setSuccessMsg(successMsg);
        return true;
      }
      showError(data.error || "Action failed.");
      return false;
    } catch {
      showError("Server error.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    viewTarget, setViewTarget, submitting, error, setError: showError,
    successMsg, clearSuccessMsg: () => setSuccessMsg(""), runAction,
  };
}

// Comment thread fetch/post, generic over entity type so PendingRecordsWidget
// (which reviews ordinances/resolutions/session_minutes from one shared
// modal) can use it too, not just the three single-type pages.
export function useCommentThread() {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async (entityType, entityId) => {
    setLoadingComments(true);
    try {
      const res = await authFetch(`${API}/api/comments?entity_type=${entityType}&entity_id=${entityId}`);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  // Returns { ok, error? } instead of throwing, so callers can clear their
  // own text input on success or surface `error` however they already do.
  const sendComment = async (entityType, entityId, text) => {
    if (!text?.trim()) return { ok: false };
    setSubmitting(true);
    try {
      const res = await authFetch(`${API}/api/comments`, {
        method: "POST",
        body: JSON.stringify({ entity_type: entityType, entity_id: entityId, text: text.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Refetch rather than appending the raw response locally — the
        // POST body isn't shaped like a list item (no joined author info),
        // so appending it directly would render with a blank author until
        // the thread was reloaded some other way.
        await fetchComments(entityType, entityId);
        return { ok: true };
      }
      return { ok: false, error: data.error || "Failed to add comment." };
    } catch {
      return { ok: false, error: "Server error." };
    } finally {
      setSubmitting(false);
    }
  };

  const resetComments = () => setComments([]);

  return { comments, loadingComments, commentSubmitting: submitting, fetchComments, sendComment, resetComments };
}
