import { useState, useEffect, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import './AppShell.css';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../store/auth';
import { clsx } from '../utils/clsx';

interface AppShellProps {
  children: ReactNode;
  onCommandPaletteOpen?: () => void;
}

export function AppShell({ children, onCommandPaletteOpen }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const { user, clearAuth } = useAuthStore();

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onCommandPaletteOpen?.();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCommandPaletteOpen]);

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="2" width="7" height="7" rx="1" />
          <rect x="11" y="2" width="7" height="7" rx="1" />
          <rect x="2" y="11" width="7" height="7" rx="1" />
          <rect x="11" y="11" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      label: 'Transactions',
      path: '/transactions',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 5h16M2 10h16M2 15h16" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: 'Budgets',
      path: '/budgets',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M18 15V8M13 15V5M8 15v-4M3 15v-2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: 'Categories',
      path: '/categories',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="10" cy="10" r="7" />
          <path d="M10 3v7l4.5 2.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: 'Import CSV',
      path: '/import',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17 12v4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-4M10 12V3M6 6l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: 'Insights',
      path: '/insights',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 2l2.5 5 5.5.5-4 4 .5 5.5-4.5-2.5-4.5 2.5.5-5.5-4-4L7.5 7 10 2z" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <div className={clsx('app-shell', sidebarCollapsed && 'app-shell--collapsed')}>
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="app-shell__overlay"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'app-shell__sidebar',
          mobileSidebarOpen && 'app-shell__sidebar--open'
        )}
      >
        <div className="app-shell__sidebar-header">
          <div className="app-shell__logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="var(--color-primary)" />
              <path
                d="M8 12h16M8 16h12M8 20h8"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            {!sidebarCollapsed && <span className="app-shell__logo-text">FinSmart</span>}
          </div>
          <button
            className="app-shell__collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              {sidebarCollapsed ? (
                <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M10 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
              )}
            </svg>
          </button>
        </div>

        <nav className="app-shell__nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                clsx('app-shell__nav-item', isActive && 'app-shell__nav-item--active')
              }
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className="app-shell__nav-icon">{item.icon}</span>
              {!sidebarCollapsed && (
                <span className="app-shell__nav-label">{item.label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="app-shell__sidebar-footer">
          <button
            className="app-shell__theme-toggle"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="10" cy="10" r="4" />
                <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17.5 10.5a7.5 7.5 0 1 1-8-8 5.5 5.5 0 0 0 8 8z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {!sidebarCollapsed && <span>{isDark ? 'Light mode' : 'Dark mode'}</span>}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div className="app-shell__main">
        {/* Top bar */}
        <header className="app-shell__topbar">
          <button
            className="app-shell__mobile-menu-btn"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
            </svg>
          </button>

          <button
            className="app-shell__search-btn"
            onClick={onCommandPaletteOpen}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="7" r="5" />
              <path d="M11 11l3 3" strokeLinecap="round" />
            </svg>
            <span>Search...</span>
            <kbd>⌘K</kbd>
          </button>

          <div className="app-shell__topbar-actions">
            <button className="app-shell__notification-btn" aria-label="Notifications">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 2a6 6 0 0 1 6 6c0 3.09.78 5.13 1.56 6.44.28.48.44.73.44.56H2c0 .17.16-.08.44-.56C3.22 13.13 4 11.09 4 8a6 6 0 0 1 6-6z" />
                <path d="M7.5 17a2.5 2.5 0 0 0 5 0" strokeLinecap="round" />
              </svg>
              <span className="app-shell__notification-badge" />
            </button>

            <div className="app-shell__user-menu">
              <div className="app-shell__user-avatar">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="app-shell__user-info">
                <span className="app-shell__user-name">{user?.email?.split('@')[0] || 'User'}</span>
              </div>
              <button
                className="app-shell__logout-btn"
                onClick={clearAuth}
                title="Logout"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 14H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h3M11 11l3-3-3-3M14 8H6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="app-shell__content">
          {children}
        </main>
      </div>
    </div>
  );
}
