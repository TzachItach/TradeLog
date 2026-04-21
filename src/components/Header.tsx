import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useT } from '../i18n';

export default function Header() {
  const { lang, setLang, accounts, selectedAccount, setSelectedAccount, setModal, user, sidebarCollapsed, setSidebarCollapsed } = useStore();
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
        <div style={{
          width: 28, height: 28, borderRadius: '50%', background: 'var(--g)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2.8" strokeLinecap="round">
            <polyline points="3,17 9,11 13,15 21,6" />
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: '.92rem', color: 'var(--t1)', letterSpacing: '-.02em' }}>{T.appName}</span>
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
        <button
          className="btn btn-lang"
          onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
        >
          {lang === 'he' ? 'EN' : 'עב'}
        </button>

        <button className="btn btn-primary" onClick={() => setModal({ type: 'new' })}>
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
