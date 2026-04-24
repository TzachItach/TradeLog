import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import type { Account, AccountType } from '../types';

/* ── helpers ────────────────────────────────────────────────── */
const G = '#1DB954';
const S1 = '#181818';
const S2 = '#282828';
const BD = 'rgba(255,255,255,.08)';
const T2 = '#B3B3B3';

function Input({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string | number; onChange: (v: string) => void;
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

function Btn({ children, onClick, variant = 'primary', disabled }: {
  children: React.ReactNode; onClick: () => void;
  variant?: 'primary' | 'ghost'; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: '11px 24px', borderRadius: 999, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
      fontWeight: 700, fontSize: 14, transition: 'opacity .15s',
      ...(variant === 'primary'
        ? { background: G, color: '#000', opacity: disabled ? .5 : 1 }
        : { background: 'transparent', color: T2, border: `1px solid ${BD}` }),
    }}>{children}</button>
  );
}

/* ── Progress dots ──────────────────────────────────────────── */
function Dots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === current ? 20 : 6, height: 6, borderRadius: 999,
          background: i === current ? G : i < current ? 'rgba(29,185,84,.35)' : BD,
          transition: 'all .3s',
        }} />
      ))}
    </div>
  );
}

/* ── Feature cards data ─────────────────────────────────────── */
const FEATURES = [
  {
    icon: '🗓',
    title: 'לוח שנה מסחרי',
    titleEn: 'Trading Calendar',
    desc: 'ראה את כל הביצועים שלך בלפנייה של חודש — P&L יומי, WR%, ורצפי זכייה.',
    descEn: 'See your monthly performance at a glance — daily P&L, win rate, and streaks.',
    color: '#1DB954',
    svg: (
      <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
        {[0,1,2,3,4,5,6].map(col => [0,1,2,3].map(row => {
          const idx = row * 7 + col;
          const colors = ['rgba(29,185,84,.5)','rgba(255,77,96,.3)','rgba(29,185,84,.25)','#333','rgba(29,185,84,.7)','rgba(255,77,96,.2)','rgba(29,185,84,.35)'];
          return <rect key={idx} x={col*11+1} y={row*14+1} width={9} height={11} rx={2} fill={colors[idx % colors.length]} />;
        }))}
      </svg>
    ),
  },
  {
    icon: '📊',
    title: '8 גרפי Analytics',
    titleEn: '8 Analytics Charts',
    desc: 'Equity Curve, Drawdown, P&L by Day, Monthly Heatmap, Risk/Reward Scatter ועוד 3.',
    descEn: 'Equity Curve, Drawdown, P&L by Day, Monthly Heatmap, Risk/Reward Scatter and 3 more.',
    color: '#5b8fff',
    svg: (
      <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
        <defs>
          <linearGradient id="obg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5b8fff" stopOpacity=".4"/>
            <stop offset="100%" stopColor="#5b8fff" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <polygon points="0,55 12,40 24,42 36,25 48,28 60,12 72,8 80,5 80,55" fill="url(#obg)"/>
        <polyline points="0,55 12,40 24,42 36,25 48,28 60,12 72,8 80,5" stroke="#5b8fff" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <circle cx="80" cy="5" r="3" fill="#5b8fff"/>
      </svg>
    ),
  },
  {
    icon: '🏆',
    title: 'Prop Firm Tracker',
    titleEn: 'Prop Firm Tracker',
    desc: 'עקוב אחרי ה-Drawdown, יעד הרווח וגבול ההפסד היומי בזמן אמת — לכל חשבון.',
    descEn: 'Track drawdown, profit target and daily loss limit in real time — per account.',
    color: '#ffaa44',
    svg: (
      <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
        <rect x="4" y="38" width="72" height="8" rx="4" fill="#333"/>
        <rect x="4" y="38" width="48" height="8" rx="4" fill="rgba(255,170,68,.7)"/>
        <rect x="4" y="50" width="72" height="8" rx="4" fill="#333"/>
        <rect x="4" y="50" width="20" height="8" rx="4" fill="rgba(255,77,96,.6)"/>
        <rect x="4" y="26" width="72" height="8" rx="4" fill="#333"/>
        <rect x="4" y="26" width="58" height="8" rx="4" fill="rgba(29,185,84,.6)"/>
        <text x="4" y="18" fill="#B3B3B3" fontSize="7" fontFamily="monospace">Drawdown  Profit  Daily Limit</text>
      </svg>
    ),
  },
  {
    icon: '🔄',
    title: 'ייבוא אוטומטי',
    titleEn: 'Auto Import',
    desc: 'חבר את Tradovate או TopstepX וייבא את כל העסקאות שלך אוטומטית — בלי הקלדה ידנית.',
    descEn: 'Connect Tradovate or TopstepX and import all your trades automatically.',
    color: '#00e0a8',
    svg: (
      <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
        <rect x="2" y="8" width="30" height="18" rx="4" fill="#282828" stroke="rgba(0,224,168,.4)" strokeWidth="1.5"/>
        <text x="8" y="21" fill="rgba(0,224,168,.9)" fontSize="7" fontWeight="bold">Tradovate</text>
        <rect x="2" y="34" width="30" height="18" rx="4" fill="#282828" stroke="rgba(0,224,168,.4)" strokeWidth="1.5"/>
        <text x="5" y="47" fill="rgba(0,224,168,.9)" fontSize="7" fontWeight="bold">TopstepX</text>
        <path d="M34 17 L50 17 M50 17 L46 13 M50 17 L46 21" stroke="rgba(0,224,168,.8)" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M34 43 L50 43 M50 43 L46 39 M50 43 L46 47" stroke="rgba(0,224,168,.8)" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="52" y="22" width="26" height="16" rx="4" fill="#282828" stroke="rgba(0,224,168,.6)" strokeWidth="1.5"/>
        <text x="56" y="34" fill="rgba(0,224,168,1)" fontSize="7" fontWeight="bold">TradeLog</text>
      </svg>
    ),
  },
  {
    icon: '💼',
    title: 'ניהול עסקי',
    titleEn: 'Business Manager',
    desc: 'עקוב אחרי הוצאות, משיכות, CPA, ו-Gambling Meter — ראה אם הביזנס שלך רווחי.',
    descEn: 'Track expenses, payouts, CPA, and Gambling Meter — see if your business is profitable.',
    color: '#c084fc',
    svg: (
      <svg width="80" height="60" viewBox="0 0 80 60" fill="none">
        {/* Bar chart */}
        {[
          { x: 4,  h: 20, c: 'rgba(255,77,96,.6)' },
          { x: 18, h: 32, c: 'rgba(192,132,252,.7)' },
          { x: 32, h: 15, c: 'rgba(255,77,96,.6)' },
          { x: 46, h: 42, c: 'rgba(192,132,252,.9)' },
          { x: 60, h: 28, c: 'rgba(192,132,252,.7)' },
        ].map(b => (
          <rect key={b.x} x={b.x} y={56 - b.h} width={12} height={b.h} rx={3} fill={b.c}/>
        ))}
        {/* Gambling meter arc */}
        <path d="M 4 10 A 16 16 0 0 1 36 10" stroke="#333" strokeWidth="4" fill="none" strokeLinecap="round"/>
        <path d="M 4 10 A 16 16 0 0 1 28 4" stroke="rgba(192,132,252,.8)" strokeWidth="4" fill="none" strokeLinecap="round"/>
      </svg>
    ),
  },
];

/* ── Main component ─────────────────────────────────────────── */
export default function OnboardingWizard({ onDone }: { onDone: () => void }) {
  const { lang, addAccount, setDailyGoalTarget, setDailyMaxLoss, setModal } = useStore();
  const navigate = useNavigate();
  const isHe = lang === 'he';

  const [step, setStep] = useState(0);
  const [featureIdx, setFeatureIdx] = useState(0);

  // Step 2 — account
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<AccountType>('prop_firm');
  const [accBalance, setAccBalance] = useState('');

  // Step 3 — goals
  const [goalTarget, setGoalTarget] = useState('');
  const [goalMaxLoss, setGoalMaxLoss] = useState('');

  const TOTAL_STEPS = 5;

  /* save account + goals, mark done */
  const finish = (action: 'trade' | 'import' | 'dashboard') => {
    // Create account if name was entered
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

  /* ── Step renderers ──────────────────────────────────────── */

  /* Step 0: Welcome */
  const renderWelcome = () => (
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
      <img src="/logo.png" alt="TradeLog" style={{ width: 72, height: 72, borderRadius: 14, mixBlendMode: 'screen' }} />
      <div>
        <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -.5 }}>
          {isHe ? '👋 ברוך הבא ל-TradeLog!' : '👋 Welcome to TradeLog!'}
        </h2>
        <p style={{ color: T2, marginTop: 10, lineHeight: 1.6, fontSize: 15 }}>
          {isHe
            ? 'יומן המסחר המקצועי לטריידרים בחוזים עתידיים.\nננחה אותך בהגדרות הראשוניות — לוקח פחות מ-2 דקות.'
            : 'The professional trading journal for futures traders.\nLet\'s get you set up in under 2 minutes.'}
        </p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 4 }}>
        {['📊 Analytics', '🏆 Prop Firm', '🔄 Auto Import', '💼 Business'].map(f => (
          <span key={f} style={{ background: S2, border: `1px solid ${BD}`, borderRadius: 999, padding: '5px 14px', fontSize: 13, color: T2 }}>{f}</span>
        ))}
      </div>
      <Btn onClick={() => setStep(1)}>{isHe ? 'בואו נתחיל ←' : "Let's go →"}</Btn>
    </div>
  );

  /* Step 1: Account */
  const renderAccount = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>
          {isHe ? '🏦 הגדר את החשבון הראשון שלך' : '🏦 Set up your first account'}
        </h3>
        <p style={{ color: T2, fontSize: 13, margin: 0 }}>
          {isHe ? 'אפשר להוסיף עוד חשבונות בהגדרות בכל זמן.' : 'You can add more accounts in Settings anytime.'}
        </p>
      </div>

      <Input
        label={isHe ? 'שם החשבון' : 'Account name'}
        value={accName}
        onChange={setAccName}
        placeholder={isHe ? 'למשל: Topstep 50K, Live NQ...' : 'e.g. Topstep 50K, Live NQ...'}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label style={{ fontSize: 12, color: T2, fontWeight: 500 }}>{isHe ? 'סוג חשבון' : 'Account type'}</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {([
            ['prop_firm', isHe ? 'Prop Firm' : 'Prop Firm'],
            ['personal',  isHe ? 'Live אישי' : 'Personal Live'],
            ['demo',      isHe ? 'Sim / Eval' : 'Sim / Eval'],
          ] as [AccountType, string][]).map(([val, label]) => (
            <button key={val} onClick={() => setAccType(val)} style={{
              flex: 1, padding: '9px 8px', borderRadius: 8, border: `1px solid ${accType === val ? G : BD}`,
              background: accType === val ? 'rgba(29,185,84,.12)' : S2,
              color: accType === val ? G : T2, cursor: 'pointer', fontSize: 13, fontWeight: accType === val ? 700 : 400,
            }}>{label}</button>
          ))}
        </div>
      </div>

      <Input
        label={isHe ? 'יתרה התחלתית ($)' : 'Starting balance ($)'}
        value={accBalance}
        onChange={setAccBalance}
        type="number"
        placeholder="50000"
      />

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
        <Btn variant="ghost" onClick={() => setStep(2)}>{isHe ? 'דלג' : 'Skip'}</Btn>
        <Btn onClick={() => setStep(2)} disabled={!accName.trim()}>
          {isHe ? 'המשך ←' : 'Continue →'}
        </Btn>
      </div>
    </div>
  );

  /* Step 2: Daily Goals */
  const renderGoals = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>
          {isHe ? '🎯 הגדר יעדים יומיים' : '🎯 Set daily goals'}
        </h3>
        <p style={{ color: T2, fontSize: 13, margin: 0, lineHeight: 1.6 }}>
          {isHe
            ? 'סרגל היעד היומי מופיע בראש לוח הבקרה ועוזר לך לדעת מתי להפסיק לסחור.'
            : 'The daily goal bar appears at the top of your dashboard and helps you know when to stop trading.'}
        </p>
      </div>

      {/* Preview bar */}
      <div style={{ background: S2, borderRadius: 10, padding: 14, border: `1px solid ${BD}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: T2 }}>{isHe ? 'יעד רווח' : 'Profit target'}</span>
          <span style={{ fontSize: 12, color: G, fontWeight: 700 }}>${parseFloat(goalTarget) || 500}</span>
        </div>
        <div style={{ height: 6, background: '#333', borderRadius: 999, marginBottom: 10 }}>
          <div style={{ height: '100%', width: '35%', background: G, borderRadius: 999 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: T2 }}>{isHe ? 'מקסימום הפסד' : 'Max loss'}</span>
          <span style={{ fontSize: 12, color: '#ff4d60', fontWeight: 700 }}>${parseFloat(goalMaxLoss) || 200}</span>
        </div>
        <div style={{ height: 6, background: '#333', borderRadius: 999 }}>
          <div style={{ height: '100%', width: '15%', background: '#ff4d60', borderRadius: 999 }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Input label={isHe ? 'יעד רווח יומי ($)' : 'Daily profit target ($)'} value={goalTarget} onChange={setGoalTarget} type="number" placeholder="500" />
        <Input label={isHe ? 'מקסימום הפסד יומי ($)' : 'Daily max loss ($)'} value={goalMaxLoss} onChange={setGoalMaxLoss} type="number" placeholder="200" />
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
        <Btn variant="ghost" onClick={() => setStep(3)}>{isHe ? 'דלג' : 'Skip'}</Btn>
        <Btn onClick={() => setStep(3)}>{isHe ? 'המשך ←' : 'Continue →'}</Btn>
      </div>
    </div>
  );

  /* Step 3: Feature Tour */
  const feat = FEATURES[featureIdx];
  const renderFeatures = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>
          {isHe ? '✨ מה יש לך כאן' : '✨ What you have here'}
        </h3>
        <p style={{ color: T2, fontSize: 13, margin: 0 }}>
          {isHe ? `${featureIdx + 1} מתוך ${FEATURES.length}` : `${featureIdx + 1} of ${FEATURES.length}`}
        </p>
      </div>

      {/* Feature card */}
      <div style={{
        background: S2, border: `1px solid ${BD}`, borderRadius: 14,
        padding: 24, display: 'flex', flexDirection: 'column', gap: 14,
        borderTopColor: feat.color, borderTopWidth: 2, minHeight: 200,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ background: `${feat.color}18`, border: `1px solid ${feat.color}40`, borderRadius: 12, padding: 10, lineHeight: 1 }}>
            {feat.svg}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{feat.icon}</div>
            <h4 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 8px', color: feat.color }}>
              {isHe ? feat.title : feat.titleEn}
            </h4>
            <p style={{ color: T2, fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              {isHe ? feat.desc : feat.descEn}
            </p>
          </div>
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        {FEATURES.map((_, i) => (
          <button key={i} onClick={() => setFeatureIdx(i)} style={{
            width: i === featureIdx ? 18 : 6, height: 6, borderRadius: 999, border: 'none',
            background: i === featureIdx ? feat.color : i < featureIdx ? `${feat.color}50` : BD,
            cursor: 'pointer', padding: 0, transition: 'all .25s',
          }} />
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', marginTop: 4 }}>
        <Btn variant="ghost" onClick={() => featureIdx > 0 ? setFeatureIdx(f => f - 1) : undefined}>
          {isHe ? '→ הקודם' : '← Prev'}
        </Btn>
        {featureIdx < FEATURES.length - 1
          ? <Btn onClick={() => setFeatureIdx(f => f + 1)}>{isHe ? 'הבא ←' : 'Next →'}</Btn>
          : <Btn onClick={() => setStep(4)}>{isHe ? 'סיים סיור ←' : 'Finish tour →'}</Btn>
        }
      </div>
    </div>
  );

  /* Step 4: Done */
  const renderDone = () => (
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
        <button onClick={() => finish('trade')} style={{
          background: G, color: '#000', border: 'none', borderRadius: 999,
          padding: '13px 24px', fontSize: 15, fontWeight: 800, cursor: 'pointer',
        }}>
          {isHe ? '✏️ הוסף עסקה ראשונה' : '✏️ Add first trade'}
        </button>
        <button onClick={() => finish('import')} style={{
          background: S2, color: '#fff', border: `1px solid ${BD}`, borderRadius: 999,
          padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          {isHe ? '🔄 ייבא מ-Tradovate / TopstepX' : '🔄 Import from Tradovate / TopstepX'}
        </button>
        <button onClick={() => finish('dashboard')} style={{
          background: 'transparent', color: T2, border: 'none',
          padding: '10px 24px', fontSize: 13, cursor: 'pointer', textDecoration: 'underline',
        }}>
          {isHe ? 'עבור ללוח הבקרה' : 'Go to dashboard'}
        </button>
      </div>
    </div>
  );

  const steps = [renderWelcome, renderAccount, renderGoals, renderFeatures, renderDone];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
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
        <Dots total={TOTAL_STEPS} current={step} />
        {steps[step]?.()}
      </div>
    </div>
  );
}
