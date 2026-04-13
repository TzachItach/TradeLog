import { useStore } from '../store';
import { useT } from '../i18n';

export default function Header() {
  const { lang, setLang, accounts, selectedAccount, setSelectedAccount, setModal, user } = useStore();
  const T = useT(lang);

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header className="header">
      <div className="account-tabs">
        <div
          className={`account-tab${selectedAccount === 'all' ? ' active' : ''}`}
          onClick={() => setSelectedAccount('all')}
        >
          {T.allAccounts}
        </div>
        {accounts.filter((a) => a.is_active).map((acc) => (
          <div
            key={acc.id}
            className={`account-tab${selectedAccount === acc.id ? ' active' : ''}`}
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

        <button
          className="btn btn-primary"
          onClick={() => setModal({ type: 'new' })}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {T.newTrade}
        </button>

        <div className="avatar" title={user?.name ?? 'User'}>{initials}</div>
      </div>
    </header>
  );
}
