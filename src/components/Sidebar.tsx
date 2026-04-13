import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { useT } from '../i18n';
import AccessibilityWidget from './AccessibilityWidget';

const NavIcon = ({ path }: { path: string }) => {
  const icons: Record<string, JSX.Element> = {
    '/dashboard': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    '/dashboard/trades': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>,
    '/dashboard/reports': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    '/dashboard/settings': <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>,
  };
  return icons[path] ?? null;
};

export default function Sidebar() {
  const { lang, sidebarCollapsed, setSidebarCollapsed } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const T = useT(lang);

  const navItems = [
    { path: '/dashboard',          label: T.calendar  },
    { path: '/dashboard/trades',   label: T.trades    },
    { path: '/dashboard/reports',  label: T.reports   },
    { path: '/dashboard/settings', label: T.settings  },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={`sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="3,17 9,11 13,15 21,6" />
          </svg>
        </div>
        <span className="logo-text">{T.appName}</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`nav-item${isActive(item.path) ? ' active' : ''}`}
            onClick={() => navigate(item.path)}
            title={sidebarCollapsed ? item.label : undefined}
          >
            <NavIcon path={item.path} />
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <AccessibilityWidget />
        <button
          className="nav-item"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          title={sidebarCollapsed ? 'Expand' : 'Collapse'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {sidebarCollapsed
              ? <polyline points="9,18 15,12 9,6" />
              : <polyline points="15,18 9,12 15,6" />}
          </svg>
          <span className="nav-label" style={{ fontSize: '.78rem' }}>
            {lang === 'he' ? 'כווץ' : 'Collapse'}
          </span>
        </button>
      </div>
    </aside>
  );
}
