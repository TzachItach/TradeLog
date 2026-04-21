import { useEffect, useRef } from 'react';
import { useStore } from '../store';

export default function MiniEquityChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { getFilteredTrades, currentYear, currentMonth, darkMode } = useStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      if (!W || !H) return;
      canvas.width = W * devicePixelRatio;
      canvas.height = H * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);

      const isDark = document.body.classList.contains('dark');
      const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
      const labelColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';

      ctx.clearRect(0, 0, W, H);

      // Trades for current month, sorted by date
      const trades = getFilteredTrades()
        .filter(t => {
          const d = new Date(t.trade_date);
          return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        })
        .sort((a, b) => a.trade_date.localeCompare(b.trade_date));

      if (trades.length === 0) {
        ctx.fillStyle = labelColor;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('אין נתונים לחודש זה', W / 2, H / 2);
        return;
      }

      // Cumulative P&L per day
      const dayMap = new Map<string, number>();
      for (const t of trades) {
        const key = t.trade_date.slice(0, 10);
        dayMap.set(key, (dayMap.get(key) || 0) + t.pnl);
      }
      const days = Array.from(dayMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

      const points: number[] = [0];
      let cum = 0;
      for (const [, pnl] of days) {
        cum += pnl;
        points.push(cum);
      }

      const pT = 16, pB = 22, pL = 8, pR = 8;
      const chartW = W - pL - pR;
      const chartH = H - pT - pB;

      const minV = Math.min(...points);
      const maxV = Math.max(...points);
      const range = maxV - minV || 1;

      const xOf = (i: number) => pL + (i / Math.max(points.length - 1, 1)) * chartW;
      const yOf = (v: number) => pT + chartH - ((v - minV) / range) * chartH;

      // Grid lines
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      for (let i = 0; i <= 3; i++) {
        const y = pT + (chartH / 3) * i;
        ctx.beginPath();
        ctx.moveTo(pL, y);
        ctx.lineTo(W - pR, y);
        ctx.stroke();
      }

      const finalPnl = points[points.length - 1];
      const color = finalPnl >= 0 ? '#1DB954' : '#ff4d60';

      // Area fill
      const grad = ctx.createLinearGradient(0, pT, 0, H - pB);
      grad.addColorStop(0, finalPnl >= 0 ? 'rgba(29,185,84,0.25)' : 'rgba(255,77,96,0.25)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.beginPath();
      ctx.moveTo(xOf(0), yOf(points[0]));
      for (let i = 1; i < points.length; i++) ctx.lineTo(xOf(i), yOf(points[i]));
      ctx.lineTo(xOf(points.length - 1), H - pB);
      ctx.lineTo(xOf(0), H - pB);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Line
      ctx.beginPath();
      ctx.moveTo(xOf(0), yOf(points[0]));
      for (let i = 1; i < points.length; i++) ctx.lineTo(xOf(i), yOf(points[i]));
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.stroke();

      // End dot
      const lastX = xOf(points.length - 1);
      const lastY = yOf(points[points.length - 1]);
      ctx.beginPath();
      ctx.arc(lastX, lastY, 9, 0, Math.PI * 2);
      ctx.fillStyle = finalPnl >= 0 ? 'rgba(29,185,84,0.2)' : 'rgba(255,77,96,0.2)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Date labels
      ctx.fillStyle = labelColor;
      ctx.font = '9px sans-serif';
      if (days.length > 0) {
        const fmt = (d: string) => d.slice(5).replace('-', '/');
        ctx.textAlign = 'left';
        ctx.fillText(fmt(days[0][0]), xOf(0), H - 4);
        if (days.length > 2) {
          ctx.textAlign = 'center';
          ctx.fillText(fmt(days[Math.floor(days.length / 2)][0]), xOf(Math.floor(points.length / 2)), H - 4);
        }
        ctx.textAlign = 'right';
        ctx.fillText(fmt(days[days.length - 1][0]), xOf(points.length - 1), H - 4);
      }
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [getFilteredTrades, currentYear, currentMonth, darkMode]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '140px', display: 'block' }}
    />
  );
}
