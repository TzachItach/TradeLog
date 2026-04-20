import { useMemo, useRef, useEffect, useState } from 'react';
import { useStore, formatPnL } from '../store';

type Trade = ReturnType<typeof useStore.getState>['trades'][0];

const G = '#3bce7c', R = '#ff4060', B = '#5e6ad2', O = '#ffaa44';

function useColors() {
  const isDark = !document.body.classList.contains('light');
  return {
    isDark,
    text: isDark ? '#8a8f98' : '#40405a',
    grid: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.07)',
    zero: isDark ? 'rgba(255,255,255,.08)' : '#d0d4e0',
    bg: isDark ? '#0f1011' : '#ffffff',
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

  const points = useMemo(() => {
    const sorted = [...trades].sort((a, b) => a.trade_date.localeCompare(b.trade_date));
    let cum = 0;
    const pts = [{ date: '', val: 0 }];
    sorted.forEach((t) => { cum += t.pnl; pts.push({ date: t.trade_date, val: cum }); });
    return pts;
  }, [trades]);

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

  const points = useMemo(() => {
    const sorted = [...trades].sort((a, b) => a.trade_date.localeCompare(b.trade_date));
    let cum = 0, peak = 0;
    const pts: number[] = [0];
    sorted.forEach((t) => {
      cum += t.pnl;
      if (cum > peak) peak = cum;
      pts.push(peak > 0 ? ((cum - peak) / peak) * 100 : 0);
    });
    return pts;
  }, [trades]);

  const maxDD = useMemo(() => Math.min(...points), [points]);

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

  const byDay = useMemo(() => {
    const sums = Array(7).fill(0), counts = Array(7).fill(0);
    trades.forEach((t) => {
      const d = new Date(t.trade_date + 'T12:00:00').getDay();
      sums[d] += t.pnl; counts[d]++;
    });
    return dayLabels.map((label, i) => ({ label, pnl: sums[i], count: counts[i] }));
  }, [trades, lang]);

  useCanvas(ref, (ctx, W, H) => {
    const pL = 64, pR = 16, pT = 32, pB = 42, cW = W - pL - pR, cH = H - pT - pB;
    const vals = byDay.map((d) => d.pnl);
    const maxAbs = Math.max(Math.max(...vals.map(Math.abs)), 100);
    const zeroY = pT + cH / 2;
    const yOf = (v: number) => pT + cH / 2 - (v / maxAbs) * (cH / 2);

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

    const bW = Math.min(44, (cW / 7) * 0.6);
    byDay.forEach((d, i) => {
      const x = pL + (i + 0.5) * (cW / 7);
      const bH = Math.abs(yOf(d.pnl) - zeroY);
      const bY = d.pnl >= 0 ? yOf(d.pnl) : zeroY;
      const col = d.pnl > 0 ? G : d.pnl < 0 ? R : '#545e80';

      const barH = Math.max(bH, 2);
      ctx.fillStyle = col + (d.count === 0 ? '33' : 'bb');
      ctx.beginPath();
      ctx.roundRect(x - bW/2, bY, bW, barH, d.pnl >= 0 ? [4,4,0,0] : [0,0,4,4]);
      ctx.fill();

      if (d.count > 0) {
        ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'center';
        if (barH >= 18) {
          // label inside the bar, near the open end
          ctx.fillStyle = 'rgba(255,255,255,0.92)';
          const insideY = d.pnl >= 0 ? bY + 13 : bY + barH - 4;
          ctx.fillText(formatPnL(d.pnl), x, insideY);
        } else {
          // bar too short — draw outside but clamped
          ctx.fillStyle = col;
          const outsideY = d.pnl >= 0
            ? Math.max(bY - 4, pT + 11)
            : Math.min(bY + barH + 12, H - pB - 4);
          ctx.fillText(formatPnL(d.pnl), x, outsideY);
        }
      }
      ctx.fillStyle = c.text; ctx.font = '11px system-ui'; ctx.textAlign = 'center';
      ctx.fillText(d.label, x, H - pB + 14);
      if (d.count > 0) {
        ctx.fillStyle = c.grid; ctx.font = '9px system-ui';
        ctx.fillText(`(${d.count})`, x, H - pB + 26);
      }
    });
  }, [byDay, c.isDark]);

  return <div style={{ position: 'relative', width: '100%', height: 260 }}>
    <canvas ref={ref} style={{ width: '100%', height: '100%', display: 'block' }} />
  </div>;
}

// ── 4. P&L by Symbol ─────────────────────────────────────────
function BySymbolChart({ trades }: { trades: Trade[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const c = useColors();

  const bySymbol = useMemo(() => {
    const map: Record<string, number> = {};
    trades.forEach((t) => { map[t.symbol] = (map[t.symbol] || 0) + t.pnl; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [trades]);

  const h = Math.max(bySymbol.length * 44 + 20, 100);

  useCanvas(ref, (ctx, W, H) => {
    const pL = 56, pR = 80, pT = 10, pB = 10, cW = W - pL - pR, cH = H - pT - pB;
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
      ctx.fillStyle = col; ctx.font = 'bold 10px system-ui'; ctx.textAlign = 'left';
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

  const data = useMemo(() => {
    const map: Record<string, number> = {};
    trades.forEach((t) => {
      const [y, m] = t.trade_date.split('-');
      const key = `${y}-${m}`;
      map[key] = (map[key] || 0) + t.pnl;
    });
    return map;
  }, [trades]);

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
        <div key={year} style={{ marginBottom: 16 }}>
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
                  <div style={{ fontSize: '.65rem', color: 'var(--t3)', marginBottom: 3 }}>{months[mi]}</div>
                  {pnl != null && (
                    <div style={{ fontSize: '.68rem', fontWeight: 700, color: pnl >= 0 ? 'var(--g)' : 'var(--r)', lineHeight: 1 }}>
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

  const { buckets, labels } = useMemo(() => {
    if (!trades.length) return { buckets: [], labels: [] };
    const pnls = trades.map((t) => t.pnl);
    const min = Math.min(...pnls), max = Math.max(...pnls);
    const step = Math.ceil((max - min) / 10 / 100) * 100 || 100;
    const start = Math.floor(min / step) * step;
    const bkts: number[] = [];
    const lbls: string[] = [];
    for (let v = start; v <= max + step; v += step) {
      bkts.push(0);
      lbls.push(v >= 0 ? `+${(v / 1000).toFixed(0)}k` : `${(v / 1000).toFixed(0)}k`);
    }
    pnls.forEach((p) => {
      const idx = Math.min(Math.floor((p - start) / step), bkts.length - 1);
      if (idx >= 0) bkts[idx]++;
    });
    return { buckets: bkts, labels: lbls };
  }, [trades]);

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

  const { winStreaks, lossStreaks, longestWin, longestLoss } = useMemo(() => {
    const sorted = [...trades].sort((a, b) => a.trade_date.localeCompare(b.trade_date));
    const ws: Record<number, number> = {}, ls: Record<number, number> = {};
    let curW = 0, curL = 0, maxW = 0, maxL = 0;
    sorted.forEach((t) => {
      if (t.pnl > 0) { curW++; curL = 0; ws[curW] = (ws[curW] || 0) + 1; if (curW > maxW) maxW = curW; }
      else if (t.pnl < 0) { curL++; curW = 0; ls[curL] = (ls[curL] || 0) + 1; if (curL > maxL) maxL = curL; }
      else { curW = 0; curL = 0; }
    });
    return { winStreaks: ws, lossStreaks: ls, longestWin: maxW, longestLoss: maxL };
  }, [trades]);

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

// ── Main Analytics Page ───────────────────────────────────────
export default function Analytics() {
  const { lang, getFilteredTrades } = useStore();
  const [tab, setTab] = useState(0);
  const isHe = lang === 'he';
  const trades = getFilteredTrades().filter((t) => t.pnl != null);

  const tabs = [
    { label: 'Equity Curve',        labelHe: 'עקומת הון' },
    { label: 'Drawdown',            labelHe: 'Drawdown' },
    { label: 'P&L by Day',          labelHe: 'P&L לפי יום' },
    { label: 'P&L by Symbol',       labelHe: 'P&L לפי סמל' },
    { label: 'Monthly Heatmap',     labelHe: 'מפת חום חודשית' },
    { label: 'Distribution',        labelHe: 'התפלגות' },
    { label: 'Risk/Reward',         labelHe: 'Risk/Reward' },
    { label: 'Streaks',             labelHe: 'רצפים' },
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
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
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

      {tab === 0 && (
        <ChartCard title={isHe ? 'עקומת הון' : 'Equity Curve'} subtitle={isHe ? 'P&L מצטבר לאורך הזמן' : 'Cumulative P&L over time'}>
          <EquityChart trades={trades} />
        </ChartCard>
      )}
      {tab === 1 && (
        <ChartCard title="Drawdown" subtitle={isHe ? 'ירידה מהשיא (%)' : 'Drop from peak (%)'}>
          <DrawdownChart trades={trades} />
        </ChartCard>
      )}
      {tab === 2 && (
        <ChartCard title={isHe ? 'P&L לפי יום שבוע' : 'P&L by Day of Week'} subtitle={isHe ? 'אילו ימים הכי רווחיים?' : 'Which days are most profitable?'}>
          <ByDayChart trades={trades} lang={lang} />
        </ChartCard>
      )}
      {tab === 3 && (
        <ChartCard title={isHe ? 'P&L לפי סמל' : 'P&L by Symbol'} subtitle={isHe ? 'ביצועים לפי מכשיר מסחר' : 'Performance by instrument'}>
          <BySymbolChart trades={trades} />
        </ChartCard>
      )}
      {tab === 4 && (
        <ChartCard title={isHe ? 'מפת חום חודשית' : 'Monthly Heatmap'} subtitle={isHe ? 'P&L לפי חודש ושנה' : 'P&L by month and year'}>
          <MonthlyHeatmap trades={trades} lang={lang} />
        </ChartCard>
      )}
      {tab === 5 && (
        <ChartCard title={isHe ? 'התפלגות עסקאות' : 'Trade Distribution'} subtitle={isHe ? 'כמה עסקאות בכל טווח P&L' : 'How many trades in each P&L range'}>
          <DistributionChart trades={trades} />
        </ChartCard>
      )}
      {tab === 6 && (
        <ChartCard title="Risk / Reward" subtitle={isHe ? 'Stop Loss בנקודות מול P&L בפועל' : 'Stop Loss in pts vs actual P&L'}>
          <RRScatterChart trades={trades} />
        </ChartCard>
      )}
      {tab === 7 && (
        <ChartCard title={isHe ? 'ניתוח רצפים' : 'Streak Analysis'} subtitle={isHe ? 'רצפי זכיות והפסדים' : 'Consecutive wins and losses'}>
          <StreakChart trades={trades} lang={lang} />
        </ChartCard>
      )}
    </div>
  );
}
