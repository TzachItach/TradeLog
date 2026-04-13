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

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: '#080b13',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10, background: '#4a7dff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="3,17 9,11 13,15 21,6" />
        </svg>
      </div>
      <div style={{ color: '#4a7dff', fontSize: '.9rem', fontWeight: 600, fontFamily: 'system-ui' }}>TradeLog</div>
      <div style={{ color: '#42475c', fontSize: '.78rem', fontFamily: 'system-ui' }}>מאמת...</div>
    </div>
  );
}

function AuthListener({ onReady }: { onReady: () => void }) {
  const { setUser, initRealUser } = useStore();
  const navigate = useNavigate();

  const handleSession = (supabaseUser: { id: string; email?: string; user_metadata?: Record<string, string> }) => {
    const appUser = {
      id: supabaseUser.id,
      email: supabaseUser.email ?? '',
      name: supabaseUser.user_metadata?.full_name ?? supabaseUser.email ?? 'User',
    };
    // מאתחל נתוני משתמש — שומר נתונים קיימים, מנקה demo
    initRealUser(supabaseUser.id);
    setUser(appUser);
    navigate('/dashboard', { replace: true });
  };

  useEffect(() => {
    if (DEMO_MODE || !supabase) { onReady(); return; }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) handleSession(session.user as Parameters<typeof handleSession>[0]);
      onReady();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleSession(session.user as Parameters<typeof handleSession>[0]);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}

function AppEffects() {
  const { lang, fontSize, highContrast, grayscale, readableFont, loadDemoData } = useStore();

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
    if (DEMO_MODE) loadDemoData();
  }, []);

  return null;
}

function ProtectedRoute({ children, ready }: { children: React.ReactNode; ready: boolean }) {
  const { user } = useStore();
  if (!DEMO_MODE && !ready) return <LoadingScreen />;
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
