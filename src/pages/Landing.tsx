import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import './landing.css';

const calColors = [
  '#3fe56c33','#3fe56c55','#ff406033','#3fe56c22','#3fe56c77',
  '#1c2026',  '#3fe56c44','#ff406044','#3fe56c33','#1c2026',
  '#3fe56c66','#1c2026',  '#3fe56c22','#3fe56c55','#ff406022',
  '#1c2026',  '#3fe56c44','#3fe56c33','#1c2026',  '#3fe56c77',
  '#ff406033','#3fe56c22','#3fe56c55','#1c2026',  '#3fe56c44',
  '#3fe56c33','#1c2026',  '#ff406055',
];

const equityPoints = '0,110 40,95 80,100 120,78 160,82 200,60 240,65 280,42 320,48 360,28 400,15';
const equityFill  = equityPoints + ' 400,130 0,130';

export default function Landing() {
  const navigate = useNavigate();
  const { loadDemoData, setUser } = useStore();

  const goAuth = () => navigate('/auth');

  const handleDemo = () => {
    loadDemoData();
    setUser({ id: 'demo', name: 'Demo User', email: 'demo@tradelog.app' });
    navigate('/dashboard');
  };

  return (
    <div className="lp" dir="rtl">
      {/* Nav — stays LTR so logo is always on the left */}
      <header className="lp-nav" dir="ltr">
        <div className="lp-nav-inner">
          <a className="lp-logo" href="/">
            <div className="lp-logo-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#003912" strokeWidth="2.8" strokeLinecap="round">
                <polyline points="3,17 9,11 13,15 21,6" />
              </svg>
            </div>
            TradeLog
          </a>
          <nav>
            <ul className="lp-nav-links">
              <li><a href="#features">פיצ׳רים</a></li>
              <li><a href="#pricing">מחירים</a></li>
              <li><a href="#advanced">יכולות</a></li>
            </ul>
          </nav>
          <div className="lp-nav-actions">
            <button className="lp-btn-ghost" onClick={goAuth}>התחברות</button>
            <button className="lp-btn-primary" onClick={goAuth}>התחל חינם</button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="lp-hero">
          <div className="lp-hero-inner">
            <div className="lp-badge">
              <div className="lp-badge-dot" />
              <span>14 יום ניסיון חינם · ללא כרטיס אשראי</span>
            </div>
            <h1>
              מסחר כמו מקצוען,<br />
              <span className="accent">ניתוח כמו מכונה</span>
            </h1>
            <p>
              יומן המסחר המתקדם ביותר לסוחרי חוזים עתידיים.
              עקוב אחרי כל עסקה, שלוט בפסיכולוגיה שלך, וחדד את היתרון שלך.
            </p>
            <div className="lp-hero-ctas">
              <button className="lp-btn-hero-primary" onClick={goAuth}>
                התחל ניסיון חינם — 14 יום
              </button>
              <button className="lp-btn-hero-secondary" onClick={handleDemo}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"/>
                </svg>
                צפה בהדגמה
              </button>
            </div>

            {/* Dashboard Mockup */}
            <div className="lp-mockup" dir="ltr">
              {/* Browser chrome */}
              <div className="lp-mockup-bar">
                <div className="lp-mockup-dot" style={{ background: '#ff5f57' }} />
                <div className="lp-mockup-dot" style={{ background: '#febc2e' }} />
                <div className="lp-mockup-dot" style={{ background: '#28c840' }} />
                <div style={{ flex: 1, height: 18, background: '#1a1f27', borderRadius: 4, marginInlineStart: 10, maxWidth: 220 }} />
              </div>

              {/* App shell */}
              <div className="lp-mockup-app">
                {/* Sidebar */}
                <div className="lp-mockup-sidebar">
                  <div className="lp-mockup-logo">
                    <div style={{ width: 20, height: 20, background: '#3fe56c', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#003912" strokeWidth="3" strokeLinecap="round">
                        <polyline points="3,17 9,11 13,15 21,6" />
                      </svg>
                    </div>
                    <span style={{ fontSize: '.65rem', fontWeight: 800, color: '#dfe2eb' }}>TradeLog</span>
                  </div>
                  {[
                    { label: 'Dashboard', active: true },
                    { label: 'עסקאות', active: false },
                    { label: 'Analytics', active: false },
                    { label: 'Reports', active: false },
                    { label: 'Prop Firm', active: false },
                  ].map(item => (
                    <div key={item.label} style={{
                      fontSize: '.58rem', padding: '5px 8px', borderRadius: 4,
                      color: item.active ? '#3fe56c' : '#4a5568',
                      background: item.active ? 'rgba(63,229,108,0.08)' : 'none',
                      borderInlineStart: item.active ? '2px solid #3fe56c' : '2px solid transparent',
                    }}>
                      {item.label}
                    </div>
                  ))}
                  {/* Mini KPIs */}
                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: "P&L היום", val: '+₪1,840', color: '#3fe56c' },
                      { label: 'Win Rate',  val: '68%',     color: '#3fe56c' },
                      { label: 'Max DD',    val: '-4.2%',   color: '#ff4060' },
                    ].map(k => (
                      <div key={k.label}>
                        <div style={{ fontSize: '.48rem', textTransform: 'uppercase', letterSpacing: '.06em', color: '#4a5568' }}>{k.label}</div>
                        <div style={{ fontSize: '.75rem', fontWeight: 800, color: k.color, fontFamily: 'monospace' }}>{k.val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main content */}
                <div className="lp-mockup-main">
                  {/* Top KPI strip */}
                  <div className="lp-mockup-kpi-row">
                    {[
                      { label: 'רווח כולל', val: '+₪18,420', color: '#3fe56c' },
                      { label: 'Win Rate',   val: '68%',      color: '#3fe56c' },
                      { label: 'Profit Factor', val: '2.84',  color: '#3fe56c' },
                      { label: 'עסקאות',     val: '142',      color: '#dfe2eb' },
                    ].map(k => (
                      <div key={k.label} className="lp-mockup-kpi">
                        <div style={{ fontSize: '.48rem', textTransform: 'uppercase', letterSpacing: '.06em', color: '#4a5568', marginBottom: 3 }}>{k.label}</div>
                        <div style={{ fontSize: '.82rem', fontWeight: 800, color: k.color, fontFamily: 'monospace' }}>{k.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Charts row */}
                  <div className="lp-mockup-charts">
                    {/* Equity Curve */}
                    <div className="lp-mockup-chart-panel">
                      <div style={{ fontSize: '.52rem', color: '#4a5568', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>Equity Curve</div>
                      <svg viewBox="0 0 400 130" preserveAspectRatio="none" style={{ width: '100%', height: 80 }}>
                        <defs>
                          <linearGradient id="eq-fill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3fe56c" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#3fe56c" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <polygon points={equityFill} fill="url(#eq-fill)" />
                        <polyline points={equityPoints} fill="none" stroke="#3fe56c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>

                    {/* Calendar heatmap */}
                    <div className="lp-mockup-chart-panel">
                      <div style={{ fontSize: '.52rem', color: '#4a5568', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.06em' }}>לוח שנה</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                        {calColors.map((c, i) => (
                          <div key={i} style={{ aspectRatio: '1', borderRadius: 2, background: c }} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Trade rows */}
                  <div className="lp-mockup-trades">
                    {[
                      { sym: 'NQ', dir: 'Long', pnl: '+₪920', pos: true },
                      { sym: 'ES', dir: 'Short', pnl: '-₪240', pos: false },
                      { sym: 'MNQ', dir: 'Long', pnl: '+₪460', pos: true },
                    ].map(t => (
                      <div key={t.sym + t.pnl} className="lp-mockup-trade-row">
                        <span style={{ fontSize: '.55rem', fontWeight: 700, color: '#dfe2eb', fontFamily: 'monospace', minWidth: 28 }}>{t.sym}</span>
                        <span style={{ fontSize: '.5rem', color: t.pos ? '#3fe56c' : '#ff4060', background: t.pos ? 'rgba(63,229,108,0.1)' : 'rgba(255,64,96,0.1)', padding: '1px 5px', borderRadius: 3 }}>{t.dir}</span>
                        <span style={{ fontSize: '.55rem', fontWeight: 700, color: t.pos ? '#3fe56c' : '#ff4060', fontFamily: 'monospace', marginInlineStart: 'auto' }}>{t.pnl}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="lp-social">
          <div className="lp-social-inner">
            <span className="lp-social-label">תואם לייבוא מ</span>
            <div className="lp-brokers">
              <div className="lp-broker">Tradovate</div>
              <div className="lp-broker">TopstepX</div>
              <div className="lp-broker">NinjaTrader</div>
              <div className="lp-broker">Rithmic</div>
            </div>
          </div>
        </section>

        {/* Features Bento */}
        <section className="lp-features" id="features">
          <div className="lp-features-grid">
            <div className="lp-card">
              <div className="lp-card-icon">📥</div>
              <h3>ייבוא עסקאות אוטומטי</h3>
              <p>
                סנכרן את נתוני הביצוע שלך מ-Tradovate ו-TopstepX בלחיצה אחת.
                ללא הזנה ידנית, ללא טעויות.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[85,60,92,45,78].map((w, i) => (
                  <div key={i} style={{ height: 6, borderRadius: 3, background: `rgba(63,229,108,${w / 120})`, width: `${w}%` }} />
                ))}
              </div>
            </div>

            <div className="lp-card featured">
              <div className="lp-card-icon">📊</div>
              <h3>אנליטיקס מקצועי</h3>
              <p>
                8 גרפים מתקדמים: Equity Curve, Drawdown, P&amp;L לפי יום וסמל,
                Heatmap, פיזור R:R ועוד — בזמן אמת.
              </p>
              <div className="lp-metrics">
                <div className="lp-metric">
                  <div className="lp-metric-label">Profit Factor</div>
                  <div className="lp-metric-val">2.84</div>
                </div>
                <div className="lp-metric">
                  <div className="lp-metric-label">Win Rate</div>
                  <div className="lp-metric-val">68%</div>
                </div>
                <div className="lp-metric">
                  <div className="lp-metric-label">Avg R:R</div>
                  <div className="lp-metric-val">1.9</div>
                </div>
                <div className="lp-metric">
                  <div className="lp-metric-label">Max DD</div>
                  <div className="lp-metric-val" style={{ color: '#ff4060' }}>-4.2%</div>
                </div>
              </div>
            </div>

            <div className="lp-card">
              <div className="lp-card-icon">📅</div>
              <h3>לוח שנה חזותי</h3>
              <p>
                זהה דפוסים בביצועים שלך. ראה באילו ימים אתה מצטיין
                ואילו סשנים כדאי להימנע מהם.
              </p>
              <div className="lp-mini-cal">
                {calColors.map((c, i) => (
                  <div key={i} className="lp-mini-day" style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Advanced */}
        <section className="lp-advanced" id="advanced">
          <div className="lp-advanced-inner">
            <h2>כלים ברמה מקצועית</h2>
            <p className="sub">
              נבנה לסוחרים רציניים שצריכים כלי דיוק לניהול סיכון ולמעבר הערכות Prop Firm.
            </p>
            <div className="lp-adv-grid">
              <div className="lp-adv-item">
                <div className="lp-adv-icon">🛡️</div>
                <div>
                  <h4>ניהול סיכון מתקדם</h4>
                  <p>
                    מחשבון R:R מדויק לכל חוזה עתידי. מעקב אחר Max Drawdown,
                    Daily Loss וחשיפה בזמן אמת.
                  </p>
                </div>
              </div>
              <div className="lp-adv-item">
                <div className="lp-adv-icon">🏢</div>
                <div>
                  <h4>מעקב Prop Firm</h4>
                  <p>
                    מעקב ייעודי עבור Topstep, Apex ו-MyFundedFutures.
                    ניטור Trailing Drawdown בדיוק מלא.
                  </p>
                </div>
              </div>
              <div className="lp-adv-item">
                <div className="lp-adv-icon">📋</div>
                <div>
                  <h4>50+ חוזים עתידיים</h4>
                  <p>
                    NQ, ES, CL, GC, SI ועוד — עם Point Value מדויק לכל סמל
                    לחישוב R:R אוטומטי.
                  </p>
                </div>
              </div>
              <div className="lp-adv-item">
                <div className="lp-adv-icon">📤</div>
                <div>
                  <h4>ייצוא PDF ו-CSV</h4>
                  <p>
                    ייצא דוחות מקצועיים לשיתוף עם מנטור, מוסד מימון
                    או לארכיון אישי.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="lp-pricing" id="pricing">
          <div className="lp-pricing-head">
            <h2>מחירים שקופים</h2>
            <p>14 יום ניסיון חינם לכל המשתמשים החדשים. ללא כרטיס אשראי.</p>
          </div>
          <div className="lp-plans">
            <div className="lp-plan">
              <div className="lp-plan-label">חודשי</div>
              <div className="lp-plan-price">
                <span className="amount">₪69</span>
                <span className="period">/ חודש</span>
              </div>
              <div className="lp-plan-trial">14 יום ניסיון חינם</div>
              <ul>
                <li><span className="check">✓</span> ייבוא עסקאות ללא הגבלה</li>
                <li><span className="check">✓</span> כל 8 גרפי האנליטיקס</li>
                <li><span className="check">✓</span> לוח שנה חזותי</li>
                <li><span className="check">✓</span> ייצוא PDF ו-CSV</li>
              </ul>
              <button className="lp-btn-plan secondary" onClick={goAuth}>
                התחל ניסיון חינם
              </button>
            </div>

            <div className="lp-plan best">
              <div className="lp-plan-badge">הכי כדאי</div>
              <div className="lp-plan-label">שנתי — חסוך 29%</div>
              <div className="lp-plan-price">
                <span className="amount">₪590</span>
                <span className="period">/ שנה</span>
              </div>
              <div className="lp-plan-trial">כ-₪49 לחודש · 14 יום ניסיון חינם</div>
              <ul>
                <li><span className="check">✓</span> הכל בחבילה החודשית</li>
                <li><span className="check">✓</span> מעקב Prop Firm מתקדם</li>
                <li><span className="check">✓</span> גישה מוקדמת לפיצ׳רים חדשים</li>
                <li><span className="check">✓</span> תמיכה בעדיפות גבוהה</li>
              </ul>
              <button className="lp-btn-plan primary" onClick={goAuth}>
                התחל ניסיון חינם
              </button>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="lp-cta">
          <h2>מוכן לשדרג את ביצועי המסחר שלך?</h2>
          <p>ללא כרטיס אשראי. 14 יום לגמרי חינם. ביטול בכל עת.</p>
          <div className="lp-cta-btns">
            <button className="lp-btn-cta-primary" onClick={goAuth}>
              התחל ניסיון חינם — 14 יום
            </button>
            <button className="lp-btn-cta-secondary" onClick={handleDemo}>
              צפה בהדגמה חיה
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="name">TradeLog</div>
            <div className="copy">© 2026 TradeLog. כל הזכויות שמורות.</div>
          </div>
          <div className="lp-footer-links">
            <a href="/terms">תנאי שימוש</a>
            <a href="/privacy">פרטיות</a>
            <a href="/accessibility">נגישות</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
