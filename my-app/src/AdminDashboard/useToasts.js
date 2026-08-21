// useToasts.js
// Usage: const { toasts, showMsg, dismissToast } = useToasts();
// Pass toasts/dismissToast to <ToastContainer> (see Toast.jsx) to render them.
// Split into its own file (rather than living alongside ToastContainer in
// Toast.jsx) so that file only exports a component — mixing a hook and a
// component in one file breaks Fast Refresh's ability to hot-reload it.

import { useCallback, useState } from "react";

const EXIT_ANIMATION_MS = 250;
const VISIBLE_MS = 3200;

export function useToasts() {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showMsg = useCallback((msg, type = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev, { id, message: msg, type, exiting: false }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    }, VISIBLE_MS);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, VISIBLE_MS + EXIT_ANIMATION_MS);
  }, []);

  return { toasts, showMsg, dismissToast };
}
