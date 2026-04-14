import { useRef, useState } from 'react';
import { useStore } from '../store';
import { useT } from '../i18n';

interface ParsedTrade {
  symbol: string;
  direction: 'long' | 'short';
  trade_date: string;
  pnl: number;
  size: number;
  notes: string;
  broker_trade_id: string;
}

// ── פרסור P&L של Tradovate: $(110.00) → -110, $470.00 → 470 ──
function parseTradovatePnL(raw: string): number {
  if (!raw) return 0;
  const s = raw.replace(/"/g, '').trim();
  // פורמט שלילי: $(110.00) או ($110.00)
  const negMatch = s.match(/\$\(([0-9,]+\.?\d*)\)|\(\$([0-9,]+\.?\d*)\)/);
  if (negMatch) return -parseFloat((negMatch[1] || negMatch[2]).replace(/,/g, ''));
  // פורמט חיובי: $470.00 או $2,150.00
  const posMatch = s.match(/\$([0-9,]+\.?\d*)/);
  if (posMatch) return parseFloat(posMatch[1].replace(/,/g, ''));
  // מספר רגיל
  return parseFloat(s.replace(/,/g, '')) || 0;
}

// ── נרמול סמל: MNQM6 → MNQ, ESZ24 → ES ──────────────────────
function normalizeSymbol(raw: string): string {
  return raw.replace(/[FGHJKMNQUVXZ]\d{1,2}$/, '').toUpperCase().trim();
}

// ── פרסור CSV של Tradovate Performance ───────────────────────
function parseTradovateCSV(text: string): ParsedTrade[] {
  // פצל לשורות תוך שמירה על שדות עם פסיקים בתוך מרכאות
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    result.push(cur.trim());
    return result;
  };

  const rawLines = text.trim().split(/\r?\n/);
  if (rawLines.length < 2) return [];

  const headers = parseCSVLine(rawLines[0]).map(h => h.toLowerCase().replace(/^_/, ''));

  const idx = (keys: string[]) => {
    for (const k of keys) {
      const i = headers.findIndex(h => h.includes(k));
      if (i >= 0) return i;
    }
    return -1;
  };

  const iSymbol       = idx(['symbol']);
  const iBuyFillId    = idx(['buyfillid']);
  const iSellFillId   = idx(['sellfillid']);
  const iQty          = idx(['qty', 'quantity']);
  const iBuyPrice     = idx(['buyprice']);
  const iSellPrice    = idx(['sellprice']);
  const iPnL          = idx(['pnl']);
  const iBoughtTime   = idx(['boughttimestamp', 'boughttime']);
  const iSoldTime     = idx(['soldtimestamp', 'soldtime']);

  // בדוק שיש עמודות בסיסיות
  if (iSymbol < 0 || iPnL < 0 || iBoughtTime < 0) return [];

  // קרא את כל ה-fills
  interface Fill {
    symbol: string;
    buyFillId: string;
    sellFillId: string;
    qty: number;
    buyPrice: number;
    sellPrice: number;
    pnl: number;
    boughtTime: string;
    soldTime: string;
    tradeDate: string;
  }

  const fills: Fill[] = [];
  for (let i = 1; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);

    const rawSymbol   = cols[iSymbol] ?? '';
    const rawBought   = cols[iBoughtTime] ?? '';
    if (!rawSymbol || !rawBought) continue;

    const d = new Date(rawBought);
    if (isNaN(d.getTime())) continue;
    const tradeDate = d.toISOString().split('T')[0];

    fills.push({
      symbol:     normalizeSymbol(rawSymbol),
      buyFillId:  cols[iBuyFillId] ?? '',
      sellFillId: cols[iSellFillId] ?? '',
      qty:        parseFloat(cols[iQty] ?? '1') || 1,
      buyPrice:   parseFloat(cols[iBuyPrice] ?? '0') || 0,
      sellPrice:  parseFloat(cols[iSellPrice] ?? '0') || 0,
      pnl:        parseTradovatePnL(cols[iPnL] ?? ''),
      boughtTime: rawBought,
      soldTime:   cols[iSoldTime] ?? rawBought,
      tradeDate,
    });
  }

  if (!fills.length) return [];

  // ── אחד fills לעסקות לפי buyFillId (כניסה משותפת) ──────────
  const tradeMap = new Map<string, Fill[]>();
  for (const fill of fills) {
    const key = `${fill.symbol}|${fill.buyFillId}`;
    if (!tradeMap.has(key)) tradeMap.set(key, []);
    tradeMap.get(key)!.push(fill);
  }

  const trades: ParsedTrade[] = [];
  for (const [key, group] of tradeMap) {
    const first = group[0];
    const totalQty = group.reduce((s, f) => s + f.qty, 0);
    const totalPnL = group.reduce((s, f) => s + f.pnl, 0);

    // כיוון: buyPrice < sellPrice = long (קנה בזול, מכר ביוקר)
    const avgBuy  = group.reduce((s, f) => s + f.buyPrice * f.qty, 0) / totalQty;
    const avgSell = group.reduce((s, f) => s + f.sellPrice * f.qty, 0) / totalQty;
    const direction: 'long' | 'short' = avgBuy <= avgSell ? 'long' : 'short';

    // broker_trade_id ייחודי לפי buyFillId
    const brokerId = `tradovate-${first.buyFillId}`;

    const entryPrice = direction === 'long' ? avgBuy : avgSell;
    const exitPrice  = direction === 'long' ? avgSell : avgBuy;

    trades.push({
      symbol:          first.symbol,
      direction,
      trade_date:      first.tradeDate,
      pnl:             Math.round(totalPnL * 100) / 100,
      size:            totalQty,
      notes:           `Entry: ${entryPrice.toFixed(2)} → Exit: ${exitPrice.toFixed(2)} | Imported from Tradovate`,
      broker_trade_id: brokerId,
    });
  }

  return trades;
}

// ── פרסור CSV של TopstepX ──────────────────────────────────
function parseTopstepXCSV(text: string): ParsedTrade[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const headerLine = lines.findIndex(l =>
    l.toLowerCase().includes('instrument') || l.toLowerCase().includes('symbol') || l.toLowerCase().includes('contract')
  );
  if (headerLine < 0) return [];

  const headers = lines[headerLine].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
  const trades: ParsedTrade[] = [];

  for (let i = headerLine + 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
    if (cols.length < 3 || !cols[0]) continue;

    const get = (keys: string[]) => {
      for (const k of keys) {
        const idx = headers.findIndex(h => h.includes(k));
        if (idx >= 0 && cols[idx]) return cols[idx];
      }
      return '';
    };

    const contract  = get(['instrument', 'contract', 'symbol']);
    const side      = get(['side', 'direction', 'buy/sell', 'action']);
    const qty       = parseFloat(get(['qty', 'quantity', 'size', 'volume'])) || 1;
    const realizedP = parseFloat(get(['realized', 'net', 'pnl', 'profit', 'gain'])) || 0;
    const commission= parseFloat(get(['commission', 'fee', 'comm'])) || 0;
    const dateStr   = get(['date', 'time', 'timestamp', 'closedate', 'exitdate']);
    const id        = get(['id', 'tradeid', 'orderid']) || `tx-${i}`;

    if (!contract || !dateStr) continue;

    let trade_date = '';
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) trade_date = d.toISOString().split('T')[0];
    } catch { continue; }
    if (!trade_date) continue;

    const direction: 'long' | 'short' = side.toLowerCase().includes('sell') || side.toLowerCase() === 's' ? 'short' : 'long';
    const symbol = contract.replace(/\d{2}[A-Z]\d{2}$/, '').toUpperCase() || contract;
    const pnl = realizedP - commission;

    trades.push({
      symbol, direction, trade_date, pnl, size: qty,
      notes: commission > 0 ? `Commission: $${commission.toFixed(2)}` : 'Imported from TopstepX',
      broker_trade_id: `topstepx-${id}`,
    });
  }

  return trades;
}

// ── קומפוננטה ראשית ─────────────────────────────────────────
interface Props {
  onClose: () => void;
}

export default function BrokerImport({ onClose }: Props) {
  const { lang, accounts, addTrade, trades: existingTrades, user } = useStore();
  const T = useT(lang);
  const isHe = lang === 'he';

  const [broker, setBroker] = useState<'tradovate' | 'topstepx'>('tradovate');
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? '');
  const [parsed, setParsed] = useState<ParsedTrade[] | null>(null);
  const [duplicates, setDuplicates] = useState(0);
  const [isDrag, setIsDrag] = useState(false);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = broker === 'tradovate'
        ? parseTradovateCSV(text)
        : parseTopstepXCSV(text);

      // זהה כפילויות
      const existingIds = new Set(existingTrades.map(t => t.broker_trade_id).filter(Boolean));
      const dups = result.filter(t => existingIds.has(t.broker_trade_id)).length;
      setDuplicates(dups);
      setParsed(result);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!parsed || !accountId) return;
    setImporting(true);

    const existingIds = new Set(existingTrades.map(t => t.broker_trade_id).filter(Boolean));
    const newTrades = parsed.filter(t => !existingIds.has(t.broker_trade_id));

    for (const t of newTrades) {
      addTrade({
        id: crypto.randomUUID(),
        user_id: user?.id,
        account_id: accountId,
        symbol: t.symbol,
        direction: t.direction,
        trade_date: t.trade_date,
        pnl: t.pnl,
        size: t.size,
        notes: t.notes,
        broker_trade_id: t.broker_trade_id,
        source: broker === 'tradovate' ? 'tradovate' : 'topstepx',
        confirmations: {},
        field_values: {},
      });
    }

    setImporting(false);
    setDone(true);
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.currentTarget === e.target) onClose(); }}>
      <div className="modal-box" dir={isHe ? 'rtl' : 'ltr'} style={{ maxWidth: 520 }}>
        {/* ידית גרירה */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--bd2)' }} />
        </div>

        <div className="modal-head">
          <span className="modal-title">
            {isHe ? 'ייבוא עסקאות מ-CSV' : 'Import Trades from CSV'}
          </span>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {done ? (
          // ── מסך הצלחה ──
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 2.5 + 'rem', marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6, color: 'var(--g)' }}>
              {isHe ? 'הייבוא הושלם!' : 'Import complete!'}
            </div>
            <div style={{ fontSize: '.88rem', color: 'var(--t2)', marginBottom: 20 }}>
              {parsed && `${parsed.length - duplicates} ${isHe ? 'עסקאות חדשות יובאו' : 'new trades imported'}`}
              {duplicates > 0 && ` · ${duplicates} ${isHe ? 'כפילויות דולגו' : 'duplicates skipped'}`}
            </div>
            <button className="btn btn-primary" onClick={onClose}>{isHe ? 'סגור' : 'Close'}</button>
          </div>
        ) : (
          <>
            {/* בחירת ברוקר */}
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">{isHe ? 'ברוקר' : 'Broker'}</label>
              <div className="dir-btns">
                <button className={`dir-btn${broker === 'tradovate' ? ' long-on' : ''}`}
                  onClick={() => { setBroker('tradovate'); setParsed(null); setFileName(''); }}>
                  Tradovate
                </button>
                <button className={`dir-btn${broker === 'topstepx' ? ' long-on' : ''}`}
                  onClick={() => { setBroker('topstepx'); setParsed(null); setFileName(''); }}>
                  TopstepX
                </button>
              </div>
            </div>

            {/* בחירת חשבון */}
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">{T.account}</label>
              <select className="form-input" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            {/* הוראות */}
            <div style={{ background: 'var(--b-bg)', border: '1px solid var(--b-bd)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '.78rem', color: 'var(--t2)', lineHeight: 1.7 }}>
              {broker === 'tradovate' ? (
                isHe
                  ? <>📥 <strong style={{ color: 'var(--b)' }}>Tradovate:</strong> פתח את הפלטפורמה ← Activity ← Trade History ← Export CSV</>
                  : <>📥 <strong style={{ color: 'var(--b)' }}>Tradovate:</strong> Open platform ← Activity ← Trade History ← Export CSV</>
              ) : (
                isHe
                  ? <>📥 <strong style={{ color: 'var(--b)' }}>TopstepX:</strong> כנס לחשבון ← Reports ← Trading Activity ← Export</>
                  : <>📥 <strong style={{ color: 'var(--b)' }}>TopstepX:</strong> Login ← Reports ← Trading Activity ← Export</>
              )}
            </div>

            {/* אזור העלאה */}
            <div
              className={`upload-zone${isDrag ? ' drag' : ''}`}
              style={{ marginBottom: 14 }}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDrag(true); }}
              onDragLeave={() => setIsDrag(false)}
              onDrop={(e) => {
                e.preventDefault(); setIsDrag(false);
                const file = e.dataTransfer.files[0];
                if (file) processFile(file);
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17,8 12,3 7,8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <div className="upload-text">
                {fileName
                  ? `✓ ${fileName}`
                  : isHe ? 'גרור קובץ CSV לכאן' : 'Drag CSV file here'}
              </div>
              <div className="upload-sub">{isHe ? 'או לחץ לבחירת קובץ' : 'or click to browse'} · .csv</div>
              <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
            </div>

            {/* תצוגה מקדימה */}
            {parsed !== null && (
              <div style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
                {parsed.length === 0 ? (
                  <div style={{ color: 'var(--r)', fontSize: '.84rem' }}>
                    {isHe ? '⚠ לא נמצאו עסקאות בקובץ. בדוק שזה הפורמט הנכון.' : '⚠ No trades found. Check the file format.'}
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: '.65rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{isHe ? 'סה"כ' : 'Total'}</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--b)' }}>{parsed.length}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '.65rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{isHe ? 'חדשות' : 'New'}</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--g)' }}>{parsed.length - duplicates}</div>
                      </div>
                      {duplicates > 0 && (
                        <div>
                          <div style={{ fontSize: '.65rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{isHe ? 'כפילויות' : 'Duplicates'}</div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--o)' }}>{duplicates}</div>
                        </div>
                      )}
                    </div>
                    {/* תצוגה מקדימה - 3 עסקאות ראשונות */}
                    <div style={{ fontSize: '.72rem', color: 'var(--t3)', marginBottom: 5 }}>
                      {isHe ? 'תצוגה מקדימה:' : 'Preview:'}
                    </div>
                    {parsed.slice(0, 3).map((t, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, fontSize: '.78rem', padding: '4px 0', borderBottom: '1px solid var(--bd)', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{t.symbol}</span>
                        <span className={`dir-badge ${t.direction}`}>{t.direction === 'long' ? '▲' : '▼'}</span>
                        <span style={{ color: 'var(--t3)' }}>{t.trade_date}</span>
                        <span style={{ marginInlineStart: 'auto', fontFamily: 'monospace', fontWeight: 700, color: t.pnl >= 0 ? 'var(--g)' : 'var(--r)' }}>
                          {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(0)}
                        </span>
                      </div>
                    ))}
                    {parsed.length > 3 && (
                      <div style={{ fontSize: '.72rem', color: 'var(--t3)', marginTop: 5 }}>
                        +{parsed.length - 3} {isHe ? 'נוספות...' : 'more...'}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={onClose}>{T.cancel}</button>
              <button
                className="btn btn-primary"
                onClick={handleImport}
                disabled={!parsed || parsed.length === 0 || importing || parsed.length === duplicates}
              >
                {importing
                  ? (isHe ? 'מייבא...' : 'Importing...')
                  : `${isHe ? 'ייבא' : 'Import'} ${parsed && parsed.length - duplicates > 0 ? `(${parsed.length - duplicates})` : ''}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
