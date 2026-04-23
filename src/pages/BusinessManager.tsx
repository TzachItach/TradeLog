import { useMemo, useRef, useEffect, useState } from 'react';
import { useStore } from '../store';
import { calcBusinessStats } from '../lib/business';
import type { MonthlySnapshot } from '../lib/business';
import type { PropExpense, PropPayout, ExpenseFeeType } from '../types';

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  (n < 0 ? '-$' : '$') + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const fmtPos = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// ─── Sub-components ───────────────────────────────────────────────────────────

function MeterBar({ pct, color, height = 8 }: { pct: number; color: string; height?: number }) {
  return (
    <div style={{ height, background: 'var(--bd2)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, pct))}%`, background: color, borderRadius: 99, transition: 'width .5s ease' }} />
    </div>
  );
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ fontSize: '.7rem', color: 'var(--t3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.04em' }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: color ?? 'var(--t1)', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: '.72rem', color: 'var(--t3)', marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

// ─── Business vs Gambling Meter ───────────────────────────────────────────────

function GamblingMeter({ score, isHe }: { score: number; isHe: boolean }) {
  const labels = isHe
    ? { left: 'הימור', right: 'עסק', title: 'מדד עסקי' }
    : { left: 'Gambling', right: 'Business', title: 'Business Meter' };

  const markerColor =
    score >= 60 ? 'var(--g)' :
    score >= 35 ? 'var(--o)' : 'var(--r)';

  const statusText =
    score >= 70 ? (isHe ? 'אתה מנהל עסק!' : 'You\'re running a business!') :
    score >= 45 ? (isHe ? 'מתקרב לאיזון' : 'Approaching break-even') :
    (isHe ? 'ההוצאות עולות על ההכנסות' : 'Expenses exceed revenue');

  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 14, padding: '22px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--t1)' }}>{labels.title}</span>
        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: markerColor }}>{score}%</span>
      </div>

      {/* Gradient track */}
      <div style={{ position: 'relative', height: 20, borderRadius: 99, background: 'linear-gradient(to right, #E91429, #F59B23 50%, #1DB954)', marginBottom: 8 }}>
        {/* Needle */}
        <div style={{
          position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)',
          left: `${score}%`,
          width: 16, height: 16, borderRadius: '50%',
          background: '#fff', border: `3px solid ${markerColor}`,
          boxShadow: '0 2px 8px rgba(0,0,0,.4)',
          transition: 'left .6s cubic-bezier(.4,0,.2,1)',
        }} />
      </div>

      <div dir="ltr" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: 'var(--t3)', marginBottom: 12 }}>
        <span>⬅ {labels.left}</span>
        <span>{labels.right} ➡</span>
      </div>

      <div style={{ fontSize: '.82rem', fontWeight: 600, color: markerColor, textAlign: 'center' }}>
        {statusText}
      </div>
    </div>
  );
}

// ─── Monthly Bar Chart (Canvas) ───────────────────────────────────────────────

function MonthlyChart({ monthly, isHe, hasAnyData }: {
  monthly: MonthlySnapshot[];
  isHe: boolean;
  hasAnyData: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let rafId: number;

    const draw = () => {
      const { width: W, height: H } = canvas.getBoundingClientRect();
      if (W === 0 || H === 0) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      canvas.width = W * devicePixelRatio;
      canvas.height = H * devicePixelRatio;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(devicePixelRatio, devicePixelRatio);

      const isDark = document.body.classList.contains('dark');
      const textColor = isDark ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.45)';
      const GREEN = '#1DB954';
      const RED = '#E91429';

      const pT = 20, pB = 32, pL = 52, pR = 16;
      const chartW = W - pL - pR;
      const chartH = H - pT - pB;

      if (!hasAnyData) {
        ctx.fillStyle = textColor;
        ctx.font = `13px system-ui`;
        ctx.textAlign = 'center';
        ctx.fillText(isHe ? 'הוסף הוצאה או משיכה כדי לראות גרף' : 'Add an expense or payout to see the chart', W / 2, H / 2);
        return;
      }

      const realMax = Math.max(...monthly.flatMap((x) => [x.expenses, x.payouts]), 1);
      const n = monthly.length;
      const groupW = chartW / n;
      const barW = Math.max(4, Math.min(14, groupW * 0.32));
      const gap = 3;
      const labelStep = Math.ceil((n * 38) / chartW);

      ctx.strokeStyle = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = pT + (chartH / 4) * i;
        ctx.beginPath(); ctx.moveTo(pL, y); ctx.lineTo(W - pR, y); ctx.stroke();
        const val = realMax * (1 - i / 4);
        ctx.fillStyle = textColor;
        ctx.font = `10px system-ui`;
        ctx.textAlign = 'right';
        ctx.fillText(val >= 1000 ? `$${(val / 1000).toFixed(val >= 10000 ? 0 : 1)}k` : `$${Math.round(val)}`, pL - 4, y + 4);
      }

      monthly.forEach((snap, i) => {
        const cx = pL + groupW * i + groupW / 2;
        const expH = Math.max(0, (snap.expenses / realMax) * chartH);
        const payH = Math.max(0, (snap.payouts / realMax) * chartH);

        if (expH > 0) {
          ctx.fillStyle = RED;
          ctx.beginPath();
          ctx.roundRect(cx - barW - gap / 2, pT + chartH - expH, barW, expH, [3, 3, 0, 0]);
          ctx.fill();
        }
        if (payH > 0) {
          ctx.fillStyle = GREEN;
          ctx.beginPath();
          ctx.roundRect(cx + gap / 2, pT + chartH - payH, barW, payH, [3, 3, 0, 0]);
          ctx.fill();
        }

        if (i % labelStep === 0) {
          ctx.fillStyle = textColor;
          ctx.font = `10px system-ui`;
          ctx.textAlign = 'center';
          ctx.fillText(snap.label, cx, H - pB + 14);
        }
      });
    };

    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    rafId = requestAnimationFrame(draw);
    return () => { ro.disconnect(); cancelAnimationFrame(rafId); };
  }, [monthly, isHe, hasAnyData]);

  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 14, padding: '22px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--t1)' }}>
          {isHe ? 'הכנסות מול הוצאות' : 'Revenue vs Expenses'}
        </span>
        <div style={{ display: 'flex', gap: 14, marginInlineStart: 'auto' }}>
          <span style={{ fontSize: '.72rem', color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#E91429', display: 'inline-block' }} />
            {isHe ? 'הוצאות' : 'Expenses'}
          </span>
          <span style={{ fontSize: '.72rem', color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#1DB954', display: 'inline-block' }} />
            {isHe ? 'משיכות' : 'Payouts'}
          </span>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: 180, display: 'block' }} />
    </div>
  );
}

// ─── Smart Insights ───────────────────────────────────────────────────────────

function InsightsPanel({ stats, isHe }: { stats: ReturnType<typeof calcBusinessStats>; isHe: boolean }) {
  const insights: { icon: string; color: string; bg: string; border: string; title: string; body: string }[] = [];

  if (stats.tiltAlert) {
    insights.push({
      icon: '🔥',
      color: 'var(--r)',
      bg: 'rgba(233,20,41,.08)',
      border: 'rgba(233,20,41,.3)',
      title: isHe ? 'התראת Tilt — קול-דאון מומלץ' : 'Tilt Alert — Cool-down Suggested',
      body: isHe
        ? 'רכשת יותר מ-2 הערכות בתוך 48 שעות. עצור, סקור את הביצועים ושקול המתנה לפני הרכישה הבאה.'
        : 'You bought 2+ evaluations in the last 48 hours. Pause, review your performance, and consider waiting before your next purchase.',
    });
  }

  if (stats.payoutPending) {
    insights.push({
      icon: '🛡',
      color: 'var(--b)',
      bg: 'rgba(29,185,84,.08)',
      border: 'rgba(29,185,84,.3)',
      title: isHe ? 'מצב סיכון נמוך — יש משיכה ממתינה' : 'Low-Risk Mode — Payout Pending',
      body: isHe
        ? 'חשבון ממומן פעיל זוהה. הגן על ההון שלך — הימנע מסיכונים גבוהים ושמור על ה-drawdown לצורך משיכת הרווח.'
        : 'An active funded account detected. Protect your capital — avoid elevated risk and preserve drawdown to secure your payout.',
    });
  }

  if (stats.sizeOptimizationTip) {
    insights.push({
      icon: '📊',
      color: 'var(--o)',
      bg: 'rgba(245,155,35,.08)',
      border: 'rgba(245,155,35,.3)',
      title: isHe ? 'אופטימיזציה של גודל החשבון' : 'Account Size Optimization',
      body: stats.sizeOptimizationTip,
    });
  }

  if (stats.breakEvenProgress < 50 && stats.currentMonthExpenses > 0) {
    const needed = stats.currentMonthExpenses - stats.currentMonthPayouts;
    insights.push({
      icon: '💡',
      color: 'var(--t2)',
      bg: 'var(--s1)',
      border: 'var(--bd2)',
      title: isHe ? 'יעד Break-Even החודש' : 'Monthly Break-Even Target',
      body: isHe
        ? `נדרש ${fmt(needed)} נוסף כדי לכסות את הוצאות החודש. זה יעד הרווח המינימלי שלך.`
        : `You need ${fmt(needed)} more to cover this month's expenses. That's your minimum profit target.`,
    });
  }

  if (insights.length === 0) {
    return (
      <div style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 14, padding: '22px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>✅</div>
        <div style={{ fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>
          {isHe ? 'הכל בסדר' : 'All Clear'}
        </div>
        <div style={{ fontSize: '.8rem', color: 'var(--t3)' }}>
          {isHe ? 'אין התראות פעילות כרגע' : 'No active alerts at the moment'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {insights.map((ins, i) => (
        <div key={i} style={{ background: ins.bg, border: `1px solid ${ins.border}`, borderRadius: 12, padding: '16px 18px', display: 'flex', gap: 14 }}>
          <span style={{ fontSize: '1.3rem', flexShrink: 0, marginTop: 1 }}>{ins.icon}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '.85rem', color: ins.color, marginBottom: 4 }}>{ins.title}</div>
            <div style={{ fontSize: '.8rem', color: 'var(--t2)', lineHeight: 1.5 }}>{ins.body}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Entry Form Modal ─────────────────────────────────────────────────────────

interface ExpenseFormData {
  prop_firm: string; account_size: string; fee_type: ExpenseFeeType; amount: string; date: string; notes: string;
}
interface PayoutFormData {
  prop_firm: string; amount: string; date: string; notes: string;
}

function EntryModal({
  mode, editExpense, editPayout, onClose, isHe, accounts,
}: {
  mode: 'expense' | 'payout';
  editExpense?: PropExpense;
  editPayout?: PropPayout;
  onClose: () => void;
  isHe: boolean;
  accounts: { id: string; name: string }[];
}) {
  const { addExpense, updateExpense, addPayout, updatePayout } = useStore();
  const today = new Date().toISOString().slice(0, 10);

  const [ef, setEf] = useState<ExpenseFormData>({
    prop_firm: editExpense?.prop_firm ?? '',
    account_size: editExpense?.account_size ? String(editExpense.account_size) : '',
    fee_type: editExpense?.fee_type ?? 'challenge',
    amount: editExpense?.amount ? String(editExpense.amount) : '',
    date: editExpense?.date ?? today,
    notes: editExpense?.notes ?? '',
  });
  const [pf, setPf] = useState<PayoutFormData>({
    prop_firm: editPayout?.prop_firm ?? '',
    amount: editPayout?.amount ? String(editPayout.amount) : '',
    date: editPayout?.date ?? today,
    notes: editPayout?.notes ?? '',
  });

  const feeTypeLabels: Record<ExpenseFeeType, string> = {
    challenge: isHe ? 'חיוב אתגר' : 'Challenge Fee',
    reset: isHe ? 'איפוס' : 'Reset',
    activation: isHe ? 'הפעלה' : 'Activation',
    data_fee: isHe ? 'עמלת נתונים' : 'Data Fee',
    other: isHe ? 'אחר' : 'Other',
  };

  const handleSave = () => {
    if (mode === 'expense') {
      const amount = parseFloat(ef.amount);
      const account_size = parseFloat(ef.account_size) || 0;
      if (!ef.prop_firm || !ef.amount || isNaN(amount)) return;
      const entry: PropExpense = {
        id: editExpense?.id ?? crypto.randomUUID(),
        prop_firm: ef.prop_firm.trim(),
        account_size,
        fee_type: ef.fee_type,
        amount,
        date: ef.date,
        notes: ef.notes || undefined,
      };
      editExpense ? updateExpense(entry) : addExpense(entry);
    } else {
      const amount = parseFloat(pf.amount);
      if (!pf.prop_firm || !pf.amount || isNaN(amount)) return;
      const entry: PropPayout = {
        id: editPayout?.id ?? crypto.randomUUID(),
        prop_firm: pf.prop_firm.trim(),
        amount,
        date: pf.date,
        notes: pf.notes || undefined,
      };
      editPayout ? updatePayout(entry) : addPayout(entry);
    }
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 44, padding: '0 12px', borderRadius: 8,
    border: '1px solid var(--bd2)', background: 'var(--s1)', color: 'var(--t1)',
    fontSize: '.88rem', boxSizing: 'border-box', appearance: 'none',
  };
  const labelStyle: React.CSSProperties = { fontSize: '.75rem', color: 'var(--t3)', marginBottom: 4, display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16, boxSizing: 'border-box' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--s2)', borderRadius: 16, padding: '28px 24px', width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,.5)', boxSizing: 'border-box', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto' }}>
        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--t1)', marginBottom: 20 }}>
          {mode === 'expense'
            ? (editExpense ? (isHe ? 'ערוך הוצאה' : 'Edit Expense') : (isHe ? '+ הוצאה חדשה' : '+ New Expense'))
            : (editPayout ? (isHe ? 'ערוך משיכה' : 'Edit Payout') : (isHe ? '+ משיכה חדשה' : '+ New Payout'))}
        </div>

        {mode === 'expense' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>{isHe ? 'חברת Prop Firm' : 'Prop Firm'}</label>
              <input style={inputStyle} value={ef.prop_firm} onChange={(e) => setEf({ ...ef, prop_firm: e.target.value })} placeholder="TopstepX, Apex..." />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>{isHe ? 'גודל חשבון ($)' : 'Account Size ($)'}</label>
                <input style={inputStyle} type="number" value={ef.account_size} onChange={(e) => setEf({ ...ef, account_size: e.target.value })} placeholder="100000" />
              </div>
              <div>
                <label style={labelStyle}>{isHe ? 'סכום ($)' : 'Amount ($)'}</label>
                <input style={inputStyle} type="number" value={ef.amount} onChange={(e) => setEf({ ...ef, amount: e.target.value })} placeholder="165" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>{isHe ? 'סוג עמלה' : 'Fee Type'}</label>
              <select style={inputStyle} value={ef.fee_type} onChange={(e) => setEf({ ...ef, fee_type: e.target.value as ExpenseFeeType })}>
                {(Object.keys(feeTypeLabels) as ExpenseFeeType[]).map((k) => (
                  <option key={k} value={k}>{feeTypeLabels[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{isHe ? 'תאריך' : 'Date'}</label>
              <input style={inputStyle} type="date" value={ef.date} onChange={(e) => setEf({ ...ef, date: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>{isHe ? 'הערות' : 'Notes'}</label>
              <input style={inputStyle} value={ef.notes} onChange={(e) => setEf({ ...ef, notes: e.target.value })} placeholder={isHe ? 'אופציונלי' : 'Optional'} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>{isHe ? 'חברת Prop Firm' : 'Prop Firm'}</label>
              <input style={inputStyle} value={pf.prop_firm} onChange={(e) => setPf({ ...pf, prop_firm: e.target.value })} placeholder="TopstepX, Apex..." />
            </div>
            <div>
              <label style={labelStyle}>{isHe ? 'סכום נטו ($)' : 'Net Amount ($)'}</label>
              <input style={inputStyle} type="number" value={pf.amount} onChange={(e) => setPf({ ...pf, amount: e.target.value })} placeholder="1200" />
            </div>
            <div>
              <label style={labelStyle}>{isHe ? 'קשור לחשבון (אופציונלי)' : 'Linked Account (optional)'}</label>
              <select style={inputStyle} value={''} onChange={() => {}}>
                <option value="">{isHe ? '— ללא קישור —' : '— None —'}</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{isHe ? 'תאריך' : 'Date'}</label>
              <input style={inputStyle} type="date" value={pf.date} onChange={(e) => setPf({ ...pf, date: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>{isHe ? 'הערות' : 'Notes'}</label>
              <input style={inputStyle} value={pf.notes} onChange={(e) => setPf({ ...pf, notes: e.target.value })} placeholder={isHe ? 'אופציונלי' : 'Optional'} />
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
          <button className="btn btn-ghost" style={{ flex: 1, minWidth: 0 }} onClick={onClose}>{isHe ? 'ביטול' : 'Cancel'}</button>
          <button className="btn btn-primary" style={{ flex: 1, minWidth: 0 }} onClick={handleSave}>{isHe ? 'שמור' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Logs Table ───────────────────────────────────────────────────────────────

const FEE_LABELS: Record<ExpenseFeeType, string> = {
  challenge: 'Challenge', reset: 'Reset', activation: 'Activation', data_fee: 'Data Fee', other: 'Other',
};
const FEE_COLORS: Record<ExpenseFeeType, string> = {
  challenge: 'var(--b)', reset: 'var(--o)', activation: 'var(--g)', data_fee: 'var(--t3)', other: 'var(--t3)',
};

function LogsSection({
  expenses, payouts, isHe, accounts, onEdit, onDelete,
}: {
  expenses: PropExpense[];
  payouts: PropPayout[];
  isHe: boolean;
  accounts: { id: string; name: string }[];
  onEdit: (type: 'expense' | 'payout', id: string) => void;
  onDelete: (type: 'expense' | 'payout', id: string) => void;
}) {
  const [tab, setTab] = useState<'expenses' | 'payouts'>('expenses');

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 18px', borderRadius: 99, fontSize: '.82rem', fontWeight: 600,
    border: 'none', cursor: 'pointer',
    background: active ? 'var(--g)' : 'transparent',
    color: active ? '#000' : 'var(--t3)',
    transition: 'all .2s',
  });

  return (
    <div style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 14, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--bd)', display: 'flex', gap: 8 }}>
        <button style={tabStyle(tab === 'expenses')} onClick={() => setTab('expenses')}>
          {isHe ? `הוצאות (${expenses.length})` : `Expenses (${expenses.length})`}
        </button>
        <button style={tabStyle(tab === 'payouts')} onClick={() => setTab('payouts')}>
          {isHe ? `משיכות (${payouts.length})` : `Payouts (${payouts.length})`}
        </button>
      </div>

      {tab === 'expenses' && (
        expenses.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--t3)', fontSize: '.84rem' }}>
            {isHe ? 'אין הוצאות רשומות' : 'No expenses logged'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bd)' }}>
                  {[
                    isHe ? 'תאריך' : 'Date',
                    isHe ? 'חברה' : 'Firm',
                    isHe ? 'גודל' : 'Size',
                    isHe ? 'סוג' : 'Type',
                    isHe ? 'סכום' : 'Amount',
                    isHe ? 'הערות' : 'Notes',
                    '',
                  ].map((h, i) => (
                    <th key={i} style={{ padding: '10px 16px', textAlign: 'start', color: 'var(--t3)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--bd)' }}>
                    <td style={{ padding: '10px 16px', color: 'var(--t3)', whiteSpace: 'nowrap' }}>{e.date}</td>
                    <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--t1)' }}>{e.prop_firm}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--t2)' }}>{e.account_size > 0 ? `$${(e.account_size / 1000).toFixed(0)}k` : '—'}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ fontSize: '.72rem', fontWeight: 700, padding: '3px 9px', borderRadius: 99, background: `${FEE_COLORS[e.fee_type]}22`, color: FEE_COLORS[e.fee_type] }}>
                        {FEE_LABELS[e.fee_type]}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', color: 'var(--r)', fontWeight: 700 }}>-{fmtPos(e.amount)}</td>
                    <td style={{ padding: '10px 16px', color: 'var(--t3)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.notes || '—'}</td>
                    <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                      <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '.72rem' }} onClick={() => onEdit('expense', e.id)}>
                        {isHe ? 'ערוך' : 'Edit'}
                      </button>
                      <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '.72rem', color: 'var(--r)' }} onClick={() => onDelete('expense', e.id)}>
                        {isHe ? 'מחק' : 'Del'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === 'payouts' && (
        payouts.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--t3)', fontSize: '.84rem' }}>
            {isHe ? 'אין משיכות רשומות' : 'No payouts logged'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--bd)' }}>
                  {[
                    isHe ? 'תאריך' : 'Date',
                    isHe ? 'חברה' : 'Firm',
                    isHe ? 'חשבון' : 'Account',
                    isHe ? 'סכום נטו' : 'Net Amount',
                    isHe ? 'הערות' : 'Notes',
                    '',
                  ].map((h, i) => (
                    <th key={i} style={{ padding: '10px 16px', textAlign: 'start', color: 'var(--t3)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payouts.map((p) => {
                  const linkedAcc = p.account_id ? accounts.find((a) => a.id === p.account_id) : null;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--bd)' }}>
                      <td style={{ padding: '10px 16px', color: 'var(--t3)', whiteSpace: 'nowrap' }}>{p.date}</td>
                      <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--t1)' }}>{p.prop_firm}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--t3)' }}>{linkedAcc?.name ?? '—'}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--g)', fontWeight: 700 }}>+{fmtPos(p.amount)}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--t3)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.notes || '—'}</td>
                      <td style={{ padding: '10px 16px', whiteSpace: 'nowrap' }}>
                        <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '.72rem' }} onClick={() => onEdit('payout', p.id)}>
                          {isHe ? 'ערוך' : 'Edit'}
                        </button>
                        <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: '.72rem', color: 'var(--r)' }} onClick={() => onDelete('payout', p.id)}>
                          {isHe ? 'מחק' : 'Del'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BusinessManager() {
  const { accounts, trades, expenses, payouts, lang, deleteExpense, deletePayout } = useStore();
  const isHe = lang === 'he';

  const stats = useMemo(
    () => calcBusinessStats(accounts, trades, expenses, payouts),
    [accounts, trades, expenses, payouts],
  );

  const propAccounts = useMemo(
    () => accounts.filter((a) => a.account_type === 'prop_firm'),
    [accounts],
  );

  // Modal state
  const [modal, setModal] = useState<null | { mode: 'expense' | 'payout'; editId?: string }>(null);

  const editExpense = modal?.mode === 'expense' && modal.editId
    ? expenses.find((e) => e.id === modal.editId) : undefined;
  const editPayout = modal?.mode === 'payout' && modal.editId
    ? payouts.find((p) => p.id === modal.editId) : undefined;

  const handleDelete = (type: 'expense' | 'payout', id: string) => {
    if (type === 'expense') deleteExpense(id);
    else deletePayout(id);
  };

  const netColor = stats.netProfit > 0 ? 'var(--g)' : stats.netProfit < 0 ? 'var(--r)' : 'var(--t1)';

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>
            {isHe ? 'ניהול עסקי' : 'Business Manager'}
          </h1>
          <p style={{ fontSize: '.82rem', color: 'var(--t3)', margin: 0 }}>
            {isHe ? 'נהל את הפעילות העסקית שלך כטריידר Prop Firm' : 'Track your prop firm operations as a business'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => setModal({ mode: 'payout' })}>
            + {isHe ? 'משיכה' : 'Payout'}
          </button>
          <button className="btn btn-primary" onClick={() => setModal({ mode: 'expense' })}>
            + {isHe ? 'הוצאה' : 'Expense'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14, marginBottom: 20 }}>
        <KpiCard
          label={isHe ? 'סה"כ הכנסות' : 'Total Revenue'}
          value={fmtPos(stats.totalPayouts)}
          color="var(--g)"
        />
        <KpiCard
          label={isHe ? 'סה"כ הוצאות' : 'Total Expenses'}
          value={fmtPos(stats.totalExpenses)}
          color="var(--r)"
        />
        <KpiCard
          label={isHe ? 'רווח נקי' : 'Net Profit'}
          value={fmt(stats.netProfit)}
          sub={stats.netProfit > 0 ? (isHe ? 'עסק רווחי' : 'Profitable') : (isHe ? 'בהפסד' : 'In the red')}
          color={netColor}
        />
        <KpiCard
          label={isHe ? 'עלות לחשבון ממומן (CPA)' : 'Cost Per Account (CPA)'}
          value={fmtPos(stats.cpa)}
          sub={stats.fundedAccountCount > 0 ? `${stats.fundedAccountCount} ${isHe ? 'חשבונות' : 'funded'}` : (isHe ? 'אין עדיין' : 'None yet')}
        />
        <KpiCard
          label={isHe ? 'ממוצע ימי חיים' : 'Avg Account Life'}
          value={stats.avgBurnDays > 0 ? `${stats.avgBurnDays}d` : '—'}
          sub={isHe ? 'עד הפסקה' : 'until breach'}
          color={stats.avgBurnDays > 0 && stats.avgBurnDays < 14 ? 'var(--r)' : 'var(--t1)'}
        />
      </div>

      {/* Break-even bar */}
      <div style={{ background: 'var(--s2)', border: '1px solid var(--bd)', borderRadius: 14, padding: '18px 22px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10, flexWrap: 'wrap', gap: '4px 12px' }}>
          <span style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--t1)' }}>
            {isHe ? 'יעד Break-Even החודש' : 'Monthly Break-Even Target'}
          </span>
          <span style={{ fontSize: '.78rem', color: 'var(--t3)' }}>
            {fmtPos(stats.currentMonthPayouts)} / {fmtPos(stats.currentMonthExpenses)}&nbsp;
            · {stats.currentMonthExpenses > 0 ? `${Math.round(stats.breakEvenProgress)}%` : '—'}
          </span>
        </div>
        <MeterBar
          pct={stats.breakEvenProgress}
          color={stats.breakEvenProgress >= 100 ? 'var(--g)' : stats.breakEvenProgress >= 50 ? 'var(--o)' : 'var(--r)'}
          height={10}
        />
        {stats.currentMonthExpenses === 0 && (
          <div style={{ fontSize: '.74rem', color: 'var(--t3)', marginTop: 6 }}>
            {isHe ? 'לא נרשמו הוצאות החודש' : 'No expenses logged this month'}
          </div>
        )}
      </div>

      {/* Two-column: Meter + Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
        <GamblingMeter score={stats.gamblingMeterScore} isHe={isHe} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--t1)', marginBottom: 10 }}>
            {isHe ? 'תובנות חכמות' : 'Smart Insights'}
          </div>
          <InsightsPanel stats={stats} isHe={isHe} />
        </div>
      </div>

      {/* Monthly chart */}
      <div style={{ marginBottom: 20 }}>
        <MonthlyChart monthly={stats.monthly} isHe={isHe} hasAnyData={expenses.length > 0 || payouts.length > 0} />
      </div>

      {/* Logs */}
      <LogsSection
        expenses={expenses}
        payouts={payouts}
        isHe={isHe}
        accounts={propAccounts}
        onEdit={(type, id) => setModal({ mode: type, editId: id })}
        onDelete={handleDelete}
      />

      {/* Modal */}
      {modal && (
        <EntryModal
          mode={modal.mode}
          editExpense={editExpense}
          editPayout={editPayout}
          onClose={() => setModal(null)}
          isHe={isHe}
          accounts={propAccounts}
        />
      )}
    </div>
  );
}
