import { useState, useEffect, useCallback } from "react";
import { API, authFetch, extractErrorMsg } from "../AdminContext";

export function useTrivia() {
  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const fetchFacts = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const res = await authFetch(`${API}/api/trivia/all`);
      const data = await res.json();
      if (!res.ok) throw new Error(extractErrorMsg(data, "Failed to load trivia."));
      setFacts(Array.isArray(data) ? data : []);
    } catch (err) {
      setFetchError(err.message || "Failed to load trivia. Please refresh.");
      setFacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFacts();
  }, [fetchFacts]);

  const saveFact = useCallback(async (editTarget, form) => {
    if (editTarget) {
      const res = await authFetch(`${API}/api/trivia/${editTarget.id}`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(extractErrorMsg(data, "Failed to update trivia."));
      setFacts((prev) => prev.map((f) => (f.id === editTarget.id ? data : f)));
    } else {
      const res = await authFetch(`${API}/api/trivia`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(extractErrorMsg(data, "Failed to create trivia."));
      setFacts((prev) => [data, ...prev]);
    }
  }, []);

  const deleteFact = useCallback(async (fact) => {
    const res = await authFetch(`${API}/api/trivia/${fact.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(extractErrorMsg(data, "Failed to delete trivia."));
    setFacts((prev) => prev.filter((f) => f.id !== fact.id));
  }, []);

  const toggleActive = useCallback(async (id) => {
    const prevFact = facts.find((f) => f.id === id);
    if (!prevFact) return;
    const is_active = !prevFact.is_active;
    setFacts((prev) => prev.map((f) => (f.id === id ? { ...f, is_active } : f)));
    try {
      const res = await authFetch(`${API}/api/trivia/${id}`, {
        method: "PUT",
        body: JSON.stringify({ fact_text: prevFact.fact_text, is_active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(extractErrorMsg(data, "Failed to update trivia."));
      setFacts((prev) => prev.map((f) => (f.id === id ? data : f)));
    } catch (err) {
      setFacts((prev) => prev.map((f) => (f.id === id ? prevFact : f)));
      throw err;
    }
  }, [facts]);

  return { facts, loading, fetchError, saveFact, deleteFact, toggleActive };
}
