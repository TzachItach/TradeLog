import { useRef, useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useT } from '../i18n';

type StoreTrade = ReturnType<typeof useStore.getState>['trades'][0];

type BrokerType = 'tradovate' | 'topstepx' | 'ninjatrader' | 'rithmic' | 'apex';

interface ParsedTrade {
  symbol: string;
  direction: 'long' | 'short';
  trade_date: string;
  pnl: number;
  size: number;
  notes: string;
  broker_trade_id: string;
}

interface ParseResult {
  trades: ParsedTrade[];
  errors: Array<{ row: number; reason: string }>;
}

const BROKER_LABELS: Record<BrokerType, string> = {
  tradovate:   'Tradovate',
  topstepx:    'TopstepX',
  ninjatrader: 'NinjaTrader',
  rithmic:     'Rithmic',
  apex:        'Apex Trader',
};

const BROKER_INSTRUCTIONS: Record<BrokerType, { en: string; he: string }> = {
  tradovate:   { en: 'Open platform → Activity → Trade History → Export CSV', he: 'פתח את הפלטפורמה ← Activity ← Trade History ← Export CSV' },
  topstepx:    { en: 'Login → Reports → Trading Activity → Export', he: 'כנס לחשבון ← Reports ← Trading Activity ← Export' },
  ninjatrader: { en: 'Control Center → Account Performance → right-click → Export', he: 'Control Center ← Account Performance ← לחץ ימני ← Export' },
  rithmic:     { en: 'R|Trader → Reports → Trade Breaks → Export CSV', he: 'R|Trader ← Reports ← Trade Breaks ← Export CSV' },
  apex:        { en: 'Dashboard → Trade History → Export (Rithmic format)', he: 'Dashboard ← Trade History ← Export (פורמט Rithmic)' },
};

// ── Helpers ───────────────────────────────────────────────────

function parseTradovatePnL(raw: string): number {
  if (!raw) return 0;
  const s = raw.replace(/"/g, '').trim();
  const negMatch = s.match(/\$\(([0-9,]+\.?\d*)\)|\(\$([0-9,]+\.?\d*)\)/);
  if (negMatch) return -parseFloat((negMatch[1] || negMatch[2]).replace(/,/g, ''));
  const posMatch = s.match(/\$([0-9,]+\.?\d*)/);
  if (posMatch) return parseFloat(posMatch[1].replace(/,/g, ''));
  return parseFloat(s.replace(/,/g, '')) || 0;
}

function parseDollarAmount(raw: string): number {
  if (!raw) return 0;
  const s = raw.replace(/"/g, '').trim();
  const neg = s.match(/^\(?\$?-?([0-9,]+\.?\d*)\)?$/) || s.match(/\$\(([0-9,]+\.?\d*)\)/);
  if (s.startsWith('(') || s.startsWith('-')) {
    const n = parseFloat(s.replace(/[$,()\s]/g, ''));
    return isNaN(n) ? 0 : -Math.abs(n);
  }
  const n = parseFloat(s.replace(/[$,\s]/g, ''));
  return isNaN(n) ? 0 : n;
}

function normalizeSymbol(raw: string): string {
  return raw.replace(/[FGHJKMNQUVXZ]\d{1,2}$/, '').replace(/\s+\d{2}-\d{2}$/, '').toUpperCase().trim();
}

function parseDate(raw: string): string | null {
  if (!raw) return null;
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return null;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; continue; }
    if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
    else cur += ch;
  }
  result.push(cur.trim());
  return result;
}

// ── 1. Tradovate ──────────────────────────────────────────────
function parseTradovateCSV(text: string): ParseResult {
  const errors: ParseResult['errors'] = [];
  const rawLines = text.trim().split(/\r?\n/);
  if (rawLines.length < 2) return { trades: [], errors: [{ row: 0, reason: 'File has no data rows' }] };

  const headers = parseCSVLine(rawLines[0]).map(h => h.toLowerCase().replace(/^_/, ''));
  const idx = (keys: string[]) => {
    for (const k of keys) { const i = headers.findIndex(h => h.includes(k)); if (i >= 0) return i; }
    return -1;
  };

  const iSymbol      = idx(['symbol']);
  const iBuyFillId   = idx(['buyfillid']);
  const iSellFillId  = idx(['sellfillid']);
  const iQty         = idx(['qty', 'quantity']);
  const iBuyPrice    = idx(['buyprice']);
  const iSellPrice   = idx(['sellprice']);
  const iPnL         = idx(['pnl']);
  const iBoughtTime  = idx(['boughttimestamp', 'boughttime']);
  const iSoldTime    = idx(['soldtimestamp', 'soldtime', 'selltimestamp']);

  if (iSymbol < 0 || iPnL < 0 || iBoughtTime < 0) {
    return { trades: [], errors: [{ row: 0, reason: `Missing required columns. Detected: ${headers.slice(0, 6).join(', ')}` }] };
  }

  // כיוון נקבע per-row לפי timestamps: boughtTs < soldTs = long, אחרת short
  function fillDirection(boughtTs: string, soldTs: string, buyPrice: number, sellPrice: number): 'long' | 'short' {
    if (boughtTs && soldTs) return boughtTs <= soldTs ? 'long' : 'short';
    return buyPrice <= sellPrice ? 'long' : 'short'; // fallback
  }

  interface Fill { symbol: string; buyFillId: string; sellFillId: string; qty: number; buyPrice: number; sellPrice: number; pnl: number; tradeDate: string; boughtTs: string; soldTs: string; direction: 'long' | 'short'; }
  const fills: Fill[] = [];

  for (let i = 1; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);
    const rawSymbol = cols[iSymbol] ?? '';
    const rawDate   = cols[iBoughtTime] ?? '';
    if (!rawSymbol) { errors.push({ row: i + 1, reason: 'Missing symbol' }); continue; }
    const tradeDate = parseDate(rawDate);
    if (!tradeDate) { errors.push({ row: i + 1, reason: `Invalid date: "${rawDate}"` }); continue; }
    const boughtTs = cols[iBoughtTime] ?? '';
    const soldTs   = iSoldTime >= 0 ? (cols[iSoldTime] ?? '') : '';
    const buyPrice  = parseFloat(cols[iBuyPrice]  ?? '0') || 0;
    const sellPrice = parseFloat(cols[iSellPrice] ?? '0') || 0;
    fills.push({
      symbol:     normalizeSymbol(rawSymbol),
      buyFillId:  cols[iBuyFillId]  ?? `fill-${i}`,
      sellFillId: iSellFillId >= 0 ? (cols[iSellFillId] ?? `sfill-${i}`) : `sfill-${i}`,
      qty:        parseFloat(cols[iQty] ?? '1') || 1,
      buyPrice, sellPrice,
      pnl:       parseTradovatePnL(cols[iPnL] ?? ''),
      tradeDate, boughtTs, soldTs,
      direction: fillDirection(boughtTs, soldTs, buyPrice, sellPrice),
    });
  }

  // גיווס: לונג → לפי buyFillId (fill פותח), שורט → לפי sellFillId (fill פותח)
  const tradeMap = new Map<string, Fill[]>();
  for (const fill of fills) {
    const openingId = fill.direction === 'long' ? fill.buyFillId : fill.sellFillId;
    const key = `${fill.symbol}|${fill.direction}|${openingId}`;
    if (!tradeMap.has(key)) tradeMap.set(key, []);
    tradeMap.get(key)!.push(fill);
  }

  const trades: ParsedTrade[] = [];
  for (const [, group] of tradeMap) {
    const first      = group[0];
    const direction  = first.direction;
    const totalQty   = group.reduce((s, f) => s + f.qty, 0);
    const totalPnL   = group.reduce((s, f) => s + f.pnl, 0);
    const avgBuy     = group.reduce((s, f) => s + f.buyPrice  * f.qty, 0) / totalQty;
    const avgSell    = group.reduce((s, f) => s + f.sellPrice * f.qty, 0) / totalQty;
    const entry = direction === 'long' ? avgBuy  : avgSell;
    const exit  = direction === 'long' ? avgSell : avgBuy;
    trades.push({
      symbol:          first.symbol,
      direction,
      trade_date:      first.tradeDate,
      pnl:             Math.round(totalPnL * 100) / 100,
      size:            totalQty,
      notes:           `Entry: ${entry.toFixed(2)} → Exit: ${exit.toFixed(2)} | Tradovate`,
      broker_trade_id: `tradovate-${first.buyFillId}`,
    });
  }

  return { trades, errors };
}

// ── 2. TopstepX ───────────────────────────────────────────────
function parseTopstepXCSV(text: string): ParseResult {
  const errors: ParseResult['errors'] = [];
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { trades: [], errors: [{ row: 0, reason: 'File has no data rows' }] };

  const headerLine = lines.findIndex(l =>
    l.toLowerCase().includes('instrument') || l.toLowerCase().includes('symbol') || l.toLowerCase().includes('contract')
  );
  if (headerLine < 0) return { trades: [], errors: [{ row: 0, reason: 'Could not find header row' }] };

  const headers = lines[headerLine].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
  const trades: ParsedTrade[] = [];

  for (let i = headerLine + 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
    if (cols.length < 3 || !cols[0]) continue;

    const get = (keys: string[]) => {
      for (const k of keys) { const idx = headers.findIndex(h => h.includes(k)); if (idx >= 0 && cols[idx]) return cols[idx]; }
      return '';
    };

    const contract  = get(['instrument', 'contract', 'symbol']);
    const side      = get(['side', 'direction', 'buy/sell', 'action']);
    const qty       = parseFloat(get(['qty', 'quantity', 'size', 'volume'])) || 1;
    const realized  = parseFloat(get(['realized', 'net', 'pnl', 'profit', 'gain'])) || 0;
    const commission= parseFloat(get(['commission', 'fee', 'comm'])) || 0;
    const dateStr   = get(['date', 'time', 'timestamp', 'closedate', 'exitdate']);
    const id        = get(['id', 'tradeid', 'orderid']) || `tx-${i}`;

    if (!contract) { errors.push({ row: i + 1, reason: 'Missing symbol/contract' }); continue; }
    const trade_date = parseDate(dateStr);
    if (!trade_date) { errors.push({ row: i + 1, reason: `Invalid date: "${dateStr}"` }); continue; }

    const direction: 'long' | 'short' = side.toLowerCase().includes('sell') || side.toLowerCase() === 's' ? 'short' : 'long';
    trades.push({
      symbol: normalizeSymbol(contract),
      direction, trade_date, size: qty,
      pnl: Math.round((realized - commission) * 100) / 100,
      notes: commission > 0 ? `Commission: $${commission.toFixed(2)} | TopstepX` : 'TopstepX',
      broker_trade_id: `topstepx-${id}`,
    });
  }

  return { trades, errors };
}

// ── 3. NinjaTrader ────────────────────────────────────────────
// Expected columns: Instrument, Market pos., Qty, Entry price, Exit price, Entry time, Exit time, Profit, Commission
function parseNinjaTraderCSV(text: string): ParseResult {
  const errors: ParseResult['errors'] = [];
  const rawLines = text.trim().split(/\r?\n/);
  if (rawLines.length < 2) return { trades: [], errors: [{ row: 0, reason: 'File has no data rows' }] };

  // NinjaTrader sometimes has a summary block at the bottom — stop at first empty line after data
  const headers = parseCSVLine(rawLines[0]).map(h => h.toLowerCase().trim());
  const idx = (keys: string[]) => {
    for (const k of keys) { const i = headers.findIndex(h => h.includes(k)); if (i >= 0) return i; }
    return -1;
  };

  const iSymbol    = idx(['instrument', 'symbol', 'contract']);
  const iSide      = idx(['market pos', 'side', 'direction', 'position']);
  const iQty       = idx(['qty', 'quantity', 'contracts']);
  const iEntryTime = idx(['entry time', 'entrytime', 'entry date', 'open time']);
  const iProfit    = idx(['profit', 'pnl', 'net profit', 'net p&l', 'gain/loss']);
  const iComm      = idx(['commission', 'comm', 'fee']);

  if (iSymbol < 0 || iProfit < 0 || iEntryTime < 0) {
    return { trades: [], errors: [{ row: 0, reason: `Missing required columns. Detected: ${headers.slice(0, 8).join(', ')}` }] };
  }

  const trades: ParsedTrade[] = [];
  for (let i = 1; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line || line.startsWith('Performance') || line.startsWith('Commission')) continue;
    const cols = parseCSVLine(line);
    if (cols.length < 4) continue;

    const rawSymbol = cols[iSymbol] ?? '';
    const rawDate   = cols[iEntryTime] ?? '';
    if (!rawSymbol || rawSymbol.toLowerCase() === 'instrument') continue;

    const trade_date = parseDate(rawDate);
    if (!trade_date) { errors.push({ row: i + 1, reason: `Invalid date: "${rawDate}"` }); continue; }

    const rawPnL  = cols[iProfit] ?? '0';
    const rawComm = iComm >= 0 ? (cols[iComm] ?? '0') : '0';
    const pnl     = parseDollarAmount(rawPnL) - Math.abs(parseDollarAmount(rawComm));
    const side    = iSide >= 0 ? (cols[iSide] ?? '') : '';
    const direction: 'long' | 'short' = side.toLowerCase().includes('short') || side.toLowerCase() === 's' ? 'short' : 'long';

    trades.push({
      symbol:          normalizeSymbol(rawSymbol),
      direction,
      trade_date,
      pnl:             Math.round(pnl * 100) / 100,
      size:            parseFloat(cols[iQty] ?? '1') || 1,
      notes:           'NinjaTrader',
      broker_trade_id: `ninjatrader-${i}-${rawDate.replace(/\W/g, '')}`,
    });
  }

  return { trades, errors };
}

// ── 4. Rithmic ────────────────────────────────────────────────
// Rithmic R|Trader Trade Breaks export — per-fill rows grouped by order
function parseRithmicCSV(text: string): ParseResult {
  const errors: ParseResult['errors'] = [];
  const rawLines = text.trim().split(/\r?\n/);
  if (rawLines.length < 2) return { trades: [], errors: [{ row: 0, reason: 'File has no data rows' }] };

  const headers = parseCSVLine(rawLines[0]).map(h => h.toLowerCase().trim());
  const idx = (keys: string[]) => {
    for (const k of keys) { const i = headers.findIndex(h => h.includes(k)); if (i >= 0) return i; }
    return -1;
  };

  const iSymbol  = idx(['symbol', 'instrument', 'contract']);
  const iSide    = idx(['buy/sell', 'b/s', 'side', 'action', 'buy_sell']);
  const iQty     = idx(['qty', 'quantity', 'filled', 'contracts']);
  const iPrice   = idx(['fill price', 'price', 'avg price', 'exec price']);
  const iFillTime= idx(['fill time', 'filltime', 'timestamp', 'time', 'date']);
  const iOrderNo = idx(['order no', 'order#', 'orderid', 'order_id', 'trade no']);
  const iPnL     = idx(['pnl', 'profit', 'net p&l', 'realized', 'gain']);

  if (iSymbol < 0 || iFillTime < 0) {
    return { trades: [], errors: [{ row: 0, reason: `Missing required columns. Detected: ${headers.slice(0, 8).join(', ')}` }] };
  }

  // If P&L column exists, treat each row as a closed trade directly
  if (iPnL >= 0) {
    const trades: ParsedTrade[] = [];
    for (let i = 1; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (!line) continue;
      const cols = parseCSVLine(line);
      const rawSymbol = cols[iSymbol] ?? '';
      if (!rawSymbol) continue;
      const trade_date = parseDate(cols[iFillTime] ?? '');
      if (!trade_date) { errors.push({ row: i + 1, reason: `Invalid date: "${cols[iFillTime]}"` }); continue; }
      const side = iSide >= 0 ? (cols[iSide] ?? '') : '';
      const direction: 'long' | 'short' = side.toLowerCase().includes('sell') || side === 'S' ? 'short' : 'long';
      trades.push({
        symbol: normalizeSymbol(rawSymbol),
        direction, trade_date,
        pnl: Math.round(parseDollarAmount(cols[iPnL] ?? '0') * 100) / 100,
        size: parseFloat(cols[iQty] ?? '1') || 1,
        notes: 'Rithmic',
        broker_trade_id: `rithmic-${i}-${(cols[iOrderNo] ?? i).toString().replace(/\W/g, '')}`,
      });
    }
    return { trades, errors };
  }

  // No P&L column: group fills by order number and compute from price difference
  interface RFill { symbol: string; side: string; qty: number; price: number; fillTime: string; tradeDate: string; orderNo: string; }
  const fills: RFill[] = [];
  for (let i = 1; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);
    const rawSymbol = cols[iSymbol] ?? '';
    if (!rawSymbol) continue;
    const trade_date = parseDate(cols[iFillTime] ?? '');
    if (!trade_date) { errors.push({ row: i + 1, reason: `Invalid date: "${cols[iFillTime]}"` }); continue; }
    fills.push({
      symbol:    normalizeSymbol(rawSymbol),
      side:      iSide >= 0 ? (cols[iSide] ?? 'B') : 'B',
      qty:       parseFloat(cols[iQty] ?? '1') || 1,
      price:     parseFloat(cols[iPrice] ?? '0') || 0,
      fillTime:  cols[iFillTime] ?? '',
      tradeDate: trade_date,
      orderNo:   iOrderNo >= 0 ? (cols[iOrderNo] ?? `row-${i}`) : `row-${i}`,
    });
  }

  // Group by order number
  const map = new Map<string, RFill[]>();
  for (const f of fills) {
    if (!map.has(f.orderNo)) map.set(f.orderNo, []);
    map.get(f.orderNo)!.push(f);
  }

  const trades: ParsedTrade[] = [];
  let tradeIdx = 0;
  for (const [orderNo, group] of map) {
    const buys  = group.filter(f => f.side.toUpperCase().startsWith('B'));
    const sells = group.filter(f => f.side.toUpperCase().startsWith('S'));
    if (!buys.length || !sells.length) continue;
    const totalBuyQty  = buys.reduce((s, f) => s + f.qty, 0);
    const totalSellQty = sells.reduce((s, f) => s + f.qty, 0);
    const avgBuy  = buys.reduce((s, f) => s + f.price * f.qty, 0) / totalBuyQty;
    const avgSell = sells.reduce((s, f) => s + f.price * f.qty, 0) / totalSellQty;
    const direction: 'long' | 'short' = avgBuy <= avgSell ? 'long' : 'short';
    const first = group[0];
    trades.push({
      symbol: first.symbol, direction,
      trade_date: first.tradeDate,
      pnl: 0, // Can't compute without pointValue — user will need to edit
      size: Math.min(totalBuyQty, totalSellQty),
      notes: `Entry: ${(direction === 'long' ? avgBuy : avgSell).toFixed(2)} → Exit: ${(direction === 'long' ? avgSell : avgBuy).toFixed(2)} | Rithmic`,
      broker_trade_id: `rithmic-${orderNo.replace(/\W/g, '')}-${tradeIdx++}`,
    });
  }

  return { trades, errors };
}

// ── 5. Apex Trader Funding ────────────────────────────────────
// Apex Performance Report: Date, Symbol, Side, Entry, Exit, Contracts, Gross P&L, Commissions, Net P&L
function parseApexCSV(text: string): ParseResult {
  const errors: ParseResult['errors'] = [];
  const rawLines = text.trim().split(/\r?\n/);
  if (rawLines.length < 2) return { trades: [], errors: [{ row: 0, reason: 'File has no data rows' }] };

  const headers = parseCSVLine(rawLines[0]).map(h => h.toLowerCase().trim());
  const idx = (keys: string[]) => {
    for (const k of keys) { const i = headers.findIndex(h => h.includes(k)); if (i >= 0) return i; }
    return -1;
  };

  const iSymbol = idx(['symbol', 'instrument', 'contract', 'ticker']);
  const iSide   = idx(['side', 'direction', 'market pos', 'buy/sell', 'action', 'long/short']);
  const iDate   = idx(['date', 'time', 'entry time', 'exit time', 'trade date', 'close time']);
  const iNetPnL = idx(['net p&l', 'net pnl', 'net profit', 'net']);
  const iGross  = idx(['gross p&l', 'gross pnl', 'gross profit', 'profit', 'pnl']);
  const iComm   = idx(['commission', 'comm', 'fees']);
  const iQty    = idx(['contracts', 'qty', 'quantity', 'size']);
  const iEntry  = idx(['entry', 'entry price', 'entry_price']);
  const iExit   = idx(['exit', 'exit price', 'exit_price']);

  if (iSymbol < 0 || iDate < 0) {
    return { trades: [], errors: [{ row: 0, reason: `Missing required columns. Detected: ${headers.slice(0, 8).join(', ')}` }] };
  }

  const trades: ParsedTrade[] = [];
  for (let i = 1; i < rawLines.length; i++) {
    const line = rawLines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);
    const rawSymbol = cols[iSymbol] ?? '';
    if (!rawSymbol) continue;

    const trade_date = parseDate(cols[iDate] ?? '');
    if (!trade_date) { errors.push({ row: i + 1, reason: `Invalid date: "${cols[iDate]}"` }); continue; }

    // P&L: prefer net, fallback to gross - commission
    let pnl = 0;
    if (iNetPnL >= 0 && cols[iNetPnL]) {
      pnl = parseDollarAmount(cols[iNetPnL]);
    } else if (iGross >= 0 && cols[iGross]) {
      const gross = parseDollarAmount(cols[iGross]);
      const comm  = iComm >= 0 ? Math.abs(parseDollarAmount(cols[iComm] ?? '0')) : 0;
      pnl = gross - comm;
    } else {
      errors.push({ row: i + 1, reason: 'No P&L column found' }); continue;
    }

    const side = iSide >= 0 ? (cols[iSide] ?? '') : '';
    const direction: 'long' | 'short' =
      side.toLowerCase().includes('short') || side.toLowerCase() === 's' || side.toLowerCase() === 'sell'
        ? 'short' : 'long';

    const entryStr = iEntry >= 0 ? cols[iEntry] : '';
    const exitStr  = iExit  >= 0 ? cols[iExit]  : '';
    const notesParts = ['Apex Trader'];
    if (entryStr && exitStr) notesParts.unshift(`Entry: ${entryStr} → Exit: ${exitStr}`);

    trades.push({
      symbol:          normalizeSymbol(rawSymbol),
      direction, trade_date,
      pnl:             Math.round(pnl * 100) / 100,
      size:            parseFloat(cols[iQty] ?? '1') || 1,
      notes:           notesParts.join(' | '),
      broker_trade_id: `apex-${i}-${trade_date}-${rawSymbol.replace(/\W/g, '')}`,
    });
  }

  return { trades, errors };
}

function parseBrokerFile(broker: BrokerType, text: string): ParseResult {
  switch (broker) {
    case 'tradovate':   return parseTradovateCSV(text);
    case 'topstepx':   return parseTopstepXCSV(text);
    case 'ninjatrader': return parseNinjaTraderCSV(text);
    case 'rithmic':    return parseRithmicCSV(text);
    case 'apex':       return parseApexCSV(text);
  }
}

// ── Component ─────────────────────────────────────────────────
interface Props { onClose: () => void; }

export default function BrokerImport({ onClose }: Props) {
  const { lang, accounts, strategies, addTrade, trades: existingTrades, user } = useStore();
  const T = useT(lang);
  const navigate = useNavigate();
  const isHe = lang === 'he';

  const [broker, setBroker]         = useState<BrokerType>('tradovate');
  const [accountId, setAccountId]   = useState(accounts[0]?.id ?? '');
  const [strategyId, setStrategyId] = useState('');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [selected, setSelected]     = useState<Set<string>>(new Set());
  const [isDrag, setIsDrag]         = useState(false);
  const [fileName, setFileName]     = useState('');
  const [importing, setImporting]   = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [done, setDone]             = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const existingIds = useMemo(
    () => new Set(existingTrades.map((t: StoreTrade) => t.broker_trade_id).filter(Boolean)),
    [existingTrades]
  );

  // Apply date filter
  const visibleTrades = useMemo(() => {
    if (!parseResult) return [];
    return parseResult.trades.filter(t => {
      if (dateFrom && t.trade_date < dateFrom) return false;
      if (dateTo   && t.trade_date > dateTo)   return false;
      return true;
    });
  }, [parseResult, dateFrom, dateTo]);

  // Reset selection when visible trades change — select all non-duplicates by default
  useEffect(() => {
    setSelected(new Set(visibleTrades.filter(t => !existingIds.has(t.broker_trade_id)).map(t => t.broker_trade_id)));
  }, [visibleTrades]);

  const dupCount      = visibleTrades.filter(t => existingIds.has(t.broker_trade_id)).length;
  const selectedCount = visibleTrades.filter(t => selected.has(t.broker_trade_id) && !existingIds.has(t.broker_trade_id)).length;

  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setParseResult(parseBrokerFile(broker, text));
      setDone(false);
    };
    reader.readAsText(file);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(visibleTrades.filter(t => !existingIds.has(t.broker_trade_id)).map(t => t.broker_trade_id)));
  };

  const deselectAll = () => setSelected(new Set());

  const handleImport = async () => {
    if (!parseResult || selectedCount === 0) return;
    setImporting(true);
    const toImport = visibleTrades.filter(t => selected.has(t.broker_trade_id) && !existingIds.has(t.broker_trade_id));
    for (const t of toImport) {
      addTrade({
        id: crypto.randomUUID(),
        user_id: user?.id,
        account_id: accountId,
        strategy_id: strategyId || undefined,
        symbol: t.symbol,
        direction: t.direction,
        trade_date: t.trade_date,
        pnl: t.pnl,
        size: t.size,
        notes: t.notes,
        broker_trade_id: t.broker_trade_id,
        source: (broker === 'tradovate' || broker === 'topstepx') ? broker : 'manual',
        confirmations: {},
        field_values: {},
      });
    }
    setImportedCount(toImport.length);
    setImporting(false);
    setDone(true);
  };

  const activeStrategies = strategies.filter(s => s.is_active);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.currentTarget === e.target) onClose(); }}>
      <div className="modal-box" dir={isHe ? 'rtl' : 'ltr'} style={{ maxWidth: 560 }}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--bd2)' }} />
        </div>

        <div className="modal-head">
          <span className="modal-title">{isHe ? 'ייבוא עסקאות מ-CSV' : 'Import Trades from CSV'}</span>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {done ? (
          // ── Success screen ──
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6, color: 'var(--g)' }}>
              {isHe ? 'הייבוא הושלם!' : 'Import complete!'}
            </div>
            <div style={{ fontSize: '.88rem', color: 'var(--t2)', marginBottom: 24 }}>
              {importedCount} {isHe ? 'עסקאות חדשות יובאו' : 'new trades imported'}
              {dupCount > 0 && ` · ${dupCount} ${isHe ? 'כפילויות דולגו' : 'duplicates skipped'}`}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={onClose}>{isHe ? 'סגור' : 'Close'}</button>
              <button className="btn btn-primary" onClick={() => { onClose(); navigate('/dashboard/trades'); }}>
                {isHe ? 'צפה בעסקאות' : 'View trades'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Broker selector ── */}
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">{isHe ? 'ברוקר' : 'Broker'}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(Object.keys(BROKER_LABELS) as BrokerType[]).map(b => (
                  <button key={b}
                    className={`dir-btn${broker === b ? ' long-on' : ''}`}
                    onClick={() => { setBroker(b); setParseResult(null); setFileName(''); }}
                    style={{ fontSize: '.78rem' }}>
                    {BROKER_LABELS[b]}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Account + Strategy ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div>
                <label className="form-label">{T.account}</label>
                <select className="form-input" value={accountId} onChange={e => setAccountId(e.target.value)}>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">{isHe ? 'אסטרטגיה (אופציונלי)' : 'Strategy (optional)'}</label>
                <select className="form-input" value={strategyId} onChange={e => setStrategyId(e.target.value)}>
                  <option value="">— {isHe ? 'ללא' : 'None'} —</option>
                  {activeStrategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            {/* ── Date range filter ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div>
                <label className="form-label">{isHe ? 'מתאריך' : 'From date'}</label>
                <input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div>
                <label className="form-label">{isHe ? 'עד תאריך' : 'To date'}</label>
                <input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
            </div>

            {/* ── Instructions ── */}
            <div style={{ background: 'var(--b-bg)', border: '1px solid var(--b-bd)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: '.78rem', color: 'var(--t2)', lineHeight: 1.7 }}>
              📥 <strong style={{ color: 'var(--b)' }}>{BROKER_LABELS[broker]}:</strong>{' '}
              {isHe ? BROKER_INSTRUCTIONS[broker].he : BROKER_INSTRUCTIONS[broker].en}
            </div>

            {/* ── Upload zone ── */}
            <div
              className={`upload-zone${isDrag ? ' drag' : ''}`}
              style={{ marginBottom: 14 }}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDrag(true); }}
              onDragLeave={() => setIsDrag(false)}
              onDrop={e => { e.preventDefault(); setIsDrag(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <div className="upload-text">{fileName ? `✓ ${fileName}` : isHe ? 'גרור קובץ CSV לכאן' : 'Drag CSV file here'}</div>
              <div className="upload-sub">{isHe ? 'או לחץ לבחירת קובץ' : 'or click to browse'} · .csv</div>
              <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
            </div>

            {/* ── Parse errors ── */}
            {parseResult && parseResult.errors.length > 0 && (
              <div style={{ background: 'rgba(255,64,96,.08)', border: '1px solid rgba(255,64,96,.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
                <button
                  onClick={() => setShowErrors(v => !v)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--r)', fontSize: '.78rem', fontWeight: 600, padding: 0, fontFamily: 'inherit' }}>
                  ⚠ {parseResult.errors.length} {isHe ? 'שורות דולגו' : 'rows skipped'} {showErrors ? '▲' : '▼'}
                </button>
                {showErrors && (
                  <div style={{ marginTop: 8, maxHeight: 120, overflowY: 'auto' }}>
                    {parseResult.errors.map((e, i) => (
                      <div key={i} style={{ fontSize: '.72rem', color: 'var(--t2)', padding: '2px 0', borderBottom: '1px solid var(--bd)' }}>
                        <span style={{ color: 'var(--r)', fontWeight: 600 }}>Row {e.row}:</span> {e.reason}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Preview ── */}
            {parseResult !== null && (
              <div style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
                {visibleTrades.length === 0 ? (
                  <div style={{ color: 'var(--r)', fontSize: '.84rem' }}>
                    {parseResult.trades.length === 0
                      ? (isHe ? '⚠ לא נמצאו עסקאות בקובץ. בדוק שזה הפורמט הנכון.' : '⚠ No trades found. Check the file format.')
                      : (isHe ? '⚠ אין עסקאות בטווח התאריכים שנבחר.' : '⚠ No trades in the selected date range.')}
                  </div>
                ) : (
                  <>
                    {/* Stats row */}
                    <div style={{ display: 'flex', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
                      {[
                        { label: isHe ? 'סה"כ' : 'Total',      value: visibleTrades.length,  color: 'var(--b)' },
                        { label: isHe ? 'נבחרו' : 'Selected',   value: selectedCount,          color: 'var(--g)' },
                        { label: isHe ? 'כפילויות' : 'Dupes',   value: dupCount,               color: 'var(--o)' },
                      ].map(s => (
                        <div key={s.label}>
                          <div style={{ fontSize: '.62rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>{s.label}</div>
                          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Select all / Deselect all */}
                    <div style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: '.72rem' }}>
                      <button onClick={selectAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--b)', padding: 0, fontFamily: 'inherit' }}>
                        {isHe ? 'בחר הכל' : 'Select all'}
                      </button>
                      <button onClick={deselectAll} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: 0, fontFamily: 'inherit' }}>
                        {isHe ? 'בטל הכל' : 'Deselect all'}
                      </button>
                    </div>

                    {/* Scrollable trade list */}
                    <div style={{ maxHeight: 240, overflowY: 'auto', marginTop: 4 }}>
                      {visibleTrades.map((t, i) => {
                        const isDup = existingIds.has(t.broker_trade_id);
                        const isSel = selected.has(t.broker_trade_id);
                        return (
                          <div
                            key={i}
                            onClick={() => !isDup && toggleSelect(t.broker_trade_id)}
                            style={{
                              display: 'flex', gap: 8, alignItems: 'center',
                              fontSize: '.78rem', padding: '5px 4px',
                              borderBottom: '1px solid var(--bd)',
                              cursor: isDup ? 'default' : 'pointer',
                              opacity: isDup ? 0.45 : 1,
                              borderRadius: 4,
                            }}>
                            <input
                              type="checkbox"
                              checked={!isDup && isSel}
                              disabled={isDup}
                              onChange={() => {}}
                              style={{ accentColor: 'var(--g)', flexShrink: 0 }}
                            />
                            <span style={{ fontFamily: 'monospace', fontWeight: 700, minWidth: 36 }}>{t.symbol}</span>
                            <span className={`dir-badge ${t.direction}`}>{t.direction === 'long' ? '▲' : '▼'}</span>
                            <span style={{ color: 'var(--t3)', minWidth: 72 }}>{t.trade_date}</span>
                            <span style={{ marginInlineStart: 'auto', fontFamily: 'monospace', fontWeight: 700, color: t.pnl >= 0 ? 'var(--g)' : 'var(--r)' }}>
                              {t.pnl >= 0 ? '+' : ''}${t.pnl.toFixed(0)}
                            </span>
                            {isDup && <span style={{ fontSize: '.65rem', color: 'var(--o)', marginInlineStart: 4 }}>{isHe ? 'קיים' : 'dup'}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={onClose}>{T.cancel}</button>
              <button
                className="btn btn-primary"
                onClick={handleImport}
                disabled={selectedCount === 0 || importing}>
                {importing
                  ? (isHe ? 'מייבא...' : 'Importing...')
                  : `${isHe ? 'ייבא' : 'Import'} ${selectedCount > 0 ? `(${selectedCount})` : ''}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
