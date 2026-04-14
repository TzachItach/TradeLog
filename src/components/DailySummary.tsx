import { useEffect, useState } from 'react';
import { useStore, formatPnL } from '../store';

interface Props {
  savedDate: string;
  onClose: () => void;
}

export default function DailySummary({ savedDate, onClose }: Props) {
  const { lang, getFilteredTrades } = useStore();
  const isHe = lang === 'he';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // אנימציית כניסה
    const t = setTimeout(() => setVisible(true), 10);
    // סגור אוטומטית אחרי 8 שניות
    const auto = setTimeout(() => handleClose(), 8000);
    return () => { clearTimeout(t); clearTimeout(auto); };
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const allTrades = getFilteredTrades();

  // נתוני היום
  const dayTrades = allTrades.filter(t => t.trade_date === savedDate && t.pnl != null);
  const dayPnL = dayTrades.reduce((s, t) => s + t.pnl, 0);
  const dayWins = dayTrades.filter(t => t.pnl > 0).length;
  const dayWR = dayTrades.length ? Math.round((dayWins / dayTrades.length) * 100) : 0;

  // נתוני השבוע
  const now = new Date(savedDate);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekStr = weekStart.toISOString().split('T')[0];
  const weekTrades = allTrades.filter(t => t.trade_date >= weekStr && t.pnl != null);
  const weekPnL = weekTrades.reduce((s, t) => s + t.pnl, 0);
  const weekWins = weekTrades.filter(t => t.pnl > 0).length;
  const weekWR = weekTrades.length ? Math.round((weekWins / weekTrades.length) * 100) : 0;

  // best trade of the day
  const best = dayTrades.reduce((b, t) => (!b || t.pnl > b.pnl ? t : b), null as typeof dayTrades[0] | null);

  const isProfit = dayPnL >= 0;

  return (
    <div style={{
      position: 'fixed', bottom: 24, insetInlineEnd: 24, zIndex: 500,
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      opacity: visible ? 1 : 0,
      transition: 'all .3s ease',
      maxWidth: 300, width: 'calc(100vw - 48px)',
    }}>
      <div style={{
        background: 'var(--s1)',
        border: `1.5px solid ${isProfit ? 'rgba(0,224,168,.4)' : 'rgba(255,64,96,.4)'}`,
        borderRadius: 14,
        padding: '16px 18px',
        boxShadow: '0 8px 32px rgba(0,0,0,.3)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: '.7rem', color: 'var(--t3)', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: 3 }}>
              {isHe ? 'סיכום יום' : 'Day Summary'} · {savedDate}
            </div>
            <div style={{ fontSize: '1.55rem', fontWeight: 800, fontFamily: 'monospace', color: isProfit ? 'var(--g)' : 'var(--r)', lineHeight: 1 }}>
              {formatPnL(dayPnL)}
            </div>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: '1.1rem', padding: '0 0 0 8px', lineHeight: 1 }}>×</button>
        </div>

        {/* יום */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          {[
            { l: isHe ? 'עסקאות' : 'Trades', v: String(dayTrades.length), c: 'var(--b)' },
            { l: isHe ? 'Win Rate' : 'Win Rate', v: `${dayWR}%`, c: dayWR >= 50 ? 'var(--g)' : 'var(--r)' },
          ].map(s => (
            <div key={s.l} style={{ flex: 1, background: 'var(--s2)', borderRadius: 8, padding: '8px 10px' }}>
              <div style={{ fontSize: '.6rem', color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 3 }}>{s.l}</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'monospace', color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>

        {/* Best trade */}
        {best && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'var(--s2)', borderRadius: 8, marginBottom: 10 }}>
            <span style={{ fontSize: '.68rem', color: 'var(--t3)' }}>{isHe ? 'הטוב ביותר:' : 'Best:'}</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '.82rem' }}>{best.symbol}</span>
            <span style={{ fontSize: '.7rem', color: best.direction === 'long' ? 'var(--g)' : 'var(--r)' }}>
              {best.direction === 'long' ? '▲' : '▼'}
            </span>
            <span style={{ marginInlineStart: 'auto', fontFamily: 'monospace', fontWeight: 700, color: 'var(--g)', fontSize: '.82rem' }}>
              {formatPnL(best.pnl)}
            </span>
          </div>
        )}

        {/* שבוע */}
        <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '.7rem', color: 'var(--t3)' }}>{isHe ? 'השבוע:' : 'This week:'}</span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '.84rem', color: weekPnL >= 0 ? 'var(--g)' : 'var(--r)' }}>
              {formatPnL(weekPnL)}
            </span>
            <span style={{ fontSize: '.75rem', color: weekWR >= 50 ? 'var(--g)' : 'var(--r)', fontWeight: 600 }}>
              {weekWR}% WR
            </span>
          </div>
        </div>

        {/* Progress bar - auto close */}
        <div style={{ marginTop: 10, height: 2, background: 'var(--bd)', borderRadius: 1, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: isProfit ? 'var(--g)' : 'var(--r)',
            borderRadius: 1,
            animation: 'shrink 8s linear forwards',
          }} />
        </div>
        <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
      </div>
    </div>
  );
}
