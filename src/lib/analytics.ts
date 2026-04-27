import type { Trade, Strategy } from '../types';

// ─── 1. Equity Curve ──────────────────────────────────────────────────────────

export function calcEquityPoints(trades: Trade[]): { date: string; val: number }[] {
  const sorted = [...trades].sort((a, b) => a.trade_date.localeCompare(b.trade_date));
  let cum = 0;
  const pts: { date: string; val: number }[] = [{ date: '', val: 0 }];
  sorted.forEach((t) => { cum += t.pnl; pts.push({ date: t.trade_date, val: cum }); });
  return pts;
}

// ─── 2. Drawdown ─────────────────────────────────────────────────────────────

export function calcDrawdownPoints(trades: Trade[]): number[] {
  const sorted = [...trades].sort((a, b) => a.trade_date.localeCompare(b.trade_date));
  let cum = 0, peak = 0;
  const pts: number[] = [0];
  sorted.forEach((t) => {
    cum += t.pnl;
    if (cum > peak) peak = cum;
    pts.push(peak > 0 ? ((cum - peak) / peak) * 100 : 0);
  });
  return pts;
}

// maxDrawdown: minimum value in the points array (most negative %)
export function calcMaxDrawdown(trades: Trade[]): number {
  return Math.min(...calcDrawdownPoints(trades));
}

// ─── 3. P&L by Day of Week ───────────────────────────────────────────────────

export interface DayBucket { pnl: number; count: number }

export function calcByDay(trades: Trade[]): DayBucket[] {
  const sums = Array(7).fill(0) as number[];
  const counts = Array(7).fill(0) as number[];
  trades.forEach((t) => {
    const d = new Date(t.trade_date + 'T12:00:00').getDay();
    sums[d] += t.pnl;
    counts[d]++;
  });
  return sums.map((pnl, i) => ({ pnl, count: counts[i] }));
}

// ─── 4. P&L by Symbol ────────────────────────────────────────────────────────

export function calcBySymbol(trades: Trade[]): [string, number][] {
  const map: Record<string, number> = {};
  trades.forEach((t) => { map[t.symbol] = (map[t.symbol] || 0) + t.pnl; });
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
}

// ─── 5. Monthly Heatmap ───────────────────────────────────────────────────────

export function calcHeatmapData(trades: Trade[]): Record<string, number> {
  const map: Record<string, number> = {};
  trades.forEach((t) => {
    const [y, m] = t.trade_date.split('-');
    const key = `${y}-${m}`;
    map[key] = (map[key] || 0) + t.pnl;
  });
  return map;
}

// ─── 6. Distribution Histogram ───────────────────────────────────────────────

export interface Distribution { buckets: number[]; labels: string[] }

export function calcDistribution(trades: Trade[]): Distribution {
  if (!trades.length) return { buckets: [], labels: [] };
  const pnls = trades.map((t) => t.pnl);
  const min = Math.min(...pnls), max = Math.max(...pnls);
  const step = Math.ceil((max - min) / 10 / 100) * 100 || 100;
  const start = Math.floor(min / step) * step;
  const buckets: number[] = [];
  const labels: string[] = [];
  const fmtLbl = (v: number) => Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v);
  for (let v = start; v <= max + step; v += step) {
    buckets.push(0);
    labels.push(v >= 0 ? `+${fmtLbl(v)}` : fmtLbl(v));
  }
  pnls.forEach((p) => {
    const idx = Math.min(Math.floor((p - start) / step), buckets.length - 1);
    if (idx >= 0) buckets[idx]++;
  });
  return { buckets, labels };
}

// ─── 7. Streak Analysis ──────────────────────────────────────────────────────

export interface StreakResult {
  winStreaks:  Record<number, number>;
  lossStreaks: Record<number, number>;
  longestWin:  number;
  longestLoss: number;
}

export function calcStreaks(trades: Trade[]): StreakResult {
  const sorted = [...trades].sort((a, b) => a.trade_date.localeCompare(b.trade_date));
  const ws: Record<number, number> = {};
  const ls: Record<number, number> = {};
  let curW = 0, curL = 0, maxW = 0, maxL = 0;
  sorted.forEach((t) => {
    if (t.pnl > 0) {
      curW++; curL = 0;
      ws[curW] = (ws[curW] || 0) + 1;
      if (curW > maxW) maxW = curW;
    } else if (t.pnl < 0) {
      curL++; curW = 0;
      ls[curL] = (ls[curL] || 0) + 1;
      if (curL > maxL) maxL = curL;
    } else {
      curW = 0; curL = 0;
    }
  });
  return { winStreaks: ws, lossStreaks: ls, longestWin: maxW, longestLoss: maxL };
}

// ─── 8. Strategy Comparison ───────────────────────────────────────────────────

const STRAT_PALETTE = ['#5b8fff','#1DB954','#F59B23','#a855f7','#06b6d4','#ec4899','#f97316','#14b8a6'];

export interface StratRow {
  id: string; name: string; color: string;
  tradeCount: number; winRate: number; totalPnL: number; avgPnL: number; profitFactor: number;
  pts: number[];
}

export function calcStrategyRows(
  trades: Trade[],
  strategies: Strategy[],
): { rows: StratRow[]; allDates: string[] } {
  const allDates = [...new Set(trades.map((t) => t.trade_date))].sort();
  const noKey = '__none__';
  type Group = { id: string; name: string; color: string; dateMap: Record<string, number>; all: Trade[] };
  const map = new Map<string, Group>();
  strategies.forEach((s, i) => {
    map.set(s.id, { id: s.id, name: s.name, color: s.color || STRAT_PALETTE[i % STRAT_PALETTE.length], dateMap: {}, all: [] });
  });
  map.set(noKey, { id: noKey, name: 'No strategy', color: '#737373', dateMap: {}, all: [] });
  trades.forEach((t) => {
    const key = (t.strategy_id && map.has(t.strategy_id)) ? t.strategy_id : noKey;
    const g = map.get(key)!;
    g.dateMap[t.trade_date] = (g.dateMap[t.trade_date] || 0) + t.pnl;
    g.all.push(t);
  });
  const rows: StratRow[] = Array.from(map.values())
    .filter((g) => g.all.length > 0)
    .map((g) => {
      const wins   = g.all.filter((t) => t.pnl > 0);
      const losses = g.all.filter((t) => t.pnl < 0);
      const totalPnL = g.all.reduce((s, t) => s + t.pnl, 0);
      const avgWin   = wins.length   ? wins.reduce((s, t)   => s + t.pnl, 0) / wins.length   : 0;
      const avgLoss  = losses.length ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;
      const pf = avgLoss > 0
        ? (avgWin * wins.length) / (avgLoss * losses.length)
        : (wins.length > 0 ? 99 : 0);
      let cum = 0;
      const pts = allDates.map((d) => { cum += g.dateMap[d] || 0; return cum; });
      return {
        id: g.id, name: g.name, color: g.color,
        tradeCount: g.all.length,
        winRate: g.all.length ? (wins.length / g.all.length) * 100 : 0,
        totalPnL,
        avgPnL: totalPnL / (g.all.length || 1),
        profitFactor: Math.min(pf, 99),
        pts,
      };
    })
    .sort((a, b) => b.totalPnL - a.totalPnL);
  return { rows, allDates };
}
