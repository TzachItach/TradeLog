import type { Account, Trade } from '../types';

export interface PropFirmStats {
  currentBalance: number;
  totalPnL: number;
  highWaterMark: number;       // highest balance achieved (for trailing)
  trailingFloor: number;       // the lowest balance can go before breach
  drawdownUsed: number;        // $ amount of drawdown consumed
  drawdownRemaining: number;   // $ left before breach
  drawdownPct: number;         // 0–100, how much of max DD is consumed
  todayPnL: number;
  dailyLimitUsed: number;      // $ of daily limit consumed (only when negative day)
  dailyLimitRemaining: number; // $ left in daily limit today
  dailyLimitPct: number;       // 0–100
  profitPnL: number;           // total P&L toward profit target
  profitPct: number;           // 0–100+ progress toward profit target
  daysTraded: number;          // unique days with at least one trade
  daysSinceStart: number;      // calendar days since prop_start_date
  daysRemaining: number;       // max_days - daysSinceStart (negative = overdue)
  status: 'safe' | 'warning' | 'danger' | 'breached' | 'passed';
}

export function calcPropFirmStats(account: Account, trades: Trade[]): PropFirmStats {
  const {
    initial_balance: start,
    prop_drawdown_type: ddType = 'trailing',
    prop_max_drawdown: maxDD = 0,
    prop_daily_limit: dailyLimit = 0,
    prop_profit_target: profitTarget = 0,
    prop_max_days: maxDays = 0,
    prop_start_date: startDate,
  } = account;

  // Filter only this account's trades, sorted oldest → newest
  const accountTrades = trades
    .filter((t) => t.account_id === account.id)
    .sort((a, b) => a.trade_date.localeCompare(b.trade_date));

  // Group by date → daily P&L (end-of-day settlement assumption)
  const dailyMap: Record<string, number> = {};
  for (const t of accountTrades) {
    dailyMap[t.trade_date] = (dailyMap[t.trade_date] ?? 0) + t.pnl;
  }
  const sortedDays = Object.keys(dailyMap).sort();

  // Build running balance and find high water mark
  let runningBalance = start;
  let highWaterMark = start;

  for (const day of sortedDays) {
    runningBalance += dailyMap[day];
    if (runningBalance > highWaterMark) highWaterMark = runningBalance;
  }

  const currentBalance = runningBalance;
  const totalPnL = currentBalance - start;

  // Trailing floor follows high water mark; static floor is fixed from start
  const trailingFloor =
    ddType === 'trailing'
      ? highWaterMark - maxDD
      : start - maxDD;

  const drawdownRemaining = currentBalance - trailingFloor;
  const drawdownUsed = Math.max(0, maxDD - drawdownRemaining);
  const drawdownPct = maxDD > 0 ? Math.min(100, (drawdownUsed / maxDD) * 100) : 0;

  // Today's P&L
  const today = new Date().toISOString().slice(0, 10);
  const todayPnL = dailyMap[today] ?? 0;

  // Daily limit: only counts when today is a losing day
  const dailyLossToday = todayPnL < 0 ? Math.abs(todayPnL) : 0;
  const dailyLimitUsed = dailyLimit > 0 ? Math.min(dailyLossToday, dailyLimit) : 0;
  const dailyLimitRemaining = dailyLimit > 0 ? Math.max(0, dailyLimit - dailyLossToday) : 0;
  const dailyLimitPct = dailyLimit > 0 ? Math.min(100, (dailyLossToday / dailyLimit) * 100) : 0;

  // Profit progress
  const profitPnL = totalPnL;
  const profitPct = profitTarget > 0 ? Math.min(100, (profitPnL / profitTarget) * 100) : 0;

  // Days
  const daysTraded = sortedDays.length;
  let daysSinceStart = 0;
  let daysRemaining = 0;
  if (startDate) {
    const start_ms = new Date(startDate).getTime();
    const now_ms = new Date().getTime();
    daysSinceStart = Math.floor((now_ms - start_ms) / 86_400_000);
    daysRemaining = maxDays > 0 ? maxDays - daysSinceStart : 0;
  }

  // Status
  let status: PropFirmStats['status'] = 'safe';
  if (currentBalance <= trailingFloor) {
    status = 'breached';
  } else if (
    account.prop_phase === 'challenge' &&
    profitTarget > 0 &&
    profitPnL >= profitTarget
  ) {
    status = 'passed';
  } else if (drawdownPct >= 80 || dailyLimitPct >= 80) {
    status = 'danger';
  } else if (drawdownPct >= 50 || dailyLimitPct >= 50) {
    status = 'warning';
  }

  return {
    currentBalance,
    totalPnL,
    highWaterMark,
    trailingFloor,
    drawdownUsed,
    drawdownRemaining,
    drawdownPct,
    todayPnL,
    dailyLimitUsed,
    dailyLimitRemaining,
    dailyLimitPct,
    profitPnL,
    profitPct,
    daysTraded,
    daysSinceStart,
    daysRemaining,
    status,
  };
}
