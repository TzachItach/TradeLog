import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useStore } from './store';
import { supabase, DEMO_MODE } from './lib/supabase';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TradesList from './pages/TradesList';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import Accessibility from './pages/Accessibility';
import PropFirm from './pages/PropFirm';
import Landing from './pages/Landing';

/* מסך טעינה קצר — רק לבדיקת session ראשונית */
function SplashScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: '#060910',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 14,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#5b8fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="3,17 9,11 13,15 21,6" />
        </svg>
      </div>
      <div style={{ color: '#5b8fff', fontSize: '.9rem', fontWeight: 700, fontFamily: 'system-ui' }}>TradeLog</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 18, height: 18, border: '2px solid #222840', borderTopColor: '#5b8fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
}

function AuthListener({ onReady }: { onReady: (hasUser: boolean) => void }) {
  const { setUser, loadDataInBackground } = useStore();
  const navigate = useNavigate();
  const handledRef = useRef(false);

  const handleUser = (u: { id: string; email?: string; user_metadata?: Record<string, string> }) => {
    if (handledRef.current) return;
    handledRef.current = true;

    const name = u.user_metadata?.full_name ?? u.email ?? 'User';
    const email = u.email ?? '';

    // 1. עדכן user מיד — פתח את האפליקציה
    setUser({ id: u.id, name, email });
    onReady(true);
    navigate('/dashboard', { replace: true });

    // 2. טען נתונים מ-Supabase ברקע — בלי לחסום
    loadDataInBackground(u.id, name, email);
  };

  useEffect(() => {
    if (DEMO_MODE || !supabase) { onReady(false); return; }

    // timeout קצר — 3 שניות לבדיקת session בלבד
    const timer = setTimeout(() => { onReady(false); }, 3000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(timer);
      if (session?.user) {
        handleUser(session.user as Parameters<typeof handleUser>[0]);
      } else {
        onReady(false);
      }
    }).catch(() => { clearTimeout(timer); onReady(false); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        clearTimeout(timer);
        handleUser(session.user as Parameters<typeof handleUser>[0]);
        onReady(true);
      } else {
        handledRef.current = false;
        setUser(null);
        onReady(false);
      }
    });

    return () => { clearTimeout(timer); subscription.unsubscribe(); };
  }, []);

  return null;
}

function AppEffects() {
  const { lang, fontSize, highContrast, grayscale, readableFont, loadDemoData, darkMode } = useStore();

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => { document.documentElement.style.fontSize = `${fontSize}%`; }, [fontSize]);

  useEffect(() => {
    document.body.style.filter = grayscale ? 'grayscale(100%)' : highContrast ? 'contrast(160%)' : '';
  }, [grayscale, highContrast]);

  useEffect(() => {
    document.documentElement.classList.toggle('readable-font', readableFont);
  }, [readableFont]);

  useEffect(() => {
    document.body.classList.toggle('light', !darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (DEMO_MODE) loadDemoData();
  }, []);

  return null;
}

function ProtectedRoute({ children, ready, hasUser }: { children: React.ReactNode; ready: boolean; hasUser: boolean }) {
  const { user } = useStore();
  const isLoggedIn = hasUser || !!user;

  // עדיין בודק session — הצג splash קצר
  if (!DEMO_MODE && !ready) return <SplashScreen />;

  // אין משתמש — עבור להתחברות
  if (!DEMO_MODE && !isLoggedIn) return <Navigate to="/auth" replace />;

  // יש משתמש — פתח מיד (נתונים יטענו ברקע)
  return <>{children}</>;
}

export default function App() {
  const [ready, setReady] = useState(DEMO_MODE);
  const [hasUser, setHasUser] = useState(false);

  return (
    <BrowserRouter>
      <AppEffects />
      <AuthListener onReady={(u) => { setReady(true); setHasUser(u); }} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/accessibility" element={<Accessibility />} />
        <Route path="/dashboard/*" element={
          <ProtectedRoute ready={ready} hasUser={hasUser}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="trades" element={<TradesList />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reports" element={<Reports />} />
          <Route path="propfirm" element={<PropFirm />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
