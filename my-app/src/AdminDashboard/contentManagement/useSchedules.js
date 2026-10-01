import { useState, useEffect, useCallback } from "react";
import { API, authFetch, extractErrorMsg, useAutoRefresh } from "../AdminContext";

export function useSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  // `silent` is the background auto-refresh: no spinner, and a failed
  // attempt leaves the current list (and any error) as it was.
  const fetchSchedules = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
      setFetchError("");
    }
    try {
      const res = await authFetch(`${API}/api/schedules/all`);
      const data = await res.json();
      if (!res.ok) throw new Error(extractErrorMsg(data, "Failed to load schedules."));
      setSchedules(Array.isArray(data) ? data : []);
    } catch (err) {
      if (silent) return;
      setFetchError(err.message || "Failed to load schedules. Please refresh.");
      setSchedules([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);
  useAutoRefresh(() => fetchSchedules({ silent: true }));

  const saveSchedule = useCallback(async (editTarget, form) => {
    if (editTarget) {
      const res = await authFetch(`${API}/api/schedules/${editTarget.id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(extractErrorMsg(data, "Failed to update schedule."));
      setSchedules((prev) => prev.map((s) => (s.id === editTarget.id ? data : s)));
    } else {
      const res = await authFetch(`${API}/api/schedules`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(extractErrorMsg(data, "Failed to create schedule."));
      setSchedules((prev) => [...prev, data]);
    }
  }, []);

  const deleteSchedule = useCallback(async (schedule) => {
    const res = await authFetch(`${API}/api/schedules/${schedule.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(extractErrorMsg(data, "Failed to delete schedule."));
    setSchedules((prev) => prev.filter((s) => s.id !== schedule.id));
  }, []);

  const togglePublish = useCallback(async (id) => {
    const prevSchedule = schedules.find((s) => s.id === id);
    if (!prevSchedule) return;
    const published = !prevSchedule.published;
    setSchedules((prev) => prev.map((s) => (s.id === id ? { ...s, published } : s)));
    try {
      const res = await authFetch(`${API}/api/schedules/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: prevSchedule.title,
          description: prevSchedule.description,
          location: prevSchedule.location,
          event_date: prevSchedule.event_date,
          event_time: prevSchedule.event_time,
          published,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(extractErrorMsg(data, "Failed to update schedule."));
      setSchedules((prev) => prev.map((s) => (s.id === id ? data : s)));
    } catch (err) {
      setSchedules((prev) => prev.map((s) => (s.id === id ? prevSchedule : s)));
      throw err;
    }
  }, [schedules]);

  return { schedules, loading, fetchError, saveSchedule, deleteSchedule, togglePublish };
}
