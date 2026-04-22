import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { useT } from '../i18n';

const icons: Record<string, JSX.Element> = {
  '/dashboard': (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  ),
  '/dashboard/trades': (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
  ),
  '/dashboard/analytics': (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
  ),
  '/dashboard/reports': (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  ),
  '/dashboard/propfirm': (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  ),
  '/dashboard/settings': (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
  ),
};

export default function Sidebar() {
  const { lang, sidebarCollapsed, setSidebarCollapsed } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const T = useT(lang);

  const navItems = [
    { path: '/dashboard',             label: T.calendar  },
    { path: '/dashboard/trades',      label: T.trades    },
    { path: '/dashboard/analytics',   label: lang === 'he' ? 'ניתוח' : 'Analytics' },
    { path: '/dashboard/reports',     label: T.reports   },
    { path: '/dashboard/propfirm',    label: 'Prop Firm' },
    { path: '/dashboard/settings',    label: T.settings  },
  ];

  const isActive = (path: string) =>
    path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(path);

  const handleNav = (path: string) => {
    navigate(path);
    if (window.innerWidth < 768) setSidebarCollapsed(true);
  };

  const isOpen = !sidebarCollapsed;

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      <aside className={"sidebar" + (isOpen ? ' mobile-open' : '')}>
        <div className="sidebar-logo" onClick={() => handleNav('/dashboard')}>
          <img src="/logo.png" alt="TradeLog" style={{ width: 160, height: 'auto', objectFit: 'contain', flexShrink: 0 }} />
          <button
            className="btn btn-icon sidebar-close-btn"
            onClick={(e) => { e.stopPropagation(); setSidebarCollapsed(true); }}
            aria-label="סגור תפריט"
            style={{ marginInlineStart: 'auto', background: 'transparent', border: 'none', color: 'rgba(255,255,255,.5)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={"nav-item" + (isActive(item.path) ? ' active' : '')}
              onClick={() => handleNav(item.path)}
            >
              {icons[item.path]}
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer" />
      </aside>
    </>
  );
}
