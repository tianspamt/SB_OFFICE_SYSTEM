/**
 * BusySpinner.jsx
 * Small inline spinner for buttons while a request is in flight
 * (e.g. the author's Approve / Decline). Inherits the button's text color.
 */

export default function BusySpinner({ size = 13 }) {
  return (
    <>
      <style>{`@keyframes busy-spinner-rotate { to { transform: rotate(360deg); } }`}</style>
      <span
        role="status"
        aria-label="Loading"
        style={{
          display: "inline-block",
          width: size,
          height: size,
          border: "2px solid currentColor",
          borderRightColor: "transparent",
          borderRadius: "50%",
          animation: "busy-spinner-rotate 0.7s linear infinite",
          flexShrink: 0,
        }}
      />
    </>
  );
}
