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
      {/* המבורגר — מובייל בלבד */}
      <button
        className="btn btn-icon hamburger-btn"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        aria-label="תפריט"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      {/* לוגו — מובייל בלבד, דסקטופ מוסתר (הלוגו בסיידבר) */}
      <div
        className="header-logo"
        onClick={() => navigate('/dashboard')}
        title={T.appName}
      >
        <div style={{
          width: 26, height: 26, borderRadius: 7, background: 'var(--b)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="3,17 9,11 13,15 21,6" />
          </svg>
        </div>
        <span style={{ fontWeight: 700, fontSize: '.92rem', color: 'var(--t1)' }}>{T.appName}</span>
      </div>

      {/* טאבי חשבונות */}
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
          className="btn btn-lang btn-close"
          style={{ fontSize: '.82rem', padding: '4px 12px', borderRadius: 16 }}
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
