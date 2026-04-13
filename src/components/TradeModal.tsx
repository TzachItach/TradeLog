import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { useT } from '../i18n';
import type { Trade } from '../types';

const EMPTY_TRADE = (date: string, accountId: string): Omit<Trade, 'id'> => ({
  account_id: accountId,
  strategy_id: 's1',
  symbol: '',
  direction: 'long',
  trade_date: date,
  pnl: 0,
  size: undefined,
  stop_loss_pts: undefined,
  take_profit_pts: undefined,
  htf_pd_array: '',
  psychology: '',
  notes: '',
  confirmations: {},
  field_values: {},
  source: 'manual',
});

export default function TradeModal() {
  const { lang, modal, setModal, accounts, strategies, trades, addTrade, updateTrade, deleteTrade, selectedAccount } = useStore();
  const T = useT(lang);
  const overlayRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split('T')[0];
  const defaultAccId = selectedAccount !== 'all' ? selectedAccount : (accounts[0]?.id ?? '');

  const existingTrade = modal?.type === 'edit' ? trades.find((t) => t.id === (modal as { type: 'edit'; tradeId: string }).tradeId) : undefined;

  const [form, setForm] = useState<Omit<Trade, 'id'>>(() =>
    existingTrade
      ? { ...existingTrade }
      : EMPTY_TRADE(modal?.type === 'new' && (modal as { type: 'new'; date?: string }).date ? (modal as { type: 'new'; date?: string }).date! : today, defaultAccId),
  );
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(null); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setModal]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleCb = (label: string) =>
    setForm((f) => ({ ...f, confirmations: { ...f.confirmations, [label]: !f.confirmations[label] } }));

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'));
    setMediaFiles((p) => [...p, ...arr]);
    arr.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => setMediaPreviews((p) => [...p, e.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const save = () => {
    if (!form.symbol.trim()) { alert(lang === 'he' ? 'נא להזין סמל' : 'Please enter a symbol'); return; }
    if (existingTrade) {
      updateTrade({ ...form, id: existingTrade.id });
    } else {
      addTrade({ ...form, id: `t-${Date.now()}`, pnl: Number(form.pnl) || 0 });
    }
    setModal(null);
  };

  const handleDelete = () => {
    if (!existingTrade) return;
    if (window.confirm(T.confirmDelete)) {
      deleteTrade(existingTrade.id);
      setModal(null);
    }
  };

  const currentStrategy = strategies.find((s) => s.id === form.strategy_id);
  const checkboxFields = currentStrategy?.fields.filter((f) => f.field_type === 'checkbox') ?? [];

  const isNew = modal?.type === 'new';

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) setModal(null); }}
    >
      <div className="modal-box" dir={lang === 'he' ? 'rtl' : 'ltr'}>
        <div className="modal-head">
          <span className="modal-title">{isNew ? T.addTrade : T.editTrade}</span>
          <button className="btn-close" onClick={() => setModal(null)}>×</button>
        </div>

        <div className="form-grid">
          {/* Date */}
          <div>
            <label className="form-label">{T.date}</label>
            <input
              type="date"
              className="form-input"
              value={form.trade_date}
              onChange={(e) => set('trade_date', e.target.value)}
            />
          </div>

          {/* Symbol */}
          <div>
            <label className="form-label">{T.symbol}</label>
            <input
              type="text"
              className="form-input"
              placeholder="NQ, ES, CL, GC..."
              value={form.symbol}
              onChange={(e) => set('symbol', e.target.value.toUpperCase())}
            />
          </div>

          {/* Direction */}
          <div className="s2">
            <label className="form-label">{T.direction}</label>
            <div className="dir-btns">
              <button
                className={`dir-btn${form.direction === 'long' ? ' long-on' : ''}`}
                onClick={() => set('direction', 'long')}
              >▲ {T.long}</button>
              <button
                className={`dir-btn${form.direction === 'short' ? ' short-on' : ''}`}
                onClick={() => set('direction', 'short')}
              >▼ {T.short}</button>
            </div>
          </div>

          {/* P&L */}
          <div>
            <label className="form-label">{T.pnl} ($)</label>
            <input
              type="number"
              className="form-input"
              placeholder="e.g. 1250 or -430"
              value={form.pnl || ''}
              onChange={(e) => set('pnl', Number(e.target.value))}
            />
          </div>

          {/* Size */}
          <div>
            <label className="form-label">{T.size}</label>
            <input
              type="number"
              className="form-input"
              placeholder="1"
              min="0"
              step="0.5"
              value={form.size ?? ''}
              onChange={(e) => set('size', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>

          {/* Stop Loss */}
          <div>
            <label className="form-label">{T.stopLoss}</label>
            <input
              type="number"
              className="form-input"
              placeholder="pts"
              min="0"
              value={form.stop_loss_pts ?? ''}
              onChange={(e) => set('stop_loss_pts', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>

          {/* Take Profit */}
          <div>
            <label className="form-label">{T.takeProfit}</label>
            <input
              type="number"
              className="form-input"
              placeholder="pts"
              min="0"
              value={form.take_profit_pts ?? ''}
              onChange={(e) => set('take_profit_pts', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>

          {/* Strategy */}
          <div>
            <label className="form-label">{T.strategy}</label>
            <select
              className="form-input"
              value={form.strategy_id ?? ''}
              onChange={(e) => set('strategy_id', e.target.value)}
            >
              <option value="">— {T.allStrategies} —</option>
              {strategies.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Account */}
          <div>
            <label className="form-label">{T.account}</label>
            <select
              className="form-input"
              value={form.account_id}
              onChange={(e) => set('account_id', e.target.value)}
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Confirmations */}
          {checkboxFields.length > 0 && (
            <div className="s2">
              <label className="form-label">{T.confirmations}</label>
              <div className="cb-grid">
                {checkboxFields.map((f) => {
                  const checked = !!form.confirmations[f.label];
                  return (
                    <div
                      key={f.id}
                      className={`cb-item${checked ? ' on' : ''}`}
                      onClick={() => toggleCb(f.label)}
                    >
                      <div className={`cb-box${checked ? ' on' : ''}`}>
                        {checked && (
                          <svg width="9" height="9" viewBox="0 0 10 10">
                            <polyline points="1,5 4,8 9,2" fill="none" stroke="white" strokeWidth="1.8" />
                          </svg>
                        )}
                      </div>
                      <span>{f.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* HTF PD Array */}
          <div className="s2">
            <label className="form-label">{T.htfPdArray}</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 4H FVG / 1D OB"
              value={form.htf_pd_array ?? ''}
              onChange={(e) => set('htf_pd_array', e.target.value)}
            />
          </div>

          {/* Psychology */}
          <div className="s2">
            <label className="form-label">{T.psychology}</label>
            <input
              type="text"
              className="form-input"
              placeholder={lang === 'he' ? 'מצב רוח, ריכוז, לחץ...' : 'Focus, emotions, confidence...'}
              value={form.psychology ?? ''}
              onChange={(e) => set('psychology', e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="s2">
            <label className="form-label">{T.notes}</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder={lang === 'he' ? 'הערות חופשיות על העסקה...' : 'Free-form notes about the trade...'}
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>

          {/* Media Upload */}
          <div className="s2">
            <label className="form-label">{T.media}</label>
            <div
              className={`upload-zone${dragOver ? ' drag' : ''}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21,15 16,10 5,21" />
              </svg>
              <div className="upload-text">{T.dragDrop}</div>
              <div className="upload-sub">{T.clickUpload} · PNG · JPG · SVG</div>
              {mediaPreviews.length > 0 && (
                <div className="upload-thumb" onClick={(e) => e.stopPropagation()}>
                  {mediaPreviews.map((src, i) => (
                    <img key={i} src={src} alt={`screenshot-${i}`} />
                  ))}
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        </div>

        <div className="modal-actions">
          {!isNew && (
            <button className="btn btn-danger" onClick={handleDelete}>
              {T.delete}
            </button>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={() => setModal(null)}>{T.cancel}</button>
          <button className="btn btn-primary" onClick={save}>{T.save}</button>
        </div>
      </div>
    </div>
  );
}
