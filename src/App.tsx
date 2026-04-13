import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';
import { DEMO_MODE } from './lib/supabase';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TradesList from './pages/TradesList';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';

function AppEffects() {
  const { lang, fontSize, highContrast, grayscale, readableFont, loadDemoData, isDemo, accounts } = useStore();

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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useStore();
  if (!DEMO_MODE && !user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppEffects />
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
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
