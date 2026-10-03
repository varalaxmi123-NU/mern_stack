import { useEffect, useRef, useState } from "react";

/**
 * Top-right user profile dropdown.
 * name/role/email are shown in the header; onDashboard/onProfile/onSettings/onSignOut
 * are called when the matching menu item is clicked (any can be omitted).
 */
function UserMenu({ name, role, email, onDashboard, onProfile, onSettings, onSignOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const handleEsc = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const initial = name ? name.trim().charAt(0).toUpperCase() : "U";

  const item = (label, icon, handler) => (
    <button
      type="button"
      className="user-menu-item"
      onClick={() => { setOpen(false); handler?.(); }}
    >
      <span className="user-menu-item-icon" aria-hidden="true">{icon}</span>
      {label}
    </button>
  );

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className={`user-menu-trigger ${open ? "user-menu-trigger-open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="user-menu-avatar">{initial}</span>
        <span className="user-menu-trigger-text">
          <span className="user-menu-trigger-name">{name || "User"}</span>
          <span className="user-menu-trigger-role">{role}</span>
        </span>
        <svg
          className={`user-menu-chevron ${open ? "user-menu-chevron-open" : ""}`}
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <div className={`user-menu-panel ${open ? "user-menu-panel-open" : ""}`}>
        <div className="user-menu-panel-header">
          <span className="user-menu-avatar user-menu-avatar-lg">{initial}</span>
          <div className="user-menu-panel-identity">
            <span className="user-menu-panel-name">{name || "User"}</span>
            <span className="user-menu-panel-role">{role}</span>
            {email && <span className="user-menu-panel-email">{email}</span>}
          </div>
        </div>

        <div className="user-menu-divider" />

        <div className="user-menu-items">
          {item(
            "Dashboard",
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>,
            onDashboard
          )}
          {item(
            "Profile",
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>,
            onProfile
          )}
          {item(
            "Settings",
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>,
            onSettings
          )}
        </div>

        <div className="user-menu-divider" />

        <button type="button" className="user-menu-item user-menu-item-danger" onClick={() => { setOpen(false); onSignOut?.(); }}>
          <span className="user-menu-item-icon" aria-hidden="true">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </span>
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default UserMenu;
