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
  profitRemaining: number;     // $ still needed to hit target
  profitTargetBalance: number; // absolute balance that equals "passed"
  daysTraded: number;          // unique days with at least one trade
  daysSinceStart: number;      // calendar days since prop_start_date
  daysRemaining: number;       // max_days - daysSinceStart (negative = overdue)
  status: 'safe' | 'warning' | 'danger' | 'breached' | 'passed';
}

export function calcPropFirmStats(account: Account, trades: Trade[]): PropFirmStats {
  const {
    initial_balance: start,
    prop_drawdown_type: ddType = 'trailing_eod',
    prop_max_drawdown: maxDD = 0,
    prop_daily_limit: dailyLimit = 0,
    prop_profit_target: profitTarget = 0,
    prop_min_days: minDays = 0,
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

  // Replay day by day — stop as soon as the account is finalized (breach or pass).
  // Trades added after the finalization date are intentionally ignored so the card
  // reflects the state at the moment the challenge ended.
  let runningBalance = start;
  let highWaterMark = start;
  let daysTraded = 0;
  let finalizedDay: string | null = null;

  for (const day of sortedDays) {
    runningBalance += dailyMap[day];
    if (runningBalance > highWaterMark) highWaterMark = runningBalance;
    daysTraded++;

    const floor = ddType === 'static' ? start - maxDD : highWaterMark - maxDD;

    // Breach: balance hit or crossed the floor on this day
    if (maxDD > 0 && runningBalance <= floor) {
      finalizedDay = day;
      break;
    }

    // Pass: challenge profit target reached with minimum days met
    const pnlSoFar = runningBalance - start;
    const minDaysMetSoFar = !minDays || daysTraded >= minDays;
    if (account.prop_phase === 'challenge' && profitTarget > 0 && pnlSoFar >= profitTarget && minDaysMetSoFar) {
      finalizedDay = day;
      break;
    }
  }

  const currentBalance = runningBalance;
  const totalPnL = currentBalance - start;

  // trailing_eod / trailing_intraday: floor follows high water mark of daily closes
  // static: floor is fixed from starting balance, never moves
  const trailingFloor =
    ddType === 'static'
      ? start - maxDD
      : highWaterMark - maxDD;

  const drawdownRemaining = currentBalance - trailingFloor;
  const drawdownUsed = Math.max(0, maxDD - drawdownRemaining);
  const drawdownPct = maxDD > 0 ? Math.min(100, (drawdownUsed / maxDD) * 100) : 0;

  // Today's P&L — zero if the account was finalized before today
  const today = new Date().toISOString().slice(0, 10);
  const todayPnL = finalizedDay && finalizedDay < today ? 0 : (dailyMap[today] ?? 0);

  // Daily limit: only counts when today is a losing day
  const dailyLossToday = todayPnL < 0 ? Math.abs(todayPnL) : 0;
  const dailyLimitUsed = dailyLimit > 0 ? Math.min(dailyLossToday, dailyLimit) : 0;
  const dailyLimitRemaining = dailyLimit > 0 ? Math.max(0, dailyLimit - dailyLossToday) : 0;
  const dailyLimitPct = dailyLimit > 0 ? Math.min(100, (dailyLossToday / dailyLimit) * 100) : 0;

  // Profit progress
  const profitPnL = totalPnL;
  const profitPct = profitTarget > 0 ? Math.min(100, (profitPnL / profitTarget) * 100) : 0;
  const profitRemaining = profitTarget > 0 ? Math.max(0, profitTarget - profitPnL) : 0;
  const profitTargetBalance = start + profitTarget;

  // Days
  let daysSinceStart = 0;
  let daysRemaining = 0;
  if (startDate) {
    const start_ms = new Date(startDate).getTime();
    const now_ms = new Date().getTime();
    daysSinceStart = Math.floor((now_ms - start_ms) / 86_400_000);
    daysRemaining = maxDays > 0 ? maxDays - daysSinceStart : 0;
  }

  // Status
  const minDaysMet = !minDays || daysTraded >= minDays;
  let status: PropFirmStats['status'] = 'safe';
  if (currentBalance <= trailingFloor) {
    status = 'breached';
  } else if (
    account.prop_phase === 'challenge' &&
    profitTarget > 0 &&
    profitPnL >= profitTarget &&
    minDaysMet
  ) {
    status = 'passed';
  } else if (drawdownPct >= 80 || dailyLimitPct >= 80) {
    status = 'danger';
  } else if (drawdownPct >= 50 || dailyLimitPct >= 50) {
    status = 'warning';
  }
  // Overdue: past max days deadline but neither breached nor passed
  if (maxDays > 0 && daysRemaining < 0 && (status === 'safe' || status === 'warning')) {
    status = 'danger';
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
    profitRemaining,
    profitTargetBalance,
    daysTraded,
    daysSinceStart,
    daysRemaining,
    status,
  };
}
