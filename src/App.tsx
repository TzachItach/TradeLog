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

// מסך טעינה בזמן בדיקת session
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
      <div style={{ color: '#4a7dff', fontSize: '.9rem', fontWeight: 600, fontFamily: 'system-ui' }}>
        TradeLog
      </div>
      <div style={{ color: '#42475c', fontSize: '.78rem', fontFamily: 'system-ui' }}>
        מאמת...
      </div>
    </div>
  );
}

function AuthListener({ onReady }: { onReady: () => void }) {
  const { setUser } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    // מצב Demo — אין צורך בבדיקת session
    if (DEMO_MODE || !supabase) {
      onReady();
      return;
    }

    // בדיקה חד-פעמית של session קיים (לאחר OAuth redirect / רענון)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          name: session.user.user_metadata?.full_name ?? session.user.email ?? 'User',
        });
        navigate('/dashboard', { replace: true });
      }
      // סיימנו לבדוק — מותר לרנדר את הדף
      onReady();
    });

    // הקשב לשינויים עתידיים (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          name: session.user.user_metadata?.full_name ?? session.user.email ?? 'User',
        });
        navigate('/dashboard', { replace: true });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}

function AppEffects() {
  const { lang, fontSize, highContrast, grayscale, readableFont, loadDemoData, accounts } = useStore();

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}%`;
  }, [fontSize]);

  useEffect(() => {
    document.body.style.filter = grayscale
      ? 'grayscale(100%)'
      : highContrast
      ? 'contrast(160%)'
      : '';
  }, [grayscale, highContrast]);

  useEffect(() => {
    document.documentElement.classList.toggle('readable-font', readableFont);
  }, [readableFont]);

  useEffect(() => {
    if (DEMO_MODE && accounts.length === 0) {
      loadDemoData();
    }
  }, []);

  return null;
}

function ProtectedRoute({ children, ready }: { children: React.ReactNode; ready: boolean }) {
  const { user } = useStore();

  // עדיין בודק session — אל תפנה לשום מקום
  if (!DEMO_MODE && !ready) return <LoadingScreen />;

  // בדיקה הסתיימה — אין משתמש
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
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute ready={authReady}>
              <Layout />
            </ProtectedRoute>
          }
        >
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
