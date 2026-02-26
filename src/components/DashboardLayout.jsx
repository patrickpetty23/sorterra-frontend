import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, FileText, Settings, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';
import '../pages/Dashboard.css';

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Recipes', href: '/recipes', icon: ClipboardList },
  { name: 'Files', href: '/files', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

function getInitials(name) {
  if (!name) return '??';
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { organization, orgRole, loading: orgLoading } = useOrg();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const isActive = (href) => location.pathname === href;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-layout">
      <a href="#main-content" className="skip-to-content">Skip to content</a>
      {sidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`} aria-label="Main navigation">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M3 6h18v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 6V4a2 2 0 012-2h3l2 3h7a2 2 0 012 2v1" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="sidebar-brand">Sorterra</span>
          </div>
          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`nav-item${isActive(item.href) ? ' active' : ''}`}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                <Icon size={20} aria-hidden="true" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {orgLoading ? (
            <div className="organization-badge">
              <div className="org-avatar skeleton-avatar" />
              <div className="org-info">
                <div className="skeleton skeleton-org-name" />
                <div className="skeleton skeleton-org-status" />
              </div>
            </div>
          ) : organization ? (
            <div className="organization-badge">
              <div className="org-avatar">{getInitials(organization.name)}</div>
              <div className="org-info">
                <div className="org-name">{organization.name}</div>
                <div className="org-status">{orgRole || 'Member'}</div>
              </div>
            </div>
          ) : (
            <div className="organization-badge">
              <div className="org-avatar org-avatar-empty">—</div>
              <div className="org-info">
                <div className="org-name">No Organization</div>
                <div className="org-status">Not connected</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main id="main-content" className="main-content">
        <header className="dashboard-header">
          <div className="header-left">
            <button
              className="hamburger-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={24} aria-hidden="true" />
            </button>
            <h1>{NAV_ITEMS.find((n) => isActive(n.href))?.name || 'Sorterra'}</h1>
          </div>
          <div className="header-actions">
            {user && <span className="user-greeting">{user.name || user.email}</span>}
            <button onClick={handleLogout} className="logout-button" aria-label="Log out">
              <LogOut size={20} aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
