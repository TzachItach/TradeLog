import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { calcPropFirmStats } from '../lib/propfirm';
import type { Account } from '../types';

const fmt = (n: number) =>
  (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function MeterBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 8, background: 'var(--bd2)', borderRadius: 99, overflow: 'hidden', marginTop: 6 }}>
      <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, pct))}%`, background: color, borderRadius: 99, transition: 'width .4s ease' }} />
    </div>
  );
}

function StatusBadge({ status, isHe }: { status: string; isHe: boolean }) {
  const map: Record<string, { label: string; labelHe: string; color: string; bg: string }> = {
    safe:     { label: 'Safe',     labelHe: 'תקין',  color: 'var(--g)', bg: 'rgba(0,224,168,.1)' },
    warning:  { label: 'Warning',  labelHe: 'אזהרה', color: 'var(--o)', bg: 'rgba(255,170,68,.1)' },
    danger:   { label: 'Danger',   labelHe: 'סכנה',  color: 'var(--r)', bg: 'rgba(255,64,96,.1)' },
    breached: { label: 'Breached', labelHe: 'הופר',  color: 'var(--r)', bg: 'rgba(255,64,96,.15)' },
    passed:   { label: 'Passed!',  labelHe: 'עברת!', color: 'var(--g)', bg: 'rgba(0,224,168,.15)' },
  };
  const s = map[status] ?? map.safe;
  return (
    <span style={{ fontSize: '.74rem', fontWeight: 700, padding: '4px 12px', borderRadius: 99, color: s.color, background: s.bg, border: `1px solid ${s.color}44` }}>
      {isHe ? s.labelHe : s.label}
    </span>
  );
}

function AccountCard({ account, isHe }: { account: Account; isHe: boolean }) {
  const { trades } = useStore();
  const stats = useMemo(() => calcPropFirmStats(account, trades), [account, trades]);

  const isChallenge   = account.prop_phase === 'challenge';
  const hasDD         = (account.prop_max_drawdown ?? 0) > 0;
  const hasDailyLim   = (account.prop_daily_limit ?? 0) > 0;
  const hasTarget     = isChallenge && (account.prop_profit_target ?? 0) > 0;
  const hasMinDays    = isChallenge && (account.prop_min_days ?? 0) > 0;
  const hasMaxDays    = isChallenge && (account.prop_max_days ?? 0) > 0 && !!account.prop_start_date;

  const ddTypeLabel =
    account.prop_drawdown_type === 'static'            ? 'Static' :
    account.prop_drawdown_type === 'trailing_intraday' ? 'Trailing Intraday' : 'Trailing EOD';

  const phaseLabel = isChallenge ? (isHe ? 'מבחן' : 'Challenge') : (isHe ? 'ממומן' : 'Funded');

  const borderColor =
    stats.status === 'breached' || stats.status === 'danger' ? 'rgba(255,64,96,.5)' :
    stats.status === 'passed'   ? 'rgba(0,224,168,.5)' :
    stats.status === 'warning'  ? 'rgba(255,170,68,.4)' : 'var(--bd)';

  const todayColor = stats.todayPnL > 0 ? 'var(--g)' : stats.todayPnL < 0 ? 'var(--r)' : 'var(--t3)';

  return (
    <div style={{ background: 'var(--s2)', border: `1px solid ${borderColor}`, borderRadius: 14, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--t1)' }}>{account.name}</div>
          <div style={{ fontSize: '.74rem', color: 'var(--t3)', marginTop: 3 }}>
            {phaseLabel} · {ddTypeLabel} · {fmt(account.initial_balance)}
          </div>
        </div>
        <StatusBadge status={stats.status} isHe={isHe} />
      </div>

      {/* Key numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
        {[
          { label: isHe ? 'יתרה נוכחית' : 'Balance',     value: fmt(stats.currentBalance),                                    color: 'var(--t1)' },
          { label: isHe ? 'רצפה'         : 'Floor',        value: fmt(stats.trailingFloor),                                     color: 'var(--r)'  },
          ...(hasTarget ? [
            { label: isHe ? 'יעד'         : 'Target',       value: fmt(stats.profitTargetBalance),                               color: 'var(--g)'  },
            { label: isHe ? 'נותר ליעד'  : 'To Target',     value: stats.profitRemaining === 0 ? '✓' : fmt(stats.profitRemaining), color: stats.profitRemaining === 0 ? 'var(--g)' : 'var(--t1)' },
          ] : []),
          { label: isHe ? 'P&L היום'    : "Today's P&L",   value: stats.todayPnL === 0 ? '—' : fmt(stats.todayPnL),             color: todayColor },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: 'var(--s1)', borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: '.68rem', color: 'var(--t3)', marginBottom: 4 }}>{kpi.label}</div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Drawdown meter */}
      {hasDD && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '2px 8px' }}>
            <span style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--t1)' }}>
              {isHe ? 'Drawdown נותר' : 'Drawdown Remaining'}
            </span>
            <span style={{ fontSize: '.74rem', color: stats.drawdownPct >= 80 ? 'var(--r)' : 'var(--t3)' }}>
              {fmt(stats.drawdownRemaining)} / {fmt(account.prop_max_drawdown!)}
              &nbsp;·&nbsp;{(100 - stats.drawdownPct).toFixed(0)}% {isHe ? 'נשאר' : 'left'}
            </span>
          </div>
          <MeterBar pct={stats.drawdownPct} color={stats.drawdownPct >= 80 ? 'var(--r)' : stats.drawdownPct >= 50 ? 'var(--o)' : 'var(--b)'} />
          {account.prop_drawdown_type !== 'static' && (
            <div style={{ fontSize: '.68rem', color: 'var(--t3)', marginTop: 4 }}>
              Peak: {fmt(stats.highWaterMark)}
            </div>
          )}
        </div>
      )}

      {/* Daily limit meter */}
      {hasDailyLim && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '2px 8px' }}>
            <span style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--t1)' }}>
              {isHe ? 'גבול הפסד יומי' : 'Daily Loss Limit'}
            </span>
            <span style={{ fontSize: '.74rem', color: stats.dailyLimitPct >= 80 ? 'var(--r)' : 'var(--t3)' }}>
              {fmt(stats.dailyLimitRemaining)} {isHe ? 'נשאר' : 'left'} / {fmt(account.prop_daily_limit!)}
            </span>
          </div>
          <MeterBar pct={stats.dailyLimitPct} color={stats.dailyLimitPct >= 80 ? 'var(--r)' : stats.dailyLimitPct >= 50 ? 'var(--o)' : 'var(--g)'} />
        </div>
      )}

      {/* Profit target meter */}
      {hasTarget && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '2px 8px' }}>
            <span style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--t1)' }}>
              {isHe ? 'יעד רווח' : 'Profit Target'}
            </span>
            <span style={{ fontSize: '.74rem', color: stats.profitPct >= 100 ? 'var(--g)' : 'var(--t3)' }}>
              {fmt(stats.profitPnL)} / {fmt(account.prop_profit_target!)}
              &nbsp;·&nbsp;{stats.profitPct.toFixed(0)}%
            </span>
          </div>
          <MeterBar pct={stats.profitPct} color={stats.profitPct >= 100 ? 'var(--g)' : 'var(--b)'} />
        </div>
      )}

      {/* Days row */}
      {(hasMinDays || hasMaxDays) && (
        <div style={{ display: 'flex', gap: 24, paddingTop: 4, borderTop: '1px solid var(--bd)', flexWrap: 'wrap' }}>
          {hasMinDays && (
            <div>
              <div style={{ fontSize: '.68rem', color: 'var(--t3)', marginBottom: 2 }}>{isHe ? 'ימי מסחר' : 'Trading Days'}</div>
              <div style={{ fontSize: '.9rem', fontWeight: 700, color: stats.daysTraded >= (account.prop_min_days ?? 0) ? 'var(--g)' : 'var(--t1)' }}>
                {stats.daysTraded} / {account.prop_min_days}
                {stats.daysTraded >= (account.prop_min_days ?? 0) && <span style={{ fontSize: '.72rem', marginInlineStart: 5 }}>✓</span>}
              </div>
            </div>
          )}
          {hasMaxDays && (
            <div>
              <div style={{ fontSize: '.68rem', color: 'var(--t3)', marginBottom: 2 }}>{isHe ? 'ימים נותרים' : 'Days Remaining'}</div>
              <div style={{ fontSize: '.9rem', fontWeight: 700, color: stats.daysRemaining < 3 ? 'var(--r)' : 'var(--t1)' }}>
                {Math.max(0, stats.daysRemaining)}
                {stats.daysRemaining < 0 && <span style={{ fontSize: '.72rem', color: 'var(--r)', marginInlineStart: 5 }}>⚠ {isHe ? 'חרגת' : 'overdue'}</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alerts */}
      {stats.status === 'breached' && (
        <div style={{ background: 'rgba(255,64,96,.1)', border: '1px solid rgba(255,64,96,.4)', borderRadius: 8, padding: '12px 16px', fontSize: '.82rem', color: 'var(--r)', fontWeight: 600 }}>
          ⛔ {isHe ? 'החשבון הגיע ל-Drawdown — פנה לחברת ה-Prop לבדיקה' : 'Account has breached its drawdown limit — contact your Prop Firm'}
        </div>
      )}
      {stats.status === 'passed' && (
        <div style={{ background: 'rgba(0,224,168,.08)', border: '1px solid rgba(0,224,168,.4)', borderRadius: 8, padding: '12px 16px', fontSize: '.82rem', color: 'var(--g)', fontWeight: 600 }}>
          🎉 {isHe ? 'כל הכבוד — עברת את יעד ה-Challenge!' : 'Congratulations — you hit the Challenge profit target!'}
        </div>
      )}
    </div>
  );
}

export default function PropFirm() {
  const { accounts, lang } = useStore();
  const navigate = useNavigate();
  const isHe = lang === 'he';

  const propAccounts = accounts.filter((a) => a.account_type === 'prop_firm');

  return (
    <div id="tour-propfirm" className="page-content">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">{isHe ? 'Prop Firm Tracker' : 'Prop Firm Tracker'}</h1>
        {propAccounts.length > 0 && (
          <button className="btn btn-ghost" style={{ fontSize: '.8rem' }} onClick={() => navigate('/dashboard/settings')}>
            {isHe ? '⚙ ערוך חשבונות' : '⚙ Edit Accounts'}
          </button>
        )}
      </div>

      {propAccounts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--t3)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🛡</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--t2)', marginBottom: 8 }}>
            {isHe ? 'אין חשבונות Prop Firm' : 'No Prop Firm accounts yet'}
          </div>
          <div style={{ fontSize: '.84rem', marginBottom: 24 }}>
            {isHe ? 'הוסף חשבון מסוג Prop Firm בהגדרות כדי לעקוב אחר הביצועים שלך' : 'Add a Prop Firm account in Settings to start tracking your performance'}
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/dashboard/settings')}>
            {isHe ? '+ הוסף חשבון Prop Firm' : '+ Add Prop Firm Account'}
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {propAccounts.map((acc) => (
            <AccountCard key={acc.id} account={acc} isHe={isHe} />
          ))}
        </div>
      )}
    </div>
  );
}
