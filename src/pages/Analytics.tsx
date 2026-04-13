import { useMemo, useRef, useEffect } from 'react';
import { useStore, formatPnL } from '../store';
import { useT } from '../i18n';

function PnLByDayChart({ trades, lang }: { trades: ReturnType<typeof useStore.getState>['trades'], lang: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isHe = lang === 'he';

  const dayLabels = isHe
    ? ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"]
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const byDay = useMemo(() => {
    const sums = Array(7).fill(0);
    const counts = Array(7).fill(0);
    trades.forEach((t) => {
      if (!t.trade_date || t.pnl == null) return;
      const d = new Date(t.trade_date + 'T12:00:00').getDay();
      sums[d] += t.pnl;
      counts[d]++;
    });
    return dayLabels.map((label, i) => ({ label, pnl: sums[i], count: counts[i] }));
  }, [trades, lang]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const isDark = !document.body.classList.contains('light');
    const textColor = isDark ? '#9aa5cc' : '#3d4666';
    const gridColor = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
    const greenColor = isDark ? '#00e0a8' : '#00a87c';
    const redColor = isDark ? '#ff4060' : '#e8203c';
    const zeroColor = isDark ? '#545e80' : '#8890aa';

    const padL = 64, padR = 16, padT = 20, padB = 40;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    ctx.clearRect(0, 0, W, H);

    const values = byDay.map((d) => d.pnl);
    const maxAbs = Math.max(Math.abs(Math.max(...values)), Math.abs(Math.min(...values)), 100);
    const yScale = (v: number) => padT + chartH / 2 - (v / maxAbs) * (chartH / 2);
    const zeroY = padT + chartH / 2;

    // Grid lines
    [-1, -0.5, 0, 0.5, 1].forEach((f) => {
      const y = padT + chartH / 2 - f * chartH / 2;
      ctx.beginPath();
      ctx.strokeStyle = f === 0 ? (isDark ? '#2c3350' : '#c8cedf') : gridColor;
      ctx.lineWidth = f === 0 ? 1.5 : 0.5;
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + chartW, y);
      ctx.stroke();

      if (f !== 0) {
        const label = formatPnL(maxAbs * f).replace('+', '');
        ctx.fillStyle = textColor;
        ctx.font = '10px system-ui';
        ctx.textAlign = 'right';
        ctx.fillText(label, padL - 6, y + 4);
      }
    });

    // Bars
    const barW = Math.min(48, (chartW / 7) * 0.65);
    byDay.forEach((d, i) => {
      const x = padL + (i + 0.5) * (chartW / 7);
      const barH = Math.abs(yScale(d.pnl) - zeroY);
      const barY = d.pnl >= 0 ? yScale(d.pnl) : zeroY;
      const color = d.pnl > 0 ? greenColor : d.pnl < 0 ? redColor : zeroColor;

      // Bar
      ctx.fillStyle = color + (d.count === 0 ? '33' : 'bb');
      const radius = 4;
      ctx.beginPath();
      if (d.pnl >= 0) {
        ctx.roundRect(x - barW / 2, barY, barW, Math.max(barH, 2), [radius, radius, 0, 0]);
      } else {
        ctx.roundRect(x - barW / 2, barY, barW, Math.max(barH, 2), [0, 0, radius, radius]);
      }
      ctx.fill();

      // Value label
      if (d.count > 0) {
        ctx.fillStyle = color;
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        const labelY = d.pnl >= 0 ? barY - 5 : barY + barH + 13;
        ctx.fillText(formatPnL(d.pnl), x, labelY);
      }

      // Day label
      ctx.fillStyle = textColor;
      ctx.font = '11px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, x, H - padB + 16);

      // Trade count
      if (d.count > 0) {
        ctx.fillStyle = isDark ? '#545e80' : '#8890aa';
        ctx.font = '9px system-ui';
        ctx.fillText(`(${d.count})`, x, H - padB + 28);
      }
    });
  }, [byDay]);

  return (
    <div style={{ position: 'relative', width: '100%', height: 280 }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block' }}
        aria-label="P&L לפי יום שבוע"
        role="img"
      />
    </div>
  );
}

export default function Analytics() {
  const { lang, getFilteredTrades } = useStore();
  const T = useT(lang);
  const trades = getFilteredTrades().filter((t) => t.pnl != null);

  const isHe = lang === 'he';

  // סטטיסטיקות נוספות
  const bestDay = useMemo(() => {
    const sums: Record<number, number> = {};
    trades.forEach((t) => {
      const d = new Date(t.trade_date + 'T12:00:00').getDay();
      sums[d] = (sums[d] || 0) + t.pnl;
    });
    const days = isHe
      ? ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"]
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let best = { day: -1, pnl: -Infinity };
    let worst = { day: -1, pnl: Infinity };
    Object.entries(sums).forEach(([k, v]) => {
      if (v > best.pnl) best = { day: Number(k), pnl: v };
      if (v < worst.pnl) worst = { day: Number(k), pnl: v };
    });
    return {
      best: best.day >= 0 ? { label: days[best.day], pnl: best.pnl } : null,
      worst: worst.day >= 0 ? { label: days[worst.day], pnl: worst.pnl } : null,
    };
  }, [trades, isHe]);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">{isHe ? 'ניתוח מסחר' : 'Analytics'}</h1>
      </div>

      {trades.length === 0 ? (
        <div className="empty-state">
          <div className="empty-title">{T.noTrades}</div>
          <div className="empty-desc">{T.noTradesDesc}</div>
        </div>
      ) : (
        <>
          {/* כרטיסי סיכום */}
          <div className="stats-bar" style={{ marginBottom: 16 }}>
            <div className="stat-card">
              <div className="stat-label">{isHe ? 'יום הכי טוב' : 'Best day'}</div>
              <div className="stat-value" style={{ color: 'var(--g)', fontSize: '1rem' }}>
                {bestDay.best ? `${bestDay.best.label} · ${formatPnL(bestDay.best.pnl)}` : '—'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">{isHe ? 'יום הכי גרוע' : 'Worst day'}</div>
              <div className="stat-value" style={{ color: 'var(--r)', fontSize: '1rem' }}>
                {bestDay.worst ? `${bestDay.worst.label} · ${formatPnL(bestDay.worst.pnl)}` : '—'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">{isHe ? 'סה"כ עסקאות' : 'Total trades'}</div>
              <div className="stat-value" style={{ color: 'var(--b)' }}>{trades.length}</div>
            </div>
          </div>

          {/* גרף P&L לפי יום */}
          <div className="settings-section">
            <div className="section-title">
              {isHe ? 'P&L לפי יום שבוע' : 'P&L by Day of Week'}
            </div>
            <PnLByDayChart trades={trades} lang={lang} />
            <div style={{ fontSize: '.72rem', color: 'var(--t3)', marginTop: 10, textAlign: 'center' }}>
              {isHe
                ? 'הסכום הכולל של כל העסקאות לפי יום שבוע · המספרים בסוגריים = כמות עסקאות'
                : 'Total P&L per day of week · Numbers in parentheses = trade count'}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
