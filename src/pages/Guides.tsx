import { useState, useEffect } from 'react';
import './guides.css';

const SECTIONS = [
  { id: 'quickstart', emoji: '🚀', title: 'התחלה מהירה', desc: 'מהרשמה לדשבורד פעיל ב-3 שלבים', time: '3 דק׳' },
  { id: 'add-trade', emoji: '✏️', title: 'הוספת עסקה', desc: 'הוספה ידנית מלאה עם R:R Calculator', time: '4 דק׳' },
  { id: 'import', emoji: '⚡', title: 'ייבוא אוטומטי', desc: 'TopstepX ו-Tradovate ישירות לחשבון', time: '5 דק׳' },
  { id: 'dashboard', emoji: '📊', title: 'דשבורד ולוח שנה', desc: 'קריאת KPIs, לוח שנה ועקומת הון', time: '4 דק׳' },
  { id: 'analytics', emoji: '📈', title: 'אנליטיקס', desc: '8 גרפים לזיהוי דפוסי המסחר שלך', time: '6 דק׳' },
  { id: 'propfirm', emoji: '🏆', title: 'Prop Firm Tracker', desc: 'Drawdown, Daily Limit ו-Profit Target', time: '5 דק׳' },
];

/* ────────────── Mockup Components ────────────── */

function QuickStartMockup() {
  return (
    <div className="guide-mockup">
      <div className="gm-flow">
        <div className="gm-flow-step">
          <div className="gm-flow-icon" style={{ background: '#1DB954', fontSize: '1rem' }}>G</div>
          <div className="gm-flow-label">כניסה עם<br/>Google</div>
        </div>
        <div className="gm-flow-arrow">←</div>
        <div className="gm-flow-step">
          <div className="gm-flow-icon" style={{ background: '#1565C0', fontSize: '1.2rem' }}>+</div>
          <div className="gm-flow-label">יצירת<br/>חשבון</div>
        </div>
        <div className="gm-flow-arrow">←</div>
        <div className="gm-flow-step">
          <div className="gm-flow-icon" style={{ background: '#F59B23', fontSize: '1rem' }}>📝</div>
          <div className="gm-flow-label">עסקה<br/>ראשונה</div>
        </div>
      </div>
      <div style={{ background: '#181818', borderRadius: 10, padding: '12px 16px', marginTop: 8, border: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ fontSize: '.70rem', color: 'rgba(255,255,255,.35)', marginBottom: 8, fontWeight: 600, letterSpacing: '.06em' }}>הגדרת חשבון ראשון</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[
            { label: 'שם החשבון', val: 'Apex — MNQ Live' },
            { label: 'סוג חשבון', val: 'Prop Firm' },
            { label: 'יתרה התחלתית', val: '$50,000' },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.4)' }}>{f.label}</span>
              <span style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.75)', background: '#282828', padding: '3px 8px', borderRadius: 6 }}>{f.val}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#1DB954', color: '#000', fontWeight: 700, fontSize: '.78rem', textAlign: 'center', padding: '7px', borderRadius: 999, marginTop: 12 }}>
          צור חשבון
        </div>
      </div>
    </div>
  );
}

function TradeFormMockup() {
  return (
    <div className="guide-mockup">
      <div className="gm-modal-title">✏️ עסקה חדשה</div>
      <div className="gm-field">
        <label>סמל</label>
        <div className="gm-select">
          <span>MNQ — Micro Nasdaq</span><span style={{ color: 'rgba(255,255,255,.3)' }}>▾</span>
        </div>
      </div>
      <div className="gm-direction-row">
        <div className="gm-dir-btn gm-long">▲ LONG</div>
        <div className="gm-dir-btn gm-short-inactive">▼ SHORT</div>
      </div>
      <div className="gm-fields-row">
        <div className="gm-field">
          <label>כניסה</label>
          <div className="gm-input">21,450</div>
        </div>
        <div className="gm-field">
          <label>יציאה</label>
          <div className="gm-input">21,530</div>
        </div>
        <div className="gm-field">
          <label>כמות</label>
          <div className="gm-input">1</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
        <div className="gm-field">
          <label>Stop Loss</label>
          <div className="gm-input">21,420</div>
        </div>
        <div className="gm-field">
          <label>Take Profit</label>
          <div className="gm-input">21,540</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex:1, background: 'rgba(29,185,84,.08)', border: '1px solid rgba(29,185,84,.2)', borderRadius: 8, padding: '7px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '.60rem', color: 'rgba(255,255,255,.4)', marginBottom: 2 }}>R:R</div>
          <div style={{ fontSize: '.88rem', fontWeight: 700, color: '#1DB954' }}>1 : 3.0</div>
        </div>
        <div style={{ flex:1, background: 'rgba(29,185,84,.08)', border: '1px solid rgba(29,185,84,.2)', borderRadius: 8, padding: '7px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '.60rem', color: 'rgba(255,255,255,.4)', marginBottom: 2 }}>P&L</div>
          <div style={{ fontSize: '.88rem', fontWeight: 700, color: '#1DB954' }}>+$160</div>
        </div>
        <div style={{ flex:1, background: '#1e1e1e', border: '1px solid rgba(255,255,255,.08)', borderRadius: 8, padding: '7px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '.60rem', color: 'rgba(255,255,255,.4)', marginBottom: 2 }}>Max Risk</div>
          <div style={{ fontSize: '.88rem', fontWeight: 700, color: '#F59B23' }}>$60</div>
        </div>
      </div>
      <div className="gm-save-btn">שמור עסקה</div>
    </div>
  );
}

function ImportMockup() {
  return (
    <div className="guide-mockup">
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['TopstepX', 'Tradovate', 'CSV'].map((t, i) => (
          <div key={t} style={{
            fontSize: '.70rem', padding: '4px 10px', borderRadius: 999,
            background: i === 0 ? 'rgba(29,185,84,.15)' : '#222',
            color: i === 0 ? '#1DB954' : 'rgba(255,255,255,.35)',
            border: `1px solid ${i === 0 ? 'rgba(29,185,84,.3)' : 'rgba(255,255,255,.08)'}`,
            fontWeight: 600,
          }}>{t}</div>
        ))}
      </div>
      <div className="gm-settings-title" style={{ fontSize: '.82rem' }}>חיבור TopstepX</div>
      <div className="gm-field">
        <label>שם משתמש (אימייל)</label>
        <div className="gm-input">trader@example.com</div>
      </div>
      <div className="gm-field">
        <label>API Key</label>
        <div className="gm-input gm-masked">••••••••••••••••••••</div>
      </div>
      <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.30)', marginBottom: 10, lineHeight: 1.5 }}>
        ניתן למצוא את ה-API Key בהגדרות חשבון TopstepX תחת "Integrations"
      </div>
      <div className="gm-connect-row">
        <div className="gm-connect-btn">חבר</div>
        <div className="gm-status-badge">✓ מחובר</div>
      </div>
      <div style={{ height: 1, background: 'rgba(255,255,255,.07)', margin: '12px 0' }} />
      <div className="gm-sync-btn">⟳ סנכרן עכשיו</div>
      <div className="gm-sync-info">סונכרנו 47 עסקאות · עדכון אחרון לפני שעתיים</div>
    </div>
  );
}

function DashboardMockup() {
  const kpis = [
    { label: 'Win Rate', val: '64%', color: '#1DB954' },
    { label: 'Net P&L', val: '+$2,840', color: '#1DB954' },
    { label: 'Best Day', val: '+$680', color: '#1DB954' },
    { label: 'Trades', val: '38', color: 'rgba(255,255,255,.7)' },
  ];
  const calData = [
    null, null, 240, -80, 340, null, null,
    null, 120, -200, 560, 90, null, null,
    null, 180, -60, 420, 220, null, null,
  ];
  return (
    <div className="guide-mockup">
      <div className="gm-kpi-row">
        {kpis.map(k => (
          <div key={k.label} className="gm-kpi">
            <div className="gm-kpi-label">{k.label}</div>
            <div className="gm-kpi-val" style={{ color: k.color }}>{k.val}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.3)', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
        <span>אפריל 2026</span><span>P&L: +$2,840</span>
      </div>
      <div className="gm-cal-grid">
        {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(d => (
          <div key={d} className="gm-cal-head">{d}</div>
        ))}
        {calData.map((pnl, i) => (
          <div key={i} className={`gm-cal-cell ${pnl === null ? '' : pnl > 0 ? 'gm-green' : 'gm-red'}`}>
            {pnl !== null && <span>{pnl > 0 ? '+' : ''}{pnl}</span>}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, background: '#181818', borderRadius: 8, padding: '8px 10px', border: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ fontSize: '.65rem', color: 'rgba(255,255,255,.3)', marginBottom: 6 }}>עסקאות אחרונות</div>
        {[
          { sym: 'MNQ', dir: 'L', pnl: +160, date: 'היום' },
          { sym: 'NQ', dir: 'S', pnl: -80, date: 'אתמול' },
          { sym: 'MNQ', dir: 'L', pnl: +240, date: '24 אפר' },
        ].map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: t.dir === 'L' ? 'rgba(29,185,84,.2)' : 'rgba(255,77,96,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.60rem', fontWeight: 700, color: t.dir === 'L' ? '#1DB954' : '#ff4d60' }}>{t.dir}</div>
            <span style={{ flex: 1, fontSize: '.72rem', color: 'rgba(255,255,255,.6)' }}>{t.sym}</span>
            <span style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.35)' }}>{t.date}</span>
            <span style={{ fontSize: '.75rem', fontWeight: 700, color: t.pnl > 0 ? '#1DB954' : '#ff4d60' }}>{t.pnl > 0 ? '+' : ''}${Math.abs(t.pnl)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsMockup() {
  const bars = [
    { day: 'א׳', pct: -30, pnl: -240 },
    { day: 'ב׳', pct: 75, pnl: 600 },
    { day: 'ג׳', pct: 55, pnl: 440 },
    { day: 'ד׳', pct: 90, pnl: 720 },
    { day: 'ה׳', pct: 65, pnl: 520 },
    { day: 'ו׳', pct: 35, pnl: 280 },
  ];
  return (
    <div className="guide-mockup">
      <div className="gm-tabs-row">
        {['P&L לפי יום', 'Equity', 'Drawdown', 'Heatmap'].map((t, i) => (
          <div key={t} className={`gm-tab ${i === 0 ? 'gm-tab-active' : ''}`}>{t}</div>
        ))}
      </div>
      <div style={{ fontSize: '.68rem', color: 'rgba(255,255,255,.3)', marginBottom: 10 }}>
        P&L לפי יום בשבוע — אפריל 2026
      </div>
      <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', height: 110, marginBottom: 6 }}>
        {bars.map(b => (
          <div key={b.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <div style={{ fontSize: '.52rem', fontWeight: 700, color: b.pct > 0 ? '#1DB954' : '#ff4d60' }}>
              {b.pnl > 0 ? '+' : ''}{b.pnl}
            </div>
            <div style={{ width: '100%', height: `${Math.abs(b.pct)}%`, background: b.pct > 0 ? '#1DB954' : '#ff4d60', borderRadius: '4px 4px 0 0', opacity: 0.85, minHeight: 3 }} />
            <div style={{ fontSize: '.58rem', color: 'rgba(255,255,255,.3)' }}>{b.day}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5, marginTop: 10 }}>
        {[
          { label: 'Win Rate', val: '64%' }, { label: 'Avg Win', val: '$512' },
          { label: 'Avg Loss', val: '$240' }, { label: 'R:R ממוצע', val: '2.1' },
        ].map(s => (
          <div key={s.label} style={{ background: '#1a1a1a', borderRadius: 7, padding: '6px 8px', border: '1px solid rgba(255,255,255,.07)' }}>
            <div style={{ fontSize: '.58rem', color: 'rgba(255,255,255,.3)' }}>{s.label}</div>
            <div style={{ fontSize: '.80rem', fontWeight: 700, color: 'rgba(255,255,255,.85)' }}>{s.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PropFirmMockup() {
  return (
    <div className="guide-mockup">
      <div className="gm-pf-header">
        <span className="gm-pf-name">Apex — MNQ Live</span>
        <span className="gm-pf-badge gm-safe">● SAFE</span>
      </div>
      <div className="gm-pf-balance">$52,840</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 16 }}>
        {[
          { label: 'רצפה', val: '$47,000', color: '#ff4d60' },
          { label: 'יעד', val: '$55,000', color: '#1DB954' },
          { label: 'P&L היום', val: '+$420', color: '#1DB954' },
        ].map(k => (
          <div key={k.label} style={{ background: '#1a1a1a', borderRadius: 8, padding: '7px', border: '1px solid rgba(255,255,255,.07)', textAlign: 'center' }}>
            <div style={{ fontSize: '.60rem', color: 'rgba(255,255,255,.3)', marginBottom: 2 }}>{k.label}</div>
            <div style={{ fontSize: '.78rem', fontWeight: 700, color: k.color }}>{k.val}</div>
          </div>
        ))}
      </div>
      <div className="gm-meter">
        <div className="gm-meter-label">
          <span>Trailing Drawdown</span><span style={{ color: '#F59B23' }}>38% בשימוש</span>
        </div>
        <div className="gm-meter-bar">
          <div className="gm-meter-fill" style={{ width: '38%', background: 'linear-gradient(90deg,#1DB954,#F59B23)' }} />
        </div>
        <div className="gm-meter-sub">נותר: $1,860 מתוך $3,000 מקסימום</div>
      </div>
      <div className="gm-meter">
        <div className="gm-meter-label">
          <span>Profit Target</span><span style={{ color: '#1DB954' }}>61% הושג</span>
        </div>
        <div className="gm-meter-bar">
          <div className="gm-meter-fill gm-fill-profit" style={{ width: '61%' }} />
        </div>
        <div className="gm-meter-sub">P&L: $3,050 מתוך יעד $5,000</div>
      </div>
      <div className="gm-meter">
        <div className="gm-meter-label">
          <span>Daily Loss Limit</span><span style={{ color: '#1DB954' }}>21% בשימוש</span>
        </div>
        <div className="gm-meter-bar">
          <div className="gm-meter-fill" style={{ width: '21%', background: '#1DB954' }} />
        </div>
        <div className="gm-meter-sub">נותר: $790 להיום · הגבלה: $1,000/יום</div>
      </div>
    </div>
  );
}

/* ────────────── Prev / Next nav ────────────── */

function GuideNav({ currentId }: { currentId: string }) {
  const idx = SECTIONS.findIndex(s => s.id === currentId);
  const prev = idx > 0 ? SECTIONS[idx - 1] : null;
  const next = idx < SECTIONS.length - 1 ? SECTIONS[idx + 1] : null;
  return (
    <div className="guide-nav-row">
      {next ? (
        <a href={`#${next.id}`} className="guide-nav-btn guide-nav-next">
          <span className="guide-nav-emoji">{next.emoji}</span>
          <span className="guide-nav-label">
            <span className="guide-nav-hint">המדריך הבא</span>
            <span className="guide-nav-title">{next.title}</span>
          </span>
          <span className="guide-nav-arrow">←</span>
        </a>
      ) : <div />}
      {prev ? (
        <a href={`#${prev.id}`} className="guide-nav-btn guide-nav-prev">
          <span className="guide-nav-arrow">→</span>
          <span className="guide-nav-label">
            <span className="guide-nav-hint">המדריך הקודם</span>
            <span className="guide-nav-title">{prev.title}</span>
          </span>
          <span className="guide-nav-emoji">{prev.emoji}</span>
        </a>
      ) : <div />}
    </div>
  );
}

/* ────────────── Main Component ────────────── */

export default function Guides() {
  const [activeSection, setActiveSection] = useState('quickstart');

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-15% 0px -75% 0px' }
    );
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="guides-page">
      {/* Header */}
      <div className="guides-header">
        <a href="/" className="btn btn-ghost" style={{ textDecoration: 'none' }}>← דף הבית</a>
        <div className="guides-logo">
          <img src="/logo.png" alt="TraderYo" style={{ height: 36, width: 36, objectFit: 'contain', borderRadius: 8, mixBlendMode: 'screen' }} />
          <span>TraderYo</span>
        </div>
        <div style={{ width: 80 }} />
      </div>

      {/* Hero */}
      <div className="guides-hero">
        <h1>מדריכים לשימוש ב-TraderYo</h1>
        <p>כל מה שצריך לדעת כדי לנהל יומן מסחר מקצועי — מהגדרה ועד אנליזה מתקדמת</p>
      </div>

      {/* Cards */}
      <div className="guides-cards">
        {SECTIONS.map(s => (
          <a key={s.id} href={`#${s.id}`} className="guide-card">
            <span className="guide-card-emoji">{s.emoji}</span>
            <div className="guide-card-content">
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
            <span className="guide-card-time">{s.time}</span>
          </a>
        ))}
      </div>

      {/* ── Layout: TOC + Content ── */}
      <div className="guides-with-toc">

        {/* Main content */}
        <div className="guides-content">

        {/* 1. Quick Start */}
        <section id="quickstart" className="guide-section">
          <div className="guide-section-header">
            <span className="guide-section-num">01</span>
            <h2>התחלה מהירה</h2>
            <span className="guide-section-time">🚀 3 דק׳ קריאה</span>
          </div>
          <div className="guide-section-body">
            <div className="guide-steps">
              <div className="guide-step">
                <div className="guide-step-num">1</div>
                <div className="guide-step-body">
                  <h3>כניסה עם Google</h3>
                  <p>לחץ על "התחל עכשיו" בדף הבית ולאחר מכן על "Sign in with Google". אין צורך בסיסמה — Google OAuth מטפל בכל ההתחברות בצורה מאובטחת.</p>
                  <div className="guide-tip"><strong>💡 טיפ:</strong> השתמש באותו חשבון Google בכל כניסה כדי שהנתונים שלך יישמרו.</div>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">2</div>
                <div className="guide-step-body">
                  <h3>הגדרת חשבון מסחר ראשון</h3>
                  <p>לאחר הכניסה, לחץ על <strong>"+ חשבון חדש"</strong> בהגדרות. הזן שם לחשבון, בחר סוג (Live / Prop Firm / Sim), והזן יתרה התחלתית.</p>
                  <div className="guide-tip"><strong>💡 טיפ:</strong> ניתן להוסיף מספר חשבונות ולעבור ביניהם בכפתורי הטאבים בחלק העליון.</div>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">3</div>
                <div className="guide-step-body">
                  <h3>הוספת העסקה הראשונה</h3>
                  <p>לחץ על הכפתור הירוק <strong>"+ עסקה חדשה"</strong> (בהדר על מסך מחשב, בתחתית המסך על מובייל). מלא את הפרטים ולחץ "שמור". הדשבורד יתעדכן מיד.</p>
                  <div className="guide-tip"><strong>💡 טיפ:</strong> רוצה לבדוק קודם? לחץ "נסה דמו" בדף הבית לגישה לנתוני דמו ללא הרשמה.</div>
                </div>
              </div>
              <div className="guide-callout">
                <h4>📱 גישה ממובייל</h4>
                <ul>
                  <li>TraderYo עובד מלא על מובייל — ניווט תחתון, לחצנים גדולים, RTL מלא</li>
                  <li>ניתן להוסיף לדף הבית של הנייד כ-PWA לחוויית אפליקציה</li>
                </ul>
              </div>
            </div>
            <QuickStartMockup />
          </div>
          <GuideNav currentId="quickstart" />
        </section>

        {/* 2. Add Trade */}
        <section id="add-trade" className="guide-section">
          <div className="guide-section-header">
            <span className="guide-section-num">02</span>
            <h2>הוספת עסקה ידנית</h2>
            <span className="guide-section-time">✏️ 4 דק׳ קריאה</span>
          </div>
          <div className="guide-section-body visual-left" style={{ direction: 'rtl' }}>
            <TradeFormMockup />
            <div className="guide-steps">
              <div className="guide-step">
                <div className="guide-step-num">1</div>
                <div className="guide-step-body">
                  <h3>בחירת סמל (Symbol)</h3>
                  <p>לחץ על שדה הסמל לפתיחת ה-Symbol Picker. ניתן לחפש לפי שם (למשל "MNQ") או לגלול בין יותר מ-50 חוזים עתידיים מסווגים לפי קטגוריה (Indices, Metals, Energy, Bonds).</p>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">2</div>
                <div className="guide-step-body">
                  <h3>כיוון: Long או Short</h3>
                  <p>בחר <strong>LONG</strong> אם פתחת פוזיציית קנייה, <strong>SHORT</strong> אם פתחת פוזיציית מכירה. TraderYo יתאים את חישוב ה-P&L בהתאם.</p>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">3</div>
                <div className="guide-step-body">
                  <h3>מחיר כניסה, יציאה וכמות</h3>
                  <p>הזן מחיר כניסה, מחיר יציאה וכמות חוזים. ה-P&L יחושב אוטומטית לפי <strong>Point Value</strong> המדויק של הסמל (MNQ = $2 לנקודה, NQ = $20, ES = $50 וכדומה).</p>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">4</div>
                <div className="guide-step-body">
                  <h3>R:R Calculator</h3>
                  <p>הזן Stop Loss ו-Take Profit לקבלת חישוב <strong>R:R אוטומטי</strong> ו-Max Risk בדולרים. זהו כלי מצוין לתכנון עסקאות עתידיות לפי יחס סיכוי/סיכון.</p>
                  <div className="guide-tip"><strong>💡 טיפ:</strong> R:R מינימלי מומלץ של 1:2 — לכל $1 סיכון, שאף ל-$2 רווח.</div>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">5</div>
                <div className="guide-step-body">
                  <h3>תמונות ותגיות</h3>
                  <p>ניתן לצרף צילומי מסך (גרף, Setup) בגרירה לאזור ה-Media. הוסף <strong>אסטרטגיה</strong> ו<strong>תגיות</strong> לסיווג ופילטור עתידי.</p>
                  <div className="guide-tip"><strong>💡 טיפ:</strong> תג עקבי (למשל "Breakout", "FOMO") מאפשר לך לראות בגרפי האנליטיקס מה עובד ומה לא.</div>
                </div>
              </div>
            </div>
          </div>
          <GuideNav currentId="add-trade" />
        </section>

        {/* 3. Import */}
        <section id="import" className="guide-section">
          <div className="guide-section-header">
            <span className="guide-section-num">03</span>
            <h2>ייבוא אוטומטי מברוקרים</h2>
            <span className="guide-section-time">⚡ 5 דק׳ קריאה</span>
          </div>
          <div className="guide-section-body">
            <div className="guide-steps">
              <div className="guide-step">
                <div className="guide-step-num">1</div>
                <div className="guide-step-body">
                  <h3>כניסה להגדרות → ייבוא ברוקר</h3>
                  <p>לחץ על "הגדרות" בסרגל הניווט, גלול לסקציה <strong>"חיבור ברוקר"</strong>. בחר את הברוקר הרצוי מהטאבים: TopstepX, Tradovate, או ייבוא CSV.</p>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">2</div>
                <div className="guide-step-body">
                  <h3>TopstepX — API Key</h3>
                  <p>ב-TopstepX, הכנס לחשבון שלך ← <strong>Account Settings ← Integrations</strong> — שם תמצא את ה-API Key. הדבק אותו בשדה ה-API Key ב-TraderYo ולחץ "חבר".</p>
                  <div className="guide-tip"><strong>💡 מה קורה:</strong> TraderYo מתחבר ל-ProjectX API, מאמת את הפרטים ומושך את ה-Account ID שלך אוטומטית.</div>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">3</div>
                <div className="guide-step-body">
                  <h3>סנכרון ראשון — 90 יום אחרונים</h3>
                  <p>לחץ <strong>"סנכרן עכשיו"</strong>. הסנכרון הראשון יושך עסקאות מ-90 יום אחרונים. סנכרון עתידי ישמש את תאריך הסנכרון האחרון כנקודת התחלה.</p>
                  <div className="guide-warn"><strong>⚠ שים לב:</strong> עסקאות חצי-פוזיציה (fills חלקיים) ועסקאות מבוטלות מסוננות אוטומטית.</div>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">4</div>
                <div className="guide-step-body">
                  <h3>Tradovate — ייבוא CSV</h3>
                  <p>ב-Tradovate, עבור ל-<strong>Account ← Reports ← Performance</strong> וייצא CSV. גרור את הקובץ לאזור הייבוא ב-TraderYo — המערכת תנתח את הנתונים ותוסיף את העסקאות אוטומטית.</p>
                  <div className="guide-tip"><strong>💡 טיפ:</strong> TraderYo מנרמל סמלים אוטומטית: MNQM6 → MNQ, ESHU25 → ES וכדומה.</div>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">5</div>
                <div className="guide-step-body">
                  <h3>מניעת כפילויות</h3>
                  <p>בכל סנכרון, TraderYo בודק לפי <strong>broker_trade_id</strong> ייחודי — כך שאם תסנכרן שוב, לא ייווצרו עסקאות כפולות.</p>
                </div>
              </div>
            </div>
            <ImportMockup />
          </div>
          <GuideNav currentId="import" />
        </section>

        {/* 4. Dashboard */}
        <section id="dashboard" className="guide-section">
          <div className="guide-section-header">
            <span className="guide-section-num">04</span>
            <h2>דשבורד ולוח שנה</h2>
            <span className="guide-section-time">📊 4 דק׳ קריאה</span>
          </div>
          <div className="guide-section-body visual-left" style={{ direction: 'rtl' }}>
            <DashboardMockup />
            <div className="guide-steps">
              <div className="guide-step">
                <div className="guide-step-num">1</div>
                <div className="guide-step-body">
                  <h3>KPI Cards — 6 מדדים עיקריים</h3>
                  <p>שורת ה-KPIs בחלק העליון מציגה: <strong>Win Rate</strong>, Net P&L, Total Trades, Best Day, Worst Day, ו-Profit Factor. כל המדדים מחושבים מהעסקאות בחשבון/תקופה שנבחרו.</p>
                  <div className="guide-tip"><strong>💡 טיפ:</strong> ניתן לסנן לפי חשבון ספציפי בכפתורי הטאב בחלק העליון של המסך.</div>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">2</div>
                <div className="guide-step-body">
                  <h3>לוח השנה — ניתוח יומי</h3>
                  <p>כל תא מציג: <strong>P&L יומי</strong> (ירוק/אדום), <strong>Win Rate pill</strong> צבעוני (ירוק ≥60%, כתום 40-60%, אדום &lt;40%), ותגיות הסמלים שנסחרו.</p>
                  <p>עמודת השבוע בצד מסכמת P&L + Win Rate שבועי.</p>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">3</div>
                <div className="guide-step-body">
                  <h3>MiniEquityChart — עקומת הון</h3>
                  <p>הגרף מציג את <strong>P&L מצטבר לאורך החודש</strong> הנוכחי — קו ירוק כשהתוצאה חיובית, אדום כשלילית, עם נקודה בקצה המציגה את המצב הנוכחי.</p>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">4</div>
                <div className="guide-step-body">
                  <h3>RecentTrades ו-DailyGoalBar</h3>
                  <p>5 העסקאות האחרונות מוצגות עם אייקון כיוון (ירוק=Long, אדום=Short). לחיצה על עסקה פותחת אותה לעריכה.</p>
                  <p>DailyGoalBar מציג את ההתקדמות ליעד היומי שהגדרת בהגדרות.</p>
                </div>
              </div>
            </div>
          </div>
          <GuideNav currentId="dashboard" />
        </section>

        {/* 5. Analytics */}
        <section id="analytics" className="guide-section">
          <div className="guide-section-header">
            <span className="guide-section-num">05</span>
            <h2>אנליטיקס — 8 גרפים</h2>
            <span className="guide-section-time">📈 6 דק׳ קריאה</span>
          </div>
          <div className="guide-section-body">
            <div className="guide-steps">
              <div className="guide-step">
                <div className="guide-step-num">1</div>
                <div className="guide-step-body">
                  <h3>Equity Curve — מגמת הון</h3>
                  <p>גרף הקו הבסיסי: P&L מצטבר לאורך כל ימי המסחר. שימוש: זיהוי מגמות ארוכות טווח, תקופות שחיקה (drawdown), ושיאי הון.</p>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">2</div>
                <div className="guide-step-body">
                  <h3>Drawdown Chart — מקסימום הפסד רצוף</h3>
                  <p>מציג את ה-<strong>Max Drawdown</strong> בכל נקודת זמן — כמה ירדת מהשיא. שימוש: הבנת רמת הסיכון שנלקחה ואיתור תקופות בעייתיות.</p>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">3</div>
                <div className="guide-step-body">
                  <h3>P&L by Day of Week — הימים הטובים שלך</h3>
                  <p>עמודות P&L לפי יום בשבוע (א׳–ו׳). שימוש: זיהוי ביצועי שיא לפי יום — לדעת באיזה ימים כדאי להיות יותר אגרסיבי ובאיזה פחות.</p>
                  <div className="guide-tip"><strong>💡 דוגמה נפוצה:</strong> ימי שני ושישי לעיתים חלשים יותר — שקול להקטין סייז ביום אלה.</div>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">4</div>
                <div className="guide-step-body">
                  <h3>P&L by Symbol — החוזים הרווחיים</h3>
                  <p>השוואת ביצועים בין סמלים שונים. שימוש: גלה על אילו חוזים אתה מרוויח ואילו גורמים לך הפסד — ואולי כדאי להיצמד אליהם בלבד.</p>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">5</div>
                <div className="guide-step-body">
                  <h3>Monthly Heatmap + R:R Scatter + Streaks</h3>
                  <p><strong>Heatmap</strong>: רמת ביצועים לפי חודש ושנה בצבעי חום. <strong>R:R Scatter</strong>: פיזור כל העסקאות לפי R:R ו-P&L — גלה את ה-edge שלך. <strong>Streaks</strong>: רצפי ניצחונות והפסדים.</p>
                </div>
              </div>
              <div className="guide-callout">
                <h4>🔍 טיפ לשימוש מתקדם</h4>
                <ul>
                  <li>סנן לפי חשבון בטאבים העליונים לפני פתיחת אנליטיקס</li>
                  <li>השווה ביצועי חשבון Live מול Sim כדי לזהות הבדלי ביצועים</li>
                  <li>ה-Scatter Chart הוא הגרף החשוב ביותר — R:R גבוה + Win Rate ≥40% = מסחר רווחי</li>
                </ul>
              </div>
            </div>
            <AnalyticsMockup />
          </div>
          <GuideNav currentId="analytics" />
        </section>

        {/* 6. Prop Firm */}
        <section id="propfirm" className="guide-section">
          <div className="guide-section-header">
            <span className="guide-section-num">06</span>
            <h2>Prop Firm Tracker</h2>
            <span className="guide-section-time">🏆 5 דק׳ קריאה</span>
          </div>
          <div className="guide-section-body visual-left" style={{ direction: 'rtl' }}>
            <PropFirmMockup />
            <div className="guide-steps">
              <div className="guide-step">
                <div className="guide-step-num">1</div>
                <div className="guide-step-body">
                  <h3>הגדרת חשבון Prop Firm</h3>
                  <p>בהגדרות, צור חשבון חדש ובחר סוג <strong>"Prop Firm"</strong>. הגדר: יתרה התחלתית, Max Drawdown (דולרים), Daily Loss Limit, ו-Profit Target.</p>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">2</div>
                <div className="guide-step-body">
                  <h3>Trailing Drawdown — EOD ו-Intraday</h3>
                  <p>בחר בין <strong>EOD</strong> (Trailing עוקב אחרי שיא סוף יום) ו-<strong>Intraday</strong> (עוקב אחרי שיא בזמן אמת). Apex ו-Topstep משתמשים ב-Trailing EOD — בדוק את כלל ה-Prop Firm שלך.</p>
                  <div className="guide-warn"><strong>⚠ חשוב:</strong> TraderYo מחשב את ה-Trailing Floor בדיוק מלא לפי השיא ההיסטורי מכל עסקה.</div>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">3</div>
                <div className="guide-step-body">
                  <h3>קריאת מדי ה-Drawdown</h3>
                  <p>מד <strong>Drawdown</strong> מציג כמה מהמקסימום הותר כבר נוצל. צבעים: ירוק (&lt;50%), כתום (50-80%), אדום (&gt;80%). ברגע שהיתרה נוגעת ב-Floor — "Breached".</p>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">4</div>
                <div className="guide-step-body">
                  <h3>Daily Loss Limit</h3>
                  <p>המד מתאפס בחצות כל יום. אם P&L היום עוקב אחרי <strong>Daily Loss Limit</strong> — TraderYo מציג התראה אדומה. הפסקת מסחר ביום זה היא קריטית.</p>
                  <div className="guide-tip"><strong>💡 טיפ:</strong> הגדר Daily Limit ל-80% מהמותר כ"קו אדום אישי" — זה משאיר מרווח בטחון.</div>
                </div>
              </div>
              <div className="guide-step">
                <div className="guide-step-num">5</div>
                <div className="guide-step-body">
                  <h3>סטטוסים: Safe / Warning / Danger / Passed</h3>
                  <p><strong>Safe</strong> (ירוק) — הכל תקין. <strong>Warning</strong> (כתום) — Drawdown &gt;50% או יום כבד. <strong>Danger</strong> (אדום) — קרוב מאוד לפריצה. <strong>Passed</strong> — הגעת ליעד הרווח, מזל טוב! 🎉</p>
                </div>
              </div>
            </div>
          </div>
          <GuideNav currentId="propfirm" />
        </section>

        </div>{/* end guides-content */}

        {/* Sticky TOC sidebar */}
        <nav className="guides-toc">
          <div className="guides-toc-title">תוכן עניינים</div>
          {SECTIONS.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`guides-toc-item${activeSection === s.id ? ' active' : ''}`}
            >
              <span className="guides-toc-emoji">{s.emoji}</span>
              <span>{s.title}</span>
            </a>
          ))}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,.07)' }}>
            <a href="/" style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
              ← חזור לדף הבית
            </a>
          </div>
        </nav>

      </div>{/* end guides-with-toc */}

      {/* Footer */}
      <div style={{ textAlign: 'center', padding: '40px 24px', borderTop: '1px solid rgba(255,255,255,.07)', color: 'rgba(255,255,255,.25)', fontSize: '.78rem' }}>
        שאלות? פנה אלינו: <a href="mailto:tradelogisr@gmail.com" style={{ color: '#1DB954', textDecoration: 'none' }}>tradelogisr@gmail.com</a>
        <span style={{ margin: '0 12px' }}>·</span>
        <a href="/" style={{ color: 'rgba(255,255,255,.35)', textDecoration: 'none' }}>חזור לדף הבית</a>
      </div>
    </div>
  );
}
