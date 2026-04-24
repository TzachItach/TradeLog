import type { Trade } from '../types';

export type InsightType = 'positive' | 'warning' | 'tip';

export interface Insight {
  type: InsightType;
  text_he: string;
  text_en: string;
}

const DAYS_HE = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function wr(wins: number, total: number) {
  return total === 0 ? 0 : wins / total;
}

function fmt(n: number) {
  const abs = Math.abs(n);
  const sign = n >= 0 ? '+' : '-';
  return `${sign}$${abs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function computeInsights(trades: Trade[]): Insight[] {
  if (trades.length < 5) return [];

  const insights: Insight[] = [];
  const sorted = [...trades].sort((a, b) => a.trade_date.localeCompare(b.trade_date));

  // ── 1. Best day of week ──
  const byDay: Record<number, { wins: number; total: number }> = {};
  for (const t of trades) {
    const d = new Date(t.trade_date).getDay();
    if (!byDay[d]) byDay[d] = { wins: 0, total: 0 };
    byDay[d].total++;
    if (t.pnl > 0) byDay[d].wins++;
  }
  let bestDay = -1, bestWR = 0;
  for (const [d, s] of Object.entries(byDay)) {
    if (s.total >= 3) {
      const w = wr(s.wins, s.total);
      if (w > bestWR) { bestWR = w; bestDay = Number(d); }
    }
  }
  if (bestDay >= 0 && bestWR >= 0.6) {
    const pct = Math.round(bestWR * 100);
    insights.push({
      type: 'positive',
      text_he: `יום ${DAYS_HE[bestDay]} הוא היום החזק ביותר שלך — ${pct}% אחוז ניצחון`,
      text_en: `${DAYS_EN[bestDay]} is your strongest day — ${pct}% win rate`,
    });
  }

  // ── 2. Worst day of week ──
  let worstDay = -1, worstWR = 1;
  for (const [d, s] of Object.entries(byDay)) {
    if (s.total >= 3) {
      const w = wr(s.wins, s.total);
      if (w < worstWR) { worstWR = w; worstDay = Number(d); }
    }
  }
  if (worstDay >= 0 && worstWR <= 0.4 && worstDay !== bestDay) {
    const pct = Math.round(worstWR * 100);
    insights.push({
      type: 'warning',
      text_he: `יום ${DAYS_HE[worstDay]} חלש — רק ${pct}% ניצחון. שקול להפחית פעילות`,
      text_en: `${DAYS_EN[worstDay]} is weak — only ${pct}% win rate. Consider reducing activity`,
    });
  }

  // ── 3. Best symbol ──
  const bySym: Record<string, { wins: number; total: number; pnl: number }> = {};
  for (const t of trades) {
    if (!bySym[t.symbol]) bySym[t.symbol] = { wins: 0, total: 0, pnl: 0 };
    bySym[t.symbol].total++;
    bySym[t.symbol].pnl += t.pnl;
    if (t.pnl > 0) bySym[t.symbol].wins++;
  }
  let bestSym = '', bestSymWR = 0;
  for (const [sym, s] of Object.entries(bySym)) {
    if (s.total >= 3) {
      const w = wr(s.wins, s.total);
      if (w > bestSymWR) { bestSymWR = w; bestSym = sym; }
    }
  }
  if (bestSym && bestSymWR >= 0.65) {
    const pct = Math.round(bestSymWR * 100);
    insights.push({
      type: 'positive',
      text_he: `${bestSym} הוא הסמל החזק ביותר שלך — ${pct}% ניצחון`,
      text_en: `${bestSym} is your strongest symbol — ${pct}% win rate`,
    });
  }

  // ── 4. Worst symbol ──
  let worstSym = '', worstSymWR = 1;
  for (const [sym, s] of Object.entries(bySym)) {
    if (s.total >= 3 && sym !== bestSym) {
      const w = wr(s.wins, s.total);
      if (w < worstSymWR) { worstSymWR = w; worstSym = sym; }
    }
  }
  if (worstSym && worstSymWR <= 0.4) {
    const pct = Math.round(worstSymWR * 100);
    insights.push({
      type: 'warning',
      text_he: `${worstSym} גורם להפסדים — ${pct}% ניצחון בלבד. שקול להימנע`,
      text_en: `${worstSym} is hurting you — only ${pct}% win rate. Consider avoiding it`,
    });
  }

  // ── 5. Current streak ──
  const recent = [...sorted].reverse().slice(0, 10);
  let streak = 0;
  const isWin = recent[0]?.pnl > 0;
  for (const t of recent) {
    if ((t.pnl > 0) === isWin) streak++;
    else break;
  }
  if (streak >= 3 && isWin) {
    insights.push({
      type: 'positive',
      text_he: `אתה ב-${streak} ניצחונות רצופים — שמור על המתודולוגיה`,
      text_en: `You're on a ${streak}-trade winning streak — keep it up`,
    });
  } else if (streak >= 2 && !isWin) {
    insights.push({
      type: 'warning',
      text_he: `${streak} הפסדים רצופים — שקול הפסקה קצרה לאיפוס`,
      text_en: `${streak} consecutive losses — consider a short break to reset`,
    });
  }

  // ── 6. Overtrading detection ──
  const tradesByDate: Record<string, number> = {};
  for (const t of trades) {
    tradesByDate[t.trade_date] = (tradesByDate[t.trade_date] ?? 0) + 1;
  }
  const overtradeDays = Object.values(tradesByDate).filter(n => n >= 6).length;
  if (overtradeDays >= 2) {
    insights.push({
      type: 'warning',
      text_he: `זוהו ${overtradeDays} ימי מסחר יתר (6+ עסקאות ביום) — פחות לרוב שווה יותר`,
      text_en: `${overtradeDays} overtrading days detected (6+ trades) — less is often more`,
    });
  }

  // ── 7. Win rate trend (last 10 vs prev 10) ──
  if (sorted.length >= 20) {
    const last10 = sorted.slice(-10);
    const prev10 = sorted.slice(-20, -10);
    const wrLast = last10.filter(t => t.pnl > 0).length / 10;
    const wrPrev = prev10.filter(t => t.pnl > 0).length / 10;
    const diff = wrLast - wrPrev;
    if (diff >= 0.2) {
      insights.push({
        type: 'positive',
        text_he: `אחוז הניצחון עלה ב-${Math.round(diff * 100)}% ב-10 העסקאות האחרונות — מגמה חיובית`,
        text_en: `Win rate up ${Math.round(diff * 100)}% over last 10 trades — positive trend`,
      });
    } else if (diff <= -0.2) {
      insights.push({
        type: 'warning',
        text_he: `אחוז הניצחון ירד ב-${Math.round(Math.abs(diff) * 100)}% ב-10 העסקאות האחרונות — כדאי לבדוק`,
        text_en: `Win rate dropped ${Math.round(Math.abs(diff) * 100)}% over last 10 trades — worth reviewing`,
      });
    }
  }

  // ── 8. RR tip ──
  const withRR = trades.filter(t => t.stop_loss_pts && t.take_profit_pts && t.stop_loss_pts > 0);
  if (withRR.length >= 5) {
    const avgRR = withRR.reduce((acc, t) => acc + (t.take_profit_pts! / t.stop_loss_pts!), 0) / withRR.length;
    if (avgRR < 1.0) {
      insights.push({
        type: 'tip',
        text_he: `יחס R:R ממוצע שלך הוא ${avgRR.toFixed(1)} — שיפור ל-1.5 ישפיע דרמטית על הרווחיות`,
        text_en: `Your avg R:R is ${avgRR.toFixed(1)} — improving to 1.5 would dramatically boost profitability`,
      });
    } else if (avgRR >= 2.0) {
      insights.push({
        type: 'positive',
        text_he: `יחס R:R ממוצע מצוין: ${avgRR.toFixed(1)} — יחס סיכון/תגמול בריא`,
        text_en: `Excellent avg R:R: ${avgRR.toFixed(1)} — healthy risk/reward ratio`,
      });
    }
  }

  // ── 9. P&L this week vs last week ──
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  const thisWeekPnl = trades.filter(t => new Date(t.trade_date) >= startOfWeek).reduce((s, t) => s + t.pnl, 0);
  const lastWeekPnl = trades.filter(t => new Date(t.trade_date) >= startOfLastWeek && new Date(t.trade_date) < startOfWeek).reduce((s, t) => s + t.pnl, 0);

  if (Math.abs(thisWeekPnl) > 50 && Math.abs(lastWeekPnl) > 50) {
    if (thisWeekPnl > lastWeekPnl * 1.5 && thisWeekPnl > 0) {
      insights.push({
        type: 'positive',
        text_he: `השבוע (${fmt(thisWeekPnl)}) חזק משמעותית מהשבוע שעבר (${fmt(lastWeekPnl)})`,
        text_en: `This week (${fmt(thisWeekPnl)}) is significantly better than last week (${fmt(lastWeekPnl)})`,
      });
    } else if (thisWeekPnl < 0 && lastWeekPnl > 0) {
      insights.push({
        type: 'warning',
        text_he: `מעבר שלילי: השבוע ${fmt(thisWeekPnl)} לעומת ${fmt(lastWeekPnl)} בשבוע שעבר`,
        text_en: `Negative shift: this week ${fmt(thisWeekPnl)} vs ${fmt(lastWeekPnl)} last week`,
      });
    }
  }

  return insights.slice(0, 5);
}

export function buildTradesSummary(trades: Trade[], lang: 'he' | 'en'): string {
  const last30 = [...trades]
    .sort((a, b) => b.trade_date.localeCompare(a.trade_date))
    .slice(0, 30);

  const totalPnl = last30.reduce((s, t) => s + t.pnl, 0);
  const wins = last30.filter(t => t.pnl > 0).length;
  const winRate = last30.length ? Math.round((wins / last30.length) * 100) : 0;
  const avgWin = wins > 0 ? last30.filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0) / wins : 0;
  const losses = last30.filter(t => t.pnl < 0).length;
  const avgLoss = losses > 0 ? Math.abs(last30.filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0) / losses) : 0;

  const symbols = [...new Set(last30.map(t => t.symbol))];
  const tradeLines = last30.slice(0, 15).map(t =>
    `${t.trade_date} ${t.symbol} ${t.direction} PnL:$${t.pnl}`
  ).join('\n');

  if (lang === 'he') {
    return `נתוני 30 העסקאות האחרונות של הטריידר:
- סה"כ P&L: $${totalPnl.toFixed(0)}
- אחוז ניצחון: ${winRate}%
- עסקאות: ${last30.length} (${wins} ניצחונות, ${losses} הפסדים)
- רווח ממוצע: $${avgWin.toFixed(0)} | הפסד ממוצע: $${avgLoss.toFixed(0)}
- סמלים: ${symbols.join(', ')}

15 עסקאות אחרונות:
${tradeLines}`;
  } else {
    return `Trader's last 30 trades summary:
- Total P&L: $${totalPnl.toFixed(0)}
- Win rate: ${winRate}%
- Trades: ${last30.length} (${wins} wins, ${losses} losses)
- Avg win: $${avgWin.toFixed(0)} | Avg loss: $${avgLoss.toFixed(0)}
- Symbols: ${symbols.join(', ')}

Last 15 trades:
${tradeLines}`;
  }
}
