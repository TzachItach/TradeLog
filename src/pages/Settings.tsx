import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useT } from '../i18n';
import { signOut, DEMO_MODE, supabase } from '../lib/supabase';
import type { Account, Strategy, StrategyField, PropExpense, ExpenseFeeType } from '../types';

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
          <select className="form-input" value={form.account_type} onChange={(e) => {
            const at = e.target.value as Account['account_type'];
            if (at === 'demo') {
              setForm(f => ({ ...f, account_type: at, prop_phase: 'challenge' }));
              setShowPropFields(true);
            } else if (at === 'prop_firm') {
              setForm(f => ({ ...f, account_type: at, prop_phase: 'funded' }));
              setShowPropFields(true);
            } else {
              setForm(f => ({ ...f, account_type: at }));
            }
          }}>
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
      {(form.account_type === 'prop_firm' || form.account_type === 'demo') && (
        <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--b-bg)', border: '1px solid var(--b-bd)', borderRadius: 10 }}>
          <div style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--b)', marginBottom: showPropFields ? 14 : 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              {isHe ? 'הגדרות Prop Firm' : 'Prop Firm Settings'}
              {form.account_type !== 'demo' && (
                <span style={{ fontSize: '.68rem', fontWeight: 400, color: 'var(--t3)' }}>
                  {isHe ? '(אופציונלי)' : '(optional)'}
                </span>
              )}
            </div>
            {form.account_type !== 'demo' && (
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
            )}
          </div>

          {showPropFields && (
            <div className="form-grid">
              <div>
                <label className="form-label">{isHe ? 'שלב' : 'Phase'}</label>
                <select className="form-input" value={form.prop_phase ?? (form.account_type === 'prop_firm' ? 'funded' : 'challenge')}
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

              {(form.prop_phase ?? (form.account_type === 'prop_firm' ? 'funded' : 'challenge')) === 'challenge' && (
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
      // Update sort_order to match the new visual order so it persists
      return { ...f, fields: fields.map((field, i) => ({ ...field, sort_order: i + 1 })) };
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
        <button className="btn btn-primary" onClick={() => {
          if (!form.name.trim()) { alert(isHe ? 'נא להזין שם אסטרטגיה' : 'Please enter a strategy name'); return; }
          onSave(form);
        }}>{T.save}</button>
      </div>
    </div>
  );
}

/* ── ניהול חיבורי ברוקר ── */
function BrokerSection({ lang, accounts, user, onSyncSuccess }: { lang: string; accounts: Account[]; user: { id: string; email?: string; name?: string } | null; onSyncSuccess?: () => void }) {
  const isHe = lang === 'he';
  const T = useT(lang as 'he' | 'en');
  const [topstepKey, setTopstepKey] = useState('');
  const [topstepEmail, setTopstepEmail] = useState('');
  const [showTopstepInput, setShowTopstepInput] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<{ [k: string]: string }>({});
  const [pxAccounts, setPxAccounts] = useState<{ id: number; name: string; canTrade: boolean; isVisible: boolean }[]>([]);
  const [selectedPxId, setSelectedPxId] = useState<number | null>(null);
  const [fetchingPx, setFetchingPx] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string ?? '';

  const resetTopstepForm = () => {
    setShowTopstepInput(false);
    setTopstepKey('');
    setTopstepEmail('');
    setPxAccounts([]);
    setSelectedPxId(null);
  };

  const fetchPxAccounts = async () => {
    if (!topstepKey.trim() || !topstepEmail.trim() || !supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    const jwt = session?.access_token;
    if (!jwt) return alert(isHe ? 'לא מחובר' : 'Not authenticated');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string;
    setFetchingPx(true);
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/broker-oauth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ broker: 'topstepx', user_id: user?.id, api_token: topstepKey, api_username: topstepEmail.trim(), step: 'validate' }),
      });
      const data = await res.json();
      if (res.ok && data.accounts?.length > 0) {
        setPxAccounts(data.accounts);
        if (data.accounts.length === 1) setSelectedPxId(data.accounts[0].id);
      } else {
        const msg = [data.error, data.detail].filter(Boolean).join(' — ');
        alert(isHe ? `שגיאה: ${msg || res.status}` : `Error: ${msg || res.status}`);
      }
    } catch {
      alert(isHe ? 'שגיאה בגישה ל-TopstepX' : 'Could not reach TopstepX');
    } finally {
      setFetchingPx(false);
    }
  };

  const connectTopstepX = async (tradelogAccountId: string) => {
    if (!topstepKey.trim() || selectedPxId === null) return;
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    const jwt = session?.access_token;
    if (!jwt) return alert(isHe ? 'לא מחובר' : 'Not authenticated');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string;
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/broker-oauth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({
          broker: 'topstepx',
          user_id: user?.id,
          account_id: tradelogAccountId,
          api_token: topstepKey,
          api_username: topstepEmail.trim(),
          projectx_account_id: selectedPxId,
          step: 'connect',
        }),
      });
      if (res.ok) {
        resetTopstepForm();
        alert(isHe ? 'TopstepX חובר בהצלחה!' : 'TopstepX connected!');
      } else {
        const data = await res.json().catch(() => ({}));
        const msg = [data.error, data.detail].filter(Boolean).join(' — ');
        alert(isHe
          ? `שגיאה בחיבור TopstepX: ${msg || res.status}`
          : `TopstepX connection failed: ${msg || res.status}`);
      }
    } catch {
      alert(isHe ? 'שגיאה בחיבור TopstepX' : 'TopstepX connection failed');
    }
  };

  const triggerSync = async () => {
    setSyncing('topstepx');
    if (!supabase) { setSyncing(null); return; }
    const { data: { session } } = await supabase.auth.getSession();
    const jwt = session?.access_token;
    if (!jwt) { setSyncing(null); return alert(isHe ? 'לא מחובר' : 'Not authenticated'); }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/topstepx-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ user_id: user?.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(isHe ? `שגיאה בסנכרון: ${data.error ?? res.status}` : `Sync failed: ${data.error ?? res.status}`);
      } else {
        const errs: string[] = data.errors ?? [];
        const inserted: number = data.inserted ?? 0;
        if (errs.length > 0 && inserted === 0) {
          alert(isHe ? `שגיאה בסנכרון: ${errs[0]}` : `Sync failed: ${errs[0]}`);
        } else if (errs.length > 0) {
          alert(isHe
            ? `סנכרון הושלם — ${inserted} עסקאות חדשות (שגיאה: ${errs[0]})`
            : `Sync complete — ${inserted} new trades (error: ${errs[0]})`);
        } else {
          alert(isHe ? `סנכרון הושלם — ${inserted} עסקאות חדשות` : `Sync complete — ${inserted} new trades`);
        }
        if (inserted > 0) onSyncSuccess?.();
      }
      setLastSync((s) => ({ ...s, topstepx: new Date().toLocaleTimeString() }));
    } catch {
      alert(isHe ? 'שגיאה בסנכרון' : 'Sync failed');
    } finally {
      setSyncing(null);
    }
  };

  const allAccounts = accounts.length > 0 ? accounts : [];

  return (
    <div id="tour-broker-section" className="settings-section">
      <div className="section-title">{T.brokerConnections}</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10, alignItems: 'start' }}>

      {/* Tradovate — Coming Soon */}
      <div className="list-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, opacity: 0.85 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="list-card-info">
            <div className="list-card-name" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Tradovate
              <span style={{ fontSize: '.68rem', fontWeight: 700, background: 'rgba(245,155,35,.15)', color: 'var(--o)', border: '1px solid rgba(245,155,35,.35)', borderRadius: 20, padding: '2px 9px' }}>
                {isHe ? 'בקרוב' : 'Coming Soon'}
              </span>
            </div>
            <div className="list-card-meta">Futures & Options · {isHe ? 'סנכרון אוטומטי בפיתוח' : 'Auto-sync in development'}</div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 8 }}>
          <div style={{ fontSize: '.77rem', color: 'var(--t3)', lineHeight: 1.5 }}>
            {isHe
              ? 'סנכרון אוטומטי בפיתוח. ייבוא ידני: עמוד עסקאות ← כפתור "ייבוא"'
              : 'Auto-sync coming soon. Import manually: Trades page → "Import" button'}
          </div>
        </div>
      </div>

      {/* TopstepX */}
      <div className="list-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
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
              onClick={() => triggerSync()}
              disabled={syncing === 'topstepx'}>
              {syncing === 'topstepx' ? '...' : T.syncNow}
            </button>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 10 }}>
          {!showTopstepInput ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontSize: '.74rem', color: 'var(--t3)' }}>
                {isHe ? 'TopstepX → Settings → API Key' : 'TopstepX → Settings → API Key'}
              </span>
              <button className="btn btn-primary" style={{ fontSize: '.78rem', padding: '5px 13px', flexShrink: 0 }}
                onClick={() => setShowTopstepInput(true)}>
                + {isHe ? 'הוסף' : 'Add Token'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <input
                className="form-input"
                type="email"
                placeholder={isHe ? 'אימייל TopstepX...' : 'TopstepX email...'}
                value={topstepEmail}
                onChange={(e) => { setTopstepEmail(e.target.value); setPxAccounts([]); setSelectedPxId(null); }}
              />
              <input
                className="form-input"
                type="password"
                placeholder={isHe ? 'API Token מ-TopstepX...' : 'API Token from TopstepX...'}
                value={topstepKey}
                onChange={(e) => { setTopstepKey(e.target.value); setPxAccounts([]); setSelectedPxId(null); }}
              />

              {pxAccounts.length === 0 ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                  <button className="btn btn-primary" style={{ fontSize: '.78rem', padding: '5px 14px' }}
                    onClick={fetchPxAccounts}
                    disabled={!topstepKey.trim() || !topstepEmail.trim() || fetchingPx}>
                    {fetchingPx ? (isHe ? 'מחפש...' : 'Searching...') : (isHe ? 'מצא חשבונות' : 'Find Accounts')}
                  </button>
                  <button className="btn btn-ghost" style={{ fontSize: '.78rem', padding: '5px 12px' }}
                    onClick={resetTopstepForm}>
                    {T.cancel}
                  </button>
                </div>
              ) : (
                <>
                  {/* Step 2: pick ProjectX account (only shown when >1 and none chosen yet) */}
                  {pxAccounts.length > 1 && selectedPxId === null && (
                    <div>
                      <div style={{ fontSize: '.74rem', color: 'var(--t3)', marginBottom: 6 }}>
                        {isHe ? `נמצאו ${pxAccounts.length} חשבונות — בחר חשבון TopstepX:` : `Found ${pxAccounts.length} accounts — select a TopstepX account:`}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {pxAccounts.map((pxa) => (
                          <div key={pxa.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'var(--s1)', borderRadius: 7, border: '1px solid var(--bd)' }}>
                            <div>
                              <div style={{ fontSize: '.84rem', fontWeight: 600 }}>{pxa.name}</div>
                              {!pxa.canTrade && <div style={{ fontSize: '.72rem', color: 'var(--r)' }}>{isHe ? 'לא ניתן למסחר' : 'Cannot trade'}</div>}
                            </div>
                            <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '.76rem' }}
                              onClick={() => setSelectedPxId(pxa.id)}>
                              {isHe ? 'בחר' : 'Select'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 3: pick TradeLog account to link to */}
                  {selectedPxId !== null && (
                    <div>
                      {/* Show which PX account was chosen + allow changing */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: '6px 10px', background: 'var(--s2)', borderRadius: 7, border: '1px solid var(--bd)' }}>
                        <span style={{ fontSize: '.8rem', color: 'var(--g)', flex: 1 }}>
                          ✓ {pxAccounts.find((a) => a.id === selectedPxId)?.name ?? `Account #${selectedPxId}`}
                        </span>
                        {pxAccounts.length > 1 && (
                          <button className="btn btn-ghost" style={{ fontSize: '.72rem', padding: '3px 10px' }}
                            onClick={() => setSelectedPxId(null)}>
                            {isHe ? 'שנה' : 'Change'}
                          </button>
                        )}
                      </div>
                      <div style={{ fontSize: '.74rem', color: 'var(--t3)', marginBottom: 6 }}>
                        {isHe ? 'קשר לחשבון TraderYo:' : 'Link to TraderYo account:'}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {allAccounts.map((acc) => (
                          <div key={acc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--s1)', borderRadius: 7, border: '1px solid var(--bd)' }}>
                            <span style={{ fontSize: '.84rem' }}>{acc.name}</span>
                            <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '.76rem' }}
                              onClick={() => connectTopstepX(acc.id)}>
                              {isHe ? 'חבר' : 'Connect'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <button className="btn btn-ghost" style={{ fontSize: '.76rem', padding: '4px 12px', alignSelf: 'flex-start', marginTop: 4 }}
                    onClick={resetTopstepForm}>
                    {T.cancel}
                  </button>
                </>
              )}

            </div>
          )}
        </div>
      </div>

      </div>{/* end broker grid */}
    </div>
  );
}

/* ── דף ראשי ── */
export default function Settings() {
  const { lang, accounts, strategies, user, dailyGoalTarget, dailyMaxLoss, dataLoading, setDailyGoalTarget, setDailyMaxLoss, addAccount, updateAccount, deleteAccount, addStrategy, updateStrategy, deleteStrategy, setUser, reloadFromCloud, setOnboardingDone, addExpense } = useStore();
  const T = useT(lang);
  const navigate = useNavigate();
  const isHe = lang === 'he';
  const [accForm, setAccForm] = useState<'new' | string | null>(null);
  const [stratForm, setStratForm] = useState<'new' | string | null>(null);
  const [expPrompt, setExpPrompt] = useState<Account | null>(null);
  const [expCost, setExpCost] = useState('');
  const [expFeeType, setExpFeeType] = useState<ExpenseFeeType>('challenge');

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
            onSave={(a) => {
              addAccount(a);
              setAccForm(null);
              if (a.account_type === 'prop_firm') {
                setExpCost('');
                setExpFeeType('challenge');
                setExpPrompt(a);
              }
            }}
            onCancel={() => setAccForm(null)} />
        )}
      </div>

      {/* ── Expense Prompt ── */}
      {expPrompt && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}
          onClick={() => setExpPrompt(null)}
        >
          <div
            dir={isHe ? 'rtl' : 'ltr'}
            style={{
              background: 'var(--s1)', border: '1px solid var(--bd2)', borderRadius: 14,
              padding: '24px 28px', width: '100%', maxWidth: 380, boxShadow: '0 8px 32px rgba(0,0,0,.4)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* כותרת */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--g)" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--t1)' }}>
                {isHe ? 'הוסף לניהול עסקי?' : 'Add to Business Manager?'}
              </span>
            </div>
            <p style={{ fontSize: '.82rem', color: 'var(--t3)', marginBottom: 18, lineHeight: 1.5 }}>
              {isHe
                ? `שילמת עבור תיק "${expPrompt.name}"? הוסף את העלות לניהול העסקי שלך.`
                : `Did you pay for "${expPrompt.name}"? Add the cost to your business tracker.`}
            </p>

            {/* שדות */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">{isHe ? 'עלות ($)' : 'Cost ($)'}</label>
                <input
                  type="number" min={0} className="form-input"
                  placeholder="e.g. 150"
                  value={expCost}
                  onChange={(e) => setExpCost(e.target.value)}
                  autoFocus
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">{isHe ? 'סוג' : 'Type'}</label>
                <select className="form-input" value={expFeeType} onChange={(e) => setExpFeeType(e.target.value as ExpenseFeeType)}>
                  <option value="challenge">{isHe ? 'מבחן' : 'Challenge'}</option>
                  <option value="reset">{isHe ? 'ריסט' : 'Reset'}</option>
                  <option value="activation">{isHe ? 'הפעלה' : 'Activation'}</option>
                  <option value="data_fee">{isHe ? 'דמי נתונים' : 'Data Fee'}</option>
                  <option value="other">{isHe ? 'אחר' : 'Other'}</option>
                </select>
              </div>
            </div>

            {/* כפתורים */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setExpPrompt(null)}>
                {isHe ? 'לא עכשיו' : 'Not now'}
              </button>
              <button
                className="btn btn-primary"
                disabled={!expCost || Number(expCost) <= 0}
                onClick={() => {
                  const expense: PropExpense = {
                    id: crypto.randomUUID(),
                    account_id: expPrompt.id,
                    prop_firm: expPrompt.name,
                    account_size: expPrompt.initial_balance,
                    fee_type: expFeeType,
                    amount: Number(expCost),
                    date: new Date().toISOString().slice(0, 10),
                  };
                  addExpense(expense);
                  setExpPrompt(null);
                }}
              >
                {isHe ? 'הוסף הוצאה' : 'Add Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* אסטרטגיות */}
      <div id="tour-strategy-section" className="settings-section">
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
        <BrokerSection lang={lang} accounts={accounts} user={user} onSyncSuccess={reloadFromCloud} />
      )}

      {/* פרופיל + התנתקות */}
      <div className="settings-section">
        <div className="section-title">{lang === 'he' ? 'פרופיל וחשבון' : 'Profile & Account'}</div>
        <div className="list-card settings-profile-card">
          <div className="list-card-info">
            <div className="list-card-name">{user?.name ?? 'User'}</div>
            <div className="list-card-meta">{user?.email ?? ''}</div>
          </div>
          {!DEMO_MODE && (
            <div className="settings-profile-actions">
              <button
                className="btn btn-ghost"
                onClick={reloadFromCloud}
                disabled={dataLoading}
                style={{ gap: 7 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="1,4 1,10 7,10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-3.17"/>
                </svg>
                {dataLoading ? '...' : (lang === 'he' ? 'סנכרן' : 'Sync')}
              </button>
              <button className="btn btn-ghost" onClick={() => { navigate('/dashboard'); setTimeout(() => setOnboardingDone(false), 100); }} style={{ gap: 7 }}>
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
