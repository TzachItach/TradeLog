import type { Account, Trade, PropExpense, PropPayout } from '../types';
import { calcPropFirmStats } from './propfirm';

// ─── Output interfaces ────────────────────────────────────────────────────────

export interface MonthlySnapshot {
  month: string;   // "YYYY-MM"
  label: string;   // "Jan 25"
  expenses: number;
  payouts: number;
  net: number;
}

export interface SizeROI {
  size: number;
  label: string;   // "$50k", "$100k", etc.
  expenses: number;
  payouts: number;
  roi: number;     // payouts / expenses, 0 if no expenses
}

export interface BusinessStats {
  // Totals
  totalExpenses: number;
  totalPayouts: number;
  netProfit: number;

  // CPA — total spent to produce one funded account
  fundedAccountCount: number;
  cpa: number;

  // Burn rate — avg calendar days per account before breach/end
  avgBurnDays: number;

  // Break-even for current month
  currentMonthExpenses: number;
  currentMonthPayouts: number;
  breakEvenProgress: number;   // 0-100+, how much of monthly spend is covered

  // "Business vs Gambling" meter
  // Score 0-100: 0 = pure gambling (all spend, no payouts), 100 = pure business
  gamblingMeterScore: number;

  // Monthly chart data (last 12 months)
  monthly: MonthlySnapshot[];

  // ROI by account size (for size optimization insight)
  sizeROI: SizeROI[];

  // Smart insight flags
  tiltAlert: boolean;       // ≥2 evaluations logged in last 48 hours
  payoutPending: boolean;   // at least one funded account is active (not breached)
  sizeOptimizationTip: string | null;  // null = no suggestion
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m, 10) - 1]} ${y.slice(2)}`;
}

function fmtSize(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n}`;
}

// ─── Main calculation ─────────────────────────────────────────────────────────

export function calcBusinessStats(
  accounts: Account[],
  trades: Trade[],
  expenses: PropExpense[],
  payouts: PropPayout[],
): BusinessStats {
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalPayouts  = payouts.reduce((s, p) => s + p.amount, 0);
  const netProfit     = totalPayouts - totalExpenses;

  // ── CPA ──────────────────────────────────────────────────────────────────
  const fundedAccounts = accounts.filter(
    (a) => a.account_type === 'prop_firm' && a.prop_phase === 'funded',
  );
  const fundedAccountCount = fundedAccounts.length;
  // Count funded accounts that were "achieved" — either currently funded or previously passed
  // We estimate "passed challenges" by looking at payout entries (each payout = one funded cycle)
  const payoutCycles = payouts.length;
  const totalFundedCycles = Math.max(fundedAccountCount, payoutCycles);
  const cpa = totalFundedCycles > 0 ? totalExpenses / totalFundedCycles : totalExpenses;

  // ── Burn rate ─────────────────────────────────────────────────────────────
  // Lifespan = prop_start_date → last trade date on that account (not today).
  const propAccounts = accounts.filter((a) => a.account_type === 'prop_firm');
  const breachedLifespans: number[] = [];
  for (const acc of propAccounts) {
    const stats = calcPropFirmStats(acc, trades);
    if (stats.status === 'breached' && acc.prop_start_date) {
      const accTrades = trades.filter((t) => t.account_id === acc.id);
      if (accTrades.length === 0) continue;
      const lastTradeDate = accTrades.reduce((max, t) => (t.trade_date > max ? t.trade_date : max), '');
      const lifespanDays = Math.max(0, Math.floor(
        (new Date(lastTradeDate).getTime() - new Date(acc.prop_start_date).getTime()) / 86_400_000,
      ));
      breachedLifespans.push(lifespanDays);
    }
  }
  const avgBurnDays = breachedLifespans.length > 0
    ? Math.round(breachedLifespans.reduce((s, d) => s + d, 0) / breachedLifespans.length)
    : 0;

  // ── Current month break-even ───────────────────────────────────────────────
  const nowYM = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const currentMonthExpenses = expenses
    .filter((e) => e.date.startsWith(nowYM))
    .reduce((s, e) => s + e.amount, 0);
  const currentMonthPayouts = payouts
    .filter((p) => p.date.startsWith(nowYM))
    .reduce((s, p) => s + p.amount, 0);
  const breakEvenProgress = currentMonthExpenses > 0
    ? Math.min(150, (currentMonthPayouts / currentMonthExpenses) * 100)
    : currentMonthPayouts > 0 ? 100 : 0;

  // ── Business vs Gambling meter ─────────────────────────────────────────────
  // 0 = pure gambler (spent money, earned nothing)
  // 50 = break-even
  // 100 = pure business (payouts dominate)
  let gamblingMeterScore = 0;
  if (totalExpenses === 0 && totalPayouts === 0) {
    gamblingMeterScore = 0;
  } else if (totalExpenses === 0) {
    gamblingMeterScore = 100;
  } else {
    const ratio = totalPayouts / totalExpenses; // 0 = all spent, 1 = break-even, 2 = 2× return
    // Map: 0→0, 1→50, 2→100 (cap at 100)
    gamblingMeterScore = Math.min(100, Math.round((ratio / 2) * 100));
  }

  // ── Monthly data (last 12 months) ─────────────────────────────────────────
  const monthly: MonthlySnapshot[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const ym = d.toISOString().slice(0, 7);
    const me = expenses.filter((e) => e.date.startsWith(ym)).reduce((s, e) => s + e.amount, 0);
    const mp = payouts.filter((p) => p.date.startsWith(ym)).reduce((s, p) => s + p.amount, 0);
    monthly.push({ month: ym, label: monthLabel(ym), expenses: me, payouts: mp, net: mp - me });
  }

  // ── Size ROI ───────────────────────────────────────────────────────────────
  const sizeMap = new Map<number, { expenses: number; payouts: number }>();
  for (const e of expenses) {
    const key = e.account_size;
    const cur = sizeMap.get(key) ?? { expenses: 0, payouts: 0 };
    sizeMap.set(key, { ...cur, expenses: cur.expenses + e.amount });
  }
  // Payouts: attribute to the account's initial_balance size when linked
  for (const p of payouts) {
    if (p.account_id) {
      const acc = accounts.find((a) => a.id === p.account_id);
      if (acc) {
        const key = acc.initial_balance;
        const cur = sizeMap.get(key) ?? { expenses: 0, payouts: 0 };
        sizeMap.set(key, { ...cur, payouts: cur.payouts + p.amount });
      }
    }
  }
  const sizeROI: SizeROI[] = Array.from(sizeMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([size, { expenses: se, payouts: sp }]) => ({
      size,
      label: fmtSize(size),
      expenses: se,
      payouts: sp,
      roi: se > 0 ? sp / se : 0,
    }));

  // ── Smart insight flags ────────────────────────────────────────────────────
  // Tilt alert: ≥2 challenge/reset expenses logged in last 48 hours
  const now48 = Date.now() - 48 * 60 * 60 * 1000;
  const recentEvals = expenses.filter(
    (e) =>
      (e.fee_type === 'challenge' || e.fee_type === 'reset') &&
      new Date(e.date).getTime() >= now48,
  );
  const tiltAlert = recentEvals.length >= 2;

  // Payout pending: at least one funded account is safe/warning (active, not breached)
  const payoutPending = propAccounts.some((a) => {
    if (a.prop_phase !== 'funded') return false;
    const s = calcPropFirmStats(a, trades);
    return s.status !== 'breached';
  });

  // Size optimization tip: find the size tier with best ROI (if ≥2 tiers with expenses)
  let sizeOptimizationTip: string | null = null;
  const tiersWithData = sizeROI.filter((t) => t.expenses > 0);
  if (tiersWithData.length >= 2) {
    const best  = tiersWithData.reduce((a, b) => (b.roi > a.roi ? b : a));
    const worst = tiersWithData.reduce((a, b) => (b.roi < a.roi ? b : a));
    if (best.size !== worst.size && best.roi > worst.roi * 1.3) {
      sizeOptimizationTip = `${best.label} accounts show ${(best.roi * 100).toFixed(0)}% ROI vs ${(worst.roi * 100).toFixed(0)}% on ${worst.label}. Consider concentrating on ${best.label} accounts.`;
    }
  }

  return {
    totalExpenses, totalPayouts, netProfit,
    fundedAccountCount, cpa,
    avgBurnDays,
    currentMonthExpenses, currentMonthPayouts, breakEvenProgress,
    gamblingMeterScore,
    monthly,
    sizeROI,
    tiltAlert,
    payoutPending,
    sizeOptimizationTip,
  };
}
