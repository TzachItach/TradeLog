import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useT } from '../i18n';
import { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, DEMO_MODE } from '../lib/supabase';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

type AuthMode = 'signin' | 'signup' | 'reset';

export default function Auth() {
  const { lang, setLang, loadDemoData, setUser, darkMode } = useStore();
  const T = useT(lang);
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const isHe = lang === 'he';

  const handleDemo = () => {
    loadDemoData();
    setUser({ id: 'demo', name: 'Demo User', email: 'demo@tradelog.app' });
    navigate('/dashboard');
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || (!password.trim() && mode !== 'reset')) return;
    setLoading(true);
    setError('');
    setInfo('');
    try {
      if (mode === 'reset') {
        const { error: err } = await resetPassword(email);
        if (err) setError(err);
        else setInfo(isHe ? T.resetSent : T.resetSent);
      } else if (mode === 'signup') {
        const { error: err } = await signUpWithEmail(email, password);
        if (err) setError(err);
        else setInfo(isHe ? T.checkEmail : T.checkEmail);
      } else {
        const { error: err } = await signInWithEmail(email, password);
        if (err) setError(err);
        else navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError('');
    setInfo('');
    setPassword('');
  };

  return (
    <div className="auth-wrap">
      <div style={{ position: 'absolute', top: 20, insetInlineEnd: 20 }}>
        <button
          className="btn btn-lang btn-close"
          style={{ fontSize: '.82rem', padding: '4px 12px', borderRadius: 16 }}
          onClick={() => setLang(lang === 'he' ? 'en' : 'he')}
        >
          {lang === 'he' ? 'EN' : 'עב'}
        </button>
      </div>

      <div className="auth-card" dir={isHe ? 'rtl' : 'ltr'}>
        <div className="auth-logo">
          <img src={darkMode ? '/logo.png' : '/logo-light.png'} alt="TraderYo" style={{ width: 180, height: 'auto', objectFit: 'contain', margin: '0 auto 8px', display: 'block' }} />
        </div>

        <div className="auth-title">{T.welcomeBack}</div>
        <div className="auth-sub">{T.loginSubtitle}</div>

        {/* Consent checkbox */}
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 16, cursor: 'pointer', fontSize: '.78rem', color: 'var(--t2)', lineHeight: 1.5 }}>
          <input
            type="checkbox"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            style={{ marginTop: 2, flexShrink: 0, accentColor: 'var(--b)', width: 14, height: 14 }}
          />
          <span>
            {isHe
              ? <>קראתי ואני מסכים/ה ל<a href="/terms" style={{ color: 'var(--b)' }}>תנאי השימוש</a> ול<a href="/privacy" style={{ color: 'var(--b)' }}>מדיניות הפרטיות</a>, לרבות אחסון נתוניי על שרתים בחו"ל.</>
              : <>I have read and agree to the <a href="/terms" style={{ color: 'var(--b)' }}>Terms of Use</a> and <a href="/privacy" style={{ color: 'var(--b)' }}>Privacy Policy</a>, including storage of my data on servers outside Israel.</>
            }
          </span>
        </label>

        {!DEMO_MODE ? (
          <>
            {/* Google OAuth */}
            <button className="btn-oauth" onClick={signInWithGoogle} disabled={!agreed} style={{ marginBottom: 12, opacity: agreed ? 1 : 0.45, cursor: agreed ? 'pointer' : 'not-allowed' }}>
              <GoogleIcon />
              {T.loginWith} {T.google}
            </button>

            <div className="auth-divider">{isHe ? 'או' : 'or'}</div>

            {/* Email / Password form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 4 }}>
              <input
                type="email"
                placeholder={T.emailLabel}
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={!agreed}
                style={{
                  padding: '9px 12px', borderRadius: 8, border: '1px solid var(--bd2)',
                  background: 'var(--s2)', color: 'var(--t1)', fontSize: '.88rem',
                  outline: 'none', opacity: agreed ? 1 : 0.45,
                }}
                onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
              />
              {mode !== 'reset' && (
                <input
                  type="password"
                  placeholder={T.passwordLabel}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={!agreed}
                  style={{
                    padding: '9px 12px', borderRadius: 8, border: '1px solid var(--bd2)',
                    background: 'var(--s2)', color: 'var(--t1)', fontSize: '.88rem',
                    outline: 'none', opacity: agreed ? 1 : 0.45,
                  }}
                  onKeyDown={e => e.key === 'Enter' && handleEmailAuth()}
                />
              )}

              {error && <div style={{ fontSize: '.78rem', color: 'var(--r)', padding: '4px 2px' }}>{error}</div>}
              {info  && <div style={{ fontSize: '.78rem', color: 'var(--g)', padding: '4px 2px' }}>{info}</div>}

              <button
                className="btn btn-primary"
                onClick={handleEmailAuth}
                disabled={!agreed || loading || !email.trim() || (mode !== 'reset' && !password.trim())}
                style={{ borderRadius: 8, padding: '9px', fontSize: '.9rem', opacity: agreed ? 1 : 0.45 }}
              >
                {loading ? '...' : mode === 'reset' ? T.forgotPassword : mode === 'signup' ? T.signUp : T.signIn}
              </button>
            </div>

            {/* Mode toggles */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.76rem', color: 'var(--t3)', marginTop: 6 }}>
              {mode === 'signin' && (
                <>
                  <button onClick={() => switchMode('reset')} style={{ background: 'none', border: 'none', color: 'var(--t3)', cursor: 'pointer', fontSize: '.76rem', padding: 0 }}>
                    {T.forgotPassword}
                  </button>
                  <button onClick={() => switchMode('signup')} style={{ background: 'none', border: 'none', color: 'var(--b)', cursor: 'pointer', fontSize: '.76rem', padding: 0 }}>
                    {T.noAccount} {T.signUp}
                  </button>
                </>
              )}
              {mode === 'signup' && (
                <button onClick={() => switchMode('signin')} style={{ background: 'none', border: 'none', color: 'var(--b)', cursor: 'pointer', fontSize: '.76rem', padding: 0, marginInlineStart: 'auto' }}>
                  {T.hasAccount} {T.signIn}
                </button>
              )}
              {mode === 'reset' && (
                <button onClick={() => switchMode('signin')} style={{ background: 'none', border: 'none', color: 'var(--b)', cursor: 'pointer', fontSize: '.76rem', padding: 0 }}>
                  ← {T.signIn}
                </button>
              )}
            </div>
          </>
        ) : (
          <div style={{ background: 'rgba(91,143,255,.08)', border: '1px solid rgba(91,143,255,.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: '.8rem', color: 'var(--t2)' }}>
            {isHe
              ? '⚡ מצב הדגמה פעיל — Supabase לא מוגדר.'
              : '⚡ Demo mode active — Supabase not configured.'}
          </div>
        )}

        <div className="auth-divider">{isHe ? 'או' : 'or'}</div>

        <button className="btn-demo" onClick={handleDemo} disabled={!agreed} style={{ opacity: agreed ? 1 : 0.45, cursor: agreed ? 'pointer' : 'not-allowed' }}>
          {T.demoMode}
        </button>

        <div style={{ marginTop: 24, borderTop: '1px solid var(--bd)', paddingTop: 18, fontSize: '.74rem', color: 'var(--t3)', textAlign: 'center', lineHeight: 1.7 }}>
          {isHe ? 'מסחר כרוך בסיכון. לא ייעוץ השקעות.' : 'Trading involves risk. Not investment advice.'}
        </div>
      </div>
    </div>
  );
}
