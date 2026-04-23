import { useNavigate } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { useStore } from '../store';
import { useT } from '../i18n';
import AppLogo from './AppLogo';
import { signOut } from '../lib/supabase';

/** Half-dark / half-light split circle button */
function ThemeToggle({ darkMode, onClick }: { darkMode: boolean; onClick: () => void }) {
  return (
    <button
      className="theme-toggle-btn"
      onClick={onClick}
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
    >
      <span className="theme-toggle-dark" />
      <span className="theme-toggle-light" />
    </button>
  );
}

export default function Header() {
  const { lang, setLang, accounts, selectedAccount, setSelectedAccount, setModal, user, sidebarCollapsed, setSidebarCollapsed, darkMode, setDarkMode } = useStore();
  const T = useT(lang);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await signOut();
    navigate('/');
  }

  function handleSwitchAccount() {
    setMenuOpen(false);
    navigate('/auth');
  }

  return (
    <header className="header">
      {/* Hamburger — mobile only */}
      <button
        className="btn btn-icon hamburger-btn"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        aria-label="תפריט"
        style={{ background: 'transparent', border: '1px solid rgba(255,255,255,.15)', color: 'var(--t1)' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* Logo — mobile only */}
      <div
        className="header-logo"
        title={T.appName}
      >
        <AppLogo size="md" onClick={() => navigate('/dashboard')} />
      </div>

      {/* Account tabs */}
      <div className="account-tabs">
        <div
          className={"account-tab" + (selectedAccount === 'all' ? ' active' : '')}
          onClick={() => setSelectedAccount('all')}
        >
          {T.allAccounts}
        </div>
        {accounts.filter((a) => a.is_active).map((acc) => (
          <div
            key={acc.id}
            className={"account-tab" + (selectedAccount === acc.id ? ' active' : '')}
            onClick={() => setSelectedAccount(acc.id)}
          >
            {acc.name}
          </div>
        ))}
      </div>

      <div className="header-right">
        <ThemeToggle darkMode={darkMode} onClick={() => setDarkMode(!darkMode)} />

        <button
          className="btn btn-lang"
          onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
        >
          {lang === 'he' ? 'EN' : 'עב'}
        </button>

        <button className="btn btn-primary header-new-trade-btn" onClick={() => setModal({ type: 'new' })}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className="new-trade-label">{T.newTrade}</span>
        </button>

        <div className="avatar-wrapper" ref={menuRef}>
          <div
            className="avatar"
            title={user?.name ?? 'User'}
            onClick={() => setMenuOpen((o) => !o)}
            style={{ cursor: 'pointer' }}
          >
            {initials}
          </div>
          {menuOpen && (
            <div className="avatar-menu">
              <div className="avatar-menu-profile">
                <div className="avatar-menu-name">{user?.name ?? '—'}</div>
                <div className="avatar-menu-email">{user?.email ?? '—'}</div>
              </div>
              <div className="avatar-menu-divider" />
              <button className="avatar-menu-item" onClick={handleSwitchAccount}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                {lang === 'he' ? 'החלף משתמש' : 'Switch account'}
              </button>
              <button className="avatar-menu-item avatar-menu-logout" onClick={handleLogout}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                {T.logout}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
