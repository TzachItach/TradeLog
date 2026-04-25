import { useStore, formatPnL } from '../store';
import { useT } from '../i18n';

export default function DailyGoalBar() {
  const { lang, dailyGoalTarget, dailyMaxLoss, getFilteredTrades } = useStore();
  const T = useT(lang);
  const isHe = lang === 'he';

  const today = new Date().toISOString().split('T')[0];
  const todayPnL = getFilteredTrades()
    .filter((t) => t.trade_date === today)
    .reduce((s, t) => s + t.pnl, 0);

  if (!dailyGoalTarget && !dailyMaxLoss) return null;

  const isGoalSet = dailyGoalTarget > 0;
  const isLossSet = dailyMaxLoss > 0;
  const goalReached = isGoalSet && todayPnL >= dailyGoalTarget;
  const maxLossHit = isLossSet && todayPnL <= -dailyMaxLoss;

  const goalPct = isGoalSet
    ? Math.min(100, Math.max(0, (todayPnL / dailyGoalTarget) * 100))
    : 0;
  const lossPct = isLossSet
    ? Math.min(100, Math.max(0, (-todayPnL / dailyMaxLoss) * 100))
    : 0;

  const pnlColor = todayPnL > 0 ? 'var(--g)' : todayPnL < 0 ? 'var(--r)' : 'var(--t2)';

  return (
    <div id="tour-daily-goal" className="daily-goal-bar" style={{ direction: isHe ? 'rtl' : 'ltr' }}>
      {/* Today P&L */}
      <div className="dg-today">
        <span className="dg-label">{T.todayPnL}</span>
        <span className="dg-pnl" style={{ color: pnlColor }}>{formatPnL(todayPnL)}</span>
        {goalReached && <span className="dg-badge dg-badge-goal">{T.goalReached}</span>}
        {maxLossHit && <span className="dg-badge dg-badge-loss">{T.maxLossHit}</span>}
      </div>

      {/* Progress bars */}
      <div className="dg-bars">
        {isGoalSet && (
          <div className="dg-bar-row">
            <span className="dg-bar-label">
              {isHe ? 'יעד' : 'Target'} {formatPnL(dailyGoalTarget)}
            </span>
            <div className="dg-bar-track">
              <div
                className="dg-bar-fill dg-bar-fill-goal"
                style={{ width: `${goalPct}%`, opacity: goalReached ? 1 : 0.85 }}
              />
            </div>
            <span className="dg-bar-pct" style={{ color: goalReached ? 'var(--g)' : 'var(--t3)' }}>
              {Math.round(goalPct)}%
            </span>
          </div>
        )}

        {isLossSet && (
          <div className="dg-bar-row">
            <span className="dg-bar-label">
              {isHe ? 'גבול' : 'Limit'} {formatPnL(-dailyMaxLoss)}
            </span>
            <div className="dg-bar-track">
              <div
                className="dg-bar-fill dg-bar-fill-loss"
                style={{ width: `${lossPct}%`, opacity: maxLossHit ? 1 : 0.85 }}
              />
            </div>
            <span className="dg-bar-pct" style={{ color: maxLossHit ? 'var(--r)' : 'var(--t3)' }}>
              {Math.round(lossPct)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
