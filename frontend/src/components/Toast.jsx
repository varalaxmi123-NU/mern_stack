import { useEffect, useState } from "react";

/**
 * Floating, auto-dismissing toast notification.
 * Renders nothing when `message` is empty.
 */
function Toast({ message, type = "success", onClose, duration = 3500 }) {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!message) return;
    setClosing(false);
    const closeTimer = setTimeout(() => setClosing(true), duration - 250);
    const removeTimer = setTimeout(() => onClose?.(), duration);
    return () => {
      clearTimeout(closeTimer);
      clearTimeout(removeTimer);
    };
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`toast toast-${type} ${closing ? "toast-out" : "toast-in"}`}>
      <span className="toast-icon">
        {type === "success" ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )}
      </span>
      <span className="toast-text">{message}</span>
      <button
        type="button"
        className="toast-close"
        aria-label="Dismiss notification"
        onClick={() => { setClosing(true); setTimeout(() => onClose?.(), 200); }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export default Toast;
