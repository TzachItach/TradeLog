import { useMemo, useState } from 'react';
import { useStore, formatPnL } from '../store';
import { useT } from '../i18n';
import type { Trade } from '../types';

interface CellData {
  day: number;
  dateStr: string;
  trades: Trade[];
  totalPnL: number;
}

function DayCell({
  cell,
  isExpanded,
  lang,
  onExpand,
  onEmpty,
  onTrade,
}: {
  cell: CellData;
  isExpanded: boolean;
  lang: string;
  onExpand: () => void;
  onEmpty: () => void;
  onTrade: (id: string) => void;
}) {
  const T = useT(lang as 'he' | 'en');
  const { trades, totalPnL, day } = cell;
  const hasTrades = trades.length > 0;
  const isProfit = hasTrades && totalPnL > 0;
  const isLoss = hasTrades && totalPnL < 0;

  const today = new Date();
  const isToday =
    cell.dateStr ===
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  let cls = 'day-cell';
  if (isProfit) cls += ' profit';
  else if (isLoss) cls += ' loss';
  if (isToday) cls += ' today';

  const visible = isExpanded ? trades : trades.slice(0, 2);
  const extra = trades.length - 2;

  return (
    <div
      className={cls}
      onClick={() => { if (!hasTrades) onEmpty(); }}
    >
      <div className="cell-head">
        <span className="cell-daynum">{day}</span>
        {hasTrades && <span className="cell-pnl">{formatPnL(totalPnL)}</span>}
      </div>

      <div className="cell-trades">
        {visible.map((tr) => (
          <div
            key={tr.id}
            className={`trade-badge ${tr.pnl >= 0 ? 'pos' : 'neg'}`}
            onClick={(e) => { e.stopPropagation(); onTrade(tr.id); }}
          >
            {tr.symbol} {tr.direction === 'long' ? '▲' : '▼'}
          </div>
        ))}
        {!isExpanded && extra > 0 && (
          <span
            className="more-badge"
            onClick={(e) => { e.stopPropagation(); onExpand(); }}
          >
            +{extra} {T.more}
          </span>
        )}
        {isExpanded && trades.length > 2 && (
          <span
            className="more-badge"
            onClick={(e) => { e.stopPropagation(); onExpand(); }}
          >
            ▲
          </span>
        )}
      </div>

      {!hasTrades && (
        <div className="cell-add">+</div>
      )}
    </div>
  );
}

export default function CalendarView() {
  const { lang, currentYear, currentMonth, setCurrentDate, setModal, getFilteredTrades } = useStore();
  const T = useT(lang);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const filteredTrades = getFilteredTrades();

  const tradesByDate = useMemo(() => {
    const map: Record<string, Trade[]> = {};
    filteredTrades.forEach((tr) => {
      if (!map[tr.trade_date]) map[tr.trade_date] = [];
      map[tr.trade_date].push(tr);
    });
    return map;
  }, [filteredTrades]);

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const cells = useMemo<(CellData | null)[]>(() => {
    const result: (CellData | null)[] = [];
    for (let i = 0; i < firstDay; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const trades = tradesByDate[dateStr] || [];
      result.push({ day: d, dateStr, trades, totalPnL: trades.reduce((s, t) => s + (t.pnl || 0), 0) });
    }
    return result;
  }, [currentYear, currentMonth, firstDay, daysInMonth, tradesByDate]);

  const prevMonth = () => {
    if (currentMonth === 0) setCurrentDate(currentYear - 1, 11);
    else setCurrentDate(currentYear, currentMonth - 1);
    setExpandedDay(null);
  };

  const nextMonth = () => {
    if (currentMonth === 11) setCurrentDate(currentYear + 1, 0);
    else setCurrentDate(currentYear, currentMonth + 1);
    setExpandedDay(null);
  };

  return (
    <div className="cal-wrap">
      <div className="cal-nav">
        <button className="btn btn-icon" onClick={prevMonth}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <div className="cal-title">
          <span className="cal-month-name">{T.months[currentMonth]}</span>
          <span className="cal-year">{currentYear}</span>
        </div>
        <button className="btn btn-icon" onClick={nextMonth}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>
        </button>
      </div>

      <div className="day-headers">
        {T.days.map((d) => <div key={d} className="day-hdr">{d}</div>)}
      </div>

      <div className="cal-grid">
        {cells.map((cell, i) =>
          !cell ? (
            <div key={`e-${i}`} className="day-cell empty" />
          ) : (
            <DayCell
              key={cell.dateStr}
              cell={cell}
              isExpanded={expandedDay === cell.dateStr}
              lang={lang}
              onExpand={() => setExpandedDay(expandedDay === cell.dateStr ? null : cell.dateStr)}
              onEmpty={() => setModal({ type: 'new', date: cell.dateStr })}
              onTrade={(id) => setModal({ type: 'edit', tradeId: id })}
            />
          ),
        )}
      </div>

      <div className="cal-legend">
        <div className="leg-item"><div className="leg-dot" style={{ background: 'var(--g)' }} />{T.profit}</div>
        <div className="leg-item"><div className="leg-dot" style={{ background: 'var(--r)' }} />{T.loss}</div>
        <div className="leg-item"><div className="leg-dot" style={{ background: 'var(--b)' }} />{T.today}</div>
      </div>
    </div>
  );
}
