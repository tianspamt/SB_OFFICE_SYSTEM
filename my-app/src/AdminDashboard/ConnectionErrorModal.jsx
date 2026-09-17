// ConnectionErrorModal.jsx
// Shared "can't reach the server" overlay — shown whenever authFetch (see
// AdminContext.jsx) either throws (offline, no network at all) or gets a
// 503 back (the backend is up, but its own check against Supabase couldn't
// go through). Deliberately distinct from the plain toast a normal request
// error gets: connectivity trouble is easy to mistake for the app being
// broken, so it gets its own explicit, hard-to-miss explanation instead of
// blending into every other error message.
//
// Usage: <ConnectionErrorModal message="..." onClose={() => ...} /> — a
// single instance lives in AdminDashboard.jsx, driven by the module-level
// handler authFetch reports into.

import { useEffect } from "react";
import { WifiOff } from "lucide-react";

export default function ConnectionErrorModal({ message, onClose }) {
  // Auto-dismiss the moment the browser reports connectivity is back — the
  // user doesn't need to manually clear this if the network recovers on its
  // own while it's still on screen.
  useEffect(() => {
    const handler = () => onClose();
    window.addEventListener("online", handler);
    return () => window.removeEventListener("online", handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      <style>{`
        .cem-overlay {
          position: fixed; inset: 0;
          background: rgba(60, 20, 20, 0.3);
          backdrop-filter: blur(2px);
          display: flex; align-items: center; justify-content: center;
          z-index: 10001;
          animation: cemFadeIn 0.15s ease;
          padding: 16px;
        }
        @keyframes cemFadeIn { from { opacity: 0 } to { opacity: 1 } }
        .cem-card {
          background: #fff;
          border-radius: 20px;
          padding: 36px 28px 28px;
          width: 100%;
          max-width: 360px;
          text-align: center;
          box-shadow: 0 8px 40px rgba(0,0,0,0.15);
          font-family: 'Segoe UI', system-ui, sans-serif;
          animation: cemSlideUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes cemSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96) }
          to   { opacity: 1; transform: translateY(0)   scale(1)    }
        }
        .cem-icon-wrap {
          width: 68px; height: 68px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 20px;
          background: #fef2f2;
          color: #dc2626;
          position: relative;
        }
        .cem-icon-pulse {
          position: absolute; inset: -6px;
          border-radius: 50%;
          border: 2px solid #fecaca;
          animation: cemPulse 1.8s ease-out infinite;
        }
        @keyframes cemPulse {
          0%   { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        .cem-title {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0 0 10px;
        }
        .cem-message {
          font-size: 13.5px;
          color: #6b7280;
          margin: 0 0 24px;
          line-height: 1.6;
        }
        .cem-btn {
          width: 100%;
          padding: 13px;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          background: #dc2626;
          color: #fff;
          transition: background 0.15s, transform 0.1s;
        }
        .cem-btn:hover { background: #b91c1c; }
        .cem-btn:active { transform: scale(0.98); }
      `}</style>
      <div className="cem-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="cem-card">
          <div className="cem-icon-wrap">
            <span className="cem-icon-pulse" />
            <WifiOff size={28} strokeWidth={2} />
          </div>
          <p className="cem-title">Connection Problem</p>
          <p className="cem-message">
            {message ||
              "The server couldn't be reached. Check your internet connection and try again."}
          </p>
          <button className="cem-btn" onClick={onClose}>
            Try Again
          </button>
        </div>
      </div>
    </>
  );
}
