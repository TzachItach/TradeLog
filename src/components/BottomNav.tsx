import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../store';
import { useT } from '../i18n';

export default function BottomNav() {
  const { lang, setModal } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const T = useT(lang);

  const isActive = (path: string) =>
    path === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(path);

  const navItems = [
    {
      path: '/dashboard',
      label: T.calendar,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
    },
    {
      path: '/dashboard/trades',
      label: T.trades,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
        </svg>
      ),
    },
    {
      path: '/dashboard/analytics',
      label: lang === 'he' ? 'ניתוח' : 'Analytics',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
        </svg>
      ),
    },
    {
      path: '/dashboard/settings',
      label: T.settings,
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
        </svg>
      ),
    },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.slice(0, 2).map((item) => (
        <button
          key={item.path}
          className={'bottom-nav-item' + (isActive(item.path) ? ' active' : '')}
          onClick={() => navigate(item.path)}
        >
          {item.icon}
          <span className="bottom-nav-label">{item.label}</span>
        </button>
      ))}

      {/* Center Add Button */}
      <button
        className="bottom-nav-add"
        onClick={() => setModal({ type: 'new' })}
        aria-label={T.newTrade}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      {navItems.slice(2).map((item) => (
        <button
          key={item.path}
          className={'bottom-nav-item' + (isActive(item.path) ? ' active' : '')}
          onClick={() => navigate(item.path)}
        >
          {item.icon}
          <span className="bottom-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
