// LoadingModal.jsx
// Usage: import LoadingModal from "./LoadingModal";
//
// {pageLoading && <LoadingModal message="Loading data..." />}

export default function LoadingModal({ message = "Loading..." }) {
  return (
    <>
      <style>{`
        .lm-overlay {
          position: fixed; inset: 0;
          background: rgba(100, 100, 130, 0.25);
          backdrop-filter: blur(2px);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999;
          animation: lmFadeIn 0.15s ease;
        }
        @keyframes lmFadeIn { from { opacity: 0 } to { opacity: 1 } }

        .lm-card {
          background: #fff;
          border-radius: 20px;
          padding: 32px 40px;
          display: flex; flex-direction: column; align-items: center; gap: 16px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.12);
          animation: lmSlideUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes lmSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96) }
          to   { opacity: 1; transform: translateY(0)   scale(1)    }
        }

        .lm-spinner {
          width: 36px; height: 36px;
          border: 3.5px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: lmSpin 0.7s linear infinite;
        }
        @keyframes lmSpin { to { transform: rotate(360deg) } }

        .lm-message {
          font-family: 'Segoe UI', system-ui, sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin: 0;
        }
      `}</style>

      <div className="lm-overlay">
        <div className="lm-card">
          <span className="lm-spinner" aria-label="Loading" />
          <p className="lm-message">{message}</p>
        </div>
      </div>
    </>
  );
}
