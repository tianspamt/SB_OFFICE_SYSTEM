// Shared review-workflow logic for Ordinances/Resolutions/Sessions (and, for
// the comment thread, PendingRecordsWidget too). These four places used to
// carry near-identical copies of this code — a behavior change had to be
// hand-applied in each one, which is exactly how the Pending tab's loading
// flag went dead in three of the four without anyone noticing.
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { API, authFetch, publishedQueryKey, fetchPublishedList } from "./AdminContext";

// Role-aware pending queue: Secretary/Vice-Mayor only see the slice they
// act on; Clerk/Councilor draft across the whole pending bucket, so they
// get the same full scope as the generic fallback.
export const pendingStatusesForRole = ({ isSecretary, isViceMayor }) => {
  if (isSecretary) return "pending,approved";
  if (isViceMayor) return "ready_to_publish";
  return "pending,needs_revision,ready_to_publish,approved";
};

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
export function useReviewWorkflow({ onRefresh } = {}) {
  const [viewTarget, setViewTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const runAction = async (url, options, applyUpdate) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await authFetch(`${API}${url}`, options);
      const data = await res.json();
      if (res.ok && data.success) {
        setViewTarget((prev) => (prev ? { ...prev, ...applyUpdate(data.data) } : prev));
        onRefresh?.();
        return true;
      }
      setError(data.error || "Action failed.");
      return false;
    } catch {
      setError("Server error.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { viewTarget, setViewTarget, submitting, error, setError, runAction };
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
