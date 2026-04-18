import { useMemo } from 'react';
import { useStore } from '../store';
import { calcPropFirmStats } from '../lib/propfirm';
import type { Account } from '../types';

const fmt = (n: number) =>
  (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

function MeterBar({ pct, status }: { pct: number; status: string }) {
  const color =
    status === 'breached' ? 'var(--r)' :
    status === 'danger'   ? 'var(--r)' :
    status === 'warning'  ? 'var(--o)' :
    status === 'passed'   ? 'var(--g)' :
    'var(--b)';

  const fill = Math.min(100, Math.max(0, pct));

  return (
    <div style={{ height: 6, background: 'var(--bd2)', borderRadius: 99, overflow: 'hidden', marginTop: 4 }}>
      <div style={{
        height: '100%',
        width: `${fill}%`,
        background: color,
        borderRadius: 99,
        transition: 'width .4s ease',
      }} />
    </div>
  );
}

function StatusBadge({ status, isHe }: { status: string; isHe: boolean }) {
  const map: Record<string, { label: string; labelHe: string; color: string; bg: string }> = {
    safe:     { label: 'Safe',     labelHe: 'תקין',     color: 'var(--g)', bg: 'rgba(0,224,168,.1)' },
    warning:  { label: 'Warning',  labelHe: 'אזהרה',   color: 'var(--o)', bg: 'rgba(255,170,68,.1)' },
    danger:   { label: 'Danger',   labelHe: 'סכנה',    color: 'var(--r)', bg: 'rgba(255,64,96,.1)' },
    breached: { label: 'Breached', labelHe: 'הופר',    color: 'var(--r)', bg: 'rgba(255,64,96,.15)' },
    passed:   { label: 'Passed!',  labelHe: 'עברת!',   color: 'var(--g)', bg: 'rgba(0,224,168,.15)' },
  };
  const s = map[status] ?? map.safe;
  return (
    <span style={{
      fontSize: '.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99,
      color: s.color, background: s.bg, border: `1px solid ${s.color}44`,
    }}>
      {isHe ? s.labelHe : s.label}
    </span>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <span style={{ fontSize: '.78rem', color: 'var(--t2)' }}>{label}</span>
      <span style={{ fontSize: '.84rem', fontWeight: 600, color: 'var(--t1)' }}>
        {value}
        {sub && <span style={{ fontSize: '.7rem', color: 'var(--t3)', marginInlineStart: 4 }}>{sub}</span>}
      </span>
    </div>
  );
}

function SingleAccountCard({ account, isHe }: { account: Account; isHe: boolean }) {
  const { trades } = useStore();
  const stats = useMemo(() => calcPropFirmStats(account, trades), [account, trades]);

  const isChallenge = account.prop_phase === 'challenge';
  const hasTarget   = isChallenge && (account.prop_profit_target ?? 0) > 0;
  const hasDailyLim = (account.prop_daily_limit ?? 0) > 0;
  const hasMaxDays  = isChallenge && (account.prop_max_days ?? 0) > 0;
  const hasMinDays  = isChallenge && (account.prop_min_days ?? 0) > 0;

  const ddTypeLabel = account.prop_drawdown_type === 'static'
    ? (isHe ? 'סטטי' : 'Static')
    : (isHe ? 'עוקב' : 'Trailing');

  const phaseLabel = isChallenge
    ? (isHe ? 'מבחן' : 'Challenge')
    : (isHe ? 'ממומן' : 'Funded');

  const todayColor = stats.todayPnL > 0 ? 'var(--g)' : stats.todayPnL < 0 ? 'var(--r)' : 'var(--t2)';

  return (
    <div style={{
      background: 'var(--s2)',
      border: `1px solid ${stats.status === 'breached' || stats.status === 'danger' ? 'rgba(255,64,96,.4)' : stats.status === 'passed' ? 'rgba(0,224,168,.4)' : 'var(--bd)'}`,
      borderRadius: 12,
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--t1)' }}>{account.name}</div>
          <div style={{ fontSize: '.72rem', color: 'var(--t3)', marginTop: 2 }}>
            {phaseLabel} · {ddTypeLabel} DD · {fmt(account.initial_balance)}
          </div>
        </div>
        <StatusBadge status={stats.status} isHe={isHe} />
      </div>

      {/* Balance row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: '.7rem', color: 'var(--t3)', marginBottom: 2 }}>{isHe ? 'יתרה נוכחית' : 'Current Balance'}</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--t1)' }}>{fmt(stats.currentBalance)}</div>
        </div>
        <div style={{ flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: '.7rem', color: 'var(--t3)', marginBottom: 2 }}>{isHe ? 'רצפה' : 'Floor'}</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--r)' }}>{fmt(stats.trailingFloor)}</div>
        </div>
        <div style={{ flex: 1, minWidth: 100 }}>
          <div style={{ fontSize: '.7rem', color: 'var(--t3)', marginBottom: 2 }}>{isHe ? 'היום' : "Today's P&L"}</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, color: todayColor }}>
            {stats.todayPnL === 0 ? '—' : fmt(stats.todayPnL)}
          </div>
        </div>
      </div>

      {/* Drawdown meter */}
      {(account.prop_max_drawdown ?? 0) > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: '.74rem', color: 'var(--t2)', fontWeight: 600 }}>
              {isHe ? 'Drawdown נותר' : 'Drawdown Remaining'}
            </span>
            <span style={{ fontSize: '.74rem', color: stats.drawdownPct >= 80 ? 'var(--r)' : 'var(--t3)' }}>
              {fmt(stats.drawdownRemaining)} / {fmt(account.prop_max_drawdown!)}
              {' '}({(100 - stats.drawdownPct).toFixed(0)}% {isHe ? 'נשאר' : 'left'})
            </span>
          </div>
          <MeterBar pct={stats.drawdownPct} status={stats.status} />
          {account.prop_drawdown_type === 'trailing' && (
            <div style={{ fontSize: '.68rem', color: 'var(--t3)', marginTop: 3 }}>
              {isHe ? `Peak: ${fmt(stats.highWaterMark)}` : `Peak: ${fmt(stats.highWaterMark)}`}
            </div>
          )}
        </div>
      )}

      {/* Daily limit meter */}
      {hasDailyLim && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: '.74rem', color: 'var(--t2)', fontWeight: 600 }}>
              {isHe ? 'גבול הפסד יומי' : 'Daily Loss Limit'}
            </span>
            <span style={{ fontSize: '.74rem', color: stats.dailyLimitPct >= 80 ? 'var(--r)' : 'var(--t3)' }}>
              {fmt(stats.dailyLimitRemaining)} {isHe ? 'נשאר' : 'left'} / {fmt(account.prop_daily_limit!)}
            </span>
          </div>
          <MeterBar pct={stats.dailyLimitPct} status={stats.dailyLimitPct >= 80 ? 'danger' : stats.dailyLimitPct >= 50 ? 'warning' : 'safe'} />
        </div>
      )}

      {/* Profit target meter (challenge) */}
      {hasTarget && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
            <span style={{ fontSize: '.74rem', color: 'var(--t2)', fontWeight: 600 }}>
              {isHe ? 'יעד רווח' : 'Profit Target'}
            </span>
            <span style={{ fontSize: '.74rem', color: stats.profitPct >= 100 ? 'var(--g)' : 'var(--t3)' }}>
              {fmt(stats.profitPnL)} / {fmt(account.prop_profit_target!)}
              {' '}({stats.profitPct.toFixed(0)}%)
            </span>
          </div>
          <MeterBar pct={stats.profitPct} status={stats.profitPct >= 100 ? 'passed' : 'safe'} />
        </div>
      )}

      {/* Days row */}
      {(hasMinDays || hasMaxDays) && (
        <div style={{ display: 'flex', gap: 16, paddingTop: 4, borderTop: '1px solid var(--bd)' }}>
          {hasMinDays && (
            <Row
              label={isHe ? 'ימי מסחר' : 'Trading Days'}
              value={`${stats.daysTraded} / ${account.prop_min_days}`}
              sub={stats.daysTraded >= (account.prop_min_days ?? 0) ? (isHe ? '✓ הושג' : '✓ met') : (isHe ? 'נדרש' : 'required')}
            />
          )}
          {hasMaxDays && account.prop_start_date && (
            <Row
              label={isHe ? 'ימים נותרים' : 'Days Remaining'}
              value={`${Math.max(0, stats.daysRemaining)}`}
              sub={stats.daysRemaining < 0 ? (isHe ? '⚠ חרגת' : '⚠ overdue') : undefined}
            />
          )}
        </div>
      )}

      {/* Breach alert */}
      {stats.status === 'breached' && (
        <div style={{ background: 'rgba(255,64,96,.12)', border: '1px solid rgba(255,64,96,.4)', borderRadius: 8, padding: '10px 14px', fontSize: '.8rem', color: 'var(--r)', fontWeight: 600 }}>
          {isHe
            ? '⛔ החשבון הגיע ל-Drawdown — פנה לחברת ה-Prop לבדיקה'
            : '⛔ Account has breached its drawdown limit — contact your Prop Firm'}
        </div>
      )}

      {stats.status === 'passed' && (
        <div style={{ background: 'rgba(0,224,168,.1)', border: '1px solid rgba(0,224,168,.4)', borderRadius: 8, padding: '10px 14px', fontSize: '.8rem', color: 'var(--g)', fontWeight: 600 }}>
          {isHe ? '🎉 כל הכבוד — עברת את יעד ה-Challenge!' : '🎉 Congratulations — you hit the Challenge profit target!'}
        </div>
      )}
    </div>
  );
}

export default function PropFirmCard() {
  const { accounts, lang } = useStore();
  const isHe = lang === 'he';

  const propAccounts = accounts.filter((a) => a.account_type === 'prop_firm');
  if (propAccounts.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        {isHe ? 'חשבונות Prop Firm' : 'Prop Firm Accounts'}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
        {propAccounts.map((acc) => (
          <SingleAccountCard key={acc.id} account={acc} isHe={isHe} />
        ))}
      </div>
    </div>
  );
}
