import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/services/firebase/auth';

interface Props {
  onAddWidget: () => void;
}

export default function DashboardHeader({ onAddWidget }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  const initials =
    user?.displayName?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    '?';

  return (
    <header className="dashboard-header">
      <span className="dashboard-logo">
        dev<span className="logo-accent">.</span>dash
      </span>

      <div className="header-actions">
        <button className="btn-add-widget" onClick={onAddWidget}>
          + Add Widget
        </button>

        <div className="user-menu" ref={menuRef}>
          <button
            className="user-avatar"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="User menu"
            aria-expanded={menuOpen}
          >
            {initials}
          </button>

          {menuOpen && (
            <div className="user-dropdown">
              <div className="user-info">
                <span className="user-name">{user?.displayName || 'User'}</span>
                <span className="user-email">{user?.email}</span>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
