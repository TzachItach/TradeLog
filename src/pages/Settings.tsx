import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useT } from '../i18n';
import { signOut, DEMO_MODE, supabase } from '../lib/supabase';
import type { Account, Strategy, StrategyField } from '../types';

const COLORS = ['#4a7dff', '#00c896', '#ff9f43', '#ff3355', '#a855f7', '#06b6d4', '#f59e0b', '#ec4899'];

/* ── טופס חשבון ── */
function AccountForm({ account, onSave, onCancel, lang }: {
  account?: Account; onSave: (a: Account) => void; onCancel: () => void; lang: string;
}) {
  const T = useT(lang as 'he' | 'en');
  const isHe = lang === 'he';
  const [form, setForm] = useState<Account>(account ?? {
    id: crypto.randomUUID(), name: '', account_type: 'personal',
    broker: 'manual', initial_balance: 0, currency: 'USD', is_active: true,
  });
  const s = <K extends keyof Account>(k: K, v: Account[K]) => setForm((f) => ({ ...f, [k]: v }));

  // whether the user wants to configure prop firm limits (optional)
  const hasPropFields = !!(account?.prop_max_drawdown || account?.prop_daily_limit || account?.prop_profit_target);
  const [showPropFields, setShowPropFields] = useState(hasPropFields);

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
      {/* ── שדות Prop Firm ── */}
      {form.account_type === 'prop_firm' && (
        <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--b-bg)', border: '1px solid var(--b-bd)', borderRadius: 10 }}>
          <div style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--b)', marginBottom: showPropFields ? 14 : 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              {isHe ? 'הגדרות Prop Firm' : 'Prop Firm Settings'}
              <span style={{ fontSize: '.68rem', fontWeight: 400, color: 'var(--t3)' }}>
                {isHe ? '(אופציונלי)' : '(optional)'}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: '.72rem', padding: '3px 10px' }}
              onClick={() => setShowPropFields((v) => !v)}
            >
              {showPropFields
                ? (isHe ? '▲ הסתר' : '▲ Hide')
                : (isHe ? '▼ הגדר פרמטרים' : '▼ Configure limits')}
            </button>
          </div>

          {showPropFields && (
            <div className="form-grid">
              <div>
                <label className="form-label">{isHe ? 'שלב' : 'Phase'}</label>
                <select className="form-input" value={form.prop_phase ?? 'challenge'}
                  onChange={(e) => s('prop_phase', e.target.value as Account['prop_phase'])}>
                  <option value="challenge">{isHe ? 'מבחן (Challenge)' : 'Challenge'}</option>
                  <option value="funded">{isHe ? 'ממומן (Funded)' : 'Funded'}</option>
                </select>
              </div>
              <div>
                <label className="form-label">{isHe ? 'סוג Drawdown' : 'Drawdown Type'}</label>
                <select className="form-input" value={form.prop_drawdown_type ?? 'trailing_eod'}
                  onChange={(e) => s('prop_drawdown_type', e.target.value as Account['prop_drawdown_type'])}>
                  <option value="trailing_eod">{isHe ? 'Trailing EOD — עוקב לסגירת יום' : 'Trailing EOD — follows daily close'}</option>
                  <option value="trailing_intraday">{isHe ? 'Trailing Intraday — עוקב לתוך היום' : 'Trailing Intraday — follows intraday peak'}</option>
                  <option value="static">{isHe ? 'Static — רצפה קבועה מהיתרה ההתחלתית' : 'Static — fixed floor from starting balance'}</option>
                </select>
                <div style={{ fontSize: '.68rem', color: 'var(--t3)', marginTop: 4, lineHeight: 1.5 }}>
                  {form.prop_drawdown_type === 'trailing_intraday'
                    ? (isHe
                      ? '⚠ Intraday מחושב לפי סגירת יום בלבד (מכיוון שהעסקאות מוזנות ב-EOD)'
                      : '⚠ Intraday approximated from EOD closes (since trades are logged end-of-day)')
                    : form.prop_drawdown_type === 'static'
                    ? (isHe ? 'הרצפה קבועה: יתרה התחלתית פחות Max Drawdown' : 'Fixed floor: starting balance minus max drawdown')
                    : (isHe ? 'הרצפה עולה עם כל שיא חדש בסגירת יום' : 'Floor rises with each new end-of-day high water mark')
                  }
                </div>
              </div>
              <div>
                <label className="form-label">{isHe ? 'Max Drawdown ($)' : 'Max Drawdown ($)'}</label>
                <input type="number" min={0} className="form-input"
                  value={form.prop_max_drawdown ?? ''}
                  placeholder="e.g. 3000"
                  onChange={(e) => s('prop_max_drawdown', Number(e.target.value))} />
              </div>
              <div>
                <label className="form-label">{isHe ? 'גבול הפסד יומי ($)' : 'Daily Loss Limit ($)'}</label>
                <input type="number" min={0} className="form-input"
                  value={form.prop_daily_limit ?? ''}
                  placeholder="e.g. 1500"
                  onChange={(e) => s('prop_daily_limit', Number(e.target.value))} />
              </div>

              {(form.prop_phase ?? 'challenge') === 'challenge' && (
                <>
                  <div>
                    <label className="form-label">{isHe ? 'יעד רווח ($)' : 'Profit Target ($)'}</label>
                    <input type="number" min={0} className="form-input"
                      value={form.prop_profit_target ?? ''}
                      placeholder="e.g. 6000"
                      onChange={(e) => s('prop_profit_target', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="form-label">{isHe ? 'מינ׳ ימי מסחר' : 'Min Trading Days'}</label>
                    <input type="number" min={0} className="form-input"
                      value={form.prop_min_days ?? ''}
                      placeholder="e.g. 4"
                      onChange={(e) => s('prop_min_days', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="form-label">{isHe ? 'מקס׳ ימי מבחן' : 'Max Challenge Days'}</label>
                    <input type="number" min={0} className="form-input"
                      value={form.prop_max_days ?? ''}
                      placeholder="e.g. 30"
                      onChange={(e) => s('prop_max_days', Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="form-label">{isHe ? 'תאריך תחילת מבחן' : 'Challenge Start Date'}</label>
                    <input type="date" className="form-input"
                      value={form.prop_start_date ?? ''}
                      onChange={(e) => s('prop_start_date', e.target.value)} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

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

/* ── ניהול חיבורי ברוקר ── */
function BrokerSection({ lang, accounts, user }: { lang: string; accounts: Account[]; user: { id: string; email?: string; name?: string } | null }) {
  const isHe = lang === 'he';
  const T = useT(lang as 'he' | 'en');
  const [txConn, setTxConn] = useState<{ [k: string]: boolean }>({});
  const [topstepKey, setTopstepKey] = useState('');
  const [showTopstepInput, setShowTopstepInput] = useState(false);
  const [tradovateUser, setTradovateUser] = useState('');
  const [tradovatePass, setTradovatePass] = useState('');
  const [tradovateEnv, setTradovateEnv] = useState<'live' | 'demo'>('live');
  const [showTradovateInput, setShowTradovateInput] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<{ [k: string]: string }>({});

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string ?? '';

  const connectTradovate = async (accountId: string) => {
    if (!tradovateUser.trim() || !tradovatePass.trim()) return;
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    const jwt = session?.access_token;
    if (!jwt) return alert(isHe ? 'לא מחובר' : 'Not authenticated');
    try {
      const res = await fetch('/api/tradovate-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({
          user_id: user?.id,
          account_id: accountId,
          api_username: tradovateUser,
          api_password: tradovatePass,
          env: tradovateEnv,
        }),
      });
      if (res.ok) {
        setTxConn((c) => ({ ...c, [accountId]: true }));
        setShowTradovateInput(false);
        setTradovateUser('');
        setTradovatePass('');
        setTradovateEnv('live');
        alert(isHe ? 'Tradovate חובר בהצלחה!' : 'Tradovate connected!');
      } else {
        const data = await res.json().catch(() => ({}));
        const errMsg = data.detail
          ? `${data.error}\n${data.detail}`
          : data.tradovateStatus
            ? `${data.error} (HTTP ${data.tradovateStatus})`
            : (data.error ?? res.status);
        alert(isHe
          ? `שגיאה בחיבור Tradovate: ${errMsg}`
          : `Tradovate connection failed: ${errMsg}`);
      }
    } catch {
      alert(isHe ? 'שגיאה בחיבור Tradovate' : 'Tradovate connection failed');
    }
  };

  const connectTopstepX = async (accountId: string) => {
    if (!topstepKey.trim()) return;
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    const jwt = session?.access_token;
    if (!jwt) return alert(isHe ? 'לא מחובר' : 'Not authenticated');
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    try {
      const res = await fetch(
        `${supabaseUrl}/functions/v1/broker-oauth`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${jwt}` },
          body: JSON.stringify({
            broker: 'topstepx',
            user_id: user?.id,
            account_id: accountId,
            api_token: topstepKey,
            api_username: user?.email ?? '',
          }),
        },
      );
      if (res.ok) {
        setTxConn((c) => ({ ...c, [accountId]: true }));
        setShowTopstepInput(false);
        setTopstepKey('');
        alert(isHe ? 'TopstepX חובר בהצלחה!' : 'TopstepX connected!');
      } else {
        const data = await res.json().catch(() => ({}));
        alert(isHe
          ? `שגיאה בחיבור TopstepX: ${data.error ?? res.status}`
          : `TopstepX connection failed: ${data.error ?? res.status}`);
      }
    } catch {
      alert(isHe ? 'שגיאה בחיבור TopstepX' : 'TopstepX connection failed');
    }
  };

  const triggerSync = async (broker: 'tradovate' | 'topstepx') => {
    setSyncing(broker);
    if (!supabase) { setSyncing(null); return; }
    const { data: { session } } = await supabase.auth.getSession();
    const jwt = session?.access_token;
    if (!jwt) { setSyncing(null); return alert(isHe ? 'לא מחובר' : 'Not authenticated'); }
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/${broker}-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ user_id: user?.id }),
      });
      const data = await res.json();
      setLastSync((s) => ({ ...s, [broker]: new Date().toLocaleTimeString() }));
      alert(isHe
        ? `סנכרון הושלם — ${data.inserted ?? 0} עסקאות חדשות`
        : `Sync complete — ${data.inserted ?? 0} new trades`);
    } catch {
      alert(isHe ? 'שגיאה בסנכרון' : 'Sync failed');
    } finally {
      setSyncing(null);
    }
  };

  const propAccounts = accounts.filter((a) => a.account_type === 'prop_firm' || a.broker !== 'manual');
  const allAccounts = accounts.length > 0 ? accounts : [];

  return (
    <div className="settings-section">
      <div className="section-title">{T.brokerConnections}</div>

      {/* Tradovate */}
      <div className="list-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="list-card-info">
            <div className="list-card-name">Tradovate</div>
            <div className="list-card-meta">Futures & Options · Username / Password</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {lastSync.tradovate && (
              <span style={{ fontSize: '.7rem', color: 'var(--t3)' }}>{T.lastSync}: {lastSync.tradovate}</span>
            )}
            <button className="btn btn-ghost" style={{ fontSize: '.78rem', padding: '5px 12px' }}
              onClick={() => triggerSync('tradovate')}
              disabled={syncing === 'tradovate'}>
              {syncing === 'tradovate' ? '...' : T.syncNow}
            </button>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 10 }}>
          <div style={{ fontSize: '.74rem', color: 'var(--t3)', marginBottom: 8 }}>
            {isHe
              ? 'אימייל + סיסמה של חשבון Tradovate Live'
              : 'Your Tradovate Live account email & password'}
          </div>
          {!showTradovateInput ? (
            <button className="btn btn-primary" style={{ fontSize: '.8rem', padding: '6px 14px' }}
              onClick={() => setShowTradovateInput(true)}>
              + {isHe ? 'הוסף פרטי כניסה' : 'Add Credentials'}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                className="form-input"
                type="email"
                placeholder={isHe ? 'אימייל Tradovate...' : 'Tradovate email...'}
                value={tradovateUser}
                onChange={(e) => setTradovateUser(e.target.value)}
              />
              <input
                className="form-input"
                type="password"
                placeholder={isHe ? 'סיסמה...' : 'Password...'}
                value={tradovatePass}
                onChange={(e) => setTradovatePass(e.target.value)}
              />
              {/* Live / Demo toggle */}
              <div style={{ display: 'flex', gap: 6 }}>
                {(['live', 'demo'] as const).map((env) => (
                  <button
                    key={env}
                    onClick={() => setTradovateEnv(env)}
                    style={{
                      flex: 1, padding: '6px 0', fontSize: '.78rem', fontWeight: 600,
                      borderRadius: 'var(--rad)', border: '1.5px solid',
                      cursor: 'pointer', transition: 'all .12s',
                      borderColor: tradovateEnv === env ? 'var(--g)' : 'var(--bd2)',
                      background: tradovateEnv === env ? 'rgba(29,185,84,.12)' : 'var(--s2)',
                      color: tradovateEnv === env ? 'var(--g)' : 'var(--t2)',
                    }}>
                    {env === 'live'
                      ? (isHe ? 'Live (חי)' : 'Live')
                      : (isHe ? 'Demo / תיק מבחן' : 'Demo / Eval')}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '.74rem', color: 'var(--t3)', marginBottom: 4 }}>
                {isHe ? 'קשר לחשבון:' : 'Link to account:'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {allAccounts.map((acc) => (
                  <div key={acc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--s1)', borderRadius: 7, border: '1px solid var(--bd)' }}>
                    <span style={{ fontSize: '.84rem' }}>{acc.name}</span>
                    <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '.76rem' }}
                      onClick={() => connectTradovate(acc.id)}
                      disabled={!tradovateUser.trim() || !tradovatePass.trim()}>
                      {isHe ? 'חבר' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
              <button className="btn btn-ghost" onClick={() => { setShowTradovateInput(false); setTradovateUser(''); setTradovatePass(''); }}>
                {T.cancel}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TopstepX */}
      <div className="list-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="list-card-info">
            <div className="list-card-name">TopstepX</div>
            <div className="list-card-meta">Funded Trader · API Token</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {lastSync.topstepx && (
              <span style={{ fontSize: '.7rem', color: 'var(--t3)' }}>{T.lastSync}: {lastSync.topstepx}</span>
            )}
            <button className="btn btn-ghost" style={{ fontSize: '.78rem', padding: '5px 12px' }}
              onClick={() => triggerSync('topstepx')}
              disabled={syncing === 'topstepx'}>
              {syncing === 'topstepx' ? '...' : T.syncNow}
            </button>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 10 }}>
          <div style={{ fontSize: '.74rem', color: 'var(--t3)', marginBottom: 8 }}>
            {isHe
              ? 'TopstepX → Settings → API Key → העתק את ה-Token'
              : 'TopstepX → Settings → API Key → Copy your Token'}
          </div>
          {!showTopstepInput ? (
            <button className="btn btn-primary" style={{ fontSize: '.8rem', padding: '6px 14px' }}
              onClick={() => setShowTopstepInput(true)}>
              + {isHe ? 'הוסף API Token' : 'Add API Token'}
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                className="form-input"
                type="password"
                placeholder={isHe ? 'הדבק API Token מ-TopstepX...' : 'Paste API Token from TopstepX...'}
                value={topstepKey}
                onChange={(e) => setTopstepKey(e.target.value)}
              />
              <div style={{ fontSize: '.74rem', color: 'var(--t3)', marginBottom: 4 }}>
                {isHe ? 'קשר לחשבון:' : 'Link to account:'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {allAccounts.map((acc) => (
                  <div key={acc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--s1)', borderRadius: 7, border: '1px solid var(--bd)' }}>
                    <span style={{ fontSize: '.84rem' }}>{acc.name}</span>
                    <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '.76rem' }}
                      onClick={() => connectTopstepX(acc.id)}
                      disabled={!topstepKey.trim()}>
                      {isHe ? 'חבר' : 'Connect'}
                    </button>
                  </div>
                ))}
              </div>
              <button className="btn btn-ghost" onClick={() => { setShowTopstepInput(false); setTopstepKey(''); }}>
                {T.cancel}
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

/* ── דף ראשי ── */
export default function Settings() {
  const { lang, accounts, strategies, user, dailyGoalTarget, dailyMaxLoss, dataLoading, setDailyGoalTarget, setDailyMaxLoss, addAccount, updateAccount, deleteAccount, addStrategy, updateStrategy, deleteStrategy, setUser, reloadFromCloud, setOnboardingDone } = useStore();
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


      {/* יעדים יומיים */}
      <div className="settings-section">
        <div className="section-title">{lang === 'he' ? 'יעדים יומיים' : 'Daily Goals'}</div>
        <div className="daily-goals-grid">
          <div>
            <label className="form-label">{lang === 'he' ? 'יעד רווח יומי ($)' : 'Daily Profit Target ($)'}</label>
            <input
              type="number"
              className="form-input"
              min={0}
              value={dailyGoalTarget || ''}
              placeholder="0"
              onChange={(e) => setDailyGoalTarget(Math.max(0, Number(e.target.value)))}
            />
          </div>
          <div>
            <label className="form-label">{lang === 'he' ? 'גבול הפסד יומי ($)' : 'Daily Max Loss ($)'}</label>
            <input
              type="number"
              className="form-input"
              min={0}
              value={dailyMaxLoss || ''}
              placeholder="0"
              onChange={(e) => setDailyMaxLoss(Math.max(0, Number(e.target.value)))}
            />
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: '.74rem', color: 'var(--t3)', lineHeight: 1.7 }}>
          {lang === 'he'
            ? '💡 הגדר 0 להשבית יעד. היעדים יוצגו בדשבורד עם progress bar להיום.'
            : '💡 Set 0 to disable a goal. Goals appear on the dashboard with a progress bar for today.'}
        </div>
      </div>

      {/* חיבורי ברוקר */}
      {!DEMO_MODE && (
        <BrokerSection lang={lang} accounts={accounts} user={user} />
      )}

      {/* פרופיל + התנתקות */}
      <div className="settings-section">
        <div className="section-title">{lang === 'he' ? 'פרופיל וחשבון' : 'Profile & Account'}</div>
        <div className="list-card">
          <div className="list-card-info">
            <div className="list-card-name">{user?.name ?? 'User'}</div>
            <div className="list-card-meta">{user?.email ?? ''}</div>
          </div>
          {!DEMO_MODE && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn"
                onClick={reloadFromCloud}
                disabled={dataLoading}
                style={{ display: 'flex', alignItems: 'center', gap: 7, border: '1px solid var(--bd2)', color: 'var(--t2)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="1,4 1,10 7,10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-3.17"/>
                </svg>
                {dataLoading ? '...' : (lang === 'he' ? 'סנכרן' : 'Sync')}
              </button>
              <button className="btn" onClick={() => setOnboardingDone(false)} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4l3 3"/>
                </svg>
                {lang === 'he' ? 'מדריך כניסה' : 'Onboarding Guide'}
              </button>
              <button className="btn btn-danger" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16,17 21,12 16,7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                {T.logout}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="disclaimer">{T.disclaimer}</div>
    </div>
  );
}
