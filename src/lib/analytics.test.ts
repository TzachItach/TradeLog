import { describe, it, expect } from 'vitest';
import {
  calcEquityPoints,
  calcDrawdownPoints,
  calcMaxDrawdown,
  calcByDay,
  calcBySymbol,
  calcHeatmapData,
  calcDistribution,
  calcStreaks,
  calcStrategyRows,
} from './analytics';
import type { Trade, Strategy } from '../types';

// ─── Factory ──────────────────────────────────────────────────────────────────

let _id = 0;
function makeTrade(overrides: Partial<Trade> = {}): Trade {
  return {
    id: `t-${++_id}`,
    account_id: 'acc-1',
    symbol: 'NQ',
    direction: 'long',
    trade_date: '2026-04-01',
    pnl: 100,
    confirmations: {},
    field_values: {},
    source: 'manual',
    ...overrides,
  };
}

function makeStrategy(overrides: Partial<Strategy> = {}): Strategy {
  return {
    id: `s-${++_id}`,
    name: 'Strat',
    color: '#1DB954',
    is_active: true,
    fields: [],
    ...overrides,
  };
}

// ─── 1. Equity Curve ─────────────────────────────────────────────────────────

describe('calcEquityPoints', () => {
  it('starts at 0 with no trades', () => {
    const pts = calcEquityPoints([]);
    expect(pts).toHaveLength(1);
    expect(pts[0].val).toBe(0);
  });

  it('accumulates P&L in chronological order', () => {
    const trades = [
      makeTrade({ trade_date: '2026-04-03', pnl: 300 }),
      makeTrade({ trade_date: '2026-04-01', pnl: 100 }),
      makeTrade({ trade_date: '2026-04-02', pnl: 200 }),
    ];
    const pts = calcEquityPoints(trades);
    expect(pts.map((p) => p.val)).toEqual([0, 100, 300, 600]);
  });

  it('handles negative P&L correctly', () => {
    const trades = [
      makeTrade({ trade_date: '2026-04-01', pnl: 500 }),
      makeTrade({ trade_date: '2026-04-02', pnl: -200 }),
    ];
    const pts = calcEquityPoints(trades);
    expect(pts[pts.length - 1].val).toBe(300);
  });

  it('returns N+1 points for N trades', () => {
    const trades = [1, 2, 3].map((i) => makeTrade({ trade_date: `2026-04-0${i}` }));
    expect(calcEquityPoints(trades)).toHaveLength(4);
  });
});

// ─── 2. Drawdown ──────────────────────────────────────────────────────────────

describe('calcDrawdownPoints', () => {
  it('starts at 0 with no trades', () => {
    expect(calcDrawdownPoints([])).toEqual([0]);
  });

  it('is 0 while equity rises', () => {
    const trades = [
      makeTrade({ trade_date: '2026-04-01', pnl: 100 }),
      makeTrade({ trade_date: '2026-04-02', pnl: 200 }),
    ];
    const pts = calcDrawdownPoints(trades);
    expect(pts.every((p) => p === 0)).toBe(true);
  });

  it('computes correct drawdown after a loss from peak', () => {
    const trades = [
      makeTrade({ trade_date: '2026-04-01', pnl: 1000 }),
      makeTrade({ trade_date: '2026-04-02', pnl: -200 }),
    ];
    const pts = calcDrawdownPoints(trades);
    // peak=1000, after loss: (800-1000)/1000 = -20%
    expect(pts[pts.length - 1]).toBeCloseTo(-20, 1);
  });

  it('returns 0 before any positive peak', () => {
    const trades = [makeTrade({ trade_date: '2026-04-01', pnl: -500 })];
    const pts = calcDrawdownPoints(trades);
    expect(pts[1]).toBe(0);
  });
});

describe('calcMaxDrawdown', () => {
  it('is 0 with no trades', () => {
    expect(calcMaxDrawdown([])).toBe(0);
  });

  it('is negative when there is a drawdown', () => {
    const trades = [
      makeTrade({ trade_date: '2026-04-01', pnl: 1000 }),
      makeTrade({ trade_date: '2026-04-02', pnl: -500 }),
    ];
    expect(calcMaxDrawdown(trades)).toBeLessThan(0);
  });

  it('picks the worst drawdown across multiple peaks', () => {
    const trades = [
      makeTrade({ trade_date: '2026-04-01', pnl: 1000 }),
      makeTrade({ trade_date: '2026-04-02', pnl: -100 }),  // -10%
      makeTrade({ trade_date: '2026-04-03', pnl: 500 }),   // new peak 1400
      makeTrade({ trade_date: '2026-04-04', pnl: -700 }),  // -50%
    ];
    const dd = calcMaxDrawdown(trades);
    expect(dd).toBeCloseTo(-50, 0);
  });
});

// ─── 3. P&L by Day of Week ────────────────────────────────────────────────────

describe('calcByDay', () => {
  it('returns 7 buckets', () => {
    expect(calcByDay([])).toHaveLength(7);
  });

  it('all counts are 0 with no trades', () => {
    const buckets = calcByDay([]);
    expect(buckets.every((b) => b.count === 0)).toBe(true);
  });

  it('places trade in correct day bucket', () => {
    // 2026-04-06 is a Monday (day index 1)
    const trade = makeTrade({ trade_date: '2026-04-06', pnl: 250 });
    const buckets = calcByDay([trade]);
    expect(buckets[1].pnl).toBe(250);
    expect(buckets[1].count).toBe(1);
  });

  it('accumulates multiple trades on same day', () => {
    const trades = [
      makeTrade({ trade_date: '2026-04-06', pnl: 100 }),
      makeTrade({ trade_date: '2026-04-06', pnl: 200 }),
    ];
    const buckets = calcByDay(trades);
    expect(buckets[1].pnl).toBe(300);
    expect(buckets[1].count).toBe(2);
  });

  it('sums correctly across different days', () => {
    // Monday + Tuesday
    const trades = [
      makeTrade({ trade_date: '2026-04-06', pnl: 100 }),  // Mon
      makeTrade({ trade_date: '2026-04-07', pnl: -50 }),  // Tue
    ];
    const buckets = calcByDay(trades);
    expect(buckets[1].pnl).toBe(100);
    expect(buckets[2].pnl).toBe(-50);
  });
});

// ─── 4. P&L by Symbol ────────────────────────────────────────────────────────

describe('calcBySymbol', () => {
  it('returns empty array with no trades', () => {
    expect(calcBySymbol([])).toEqual([]);
  });

  it('sums P&L per symbol', () => {
    const trades = [
      makeTrade({ symbol: 'NQ', pnl: 300 }),
      makeTrade({ symbol: 'NQ', pnl: 200 }),
      makeTrade({ symbol: 'ES', pnl: 100 }),
    ];
    const result = calcBySymbol(trades);
    const nq = result.find(([s]) => s === 'NQ');
    expect(nq?.[1]).toBe(500);
  });

  it('sorts by P&L descending', () => {
    const trades = [
      makeTrade({ symbol: 'CL', pnl: 100 }),
      makeTrade({ symbol: 'NQ', pnl: 500 }),
      makeTrade({ symbol: 'ES', pnl: 300 }),
    ];
    const result = calcBySymbol(trades);
    expect(result[0][0]).toBe('NQ');
    expect(result[1][0]).toBe('ES');
    expect(result[2][0]).toBe('CL');
  });

  it('caps at 10 symbols', () => {
    const trades = Array.from({ length: 15 }, (_, i) =>
      makeTrade({ symbol: `SYM${i}`, pnl: i }),
    );
    expect(calcBySymbol(trades)).toHaveLength(10);
  });
});

// ─── 5. Monthly Heatmap ───────────────────────────────────────────────────────

describe('calcHeatmapData', () => {
  it('returns empty object with no trades', () => {
    expect(calcHeatmapData([])).toEqual({});
  });

  it('groups trades by YYYY-MM key', () => {
    const trades = [
      makeTrade({ trade_date: '2026-04-10', pnl: 200 }),
      makeTrade({ trade_date: '2026-04-20', pnl: 100 }),
    ];
    const data = calcHeatmapData(trades);
    expect(data['2026-04']).toBe(300);
  });

  it('keeps different months separate', () => {
    const trades = [
      makeTrade({ trade_date: '2026-03-15', pnl: 500 }),
      makeTrade({ trade_date: '2026-04-10', pnl: 200 }),
    ];
    const data = calcHeatmapData(trades);
    expect(data['2026-03']).toBe(500);
    expect(data['2026-04']).toBe(200);
  });

  it('handles negative months correctly', () => {
    const trades = [
      makeTrade({ trade_date: '2026-04-01', pnl: -300 }),
      makeTrade({ trade_date: '2026-04-02', pnl: 100 }),
    ];
    const data = calcHeatmapData(trades);
    expect(data['2026-04']).toBe(-200);
  });
});

// ─── 6. Distribution Histogram ───────────────────────────────────────────────

describe('calcDistribution', () => {
  it('returns empty with no trades', () => {
    const { buckets, labels } = calcDistribution([]);
    expect(buckets).toHaveLength(0);
    expect(labels).toHaveLength(0);
  });

  it('all trades land in a bucket (total count = trade count)', () => {
    const trades = [100, -200, 350, -50, 500].map((pnl) => makeTrade({ pnl }));
    const { buckets } = calcDistribution(trades);
    expect(buckets.reduce((a, b) => a + b, 0)).toBe(trades.length);
  });

  it('single trade produces at least 1 non-empty bucket', () => {
    const { buckets } = calcDistribution([makeTrade({ pnl: 250 })]);
    expect(buckets.some((b) => b > 0)).toBe(true);
  });

  it('positive labels start with + and negative without', () => {
    const trades = [makeTrade({ pnl: 200 }), makeTrade({ pnl: -100 })];
    const { labels } = calcDistribution(trades);
    const posLabel = labels.find((l) => l.startsWith('+'));
    const negLabel = labels.find((l) => l.startsWith('-'));
    expect(posLabel).toBeDefined();
    expect(negLabel).toBeDefined();
  });

  it('buckets and labels have the same length', () => {
    const trades = [100, 200, -150, 400].map((pnl) => makeTrade({ pnl }));
    const { buckets, labels } = calcDistribution(trades);
    expect(buckets.length).toBe(labels.length);
  });
});

// ─── 7. Streak Analysis ──────────────────────────────────────────────────────

describe('calcStreaks', () => {
  it('returns zero longest streaks with no trades', () => {
    const { longestWin, longestLoss } = calcStreaks([]);
    expect(longestWin).toBe(0);
    expect(longestLoss).toBe(0);
  });

  it('counts a simple win streak', () => {
    const trades = [
      makeTrade({ trade_date: '2026-04-01', pnl: 100 }),
      makeTrade({ trade_date: '2026-04-02', pnl: 200 }),
      makeTrade({ trade_date: '2026-04-03', pnl: 300 }),
    ];
    const { longestWin } = calcStreaks(trades);
    expect(longestWin).toBe(3);
  });

  it('counts a simple loss streak', () => {
    const trades = [
      makeTrade({ trade_date: '2026-04-01', pnl: -100 }),
      makeTrade({ trade_date: '2026-04-02', pnl: -200 }),
    ];
    const { longestLoss } = calcStreaks(trades);
    expect(longestLoss).toBe(2);
  });

  it('resets streaks on opposite result', () => {
    const trades = [
      makeTrade({ trade_date: '2026-04-01', pnl: 100 }),
      makeTrade({ trade_date: '2026-04-02', pnl: 100 }),
      makeTrade({ trade_date: '2026-04-03', pnl: -50 }),  // reset
      makeTrade({ trade_date: '2026-04-04', pnl: 100 }),
    ];
    const { longestWin } = calcStreaks(trades);
    expect(longestWin).toBe(2);
  });

  it('break-even trade resets streaks', () => {
    const trades = [
      makeTrade({ trade_date: '2026-04-01', pnl: 100 }),
      makeTrade({ trade_date: '2026-04-02', pnl: 0 }),   // break-even
      makeTrade({ trade_date: '2026-04-03', pnl: 100 }),
    ];
    const { longestWin } = calcStreaks(trades);
    expect(longestWin).toBe(1);
  });

  it('records frequency of streak milestones', () => {
    // W,W,L,W — algorithm increments at each step:
    // trade1(W): ws[1]++ → {1:1}
    // trade2(W): ws[2]++ → {1:1, 2:1}
    // trade3(L): reset win streak
    // trade4(W): ws[1]++ → {1:2, 2:1}
    const trades = [
      makeTrade({ trade_date: '2026-04-01', pnl: 100 }),
      makeTrade({ trade_date: '2026-04-02', pnl: 100 }),
      makeTrade({ trade_date: '2026-04-03', pnl: -50 }),
      makeTrade({ trade_date: '2026-04-04', pnl: 100 }),
    ];
    const { winStreaks } = calcStreaks(trades);
    expect(winStreaks[2]).toBe(1); // length-2 milestone hit once
    expect(winStreaks[1]).toBe(2); // length-1 milestone hit twice (trade1 + trade4)
  });
});

// ─── 8. Strategy Comparison ───────────────────────────────────────────────────

describe('calcStrategyRows', () => {
  it('returns empty rows with no trades', () => {
    const { rows, allDates } = calcStrategyRows([], []);
    expect(rows).toHaveLength(0);
    expect(allDates).toHaveLength(0);
  });

  it('groups unassigned trades as "No strategy"', () => {
    const trades = [makeTrade({ pnl: 100, strategy_id: undefined })];
    const { rows } = calcStrategyRows(trades, []);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe('No strategy');
  });

  it('groups trades by strategy_id correctly', () => {
    const s1 = makeStrategy({ id: 's1', name: 'Breakout' });
    const s2 = makeStrategy({ id: 's2', name: 'Reversal' });
    const trades = [
      makeTrade({ strategy_id: 's1', pnl: 300 }),
      makeTrade({ strategy_id: 's2', pnl: 100 }),
      makeTrade({ strategy_id: 's2', pnl: 200 }),
    ];
    const { rows } = calcStrategyRows(trades, [s1, s2]);
    const breakout = rows.find((r) => r.name === 'Breakout');
    const reversal = rows.find((r) => r.name === 'Reversal');
    expect(breakout?.totalPnL).toBe(300);
    expect(reversal?.totalPnL).toBe(300);
  });

  it('calculates win rate correctly', () => {
    const s = makeStrategy({ id: 's1', name: 'Test' });
    const trades = [
      makeTrade({ strategy_id: 's1', pnl: 100 }),
      makeTrade({ strategy_id: 's1', pnl: -50 }),
      makeTrade({ strategy_id: 's1', pnl: 200 }),
    ];
    const { rows } = calcStrategyRows(trades, [s]);
    expect(rows[0].winRate).toBeCloseTo(66.67, 1);
  });

  it('sorts rows by totalPnL descending', () => {
    const s1 = makeStrategy({ id: 's1', name: 'Low' });
    const s2 = makeStrategy({ id: 's2', name: 'High' });
    const trades = [
      makeTrade({ strategy_id: 's1', pnl: 100 }),
      makeTrade({ strategy_id: 's2', pnl: 999 }),
    ];
    const { rows } = calcStrategyRows(trades, [s1, s2]);
    expect(rows[0].name).toBe('High');
  });

  it('caps profitFactor at 99 when no losses', () => {
    const s = makeStrategy({ id: 's1' });
    const trades = [makeTrade({ strategy_id: 's1', pnl: 500 })];
    const { rows } = calcStrategyRows(trades, [s]);
    expect(rows[0].profitFactor).toBe(99);
  });

  it('calculates profitFactor correctly with wins and losses', () => {
    const s = makeStrategy({ id: 's1' });
    const trades = [
      makeTrade({ strategy_id: 's1', pnl: 200 }),
      makeTrade({ strategy_id: 's1', pnl: 200 }),
      makeTrade({ strategy_id: 's1', pnl: -100 }),
    ];
    const { rows } = calcStrategyRows(trades, [s]);
    // avgWin=200, avgLoss=100, wins=2, losses=1 → PF = (200*2)/(100*1) = 4
    expect(rows[0].profitFactor).toBeCloseTo(4, 1);
  });

  it('builds cumulative equity points per strategy', () => {
    const s = makeStrategy({ id: 's1' });
    const trades = [
      makeTrade({ strategy_id: 's1', trade_date: '2026-04-01', pnl: 100 }),
      makeTrade({ strategy_id: 's1', trade_date: '2026-04-02', pnl: 200 }),
    ];
    const { rows } = calcStrategyRows(trades, [s]);
    expect(rows[0].pts).toEqual([100, 300]);
  });
});
