import { describe, it, expect } from 'vitest';
import { calcBusinessStats } from './business';
import type { Account, Trade, PropExpense, PropPayout } from '../types';

// ─── Minimal factories ────────────────────────────────────────────────────────

function makeExpense(overrides: Partial<PropExpense> = {}): PropExpense {
  return {
    id: crypto.randomUUID(),
    prop_firm: 'TestFirm',
    account_size: 100_000,
    fee_type: 'challenge',
    amount: 500,
    date: '2026-04-15',
    ...overrides,
  };
}

function makePayout(overrides: Partial<PropPayout> = {}): PropPayout {
  return {
    id: crypto.randomUUID(),
    prop_firm: 'TestFirm',
    amount: 1000,
    date: '2026-04-15',
    ...overrides,
  };
}

function makePropAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: crypto.randomUUID(),
    name: 'Test Prop',
    account_type: 'prop_firm',
    broker: 'manual',
    initial_balance: 100_000,
    currency: 'USD',
    is_active: true,
    prop_phase: 'funded',
    prop_max_drawdown: 3000,
    prop_daily_limit: 1000,
    prop_profit_target: 6000,
    prop_drawdown_type: 'trailing',
    prop_start_date: '2026-01-01',
    ...overrides,
  };
}

const NO_ACCOUNTS: Account[] = [];
const NO_TRADES: Trade[] = [];

// ─── 1. Empty state ───────────────────────────────────────────────────────────

describe('empty state', () => {
  const s = calcBusinessStats([], [], [], []);

  it('totals are zero', () => {
    expect(s.totalExpenses).toBe(0);
    expect(s.totalPayouts).toBe(0);
    expect(s.netProfit).toBe(0);
  });

  it('gambling meter is 0 when nothing logged', () => {
    expect(s.gamblingMeterScore).toBe(0);
  });

  it('cpa is 0 when no expenses', () => {
    expect(s.cpa).toBe(0);
  });

  it('avgBurnDays is 0 with no accounts', () => {
    expect(s.avgBurnDays).toBe(0);
  });

  it('breakEvenProgress is 0 with no data', () => {
    expect(s.breakEvenProgress).toBe(0);
  });

  it('no alerts fired', () => {
    expect(s.tiltAlert).toBe(false);
    expect(s.payoutPending).toBe(false);
    expect(s.sizeOptimizationTip).toBeNull();
  });

  it('returns 12 months of data', () => {
    expect(s.monthly).toHaveLength(12);
  });
});

// ─── 2. KPI card values ───────────────────────────────────────────────────────

describe('KPI totals', () => {
  it('sums expenses correctly', () => {
    const expenses = [makeExpense({ amount: 500 }), makeExpense({ amount: 300 })];
    const s = calcBusinessStats([], [], expenses, []);
    expect(s.totalExpenses).toBe(800);
  });

  it('sums payouts correctly', () => {
    const payouts = [makePayout({ amount: 1200 }), makePayout({ amount: 800 })];
    const s = calcBusinessStats([], [], [], payouts);
    expect(s.totalPayouts).toBe(2000);
  });

  it('net profit = payouts - expenses', () => {
    const expenses = [makeExpense({ amount: 600 })];
    const payouts  = [makePayout({ amount: 1000 })];
    const s = calcBusinessStats([], [], expenses, payouts);
    expect(s.netProfit).toBe(400);
  });

  it('net profit is negative when expenses exceed payouts', () => {
    const expenses = [makeExpense({ amount: 800 })];
    const payouts  = [makePayout({ amount: 200 })];
    const s = calcBusinessStats([], [], expenses, payouts);
    expect(s.netProfit).toBe(-600);
  });
});

// ─── 3. Gambling meter ────────────────────────────────────────────────────────

describe('gamblingMeterScore', () => {
  it('is 0 when all spend, no payouts', () => {
    const s = calcBusinessStats([], [], [makeExpense({ amount: 1000 })], []);
    expect(s.gamblingMeterScore).toBe(0);
  });

  it('is 50 at break-even (payouts = expenses)', () => {
    const expenses = [makeExpense({ amount: 1000 })];
    const payouts  = [makePayout({ amount: 1000 })];
    const s = calcBusinessStats([], [], expenses, payouts);
    expect(s.gamblingMeterScore).toBe(50);
  });

  it('is 100 when payouts = 2x expenses', () => {
    const expenses = [makeExpense({ amount: 1000 })];
    const payouts  = [makePayout({ amount: 2000 })];
    const s = calcBusinessStats([], [], expenses, payouts);
    expect(s.gamblingMeterScore).toBe(100);
  });

  it('is capped at 100 when payouts > 2x expenses', () => {
    const expenses = [makeExpense({ amount: 1000 })];
    const payouts  = [makePayout({ amount: 5000 })];
    const s = calcBusinessStats([], [], expenses, payouts);
    expect(s.gamblingMeterScore).toBe(100);
  });

  it('is 100 when only payouts (no expenses)', () => {
    const s = calcBusinessStats([], [], [], [makePayout({ amount: 500 })]);
    expect(s.gamblingMeterScore).toBe(100);
  });

  it('is 25 at quarter return', () => {
    const expenses = [makeExpense({ amount: 1000 })];
    const payouts  = [makePayout({ amount: 500 })];
    const s = calcBusinessStats([], [], expenses, payouts);
    expect(s.gamblingMeterScore).toBe(25);
  });
});

// ─── 4. CPA (Cost Per Account) ───────────────────────────────────────────────

describe('CPA', () => {
  it('equals totalExpenses when no funded cycles yet', () => {
    const expenses = [makeExpense({ amount: 600 })];
    const s = calcBusinessStats([], [], expenses, []);
    expect(s.cpa).toBe(600);
  });

  it('divides by payout count when payouts present', () => {
    const expenses = [makeExpense({ amount: 600 }), makeExpense({ amount: 400 })];
    const payouts  = [makePayout(), makePayout()]; // 2 payouts
    const s = calcBusinessStats([], [], expenses, payouts);
    expect(s.cpa).toBe(500); // 1000 / 2
  });

  it('uses funded account count when greater than payouts', () => {
    const acc1 = makePropAccount({ prop_phase: 'funded' });
    const acc2 = makePropAccount({ prop_phase: 'funded' });
    const expenses = [makeExpense({ amount: 1200 })];
    // 2 funded accounts, 1 payout → denominator = max(2,1) = 2
    const s = calcBusinessStats([acc1, acc2], [], expenses, [makePayout({ amount: 100 })]);
    expect(s.cpa).toBe(600); // 1200 / 2
  });

  it('is 0 when no expenses and no payouts', () => {
    const s = calcBusinessStats([], [], [], []);
    expect(s.cpa).toBe(0);
  });
});

// ─── 5. Break-even progress ───────────────────────────────────────────────────

describe('breakEvenProgress', () => {
  const nowYM = new Date().toISOString().slice(0, 7);

  it('is 0 when no expenses this month', () => {
    const s = calcBusinessStats([], [], [], []);
    expect(s.breakEvenProgress).toBe(0);
  });

  it('is 50 when payouts cover half of expenses', () => {
    const e = makeExpense({ amount: 200, date: `${nowYM}-10` });
    const p = makePayout({ amount: 100, date: `${nowYM}-15` });
    const s = calcBusinessStats([], [], [e], [p]);
    expect(s.breakEvenProgress).toBe(50);
  });

  it('is 100 at break-even', () => {
    const e = makeExpense({ amount: 200, date: `${nowYM}-10` });
    const p = makePayout({ amount: 200, date: `${nowYM}-15` });
    const s = calcBusinessStats([], [], [e], [p]);
    expect(s.breakEvenProgress).toBe(100);
  });

  it('caps at 150 when payouts far exceed expenses', () => {
    const e = makeExpense({ amount: 100, date: `${nowYM}-01` });
    const p = makePayout({ amount: 1000, date: `${nowYM}-15` });
    const s = calcBusinessStats([], [], [e], [p]);
    expect(s.breakEvenProgress).toBe(150);
  });

  it('is 100 when only payouts this month (no expenses)', () => {
    const p = makePayout({ date: `${nowYM}-10` });
    const s = calcBusinessStats([], [], [], [p]);
    expect(s.breakEvenProgress).toBe(100);
  });

  it('ignores previous months when computing current-month progress', () => {
    const oldExpense = makeExpense({ amount: 9999, date: '2025-01-10' });
    const e = makeExpense({ amount: 200, date: `${nowYM}-10` });
    const p = makePayout({ amount: 200, date: `${nowYM}-15` });
    const s = calcBusinessStats([], [], [oldExpense, e], [p]);
    expect(s.breakEvenProgress).toBe(100);
  });
});

// ─── 6. Tilt alert ───────────────────────────────────────────────────────────

describe('tiltAlert', () => {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10);
  const oldDate = '2025-01-01';

  it('false with 0 recent evaluations', () => {
    const s = calcBusinessStats([], [], [], []);
    expect(s.tiltAlert).toBe(false);
  });

  it('false with only 1 recent evaluation', () => {
    const e = makeExpense({ fee_type: 'challenge', date: today });
    const s = calcBusinessStats([], [], [e], []);
    expect(s.tiltAlert).toBe(false);
  });

  it('true with 2 challenge expenses within 48h', () => {
    const e1 = makeExpense({ fee_type: 'challenge', date: today });
    const e2 = makeExpense({ fee_type: 'challenge', date: yesterday });
    const s = calcBusinessStats([], [], [e1, e2], []);
    expect(s.tiltAlert).toBe(true);
  });

  it('true with challenge + reset within 48h', () => {
    const e1 = makeExpense({ fee_type: 'challenge', date: today });
    const e2 = makeExpense({ fee_type: 'reset', date: today });
    const s = calcBusinessStats([], [], [e1, e2], []);
    expect(s.tiltAlert).toBe(true);
  });

  it('false when evaluations are older than 48h', () => {
    const e1 = makeExpense({ fee_type: 'challenge', date: oldDate });
    const e2 = makeExpense({ fee_type: 'challenge', date: oldDate });
    const s = calcBusinessStats([], [], [e1, e2], []);
    expect(s.tiltAlert).toBe(false);
  });

  it('data_fee type does not trigger tilt alert', () => {
    const e1 = makeExpense({ fee_type: 'data_fee', date: today });
    const e2 = makeExpense({ fee_type: 'data_fee', date: today });
    const s = calcBusinessStats([], [], [e1, e2], []);
    expect(s.tiltAlert).toBe(false);
  });
});

// ─── 7. Monthly snapshot ─────────────────────────────────────────────────────

describe('monthly snapshots', () => {
  it('always returns exactly 12 entries', () => {
    const s = calcBusinessStats([], [], [makeExpense()], [makePayout()]);
    expect(s.monthly).toHaveLength(12);
  });

  it('last entry is current month', () => {
    const nowYM = new Date().toISOString().slice(0, 7);
    const s = calcBusinessStats([], [], [], []);
    expect(s.monthly[11].month).toBe(nowYM);
  });

  it('correctly buckets expense into correct month', () => {
    const nowYM = new Date().toISOString().slice(0, 7);
    const e = makeExpense({ amount: 300, date: `${nowYM}-05` });
    const s = calcBusinessStats([], [], [e], []);
    const current = s.monthly[11];
    expect(current.expenses).toBe(300);
    expect(current.payouts).toBe(0);
    expect(current.net).toBe(-300);
  });

  it('correctly buckets payout into correct month', () => {
    const nowYM = new Date().toISOString().slice(0, 7);
    const p = makePayout({ amount: 1500, date: `${nowYM}-20` });
    const s = calcBusinessStats([], [], [], [p]);
    const current = s.monthly[11];
    expect(current.payouts).toBe(1500);
    expect(current.expenses).toBe(0);
    expect(current.net).toBe(1500);
  });
});

// ─── 8. Size optimization tip ────────────────────────────────────────────────

describe('sizeOptimizationTip', () => {
  it('is null with fewer than 2 size tiers', () => {
    const e = makeExpense({ account_size: 50_000, amount: 200 });
    const s = calcBusinessStats([], [], [e], []);
    expect(s.sizeOptimizationTip).toBeNull();
  });

  it('is null when two tiers have similar ROI', () => {
    const e1 = makeExpense({ account_size: 50_000, amount: 100 });
    const e2 = makeExpense({ account_size: 100_000, amount: 100 });
    const p1 = makePayout({ amount: 100 }); // rough 1:1 for both (unlinked)
    const s = calcBusinessStats([], [], [e1, e2], [p1]);
    // Without linked accounts, payouts don't attribute to size tiers
    // So both tiers have ROI=0 → no tip
    expect(s.sizeOptimizationTip).toBeNull();
  });

  it('returns a tip when one size tier has significantly better ROI via linked accounts', () => {
    const acc50k  = makePropAccount({ id: 'acc-50k',  initial_balance: 50_000 });
    const acc100k = makePropAccount({ id: 'acc-100k', initial_balance: 100_000 });
    const expenses = [
      makeExpense({ account_size: 50_000,  amount: 500 }),
      makeExpense({ account_size: 100_000, amount: 500 }),
    ];
    const payouts = [
      makePayout({ amount: 2000, account_id: 'acc-50k' }),  // 400% ROI on $50k
      makePayout({ amount: 50,   account_id: 'acc-100k' }), // 10% ROI on $100k
    ];
    const s = calcBusinessStats([acc50k, acc100k], [], expenses, payouts);
    expect(s.sizeOptimizationTip).not.toBeNull();
    expect(s.sizeOptimizationTip).toContain('$50k');
  });
});

// ─── 9. netProfit sign ────────────────────────────────────────────────────────

describe('netProfit sign', () => {
  it('is positive when profitable', () => {
    const s = calcBusinessStats([], [], [makeExpense({ amount: 200 })], [makePayout({ amount: 500 })]);
    expect(s.netProfit).toBeGreaterThan(0);
  });

  it('is negative when in the red', () => {
    const s = calcBusinessStats([], [], [makeExpense({ amount: 500 })], [makePayout({ amount: 200 })]);
    expect(s.netProfit).toBeLessThan(0);
  });

  it('is exactly zero at break-even', () => {
    const s = calcBusinessStats([], [], [makeExpense({ amount: 400 })], [makePayout({ amount: 400 })]);
    expect(s.netProfit).toBe(0);
  });
});
