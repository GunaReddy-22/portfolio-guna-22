import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  FileText,
  Sliders,
  Palette,
  Image,
  Inbox,
  CheckSquare,
  History,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { getPublicSiteUrl } from '../lib/api';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview', to: '/', icon: LayoutDashboard },
    { label: 'Visitor Analytics', to: '/analytics', icon: Activity },
    { label: 'Pages', to: '/pages', icon: FileText },
    { label: 'Visual Builder', to: '/builder', icon: Sliders },
    { label: 'Theme Studio', to: '/theme', icon: Palette },
    { label: 'Media Library', to: '/media', icon: Image },
    { label: 'Feedback Forms', to: '/forms', icon: CheckSquare },
    { label: 'Responses', to: '/submissions', icon: Inbox },
    { label: 'Revision History', to: '/revisions', icon: History },
    { label: 'Site Settings', to: '/settings', icon: Settings },
  ];

  return (
    <div className="cms-app">
      <div className="cms-layout">
        {/* Mobile Sidebar Backdrop */}
        {mobileOpen && (
          <div
            className="cms-sidebar-backdrop"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar */}
        <aside className={`cms-sidebar ${mobileOpen ? 'open' : ''}`}>
          <div className="cms-sidebar-header">
            <NavLink to="/" className="cms-brand" onClick={() => setMobileOpen(false)}>
              <div className="cms-brand-icon">G</div>
              <div>
                <div className="cms-brand-text">Guna CMS</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--cms-text-muted)' }}>Portfolio Admin</div>
              </div>
            </NavLink>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="cms-brand-badge">v1.0</span>
              <button
                type="button"
                className="cms-sidebar-close-btn"
                onClick={() => setMobileOpen(false)}
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <nav className="cms-sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.to === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.to);

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`cms-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="cms-sidebar-footer">
            <div className="cms-user-info">
              <div className="cms-user-avatar">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="cms-user-details">
                <span className="cms-user-email">{user?.email}</span>
                <span className="cms-user-role">{user?.role}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="cms-btn cms-btn-icon cms-btn-ghost"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="cms-main-content">
          <header className="cms-topbar">
            <div className="cms-topbar-left">
              <button
                type="button"
                className="cms-btn cms-btn-icon cms-btn-ghost cms-mobile-toggle"
                onClick={() => setMobileOpen(!mobileOpen)}
                id="cms-mobile-toggle"
                aria-label="Toggle navigation"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <div>
                <h1 className="cms-page-title">
                  {navItems.find((n) =>
                    n.to === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(n.to)
                  )?.label || 'Administration'}
                </h1>
              </div>
            </div>

            <div className="cms-topbar-actions">
              <a
                href={getPublicSiteUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="cms-btn cms-btn-secondary cms-btn-sm"
              >
                <ExternalLink size={14} />
                <span className="cms-topbar-action-label">View Live Site</span>
              </a>
            </div>
          </header>

          <main className="cms-workspace">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
