import { useEffect, useState } from "react";

// A module's sub-tab (Ordinances → Pending, Content → Trivia, …) lives in the
// address next to the module itself (/dashboard?tab=ordinances&sub=pending),
// so a page refresh reopens the same sub-tab — same idea as ?tab= in
// AdminDashboard.jsx. The default sub-tab is left out of the address.

// The sub-tab in the address, if it's one this page (and this account) may
// show; otherwise null.
export function readUrlSubTab(allowed) {
  const value = new URLSearchParams(window.location.search).get("sub");
  return allowed && allowed.includes(value) ? value : null;
}

function writeUrlSubTab(value) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set("sub", value);
  else url.searchParams.delete("sub");
  if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
}

// Keeps ?sub= in step with `tab`. Leaving the module (the page unmounts)
// clears it, so the next module doesn't inherit another module's sub-tab.
export function useSyncSubTabToUrl(tab, defaultTab) {
  useEffect(() => {
    writeUrlSubTab(tab === defaultTab ? null : tab);
    return () => writeUrlSubTab(null);
  }, [tab, defaultTab]);
}

// useState for a sub-tab that survives a refresh.
export function useUrlSubTab(defaultTab, allowed) {
  const [tab, setTab] = useState(() => readUrlSubTab(allowed) || defaultTab);
  useSyncSubTabToUrl(tab, defaultTab);
  return [tab, setTab];
}
