import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useStore } from './store';
import { supabase, DEMO_MODE } from './lib/supabase';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TradesList from './pages/TradesList';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

function LoadingScreen({ text }: { text?: string }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#060910',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#5b8fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="3,17 9,11 13,15 21,6" />
        </svg>
      </div>
      <div style={{ color: '#5b8fff', fontSize: '.9rem', fontWeight: 600, fontFamily: 'system-ui' }}>TradeLog</div>
      <div style={{ color: '#545e80', fontSize: '.78rem', fontFamily: 'system-ui' }}>{text ?? 'מאמת...'}</div>
      {/* Spinner */}
      <div style={{
        width: 20, height: 20, border: '2px solid #222840',
        borderTopColor: '#5b8fff', borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function AuthListener({ onReady }: { onReady: () => void }) {
  const { initRealUser, setUser } = useStore();
  const navigate = useNavigate();

  const handleUser = async (u: { id: string; email?: string; user_metadata?: Record<string, string> }) => {
    const name = u.user_metadata?.full_name ?? u.email ?? 'User';
    const email = u.email ?? '';
    // initRealUser הוא async — טוען מ-Supabase
    await initRealUser(u.id, name, email);
    navigate('/dashboard', { replace: true });
  };

  useEffect(() => {
    if (DEMO_MODE || !supabase) { onReady(); return; }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await handleUser(session.user as Parameters<typeof handleUser>[0]);
      }
      onReady();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await handleUser(session.user as Parameters<typeof handleUser>[0]);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
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

function ProtectedRoute({ children, ready }: { children: React.ReactNode; ready: boolean }) {
  const { user, dataLoading } = useStore();

  if (!DEMO_MODE && !ready) return <LoadingScreen text="מאמת..." />;
  if (!DEMO_MODE && dataLoading) return <LoadingScreen text="טוען נתונים..." />;
  if (!DEMO_MODE && !user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default function App() {
  const [authReady, setAuthReady] = useState(DEMO_MODE);

  return (
    <BrowserRouter>
      <AppEffects />
      <AuthListener onReady={() => setAuthReady(true)} />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/dashboard/*" element={
          <ProtectedRoute ready={authReady}>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="trades" element={<TradesList />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
