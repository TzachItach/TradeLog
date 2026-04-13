import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useT } from '../i18n';
import { signOut, DEMO_MODE } from '../lib/supabase';
import type { Account, Strategy, StrategyField } from '../types';

const COLORS = ['#4a7dff', '#00c896', '#ff9f43', '#ff3355', '#a855f7', '#06b6d4', '#f59e0b', '#ec4899'];

/* ── טופס חשבון ── */
function AccountForm({ account, onSave, onCancel, lang }: {
  account?: Account; onSave: (a: Account) => void; onCancel: () => void; lang: string;
}) {
  const T = useT(lang as 'he' | 'en');
  const [form, setForm] = useState<Account>(account ?? {
    id: crypto.randomUUID(), name: '', account_type: 'personal',
    broker: 'manual', initial_balance: 0, currency: 'USD', is_active: true,
  });
  const s = <K extends keyof Account>(k: K, v: Account[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--bd2)', borderRadius: 10, padding: 18, marginTop: 10 }}>
      <div className="form-grid">
        <div className="s2">
          <label className="form-label">{T.accountName}</label>
          <input className="form-input" value={form.name} onChange={(e) => s('name', e.target.value)} />
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
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn btn-ghost" onClick={onCancel}>{T.cancel}</button>
        <button className="btn btn-primary" onClick={() => form.name.trim() && onSave(form)}>{T.save}</button>
      </div>
    </div>
  );
}

/* ── טופס אסטרטגיה עם ניהול checkboxes ── */
function StrategyForm({ strategy, onSave, onCancel, lang }: {
  strategy?: Strategy; onSave: (s: Strategy) => void; onCancel: () => void; lang: string;
}) {
  const T = useT(lang as 'he' | 'en');
  const isHe = lang === 'he';

  const [form, setForm] = useState<Strategy>(strategy ?? {
    id: crypto.randomUUID(), name: '', description: '', color: '#4a7dff', is_active: true, fields: [],
  });
  const [newCbLabel, setNewCbLabel] = useState('');
  const [newTxtLabel, setNewTxtLabel] = useState('');

  const cbFields = form.fields.filter((f) => f.field_type === 'checkbox');
  const txtFields = form.fields.filter((f) => f.field_type === 'text');

  const addField = (type: 'checkbox' | 'text', label: string) => {
    if (!label.trim()) return;
    const newField: StrategyField = {
      id: crypto.randomUUID(),
      strategy_id: form.id,
      field_type: type,
      label: label.trim(),
      is_required: false,
      sort_order: form.fields.length + 1,
    };
    setForm((f) => ({ ...f, fields: [...f.fields, newField] }));
  };

  const removeField = (id: string) =>
    setForm((f) => ({ ...f, fields: f.fields.filter((x) => x.id !== id) }));

  const moveField = (id: string, dir: -1 | 1) => {
    setForm((f) => {
      const fields = [...f.fields];
      const idx = fields.findIndex((x) => x.id === id);
      if (idx < 0) return f;
      const to = idx + dir;
      if (to < 0 || to >= fields.length) return f;
      [fields[idx], fields[to]] = [fields[to], fields[idx]];
      return { ...f, fields };
    });
  };

  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--bd2)', borderRadius: 10, padding: 18, marginTop: 10 }}>

      {/* שם + צבע */}
      <div className="form-grid" style={{ marginBottom: 18 }}>
        <div>
          <label className="form-label">{T.strategyName}</label>
          <input className="form-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="form-label">{T.color}</label>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', paddingTop: 6 }}>
            {COLORS.map((c) => (
              <div key={c} onClick={() => setForm((f) => ({ ...f, color: c }))}
                style={{ width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: form.color === c ? '3px solid white' : '3px solid transparent',
                  boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none', transition: 'all .12s' }} />
            ))}
          </div>
        </div>
      </div>

      {/* אישורים (Checkboxes) */}
      <div style={{ marginBottom: 20 }}>
        <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>
          {isHe ? 'אישורים' : 'Confirmations'}
        </label>

        {cbFields.length === 0 && (
          <div style={{ color: 'var(--t3)', fontSize: '.8rem', padding: '8px 0 12px' }}>
            {isHe ? 'אין אישורים עדיין — הוסף את הראשון למטה' : 'No confirmations yet — add your first below'}
          </div>
        )}

        {cbFields.map((f, i) => (
          <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
            background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 7, padding: '7px 10px' }}>
            <div style={{ width: 14, height: 14, border: '1.5px solid var(--b)', borderRadius: 3, flexShrink: 0 }} />
            <span style={{ flex: 1, fontSize: '.85rem' }}>{f.label}</span>
            <button className="btn btn-icon" style={{ width: 26, height: 26 }}
              onClick={() => moveField(f.id, -1)} disabled={i === 0} title={isHe ? 'הזז למעלה' : 'Move up'}>↑</button>
            <button className="btn btn-icon" style={{ width: 26, height: 26 }}
              onClick={() => moveField(f.id, 1)} disabled={i === cbFields.length - 1} title={isHe ? 'הזז למטה' : 'Move down'}>↓</button>
            <button className="btn btn-danger" style={{ padding: '3px 9px', fontSize: '.75rem' }}
              onClick={() => removeField(f.id)}>×</button>
          </div>
        ))}

        {/* שורת הוספה */}
        <div style={{ display: 'flex', gap: 8, marginTop: 10, background: 'var(--s1)', border: '2px dashed var(--bd2)', borderRadius: 8, padding: 10 }}>
          <input
            className="form-input"
            style={{ flex: 1, background: 'var(--s2)' }}
            placeholder={isHe ? '✏ כתוב שם האישור ולחץ "הוסף"...' : '✏ Type confirmation name and click "Add"...'}
            value={newCbLabel}
            onChange={(e) => setNewCbLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { addField('checkbox', newCbLabel); setNewCbLabel(''); } }}
          />
          <button
            className="btn btn-primary"
            style={{ whiteSpace: 'nowrap', padding: '8px 18px', fontWeight: 700 }}
            onClick={() => { addField('checkbox', newCbLabel); setNewCbLabel(''); }}
          >
            + {isHe ? 'הוסף אישור' : 'Add confirmation'}
          </button>
        </div>
      </div>

      {/* שדות טקסט */}
      <div style={{ marginBottom: 18 }}>
        <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>
          {isHe ? 'שדות טקסט חופשי' : 'Text fields'}
        </label>

        {txtFields.length === 0 && (
          <div style={{ color: 'var(--t3)', fontSize: '.8rem', padding: '8px 0 12px' }}>
            {isHe ? 'אין שדות טקסט עדיין — הוסף למטה' : 'No text fields yet — add below'}
          </div>
        )}

        {txtFields.map((f) => (
          <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
            background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 7, padding: '7px 10px' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2">
              <line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/>
              <line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>
            </svg>
            <span style={{ flex: 1, fontSize: '.85rem' }}>{f.label}</span>
            <button className="btn btn-danger" style={{ padding: '3px 9px', fontSize: '.75rem' }}
              onClick={() => removeField(f.id)}>×</button>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, marginTop: 10, background: 'var(--s1)', border: '2px dashed var(--bd2)', borderRadius: 8, padding: 10 }}>
          <input
            className="form-input"
            style={{ flex: 1, background: 'var(--s2)' }}
            placeholder={isHe ? '✏ כתוב שם השדה ולחץ "הוסף"...' : '✏ Type field name and click "Add"...'}
            value={newTxtLabel}
            onChange={(e) => setNewTxtLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { addField('text', newTxtLabel); setNewTxtLabel(''); } }}
          />
          <button
            className="btn btn-primary"
            style={{ whiteSpace: 'nowrap', padding: '8px 18px', fontWeight: 700 }}
            onClick={() => { addField('text', newTxtLabel); setNewTxtLabel(''); }}
          >
            + {isHe ? 'הוסף שדה' : 'Add field'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--bd)', paddingTop: 14 }}>
        <button className="btn btn-ghost" onClick={onCancel}>{T.cancel}</button>
        <button className="btn btn-primary" onClick={() => form.name.trim() && onSave(form)}>{T.save}</button>
      </div>
    </div>
  );
}

/* ── דף ראשי ── */
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

      {/* חשבונות מסחר */}
      <div className="settings-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="section-title">
          <span>{lang === 'he' ? 'חשבונות מסחר' : 'Trading Accounts'}</span>
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
                <button className="btn btn-danger" style={{ padding: '5px 10px' }}
                  onClick={() => { if (window.confirm(T.confirmDelete)) deleteAccount(acc.id); }}>
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

        {accounts.length === 0 && (
          <div style={{ color: 'var(--t3)', fontSize: '.84rem', padding: '12px 0' }}>
            {lang === 'he' ? 'אין חשבונות — הוסף חשבון ראשון' : 'No accounts yet — add your first account'}
          </div>
        )}

        {accForm === 'new' && (
          <AccountForm lang={lang}
            onSave={(a) => { addAccount(a); setAccForm(null); }}
            onCancel={() => setAccForm(null)} />
        )}
      </div>

      {/* אסטרטגיות */}
      <div className="settings-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="section-title">
          <span>{T.strategies}</span>
          <button className="btn btn-primary" onClick={() => setStratForm('new')}>+ {T.addStrategy}</button>
        </div>

        {strategies.map((strat) => {
          const cbCount = strat.fields.filter((f) => f.field_type === 'checkbox').length;
          const txtCount = strat.fields.filter((f) => f.field_type === 'text').length;
          return (
            <div key={strat.id}>
              <div className="list-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                  <div className="color-dot" style={{ background: strat.color }} />
                  <div className="list-card-info">
                    <div className="list-card-name">{strat.name}</div>
                    <div className="list-card-meta">
                      {cbCount} {lang === 'he' ? 'checkboxes' : 'checkboxes'}
                      {txtCount > 0 && ` · ${txtCount} ${lang === 'he' ? 'שדות טקסט' : 'text fields'}`}
                    </div>
                  </div>
                </div>
                <div className="list-card-actions">
                  <button className="btn btn-icon" onClick={() => setStratForm(stratForm === strat.id ? null : strat.id)}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                  </button>
                  <button className="btn btn-danger" style={{ padding: '5px 10px' }}
                    onClick={() => { if (window.confirm(T.confirmDelete)) deleteStrategy(strat.id); }}>
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
          );
        })}

        {stratForm === 'new' && (
          <StrategyForm lang={lang}
            onSave={(s) => { addStrategy(s); setStratForm(null); }}
            onCancel={() => setStratForm(null)} />
        )}
      </div>

      {/* חיבורי ברוקר */}
      <div className="settings-section">
        <div className="section-title">{T.brokerConnections}</div>
        {[
          { name: 'Tradovate', id: 'tradovate', desc: 'Futures & Options' },
          { name: 'TopstepX',  id: 'topstepx',  desc: 'Funded Trader Program' },
        ].map((b) => (
          <div key={b.id} className="list-card">
            <div className="list-card-info">
              <div className="list-card-name">{b.name}</div>
              <div className="list-card-meta">{b.desc}</div>
            </div>
            <div className="list-card-actions">
              <button className="btn btn-primary" style={{ padding: '5px 14px', fontSize: '.8rem' }}
                onClick={() => alert(lang === 'he' ? 'חיבור ברוקר דורש הגדרת Supabase Edge Functions — ראה README' : 'Broker sync requires Supabase Edge Functions — see README')}>
                {T.connect}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* פרופיל + התנתקות */}
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
