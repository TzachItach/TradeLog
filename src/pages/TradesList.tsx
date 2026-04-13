import { useMemo, useState } from 'react';
import { useStore, formatPnL } from '../store';
import { useT } from '../i18n';

type SortKey = 'trade_date' | 'symbol' | 'pnl' | 'direction';
type SortDir = 'asc' | 'desc';

export default function TradesList() {
  const { lang, getFilteredTrades, strategies, setModal } = useStore();
  const T = useT(lang);

  const [search, setSearch] = useState('');
  const [filterDir, setFilterDir] = useState('all');
  const [filterStrategy, setFilterStrategy] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('trade_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const baseTrades = getFilteredTrades();

  const filtered = useMemo(() => {
    let list = [...baseTrades];
    if (search) list = list.filter((t) => t.symbol.toLowerCase().includes(search.toLowerCase()));
    if (filterDir !== 'all') list = list.filter((t) => t.direction === filterDir);
    if (filterStrategy !== 'all') list = list.filter((t) => t.strategy_id === filterStrategy);
    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'trade_date') cmp = a.trade_date.localeCompare(b.trade_date);
      else if (sortKey === 'symbol') cmp = a.symbol.localeCompare(b.symbol);
      else if (sortKey === 'pnl') cmp = a.pnl - b.pnl;
      else if (sortKey === 'direction') cmp = a.direction.localeCompare(b.direction);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [baseTrades, search, filterDir, filterStrategy, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  const strategyName = (id?: string) =>
    id ? (strategies.find((s) => s.id === id)?.name ?? '—') : '—';

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">{T.trades}</h1>
        <button className="btn btn-primary" onClick={() => setModal({ type: 'new' })}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {T.newTrade}
        </button>
      </div>

      <div className="filters-row">
        <input
          type="text"
          className="filter-inp"
          placeholder={T.searchSymbol}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 160 }}
        />
        <select className="filter-inp" value={filterDir} onChange={(e) => setFilterDir(e.target.value)}>
          <option value="all">{T.allDirections}</option>
          <option value="long">{T.long}</option>
          <option value="short">{T.short}</option>
        </select>
        <select className="filter-inp" value={filterStrategy} onChange={(e) => setFilterStrategy(e.target.value)}>
          <option value="all">{T.allStrategies}</option>
          {strategies.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <span style={{ fontSize: '.78rem', color: 'var(--t3)', marginInlineStart: 'auto' }}>
          {filtered.length} {lang === 'he' ? 'עסקאות' : 'trades'}
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">{T.noTrades}</div>
          <div className="empty-desc">{T.noTradesDesc}</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('trade_date')}>{T.date}{sortIcon('trade_date')}</th>
                <th onClick={() => handleSort('symbol')}>{T.symbol}{sortIcon('symbol')}</th>
                <th onClick={() => handleSort('direction')}>{T.direction}{sortIcon('direction')}</th>
                <th onClick={() => handleSort('pnl')}>{T.pnl}{sortIcon('pnl')}</th>
                <th>{T.strategy}</th>
                <th>{T.size}</th>
                <th>{T.notes}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tr) => (
                <tr
                  key={tr.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setModal({ type: 'edit', tradeId: tr.id })}
                >
                  <td style={{ color: 'var(--t2)', fontSize: '.82rem' }}>{tr.trade_date}</td>
                  <td className="mono-cell">{tr.symbol}</td>
                  <td>
                    <span className={`dir-badge ${tr.direction}`}>
                      {tr.direction === 'long' ? '▲' : '▼'} {tr.direction === 'long' ? T.long : T.short}
                    </span>
                  </td>
                  <td className={`mono-cell ${tr.pnl >= 0 ? 'pnl-pos' : 'pnl-neg'}`}>
                    {formatPnL(tr.pnl)}
                  </td>
                  <td style={{ color: 'var(--t2)', fontSize: '.82rem' }}>{strategyName(tr.strategy_id)}</td>
                  <td style={{ color: 'var(--t2)', fontSize: '.82rem' }}>{tr.size ?? '—'}</td>
                  <td style={{ color: 'var(--t3)', fontSize: '.8rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tr.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
