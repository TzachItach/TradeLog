import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import TradeModal from './TradeModal';
import { useStore } from '../store';

function AppFooter({ lang }: { lang: 'he' | 'en' }) {
  return (
    <footer style={{
      borderTop: '1px solid var(--bd)',
      padding: '10px 20px',
      fontSize: '.72rem',
      color: 'var(--t3)',
      display: 'flex',
      justifyContent: 'center',
      gap: 16,
      flexWrap: 'wrap',
      background: 'var(--s1)',
    }}>
      <Link to="/terms" style={{ color: 'var(--t3)', textDecoration: 'none' }}>
        {lang === 'he' ? 'תנאי שימוש' : 'Terms of Use'}
      </Link>
      <Link to="/privacy" style={{ color: 'var(--t3)', textDecoration: 'none' }}>
        {lang === 'he' ? 'מדיניות פרטיות' : 'Privacy Policy'}
      </Link>
      <Link to="/accessibility" style={{ color: 'var(--t3)', textDecoration: 'none' }}>
        {lang === 'he' ? 'הצהרת נגישות' : 'Accessibility'}
      </Link>
      <span>© {new Date().getFullYear()} TradeLog</span>
    </footer>
  );
}

export default function Layout() {
  const { modal, lang } = useStore();

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <Header />
        <Outlet />
        <AppFooter lang={lang} />
      </div>
      {modal && <TradeModal />}
      <BottomNav />
    </div>
  );
}
