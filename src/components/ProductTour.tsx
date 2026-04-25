import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver, type Driver, type DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useStore } from '../store';
import type { Account, AccountType } from '../types';

/* ── Design tokens ─────────────────────────────────────────────── */
const G   = '#1DB954';
const S1  = '#181818';
const S2  = '#282828';
const BD  = 'rgba(255,255,255,.08)';
const T2  = '#B3B3B3';

/* ── Types ──────────────────────────────────────────────────────── */
type Phase =
  | 'setup'
  | 'driver-dashboard'
  | 'bridge-analytics'
  | 'driver-analytics'
  | 'bridge-propfirm'
  | 'driver-propfirm'
  | 'bridge-business'
  | 'driver-business'
  | 'bridge-settings'
  | 'driver-settings'
  | 'done';

/* ── Small helpers ──────────────────────────────────────────────── */
function Btn({
  children, onClick, variant = 'primary', disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '11px 24px', borderRadius: 999, border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: 700, fontSize: 14, transition: 'opacity .15s',
        ...(variant === 'primary'
          ? { background: G, color: '#000', opacity: disabled ? .5 : 1 }
          : { background: 'transparent', color: T2, border: `1px solid ${BD}` }),
      }}
    >
      {children}
    </button>
  );
}

function Input({
  label, value, onChange, type = 'text', placeholder,
}: {
  label: string; value: string | number;
  onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, color: T2, fontWeight: 500 }}>{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          background: S2, border: `1px solid ${BD}`, borderRadius: 8,
          padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none',
          width: '100%', boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

/* ── Bridge modal between pages ────────────────────────────────── */
function BridgeModal({
  icon, title, desc, btnLabel, onNext, onSkip, isHe,
}: {
  icon: string; title: string; desc: string;
  btnLabel: string; onNext: () => void; onSkip: () => void;
  isHe: boolean;
}) {
  return (
    <Overlay isHe={isHe}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <div style={{ fontSize: 48 }}>{icon}</div>
        <div>
          <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>{title}</h3>
          <p style={{ color: T2, fontSize: 14, margin: 0, lineHeight: 1.6 }}>{desc}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn variant="ghost" onClick={onSkip}>{isHe ? 'דלג לסוף' : 'Skip to end'}</Btn>
          <Btn onClick={onNext}>{btnLabel}</Btn>
        </div>
      </div>
    </Overlay>
  );
}

/* ── Overlay wrapper ────────────────────────────────────────────── */
function Overlay({ children, isHe }: { children: React.ReactNode; isHe: boolean }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{
        background: S1, border: `1px solid ${BD}`, borderRadius: 20,
        padding: 32, width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,.6)',
      }} dir={isHe ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </div>
  );
}

/* ── Skip button floating over driver.js tour ───────────────────── */
function SkipButton({ onClick, isHe }: { onClick: () => void; isHe: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed', bottom: 24, right: isHe ? 'auto' : 24, left: isHe ? 24 : 'auto',
        zIndex: 100001, background: S2, border: `1px solid ${BD}`,
        color: T2, borderRadius: 999, padding: '8px 18px',
        fontSize: 13, cursor: 'pointer', fontWeight: 600,
      }}
    >
      {isHe ? 'דלג על הסיור' : 'Skip tour'}
    </button>
  );
}

/* ── Main component ─────────────────────────────────────────────── */
export default function ProductTour({ onDone }: { onDone: () => void }) {
  const { lang, addAccount, setDailyGoalTarget, setDailyMaxLoss, setModal } = useStore();
  const navigate = useNavigate();
  const isHe = lang === 'he';

  const [phase, setPhase] = useState<Phase>('setup');
  const driverRef = useRef<Driver | null>(null);

  // Setup form state
  const [accName, setAccName]       = useState('');
  const [accType, setAccType]       = useState<AccountType>('prop_firm');
  const [accBalance, setAccBalance] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalMaxLoss, setGoalMaxLoss] = useState('');

  /* Save setup data and advance to tour */
  const startTour = () => {
    if (accName.trim()) {
      const account: Account = {
        id: crypto.randomUUID(),
        name: accName.trim(),
        account_type: accType,
        broker: 'manual',
        initial_balance: parseFloat(accBalance) || 0,
        currency: 'USD',
        is_active: true,
      };
      addAccount(account);
    }
    if (parseFloat(goalTarget) > 0)  setDailyGoalTarget(parseFloat(goalTarget));
    if (parseFloat(goalMaxLoss) > 0) setDailyMaxLoss(parseFloat(goalMaxLoss));

    navigate('/dashboard');
    setTimeout(() => setPhase('driver-dashboard'), 400);
  };

  const finish = (action?: 'trade' | 'import' | 'dashboard') => {
    driverRef.current?.destroy();
    onDone();
    if (action === 'trade') {
      navigate('/dashboard');
      setTimeout(() => setModal({ type: 'new' }), 200);
    } else if (action === 'import') {
      navigate('/dashboard/settings');
    } else {
      navigate('/dashboard');
    }
  };

  /* ── Driver.js phase runner ────────────────────────────────────── */
  useEffect(() => {
    if (!phase.startsWith('driver-')) return;

    const page = phase.replace('driver-', '') as 'dashboard' | 'analytics' | 'propfirm' | 'business' | 'settings';

    const STEPS: Record<typeof page, DriveStep[]> = {
      dashboard: [
        {
          element: '#tour-statsbar',
          popover: {
            title: isHe ? '📊 ביצועים בשנייה' : '📊 Performance at a Glance',
            description: isHe
              ? 'כאן תמצא את סיכום הביצועים שלך — P&L כולל, אחוז זכייה, ממוצע רווח/הפסד ועוד.'
              : 'Your overall performance summary — total P&L, win rate, average win/loss and more.',
            side: 'bottom', align: 'start',
          },
        },
        {
          element: '#tour-daily-goal',
          popover: {
            title: isHe ? '🎯 יעד יומי' : '🎯 Daily Goal Bar',
            description: isHe
              ? 'סרגל היעד היומי מראה כמה רחוק אתה מיעד הרווח ומגבול ההפסד היומי. הגדר אותם בהגדרות.'
              : 'Tracks how far you are from your daily profit target and max loss limit. Set them in Settings.',
            side: 'bottom', align: 'start',
          },
        },
        {
          element: '#tour-calendar',
          popover: {
            title: isHe ? '🗓 לוח שנה מסחרי' : '🗓 Trading Calendar',
            description: isHe
              ? 'ראה את ה-P&L וה-WR% שלך לכל יום בחודש בלחיצה אחת. צבע ירוק = יום מנצח, אדום = יום מפסיד.'
              : 'See your P&L and win rate for every trading day. Green = winning day, red = losing day.',
            side: 'top', align: 'start',
          },
        },
        {
          element: '#tour-equity-chart',
          popover: {
            title: isHe ? '📈 עקומת הון' : '📈 Equity Curve',
            description: isHe
              ? 'גרף שמציג את ה-P&L המצטבר שלך לאורך החודש — גבוה = ביצועים טובים.'
              : 'Shows your cumulative P&L over the current month — higher is better.',
            side: 'top', align: 'start',
          },
        },
        {
          element: '#tour-new-trade',
          popover: {
            title: isHe ? '✏️ הוסף עסקה' : '✏️ Add a Trade',
            description: isHe
              ? 'לחץ כאן בכל עת כדי לרשום עסקה חדשה. תוכל גם לייבא אוטומטית מ-Tradovate ו-TopstepX.'
              : 'Click here anytime to log a new trade. You can also auto-import from Tradovate and TopstepX.',
            side: 'bottom', align: 'end',
          },
        },
      ],
      analytics: [
        {
          element: '#tour-analytics-tabs',
          popover: {
            title: isHe ? '📊 8 גרפי אנליטיקה' : '📊 8 Analytics Charts',
            description: isHe
              ? 'Equity Curve, Drawdown, P&L לפי יום ולפי סמל, Heatmap חודשי, התפלגות, Risk/Reward Scatter וניתוח רצפים. כולם ב-Canvas, ללא ספריות חיצוניות.'
              : 'Equity Curve, Drawdown, P&L by day & symbol, Monthly Heatmap, Distribution, R/R Scatter, and Streak Analysis — all built with Canvas.',
            side: 'bottom', align: 'start',
          },
        },
      ],
      propfirm: [
        {
          element: '#tour-propfirm',
          popover: {
            title: isHe ? '🏆 Prop Firm Tracker' : '🏆 Prop Firm Tracker',
            description: isHe
              ? 'עקוב אחרי כל חשבון Prop Firm שלך — Drawdown נוכחי, יעד רווח וגבול הפסד יומי בזמן אמת. הדף מתריע אוטומטית אם אתה קרוב לפסילה.'
              : 'Monitor every prop firm account — current drawdown, profit target and daily loss limit in real time. Automatic alerts when you\'re close to a breach.',
            side: 'top', align: 'start',
          },
        },
      ],
      business: [
        {
          element: '#tour-business-kpis',
          popover: {
            title: isHe ? '💼 KPIs עסקיים' : '💼 Business KPIs',
            description: isHe
              ? 'ראה את סך ההכנסות (משיכות), ההוצאות (עמלות הערכה), הרווח הנקי, עלות לחשבון (CPA) ומשך חיים ממוצע של חשבון.'
              : 'Total revenue (payouts), total expenses (evaluation fees), net profit, cost per account (CPA) and average account lifespan.',
            side: 'bottom', align: 'start',
          },
        },
        {
          element: '#tour-gambling-meter',
          popover: {
            title: isHe ? '🎲 Gambling Meter' : '🎲 Gambling Meter',
            description: isHe
              ? 'מד שמראה אם ההתנהגות שלך בשוק הפיוצ\'רס היא עסקית ובריאה — או אם הוצאות ההערכה חורגות מהמשיכות. ירוק = בריא, אדום = כדאי לעצור.'
              : 'Shows whether your prop firm spending is healthy or out of control. Green = healthy ratio of payouts to expenses. Red = time to pause.',
            side: 'top', align: 'start',
          },
        },
      ],
      settings: [
        {
          element: '#tour-strategy-section',
          popover: {
            title: isHe ? '🧠 אסטרטגיות מסחר' : '🧠 Trading Strategies',
            description: isHe
              ? 'צור את האסטרטגיות שלך עם checkboxes ושדות טקסט. כשתרשום עסקה תוכל לבחור אסטרטגיה ולמלא את הצ\'קליסט — זה עוזר לשמור על דיסציפלינה ולנתח מה עובד.'
              : 'Build strategies with custom checklists and text fields. When logging a trade, select a strategy and fill in the checklist — great for tracking discipline and what actually works.',
            side: 'bottom', align: 'start',
          },
        },
        {
          element: '#tour-broker-section',
          popover: {
            title: isHe ? '🔄 ייבוא אוטומטי' : '🔄 Auto Import',
            description: isHe
              ? 'חבר את Tradovate (email + סיסמה) או TopstepX (API key) כדי לייבא עסקאות אוטומטית — בלי הקלדה ידנית. לחץ "Connect" ואז "Sync Now".'
              : 'Connect Tradovate (email + password) or TopstepX (API key) to auto-import your trades. Click Connect then Sync Now.',
            side: 'top', align: 'start',
          },
        },
      ],
    };

    /* Next phase after each page tour */
    const nextPhase: Record<typeof page, Phase> = {
      dashboard: 'bridge-analytics',
      analytics: 'bridge-propfirm',
      propfirm:  'bridge-business',
      business:  'bridge-settings',
      settings:  'done',
    };

    const d = driver({
      showProgress: true,
      progressText: isHe ? '{{current}} מתוך {{total}}' : '{{current}} of {{total}}',
      nextBtnText:  isHe ? 'הבא →' : 'Next →',
      prevBtnText:  isHe ? '→ הקודם' : '← Back',
      doneBtnText:  isHe ? 'סיים ←' : 'Done →',
      steps: STEPS[page],
      onDestroyStarted: () => {
        // Allow closing without confirmation
        d.destroy();
      },
      onDestroyed: () => {
        driverRef.current = null;
        setPhase(nextPhase[page]);
      },
    });

    driverRef.current = d;
    // Small delay so the page has time to render
    const t = setTimeout(() => d.drive(), 350);
    return () => {
      clearTimeout(t);
      d.destroy();
    };
  }, [phase]);

  /* ── Render ────────────────────────────────────────────────────── */

  if (phase === 'setup') {
    return (
      <Overlay isHe={isHe}>
        {/* Welcome header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img
            src="/logo.png"
            alt="TradeLog"
            style={{ width: 64, height: 64, borderRadius: 12, mixBlendMode: 'screen', marginBottom: 12 }}
          />
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', letterSpacing: -.5 }}>
            {isHe ? '👋 ברוך הבא ל-TradeLog!' : '👋 Welcome to TradeLog!'}
          </h2>
          <p style={{ color: T2, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
            {isHe
              ? 'בוא נגדיר את החשבון הראשון שלך ואז נסייר בכל הפיצ\'רים — לוקח פחות מ-2 דקות.'
              : "Let's set up your first account and then take a quick tour — under 2 minutes."}
          </p>
        </div>

        {/* Account setup */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <Input
            label={isHe ? 'שם החשבון' : 'Account name'}
            value={accName}
            onChange={setAccName}
            placeholder={isHe ? 'למשל: Topstep 50K, Live NQ...' : 'e.g. Topstep 50K, Live NQ...'}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: T2, fontWeight: 500 }}>
              {isHe ? 'סוג חשבון' : 'Account type'}
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {([
                ['prop_firm', isHe ? 'Prop Firm' : 'Prop Firm'],
                ['personal',  isHe ? 'Live אישי' : 'Personal Live'],
                ['demo',      isHe ? 'Sim / Eval' : 'Sim / Eval'],
              ] as [AccountType, string][]).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setAccType(val)}
                  style={{
                    flex: 1, padding: '9px 8px', borderRadius: 8,
                    border: `1px solid ${accType === val ? G : BD}`,
                    background: accType === val ? 'rgba(29,185,84,.12)' : S2,
                    color: accType === val ? G : T2,
                    cursor: 'pointer', fontSize: 13,
                    fontWeight: accType === val ? 700 : 400,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label={isHe ? 'יתרה התחלתית ($)' : 'Starting balance ($)'}
              value={accBalance}
              onChange={setAccBalance}
              type="number"
              placeholder="50000"
            />
            <Input
              label={isHe ? 'יעד רווח יומי ($)' : 'Daily profit target ($)'}
              value={goalTarget}
              onChange={setGoalTarget}
              type="number"
              placeholder="500"
            />
          </div>

          <Input
            label={isHe ? 'מקסימום הפסד יומי ($)' : 'Daily max loss ($)'}
            value={goalMaxLoss}
            onChange={setGoalMaxLoss}
            type="number"
            placeholder="200"
          />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => finish('dashboard')}>
            {isHe ? 'דלג על הכל' : 'Skip everything'}
          </Btn>
          <Btn onClick={startTour} disabled={!accName.trim()}>
            {isHe ? 'התחל סיור ←' : 'Start tour →'}
          </Btn>
        </div>
      </Overlay>
    );
  }

  if (phase === 'bridge-analytics') {
    return (
      <>
        <BridgeModal
          icon="📊"
          title={isHe ? 'עכשיו נסתכל על Analytics' : "Now let's explore Analytics"}
          desc={isHe
            ? '8 גרפים Canvas שמנתחים את ביצועי המסחר שלך לעומק — equity, drawdown, heatmap ועוד.'
            : '8 Canvas charts that analyse your trading performance in depth — equity, drawdown, heatmap and more.'}
          btnLabel={isHe ? 'בואו נראה ←' : "Let's go →"}
          onNext={() => { navigate('/dashboard/analytics'); setTimeout(() => setPhase('driver-analytics'), 400); }}
          onSkip={() => finish('dashboard')}
          isHe={isHe}
        />
      </>
    );
  }

  if (phase === 'bridge-propfirm') {
    return (
      <BridgeModal
        icon="🏆"
        title={isHe ? 'Prop Firm Tracker' : 'Prop Firm Tracker'}
        desc={isHe
          ? 'עקוב אחרי כל חשבון Prop Firm בזמן אמת — drawdown, יעד רווח וגבול הפסד יומי.'
          : 'Track every prop firm account in real time — drawdown, profit target and daily loss limit.'}
        btnLabel={isHe ? 'הצג לי ←' : 'Show me →'}
        onNext={() => { navigate('/dashboard/propfirm'); setTimeout(() => setPhase('driver-propfirm'), 400); }}
        onSkip={() => finish('dashboard')}
        isHe={isHe}
      />
    );
  }

  if (phase === 'bridge-business') {
    return (
      <BridgeModal
        icon="💼"
        title={isHe ? 'ניהול עסקי' : 'Business Manager'}
        desc={isHe
          ? 'ראה אם הביזנס שלך בפיוצ\'רס רווחי — הוצאות מול משיכות, CPA, Gambling Meter ותובנות חכמות.'
          : 'See if your prop firm business is profitable — expenses vs payouts, CPA, Gambling Meter and smart insights.'}
        btnLabel={isHe ? 'בואו נראה ←' : "Let's see →"}
        onNext={() => { navigate('/dashboard/business'); setTimeout(() => setPhase('driver-business'), 400); }}
        onSkip={() => finish('dashboard')}
        isHe={isHe}
      />
    );
  }

  if (phase === 'bridge-settings') {
    return (
      <BridgeModal
        icon="⚙️"
        title={isHe ? 'אסטרטגיות וחיבור ברוקר' : 'Strategies & Broker Connection'}
        desc={isHe
          ? 'צור את האסטרטגיות שלך וחבר את Tradovate / TopstepX לייבוא אוטומטי של עסקאות.'
          : 'Create your trading strategies and connect Tradovate / TopstepX for automatic trade import.'}
        btnLabel={isHe ? 'בואו נגדיר ←' : "Let's set up →"}
        onNext={() => { navigate('/dashboard/settings'); setTimeout(() => setPhase('driver-settings'), 400); }}
        onSkip={() => finish('dashboard')}
        isHe={isHe}
      />
    );
  }

  if (phase === 'done') {
    return (
      <Overlay isHe={isHe}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
          <div style={{ fontSize: 56 }}>🚀</div>
          <div>
            <h3 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>
              {isHe ? 'הכל מוכן!' : "You're all set!"}
            </h3>
            <p style={{ color: T2, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              {isHe
                ? 'TradeLog מוכן לעבוד בשבילך. איך תרצה להתחיל?'
                : 'TradeLog is ready to work for you. How do you want to start?'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 320 }}>
            <button
              onClick={() => finish('trade')}
              style={{
                background: G, color: '#000', border: 'none', borderRadius: 999,
                padding: '13px 24px', fontSize: 15, fontWeight: 800, cursor: 'pointer',
              }}
            >
              {isHe ? '✏️ הוסף עסקה ראשונה' : '✏️ Add first trade'}
            </button>
            <button
              onClick={() => finish('import')}
              style={{
                background: S2, color: '#fff', border: `1px solid ${BD}`, borderRadius: 999,
                padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {isHe ? '🔄 ייבא מ-Tradovate / TopstepX' : '🔄 Import from Tradovate / TopstepX'}
            </button>
            <button
              onClick={() => finish('dashboard')}
              style={{
                background: 'transparent', color: T2, border: 'none',
                padding: '10px 24px', fontSize: 13, cursor: 'pointer', textDecoration: 'underline',
              }}
            >
              {isHe ? 'עבור ללוח הבקרה' : 'Go to dashboard'}
            </button>
          </div>
        </div>
      </Overlay>
    );
  }

  /* driver-* phases: just render the skip button — Driver.js handles the rest */
  if (phase.startsWith('driver-')) {
    return <SkipButton onClick={() => finish('dashboard')} isHe={isHe} />;
  }

  return null;
}
