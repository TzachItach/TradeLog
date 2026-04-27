import { useMemo, useRef, useEffect, useState } from 'react';
import { useStore, formatPnL } from '../store';
import {
  calcEquityPoints, calcDrawdownPoints, calcMaxDrawdown,
  calcByDay, calcBySymbol, calcHeatmapData, calcDistribution,
  calcStreaks, calcStrategyRows,
} from '../lib/analytics';
import type { StratRow } from '../lib/analytics';

type Trade = ReturnType<typeof useStore.getState>['trades'][0];

const G = '#1DB954', R = '#E91429', B = '#1DB954', O = '#F59B23';

function useColors() {
  const isDark = document.body.classList.contains('dark');
  return {
    isDark,
    text:        isDark ? '#737373' : '#6A6A6A',
    textPrimary: isDark ? '#FFFFFF' : '#000000',
    grid:  isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)',
    zero:  isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)',
    bg:    isDark ? '#181818' : '#FAFAFA',
  };
}

function useCanvas(
  ref: React.RefObject<HTMLCanvasElement>,
  draw: (ctx: CanvasRenderingContext2D, W: number, H: number) => void,
  deps: unknown[]
) {
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const render = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      // getBoundingClientRect עובד גם כשה-offsetWidth הוא 0
      const rect = canvas.getBoundingClientRect();
      const W = rect.width || canvas.parentElement?.getBoundingClientRect().width || 300;
      const H = rect.height || canvas.offsetHeight || 220;
      if (!W || !H) return;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);
      draw(ctx, W, H);
    };

    render();

    // ResizeObserver — מצייר מחדש כשהגודל משתנה (מעבר בין tabs, סיבוב מובייל)
    const ro = new ResizeObserver(() => render());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, deps);
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="settings-section" style={{ marginBottom: 14 }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: '.95rem' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '.72rem', color: 'var(--t3)', marginTop: 3 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}

// ── 1. Equity Curve ──────────────────────────────────────────
function EquityChart({ trades }: { trades: Trade[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const c = useColors();

  const points = useMemo(() => calcEquityPoints(trades), [trades]);

  useCanvas(ref, (ctx, W, H) => {
    const pL = 72, pR = 16, pT = 20, pB = 36;
    const cW = W - pL - pR, cH = H - pT - pB;
    const vals = points.map((p) => p.val);
    const maxV = Math.max(...vals, 0), minV = Math.min(...vals, 0);
    const range = maxV - minV || 1;
    const xOf = (i: number) => pL + (i / (points.length - 1)) * cW;
    const yOf = (v: number) => pT + cH - ((v - minV) / range) * cH;

    // grid
    [0, 0.25, 0.5, 0.75, 1].forEach((f) => {
      const v = minV + f * range;
      const y = yOf(v);
      ctx.beginPath(); ctx.strokeStyle = Math.abs(v) < range * 0.01 ? c.zero : c.grid;
      ctx.lineWidth = Math.abs(v) < range * 0.01 ? 1.5 : 0.5;
      ctx.moveTo(pL, y); ctx.lineTo(pL + cW, y); ctx.stroke();
      ctx.fillStyle = c.text; ctx.font = '10px system-ui'; ctx.textAlign = 'right';
      ctx.fillText(formatPnL(v), pL - 5, y + 3);
    });

    if (points.length < 2) return;

    // fill
    ctx.beginPath();
    points.forEach((p, i) => i === 0 ? ctx.moveTo(xOf(i), yOf(p.val)) : ctx.lineTo(xOf(i), yOf(p.val)));
    ctx.lineTo(xOf(points.length - 1), yOf(0));
    ctx.lineTo(xOf(0), yOf(0));
    ctx.closePath();
    ctx.fillStyle = (points[points.length - 1].val >= 0 ? G : R) + '22';
    ctx.fill();

    // line
    ctx.beginPath();
    points.forEach((p, i) => i === 0 ? ctx.moveTo(xOf(i), yOf(p.val)) : ctx.lineTo(xOf(i), yOf(p.val)));
    ctx.strokeStyle = points[points.length - 1].val >= 0 ? G : R;
    ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();

    // last value dot
    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(xOf(points.length - 1), yOf(last.val), 4, 0, Math.PI * 2);
    ctx.fillStyle = last.val >= 0 ? G : R; ctx.fill();
  }, [points, c.isDark]);

  return <div style={{ position: 'relative', width: '100%', height: 220 }}>
    <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
  </div>;
}

// ── 2. Drawdown ───────────────────────────────────────────────
function DrawdownChart({ trades }: { trades: Trade[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const c = useColors();

  const points = useMemo(() => calcDrawdownPoints(trades), [trades]);
  const maxDD  = useMemo(() => calcMaxDrawdown(trades), [trades]);

  useCanvas(ref, (ctx, W, H) => {
    const pL = 52, pR = 16, pT = 20, pB = 28;
    const cW = W - pL - pR, cH = H - pT - pB;
    const minV = Math.min(...points, -1);
    const xOf = (i: number) => pL + (i / (points.length - 1)) * cW;
    const yOf = (v: number) => pT + (v / minV) * cH;

    [0, -5, -10, -15, -20].filter((v) => v >= minV - 2).forEach((v) => {
      const y = pT + (v / minV) * cH;
      if (y < pT || y > pT + cH) return;
      ctx.beginPath(); ctx.strokeStyle = v === 0 ? c.zero : c.grid;
      ctx.lineWidth = v === 0 ? 1.5 : 0.5;
      ctx.moveTo(pL, y); ctx.lineTo(pL + cW, y); ctx.stroke();
      ctx.fillStyle = c.text; ctx.font = '10px system-ui'; ctx.textAlign = 'right';
      ctx.fillText(v + '%', pL - 5, y + 3);
    });

    if (points.length < 2) return;
    ctx.beginPath();
    points.forEach((p, i) => i === 0 ? ctx.moveTo(xOf(i), yOf(p)) : ctx.lineTo(xOf(i), yOf(p)));
    ctx.lineTo(xOf(points.length - 1), pT);
    ctx.lineTo(xOf(0), pT);
    ctx.closePath();
    ctx.fillStyle = R + '28'; ctx.fill();

    ctx.beginPath();
    points.forEach((p, i) => i === 0 ? ctx.moveTo(xOf(i), yOf(p)) : ctx.lineTo(xOf(i), yOf(p)));
    ctx.strokeStyle = R; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
  }, [points, c.isDark]);

  return <>
    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
      <div className="stat-card" style={{ flex: 1 }}>
        <div className="stat-label">Max Drawdown</div>
        <div className="stat-value" style={{ color: R, fontSize: '1.1rem' }}>{maxDD.toFixed(1)}%</div>
      </div>
    </div>
    <div style={{ position: 'relative', width: '100%', height: 180 }}>
      <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  </>;
}

// ── 3. P&L by Day ─────────────────────────────────────────────
function ByDayChart({ trades, lang }: { trades: Trade[]; lang: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const c = useColors();
  const isHe = lang === 'he';
  const dayLabels = isHe ? ["א'","ב'","ג'","ד'","ה'","ו'","ש'"] : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const byDay = useMemo(
    () => calcByDay(trades).map((b, i) => ({ label: dayLabels[i], pnl: b.pnl, count: b.count })),
    [trades, lang],
  );

  useCanvas(ref, (ctx, W, H) => {
    // pB = 10(gap) + 1(sep) + 18(pnl) + 17(count) + 17(dayname) + 5(bottom) = 68
    const pL = 64, pR = 16, pT = 32, pB = 68, cW = W - pL - pR, cH = H - pT - pB;
    const vals = byDay.map((d) => d.pnl);
    const maxAbs = Math.max(Math.max(...vals.map(Math.abs)), 100);
    const zeroY = pT + cH / 2;
    const yOf = (v: number) => pT + cH / 2 - (v / maxAbs) * (cH / 2);

    // Grid lines
    [-1,-0.5,0,0.5,1].forEach((f) => {
      const y = pT + cH / 2 - f * cH / 2;
      ctx.beginPath(); ctx.strokeStyle = f === 0 ? c.zero : c.grid;
      ctx.lineWidth = f === 0 ? 1.5 : 0.5;
      ctx.moveTo(pL, y); ctx.lineTo(pL + cW, y); ctx.stroke();
      if (f !== 0) {
        ctx.fillStyle = c.text; ctx.font = '10px system-ui'; ctx.textAlign = 'right';
        ctx.fillText(formatPnL(maxAbs * f).replace('+',''), pL - 5, y + 3);
      }
    });

    // Abbreviated: $672 or $2.1k (no + prefix — bar color indicates direction)
    const fmtShort = (v: number) => {
      const abs = Math.abs(v);
      const s = abs >= 1000 ? `$${(abs / 1000).toFixed(1)}k` : `$${Math.round(abs)}`;
      return v < 0 ? `-${s}` : s;
    };

    // Separator between chart area and day-name axis
    const sepY = pT + cH + 10;
    ctx.beginPath(); ctx.strokeStyle = c.grid; ctx.lineWidth = 1;
    ctx.moveTo(pL, sepY); ctx.lineTo(pL + cW, sepY); ctx.stroke();

    const bW = Math.min(48, (cW / 7) * 0.68);
    byDay.forEach((d: { label: string; pnl: number; count: number }, i: number) => {
      const x = pL + (i + 0.5) * (cW / 7);
      const bH = Math.abs(yOf(d.pnl) - zeroY);
      const bY = d.pnl >= 0 ? yOf(d.pnl) : zeroY;
      const col = d.pnl > 0 ? G : d.pnl < 0 ? R : '#545e80';

      // Bar
      const barH = Math.max(bH, 2);
      ctx.fillStyle = col + (d.count === 0 ? '33' : 'cc');
      ctx.beginPath();
      ctx.roundRect(x - bW/2, bY, bW, barH, d.pnl >= 0 ? [4,4,0,0] : [0,0,4,4]);
      ctx.fill();

      // Fixed axis stack — all days share the same 3 baselines
      const row1 = sepY + 16;  // P&L amount
      const row2 = sepY + 33;  // trade count
      const row3 = sepY + 50;  // day name (all aligned on same baseline)

      if (d.count > 0) {
        ctx.font = 'bold 9px system-ui'; ctx.textAlign = 'center'; ctx.fillStyle = c.textPrimary;
        ctx.fillText(fmtShort(d.pnl), x, row1);

        ctx.fillStyle = c.text; ctx.globalAlpha = 0.45; ctx.font = '9px system-ui';
        ctx.fillText(`(${d.count})`, x, row2);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = c.text; ctx.font = '11px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(d.label, x, row3);
    });
  }, [byDay, c.isDark]);

  return <div style={{ position: 'relative', width: '100%', height: 320 }}>
    <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
  </div>;
}

// ── 4. P&L by Symbol ─────────────────────────────────────────
function BySymbolChart({ trades }: { trades: Trade[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const c = useColors();

  const bySymbol = useMemo(() => calcBySymbol(trades), [trades]);

  const h = Math.max(bySymbol.length * 44 + 20, 100);

  useCanvas(ref, (ctx, W, H) => {
    const pL = 56, pR = Math.min(80, W * 0.22), pT = 10, pB = 10, cW = W - pL - pR, cH = H - pT - pB;
    const maxAbs = Math.max(...bySymbol.map(([, v]) => Math.abs(v)), 1);
    const rowH = cH / bySymbol.length;

    bySymbol.forEach(([sym, pnl], i) => {
      const y = pT + i * rowH + rowH / 2;
      const bW = (Math.abs(pnl) / maxAbs) * (cW * 0.85);
      const col = pnl >= 0 ? G : R;

      // Label
      ctx.fillStyle = c.text; ctx.font = '11px system-ui'; ctx.textAlign = 'right';
      ctx.fillText(sym, pL - 8, y + 4);

      // Bar
      ctx.fillStyle = col + 'bb';
      ctx.beginPath();
      ctx.roundRect(pL, y - 10, bW, 20, 3);
      ctx.fill();

      // Value
      ctx.fillStyle = c.textPrimary; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'left';
      ctx.fillText(formatPnL(pnl), pL + bW + 6, y + 4);
    });
  }, [bySymbol, c.isDark]);

  return <div style={{ position: 'relative', width: '100%', height: h }}>
    <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
  </div>;
}

// ── 5. Monthly Heatmap ────────────────────────────────────────
function MonthlyHeatmap({ trades, lang }: { trades: Trade[]; lang: string }) {
  const isHe = lang === 'he';
  const months = isHe
    ? ['ינ','פב','מר','אפ','מי','יו','יל','אג','ספ','אק','נו','דצ']
    : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const data = useMemo(() => calcHeatmapData(trades), [trades]);

  const years = useMemo(() => {
    const ys = new Set<string>();
    trades.forEach((t) => ys.add(t.trade_date.split('-')[0]));
    return Array.from(ys).sort().reverse();
  }, [trades]);

  const maxAbs = useMemo(() => {
    const vals = Object.values(data);
    return Math.max(...vals.map(Math.abs), 1);
  }, [data]);

  return (
    <div style={{ overflowX: 'auto' }}>
      {years.map((year) => (
        <div key={year} style={{ marginBottom: 16, minWidth: 600 }}>
          <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--t2)', marginBottom: 8 }}>{year}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 4 }}>
            {Array.from({ length: 12 }, (_, mi) => {
              const key = `${year}-${String(mi + 1).padStart(2, '0')}`;
              const pnl = data[key];
              const intensity = pnl != null ? Math.abs(pnl) / maxAbs : 0;
              const bg = pnl == null
                ? 'var(--s2)'
                : pnl > 0
                ? `rgba(0,224,168,${0.12 + intensity * 0.55})`
                : `rgba(255,64,96,${0.12 + intensity * 0.55})`;
              return (
                <div key={mi} style={{
                  background: bg, borderRadius: 6, padding: '8px 4px',
                  textAlign: 'center', border: '1px solid var(--bd)',
                }}>
                  <div style={{ fontSize: '.65rem', color: 'var(--t1)', marginBottom: 3 }}>{months[mi]}</div>
                  {pnl != null && (
                    <div style={{ fontSize: '.68rem', fontWeight: 700, color: 'var(--t1)', lineHeight: 1 }}>
                      {formatPnL(pnl)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 6. Distribution Histogram ─────────────────────────────────
function DistributionChart({ trades }: { trades: Trade[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const c = useColors();

  const { buckets, labels } = useMemo(() => calcDistribution(trades), [trades]);

  useCanvas(ref, (ctx, W, H) => {
    if (!buckets.length) return;
    const pL = 36, pR = 10, pT = 16, pB = 28, cW = W - pL - pR, cH = H - pT - pB;
    const maxB = Math.max(...buckets, 1);
    const bW = cW / buckets.length;

    buckets.forEach((b, i) => {
      const bH = (b / maxB) * cH;
      const x = pL + i * bW, y = pT + cH - bH;
      const midVal = (parseInt(labels[i]) || 0) * 1000;
      ctx.fillStyle = (midVal >= 0 ? G : R) + 'aa';
      ctx.beginPath();
      ctx.roundRect(x + 1, y, bW - 2, bH, [3, 3, 0, 0]);
      ctx.fill();
      if (b > 0) {
        ctx.fillStyle = midVal >= 0 ? G : R;
        ctx.font = '9px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(String(b), x + bW / 2, y - 3);
      }
    });

    // X labels
    const skip = Math.ceil(labels.length / 8);
    labels.forEach((l, i) => {
      if (i % skip !== 0) return;
      ctx.fillStyle = c.text; ctx.font = '9px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(l, pL + i * bW + bW / 2, H - pB + 12);
    });

    // Zero line
    ctx.beginPath(); ctx.strokeStyle = c.zero; ctx.lineWidth = 1;
    ctx.moveTo(pL, pT + cH); ctx.lineTo(pL + cW, pT + cH); ctx.stroke();
  }, [buckets, c.isDark]);

  return <div style={{ position: 'relative', width: '100%', height: 200 }}>
    <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
  </div>;
}

// ── 7. Risk/Reward Scatter ────────────────────────────────────
function RRScatterChart({ trades }: { trades: Trade[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const c = useColors();

  const pts = useMemo(() =>
    trades.filter((t) => t.stop_loss_pts && t.stop_loss_pts > 0)
      .map((t) => ({ x: t.stop_loss_pts!, y: t.pnl, win: t.pnl > 0 })),
    [trades]);

  useCanvas(ref, (ctx, W, H) => {
    if (!pts.length) return;
    const pL = 64, pR = 16, pT = 20, pB = 32, cW = W - pL - pR, cH = H - pT - pB;
    const maxX = Math.max(...pts.map((p) => p.x), 10);
    const maxY = Math.max(...pts.map((p) => Math.abs(p.y)), 100);
    const xOf = (v: number) => pL + (v / maxX) * cW;
    const yOf = (v: number) => pT + cH / 2 - (v / maxY) * (cH / 2);

    [-1,-0.5,0,0.5,1].forEach((f) => {
      const y = pT + cH / 2 - f * cH / 2;
      ctx.beginPath(); ctx.strokeStyle = f === 0 ? c.zero : c.grid;
      ctx.lineWidth = f === 0 ? 1.5 : 0.5;
      ctx.moveTo(pL, y); ctx.lineTo(pL + cW, y); ctx.stroke();
      ctx.fillStyle = c.text; ctx.font = '10px system-ui'; ctx.textAlign = 'right';
      ctx.fillText(formatPnL(maxY * f).replace('+', ''), pL - 5, y + 3);
    });

    ctx.fillStyle = c.text; ctx.font = '10px system-ui'; ctx.textAlign = 'center';
    ctx.fillText('SL (pts)', pL + cW / 2, H - 4);

    pts.forEach((p) => {
      ctx.beginPath();
      ctx.arc(xOf(p.x), yOf(p.y), 5, 0, Math.PI * 2);
      ctx.fillStyle = (p.win ? G : R) + 'cc';
      ctx.fill();
    });
  }, [pts, c.isDark]);

  if (!pts.length) return (
    <div style={{ color: 'var(--t3)', fontSize: '.82rem', padding: '20px 0' }}>
      הוסף עסקאות עם שדה Stop Loss כדי לראות את הגרף
    </div>
  );

  return <div style={{ position: 'relative', width: '100%', height: 220 }}>
    <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
  </div>;
}

// ── 8. Consecutive W/L ───────────────────────────────────────
function StreakChart({ trades, lang }: { trades: Trade[]; lang: string }) {
  const isHe = lang === 'he';
  const ref = useRef<HTMLCanvasElement>(null);
  const c = useColors();

  const { winStreaks, lossStreaks, longestWin, longestLoss } = useMemo(() => calcStreaks(trades), [trades]);

  const maxLen = Math.max(...Object.keys(winStreaks).map(Number), ...Object.keys(lossStreaks).map(Number), 1);
  const labels = Array.from({ length: maxLen }, (_, i) => String(i + 1));

  useCanvas(ref, (ctx, W, H) => {
    const pL = 36, pR = 16, pT = 16, pB = 28, cW = W - pL - pR, cH = H - pT - pB;
    const maxV = Math.max(...Object.values(winStreaks), ...Object.values(lossStreaks), 1);
    const bW = (cW / maxLen) / 2 - 2;

    labels.forEach((_, i) => {
      const n = i + 1;
      const x = pL + (i / maxLen) * cW + cW / maxLen / 2;
      const wV = winStreaks[n] || 0, lV = lossStreaks[n] || 0;

      if (wV > 0) {
        const bH = (wV / maxV) * cH;
        ctx.fillStyle = G + 'aa';
        ctx.beginPath(); ctx.roundRect(x - bW - 1, pT + cH - bH, bW, bH, [3,3,0,0]); ctx.fill();
        ctx.fillStyle = G; ctx.font = '9px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(String(wV), x - bW / 2 - 1, pT + cH - bH - 3);
      }
      if (lV > 0) {
        const bH = (lV / maxV) * cH;
        ctx.fillStyle = R + 'aa';
        ctx.beginPath(); ctx.roundRect(x + 1, pT + cH - bH, bW, bH, [3,3,0,0]); ctx.fill();
        ctx.fillStyle = R; ctx.font = '9px system-ui'; ctx.textAlign = 'center';
        ctx.fillText(String(lV), x + bW / 2 + 1, pT + cH - bH - 3);
      }

      ctx.fillStyle = c.text; ctx.font = '10px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(labels[i], x, H - pB + 12);
    });
  }, [winStreaks, lossStreaks, c.isDark]);

  return <>
    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
      <div className="stat-card" style={{ flex: 1 }}>
        <div className="stat-label">{isHe ? 'הרצף הארוך ביותר ✓' : 'Longest win streak'}</div>
        <div className="stat-value" style={{ color: G }}>{longestWin}</div>
      </div>
      <div className="stat-card" style={{ flex: 1 }}>
        <div className="stat-label">{isHe ? 'הרצף הארוך ביותר ✗' : 'Longest loss streak'}</div>
        <div className="stat-value" style={{ color: R }}>{longestLoss}</div>
      </div>
    </div>
    <div style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.72rem', color: 'var(--t2)' }}>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: G }} />
        {isHe ? 'זכיות' : 'Wins'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.72rem', color: 'var(--t2)' }}>
        <div style={{ width: 10, height: 10, borderRadius: 2, background: R }} />
        {isHe ? 'הפסדים' : 'Losses'}
      </div>
    </div>
    <div style={{ position: 'relative', width: '100%', height: 200 }}>
      <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
    <div style={{ fontSize: '.7rem', color: 'var(--t3)', marginTop: 8 }}>
      {isHe ? 'ציר X = אורך הרצף · ציר Y = כמה פעמים קרה' : 'X = streak length · Y = how many times it occurred'}
    </div>
  </>;
}

// ── 9. Strategy Comparison ───────────────────────────────────
type Strategy = ReturnType<typeof useStore.getState>['strategies'][0];


function useStrategyRows(trades: Trade[], strategies: Strategy[]) {
  return useMemo(() => calcStrategyRows(trades, strategies), [trades, strategies]);
}

function MultiEquityChart({ rows, allDates }: { rows: StratRow[]; allDates: string[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const c = useColors();
  useCanvas(ref, (ctx, W, H) => {
    if (!rows.length || allDates.length < 2) return;
    const pL = 72, pR = 16, pT = 20, pB = 28;
    const cW = W - pL - pR, cH = H - pT - pB;
    const allVals = rows.flatMap((r) => r.pts);
    const maxV = Math.max(...allVals, 0), minV = Math.min(...allVals, 0);
    const range = maxV - minV || 1;
    const xOf = (i: number) => pL + (i / Math.max(allDates.length - 1, 1)) * cW;
    const yOf = (v: number) => pT + cH - ((v - minV) / range) * cH;
    [0, 0.25, 0.5, 0.75, 1].forEach((f) => {
      const v = minV + f * range, y = yOf(v);
      ctx.beginPath(); ctx.strokeStyle = Math.abs(v) < range * 0.01 ? c.zero : c.grid;
      ctx.lineWidth = Math.abs(v) < range * 0.01 ? 1.5 : 0.5;
      ctx.moveTo(pL, y); ctx.lineTo(pL + cW, y); ctx.stroke();
      ctx.fillStyle = c.text; ctx.font = '10px system-ui'; ctx.textAlign = 'right';
      ctx.fillText(formatPnL(v), pL - 5, y + 3);
    });
    rows.forEach((r) => {
      if (r.pts.length < 2) return;
      ctx.beginPath();
      r.pts.forEach((v, i) => (i === 0 ? ctx.moveTo(xOf(i), yOf(v)) : ctx.lineTo(xOf(i), yOf(v))));
      ctx.strokeStyle = r.color; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
      const last = r.pts[r.pts.length - 1];
      ctx.beginPath();
      ctx.arc(xOf(r.pts.length - 1), yOf(last), 3.5, 0, Math.PI * 2);
      ctx.fillStyle = r.color; ctx.fill();
    });
  }, [rows, allDates, c.isDark]);
  return (
    <div>
      <div style={{ position: 'relative', width: '100%', height: 200 }}>
        <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', marginTop: 10 }}>
        {rows.map((r) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '.72rem', color: 'var(--t2)' }}>
            <div style={{ width: 18, height: 3, borderRadius: 2, background: r.color, flexShrink: 0 }} />
            {r.name}
          </div>
        ))}
      </div>
    </div>
  );
}

function StrategyStatsTable({ rows, isHe }: { rows: StratRow[]; isHe: boolean }) {
  const col: React.CSSProperties = { padding: '9px 10px', fontSize: '.78rem', textAlign: 'left', whiteSpace: 'nowrap' };
  const hdr: React.CSSProperties = { ...col, color: 'var(--t3)', fontWeight: 600, fontSize: '.68rem', textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid var(--bd2)' };
  const headers = isHe
    ? ['אסטרטגיה','עסקאות','WR%','P&L כולל','ממוצע','Profit Factor']
    : ['Strategy','Trades','WR%','Total P&L','Avg P&L','Profit Factor'];
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
        <thead><tr>{headers.map((h) => <th key={h} style={hdr}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: '1px solid var(--bd)' }}>
              <td style={col}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                  <span style={{ color: 'var(--t1)', fontWeight: 600 }}>{r.name}</span>
                </div>
              </td>
              <td style={{ ...col, color: 'var(--t2)' }}>{r.tradeCount}</td>
              <td style={{ ...col, color: r.winRate >= 50 ? G : R, fontWeight: 700 }}>{r.winRate.toFixed(0)}%</td>
              <td style={{ ...col, color: r.totalPnL >= 0 ? G : R, fontWeight: 700 }}>{formatPnL(r.totalPnL)}</td>
              <td style={{ ...col, color: r.avgPnL >= 0 ? G : R }}>{formatPnL(r.avgPnL)}</td>
              <td style={{ ...col, color: r.profitFactor >= 1.5 ? G : r.profitFactor >= 1 ? O : R, fontWeight: 700 }}>
                {r.profitFactor === 99 ? '∞' : r.profitFactor.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StrategyTab({ trades, strategies, isHe }: { trades: Trade[]; strategies: Strategy[]; isHe: boolean }) {
  const { rows, allDates } = useStrategyRows(trades, strategies);
  const hasRealStrategies = rows.some((r) => r.id !== '__none__');
  return (
    <>
      {!hasRealStrategies && (
        <div style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 10, padding: '12px 16px', marginBottom: 14, fontSize: '.82rem', color: 'var(--t3)' }}>
          {isHe
            ? 'הקצה אסטרטגיות לעסקאות שלך (בטופס העסקה) כדי להשוות בין הביצועים שלהן.'
            : 'Assign strategies to your trades (in the trade form) to compare their performance.'}
        </div>
      )}
      <ChartCard
        title={isHe ? 'עקומות הון לפי אסטרטגיה' : 'Equity Curves by Strategy'}
        subtitle={isHe ? 'P&L מצטבר לאורך הזמן — כל קו = אסטרטגיה אחת' : 'Cumulative P&L over time — each line = one strategy'}
      >
        <MultiEquityChart rows={rows} allDates={allDates} />
      </ChartCard>
      <ChartCard
        title={isHe ? 'השוואת ביצועים' : 'Performance Comparison'}
        subtitle={isHe ? 'מדדים עיקריים לפי אסטרטגיה' : 'Key metrics by strategy'}
      >
        <StrategyStatsTable rows={rows} isHe={isHe} />
      </ChartCard>
    </>
  );
}

// ── Main Analytics Page ───────────────────────────────────────
export default function Analytics() {
  const { lang, getFilteredTrades, strategies } = useStore();
  const [tab, setTab] = useState(0);
  const isHe = lang === 'he';
  const trades = getFilteredTrades().filter((t) => t.pnl != null);

  const tabs = [
    { label: 'Time',        labelHe: 'זמן' },
    { label: 'Performance', labelHe: 'ביצועים' },
    { label: 'Calendar',    labelHe: 'לוח שנה' },
    { label: 'Stats',       labelHe: 'סטטיסטיקה' },
    { label: 'Risk',        labelHe: 'סיכון' },
    { label: 'Strategies',  labelHe: 'אסטרטגיות' },
  ];

  if (trades.length === 0) return (
    <div className="page-content">
      <div className="page-header"><h1 className="page-title">{isHe ? 'ניתוח מסחר' : 'Analytics'}</h1></div>
      <div className="empty-state">
        <div className="empty-title">{isHe ? 'אין עסקאות עדיין' : 'No trades yet'}</div>
        <div className="empty-desc">{isHe ? 'הוסף עסקאות כדי לראות ניתוחים' : 'Add trades to see analytics'}</div>
      </div>
    </div>
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">{isHe ? 'ניתוח מסחר' : 'Analytics'}</h1>
      </div>

      {/* Tabs */}
      <div id="tour-analytics-tabs" className="analytics-tabs">
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{
              padding: '6px 13px', borderRadius: 18, fontSize: '.78rem', cursor: 'pointer',
              border: '1px solid ' + (tab === i ? 'var(--b-bd)' : 'var(--bd2)'),
              background: tab === i ? 'var(--b-bg)' : 'var(--s2)',
              color: tab === i ? 'var(--b)' : 'var(--t2)',
              fontFamily: 'inherit', transition: 'all .12s',
            }}>
            {isHe ? t.labelHe : t.label}
          </button>
        ))}
      </div>

      {/* Tab 0: Time — Equity Curve + Drawdown stacked */}
      {tab === 0 && (
        <>
          <ChartCard title={isHe ? 'עקומת הון' : 'Equity Curve'} subtitle={isHe ? 'P&L מצטבר לאורך הזמן' : 'Cumulative P&L over time'}>
            <EquityChart trades={trades} />
          </ChartCard>
          <ChartCard title="Drawdown" subtitle={isHe ? 'ירידה מהשיא (%)' : 'Drop from peak (%)'}>
            <DrawdownChart trades={trades} />
          </ChartCard>
        </>
      )}

      {/* Tab 1: Performance — P&L by Day + P&L by Symbol (2-col on desktop) */}
      {tab === 1 && (
        <div className="analytics-grid-2col">
          <ChartCard title={isHe ? 'P&L לפי יום שבוע' : 'P&L by Day of Week'} subtitle={isHe ? 'אילו ימים הכי רווחיים?' : 'Which days are most profitable?'}>
            <ByDayChart trades={trades} lang={lang} />
          </ChartCard>
          <ChartCard title={isHe ? 'P&L לפי סמל' : 'P&L by Symbol'} subtitle={isHe ? 'ביצועים לפי מכשיר מסחר' : 'Performance by instrument'}>
            <BySymbolChart trades={trades} />
          </ChartCard>
        </div>
      )}

      {/* Tab 2: Calendar — Monthly Heatmap full width */}
      {tab === 2 && (
        <ChartCard title={isHe ? 'מפת חום חודשית' : 'Monthly Heatmap'} subtitle={isHe ? 'P&L לפי חודש ושנה' : 'P&L by month and year'}>
          <MonthlyHeatmap trades={trades} lang={lang} />
        </ChartCard>
      )}

      {/* Tab 3: Stats — Distribution + Streaks (2-col on desktop) */}
      {tab === 3 && (
        <div className="analytics-grid-2col">
          <ChartCard title={isHe ? 'התפלגות עסקאות' : 'Trade Distribution'} subtitle={isHe ? 'כמה עסקאות בכל טווח P&L' : 'How many trades in each P&L range'}>
            <DistributionChart trades={trades} />
          </ChartCard>
          <ChartCard title={isHe ? 'ניתוח רצפים' : 'Streak Analysis'} subtitle={isHe ? 'רצפי זכיות והפסדים' : 'Consecutive wins and losses'}>
            <StreakChart trades={trades} lang={lang} />
          </ChartCard>
        </div>
      )}

      {/* Tab 4: Risk — Risk/Reward Scatter full width */}
      {tab === 4 && (
        <ChartCard title="Risk / Reward" subtitle={isHe ? 'Stop Loss בנקודות מול P&L בפועל' : 'Stop Loss in pts vs actual P&L'}>
          <RRScatterChart trades={trades} />
        </ChartCard>
      )}

      {/* Tab 5: Strategies — multi-equity overlay + stats table */}
      {tab === 5 && <StrategyTab trades={trades} strategies={strategies} isHe={isHe} />}
    </div>
  );
}
