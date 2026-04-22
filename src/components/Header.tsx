import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useT } from '../i18n';

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

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

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
        onClick={() => navigate('/dashboard')}
        title={T.appName}
      >
        <img src="/logo.png" alt="TradeLog" style={{ width: 64, height: 64, objectFit: 'contain', flexShrink: 0 }} />
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

        <div className="avatar" title={user?.name ?? 'User'}>{initials}</div>
      </div>
    </header>
  );
}
