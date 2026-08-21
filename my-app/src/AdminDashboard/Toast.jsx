// Toast.jsx
// Usage: import { ToastContainer } from "./Toast"; import { useToasts } from "./useToasts";
//
// const { toasts, showMsg, dismissToast } = useToasts();
// ...
// <ToastContainer toasts={toasts} onDismiss={dismissToast} />
// ...
// showMsg("Event saved!");             // success
// showMsg("Failed to save!", "error"); // error
//
// Floating, non-blocking confirmation for routine actions (save/delete/edit
// succeeded) — deliberately NOT a modal. Modals block the whole screen and
// demand an explicit dismissal, which is the wrong weight for "your edit
// saved" — that's an FYI, not a decision. Reserve modals (see ConfirmModal)
// for things that actually need one.

import { CheckCircle2, AlertCircle, X } from "lucide-react";

const TYPE_STYLES = {
  success: { bg: "#f0fff4", border: "#9ae6b4", color: "#276749" },
  error: { bg: "#fff5f5", border: "#fc8181", color: "#c53030" },
};

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <>
      <style>{`
        .toast-container {
          position: fixed;
          top: 18px;
          right: 18px;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 360px;
          pointer-events: none;
        }
        .toast-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 13px 14px;
          border-radius: 10px;
          border: 1px solid;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12);
          font-family: 'Segoe UI', system-ui, sans-serif;
          font-size: 13.5px;
          font-weight: 500;
          line-height: 1.45;
          pointer-events: auto;
          animation: toastSlideIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .toast-item.exiting {
          animation: toastSlideOut 0.25s ease forwards;
        }
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes toastSlideOut {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(24px); }
        }
        .toast-icon { flex-shrink: 0; margin-top: 1px; }
        .toast-msg { flex: 1; word-break: break-word; }
        .toast-close {
          background: none; border: none; cursor: pointer;
          color: inherit; opacity: 0.55; flex-shrink: 0;
          display: flex; padding: 1px; margin: -1px;
          transition: opacity 0.15s;
        }
        .toast-close:hover { opacity: 1; }
        @media (max-width: 640px) {
          .toast-container { left: 12px; right: 12px; top: 12px; max-width: none; }
        }
      `}</style>
      <div className="toast-container">
        {toasts.map((t) => {
          const cfg = TYPE_STYLES[t.type] || TYPE_STYLES.success;
          const Icon = t.type === "error" ? AlertCircle : CheckCircle2;
          return (
            <div
              key={t.id}
              className={`toast-item${t.exiting ? " exiting" : ""}`}
              style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}
            >
              <Icon size={16} className="toast-icon" />
              <span className="toast-msg">{t.message}</span>
              <button className="toast-close" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
