import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { useT } from '../i18n';
import AccessibilityWidget from './AccessibilityWidget';

const icons: Record<string, JSX.Element> = {
  '/dashboard': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  ),
  '/dashboard/trades': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>
  ),
  '/dashboard/reports': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  ),
  '/dashboard/settings': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
  ),
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

  const isActive = (path: string) =>
    path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(path);

  const handleNav = (path: string) => {
    navigate(path);
    // סגור את הסיידבר אחרי ניווט במובייל
    if (window.innerWidth < 768) setSidebarCollapsed(true);
  };

  const isOpen = !sidebarCollapsed;

  return (
    <>
      {/* Backdrop — מובייל בלבד, כשהתפריט פתוח */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      <aside className={"sidebar" + (isOpen ? ' mobile-open' : '')}>
        <div className="sidebar-logo">
          <div className="logo-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="3,17 9,11 13,15 21,6" />
            </svg>
          </div>
          <span className="logo-text">{T.appName}</span>
          {/* כפתור סגירה — מובייל */}
          <button
            className="btn btn-icon sidebar-close-btn"
            onClick={() => setSidebarCollapsed(true)}
            aria-label="סגור תפריט"
            style={{ marginInlineStart: 'auto' }}
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

        <div className="sidebar-footer">
          <AccessibilityWidget />
        </div>
      </aside>
    </>
  );
}
