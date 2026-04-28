import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import './landing.css';

const calColors = [
  'rgba(29,185,84,.20)','rgba(29,185,84,.40)','rgba(233,20,41,.20)','rgba(29,185,84,.15)','rgba(29,185,84,.55)',
  '#282828',            'rgba(29,185,84,.35)','rgba(233,20,41,.30)','rgba(29,185,84,.20)','#282828',
  'rgba(29,185,84,.50)','#282828',            'rgba(29,185,84,.15)','rgba(29,185,84,.40)','rgba(233,20,41,.15)',
  '#282828',            'rgba(29,185,84,.35)','rgba(29,185,84,.20)','#282828',            'rgba(29,185,84,.60)',
  'rgba(233,20,41,.25)','rgba(29,185,84,.15)','rgba(29,185,84,.40)','#282828',            'rgba(29,185,84,.35)',
  'rgba(29,185,84,.20)','#282828',            'rgba(233,20,41,.40)',
];

const equityPoints = '0,110 40,95 80,100 120,78 160,82 200,60 240,65 280,42 320,48 360,28 400,15';
const equityFill   = equityPoints + ' 400,130 0,130';

/* ── Translations ─────────────────────────────────────────── */
const T = {
  he: {
    nav: { features: 'פיצ׳רים', pricing: 'מחירים', tools: 'כלים', testimonials: 'המלצות', faq: 'שאלות', blog: 'בלוג', signin: 'התחבר', start: 'התחל בחינם' },
    badge: '7 ימי ניסיון חינם',
    h1a: 'לסחור כמו מקצוען,',
    h1b: 'לתעד כמו מכונה.',
    heroSub: 'יומן המסחר האוטומטי המתקדם ביותר לסוחרים בחוזים עתידיים. לעקוב אחרי כל עסקה, לשלוט בפסיכולוגיה, ולחדד את האדג׳ שלך.',
    ctaPrimary: 'התחל ניסיון חינם — 7 ימים',
    ctaDemo: 'Live Demo',
    importsFrom: 'ייבוא מ-',
    featuresTitle: 'כלים שעובדים בשבילך',
    featuresSub: 'כל מה שצריך כדי לנתח, להשתפר ולשלוט בביצועי המסחר שלך.',
    card1Title: 'ייבוא אוטומטי',
    card1Desc: 'סנכרן את נתוני הביצוע מ-TopstepX בלחיצה אחת. ייבוא CSV מכל ברוקר. בלי הקלדה ידנית, בלי טעויות.',
    card2Title: 'Analytics מקצועי',
    card2Desc: '9 גרפים מתקדמים כולל השוואת אסטרטגיות: Equity Curve, Drawdown, Heatmap, R:R Scatter ועוד — בזמן אמת.',
    card3Title: 'לוח שנה ויזואלי',
    card3Desc: 'זהה דפוסים בביצועים שלך. ראה באילו ימים אתה מצטיין ואילו סשנים עדיף להימנע מהם.',
    advTitle: 'Pro-level tools',
    advSub: 'בנוי לסוחרים רציניים שצריכים כלי דיוק לניהול סיכונים והערכות Prop Firm.',
    adv1Title: 'ניהול סיכונים מתקדם',
    adv1Desc: 'מחשבון R:R מדויק לכל חוזה עתידי. מעקב בזמן אמת אחרי Max Drawdown, הפסד יומי וחשיפה.',
    adv2Title: 'Prop Firm Tracker',
    adv2Desc: 'מעקב ייעודי ל-Topstep, Apex ו-MyFundedFutures. ניטור Trailing Drawdown בדיוק מלא.',
    adv3Title: '50+ חוזים עתידיים',
    adv3Desc: 'NQ, ES, CL, GC, SI ועוד — עם Point Values מדויקים לכל סמל לחישוב R:R אוטומטי.',
    adv4Title: 'ייצוא PDF ו-CSV',
    adv4Desc: 'ייצא דוחות מקצועיים לשיתוף עם מנטור, מוסד מימון, או לארכיון אישי.',
    adv5Title: 'השוואת אסטרטגיות',
    adv5Desc: 'עקומות הון נפרדות לכל אסטרטגיה, WR%, Profit Factor ו-P&L ממוצע — כדי לדעת בדיוק מה עובד.',
    bizTitle: 'ניהול עסקי לסוחר Prop',
    bizSub: 'המסחר הוא העסק שלך. עקוב אחרי כל הוצאה, כל משיכה, ודע בדיוק אם אתה מרוויח — לפני שהמספרים מפתיעים אותך.',
    bizBadge: 'חדש',
    biz1: 'מעקב הוצאות: challenges, resets, עמלות נתונים',
    biz2: 'רישום משיכות ואחוז הצלחה',
    biz3: 'עלות לחשבון (CPA), רווח נקי אמיתי',
    biz4: 'מד עסקי: תדע מיד אם אתה ברווח או בהפסד',
    bizBtn: 'נסה את הניהול העסקי',
    pricingTitle: 'תמחור פשוט ושקוף',
    pricingSub: '7 ימי ניסיון חינם לכל משתמש חדש.',
    planMonthly: 'חודשי',
    planMonthlySub: 'חיוב חודשי · ביטול בכל עת',
    feat1: 'חשבונות מסחר ללא הגבלה',
    feat2: 'ייבוא עסקאות ללא הגבלה',
    feat3: 'ייבוא אוטומטי (TopstepX) + CSV',
    feat4: 'Prop Firm Tracker מלא',
    feat5: 'ניהול עסקי',
    feat6: '9 גרפי אנליטיקס + השוואת אסטרטגיות',
    feat7: 'לוח שנה ויזואלי',
    feat8: 'ייצוא PDF ו-CSV',
    planBtn: 'התחל ניסיון חינם',
    ctaTitle: 'מוכן לשפר את המסחר שלך?',
    ctaSub: '7 ימים חינם לגמרי. ביטול בכל עת.',
    testimonialsTitle: 'מה הסוחרים אומרים',
    testimonials: [
      { name: 'אלון מ.', role: 'Topstep Funded Trader', text: 'TraderYo שינה לי לגמרי את האופן שבו אני מנהל את החשבונות שלי. ה-Drawdown Tracker מציל אותי כל יום.' },
      { name: 'יעל כ.', role: 'NQ Day Trader', text: 'הייתי עובד עם Excel. עכשיו אני רואה את כל ה-Analytics שלי בלחיצה אחת. לא מבין איך עבדתי בלי זה.' },
      { name: 'רועי ש.', role: 'Apex Futures Trader', text: 'הייבוא האוטומטי מ-TopstepX חוסך לי 30 דקות כל יום. המידע מדויק ומסודר בדיוק כמו שצריך.' },
    ],
    faqTitle: 'שאלות נפוצות',
    faqs: [
      { q: 'האם TraderYo תומך בחשבונות מרובים?', a: 'כן. ניתן להוסיף חשבונות Live, Prop Firm, Sim ולעקוב אחריהם בנפרד — כל אחד עם יתרה, P&L ו-Drawdown משלו.' },
      { q: 'מאיזה ברוקרים אפשר לייבא עסקאות?', a: 'תומכים בייבוא אוטומטי מ-TopstepX. ניתן גם לייבא CSV ידנית מכל ברוקר.' },
      { q: 'האם יש תמיכה ב-Prop Firm Trailing Drawdown?', a: 'כן. TraderYo מחשב Trailing Drawdown (EOD ו-Intraday), Daily Loss Limit ו-Profit Target בדיוק מלא.' },
      { q: 'האם הנתונים שלי מאובטחים?', a: 'כל הנתונים מאוחסנים בצורה מוצפנת ב-Supabase עם Row-Level Security. רק אתה יכול לראות את הנתונים שלך.' },
      { q: 'האם ניתן לבטל בכל עת?', a: 'כן. ניתן לבטל מנוי בכל עת ישירות מהחשבון, ללא עמלות ביטול.' },
    ],
    footerTerms: 'תנאי שימוש',
    footerPrivacy: 'פרטיות',
    footerAccess: 'נגישות',
    footerCopy: (y: number) => `© ${y} TraderYo. כל הזכויות שמורות.`,
    footerQuickTitle: 'קישורים מהירים',
    footerQuickLinks: [
      { label: 'פיצ\'רים', href: '#features' },
      { label: 'פלטפורמות וברוקרים', href: '#brokers' },
      { label: 'מחירים', href: '#pricing' },
      { label: 'שאלות ותשובות', href: '#faq' },
    ],
    footerUsefulTitle: 'קישורים שימושיים',
    footerUsefulLinks: [
      { label: 'בלוג', href: '/blog' },
      { label: 'מדריכים', href: '/guides' },
      { label: 'שאלות נפוצות', href: '#faq' },
      { label: 'תנאי שימוש', href: '/terms' },
      { label: 'מדיניות פרטיות', href: '/privacy' },
      { label: 'Risk Disclosure', href: '/risk-disclosure' },
    ],
    footerContactTitle: 'צור קשר',
    footerEmail: 'tradelogisr@gmail.com',
  },
  en: {
    nav: { features: 'Features', pricing: 'Pricing', tools: 'Tools', testimonials: 'Reviews', faq: 'FAQ', blog: 'Blog', signin: 'Sign in', start: 'Start free' },
    badge: '7-day free trial',
    h1a: 'Trade like a pro,',
    h1b: 'analyze like a machine',
    heroSub: 'The most advanced trading journal for futures traders. Track every trade, master your psychology, and sharpen your edge.',
    ctaPrimary: 'Start free trial — 7 days',
    ctaDemo: 'Live demo',
    importsFrom: 'Imports from',
    featuresTitle: 'Tools that work for you',
    featuresSub: 'Everything you need to analyze, improve, and take control of your trading performance.',
    card1Title: 'Automated Trade Import',
    card1Desc: 'Sync your execution data from TopstepX in one click. CSV import from any broker. No manual entry, no errors.',
    card2Title: 'Professional Analytics',
    card2Desc: '9 advanced charts including strategy comparison: Equity Curve, Drawdown, Heatmap, R:R scatter and more — in real time.',
    card3Title: 'Visual Trading Calendar',
    card3Desc: 'Identify patterns in your performance. See which days you excel and which sessions to avoid.',
    advTitle: 'Pro-level tools',
    advSub: 'Built for serious traders who need precision tools for risk management and Prop Firm evaluations.',
    adv1Title: 'Advanced Risk Management',
    adv1Desc: 'Precise R:R calculator for every futures contract. Real-time tracking of Max Drawdown, Daily Loss, and exposure.',
    adv2Title: 'Prop Firm Tracker',
    adv2Desc: 'Dedicated tracking for Topstep, Apex, and MyFundedFutures. Trailing Drawdown monitoring with full precision.',
    adv3Title: '50+ Futures Contracts',
    adv3Desc: 'NQ, ES, CL, GC, SI and more — with exact Point Values per symbol for automatic R:R calculations.',
    adv4Title: 'PDF & CSV Export',
    adv4Desc: 'Export professional reports for sharing with a mentor, funding institution, or personal archive.',
    adv5Title: 'Strategy Comparison',
    adv5Desc: 'Separate equity curves per strategy, WR%, Profit Factor and avg P&L side by side — so you know exactly what works.',
    bizTitle: 'Business Intelligence for Prop Traders',
    bizSub: 'Trading is a business. Track every expense, every payout, and know exactly if you\'re profitable — before the numbers surprise you.',
    bizBadge: 'New',
    biz1: 'Track expenses: challenges, resets, data fees',
    biz2: 'Log payouts and track your success rate',
    biz3: 'Cost per account (CPA) and true net profit',
    biz4: 'Business meter: instantly know if you\'re in the green or red',
    bizBtn: 'Try Business Manager',
    pricingTitle: 'Simple, transparent pricing',
    pricingSub: '7-day free trial for all new users.',
    planMonthly: 'Monthly',
    planMonthlySub: 'Billed monthly · cancel anytime',
    feat1: 'Unlimited trading accounts',
    feat2: 'Unlimited trade imports',
    feat3: 'Auto-import (TopstepX) + CSV',
    feat4: 'Full Prop Firm Tracker',
    feat5: 'Business Manager',
    feat6: '9 analytics charts + strategy comparison',
    feat7: 'Visual trading calendar',
    feat8: 'PDF & CSV export',
    planBtn: 'Start free trial',
    ctaTitle: 'Ready to level up your trading?',
    ctaSub: '7 days completely free. Cancel anytime.',
    testimonialsTitle: 'What traders are saying',
    testimonials: [
      { name: 'Alon M.', role: 'Topstep Funded Trader', text: 'TraderYo completely changed how I manage my accounts. The Drawdown Tracker saves me every single day.' },
      { name: 'Yael K.', role: 'NQ Day Trader', text: 'I used to work in Excel. Now I see all my analytics in one click. I don\'t understand how I worked without this.' },
      { name: 'Roee S.', role: 'Apex Futures Trader', text: 'Auto-import from TopstepX saves me 30 minutes every day. The data is accurate and organized exactly as needed.' },
    ],
    faqTitle: 'Frequently asked questions',
    faqs: [
      { q: 'Does TraderYo support multiple accounts?', a: 'Yes. You can add Live, Prop Firm, and Sim accounts and track them separately — each with its own balance, P&L, and drawdown.' },
      { q: 'Which brokers can I import trades from?', a: 'We support automatic import from TopstepX. You can also import CSV manually from any broker.' },
      { q: 'Does it support Prop Firm Trailing Drawdown?', a: 'Yes. TraderYo calculates Trailing Drawdown (EOD and Intraday), Daily Loss Limit, and Profit Target with full precision.' },
      { q: 'Is my data secure?', a: 'All data is stored encrypted in Supabase with Row-Level Security. Only you can access your data.' },
      { q: 'Can I cancel at any time?', a: 'Yes. You can cancel your subscription anytime directly from your account, with no cancellation fees.' },
    ],
    footerTerms: 'Terms',
    footerPrivacy: 'Privacy',
    footerAccess: 'Accessibility',
    footerCopy: (y: number) => `© ${y} TraderYo. All rights reserved.`,
    footerQuickTitle: 'Quick Links',
    footerQuickLinks: [
      { label: 'Features', href: '#features' },
      { label: 'Platforms & Brokers', href: '#brokers' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'FAQ', href: '#faq' },
    ],
    footerUsefulTitle: 'Useful Links',
    footerUsefulLinks: [
      { label: 'Blog', href: '/blog' },
      { label: 'Guides', href: '/guides' },
      { label: 'FAQ', href: '#faq' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Risk Disclosure', href: '/risk-disclosure' },
    ],
    footerContactTitle: 'Contact',
    footerEmail: 'tradelogisr@gmail.com',
  },
};

export default function Landing() {
  const navigate = useNavigate();
  const { loadDemoData, setUser, lang, setLang } = useStore();
  const isHe = lang === 'he';
  const t = isHe ? T.he : T.en;
  const dir = isHe ? 'rtl' : 'ltr';

  const goAuth = () => navigate('/auth');
  const goWhop = () => window.open('https://whop.com/checkout/plan_VZiIXyiKbr7Pr', '_blank');

  const handleDemo = () => {
    loadDemoData();
    setUser({ id: 'demo', name: 'Demo User', email: 'demo@tradelog.app' });
    navigate('/dashboard');
  };

  return (
    <div className="lp" dir={dir}>
      {/* Nav — always LTR internally for layout */}
      <header className="lp-nav" dir="ltr">
        <div className="lp-nav-inner">
          <a className="lp-logo" href="/">
            <img src="/logo.png?v=2" alt="TraderYo" style={{ height: 56, width: 56, objectFit: 'contain', borderRadius: 10, mixBlendMode: 'screen' }} />
          </a>
          <nav>
            <ul className="lp-nav-links">
              <li><a href="#features">{t.nav.features}</a></li>
              <li><a href="#pricing">{t.nav.pricing}</a></li>
              <li><a href="#advanced">{t.nav.tools}</a></li>
              <li><a href="#testimonials">{t.nav.testimonials}</a></li>
              <li><a href="#faq">{t.nav.faq}</a></li>
              <li><a href="/blog">{t.nav.blog}</a></li>
            </ul>
          </nav>
          <div className="lp-nav-actions">
            {/* Language toggle */}
            <button
              onClick={() => setLang(isHe ? 'en' : 'he')}
              style={{
                background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.12)',
                borderRadius: 999, padding: '5px 12px', color: 'rgba(255,255,255,.7)',
                fontSize: '.78rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '.03em',
              }}
            >
              {isHe ? 'EN' : 'עב'}
            </button>
            <button className="lp-btn-ghost" onClick={goAuth}>{t.nav.signin}</button>
            <button className="lp-btn-primary" onClick={goWhop}>{t.nav.start}</button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="lp-hero">
          <div className="lp-hero-inner">
            <div className="lp-badge">
              <div className="lp-badge-dot" />
              <span>{t.badge}</span>
            </div>
            <h1>
              {t.h1a}<br />
              <span className="accent">{t.h1b}</span>
            </h1>
            <p>{t.heroSub}</p>
            <div className="lp-hero-ctas" dir="ltr">
              <button className="lp-btn-hero-primary" onClick={goWhop}>
                {t.ctaPrimary}
              </button>
              <button className="lp-btn-hero-secondary" onClick={handleDemo}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"/>
                </svg>
                {t.ctaDemo}
              </button>
            </div>

            {/* Dashboard Mockup — always LTR */}
            <div className="lp-mockup" dir="ltr" role="img" aria-label="TraderYo dashboard showing trading calendar, equity curve, and P&L statistics for a futures trader">
              <div className="lp-mockup-bar">
                <div className="lp-mockup-dot" style={{ background: '#ff5f57' }} />
                <div className="lp-mockup-dot" style={{ background: '#febc2e' }} />
                <div className="lp-mockup-dot" style={{ background: '#28c840' }} />
                <div style={{ flex: 1, height: 16, background: '#282828', borderRadius: 4, marginInlineStart: 10, maxWidth: 200 }} />
              </div>

              <div className="lp-mockup-app">
                <div className="lp-mockup-sidebar">
                  <div className="lp-mockup-logo">
                    <img src="/logo.png?v=2" alt="TraderYo" style={{ height: 36, width: 36, objectFit: 'contain', borderRadius: 6, mixBlendMode: 'screen' }} />
                  </div>
                  {[
                    { label: 'Calendar', active: true },
                    { label: 'Trades',   active: false },
                    { label: 'Analytics',active: false },
                    { label: 'Reports',  active: false },
                    { label: 'Prop Firm',active: false },
                  ].map(item => (
                    <div key={item.label} style={{
                      fontSize: '.58rem', padding: '6px 8px', borderRadius: 4,
                      color: item.active ? '#FFFFFF' : 'rgba(255,255,255,.45)',
                      background: item.active ? 'rgba(255,255,255,.10)' : 'none',
                      borderInlineStart: item.active ? '3px solid #1DB954' : '3px solid transparent',
                      fontWeight: item.active ? 600 : 400,
                    }}>
                      {item.label}
                    </div>
                  ))}
                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: 'Today P&L', val: '+$1,840', color: '#1DB954' },
                      { label: 'Win Rate',  val: '68%',     color: '#1DB954' },
                      { label: 'Max DD',    val: '-4.2%',   color: '#ff4d60' },
                    ].map(k => (
                      <div key={k.label}>
                        <div style={{ fontSize: '.46rem', textTransform: 'uppercase', letterSpacing: '.07em', color: 'rgba(255,255,255,.35)' }}>{k.label}</div>
                        <div style={{ fontSize: '.75rem', fontWeight: 700, color: k.color, fontFamily: 'monospace' }}>{k.val}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lp-mockup-main">
                  <div className="lp-mockup-kpi-row">
                    {[
                      { label: 'Total P&L',    val: '+$18,420', color: '#1DB954' },
                      { label: 'Win Rate',      val: '68%',      color: '#1DB954' },
                      { label: 'Profit Factor', val: '2.84',     color: '#1DB954' },
                      { label: 'Trades',        val: '142',      color: '#FFFFFF' },
                    ].map(k => (
                      <div key={k.label} className="lp-mockup-kpi">
                        <div style={{ fontSize: '.46rem', textTransform: 'uppercase', letterSpacing: '.07em', color: 'rgba(255,255,255,.40)', marginBottom: 3 }}>{k.label}</div>
                        <div style={{ fontSize: '.82rem', fontWeight: 700, color: k.color, fontFamily: 'monospace' }}>{k.val}</div>
                      </div>
                    ))}
                  </div>

                  <div className="lp-mockup-charts">
                    <div className="lp-mockup-chart-panel">
                      <div style={{ fontSize: '.50rem', color: 'rgba(255,255,255,.40)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.07em' }}>Equity Curve</div>
                      <svg viewBox="0 0 400 130" preserveAspectRatio="none" style={{ width: '100%', height: 72 }}>
                        <defs>
                          <linearGradient id="eq-fill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1DB954" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#1DB954" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <polygon points={equityFill} fill="url(#eq-fill)" />
                        <polyline points={equityPoints} fill="none" stroke="#1DB954" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="400" cy="15" r="4" fill="#1DB954"/>
                      </svg>
                    </div>
                    <div className="lp-mockup-chart-panel">
                      <div style={{ fontSize: '.50rem', color: 'rgba(255,255,255,.40)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.07em' }}>Calendar</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
                        {calColors.map((c, i) => (
                          <div key={i} style={{ aspectRatio: '1', borderRadius: 2, background: c }} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lp-mockup-trades">
                    {[
                      { sym: 'NQ',  dir: 'Long',  pnl: '+$920', pos: true  },
                      { sym: 'ES',  dir: 'Short', pnl: '-$240', pos: false },
                      { sym: 'MNQ', dir: 'Long',  pnl: '+$460', pos: true  },
                    ].map(t => (
                      <div key={t.sym + t.pnl} className="lp-mockup-trade-row">
                        <span style={{ fontSize: '.56rem', fontWeight: 700, color: '#FFFFFF', fontFamily: 'monospace', minWidth: 28 }}>{t.sym}</span>
                        <span style={{ fontSize: '.50rem', color: t.pos ? '#1DB954' : '#ff4d60', background: t.pos ? 'rgba(29,185,84,.12)' : 'rgba(255,77,96,.12)', padding: '1px 5px', borderRadius: 999 }}>{t.dir}</span>
                        <span style={{ fontSize: '.56rem', fontWeight: 700, color: t.pos ? '#1DB954' : '#ff4d60', fontFamily: 'monospace', marginInlineStart: 'auto' }}>{t.pnl}</span>
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
          <div className="lp-social-inner" dir="ltr">
            <span className="lp-social-label">{t.importsFrom}</span>
            <div className="lp-brokers">
              <div className="lp-broker">TopstepX</div>
              <div className="lp-broker">NinjaTrader</div>
              <div className="lp-broker">Tradovate</div>
              <div className="lp-broker">Rithmic</div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="lp-features" id="features">
          <div className="lp-features-inner">
            <h2>{t.featuresTitle}</h2>
            <p className="sub">{t.featuresSub}</p>
            <div className="lp-features-grid">
              <div className="lp-card">
                <div className="lp-card-icon">📥</div>
                <h3>{t.card1Title}</h3>
                <p>{t.card1Desc}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[85,60,92,45,78].map((w, i) => (
                    <div key={i} style={{ height: 5, borderRadius: 3, background: `rgba(29,185,84,${w / 130})`, width: `${w}%` }} />
                  ))}
                </div>
              </div>

              <div className="lp-card featured">
                <div className="lp-card-icon">📊</div>
                <h3>{t.card2Title}</h3>
                <p>{t.card2Desc}</p>
                <div className="lp-metrics">
                  {[
                    { label: 'Profit Factor', val: '2.84' },
                    { label: 'Win Rate',      val: '68%' },
                    { label: 'Avg R:R',       val: '1.9' },
                    { label: 'Max DD',        val: '-4.2%', red: true },
                  ].map(m => (
                    <div key={m.label} className="lp-metric">
                      <div className="lp-metric-label">{m.label}</div>
                      <div className="lp-metric-val" style={m.red ? { color: '#ff4d60' } : {}}>{m.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lp-card">
                <div className="lp-card-icon">📅</div>
                <h3>{t.card3Title}</h3>
                <p>{t.card3Desc}</p>
                <div className="lp-mini-cal">
                  {calColors.map((c, i) => (
                    <div key={i} className="lp-mini-day" style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Advanced */}
        <section className="lp-advanced" id="advanced">
          <div className="lp-advanced-inner">
            <h2>{t.advTitle}</h2>
            <p className="sub">{t.advSub}</p>
            <div className="lp-adv-grid">
              {[
                { icon: '🛡️', title: t.adv1Title, desc: t.adv1Desc },
                { icon: '🏢', title: t.adv2Title, desc: t.adv2Desc },
                { icon: '📋', title: t.adv3Title, desc: t.adv3Desc },
                { icon: '📤', title: t.adv4Title, desc: t.adv4Desc },
                { icon: '📈', title: t.adv5Title, desc: t.adv5Desc },
              ].map(item => (
                <div key={item.title} className="lp-adv-item">
                  <div className="lp-adv-icon">{item.icon}</div>
                  <div>
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Business Manager */}
        <section className="lp-business" id="business">
          <div className="lp-business-inner">
            {/* Text — בצד שמאל ב-LTR, ימין ב-RTL */}
            <div className="lp-business-text">
              <div className="lp-biz-badge">{t.bizBadge}</div>
              <h2>{t.bizTitle}</h2>
              <p>{t.bizSub}</p>
              <ul className="lp-biz-features">
                <li>{t.biz1}</li>
                <li>{t.biz2}</li>
                <li>{t.biz3}</li>
                <li>{t.biz4}</li>
              </ul>
              <button className="lp-btn-primary" onClick={goWhop}>{t.bizBtn}</button>
            </div>

            {/* Mockup — Business Manager mini UI */}
            <div className="lp-biz-mockup" dir="ltr">
              {/* KPI row */}
              <div className="lp-biz-kpi-row">
                {[
                  { label: 'Revenue',  val: '$2,400', color: '#1DB954' },
                  { label: 'Expenses', val: '$1,180', color: '#ff4d60' },
                  { label: 'Net',      val: '$1,220', color: '#1DB954' },
                  { label: 'CPA',      val: '$295',   color: '#F59B23' },
                ].map(k => (
                  <div key={k.label} className="lp-biz-kpi">
                    <div className="lp-biz-kpi-label">{k.label}</div>
                    <div className="lp-biz-kpi-val" style={{ color: k.color }}>{k.val}</div>
                  </div>
                ))}
              </div>

              {/* GamblingMeter */}
              <div className="lp-biz-meter-wrap">
                <div className="lp-biz-meter-title">Business Meter</div>
                <div className="lp-biz-meter-bar">
                  <div className="lp-biz-meter-needle" style={{ left: '52%' }} />
                </div>
                <div className="lp-biz-meter-labels">
                  <span>Risky</span>
                  <span>Break-Even</span>
                  <span>Safe</span>
                </div>
              </div>

              {/* Expense / Payout log */}
              <div className="lp-biz-log">
                <div className="lp-biz-log-title">Recent activity</div>
                {[
                  { firm: 'TopstepX',  type: 'Challenge',  amt: '-$165', pos: false },
                  { firm: 'TopstepX',  type: 'Payout',     amt: '+$800', pos: true  },
                  { firm: 'Apex',      type: 'Reset',       amt: '-$95',  pos: false },
                  { firm: 'Apex',      type: 'Payout',     amt: '+$620', pos: true  },
                ].map((row, i) => (
                  <div key={i} className="lp-biz-log-row">
                    <span className="lp-biz-log-firm">{row.firm}</span>
                    <span className="lp-biz-log-type">{row.type}</span>
                    <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '.70rem', color: row.pos ? '#1DB954' : '#ff4d60' }}>{row.amt}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="lp-pricing" id="pricing">
          <div className="lp-pricing-inner">
            <h2>{t.pricingTitle}</h2>
            <p className="sub">{t.pricingSub}</p>
            <div className="lp-pricing-grid" dir="ltr">
              <div className="lp-plan">
                <div className="lp-plan-name">{t.planMonthly}</div>
                <div className="lp-plan-price">$21.99<span>/mo</span></div>
                <div className="lp-plan-sub">{t.planMonthlySub}</div>
                <ul className="lp-plan-features">
                  <li>{t.feat1}</li><li>{t.feat2}</li><li>{t.feat3}</li><li>{t.feat4}</li>
                  <li>{t.feat5}</li><li>{t.feat6}</li><li>{t.feat7}</li><li>{t.feat8}</li>
                </ul>
                <button className="lp-plan-btn" onClick={goWhop}>{t.planBtn}</button>
              </div>

            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="lp-testimonials" id="testimonials">
          <div className="lp-testimonials-inner">
            <h2>{t.testimonialsTitle}</h2>
            <div className="lp-testimonials-grid">
              {t.testimonials.map((item, i) => (
                <div key={i} className="lp-testimonial-card">
                  <div className="lp-testimonial-stars">★★★★★</div>
                  <p className="lp-testimonial-text">"{item.text}"</p>
                  <div className="lp-testimonial-author">
                    <div className="lp-testimonial-avatar">{item.name[0]}</div>
                    <div>
                      <div className="lp-testimonial-name">{item.name}</div>
                      <div className="lp-testimonial-role">{item.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="lp-faq" id="faq">
          <div className="lp-faq-inner">
            <h2>{t.faqTitle}</h2>
            <div className="lp-faq-list">
              {t.faqs.map((item, i) => (
                <details key={i} className="lp-faq-item">
                  <summary className="lp-faq-q">{item.q}</summary>
                  <p className="lp-faq-a">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="lp-cta">
          <div className="lp-cta-inner">
            <h2>{t.ctaTitle}</h2>
            <p>{t.ctaSub}</p>
            <div className="lp-cta-btns" dir="ltr">
              <button className="lp-btn-hero-primary" onClick={goWhop}>{t.ctaPrimary}</button>
              <button className="lp-btn-hero-secondary" onClick={handleDemo}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"/>
                </svg>
                {t.ctaDemo}
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-cols">
          {/* Quick Links */}
          <div className="lp-footer-col">
            <h4 className="lp-footer-col-title">{t.footerQuickTitle}</h4>
            <ul className="lp-footer-col-links">
              {t.footerQuickLinks.map(l => (
                <li key={l.label}><a href={l.href}>{l.label}</a></li>
              ))}
            </ul>
          </div>
          {/* Useful Links */}
          <div className="lp-footer-col">
            <h4 className="lp-footer-col-title">{t.footerUsefulTitle}</h4>
            <ul className="lp-footer-col-links">
              {t.footerUsefulLinks.map(l => (
                <li key={l.label}><a href={l.href}>{l.label}</a></li>
              ))}
            </ul>
          </div>
          {/* Contact */}
          <div className="lp-footer-col">
            <h4 className="lp-footer-col-title">{t.footerContactTitle}</h4>
            <ul className="lp-footer-col-links">
              <li>
                <a href={`mailto:${t.footerEmail}`} className="lp-footer-contact-row">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
                  {t.footerEmail}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <div className="lp-footer-logo">
            <img src="/logo.png?v=2" alt="TraderYo" style={{ height: 40, width: 40, objectFit: 'contain', borderRadius: 8, mixBlendMode: 'screen' }} />
          </div>
          <div className="lp-footer-copy">{t.footerCopy(new Date().getFullYear())}</div>
          <ul className="lp-footer-links">
            <li><a href="/terms">{t.footerTerms}</a></li>
            <li><a href="/privacy">{t.footerPrivacy}</a></li>
            <li><a href="/accessibility">{t.footerAccess}</a></li>
          </ul>
        </div>
      </footer>
    </div>
  );
}
