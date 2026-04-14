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

interface WeekSummary {
  pnl: number;
  wins: number;
  losses: number;
  trades: number;
  wr: number;
}

function DayCell({
  cell, isExpanded, lang, isSunday, onExpand, onEmpty, onTrade,
}: {
  cell: CellData; isExpanded: boolean; lang: string; isSunday?: boolean;
  onExpand: () => void; onEmpty: () => void; onTrade: (id: string) => void;
}) {
  const T = useT(lang as 'he' | 'en');
  const { trades, totalPnL, day } = cell;
  const hasTrades = trades.length > 0;
  const isProfit = hasTrades && totalPnL > 0;
  const isLoss = hasTrades && totalPnL < 0;
  const today = new Date();
  const isToday = cell.dateStr === `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const wins = trades.filter(t => t.pnl > 0).length;
  const wr = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;
  const wrColor = wr >= 60 ? 'var(--g)' : wr >= 40 ? 'var(--o)' : 'var(--r)';
  const wrBg = wr >= 60 ? 'rgba(0,224,168,.18)' : wr >= 40 ? 'rgba(255,170,68,.18)' : 'rgba(255,64,96,.18)';

  let cls = 'day-cell';
  if (isProfit) cls += ' profit';
  else if (isLoss) cls += ' loss';
  if (isToday) cls += ' today';

  const visible = isExpanded ? trades : trades.slice(0, 6);
  const extra = trades.length - 6;

  return (
    <div className={cls} onClick={() => { if (!hasTrades) onEmpty(); }}
      style={isSunday ? { opacity: 0.45, fontSize: '.8em' } : undefined}
    >
      <div className="cell-head">
        <span className="cell-daynum">{day}</span>
        {hasTrades && (
          <span style={{
            fontSize: '.58rem', fontWeight: 800, padding: '1px 5px',
            borderRadius: 10, background: wrBg, color: wrColor,
            lineHeight: 1.4, flexShrink: 0,
          }}>{wr}%</span>
        )}
      </div>
      {hasTrades && (
        <div style={{
          fontSize: '.72rem', fontWeight: 800, fontFamily: 'monospace',
          color: isProfit ? 'var(--g)' : 'var(--r)', lineHeight: 1, marginBottom: 3,
        }}>{formatPnL(totalPnL)}</div>
      )}
      <div className="cell-trades">
        {visible.map((tr) => (
          <div key={tr.id} className={`trade-badge ${tr.pnl >= 0 ? 'pos' : 'neg'}`}
            onClick={(e) => { e.stopPropagation(); onTrade(tr.id); }}
            style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <span style={{ fontSize: '.56rem', color: tr.pnl >= 0 ? 'var(--g)' : 'var(--r)', opacity: .7 }}>
              {tr.direction === 'long' ? '▲' : '▼'}
            </span>
            <span>{tr.symbol}</span>
          </div>
        ))}
        {!isExpanded && extra > 0 && (
          <span className="more-badge" onClick={(e) => { e.stopPropagation(); onExpand(); }}>
            +{extra} {T.more}
          </span>
        )}
        {isExpanded && trades.length > 6 && (
          <span className="more-badge" onClick={(e) => { e.stopPropagation(); onExpand(); }}>▲</span>
        )}
      </div>
      {!hasTrades && <div className="cell-add">+</div>}
    </div>
  );
}

function WeekSummaryCell({ summary, weekNum, lang }: { summary: WeekSummary; weekNum: number; lang: string }) {
  const isHe = lang === 'he';
  const hasData = summary.trades > 0;
  const isProfit = summary.pnl >= 0;
  const wrColor = summary.wr >= 60 ? 'var(--g)' : summary.wr >= 40 ? 'var(--o)' : 'var(--r)';
  const borderColor = isProfit ? 'rgba(0,224,168,.4)' : 'rgba(255,64,96,.4)';
  const bgColor = isProfit ? 'rgba(0,224,168,.07)' : 'rgba(255,64,96,.07)';

  if (!hasData) {
    return (
      <div style={{
        borderRadius: 8, border: '1px dashed var(--bd)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: 84,
      }}>
        <span style={{ fontSize: '.72rem', color: 'var(--t3)', fontWeight: 600 }}>
          {isHe ? `ש${weekNum}` : `W${weekNum}`}
        </span>
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: 8, border: `1.5px solid ${borderColor}`,
      background: bgColor, padding: '8px 8px',
      display: 'flex', flexDirection: 'column', gap: 5,
      alignItems: 'center', justifyContent: 'center',
      minHeight: 84,
    }}>
      {/* תווית */}
      <div style={{
        fontSize: '.65rem', color: 'var(--t3)', fontWeight: 700,
        letterSpacing: '.05em', textTransform: 'uppercase',
      }}>
        {isHe ? `שבוע ${weekNum}` : `Week ${weekNum}`}
      </div>

      {/* P&L — גדול ובולט */}
      <div style={{
        fontSize: '.9rem', fontWeight: 900, fontFamily: 'monospace',
        color: isProfit ? 'var(--g)' : 'var(--r)',
        lineHeight: 1, textAlign: 'center',
      }}>
        {formatPnL(summary.pnl)}
      </div>

      {/* WR pill */}
      <div style={{
        fontSize: '.72rem', fontWeight: 800, padding: '3px 10px',
        borderRadius: 12, background: wrColor + '20', color: wrColor,
        border: `1px solid ${wrColor}44`, lineHeight: 1.3,
        width: '100%', textAlign: 'center',
      }}>
        {summary.wr}% WR
      </div>

      {/* W / L */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '.7rem', color: 'var(--g)', fontWeight: 700 }}>{summary.wins}W</span>
        <span style={{ fontSize: '.6rem', color: 'var(--t3)' }}>·</span>
        <span style={{ fontSize: '.7rem', color: 'var(--r)', fontWeight: 700 }}>{summary.losses}L</span>
      </div>
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

  // חשב שורות שבועיות
  const weeks = useMemo(() => {
    const rows: (CellData | null)[][] = [];
    let row: (CellData | null)[] = [];
    cells.forEach((cell, i) => {
      row.push(cell);
      if (row.length === 7) { rows.push(row); row = []; }
    });
    if (row.length > 0) {
      while (row.length < 7) row.push(null);
      rows.push(row);
    }
    return rows;
  }, [cells]);

  // סיכום שבועי לכל שורה
  const weekSummaries = useMemo<WeekSummary[]>(() => {
    return weeks.map(row => {
      const trades = row.flatMap(c => c?.trades ?? []);
      const wins = trades.filter(t => t.pnl > 0).length;
      const losses = trades.filter(t => t.pnl < 0).length;
      const pnl = trades.reduce((s, t) => s + t.pnl, 0);
      const wr = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;
      return { pnl, wins, losses, trades: trades.length, wr };
    });
  }, [weeks]);

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

  const isRtl = lang === 'he';

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

      {/* כותרות ימים — ראשון קטן, שבוע גדול */}
      <div style={{ display: 'grid', gridTemplateColumns: '32px repeat(6,1fr) 100px', gap: 3, marginBottom: 3 }}>
        {T.days.map((d, i) => (
          <div key={d} className="day-hdr" style={{
            opacity: i === 0 ? 0.35 : 1,
            fontSize: i === 0 ? '.54rem' : undefined,
          }}>{d}</div>
        ))}
        <div className="day-hdr" style={{ textAlign: 'center', color: 'var(--b)', fontWeight: 700 }}>
          {lang === 'he' ? 'שבוע' : 'Week'}
        </div>
      </div>

      {/* שורות שבועיות */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {weeks.map((row, wi) => (
          <div key={wi} style={{ display: 'grid', gridTemplateColumns: '32px repeat(6,1fr) 100px', gap: 3 }}>
            {row.map((cell, ci) =>
              !cell ? (
                <div key={`e-${wi}-${ci}`}
                  className="day-cell empty"
                  style={ci === 0 ? { opacity: 0.3, minHeight: 84 } : {}}
                />
              ) : (
                <DayCell
                  key={cell.dateStr}
                  cell={cell}
                  isExpanded={expandedDay === cell.dateStr}
                  lang={lang}
                  isSunday={ci === 0}
                  onExpand={() => setExpandedDay(expandedDay === cell.dateStr ? null : cell.dateStr)}
                  onEmpty={() => setModal({ type: 'new', date: cell.dateStr })}
                  onTrade={(id) => setModal({ type: 'edit', tradeId: id })}
                />
              )
            )}
            <WeekSummaryCell
              summary={weekSummaries[wi]}
              weekNum={wi + 1}
              lang={lang}
            />
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="cal-legend">
        <div className="leg-item"><div className="leg-dot" style={{ background: 'var(--g)' }} />{T.profit}</div>
        <div className="leg-item"><div className="leg-dot" style={{ background: 'var(--r)' }} />{T.loss}</div>
        <div className="leg-item"><div className="leg-dot" style={{ background: 'var(--b)' }} />{T.today}</div>
        <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 6 }}>
          <span style={{ fontSize: '.63rem', padding: '1px 6px', borderRadius: 8, background: 'rgba(0,224,168,.15)', color: 'var(--g)', fontWeight: 700 }}>60%+</span>
          <span style={{ fontSize: '.63rem', padding: '1px 6px', borderRadius: 8, background: 'rgba(255,170,68,.15)', color: 'var(--o)', fontWeight: 700 }}>40-60%</span>
          <span style={{ fontSize: '.63rem', padding: '1px 6px', borderRadius: 8, background: 'rgba(255,64,96,.15)', color: 'var(--r)', fontWeight: 700 }}>{'<'}40%</span>
        </div>
      </div>
    </div>
  );
}
