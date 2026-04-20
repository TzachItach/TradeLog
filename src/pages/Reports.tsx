import { useState } from 'react';
import { useStore, formatPnL } from '../store';
import { useT } from '../i18n';

function exportCSV(trades: ReturnType<typeof useStore.getState>['trades'], strategies: ReturnType<typeof useStore.getState>['strategies']) {
  const headers = ['Date', 'Symbol', 'Direction', 'P&L ($)', 'Size', 'Stop Loss (pts)', 'Take Profit (pts)', 'Strategy', 'HTF PD Array', 'Psychology', 'Notes'];
  const rows = trades.map((t) => {
    const strat = strategies.find((s) => s.id === t.strategy_id)?.name ?? '';
    return [
      t.trade_date, t.symbol, t.direction, t.pnl, t.size ?? '', t.stop_loss_pts ?? '',
      t.take_profit_pts ?? '', strat, t.htf_pd_array ?? '', t.psychology ?? '', t.notes ?? '',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
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

function exportPDF(trades: ReturnType<typeof useStore.getState>['trades'], strategies: ReturnType<typeof useStore.getState>['strategies'], lang: string) {
  const win = window.open('', '_blank');
  if (!win) return;
  const totalPnL = trades.reduce((s, t) => s + t.pnl, 0);
  const wins = trades.filter((t) => t.pnl > 0);
  const winRate = trades.length ? ((wins.length / trades.length) * 100).toFixed(1) : '0';
  const rows = trades
    .map((t) => {
      const strat = strategies.find((s) => s.id === t.strategy_id)?.name ?? '';
      const pnlColor = t.pnl >= 0 ? '#00c896' : '#ff3355';
      return `<tr>
        <td>${t.trade_date}</td><td>${t.symbol}</td><td>${t.direction}</td>
        <td style="color:${pnlColor};font-weight:700">${formatPnL(t.pnl)}</td>
        <td>${strat}</td><td>${t.notes ?? ''}</td>
      </tr>`;
    })
    .join('');

  win.document.write(`<!DOCTYPE html><html dir="${lang === 'he' ? 'rtl' : 'ltr'}"><head>
    <meta charset="UTF-8"><title>TradeLog Report</title>
    <style>
      body{font-family:system-ui,sans-serif;background:#fff;color:#111;padding:40px;margin:0}
      h1{font-size:2rem;margin-bottom:4px}
      .sub{color:#666;margin-bottom:32px}
      .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:32px}
      .stat{background:#f5f5f5;border-radius:10px;padding:16px}
      .stat-l{font-size:.72rem;color:#888;text-transform:uppercase;letter-spacing:.07em;margin-bottom:6px}
      .stat-v{font-size:1.4rem;font-weight:700;font-family:monospace}
      table{width:100%;border-collapse:collapse;font-size:.88rem}
      th{background:#f0f0f0;padding:10px 12px;text-align:inherit;font-size:.72rem;letter-spacing:.07em;text-transform:uppercase;color:#666}
      td{padding:9px 12px;border-bottom:1px solid #eee}
      .disc{margin-top:32px;padding:14px;background:#fff8e1;border-radius:8px;font-size:.78rem;color:#666}
      @media print{body{padding:20px}button{display:none}}
    </style>
  </head><body>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
      <div style="width:36px;height:36px;background:#5e6ad2;border-radius:8px;display:flex;align-items:center;justify-content:center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"><polyline points="3,17 9,11 13,15 21,6"/></svg>
      </div>
      <h1>TradeLog</h1>
    </div>
    <div class="sub">${lang === 'he' ? 'דוח מסחר' : 'Trading Report'} — ${new Date().toLocaleDateString()}</div>
    <div class="stats">
      <div class="stat"><div class="stat-l">${lang === 'he' ? 'רווח/הפסד כולל' : 'Total P&L'}</div><div class="stat-v" style="color:${totalPnL >= 0 ? '#00c896' : '#ff3355'}">${formatPnL(totalPnL)}</div></div>
      <div class="stat"><div class="stat-l">${lang === 'he' ? 'אחוז זכייה' : 'Win Rate'}</div><div class="stat-v">${winRate}%</div></div>
      <div class="stat"><div class="stat-l">${lang === 'he' ? 'סה"כ עסקאות' : 'Total Trades'}</div><div class="stat-v">${trades.length}</div></div>
    </div>
    <table>
      <thead><tr><th>${lang === 'he' ? 'תאריך' : 'Date'}</th><th>${lang === 'he' ? 'סמל' : 'Symbol'}</th><th>${lang === 'he' ? 'כיוון' : 'Dir.'}</th><th>P&L</th><th>${lang === 'he' ? 'אסטרטגיה' : 'Strategy'}</th><th>${lang === 'he' ? 'הערות' : 'Notes'}</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="disc">⚠ ${lang === 'he' ? 'המידע המוצג אינו ייעוץ השקעות. מסחר בניירות ערך כרוך בסיכון אובדן הון.' : 'Information displayed is not investment advice. Trading involves significant risk of capital loss.'}</div>
    <div style="margin-top:16px;text-align:center"><button onclick="window.print()" style="background:#4a7dff;color:#fff;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-size:.9rem">🖨 ${lang === 'he' ? 'הדפס / שמור PDF' : 'Print / Save as PDF'}</button></div>
  </body></html>`);
  win.document.close();
}

export default function Reports() {
  const { lang, getFilteredTrades, strategies, accounts, selectedAccount } = useStore();
  const T = useT(lang);

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const allTrades = getFilteredTrades();
  const filtered = allTrades.filter((t) => {
    if (fromDate && t.trade_date < fromDate) return false;
    if (toDate && t.trade_date > toDate) return false;
    return true;
  });

  const totalPnL = filtered.reduce((s, t) => s + t.pnl, 0);
  const wins = filtered.filter((t) => t.pnl > 0);

  const accName = selectedAccount === 'all'
    ? T.allAccounts
    : accounts.find((a) => a.id === selectedAccount)?.name ?? '';

  const setPreset = (preset: 'week' | 'month' | 'all') => {
    const now = new Date();
    if (preset === 'all') { setFromDate(''); setToDate(''); }
    else if (preset === 'month') {
      setFromDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
      setToDate(now.toISOString().split('T')[0]);
    } else {
      const d = new Date(now); d.setDate(d.getDate() - 7);
      setFromDate(d.toISOString().split('T')[0]);
      setToDate(now.toISOString().split('T')[0]);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">{T.reports}</h1>
      </div>

      {/* Date range */}
      <div className="settings-section">
        <div className="section-title">{T.dateRange}</div>
        <div className="date-row">
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
          <button className="btn btn-ghost" onClick={() => setPreset('all')}>{T.allTime}</button>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { l: T.totalPnL, v: formatPnL(totalPnL), c: totalPnL >= 0 ? 'var(--g)' : 'var(--r)' },
            { l: T.totalTrades, v: String(filtered.length), c: 'var(--b)' },
            { l: T.winRate, v: filtered.length ? `${((wins.length / filtered.length) * 100).toFixed(1)}%` : '—', c: 'var(--t1)' },
          ].map((s) => (
            <div key={s.l} className="stat-card" style={{ flex: 1 }}>
              <div className="stat-label">{s.l}</div>
              <div className="stat-value" style={{ color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Export cards */}
      <div className="report-cards">
        <div className="report-card">
          <div className="report-card-title">{T.exportCSV}</div>
          <div className="report-card-desc">
            {lang === 'he'
              ? 'ייצא את כל העסקאות לקובץ CSV הניתן לפתיחה ב-Excel. כולל כל השדות.'
              : 'Export all trades to a CSV file compatible with Excel. Includes all fields.'}
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
              ? 'צור דוח PDF מקצועי עם סיכום סטטיסטי וטבלת עסקאות. מתאים להדפסה.'
              : 'Generate a professional PDF report with stats summary and trade table. Print-ready.'}
          </div>
          <button className="btn btn-primary" onClick={() => exportPDF(filtered, strategies, lang)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
            {T.exportPDF}
          </button>
        </div>
      </div>

      <div className="disclaimer">{T.disclaimer}</div>
    </div>
  );
}
