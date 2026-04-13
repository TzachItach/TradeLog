import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useT } from '../i18n';
import { signOut, DEMO_MODE } from '../lib/supabase';
import type { Account, Strategy } from '../types';

const COLORS = ['#4a7dff', '#00c896', '#ff9f43', '#ff3355', '#a855f7', '#06b6d4', '#f59e0b', '#ec4899'];

function AccountForm({ account, onSave, onCancel, lang }: {
  account?: Account; onSave: (a: Account) => void; onCancel: () => void; lang: string;
}) {
  const T = useT(lang as 'he' | 'en');
  const [form, setForm] = useState<Account>(account ?? {
    id: `a-${Date.now()}`, name: '', account_type: 'personal',
    broker: 'manual', initial_balance: 0, currency: 'USD', is_active: true,
  });
  const s = <K extends keyof Account>(k: K, v: Account[K]) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--bd2)', borderRadius: 10, padding: 18, marginTop: 10 }}>
      <div className="form-grid">
        <div className="s2">
          <label className="form-label">{T.accountName}</label>
          <input className="form-input" value={form.name} onChange={(e) => s('name', e.target.value)} placeholder={lang === 'he' ? 'שם החשבון' : 'Account name'} />
        </div>
        <div>
          <label className="form-label">{T.accountType}</label>
          <select className="form-input" value={form.account_type} onChange={(e) => s('account_type', e.target.value as Account['account_type'])}>
            <option value="personal">{T.personal}</option>
            <option value="prop_firm">{T.propFirm}</option>
            <option value="demo">{T.demo}</option>
          </select>
        </div>
        <div>
          <label className="form-label">{T.broker}</label>
          <select className="form-input" value={form.broker} onChange={(e) => s('broker', e.target.value as Account['broker'])}>
            <option value="manual">{T.manual}</option>
            <option value="tradovate">Tradovate</option>
            <option value="topstepx">TopstepX</option>
          </select>
        </div>
        <div>
          <label className="form-label">{T.initialBalance} ($)</label>
          <input type="number" className="form-input" value={form.initial_balance} onChange={(e) => s('initial_balance', Number(e.target.value))} />
        </div>
        <div>
          <label className="form-label">{T.currency}</label>
          <select className="form-input" value={form.currency} onChange={(e) => s('currency', e.target.value)}>
            <option>USD</option><option>EUR</option><option>GBP</option><option>ILS</option>
          </select>
        </div>
      </div>
      <div className="modal-actions" style={{ borderTop: 'none', padding: '14px 0 0', marginTop: 14 }}>
        <button className="btn btn-ghost" onClick={onCancel}>{T.cancel}</button>
        <button className="btn btn-primary" onClick={() => onSave(form)}>{T.save}</button>
      </div>
    </div>
  );
}

function StrategyForm({ strategy, onSave, onCancel, lang }: {
  strategy?: Strategy; onSave: (s: Strategy) => void; onCancel: () => void; lang: string;
}) {
  const T = useT(lang as 'he' | 'en');
  const [form, setForm] = useState<Strategy>(strategy ?? {
    id: `s-${Date.now()}`, name: '', description: '', color: '#4a7dff', is_active: true, fields: [],
  });
  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--bd2)', borderRadius: 10, padding: 18, marginTop: 10 }}>
      <div className="form-grid">
        <div>
          <label className="form-label">{T.strategyName}</label>
          <input className="form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="form-label">{T.color}</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
            {COLORS.map((c) => (
              <div key={c} onClick={() => setForm((f) => ({ ...f, color: c }))}
                style={{ width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: form.color === c ? '2px solid white' : '2px solid transparent' }} />
            ))}
          </div>
        </div>
        <div className="s2">
          <label className="form-label" style={{ marginBottom: 6 }}>{T.fields}</label>
          {form.fields.filter((f) => f.field_type === 'checkbox').map((f) => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '.82rem', flex: 1, color: 'var(--t2)' }}>☑ {f.label}</span>
              <button className="btn btn-danger" style={{ padding: '2px 8px', fontSize: '.72rem' }}
                onClick={() => setForm((st) => ({ ...st, fields: st.fields.filter((x) => x.id !== f.id) }))}>×</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <input className="form-input" style={{ flex: 1 }} placeholder={T.addField}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  const label = e.currentTarget.value.trim();
                  setForm((st) => ({ ...st, fields: [...st.fields, { id: `f-${Date.now()}`, strategy_id: st.id, field_type: 'checkbox', label, is_required: false, sort_order: st.fields.length + 1 }] }));
                  e.currentTarget.value = '';
                }
              }} />
          </div>
        </div>
      </div>
      <div className="modal-actions" style={{ borderTop: 'none', padding: '14px 0 0', marginTop: 14 }}>
        <button className="btn btn-ghost" onClick={onCancel}>{T.cancel}</button>
        <button className="btn btn-primary" onClick={() => onSave(form)}>{T.save}</button>
      </div>
    </div>
  );
}

export default function Settings() {
  const { lang, accounts, strategies, user, addAccount, updateAccount, deleteAccount, addStrategy, updateStrategy, deleteStrategy, setUser } = useStore();
  const T = useT(lang);
  const navigate = useNavigate();
  const [accForm, setAccForm] = useState<'new' | string | null>(null);
  const [stratForm, setStratForm] = useState<'new' | string | null>(null);

  const handleLogout = async () => {
    if (!window.confirm(lang === 'he' ? 'האם אתה בטוח שברצונך להתנתק?' : 'Are you sure you want to log out?')) return;
    await signOut();
    setUser(null);
    navigate('/auth', { replace: true });
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">{T.settings}</h1>
      </div>

      {/* Accounts */}
      <div className="settings-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="section-title">
          <span>{T.account}</span>
          <button className="btn btn-primary" onClick={() => setAccForm('new')}>+ {T.addAccount}</button>
        </div>

        {accounts.map((acc) => (
          <div key={acc.id}>
            <div className="list-card">
              <div className="list-card-info">
                <div className="list-card-name">{acc.name}</div>
                <div className="list-card-meta">{acc.account_type} · {acc.broker} · {acc.currency}</div>
              </div>
              <div className="list-card-actions">
                <button className="btn btn-icon" onClick={() => setAccForm(accForm === acc.id ? null : acc.id)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                </button>
                <button className="btn btn-danger" style={{ padding: '5px 10px' }} onClick={() => { if (window.confirm(T.confirmDelete)) deleteAccount(acc.id); }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2"/></svg>
                </button>
              </div>
            </div>
            {accForm === acc.id && (
              <AccountForm account={acc} lang={lang}
                onSave={(a) => { updateAccount(a); setAccForm(null); }}
                onCancel={() => setAccForm(null)} />
            )}
          </div>
        ))}

        {accForm === 'new' && (
          <AccountForm lang={lang}
            onSave={(a) => { addAccount(a); setAccForm(null); }}
            onCancel={() => setAccForm(null)} />
        )}
      </div>

      {/* Strategies */}
      <div className="settings-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="section-title">
          <span>{T.strategies}</span>
          <button className="btn btn-primary" onClick={() => setStratForm('new')}>+ {T.addStrategy}</button>
        </div>

        {strategies.map((strat) => (
          <div key={strat.id}>
            <div className="list-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                <div className="color-dot" style={{ background: strat.color }} />
                <div className="list-card-info">
                  <div className="list-card-name">{strat.name}</div>
                  <div className="list-card-meta">{strat.fields.filter((f) => f.field_type === 'checkbox').length} {T.fields}</div>
                </div>
              </div>
              <div className="list-card-actions">
                <button className="btn btn-icon" onClick={() => setStratForm(stratForm === strat.id ? null : strat.id)}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                </button>
                <button className="btn btn-danger" style={{ padding: '5px 10px' }} onClick={() => { if (window.confirm(T.confirmDelete)) deleteStrategy(strat.id); }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a1,1,0,0,1,1-1h4a1,1,0,0,1,1,1v2"/></svg>
                </button>
              </div>
            </div>
            {stratForm === strat.id && (
              <StrategyForm strategy={strat} lang={lang}
                onSave={(s) => { updateStrategy(s); setStratForm(null); }}
                onCancel={() => setStratForm(null)} />
            )}
          </div>
        ))}

        {stratForm === 'new' && (
          <StrategyForm lang={lang}
            onSave={(s) => { addStrategy(s); setStratForm(null); }}
            onCancel={() => setStratForm(null)} />
        )}
      </div>

      {/* Broker Connections */}
      <div className="settings-section">
        <div className="section-title">{T.brokerConnections}</div>
        {[
          { name: 'Tradovate', id: 'tradovate', desc: 'Futures & Options' },
          { name: 'TopstepX', id: 'topstepx', desc: 'Funded Trader Program' },
        ].map((b) => (
          <div key={b.id} className="list-card">
            <div className="list-card-info">
              <div className="list-card-name">{b.name}</div>
              <div className="list-card-meta">{b.desc}</div>
            </div>
            <div className="list-card-actions">
              <span className="badge-status badge-info">
                <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
                {T.connect}
              </span>
              <button className="btn btn-primary" style={{ padding: '5px 14px', fontSize: '.8rem' }}
                onClick={() => alert(lang === 'he' ? 'חיבור דורש הגדרת Supabase — ראה README' : 'Broker sync requires Supabase — see README')}>
                OAuth
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Profile & Logout */}
      <div className="settings-section">
        <div className="section-title">{lang === 'he' ? 'פרופיל וחשבון' : 'Profile & Account'}</div>
        <div className="list-card">
          <div className="list-card-info">
            <div className="list-card-name">{user?.name ?? 'User'}</div>
            <div className="list-card-meta">{user?.email ?? ''}</div>
          </div>
          {!DEMO_MODE && (
            <button className="btn btn-danger" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              {T.logout}
            </button>
          )}
        </div>
      </div>

      <div className="disclaimer">{T.disclaimer}</div>
    </div>
  );
}
