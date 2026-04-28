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
import RiskDisclosure from './pages/RiskDisclosure';
import Guides from './pages/Guides';
import PropFirm from './pages/PropFirm';
import BusinessManager from './pages/BusinessManager';
import Landing from './pages/Landing';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import ProductTour from './components/ProductTour';

/* מסך טעינה קצר — רק לבדיקת session ראשונית */
function SplashScreen() {
  return (
    <div style={{
      minHeight: '100vh', background: '#121212',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16,
    }}>
      <img src="/logo.png?v=2" alt="TraderYo" style={{ width: 220, height: 'auto', objectFit: 'contain' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,.10)', borderTopColor: '#1DB954', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
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
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (DEMO_MODE) loadDemoData();
  }, []);

  return null;
}

const WHOP_CHECKOUT = 'https://whop.com/checkout/plan_VZiIXyiKbr7Pr';

function PaywallScreen({ email }: { email?: string }) {
  const url = email ? `${WHOP_CHECKOUT}?email=${encodeURIComponent(email)}` : WHOP_CHECKOUT;
  return (
    <div style={{
      minHeight: '100vh', background: '#121212',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 24, padding: '0 24px', textAlign: 'center',
    }}>
      <img src="/logo.png?v=2" alt="TraderYo" style={{ width: 80, objectFit: 'contain', borderRadius: 16 }} />
      <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
        קבל גישה מלאה ל-TraderYo
      </h2>
      <p style={{ color: '#b3b3b3', maxWidth: 360, margin: 0, lineHeight: 1.6 }}>
        7 ימי ניסיון חינם, ללא התחייבות. כל הנתונים שלך שמורים ומחכים לך.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          background: '#1DB954', color: '#000', fontWeight: 700,
          padding: '14px 36px', borderRadius: 999, textDecoration: 'none',
          fontSize: '1rem',
        }}
      >
        התחל ניסיון חינם — 7 ימים
      </a>
      <p style={{ color: '#737373', fontSize: '0.78rem', margin: 0 }}>
        $21.99/חודש לאחר הניסיון · אחרי ההרשמה, רענן את הדף
      </p>
    </div>
  );
}

/* רץ פעם אחת בכניסה — מסנכרן ברוקרים ברקע, בשקט */
function BackgroundSync() {
  const { user, reloadFromCloud } = useStore();
  const syncedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user || user.id === 'demo' || !supabase || syncedFor.current === user.id) return;
    syncedFor.current = user.id;

    const run = async () => {
      const { data: { session } } = await supabase!.auth.getSession();
      const jwt = session?.access_token;
      if (!jwt) return;

      const { data: connections } = await supabase!
        .from('broker_connections')
        .select('broker')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (!connections?.length) return;

      const brokers = new Set(connections.map((c: { broker: string }) => c.broker));
      const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string;
      const anonKey    = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string;

      const syncs: Promise<void>[] = [];

      if (brokers.has('tradovate')) {
        syncs.push(
          fetch('/api/tradovate-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
            body: JSON.stringify({ user_id: user.id }),
          }).then(() => {}).catch(() => {})
        );
      }

      if (brokers.has('topstepx')) {
        syncs.push(
          fetch(`${supabaseUrl}/functions/v1/topstepx-sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey: anonKey, Authorization: `Bearer ${jwt}` },
            body: JSON.stringify({ user_id: user.id }),
          }).then(() => {}).catch(() => {})
        );
      }

      if (syncs.length) {
        await Promise.all(syncs);
        reloadFromCloud();
      }
    };

    // מחכה שהטעינה הראשונית תסתיים לפני הסנכרון
    const timer = setTimeout(run, 3000);
    return () => clearTimeout(timer);
  }, [user?.id]);

  return null;
}

function ProtectedRoute({ children, ready, hasUser }: { children: React.ReactNode; ready: boolean; hasUser: boolean }) {
  const { user, subscriptionStatus, onboardingDone, setOnboardingDone } = useStore();
  const isLoggedIn = hasUser || !!user;

  // עדיין בודק session — הצג splash קצר
  if (!DEMO_MODE && !ready) return <SplashScreen />;

  // אין משתמש — עבור להתחברות
  if (!DEMO_MODE && !isLoggedIn) return <Navigate to="/auth" replace />;

  // מנוי פג — הצג paywall (null = טוען עדיין, לא חוסמים)
  if (!DEMO_MODE && subscriptionStatus === 'expired') {
    return <PaywallScreen email={user?.email} />;
  }

  // יש משתמש — פתח מיד (נתונים יטענו ברקע)
  return (
    <>
      {children}
      {!DEMO_MODE && isLoggedIn && !onboardingDone && (
        <ProductTour onDone={setOnboardingDone} />
      )}
    </>
  );
}

export default function App() {
  const [ready, setReady] = useState(DEMO_MODE);
  const [hasUser, setHasUser] = useState(false);

  return (
    <BrowserRouter>
      <AppEffects />
      <AuthListener onReady={(u) => { setReady(true); setHasUser(u); }} />
      <BackgroundSync />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/accessibility" element={<Accessibility />} />
        <Route path="/risk-disclosure" element={<RiskDisclosure />} />
        <Route path="/guides" element={<Guides />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
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
          <Route path="business" element={<BusinessManager />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
