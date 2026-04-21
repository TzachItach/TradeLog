import { useStore, formatPnL } from '../store';

export default function RecentTrades() {
  const { getFilteredTrades, setModal, lang } = useStore();

  const trades = getFilteredTrades()
    .slice()
    .sort((a, b) => {
      const dateCmp = b.trade_date.localeCompare(a.trade_date);
      return dateCmp;
    })
    .slice(0, 5);

  const formatDate = (dateStr: string) => {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const yest = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);
    const d = dateStr.slice(0, 10);
    if (d === todayStr) return lang === 'he' ? 'היום' : 'Today';
    if (d === yest) return lang === 'he' ? 'אתמול' : 'Yesterday';
    const dt = new Date(dateStr);
    return dt.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US', { day: 'numeric', month: 'short' });
  };

  if (trades.length === 0) {
    return (
      <div className="recent-trades-card">
        <p style={{ color: 'var(--t3)', fontSize: '.82rem', textAlign: 'center', padding: '24px 0' }}>
          {lang === 'he' ? 'אין עסקאות עדיין' : 'No trades yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="recent-trades-card">
      {trades.map((trade, i) => (
        <div key={trade.id}>
          {i > 0 && <div className="recent-trades-divider" />}
          <div
            className="recent-trade-row"
            onClick={() => setModal({ type: 'edit', tradeId: trade.id })}
          >
            <div className={`recent-trade-symbol ${trade.direction}`}>
              {trade.symbol.slice(0, 4)}
            </div>
            <div className="recent-trade-info">
              <div className="recent-trade-name">
                {trade.symbol} · {trade.direction === 'long' ? 'Long' : 'Short'}
              </div>
              <div className="recent-trade-meta">
                {formatDate(trade.trade_date)}
                {trade.size ? ` · ${trade.size} ${lang === 'he' ? 'חוזים' : 'contracts'}` : ''}
              </div>
            </div>
            <div className={`recent-trade-pnl ${trade.pnl >= 0 ? 'green' : 'red'}`}>
              {formatPnL(trade.pnl)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
