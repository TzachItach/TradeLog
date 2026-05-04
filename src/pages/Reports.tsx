import { useState, useMemo } from 'react';
import { useStore, formatPnL } from '../store';
import { useT } from '../i18n';

type StoreTrade = ReturnType<typeof useStore.getState>['trades'][0];
type StoreStrategy = ReturnType<typeof useStore.getState>['strategies'][0];

function calcStats(trades: StoreTrade[]) {
  const totalPnL = trades.reduce((s, t) => s + t.pnl, 0);
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);
  const winRate = trades.length ? (wins.length / trades.length) * 100 : 0;
  const avgWin = wins.length ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0;
  const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;
  const bestTrade = trades.length ? Math.max(...trades.map((t) => t.pnl)) : null;
  const worstTrade = trades.length ? Math.min(...trades.map((t) => t.pnl)) : null;
  return { totalPnL, wins: wins.length, losses: losses.length, winRate, avgWin, avgLoss, profitFactor, bestTrade, worstTrade };
}

function calcByStrategy(trades: StoreTrade[], strategies: StoreStrategy[]) {
  const rows: { name: string; count: number; pnl: number; winRate: number }[] = [];
  strategies.forEach((s) => {
    const st = trades.filter((t) => t.strategy_id === s.id);
    if (!st.length) return;
    const wins = st.filter((t) => t.pnl > 0).length;
    rows.push({ name: s.name, count: st.length, pnl: st.reduce((sum, t) => sum + t.pnl, 0), winRate: (wins / st.length) * 100 });
  });
  const noStrat = trades.filter((t) => !t.strategy_id);
  if (noStrat.length) {
    const wins = noStrat.filter((t) => t.pnl > 0).length;
    rows.push({ name: '—', count: noStrat.length, pnl: noStrat.reduce((sum, t) => sum + t.pnl, 0), winRate: (wins / noStrat.length) * 100 });
  }
  return rows.sort((a, b) => b.pnl - a.pnl);
}

function calcBySymbol(trades: StoreTrade[]) {
  const map: Record<string, { pnl: number; count: number; wins: number }> = {};
  trades.forEach((t) => {
    if (!map[t.symbol]) map[t.symbol] = { pnl: 0, count: 0, wins: 0 };
    map[t.symbol].pnl += t.pnl;
    map[t.symbol].count++;
    if (t.pnl > 0) map[t.symbol].wins++;
  });
  return Object.entries(map)
    .map(([symbol, d]) => ({ symbol, ...d, winRate: (d.wins / d.count) * 100 }))
    .sort((a, b) => b.pnl - a.pnl);
}

function formatDateLabel(from: string, to: string, lang: string) {
  if (!from && !to) return lang === 'he' ? 'כל הזמן' : 'All Time';
  const fmt = (d: string) => new Date(d).toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  if (from && to) return `${fmt(from)} – ${fmt(to)}`;
  if (from) return `${lang === 'he' ? 'מ-' : 'From '}${fmt(from)}`;
  return `${lang === 'he' ? 'עד ' : 'Until '}${fmt(to)}`;
}

function exportCSV(trades: StoreTrade[], strategies: StoreStrategy[]) {
  const headers = ['Date', 'Symbol', 'Direction', 'P&L ($)', 'Size', 'Stop Loss (pts)', 'Take Profit (pts)', 'Strategy', 'HTF PD Array', 'Psychology', 'Notes'];
  const rows = trades.map((t) => {
    const strat = strategies.find((s) => s.id === t.strategy_id)?.name ?? '';
    return [
      t.trade_date, t.symbol, t.direction, t.pnl, t.size ?? '', t.stop_loss_pts ?? '',
      t.take_profit_pts ?? '', strat, t.htf_pd_array ?? '', t.psychology ?? '', t.notes ?? '',
    ].map((v) => `"${String(v).replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`).join(',');
  });
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tradelog-export-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportPDF(
  trades: StoreTrade[],
  strategies: StoreStrategy[],
  lang: string,
  fromDate: string,
  toDate: string,
) {
  const win = window.open('', '_blank');
  if (!win) {
    alert(lang === 'he'
      ? 'הדפדפן חסם את החלון הקופץ. אנא אפשר חלונות קופצים עבור אתר זה ונסה שנית.'
      : 'Popup was blocked. Please allow popups for this site and try again.');
    return;
  }

  const stats = calcStats(trades);
  const byStrat = calcByStrategy(trades, strategies);
  const bySymbol = calcBySymbol(trades);
  const dateLabel = formatDateLabel(fromDate, toDate, lang);
  const isHe = lang === 'he';
  const dir = isHe ? 'rtl' : 'ltr';

  const tradeRows = trades.map((t) => {
    const strat = strategies.find((s) => s.id === t.strategy_id)?.name ?? '—';
    const pnlColor = t.pnl >= 0 ? '#1DB954' : '#E91429';
    return `<tr>
      <td>${t.trade_date}</td><td>${t.symbol}</td>
      <td>${t.direction === 'long' ? (isHe ? 'קניה ▲' : 'Long ▲') : (isHe ? 'מכירה ▼' : 'Short ▼')}</td>
      <td style="color:${pnlColor};font-weight:700">${formatPnL(t.pnl)}</td>
      <td>${strat}</td><td style="color:#888;font-size:.8em">${t.notes ?? ''}</td>
    </tr>`;
  }).join('');

  const stratRows = byStrat.map((r) => {
    const c = r.pnl >= 0 ? '#1DB954' : '#E91429';
    return `<tr>
      <td>${r.name}</td><td>${r.count}</td>
      <td style="color:${c};font-weight:700">${formatPnL(r.pnl)}</td>
      <td>${r.winRate.toFixed(1)}%</td>
    </tr>`;
  }).join('');

  const symRows = bySymbol.map((r) => {
    const c = r.pnl >= 0 ? '#1DB954' : '#E91429';
    return `<tr>
      <td>${r.symbol}</td><td>${r.count}</td>
      <td style="color:${c};font-weight:700">${formatPnL(r.pnl)}</td>
      <td>${r.winRate.toFixed(1)}%</td>
    </tr>`;
  }).join('');

  const pfDisplay = stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2);

  const kpiCards = [
    { l: isHe ? 'רווח/הפסד כולל' : 'Total P&L', v: formatPnL(stats.totalPnL), c: stats.totalPnL >= 0 ? '#1DB954' : '#E91429' },
    { l: isHe ? 'אחוז זכייה' : 'Win Rate', v: trades.length ? `${stats.winRate.toFixed(1)}%` : '—', c: '#333' },
    { l: isHe ? 'סה"כ עסקאות' : 'Total Trades', v: String(trades.length), c: '#333' },
    { l: isHe ? 'ממוצע רווח' : 'Avg Win', v: stats.wins ? formatPnL(stats.avgWin) : '—', c: '#1DB954' },
    { l: isHe ? 'ממוצע הפסד' : 'Avg Loss', v: stats.losses ? formatPnL(stats.avgLoss) : '—', c: '#E91429' },
    { l: isHe ? 'פקטור רווח' : 'Profit Factor', v: pfDisplay, c: '#333' },
    { l: isHe ? 'עסקה מובילה' : 'Best Trade', v: stats.bestTrade !== null ? formatPnL(stats.bestTrade) : '—', c: '#1DB954' },
    { l: isHe ? 'עסקה גרועה' : 'Worst Trade', v: stats.worstTrade !== null ? formatPnL(stats.worstTrade) : '—', c: '#E91429' },
  ].map((k) => `<div class="stat"><div class="stat-l">${k.l}</div><div class="stat-v" style="color:${k.c}">${k.v}</div></div>`).join('');

  win.document.write(`<!DOCTYPE html><html dir="${dir}"><head>
    <meta charset="UTF-8"><title>TraderYo Report</title>
    <style>
      body{font-family:system-ui,sans-serif;background:#fff;color:#111;padding:40px;margin:0}
      h1{font-size:1.8rem;margin-bottom:2px}
      h2{font-size:1rem;font-weight:700;color:#444;margin:28px 0 10px;text-transform:uppercase;letter-spacing:.06em}
      .sub{color:#666;margin-bottom:28px;font-size:.9rem}
      .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:28px}
      .stat{background:#f5f5f5;border-radius:10px;padding:14px}
      .stat-l{font-size:.68rem;color:#888;text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px}
      .stat-v{font-size:1.25rem;font-weight:700;font-family:monospace}
      table{width:100%;border-collapse:collapse;font-size:.85rem;margin-bottom:24px}
      th{background:#f0f0f0;padding:9px 12px;text-align:inherit;font-size:.68rem;letter-spacing:.07em;text-transform:uppercase;color:#666}
      td{padding:8px 12px;border-bottom:1px solid #eee}
      .disc{margin-top:28px;padding:12px;background:#fff8e1;border-radius:8px;font-size:.75rem;color:#666}
      @media print{body{padding:20px}button{display:none}.stats{grid-template-columns:repeat(4,1fr)}}
    </style>
  </head><body>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
      <div style="width:34px;height:34px;background:#1DB954;border-radius:50%;display:flex;align-items:center;justify-content:center">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.8" stroke-linecap="round"><polyline points="3,17 9,11 13,15 21,6"/></svg>
      </div>
      <h1>TraderYo</h1>
    </div>
    <div class="sub">${isHe ? 'דוח מסחר' : 'Trading Report'} — ${dateLabel}</div>

    <h2>${isHe ? 'סיכום' : 'Summary'}</h2>
    <div class="stats">${kpiCards}</div>

    ${byStrat.length > 0 ? `
    <h2>${isHe ? 'לפי אסטרטגיה' : 'By Strategy'}</h2>
    <table>
      <thead><tr>
        <th>${isHe ? 'אסטרטגיה' : 'Strategy'}</th>
        <th>${isHe ? 'כמות' : 'Count'}</th>
        <th>P&L</th>
        <th>${isHe ? 'אחוז זכייה' : 'Win Rate'}</th>
      </tr></thead>
      <tbody>${stratRows}</tbody>
    </table>` : ''}

    ${bySymbol.length > 0 ? `
    <h2>${isHe ? 'לפי סמל' : 'By Symbol'}</h2>
    <table>
      <thead><tr>
        <th>${isHe ? 'סמל' : 'Symbol'}</th>
        <th>${isHe ? 'כמות' : 'Count'}</th>
        <th>P&L</th>
        <th>${isHe ? 'אחוז זכייה' : 'Win Rate'}</th>
      </tr></thead>
      <tbody>${symRows}</tbody>
    </table>` : ''}

    <h2>${isHe ? 'עסקאות' : 'Trades'}</h2>
    <table>
      <thead><tr>
        <th>${isHe ? 'תאריך' : 'Date'}</th>
        <th>${isHe ? 'סמל' : 'Symbol'}</th>
        <th>${isHe ? 'כיוון' : 'Dir.'}</th>
        <th>P&L</th>
        <th>${isHe ? 'אסטרטגיה' : 'Strategy'}</th>
        <th>${isHe ? 'הערות' : 'Notes'}</th>
      </tr></thead>
      <tbody>${tradeRows}</tbody>
    </table>

    <div class="disc">⚠ ${isHe ? 'המידע המוצג אינו ייעוץ השקעות. מסחר בניירות ערך כרוך בסיכון אובדן הון.' : 'Information displayed is not investment advice. Trading involves significant risk of capital loss.'}</div>
    <div style="margin-top:14px;text-align:center">
      <button onclick="window.print()" style="background:#1DB954;color:#000;border:none;padding:10px 24px;border-radius:980px;cursor:pointer;font-size:.9rem;font-weight:600">
        🖨 ${isHe ? 'הדפס / שמור PDF' : 'Print / Save as PDF'}
      </button>
    </div>
  </body></html>`);
  win.document.close();
}

export default function Reports() {
  const { lang, getFilteredTrades, strategies, accounts, selectedAccount } = useStore();
  const T = useT(lang);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterDir, setFilterDir] = useState('all');
  const [filterStrategy, setFilterStrategy] = useState('all');

  const allTrades = getFilteredTrades();

  const filtered = useMemo(() => {
    return allTrades.filter((t) => {
      if (fromDate && t.trade_date < fromDate) return false;
      if (toDate && t.trade_date > toDate) return false;
      if (filterDir !== 'all' && t.direction !== filterDir) return false;
      if (filterStrategy !== 'all' && t.strategy_id !== filterStrategy) return false;
      return true;
    });
  }, [allTrades, fromDate, toDate, filterDir, filterStrategy]);

  const stats = useMemo(() => calcStats(filtered), [filtered]);
  const byStrat = useMemo(() => calcByStrategy(filtered, strategies), [filtered, strategies]);
  const bySymbol = useMemo(() => calcBySymbol(filtered), [filtered]);

  const accName = selectedAccount === 'all'
    ? T.allAccounts
    : accounts.find((a) => a.id === selectedAccount)?.name ?? '';

  const setPreset = (preset: 'week' | 'month' | 'quarter' | 'all') => {
    const now = new Date();
    if (preset === 'all') { setFromDate(''); setToDate(''); }
    else if (preset === 'month') {
      setFromDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
      setToDate(now.toISOString().split('T')[0]);
    } else if (preset === 'quarter') {
      const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      setFromDate(qStart.toISOString().split('T')[0]);
      setToDate(now.toISOString().split('T')[0]);
    } else {
      const d = new Date(now); d.setDate(d.getDate() - 7);
      setFromDate(d.toISOString().split('T')[0]);
      setToDate(now.toISOString().split('T')[0]);
    }
  };

  const pfDisplay = stats.profitFactor === Infinity ? '∞' : stats.profitFactor > 0 ? stats.profitFactor.toFixed(2) : '—';

  const kpis = [
    { l: T.totalPnL, v: formatPnL(stats.totalPnL), c: stats.totalPnL >= 0 ? 'var(--g)' : 'var(--r)' },
    { l: T.totalTrades, v: String(filtered.length), c: 'var(--t1)' },
    { l: T.winRate, v: filtered.length ? `${stats.winRate.toFixed(1)}%` : '—', c: 'var(--t1)' },
    { l: T.profitFactor, v: pfDisplay, c: 'var(--t1)' },
    { l: T.avgWin, v: stats.wins ? formatPnL(stats.avgWin) : '—', c: 'var(--g)' },
    { l: T.avgLoss, v: stats.losses ? formatPnL(stats.avgLoss) : '—', c: 'var(--r)' },
    { l: T.bestTrade, v: stats.bestTrade !== null ? formatPnL(stats.bestTrade) : '—', c: 'var(--g)' },
    { l: T.worstTrade, v: stats.worstTrade !== null ? formatPnL(stats.worstTrade) : '—', c: 'var(--r)' },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">{T.reports}</h1>
        {accName && <span style={{ fontSize: '.82rem', color: 'var(--t3)' }}>{accName}</span>}
      </div>

      {/* Filters */}
      <div className="settings-section">
        <div className="section-title">{T.dateRange}</div>
        <div className="date-row" style={{ flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: '.82rem', color: 'var(--t2)' }}>{T.from}</span>
            <input type="date" className="filter-inp" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={{ colorScheme: 'dark' }} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontSize: '.82rem', color: 'var(--t2)' }}>{T.to}</span>
            <input type="date" className="filter-inp" value={toDate} onChange={(e) => setToDate(e.target.value)} style={{ colorScheme: 'dark' }} />
          </div>
          <button className="btn btn-ghost" onClick={() => setPreset('week')}>{T.thisWeek}</button>
          <button className="btn btn-ghost" onClick={() => setPreset('month')}>{T.thisMonth}</button>
          <button className="btn btn-ghost" onClick={() => setPreset('quarter')}>{T.thisQuarter}</button>
          <button className="btn btn-ghost" onClick={() => setPreset('all')}>{T.allTime}</button>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <select className="filter-inp" value={filterDir} onChange={(e) => setFilterDir(e.target.value)}>
            <option value="all">{T.allDirections}</option>
            <option value="long">{T.long}</option>
            <option value="short">{T.short}</option>
          </select>
          <select className="filter-inp" value={filterStrategy} onChange={(e) => setFilterStrategy(e.target.value)}>
            <option value="all">{T.allStrategies}</option>
            {strategies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <span style={{ fontSize: '.78rem', color: 'var(--t3)', alignSelf: 'center', marginInlineStart: 4 }}>
            {filtered.length} {lang === 'he' ? 'עסקאות' : 'trades'}
          </span>
        </div>
      </div>

      {/* KPI cards */}
      <div className="settings-section">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
          {kpis.map((k) => (
            <div key={k.l} className="stat-card">
              <div className="stat-label">{k.l}</div>
              <div className="stat-value" style={{ color: k.c }}>{k.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* By Strategy */}
      {byStrat.length > 0 && (
        <div className="settings-section">
          <div className="section-title">{T.byStrategy}</div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{T.strategy}</th>
                  <th>{T.count}</th>
                  <th>{T.pnl}</th>
                  <th>{T.winRate}</th>
                </tr>
              </thead>
              <tbody>
                {byStrat.map((r) => (
                  <tr key={r.name}>
                    <td style={{ color: 'var(--t2)', fontSize: '.82rem' }}>{r.name}</td>
                    <td style={{ color: 'var(--t3)', fontSize: '.82rem' }}>{r.count}</td>
                    <td className={`mono-cell ${r.pnl >= 0 ? 'pnl-pos' : 'pnl-neg'}`}>{formatPnL(r.pnl)}</td>
                    <td style={{ color: 'var(--t2)', fontSize: '.82rem' }}>{r.winRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* By Symbol */}
      {bySymbol.length > 0 && (
        <div className="settings-section">
          <div className="section-title">{T.bySymbol}</div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{T.symbol}</th>
                  <th>{T.count}</th>
                  <th>{T.pnl}</th>
                  <th>{T.winRate}</th>
                </tr>
              </thead>
              <tbody>
                {bySymbol.map((r) => (
                  <tr key={r.symbol}>
                    <td className="mono-cell">{r.symbol}</td>
                    <td style={{ color: 'var(--t3)', fontSize: '.82rem' }}>{r.count}</td>
                    <td className={`mono-cell ${r.pnl >= 0 ? 'pnl-pos' : 'pnl-neg'}`}>{formatPnL(r.pnl)}</td>
                    <td style={{ color: 'var(--t2)', fontSize: '.82rem' }}>{r.winRate.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Export cards */}
      <div className="report-cards">
        <div className="report-card">
          <div className="report-card-title">{T.exportCSV}</div>
          <div className="report-card-desc">
            {lang === 'he'
              ? 'ייצא את העסקאות המסוננות לקובץ CSV הניתן לפתיחה ב-Excel. כולל כל השדות.'
              : 'Export filtered trades to a CSV file compatible with Excel. Includes all fields.'}
          </div>
          <button className="btn btn-primary" onClick={() => exportCSV(filtered, strategies)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {T.exportCSV}
          </button>
        </div>

        <div className="report-card">
          <div className="report-card-title">{T.exportPDF}</div>
          <div className="report-card-desc">
            {lang === 'he'
              ? 'צור דוח PDF מקצועי עם סיכום מלא, פירוט לפי אסטרטגיה וסמל, וטבלת עסקאות.'
              : 'Generate a professional PDF report with full summary, strategy & symbol breakdown, and trade list.'}
          </div>
          <button className="btn btn-primary" onClick={() => exportPDF(filtered, strategies, lang, fromDate, toDate)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
            {T.exportPDF}
          </button>
        </div>
      </div>

      <div className="disclaimer">{T.disclaimer}</div>
    </div>
  );
}
