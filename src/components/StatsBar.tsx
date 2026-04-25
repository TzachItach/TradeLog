import { useStore, formatPnL } from '../store';
import { useT } from '../i18n';

export default function StatsBar() {
  const { lang, getStats } = useStore();
  const T = useT(lang);
  const s = getStats();

  const cards = [
    { label: T.totalPnL,      value: formatPnL(s.totalPnL),       color: s.totalPnL >= 0 ? 'var(--g)' : 'var(--r)' },
    { label: T.winRate,       value: `${s.winRate.toFixed(1)}%`,   color: s.winRate >= 50 ? 'var(--g)' : 'var(--r)' },
    { label: T.totalTrades,   value: String(s.totalTrades),        color: 'var(--b)' },
    { label: T.avgWin,        value: formatPnL(s.avgWin),          color: 'var(--g)' },
    { label: T.avgLoss,       value: formatPnL(s.avgLoss),         color: 'var(--r)' },
    { label: T.profitFactor,  value: s.profitFactor.toFixed(2),    color: s.profitFactor >= 1.5 ? 'var(--g)' : 'var(--o)' },
  ];

  return (
    <div id="tour-statsbar" className="stats-bar">
      {cards.map((c) => (
        <div key={c.label} className="stat-card">
          <div className="stat-label">{c.label}</div>
          <div className="stat-value" style={{ color: c.color }}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}
