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
const equityFill = equityPoints + ' 400,130 0,130';

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
      {/* Nav */}
      <header className="lp-nav" dir="ltr">
        <div className="lp-nav-inner">
          <a className="lp-logo" href="/">
            <img src="/logo-icon.png" alt="TradeLog" style={{ height: 36, width: 'auto', objectFit: 'contain' }} />
            <span>TradeLog</span>
          </a>
          <nav>
            <ul className="lp-nav-links">
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#advanced">Tools</a></li>
            </ul>
          </nav>
          <div className="lp-nav-actions">
            <button className="lp-btn-ghost" onClick={goAuth}>Sign in</button>
            <button className="lp-btn-primary" onClick={goAuth}>Start free</button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="lp-hero">
          <div className="lp-hero-inner">
            <div className="lp-badge">
              <div className="lp-badge-dot" />
              <span>14-day free trial · No credit card required</span>
            </div>
            <h1>
              Trade like a pro,<br />
              <span className="accent">analyze like a machine</span>
            </h1>
            <p>
              The most advanced trading journal for futures traders.
              Track every trade, master your psychology, and sharpen your edge.
            </p>
            <div className="lp-hero-ctas">
              <button className="lp-btn-hero-primary" onClick={goAuth}>
                Start free trial — 14 days
              </button>
              <button className="lp-btn-hero-secondary" onClick={handleDemo}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"/>
                </svg>
                Live demo
              </button>
            </div>

            {/* Dashboard Mockup */}
            <div className="lp-mockup" dir="ltr">
              <div className="lp-mockup-bar">
                <div className="lp-mockup-dot" style={{ background: '#ff5f57' }} />
                <div className="lp-mockup-dot" style={{ background: '#febc2e' }} />
                <div className="lp-mockup-dot" style={{ background: '#28c840' }} />
                <div style={{ flex: 1, height: 16, background: '#282828', borderRadius: 4, marginInlineStart: 10, maxWidth: 200 }} />
              </div>

              <div className="lp-mockup-app">
                {/* Sidebar */}
                <div className="lp-mockup-sidebar">
                  <div className="lp-mockup-logo">
                    <img src="/logo-icon.png" alt="TradeLog" style={{ height: 22, width: 'auto', objectFit: 'contain' }} />
                    <span style={{ fontSize: '.65rem', fontWeight: 700, color: '#FFFFFF' }}>TradeLog</span>
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
                  {/* Mini KPIs */}
                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { label: "Today P&L", val: '+$1,840', color: '#1DB954' },
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

                {/* Main content */}
                <div className="lp-mockup-main">
                  {/* KPI strip */}
                  <div className="lp-mockup-kpi-row">
                    {[
                      { label: 'Total P&L',     val: '+$18,420', color: '#1DB954' },
                      { label: 'Win Rate',       val: '68%',      color: '#1DB954' },
                      { label: 'Profit Factor',  val: '2.84',     color: '#1DB954' },
                      { label: 'Trades',         val: '142',      color: '#FFFFFF' },
                    ].map(k => (
                      <div key={k.label} className="lp-mockup-kpi">
                        <div style={{ fontSize: '.46rem', textTransform: 'uppercase', letterSpacing: '.07em', color: 'rgba(255,255,255,.40)', marginBottom: 3 }}>{k.label}</div>
                        <div style={{ fontSize: '.82rem', fontWeight: 700, color: k.color, fontFamily: 'monospace' }}>{k.val}</div>
                      </div>
                    ))}
                  </div>

                  {/* Charts row */}
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

                  {/* Trade rows */}
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
          <div className="lp-social-inner">
            <span className="lp-social-label">Imports from</span>
            <div className="lp-brokers">
              <div className="lp-broker">Tradovate</div>
              <div className="lp-broker">TopstepX</div>
              <div className="lp-broker">NinjaTrader</div>
              <div className="lp-broker">Rithmic</div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="lp-features" id="features">
          <div className="lp-features-inner">
            <h2>Tools that work for you</h2>
            <p className="sub">Everything you need to analyze, improve, and take control of your trading performance.</p>
            <div className="lp-features-grid">
              <div className="lp-card">
                <div className="lp-card-icon">📥</div>
                <h3>Automated Trade Import</h3>
                <p>
                  Sync your execution data from Tradovate and TopstepX in one click.
                  No manual entry, no errors.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[85,60,92,45,78].map((w, i) => (
                    <div key={i} style={{ height: 5, borderRadius: 3, background: `rgba(29,185,84,${w / 130})`, width: `${w}%` }} />
                  ))}
                </div>
              </div>

              <div className="lp-card featured">
                <div className="lp-card-icon">📊</div>
                <h3>Professional Analytics</h3>
                <p>
                  8 advanced charts: Equity Curve, Drawdown, P&amp;L by day &amp; symbol,
                  Heatmap, R:R scatter and more — in real time.
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
                    <div className="lp-metric-val" style={{ color: '#ff4d60' }}>-4.2%</div>
                  </div>
                </div>
              </div>

              <div className="lp-card">
                <div className="lp-card-icon">📅</div>
                <h3>Visual Trading Calendar</h3>
                <p>
                  Identify patterns in your performance. See which days you excel
                  and which sessions to avoid.
                </p>
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
            <h2>Pro-level tools</h2>
            <p className="sub">
              Built for serious traders who need precision tools for risk management and Prop Firm evaluations.
            </p>
            <div className="lp-adv-grid">
              <div className="lp-adv-item">
                <div className="lp-adv-icon">🛡️</div>
                <div>
                  <h4>Advanced Risk Management</h4>
                  <p>
                    Precise R:R calculator for every futures contract. Real-time tracking of
                    Max Drawdown, Daily Loss, and exposure.
                  </p>
                </div>
              </div>
              <div className="lp-adv-item">
                <div className="lp-adv-icon">🏢</div>
                <div>
                  <h4>Prop Firm Tracker</h4>
                  <p>
                    Dedicated tracking for Topstep, Apex, and MyFundedFutures.
                    Trailing Drawdown monitoring with full precision.
                  </p>
                </div>
              </div>
              <div className="lp-adv-item">
                <div className="lp-adv-icon">📋</div>
                <div>
                  <h4>50+ Futures Contracts</h4>
                  <p>
                    NQ, ES, CL, GC, SI and more — with exact Point Values per symbol
                    for automatic R:R calculations.
                  </p>
                </div>
              </div>
              <div className="lp-adv-item">
                <div className="lp-adv-icon">📤</div>
                <div>
                  <h4>PDF &amp; CSV Export</h4>
                  <p>
                    Export professional reports for sharing with a mentor, funding institution,
                    or personal archive.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="lp-pricing" id="pricing">
          <div className="lp-pricing-inner">
            <h2>Simple, transparent pricing</h2>
            <p className="sub">14-day free trial for all new users. No credit card required.</p>
            <div className="lp-pricing-grid">
              <div className="lp-plan">
                <div className="lp-plan-name">Monthly</div>
                <div className="lp-plan-price">$19<span>/mo</span></div>
                <div className="lp-plan-sub">Billed monthly</div>
                <ul className="lp-plan-features">
                  <li>Unlimited trade imports</li>
                  <li>All 8 analytics charts</li>
                  <li>Visual trading calendar</li>
                  <li>PDF &amp; CSV export</li>
                </ul>
                <button className="lp-plan-btn" onClick={goAuth}>Start free trial</button>
              </div>

              <div className="lp-plan popular">
                <div className="lp-plan-badge">Most popular</div>
                <div className="lp-plan-name">Annual — save 29%</div>
                <div className="lp-plan-price">$159<span>/yr</span></div>
                <div className="lp-plan-sub">About $13/month · 14-day free trial</div>
                <ul className="lp-plan-features">
                  <li>Everything in Monthly</li>
                  <li>Advanced Prop Firm tracker</li>
                  <li>Early access to new features</li>
                  <li>Priority support</li>
                </ul>
                <button className="lp-plan-btn" onClick={goAuth}>Start free trial</button>
              </div>

              <div className="lp-plan">
                <div className="lp-plan-name">Lifetime</div>
                <div className="lp-plan-price">$349<span> once</span></div>
                <div className="lp-plan-sub">One-time payment, forever access</div>
                <ul className="lp-plan-features">
                  <li>Everything included</li>
                  <li>All future updates</li>
                  <li>Highest priority support</li>
                  <li>Founding member badge</li>
                </ul>
                <button className="lp-plan-btn" onClick={goAuth}>Get lifetime access</button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="lp-cta">
          <div className="lp-cta-inner">
            <h2>Ready to level up your trading?</h2>
            <p>No credit card. 14 days completely free. Cancel anytime.</p>
            <div className="lp-cta-btns">
              <button className="lp-btn-hero-primary" onClick={goAuth}>
                Start free trial — 14 days
              </button>
              <button className="lp-btn-hero-secondary" onClick={handleDemo}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none"/>
                </svg>
                Live demo
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-logo">
            <img src="/logo-icon.png" alt="TradeLog" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
            TradeLog
          </div>
          <ul className="lp-footer-links">
            <li><a href="/terms">Terms</a></li>
            <li><a href="/privacy">Privacy</a></li>
            <li><a href="/accessibility">Accessibility</a></li>
          </ul>
          <div className="lp-footer-copy">© {new Date().getFullYear()} TradeLog. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
