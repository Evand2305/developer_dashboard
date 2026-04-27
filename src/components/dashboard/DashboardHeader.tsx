// Sticky header with three sections (3-column grid):
//   Left  — Reset Widgets button
//   Center — app logo
//   Right  — Add Widget button + user avatar/dropdown menu
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth }  from '@/contexts/AuthContext';
import { signOut }  from '@/services/firebase/auth';

interface Props {
  onAddWidget: () => void;
  onReset: () => void;
}

export default function DashboardHeader({ onAddWidget, onReset }: Props) {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the user dropdown whenever the user clicks outside it.
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  // Show first letter of display name, then email, then '?' as fallback.
  const initials =
    user?.displayName?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    '?';

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button className="btn-reset-widgets" onClick={onReset}
          title="Reset all widgets to default size and position" aria-label="Reset widgets">
          Reset Widgets
        </button>
      </div>

      <span className="dashboard-logo">
        developer<span className="logo-accent">-</span>board
      </span>

      <div className="header-actions">
        <button className="btn-add-widget" onClick={onAddWidget}>+ Add Widget</button>

        <div className="user-menu" ref={menuRef}>
          <button className="user-avatar" onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="User menu" aria-expanded={menuOpen}>
            {initials}
          </button>

          {menuOpen && (
            <div className="user-dropdown">
              <div className="user-info">
                <span className="user-name">{user?.displayName || 'User'}</span>
                <span className="user-email">{user?.email}</span>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={handleSignOut}>Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
